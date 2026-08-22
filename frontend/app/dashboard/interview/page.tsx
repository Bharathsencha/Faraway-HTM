'use client'

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  Award, 
  ChevronLeft,
  Building2,
  Briefcase,
  Layers,
  Zap,
  Target
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ProfileType {
  name?: string;
  role: string;
  seniority_level: string;
  years_experience: number;
  industry: string;
  skills: string[];
  companies?: string[];
  projects?: string[];
  education?: string[];
  resume_summary?: string;
}

interface FeedbackIssue {
  category: string;
  issue: string;
  tip: string;
}

interface FeedbackType {
  metrics?: Record<string, number | string>;
  strengths?: string[];
  issues?: FeedbackIssue[];
  top_3_tips?: string[];
  overall_assessment?: string;
}

interface DrillType {
  id?: string;
  name: string;
  description: string;
  duration: number;
  difficulty: string;
}

interface BadgeType {
  icon: string;
  name: string;
}

interface UserProgressType {
  level: number;
  xp_earned: number;
  best_score: number;
  current_streak: number;
}

export default function InterviewPage() {
  // State management
  const [stage, setStage] = useState<'resume' | 'profile' | 'answer' | 'feedback' | 'progress'>('resume');
  const [userId] = useState(() => `user_${Date.now()}`);
  
  // Resume & Profile
  const [resumeText, setResumeText] = useState('');
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  
  // PDF / TXT File Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Questions & Sessions
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(60);
  const [questionType, setQuestionType] = useState('resume_based');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(0);

  // Answering
  const [answerText, setAnswerText] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Feedback & Progress
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [scoreLabel, setScoreLabel] = useState<string>('');
  const [unlockedDrills, setUnlockedDrills] = useState<DrillType[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressType | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);

  // Timer effect for practice question
  useEffect(() => {
    if (stage === 'answer' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        if (elapsed >= timeLimit) {
          autoSubmitAnswer();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [stage, startTime, timeLimit]);

  // Parse raw text resume
  const parseResumeText = async () => {
    if (!resumeText.trim()) return;
    setParseLoading(true);
    setUploadError('');
    try {
      const response = await fetch(`${API_BASE}/api/interview/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          user_id: userId,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setProfile(data.profile);
        setStage('profile');
      } else {
        setUploadError(data.message || 'Failed to parse resume text');
      }
    } catch (error) {
      setUploadError(`Failed to parse resume: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setParseLoading(false);
    }
  };

  // Upload PDF or TXT file
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    setUploadedFileName(file.name);
    
    const validExts = ['.pdf', '.txt'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Only .pdf and .txt resume files are supported.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const response = await fetch(`${API_BASE}/api/interview/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.status === 'success') {
        setResumeText(data.resume_text);
        setProfile(data.profile);
        setStage('profile');
      } else {
        setUploadError(data.message || 'Failed to upload and parse file');
      }
    } catch (error: any) {
      setUploadError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    handleFileUpload(file);
  };

  // Generate resume-tailored question
  const generateQuestion = async () => {
    if (!profile) return;
    setParseLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/interview/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profile,
          user_id: userId,
          previous_questions: askedQuestions,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSessionId(data.session_id);
        setQuestion(data.question);
        setTimeLimit(data.time_limit || 60);
        setQuestionType(data.question_type || 'resume_based');
        setAskedQuestions(prev => [...prev, data.question]);
        setQuestionCount(prev => prev + 1);
        setAnswerText('');
        setElapsedTime(0);
        setStartTime(Date.now());
        setStage('answer');
      } else {
        alert(`Error generating question: ${data.message}`);
      }
    } catch (error) {
      alert(`Failed to generate question: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setParseLoading(false);
    }
  };

  // Submit Answer
  const submitAnswer = async () => {
    if (!answerText.trim() || answerLoading) return;
    setAnswerLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/interview/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answer: answerText,
          duration: elapsedTime,
          user_id: userId,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setScore(data.score);
        setScoreLabel(data.score_label || 'Good');
        setFeedback(data.feedback);
        setUnlockedDrills(data.unlocked_drills || []);
        setUserProgress(data.progress);
        setBadges(data.badges?.earned || []);
        setStage('feedback');
      } else {
        alert(`Error evaluating answer: ${data.message}`);
      }
    } catch (error) {
      alert(`Failed to submit answer: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setAnswerLoading(false);
    }
  };

  const autoSubmitAnswer = async () => {
    if (answerText.trim() && !answerLoading) {
      await submitAnswer();
    }
  };

  const loadProgress = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/interview/progress?user_id=${userId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setUserProgress(data.stats.progress);
        setBadges(data.stats.badges.earned);
        setStage('progress');
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  // Stage 1: Resume Upload & Parsing
  const renderResumeStage = () => (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold">
            <Sparkles size={16} />
            <span>AI Resume Parser & Question Generator</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Upload Your Resume</h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Our AI parses your experience, skills, and past projects to ask realistic interview questions tailored specifically to your background.
          </p>
        </div>

        {/* Upload Container */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
          {/* Drag & Drop File Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-orange-400" />
              <span>Option 1: Upload Resume File (.PDF or .TXT)</span>
            </label>
            <label
              className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
                ${uploading 
                  ? 'border-orange-500/50 bg-orange-500/5' 
                  : 'border-slate-700 hover:border-orange-500/60 bg-slate-800/40 hover:bg-slate-800/70'}`}
            >
              <div className="flex flex-col items-center justify-center p-6 text-center">
                {uploading ? (
                  <>
                    <RefreshCw className="animate-spin h-10 w-10 text-orange-400 mb-3" />
                    <p className="text-base text-orange-300 font-semibold">Parsing resume with AI...</p>
                    <p className="text-xs text-slate-500 mt-1">Extracting skills, roles, and project accomplishments</p>
                  </>
                ) : uploadedFileName && !uploadError ? (
                  <>
                    <CheckCircle2 size={36} className="text-green-400 mb-2" />
                    <p className="text-base text-green-300 font-semibold">{uploadedFileName}</p>
                    <p className="text-xs text-slate-400 mt-1">File parsed successfully! Click below to view profile.</p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 mb-3 text-orange-400">
                      <Upload size={28} />
                    </div>
                    <p className="text-base font-semibold text-slate-200">
                      Click to upload or drag & drop your resume
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">Supports PDF or plain TXT files</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {uploadError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800/50 p-3 rounded-xl">
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <span className="relative px-4 bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
          </div>

          {/* Textarea Paste */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Layers size={18} className="text-orange-400" />
              <span>Option 2: Paste Resume Text</span>
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full h-44 bg-slate-950/80 text-slate-100 border border-slate-700/80 rounded-2xl p-4 text-sm font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-600"
              placeholder={`Paste your resume experience here... e.g.
Full Stack Engineer at Acme Inc (4 years)
- Architected microservices with React, Python, AWS, Docker
- Reduced latency by 45% using Redis caching
- Led team of 5 engineers for payment gateway overhaul`}
            />
          </div>

          {/* Parse Action Button */}
          <button
            onClick={parseResumeText}
            disabled={parseLoading || uploading || !resumeText.trim()}
            className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {parseLoading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>Analyzing Resume with Gemini AI...</span>
              </>
            ) : (
              <>
                <span>Parse Resume & Generate Profile</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Stage 2: Parsed Profile Display
  const renderProfileStage = () => {
    if (!profile) return null;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Navigation */}
          <button 
            onClick={() => setStage('resume')} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-semibold mb-2"
          >
            <ChevronLeft size={16} />
            <span>Upload Different Resume</span>
          </button>

          {/* Main Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
            {/* Header / Name */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 size={14} />
                  <span>Resume Parsed Successfully</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">{profile.name || 'Candidate Profile'}</h2>
                <p className="text-slate-400 text-base font-medium mt-1">{profile.role}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-sm">
                  {profile.seniority_level}
                </span>
                <span className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm">
                  {profile.years_experience}+ Yrs Exp
                </span>
              </div>
            </div>

            {/* AI Resume Summary */}
            {profile.resume_summary && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
                  <Brain size={16} />
                  <span>AI Resume Summary</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{profile.resume_summary}</p>
              </div>
            )}

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role & Industry */}
              <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                  <Briefcase size={16} className="text-orange-400" />
                  <span>Primary Role & Industry</span>
                </div>
                <p className="text-white text-lg font-bold">{profile.role}</p>
                <p className="text-slate-400 text-xs font-medium">Domain: {profile.industry}</p>
              </div>

              {/* Past Companies */}
              <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                  <Building2 size={16} className="text-orange-400" />
                  <span>Past Companies / Clients</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.companies && profile.companies.length > 0 ? (
                    profile.companies.map((c, i) => (
                      <span key={i} className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">Extracted from experience section</span>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Zap size={14} className="text-orange-400" />
                  <span>Extracted Technical & Domain Skills</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Target size={14} className="text-orange-400" />
                  <span>Key Resume Highlights / Projects</span>
                </p>
                <ul className="space-y-2">
                  {profile.projects.map((proj, idx) => (
                    <li key={idx} className="text-slate-300 text-xs bg-slate-800/30 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <span>{proj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start Practice Action */}
            <button
              onClick={generateQuestion}
              disabled={parseLoading}
              className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-base"
            >
              {parseLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Generating Tailored Question...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Start Interview Practice (Questions from Resume)</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Stage 3: Question & Answer Stage
  const renderAnswerStage = () => (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Progress header */}
        <div className="flex justify-between items-center text-sm font-semibold text-slate-400">
          <button 
            onClick={() => setStage('profile')}
            className="flex items-center gap-1 hover:text-white transition"
          >
            <ChevronLeft size={16} />
            <span>Back to Profile</span>
          </button>
          <span className="px-3 py-1 bg-slate-800/80 rounded-full text-xs text-orange-400 font-bold border border-slate-700">
            Question #{questionCount}
          </span>
        </div>

        {/* Question Panel */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
              <Sparkles size={14} />
              <span>Tailored to Your Resume</span>
            </div>

            {/* Timer Bar */}
            <div className="flex items-center gap-3">
              <Clock size={18} className={elapsedTime >= timeLimit * 0.8 ? 'text-red-400 animate-pulse' : 'text-emerald-400'} />
              <div className="text-right">
                <span className={`text-sm font-bold font-mono ${elapsedTime >= timeLimit * 0.8 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {elapsedTime}s / {timeLimit}s
                </span>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-200 ${elapsedTime >= timeLimit * 0.8 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((elapsedTime / timeLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800/80">
            <p className="text-white text-lg md:text-xl font-semibold leading-relaxed">
              {question}
            </p>
          </div>

          {/* User Answer Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Response:
            </label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full h-44 bg-slate-950 text-slate-100 border border-slate-700/80 rounded-2xl p-4 text-sm font-sans focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-600"
              placeholder="Type your structured answer here (Focus on Situation, Action, Result)..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={submitAnswer}
              disabled={answerLoading || !answerText.trim()}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {answerLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Evaluating Response...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Submit & Analyze Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Stage 4: Feedback & Evaluation Stage
  const renderFeedbackStage = () => {
    if (score === null || !feedback) return null;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header Score Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Evaluation</span>
              <h2 className="text-4xl font-extrabold text-white mt-1">Score: {score} / 100</h2>
              <p className="text-orange-400 font-semibold text-sm mt-1">{scoreLabel}</p>
            </div>
            <div className="text-6xl">
              {score >= 85 ? '🌟' : score >= 70 ? '🎯' : score >= 50 ? '📈' : '💡'}
            </div>
          </div>

          {/* Metrics & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metrics */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain size={20} className="text-orange-400" />
                <span>Speech Metrics</span>
              </h3>
              <div className="space-y-3">
                {feedback.metrics && Object.entries(feedback.metrics).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-slate-800 text-sm">
                    <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-white">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>Strengths Identified</span>
              </h3>
              <ul className="space-y-2">
                {feedback.strengths && feedback.strengths.map((str, i) => (
                  <li key={i} className="text-slate-300 text-sm bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl">
                    {str}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improvements & Actionable Tips */}
          {feedback.top_3_tips && feedback.top_3_tips.length > 0 && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target size={20} className="text-amber-400" />
                <span>Key Improvements for Next Round</span>
              </h3>
              <div className="space-y-2">
                {feedback.top_3_tips.map((tip, i) => (
                  <div key={i} className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-slate-200 text-sm">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={generateQuestion}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 text-base"
            >
              <Sparkles size={20} />
              <span>Next Question from Resume</span>
            </button>

            <button
              onClick={() => setStage('profile')}
              className="px-6 py-4 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-slate-700 flex items-center justify-center gap-2"
            >
              <span>View Profile</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950">
      {stage === 'resume' && renderResumeStage()}
      {stage === 'profile' && renderProfileStage()}
      {stage === 'answer' && renderAnswerStage()}
      {stage === 'feedback' && renderFeedbackStage()}
    </main>
  );
}
