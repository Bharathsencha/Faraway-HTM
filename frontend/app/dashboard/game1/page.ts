'use client'

import { createElement, useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
  RotateCcw,
  Volume2,
  Loader2,
  Mic,
  MicOff,
  AlertTriangle,
  Trophy,
  Sparkles,
  ChevronRight,
  Send
} from 'lucide-react'

import { useTheme } from '@/app/theme-provider'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/auth'
import BadgeEarnedOverlay from '@/components/BadgeEarnedOverlay'

const INTRO_DURATION_MS = 10000

interface Question {
  id: number
  text: string
}

interface Answer {
  segmentId: number
  transcript: string
  fillerWordCount: number
}

interface ISpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string; message?: string }) => void) | null
  onresult: ((event: {
    resultIndex: number
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string
        }
        isFinal: boolean
      }
      length: number
    }
  }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function countFillerWords(text: string): number {
  if (!text) return 0
  const words = text.toLowerCase().split(/\s+/)
  const fillers = ['um', 'uh', 'like', 'so', 'actually', 'basically']
  let count = 0
  words.forEach(w => {
    const cleanWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    if (fillers.includes(cleanWord)) {
      count++
    }
  })
  return count
}

function buildFocusAreas(totalFillerWords: number, avgLength: number, validAnswersCount: number, verdict: 'reject' | 'borderline' | 'clear'): string[] {
  const areas = new Set<string>()

  if (totalFillerWords > 12) areas.add('communication')
  if (avgLength < 120) areas.add('answer-depth')
  if (avgLength < 90) areas.add('structure')
  if (validAnswersCount < 5) areas.add('completeness')
  if (verdict === 'clear' && areas.size === 0) areas.add('advanced-consistency')

  return Array.from(areas)
}

export default function Game1Page() {
  const router = useRouter()
  const { theme } = useTheme()
  const [showIntro, setShowIntro] = useState<boolean>(true)
  const [introProgress, setIntroProgress] = useState<number>(0)

  // Game Phases: 'setup' | 'gameplay' | 'post-session'
  const [phase, setPhase] = useState<'setup' | 'gameplay' | 'post-session'>('setup')
  const [loading, setLoading] = useState<boolean>(false)

  // Setup Screen States
  const [companyName, setCompanyName] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [resumeFileName, setResumeFileName] = useState<string>('')
  const [resumeText, setResumeText] = useState<string>('')
  const [uploadError, setUploadError] = useState<string>('')

  // Game/Session State
  const [sessionId, setSessionId] = useState<string>('')
  const [questionBank, setQuestionBank] = useState<Question[]>([])
  const [interviewerPersona, setInterviewerPersona] = useState<string>('Amazon Bar Raiser')
  const [estimatedReadiness, setEstimatedReadiness] = useState<number>(41)

  // Gameplay Screen States
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0)
  const [segmentStatus, setSegmentStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>([
    'unlocked', 'locked', 'locked', 'locked', 'locked'
  ])

  // Timers
  const [prepTimeLeft, setPrepTimeLeft] = useState<number>(15)
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number>(60)
  const [isPrepping, setIsPrepping] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)

  // Speech-to-Text States
  const [currentAnswerText, setCurrentAnswerText] = useState<string>('')
  const [speechError, setSpeechError] = useState<string>('')
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false)
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null)

  // Answers list
  const [answers, setAnswers] = useState<Answer[]>([])

  // Post Session States
  const [verdict, setVerdict] = useState<'reject' | 'borderline' | 'clear' | null>(null)
  const [verdictLetter, setVerdictLetter] = useState<string>('')
  const [finalReadinessScore, setFinalReadinessScore] = useState<number>(0)
  const [animatedScore, setAnimatedScore] = useState<number>(0)
  const [xpAwarded, setXpAwarded] = useState<number | null>(null)
  const [badgesEarned, setBadgesEarned] = useState<Array<{ name: string; icon: string; description: string }>>([])

  // Refs for Timers
  const prepIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const answerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const speechRecognitionActiveRef = useRef<boolean>(false)
  const speechRecognitionStartingRef = useRef<boolean>(false)

  useEffect(() => {
    const startedAt = Date.now()
    const timer = setTimeout(() => {
      setIntroProgress(100)
      setShowIntro(false)
    }, INTRO_DURATION_MS)
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      setIntroProgress(Math.min(100, Math.floor((elapsed / INTRO_DURATION_MS) * 100)))
    }, 80)

    return () => {
      clearTimeout(timer)
      clearInterval(progressTimer)
    }
  }, [])

  // Load Speech Recognition support client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        setIsSpeechSupported(true)
        const rec = new SpeechRecognitionClass() as ISpeechRecognition
        rec.continuous = true
        rec.interimResults = true
        rec.lang = 'en-US'
        setRecognition(rec)
      }
    }
  }, [])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current)
      if (answerIntervalRef.current) clearInterval(answerIntervalRef.current)
      if (recognition) {
        try {
          recognition.abort()
        } catch {}
      }
    }
  }, [recognition])

  // Live calculated filler word count
  const liveFillerWordCount = useMemo(() => {
    return countFillerWords(currentAnswerText)
  }, [currentAnswerText])

  // Theme styling tokens
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      background: isDark
        ? 'radial-gradient(circle at top left, rgba(255, 106, 42, 0.2), transparent 30%), linear-gradient(135deg, #140f0b 0%, #1d1712 52%, #120d0a 100%)'
        : 'radial-gradient(circle at top left, rgba(255, 142, 82, 0.18), transparent 30%), linear-gradient(135deg, #fffaf3 0%, #fff4ea 50%, #ffe6cf 100%)',
      panel: isDark ? 'rgba(42, 32, 24, 0.78)' : 'rgba(255, 250, 244, 0.82)',
      panelStrong: isDark ? '#2a2018' : '#fffaf4',
      soft: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 106, 42, 0.08)',
      border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 111, 81, 0.16)',
      text: isDark ? '#f5f0e8' : '#241710',
      muted: isDark ? '#d3c8bc' : '#6e6257',
      subtle: isDark ? '#a99c90' : '#8b7a6b',
      primary: '#ff4f00',
      primarySoft: isDark ? 'rgba(255, 106, 42, 0.14)' : 'rgba(255, 106, 42, 0.12)',
    }
  }, [theme])

  // Clear all active timers safely
  const stopAllTimers = () => {
    if (prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current)
      prepIntervalRef.current = null
    }
    if (answerIntervalRef.current) {
      clearInterval(answerIntervalRef.current)
      answerIntervalRef.current = null
    }
    setIsPrepping(false)
    setIsRecording(false)
  }

  const stopSpeechRecognition = () => {
    speechRecognitionActiveRef.current = false
    speechRecognitionStartingRef.current = false

    if (!recognition) return

    try {
      recognition.stop()
    } catch {}
  }

  // Handle Resume File Upload (accept .pdf, .docx only)
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx') {
      setUploadError('Only .pdf and .docx files are allowed.')
      setResumeFileName('')
      setResumeText('')
      return
    }

    setUploadError('')
    setResumeFileName(file.name)

    // Parse mock text
    const reader = new FileReader()
    reader.onload = () => {
      const simulatedText = `Simulated Resume Content of ${file.name}. Experience details: Software Developer with background in React, Next.js, Node.js, and technical problem solving.`
      setResumeText(simulatedText)
    }
    reader.readAsArrayBuffer(file)
  }

  // Setup Form Submission
  const handleStartPrep = async () => {
    if (!companyName.trim() || !role.trim() || !resumeText) return

    setLoading(true)
    try {
      const res = await fetch('/api/game1/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          role: role.trim(),
          resumeText
        })
      })

      if (!res.ok) {
        throw new Error('Failed to initialize session')
      }

      const data = await res.json()
      setSessionId(data.sessionId)
      setQuestionBank(data.questionBank)
      setInterviewerPersona(data.interviewerPersona)
      setEstimatedReadiness(data.estimatedReadiness)

      // Transition to gameplay
      setPhase('gameplay')
      setActiveSegmentIndex(0)
      setSegmentStatus(['unlocked', 'locked', 'locked', 'locked', 'locked'])
      setAnswers([])
      triggerPrepTimer(0) // Start prep timer for Segment 1
    } catch (err) {
      console.error(err)
      alert('An error occurred while initializing the session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger Prep Stage
  const triggerPrepTimer = (segmentIndex: number) => {
    stopAllTimers()
    stopSpeechRecognition()
    setIsPrepping(true)
    setPrepTimeLeft(15)
    setCurrentAnswerText('')

    prepIntervalRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepIntervalRef.current!)
          prepIntervalRef.current = null
          // Automatically trigger response/recording stage
          triggerResponseStage()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Trigger Response Stage
  const triggerResponseStage = () => {
    stopAllTimers()
    setIsRecording(true)
    setAnswerTimeLeft(60)

    // Start speech recognition if supported
    if (recognition) {
      try {
        recognition.onstart = () => {
          speechRecognitionActiveRef.current = true
          speechRecognitionStartingRef.current = false
          setSpeechError('')
        }
        recognition.onresult = (event) => {
          let currentText = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentText += event.results[i][0].transcript
          }
          if (currentText) {
            setCurrentAnswerText(currentText)
          }
        }
        recognition.onerror = (event) => {
          speechRecognitionActiveRef.current = false
          speechRecognitionStartingRef.current = false
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission blocked. Please type in your answer fallback below.')
          } else if (event.error === 'network') {
            setSpeechError('Speech recognition service is unavailable right now. You can still type your answer manually.')
          } else {
            setSpeechError(`Speech error: ${event.error}. You can still type manually.`)
          }
        }
        recognition.onend = () => {
          speechRecognitionActiveRef.current = false
          speechRecognitionStartingRef.current = false
        }

        if (!speechRecognitionActiveRef.current && !speechRecognitionStartingRef.current) {
          speechRecognitionStartingRef.current = true
          recognition.start()
        }
      } catch (err) {
        speechRecognitionStartingRef.current = false
        if (err instanceof DOMException && err.name === 'InvalidStateError') {
          speechRecognitionActiveRef.current = true
        } else {
          setSpeechError('Speech recognition could not start. You can still type your answer manually.')
        }
      }
    } else {
      setSpeechError('Web Speech API is not supported in this browser. Please type your answer manually.')
    }

    answerIntervalRef.current = setInterval(() => {
      setAnswerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(answerIntervalRef.current!)
          answerIntervalRef.current = null
          // Stop recording automatically at 0
          handleStopRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Stop Recording manually or automatically
  const handleStopRecording = () => {
    if (answerIntervalRef.current) {
      clearInterval(answerIntervalRef.current)
      answerIntervalRef.current = null
    }

    setIsRecording(false)
    stopSpeechRecognition()
  }

  // Save current segment answer
  const handleSaveAnswer = () => {
    const currentQuestion = questionBank[activeSegmentIndex]
    const updatedAnswers = [...answers]
    const existingIdx = updatedAnswers.findIndex(a => a.segmentId === currentQuestion.id)

    const newAnswer: Answer = {
      segmentId: currentQuestion.id,
      transcript: currentAnswerText,
      fillerWordCount: liveFillerWordCount
    }

    if (existingIdx > -1) {
      updatedAnswers[existingIdx] = newAnswer
    } else {
      updatedAnswers.push(newAnswer)
    }
    setAnswers(updatedAnswers)

    const updatedStatus = [...segmentStatus]
    updatedStatus[activeSegmentIndex] = 'completed'

    if (activeSegmentIndex < 4) {
      updatedStatus[activeSegmentIndex + 1] = 'unlocked'
      setSegmentStatus(updatedStatus)
      setActiveSegmentIndex(activeSegmentIndex + 1)
      setCurrentAnswerText('')
      // Automatically trigger next segment prep
      triggerPrepTimer(activeSegmentIndex + 1)
    } else {
      setSegmentStatus(updatedStatus)
    }
  }

  // Submit whole interview
  const handleSubmitSession = async () => {
    // Stop recording if active
    stopAllTimers()
    stopSpeechRecognition()

    setLoading(true)
    try {
      let totalFillerWords = 0
      let totalLength = 0
      let validAnswersCount = 0

      answers.forEach((ans) => {
        totalFillerWords += ans.fillerWordCount || 0
        if (ans.transcript && ans.transcript.trim()) {
          totalLength += ans.transcript.trim().length
          validAnswersCount += 1
        }
      })

      const avgLength = validAnswersCount > 0 ? totalLength / validAnswersCount : 0

      const res = await fetch('/api/game1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers
        })
      })

      if (!res.ok) {
        throw new Error('Failed to submit session')
      }

      const data = await res.json()
      setVerdict(data.verdict)
      setVerdictLetter(data.verdictLetter)
      setFinalReadinessScore(data.finalReadinessScore)

      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const activityResult = await apiRequest<{ xpAwarded: number; badgesEarned: Array<{ name: string; icon: string; description: string }> }>('/api/dashboard/activity', {
            method: 'POST',
            token,
            suppressErrors: true,
            body: {
              gameKey: 'game1',
              title: 'Coffee with Interview Arena',
              score: data.finalReadinessScore,
              pointsAwarded: data.finalReadinessScore,
              summary: data.verdictLetter?.split('\n').slice(0, 3).join(' ') || 'Interview prep completed.',
              focusAreas: buildFocusAreas(totalFillerWords, avgLength, validAnswersCount, data.verdict),
              gameplayMetadata: {
                iron_nerve_complete: true,
                zero_fillers_opening: answers.find(a => a.segmentId === 1)?.fillerWordCount === 0,
                passed_resume_dive: answers.some(a => a.segmentId === 2 && a.transcript.trim().length > 0),
                verdict: data.verdict === 'clear' ? 'Clear' : data.verdict === 'borderline' ? 'Borderline' : 'Reject'
              }
            },
          })
          if (activityResult) {
            setXpAwarded(activityResult.xpAwarded)
            if (activityResult.badgesEarned && activityResult.badgesEarned.length > 0) {
              setBadgesEarned(activityResult.badgesEarned)
            }
          }
        } catch (activityError) {
          console.error('Failed to record game1 progress:', activityError)
        }
      }

      // Move to post-session
      setPhase('post-session')

      // Animate score count-up
      let start = 0
      const duration = 1500
      const stepTime = Math.abs(Math.floor(duration / data.finalReadinessScore))
      const timer = setInterval(() => {
        start += 1
        setAnimatedScore(start)
        if (start >= data.finalReadinessScore) {
          clearInterval(timer)
        }
      }, Math.max(15, stepTime))
    } catch (err) {
      console.error(err)
      alert('An error occurred during submission. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Segment Selection from Timeline Navigation
  const handleSelectSegment = (idx: number) => {
    if (segmentStatus[idx] === 'locked') return

    // Save active response if recording was run
    if (isRecording) {
      handleStopRecording()
    }
    stopAllTimers()

    setActiveSegmentIndex(idx)
    // Check if previously completed to restore answer text
    const questionId = questionBank[idx].id
    const prevAnswer = answers.find(a => a.segmentId === questionId)
    if (prevAnswer) {
      setCurrentAnswerText(prevAnswer.transcript)
    } else {
      setCurrentAnswerText('')
      triggerPrepTimer(idx)
    }
  }

  // Reset Game and Play Again
  const handlePlayAgain = () => {
    stopAllTimers()
    setCompanyName('')
    setRole('')
    setResumeFileName('')
    setResumeText('')
    setUploadError('')
    setSessionId('')
    setQuestionBank([])
    setAnswers([])
    setVerdict(null)
    setVerdictLetter('')
    setFinalReadinessScore(0)
    setAnimatedScore(0)
    setXpAwarded(null)
    setBadgesEarned([])
    setPhase('setup')
  }

  // RENDER PHASE 1: SETUP
  const renderSetup = () => {
    const isFormValid = companyName.trim() && role.trim() && resumeText

    return createElement('div', { className: 'space-y-6' },
      createElement('section', { className: 'overflow-hidden rounded-[1.5rem] border p-6 backdrop-blur-xl lg:p-8', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement('div', { className: 'max-w-xl mx-auto space-y-6' },
          createElement('div', { className: 'text-center' },
            createElement('div', { className: 'mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold', style: { backgroundColor: colors.primarySoft, color: colors.primary } },
              createElement(Sparkles, { size: 16 }),
              createElement('span', null, 'Segment Setup')
            ),
            createElement('h2', { className: 'text-3xl font-semibold leading-tight', style: { color: colors.text } }, 'Preparation Details'),
            createElement('p', { className: 'mt-2 text-sm', style: { color: colors.muted } }, 'Configure your session. Both inputs and resume file upload are required.')
          ),

          // Inputs
          createElement('div', { className: 'space-y-4 pt-4' },
            createElement('div', null,
              createElement('label', { className: 'block text-xs font-semibold uppercase tracking-wider mb-2', style: { color: colors.subtle } }, 'Target Company Name'),
              createElement('input', {
                type: 'text',
                value: companyName,
                onChange: (e) => setCompanyName((e.target as HTMLInputElement).value),
                placeholder: 'e.g. Amazon',
                className: 'h-11 w-full rounded-[0.9rem] border px-4 text-sm outline-none bg-transparent',
                style: { borderColor: colors.border, color: colors.text }
              })
            ),
            createElement('div', null,
              createElement('label', { className: 'block text-xs font-semibold uppercase tracking-wider mb-2', style: { color: colors.subtle } }, 'Target Role'),
              createElement('input', {
                type: 'text',
                value: role,
                onChange: (e) => setRole((e.target as HTMLInputElement).value),
                placeholder: 'e.g. SDE-1',
                className: 'h-11 w-full rounded-[0.9rem] border px-4 text-sm outline-none bg-transparent',
                style: { borderColor: colors.border, color: colors.text }
              })
            ),

            // File Upload
            createElement('div', null,
              createElement('label', { className: 'block text-xs font-semibold uppercase tracking-wider mb-2', style: { color: colors.subtle } }, 'Resume (.pdf or .docx)'),
              createElement('div', { className: 'relative flex items-center justify-between rounded-[0.9rem] border p-4', style: { borderColor: colors.border, backgroundColor: colors.soft } },
                createElement('input', {
                  type: 'file',
                  id: 'resume-upload',
                  accept: '.pdf,.docx',
                  onChange: handleResumeUpload,
                  className: 'hidden'
                }),
                createElement('label', {
                  htmlFor: 'resume-upload',
                  className: 'cursor-pointer inline-flex h-9 items-center justify-center rounded-[0.8rem] px-4 text-xs font-semibold transition-colors bg-orange-600 hover:bg-orange-700 text-white'
                }, 'Upload Resume'),
                resumeFileName
                  ? createElement('div', { className: 'flex items-center gap-2 text-sm text-green-500 font-semibold' },
                      createElement(CheckCircle2, { size: 18 }),
                      createElement('span', { className: 'max-w-[150px] truncate' }, resumeFileName)
                    )
                  : createElement('span', { className: 'text-xs', style: { color: colors.muted } }, 'No file chosen')
              ),
              uploadError && createElement('p', { className: 'mt-2 text-xs text-red-500 flex items-center gap-1' },
                createElement(AlertCircle, { size: 14 }),
                uploadError
              )
            )
          ),

          // CTA Action
          createElement('div', { className: 'pt-6' },
            createElement(Button, {
              onClick: handleStartPrep,
              disabled: !isFormValid || loading,
              className: 'h-12 w-full rounded-[0.9rem] text-sm font-semibold flex items-center justify-center gap-2',
              style: { backgroundColor: isFormValid ? colors.primary : colors.soft, color: isFormValid ? '#fffefb' : colors.subtle }
            },
              loading
                ? createElement(Loader2, { className: 'animate-spin', size: 18 })
                : createElement(Play, { size: 18 }),
              'Start Prep'
            )
          )
        )
      )
    )
  }

  // RENDER PHASE 2: GAMEPLAY
  const renderGameplay = () => {
    if (questionBank.length === 0) return null

    const currentQuestion = questionBank[activeSegmentIndex]
    const isSegmentCompleted = segmentStatus[activeSegmentIndex] === 'completed'
    const hasRecordedAnything = currentAnswerText.trim().length > 0

    return createElement('div', { className: 'grid gap-6 lg:grid-cols-[250px_1fr]' },
      // Left Navigation Timeline
      createElement('aside', { className: 'space-y-3' },
        questionBank.map((q, idx) => {
          const status = segmentStatus[idx]
          const isActive = idx === activeSegmentIndex
          const isCompleted = status === 'completed'
          const isLocked = status === 'locked'

          return createElement('button', {
            key: q.id,
            disabled: isLocked,
            onClick: () => handleSelectSegment(idx),
            className: 'w-full text-left p-4 rounded-[1rem] border transition-all flex items-center justify-between',
            style: {
              backgroundColor: isActive ? colors.primarySoft : colors.panel,
              borderColor: isActive ? colors.primary : colors.border,
              opacity: isLocked ? 0.45 : 1,
              cursor: isLocked ? 'not-allowed' : 'pointer'
            }
          },
            createElement('div', { className: 'flex flex-col' },
              createElement('span', { className: 'text-xs font-semibold', style: { color: isActive ? colors.primary : colors.subtle } }, `Segment ${idx + 1}`),
              createElement('span', { className: 'text-sm font-medium mt-1 truncate max-w-[150px]', style: { color: colors.text } }, isCompleted ? 'Answered' : 'Pending')
            ),
            isCompleted && createElement(CheckCircle2, { size: 18, className: 'text-green-500' })
          )
        }),

        // Submission summary button
        createElement('div', { className: 'pt-4' },
          createElement(Button, {
            onClick: handleSubmitSession,
            disabled: answers.length < 5 || loading,
            className: 'w-full h-11 rounded-[0.9rem] flex items-center justify-center gap-2',
            style: {
              backgroundColor: answers.length === 5 ? '#ff4f00' : colors.soft,
              color: answers.length === 5 ? '#fffefb' : colors.subtle
            }
          },
            loading
              ? createElement(Loader2, { className: 'animate-spin', size: 18 })
              : createElement(Send, { size: 18 }),
            'Submit Session'
          ),
          createElement('p', { className: 'text-[11px] text-center mt-2', style: { color: colors.muted } },
            `Completed: ${answers.length}/5 segments`
          )
        )
      ),

      // Main Gameplay Panel
      createElement('section', { className: 'space-y-6' },
        createElement('div', { className: 'rounded-[1.5rem] border p-6 backdrop-blur-xl', style: { backgroundColor: colors.panel, borderColor: colors.border } },
          // Header info
          createElement('div', { className: 'flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4', style: { borderColor: colors.border } },
            createElement('div', { className: 'flex items-center gap-3' },
              // Estimated readiness badge replacement
              createElement('div', { className: 'rounded-full px-3 py-1 text-xs font-semibold', style: { backgroundColor: colors.primarySoft, color: colors.primary } },
                `Readiness Score: ${estimatedReadiness}/100`
              ),
              // Interviewer persona replacement
              createElement('div', { className: 'rounded-full px-3 py-1 text-xs font-semibold', style: { backgroundColor: colors.soft, color: colors.muted } },
                interviewerPersona
              )
            ),
            // Notification question count replacement
            createElement('span', { className: 'text-xs font-semibold', style: { color: colors.subtle } },
              `${questionBank.length} questions loaded`
            )
          ),

          // Question Pane
          createElement('div', { className: 'mb-6 p-4 rounded-[1rem]', style: { backgroundColor: colors.soft } },
            createElement('p', { className: 'text-xs font-semibold uppercase tracking-wider', style: { color: colors.primary } }, 'Interviewer Question'),
            createElement('p', { className: 'mt-2 text-base font-semibold leading-relaxed', style: { color: colors.text } }, currentQuestion.text)
          ),

          // Timers and Recording Panel
          createElement('div', { className: 'grid gap-6 md:grid-cols-[150px_1fr]' },
            // Timer Display
            createElement('div', { className: 'flex flex-col items-center justify-center border rounded-[1rem] p-4 text-center', style: { borderColor: colors.border, backgroundColor: colors.soft } },
              isPrepping && createElement('div', null,
                createElement('p', { className: 'text-xs font-semibold', style: { color: colors.subtle } }, 'Prep Time'),
                createElement('p', { className: 'text-3xl font-bold mt-1 text-orange-400' }, `${prepTimeLeft}s`)
              ),
              isRecording && createElement('div', null,
                createElement('p', { className: 'text-xs font-semibold', style: { color: colors.subtle } }, 'Speak Now'),
                createElement('p', { className: 'text-3xl font-bold mt-1 text-red-500 animate-pulse' }, `${answerTimeLeft}s`)
              ),
              !isPrepping && !isRecording && createElement('div', null,
                createElement('p', { className: 'text-xs font-semibold', style: { color: colors.subtle } }, 'Recording'),
                createElement('p', { className: 'text-sm font-bold mt-1', style: { color: colors.text } },
                  isSegmentCompleted ? 'Completed' : 'Ready'
                )
              )
            ),

            // Transcription Box & Controller
            createElement('div', { className: 'space-y-4' },
              createElement('div', { className: 'flex items-center gap-3' },
                isPrepping && createElement(Button, {
                  onClick: triggerResponseStage,
                  className: 'h-10 rounded-[0.8rem] text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white'
                }, 'Skip Prep & Start Answer'),

                isRecording && createElement(Button, {
                  onClick: handleStopRecording,
                  variant: 'destructive',
                  className: 'h-10 rounded-[0.8rem] text-xs font-semibold flex items-center gap-1.5'
                },
                  createElement(Square, { size: 14 }),
                  'Stop Recording'
                ),

                !isPrepping && !isRecording && createElement(Button, {
                  onClick: triggerPrepTimer.bind(null, activeSegmentIndex),
                  className: 'h-10 rounded-[0.8rem] text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5'
                },
                  createElement(RotateCcw, { size: 14 }),
                  isSegmentCompleted ? 'Re-record Answer' : 'Start Answer'
                )
              ),

              // Speech transcription error notification
              speechError && createElement('p', { className: 'text-xs text-orange-400 flex items-center gap-1' },
                createElement(AlertTriangle, { size: 14 }),
                speechError
              ),

              // Answer text area (Editable so user can correct or manually type in case speech recognition is unavailable)
              createElement('div', { className: 'relative' },
                createElement('textarea', {
                  value: currentAnswerText,
                  onChange: (e) => setCurrentAnswerText((e.target as HTMLTextAreaElement).value),
                  disabled: isRecording || isPrepping,
                  placeholder: isRecording ? 'Listening and transcribing your response live...' : 'No transcription recorded yet. Click Start Answer above or type your answer directly here.',
                  className: 'w-full min-h-32 rounded-[0.9rem] border p-4 text-sm outline-none resize-none bg-transparent leading-relaxed',
                  style: { borderColor: colors.border, color: colors.text }
                }),
                isRecording && createElement('div', { className: 'absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-500' },
                  createElement(Mic, { size: 11 }),
                  'Live'
                )
              ),

              // Word metrics & Save
              createElement('div', { className: 'flex flex-wrap items-center justify-between gap-4 pt-2' },
                createElement('div', { className: 'flex items-center gap-4 text-xs', style: { color: colors.muted } },
                  createElement('span', null, `Words: ${currentAnswerText.trim() ? currentAnswerText.trim().split(/\s+/).length : 0}`),
                  createElement('span', { className: 'flex items-center gap-1' },
                    `Filler words: `,
                    createElement('strong', { className: liveFillerWordCount > 2 ? 'text-orange-500' : 'text-green-500' }, liveFillerWordCount)
                  )
                ),
                createElement(Button, {
                  disabled: isRecording || isPrepping || !hasRecordedAnything,
                  onClick: handleSaveAnswer,
                  className: 'h-9 rounded-[0.8rem] text-xs font-semibold px-4',
                  style: {
                    backgroundColor: (!isRecording && !isPrepping && hasRecordedAnything) ? colors.primary : colors.soft,
                    color: (!isRecording && !isPrepping && hasRecordedAnything) ? '#fffefb' : colors.subtle
                  }
                }, activeSegmentIndex < 4 ? 'Save & Next' : 'Save Answer')
              )
            )
          )
        )
      )
    )
  }

  // RENDER PHASE 3: POST-SESSION
  const renderPostSession = () => {
    if (verdict === null) return null

    // Determine visual status details
    let verdictTitle = 'Verdict Needed'
    let verdictColor = '#eab308' // yellow
    let verdictBg = 'rgba(234, 179, 8, 0.1)'
    let verdictBorder = 'rgba(234, 179, 8, 0.3)'

    if (verdict === 'reject') {
      verdictTitle = 'Verdict: Reject'
      verdictColor = '#ef4444' // red
      verdictBg = 'rgba(239, 68, 68, 0.1)'
      verdictBorder = 'rgba(239, 68, 68, 0.3)'
    } else if (verdict === 'clear') {
      verdictTitle = 'Verdict: Clear'
      verdictColor = '#22c55e' // green
      verdictBg = 'rgba(34, 197, 94, 0.1)'
      verdictBorder = 'rgba(34, 197, 94, 0.3)'
    } else if (verdict === 'borderline') {
      verdictTitle = 'Verdict: Borderline'
      verdictColor = '#f97316' // orange
      verdictBg = 'rgba(249, 115, 22, 0.1)'
      verdictBorder = 'rgba(249, 115, 22, 0.3)'
    }

    return createElement('div', { className: 'space-y-6 max-w-3xl mx-auto' },
      createElement('section', { className: 'overflow-hidden rounded-[1.5rem] border p-6 backdrop-blur-xl lg:p-8', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement('div', { className: 'grid gap-8 md:grid-cols-[180px_1fr]' },
          // Animated Readiness Score Badge
          createElement('div', { className: 'flex flex-col items-center justify-center border rounded-[1.5rem] p-6 text-center', style: { borderColor: colors.border, backgroundColor: colors.soft } },
            createElement('p', { className: 'text-xs font-semibold uppercase tracking-wider', style: { color: colors.subtle } }, 'Final Readiness'),
            createElement('div', { className: 'relative mt-4 flex items-center justify-center h-28 w-28 rounded-full border-4', style: { borderColor: colors.primary, backgroundColor: colors.soft } },
              createElement('span', { className: 'text-3xl font-extrabold', style: { color: colors.text } }, `${animatedScore}%`)
            ),
            createElement('p', { className: 'text-[11px] mt-4', style: { color: colors.muted } }, 'Based on communication clarity & word fluency'),
            xpAwarded !== null && createElement('div', { className: 'mt-4 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full font-bold text-xs inline-block' },
              `+${xpAwarded} XP Earned`
            )
          ),

          // Verdict details & letter
          createElement('div', { className: 'space-y-6' },
            // Verdict Card
            createElement('div', {
              className: 'rounded-[1.2rem] border p-4 font-semibold text-lg flex items-center gap-2',
              style: { backgroundColor: verdictBg, borderColor: verdictBorder, color: verdictColor }
            },
              createElement(Trophy, { size: 20 }),
              createElement('span', null, verdictTitle)
            ),

            // Letter rendering with pre-wrap styling to maintain formatting
            createElement('div', { className: 'p-6 rounded-[1.2rem] border text-sm leading-relaxed max-h-[350px] overflow-y-auto', style: { backgroundColor: colors.soft, borderColor: colors.border } },
              createElement('div', { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit' } }, verdictLetter)
            ),

            // Reset controller
            createElement('div', { className: 'pt-2' },
              createElement(Button, {
                onClick: handlePlayAgain,
                className: 'h-11 rounded-[0.9rem] px-6 text-sm font-semibold flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white'
              },
                createElement(RotateCcw, { size: 16 }),
                'Play Again'
              )
            )
          )
        )
      )
    )
  }

  return createElement(
    'main',
    { className: 'min-h-screen', style: { background: colors.background } },
    showIntro
      ? createElement(
          'div',
          { className: 'coffee-intro-screen fixed inset-0 z-50 overflow-hidden', style: { backgroundColor: '#120805' } },
          createElement('iframe', {
            src: 'https://www.youtube.com/embed/LxwbOVZk8aM?autoplay=1&mute=0&controls=0&playsinline=1&rel=0&modestbranding=1&start=0',
            title: 'Coffee with Interview Arena music',
            className: 'pointer-events-none absolute h-px w-px opacity-0',
            style: { left: -9999, top: -9999 },
            allow: 'autoplay; encrypted-media; speaker-selection',
            tabIndex: -1,
            'aria-hidden': true,
          }),
          createElement('img', {
            src: '/coffee-with-interview-arena.png',
            alt: '',
            className: 'coffee-intro-backdrop absolute inset-0 h-full w-full select-none object-cover',
            draggable: false,
            'aria-hidden': true,
          }),
          createElement('div', { className: 'absolute inset-0', style: { background: 'radial-gradient(circle at center, rgba(255, 174, 75, 0.08), rgba(18, 8, 5, 0.24) 44%, rgba(7, 3, 2, 0.82) 100%)' } }),
          createElement('div', { className: 'coffee-intro-glow absolute left-1/2 top-1/2 h-[65vmin] w-[65vmin] -translate-x-1/2 -translate-y-1/2 rounded-full' }),
          createElement('div', { className: 'coffee-intro-grain absolute inset-0 opacity-25' }),
          createElement(
            'div',
            { className: 'relative flex min-h-screen flex-col items-center justify-between gap-5 px-5 py-6 text-center sm:px-8 sm:py-8' },
            createElement('div', { className: 'flex w-full justify-center pt-2' },
              createElement('div', { className: 'rounded-full border px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.32em] text-amber-100 shadow-lg backdrop-blur-md', style: { borderColor: 'rgba(255, 211, 130, 0.32)', backgroundColor: 'rgba(20, 8, 3, 0.42)' } },
                'Coffee with Interview Arena'
              )
            ),
            createElement('div', { className: 'coffee-intro-logo-wrap flex min-h-0 w-full flex-1 items-center justify-center' },
              createElement('img', {
                src: '/coffee-with-interview-arena.png',
                alt: 'Coffee with Interview Arena',
                className: 'coffee-intro-logo h-auto max-h-[62vh] w-full max-w-6xl select-none object-contain',
                draggable: false,
              })
            ),
            createElement(
              'div',
              { className: 'coffee-intro-panel w-full max-w-2xl rounded-[1rem] border p-5 shadow-2xl backdrop-blur-md sm:p-6', style: { borderColor: 'rgba(255, 211, 130, 0.38)', backgroundColor: 'rgba(21, 8, 3, 0.72)' } },
              createElement('div', { className: 'mb-4 flex items-center justify-between gap-4 text-amber-100' },
                createElement('div', { className: 'flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em]' },
                  createElement(Volume2, { size: 16 }),
                  'Loading Arena'
                ),
                createElement('div', { className: 'coffee-intro-percent tabular-nums text-xl font-black tracking-wider sm:text-2xl' },
                  `${introProgress}%`
                )
              ),
              createElement('div', { className: 'h-2.5 overflow-hidden rounded-full border bg-black/55 p-[2px]', style: { borderColor: 'rgba(255, 211, 130, 0.28)' } },
                createElement('div', { className: 'coffee-intro-progress h-full rounded-full', style: { background: 'linear-gradient(90deg, #ff4f00 0%, #ff9d2f 42%, #ffe09a 72%, #ff4f00 100%)' } })
              ),
              createElement('div', { className: 'mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-amber-50' },
                createElement('span', null, introProgress < 35 ? 'Warming up the coffee room...' : introProgress < 70 ? 'Loading interview segments...' : 'Preparing your arena...'),
                createElement('span', { className: 'text-xs uppercase tracking-[0.24em] text-amber-200/80' }, 'Please wait')
              )
            )
          )
        )
      : null,
    createElement('div', { className: 'mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8' },
      // Header Page info
      createElement('header', { className: 'mb-6 rounded-[1.25rem] border p-4 backdrop-blur-xl', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement('div', { className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between' },
          createElement('div', null,
            createElement('p', { className: 'text-xs font-semibold uppercase tracking-wider', style: { color: colors.primary } }, 'Interview Game'),
            createElement('h1', { className: 'text-2xl font-semibold', style: { color: colors.text } }, 'Coffee with Interview Arena')
          ),
          createElement('div', { className: 'flex items-center gap-3' },
            createElement(Button, {
              className: 'h-10 rounded-[0.9rem] flex items-center gap-1.5',
              variant: 'outline',
              onClick: () => {
                stopAllTimers()
                stopSpeechRecognition()
                router.push('/dashboard')
              },
              type: 'button'
            },
              createElement(ArrowLeft, { size: 16 }),
              'Back to Dashboard'
            )
          )
        )
      ),

      // Conditional Phase Rendering
      phase === 'setup' && renderSetup(),
      phase === 'gameplay' && renderGameplay(),
      phase === 'post-session' && renderPostSession(),
      badgesEarned.length > 0 && createElement(BadgeEarnedOverlay, {
        badges: badgesEarned,
        onClose: () => setBadgesEarned([])
      })
    )
  )
}
