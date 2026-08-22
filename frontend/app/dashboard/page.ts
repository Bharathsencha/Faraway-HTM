'use client'

import { createElement, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  Flame,
  Gamepad2,
  Home,
  LogOut,
  Medal,
  Play,
  ChevronDown,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from 'lucide-react'

import { useTheme } from '@/app/theme-provider'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/toast'
import { apiRequest } from '@/lib/auth'

type DashboardSection = 'home' | 'games' | 'leaderboard' | 'profile'

type DashboardOverview = {
  user: {
    id: string
    email: string
    name: string
    goal: string
    user_type: string
    problems: string[]
  }
  stats: {
    streak_days: number
    arena_points: number
    focus_area_count: number
    completed_games: number
    weekly_progress: number
  }
  focus_areas: string[]
  next_session: Array<{ label: string; detail: string }>
  games: Array<{
    title: string
    detail: string
    route: string
    icon: string
  }>
  leaderboard: Array<{
    rank: number
    name: string
    points: number
    xp: number
    level: number
    is_current_user?: boolean
  }>
  profile: {
    user_id: string
    goal: string
    user_type: string
    focus_areas: string[]
    arena_points: number
    completed_games: number
    streak_days: number
    weekly_progress: number
    leaderboard_rank: number
    xp: number
    level: number
    badges: string[]
  }
}

type UpdatedProfileResponse = {
  user?: DashboardOverview['user']
  profile?: {
    goal: string
    user_type: string
    focus_areas: string[]
    arena_points: number
    completed_games: number
    streak_days: number
    weekly_progress: number
  }
}

const navItems: Array<{ id: DashboardSection; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
]

const iconMap: Record<string, typeof BookOpenCheck> = {
  'book-open-check': BookOpenCheck,
  'bar-chart-3': BarChart3,
  brain: Brain,
  'gamepad-2': Gamepad2,
}

function titleCase(value: string): string {
  return value
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function Dashboard() {
  const router = useRouter()
  const { theme } = useTheme()
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null)
  const [activeSection, setActiveSection] = useState<DashboardSection>('home')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    goal: '',
    userType: '',
    focusAreas: '',
  })
  const [fingerprint, setFingerprint] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speech_fingerprint')
      if (saved) {
        try {
          setFingerprint(JSON.parse(saved))
        } catch (e) {}
      }
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (!token) {
      router.replace('/')
      return
    }

    let mounted = true
    apiRequest<DashboardOverview>('/api/dashboard/overview', { method: 'GET', token })
      .then((payload) => {
        if (mounted) setDashboard(payload)
      })
      .catch((requestError) => {
        if (mounted) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to load dashboard')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [router])

  useEffect(() => {
    if (!dashboard) return
    setProfileDraft({
      name: dashboard.user.name || '',
      goal: dashboard.user.goal || '',
      userType: dashboard.user.user_type || '',
      focusAreas: dashboard.focus_areas.join(', '),
    })
  }, [dashboard])

  useEffect(() => {
    setIsAccountMenuOpen(false)
  }, [activeSection])

  const handleSaveProfile = async (): Promise<void> => {
    const token = localStorage.getItem('authToken')
    if (!token || !dashboard) return

    setIsSavingProfile(true)
    try {
      const parsedFocusAreas = profileDraft.focusAreas
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const result = await apiRequest<UpdatedProfileResponse>('/api/dashboard/profile', {
        method: 'PUT',
        token,
        body: {
          name: profileDraft.name.trim(),
          goal: profileDraft.goal.trim(),
          userType: profileDraft.userType.trim(),
          problems: parsedFocusAreas,
          focusAreas: parsedFocusAreas,
        },
      })

      setDashboard((current) => current ? {
        ...current,
        user: result.user ? { ...current.user, ...result.user } : {
          ...current.user,
          name: profileDraft.name.trim() || current.user.name,
          goal: profileDraft.goal.trim() || current.user.goal,
          user_type: profileDraft.userType.trim() || current.user.user_type,
          problems: parsedFocusAreas,
        },
        focus_areas: result.profile?.focus_areas ?? parsedFocusAreas,
        stats: result.profile ? {
          ...current.stats,
          arena_points: result.profile.arena_points,
          completed_games: result.profile.completed_games,
          streak_days: result.profile.streak_days,
          weekly_progress: result.profile.weekly_progress,
          focus_area_count: (result.profile.focus_areas ?? parsedFocusAreas).length,
        } : current.stats,
        profile: current.profile,
      } : current)

      toast({
        title: 'Profile updated',
        description: 'Your profile was saved to the backend.',
        variant: 'success',
      })
      setIsEditingProfile(false)
    } catch (saveError) {
      toast({
        title: 'Profile update failed',
        description: saveError instanceof Error ? saveError.message : 'Unable to save changes.',
        variant: 'error',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

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

  const handleLogout = (): void => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('userOnboardingData')
    router.push('/')
  }

  const handleGoToDashboard = (): void => {
    setActiveSection('home')
    setIsAccountMenuOpen(false)
    router.push('/dashboard')
  }

  if (loading) {
    return createElement(
      'main',
      { className: 'grid min-h-screen place-items-center', style: { background: colors.background } },
      createElement('p', { className: 'text-sm font-medium', style: { color: colors.muted } }, 'Loading dashboard...')
    )
  }

  if (error || !dashboard) {
    return createElement(
      'main',
      { className: 'grid min-h-screen place-items-center px-6', style: { background: colors.background } },
      createElement(
        'section',
        { className: 'max-w-md rounded-[1.25rem] border p-6 text-center backdrop-blur-xl', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement('h1', { className: 'text-2xl font-semibold', style: { color: colors.text } }, 'Dashboard unavailable'),
        createElement('p', { className: 'mt-3 text-sm leading-6', style: { color: colors.muted } }, error || 'Unable to load your dashboard data.'),
        createElement('div', { className: 'mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center' },
          createElement(Button, { type: 'button', className: 'h-10 rounded-[0.9rem]', onClick: () => router.refresh() }, 'Retry'),
          createElement(Button, { type: 'button', className: 'h-10 rounded-[0.9rem]', variant: 'outline', onClick: handleLogout }, 'Logout')
        )
      )
    )
  }

  const user = dashboard.user
  const focusAreas = dashboard.focus_areas

  const renderStat = (icon: typeof Zap, label: string, value: string, tone = colors.primary) =>
    createElement(
      'div',
      { className: 'rounded-[1rem] border p-5 backdrop-blur-xl', style: { backgroundColor: colors.panel, borderColor: colors.border } },
      createElement('div', { className: 'mb-4 flex h-10 w-10 items-center justify-center rounded-[0.8rem]', style: { backgroundColor: colors.primarySoft, color: tone } }, createElement(icon, { size: 20 })),
      createElement('p', { className: 'text-sm', style: { color: colors.subtle } }, label),
      createElement('p', { className: 'mt-1 text-2xl font-semibold', style: { color: colors.text } }, value)
    )

  const renderHome = () =>
    createElement(
      'div',
      { className: 'space-y-6' },
      createElement(
        'section',
        { className: 'overflow-hidden rounded-[1.5rem] border p-6 backdrop-blur-xl lg:p-8', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement(
          'div',
          { className: 'grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center' },
          createElement(
            'div',
            null,
            createElement(
              'div',
              { className: 'mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold', style: { backgroundColor: colors.primarySoft, color: colors.primary } },
              createElement(Sparkles, { size: 16 }),
              createElement('span', null, 'Today\'s prep room')
            ),
            createElement('h1', { className: 'max-w-3xl text-4xl font-semibold leading-tight lg:text-5xl', style: { color: colors.text } }, `Welcome back, ${user.name}`),
            createElement('p', { className: 'mt-4 max-w-2xl text-base leading-7 lg:text-lg', style: { color: colors.muted } }, 'Keep your practice focused with short games, clear feedback, and progress that is easy to scan.'),
            fingerprint && createElement(
              'div',
              { className: 'mt-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2 max-w-xl animate-fade-in' },
              createElement('span', { className: 'text-lg' }, '🎙️'),
              createElement('p', { className: 'text-sm font-semibold', style: { color: colors.text } }, 
                `Your pattern: "${fingerprint.top_filler}" ${fingerprint.trigger}`
              )
            ),
            createElement(
              'div',
              { className: 'mt-7 flex flex-col gap-3 sm:flex-row' },
              createElement(Button, { className: 'h-11 rounded-[0.9rem] px-5 text-sm font-semibold', type: 'button', onClick: () => setActiveSection('games') }, createElement(Play, { size: 18 }), 'Start Practice'),
              createElement(Button, { className: 'h-11 rounded-[0.9rem] px-5 text-sm font-semibold', variant: 'outline', type: 'button', onClick: () => router.push('/dashboard/interview') }, createElement(ClipboardCheck, { size: 18 }), 'Interview Coach'),
              createElement(Button, { className: 'h-11 rounded-[0.9rem] px-5 text-sm font-semibold', variant: 'outline', type: 'button', onClick: () => setActiveSection('games') }, createElement(Gamepad2, { size: 18 }), 'View Games')
            )
          ),
          createElement(
            'div',
            { className: 'space-y-4' },
            createElement(
              'div',
              { className: 'rounded-[1.25rem] border p-5', style: { backgroundColor: colors.soft, borderColor: colors.border } },
              createElement('p', { className: 'text-sm font-medium', style: { color: colors.muted } }, 'Current Goal'),
              createElement('p', { className: 'mt-3 text-2xl font-semibold leading-snug', style: { color: colors.text } }, user.goal || 'No goal set'),
              createElement(
                'div',
                { className: 'mt-6 h-2 overflow-hidden rounded-full', style: { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(36,23,16,0.1)' } },
                createElement('div', { className: 'h-full rounded-full', style: { width: `${dashboard.stats.weekly_progress}%`, background: 'linear-gradient(90deg, #ff8a3d 0%, #ff4f00 100%)' } })
              ),
              createElement('p', { className: 'mt-3 text-sm', style: { color: colors.subtle } }, `${dashboard.stats.weekly_progress}% weekly prep rhythm`)
            ),
            createElement(
              'div',
              { className: 'rounded-[1.25rem] border p-5', style: { backgroundColor: colors.soft, borderColor: colors.border } },
              createElement('div', { className: 'flex justify-between items-center' },
                createElement('p', { className: 'text-sm font-medium', style: { color: colors.muted } }, 'Interview Arena Level'),
                createElement('span', { className: 'px-2.5 py-0.5 text-xs font-bold bg-primary text-white rounded-full shadow-sm' }, `LVL ${dashboard.profile.level || 1}`)
              ),
              createElement('p', { className: 'mt-2 text-2xl font-bold', style: { color: colors.text } }, `${(dashboard.profile.xp || 0) % 500} / 500 XP`),
              createElement(
                'div',
                { className: 'mt-3 h-2.5 overflow-hidden rounded-full', style: { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(36,23,16,0.1)' } },
                createElement('div', { className: 'h-full rounded-full', style: { width: `${(((dashboard.profile.xp || 0) % 500) / 500) * 100}%`, background: 'linear-gradient(90deg, #ff8a3d 0%, #ff4f00 100%)' } })
              ),
              createElement('p', { className: 'mt-2 text-xs', style: { color: colors.subtle } }, `${500 - ((dashboard.profile.xp || 0) % 500)} XP to next level`)
            )
          )
        )
      ),
      createElement(
        'div',
        { className: 'grid gap-4 md:grid-cols-3' },
        renderStat(Flame, 'Streak', dashboard.stats.streak_days > 0 ? `${dashboard.stats.streak_days} days` : 'No streak yet'),
        renderStat(Medal, 'Arena Points', dashboard.stats.arena_points > 0 ? `${dashboard.stats.arena_points}` : 'No points yet'),
        renderStat(Target, 'Focus Areas', dashboard.stats.focus_area_count > 0 ? `${dashboard.stats.focus_area_count}` : 'No focus areas')
      ),
      createElement(
        'section',
        { className: 'grid gap-5 lg:grid-cols-[1fr_1.1fr_0.9fr]' },
        createElement(
          'div',
          { className: 'rounded-[1.25rem] border p-6', style: { backgroundColor: colors.panel, borderColor: colors.border } },
          createElement('h2', { className: 'text-xl font-semibold', style: { color: colors.text } }, 'Focus Board'),
          createElement(
            'div',
            { className: 'mt-5 flex flex-wrap gap-3' },
            focusAreas.length > 0
              ? focusAreas.map((problem) =>
                  createElement('span', { key: problem, className: 'rounded-full border px-4 py-2 text-sm font-medium', style: { backgroundColor: colors.primarySoft, borderColor: 'rgba(255, 79, 0, 0.35)', color: colors.primary } }, titleCase(problem))
                )
              : createElement('span', { className: 'text-sm', style: { color: colors.muted } }, 'No focus areas recorded yet')
          )
        ),
        createElement(
          'div',
          { className: 'rounded-[1.25rem] border p-6', style: { backgroundColor: colors.panel, borderColor: colors.border } },
          createElement('h2', { className: 'text-xl font-semibold', style: { color: colors.text } }, 'Badges Collection'),
          createElement(
            'div',
            { className: 'grid grid-cols-4 gap-3 mt-5' },
            ...[
              { name: 'Never Settle', icon: '💰', description: 'Win Salary Poker above average 3x' },
              { name: 'Filler Slayer', icon: '⚔️', description: 'Complete Articulate Master with 0 fillers 3x' },
              { name: 'Bluff Master', icon: '🎭', description: 'Walk Away worked 5 times in Salary Poker' },
              { name: 'Iron Nerve', icon: '🛡️', description: 'Complete Coffee Game 3 times' },
              { name: 'Speed Demon', icon: '⚡', description: 'Answer Googly Master under 5s 5x' },
              { name: 'Polished Speaker', icon: '🎙️', description: 'Articulate Master score > 80 5x' },
              { name: 'Googly Guru', icon: '🧠', description: 'Googly Master score > 80 3x' },
              { name: 'Consistency King', icon: '👑', description: 'Complete a total of 15 games' },
            ].map((b) => {
              const isEarned = dashboard.profile.badges?.includes(b.name);
              return createElement(
                'div',
                {
                  key: b.name,
                  title: `${b.name}: ${b.description}`,
                  className: 'flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:scale-105 select-none cursor-help',
                  style: {
                    backgroundColor: isEarned ? colors.primarySoft : colors.soft,
                    borderColor: isEarned ? 'rgba(255, 79, 0, 0.3)' : colors.border,
                    opacity: isEarned ? 1 : 0.35,
                  }
                },
                createElement('span', { className: 'text-2xl mb-1' }, b.icon),
                createElement('span', { className: 'text-[9px] font-extrabold text-center truncate w-full', style: { color: colors.text } }, b.name)
              );
            })
          )
        ),
        createElement(
          'div',
          { className: 'rounded-[1.25rem] border p-6', style: { backgroundColor: colors.panel, borderColor: colors.border } },
          createElement('h2', { className: 'text-xl font-semibold', style: { color: colors.text } }, 'Next Session'),
          createElement(
            'div',
            { className: 'mt-5 space-y-4' },
            ...dashboard.next_session.map((step, index) =>
              createElement(
                'div',
                { key: `${step.label}-${index}`, className: 'flex gap-4 rounded-[1rem] p-4', style: { backgroundColor: colors.soft } },
                createElement('span', { className: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold', style: { backgroundColor: colors.primary, color: '#fffefb' } }, String(index + 1)),
                createElement(
                  'div',
                  null,
                  createElement('p', { className: 'font-semibold', style: { color: colors.text } }, step.label),
                  createElement('p', { className: 'mt-1 text-sm', style: { color: colors.muted } }, step.detail)
                )
              )
            )
          )
        )
      )
    )

  const renderGames = () => {
    const gameImageMap: Record<string, string> = {
      'Coffee with Interview Arena': '/coffee-with-interview-arena.png',
      'Salary Negotiator Poker': '/salary-negotiator-poker.jpg',
      'Articulate Master': '/articulate-master.jpg',
      'GOOGLY MASTER': '/googly-master.jpg',
    }

    return createElement(
      'div',
      { className: 'grid gap-5 md:grid-cols-2 xl:grid-cols-4' },
      ...dashboard.games.map((game) => {
        const imageUrl = gameImageMap[game.title]
        const isCoffeeGame = game.title === 'Coffee with Interview Arena'
        return createElement(
          'article',
          { key: game.title, className: 'rounded-[1.25rem] border p-6 transition-transform hover:-translate-y-1', style: { backgroundColor: colors.panel, borderColor: colors.border } },
          imageUrl
            ? createElement(
                'div',
                { className: 'mb-6 flex justify-center overflow-hidden rounded-[0.75rem]' },
                createElement('img', {
                  src: imageUrl,
                  alt: game.title,
                  className: `h-40 w-full max-w-[19rem] ${isCoffeeGame ? 'object-contain' : 'object-cover'}`,
                  draggable: false,
                })
              )
            : createElement(
                'div',
                { className: 'mb-6 flex items-center justify-start' },
                createElement('div', { className: 'flex h-12 w-12 items-center justify-center rounded-[1rem]', style: { backgroundColor: colors.primarySoft, color: colors.primary } }, createElement(iconMap[game.icon] ?? Gamepad2, { size: 24 })),
              ),
          createElement('h2', { className: 'text-xl font-semibold', style: { color: colors.text } }, game.title),
          createElement('p', { className: 'mt-3 min-h-12 text-sm leading-6', style: { color: colors.muted } }, game.detail),
          createElement(
            Button,
            {
              className: 'mt-6 h-10 w-full rounded-[0.9rem]',
              type: 'button',
              onClick: () => router.push(game.route),
            },
            createElement(Play, { size: 17 }),
            'Play'
          )
        )
      }),
      createElement(
        'article',
        { key: 'interview-coach', className: 'rounded-[1.25rem] border p-6 transition-transform hover:-translate-y-1', style: { backgroundColor: colors.panel, borderColor: 'rgba(255, 79, 0, 0.3)' } },
        createElement(
          'div',
          { className: 'mb-6 flex items-center justify-start' },
          createElement('div', { className: 'flex h-12 w-12 items-center justify-center rounded-[1rem]', style: { background: 'linear-gradient(135deg, #ff4f00, #ff8a3d)', color: '#fffefb' } }, createElement(ClipboardCheck, { size: 24 })),
        ),
        createElement('div', { className: 'inline-flex items-center gap-1.5 mb-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', style: { backgroundColor: 'rgba(255, 79, 0, 0.12)', color: colors.primary } }, '🎤 AI Agents'),
        createElement('h2', { className: 'text-xl font-semibold', style: { color: colors.text } }, 'Interview Coach'),
        createElement('p', { className: 'mt-3 min-h-12 text-sm leading-6', style: { color: colors.muted } }, 'Paste your resume, get AI-generated questions, type your answer, and receive instant scoring with feedback and drills.'),
        createElement(
          Button,
          {
            className: 'mt-6 h-10 w-full rounded-[0.9rem]',
            type: 'button',
            onClick: () => router.push('/dashboard/interview'),
          },
          createElement(Play, { size: 17 }),
          'Practice Now'
        )
      )
    )
  }

  const renderLeaderboard = () =>
    createElement(
      'section',
      { className: 'rounded-[1.25rem] border p-6', style: { backgroundColor: colors.panel, borderColor: colors.border } },
      createElement(
        'div',
        { className: 'mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center' },
        createElement(
          'div',
          null,
          createElement('h2', { className: 'text-2xl font-semibold', style: { color: colors.text } }, 'Leaderboard'),
          createElement('p', { className: 'mt-1 text-sm', style: { color: colors.muted } }, 'Weekly Interview Arena standings')
        ),
        createElement('span', { className: 'rounded-full px-4 py-2 text-sm font-semibold', style: { backgroundColor: colors.primarySoft, color: colors.primary } }, `You are #${dashboard.profile.leaderboard_rank}`)
      ),
      createElement(
        'div',
        { className: 'space-y-3' },
        ...dashboard.leaderboard.map((row) =>
          createElement(
            'div',
            {
              key: `${row.rank}-${row.name}`,
              className: 'flex items-center justify-between rounded-[1rem] border px-4 py-4',
              style: {
                backgroundColor: row.is_current_user ? colors.primarySoft : colors.soft,
                borderColor: row.is_current_user ? 'rgba(255, 79, 0, 0.35)' : colors.border,
              },
            },
            createElement(
              'div',
              { className: 'flex items-center gap-4' },
              createElement('span', { className: 'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold', style: { backgroundColor: row.rank === 1 ? colors.primary : colors.panelStrong, color: row.rank === 1 ? '#fffefb' : colors.text } }, String(row.rank)),
              createElement(
                'div',
                null,
                createElement(
                  'div',
                  { className: 'flex items-center gap-2' },
                  createElement('p', { className: 'font-semibold', style: { color: colors.text } }, row.name),
                  createElement('span', { className: 'rounded px-1.5 py-0.5 text-[10px] font-bold border shadow-sm', style: { backgroundColor: colors.soft, borderColor: colors.border, color: colors.muted } }, `Lvl ${row.level || 1}`)
                )
              )
            ),
            createElement('p', { className: 'font-semibold', style: { color: colors.primary } }, `${row.xp || 0} XP`)
          )
        )
      )
    )

  const renderProfile = () =>
    createElement(
      'section',
      { className: 'grid gap-5 lg:grid-cols-[0.75fr_1.25fr]' },
      createElement(
        'div',
        { className: 'rounded-[1.25rem] border p-6 text-center', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement('div', { className: 'mx-auto flex h-24 w-24 items-center justify-center rounded-[1.5rem] text-3xl font-semibold', style: { backgroundColor: colors.primary, color: '#fffefb' } }, user.name.charAt(0).toUpperCase()),
        createElement('h2', { className: 'mt-5 text-2xl font-semibold', style: { color: colors.text } }, user.name),
        createElement('p', { className: 'mt-2 text-sm', style: { color: colors.muted } }, user.user_type ? titleCase(user.user_type) : 'Not set'),
        createElement(Button, { className: 'mt-6 h-10 rounded-[0.9rem]', variant: 'outline', type: 'button', onClick: () => setIsEditingProfile(true) }, createElement(Settings, { size: 17 }), 'Edit Profile')
      ),
      createElement(
        'div',
        { className: 'rounded-[1.25rem] border p-6', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement(
          'div',
          { className: 'flex items-center justify-between gap-3' },
          createElement('h2', { className: 'text-xl font-semibold', style: { color: colors.text } }, 'Profile Details'),
          createElement(Button, { type: 'button', variant: 'outline', className: 'h-9 rounded-[0.9rem]', onClick: () => setIsEditingProfile(true) }, 'Update')
        ),
        isEditingProfile
          ? createElement(
              'div',
              { className: 'mt-5 space-y-4' },
              createElement('div', null,
                createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: colors.subtle } }, 'Name'),
                createElement('input', {
                  value: profileDraft.name,
                  onChange: (e) => setProfileDraft((prev) => ({ ...prev, name: (e.target as HTMLInputElement).value })),
                  className: 'h-11 w-full rounded-[0.9rem] border bg-transparent px-4 text-sm outline-none',
                  style: { borderColor: colors.border, color: colors.text },
                })
              ),
              createElement('div', null,
                createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: colors.subtle } }, 'Goal'),
                createElement('textarea', {
                  value: profileDraft.goal,
                  onChange: (e) => setProfileDraft((prev) => ({ ...prev, goal: (e.target as HTMLTextAreaElement).value })),
                  className: 'min-h-24 w-full rounded-[0.9rem] border bg-transparent px-4 py-3 text-sm outline-none',
                  style: { borderColor: colors.border, color: colors.text },
                })
              ),
              createElement('div', null,
                createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: colors.subtle } }, 'Background'),
                createElement('input', {
                  value: profileDraft.userType,
                  onChange: (e) => setProfileDraft((prev) => ({ ...prev, userType: (e.target as HTMLInputElement).value })),
                  className: 'h-11 w-full rounded-[0.9rem] border bg-transparent px-4 text-sm outline-none',
                  style: { borderColor: colors.border, color: colors.text },
                })
              ),
              createElement('div', null,
                createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: colors.subtle } }, 'Focus Areas'),
                createElement('input', {
                  value: profileDraft.focusAreas,
                  onChange: (e) => setProfileDraft((prev) => ({ ...prev, focusAreas: (e.target as HTMLInputElement).value })),
                  placeholder: 'communication, system-design, confidence',
                  className: 'h-11 w-full rounded-[0.9rem] border bg-transparent px-4 text-sm outline-none',
                  style: { borderColor: colors.border, color: colors.text },
                })
              ),
              createElement('div', { className: 'flex gap-3 pt-2' },
                createElement(Button, { type: 'button', className: 'h-10 rounded-[0.9rem]', onClick: handleSaveProfile, disabled: isSavingProfile }, isSavingProfile ? 'Saving...' : 'Save Changes'),
                createElement(Button, { type: 'button', className: 'h-10 rounded-[0.9rem]', variant: 'outline', onClick: () => setIsEditingProfile(false), disabled: isSavingProfile }, 'Cancel')
              )
            )
          : createElement(
              'div',
              { className: 'mt-5 grid gap-4 sm:grid-cols-2' },
              ...[
                ['Goal', user.goal || 'Not set'],
                ['Background', user.user_type ? titleCase(user.user_type) : 'Not set'],
                ['Weekly Points', dashboard.stats.arena_points > 0 ? `${dashboard.stats.arena_points}` : 'No points yet'],
                ['Completed Games', dashboard.stats.completed_games > 0 ? `${dashboard.stats.completed_games}` : 'No games yet'],
                ['Interview Arena Level', `Level ${dashboard.profile.level || 1}`],
                ['Total Experience', `${dashboard.profile.xp || 0} XP`],
              ].map(([label, value]) =>
                createElement(
                  'div',
                  { key: label, className: 'rounded-[1rem] p-4', style: { backgroundColor: colors.soft } },
                  createElement('p', { className: 'text-sm', style: { color: colors.subtle } }, label),
                  createElement('p', { className: 'mt-2 font-semibold', style: { color: colors.text } }, value || 'Not set')
                )
              )
            )
      )
    )

  const contentBySection: Record<DashboardSection, () => ReturnType<typeof createElement>> = {
    home: renderHome,
    games: renderGames,
    leaderboard: renderLeaderboard,
    profile: renderProfile,
  }

  return createElement(
    'main',
    { className: 'min-h-screen', style: { background: colors.background } },
    createElement(
      'div',
      { className: 'flex min-h-screen w-full' },
      createElement(
        'aside',
        { className: 'sticky top-0 hidden h-screen w-72 shrink-0 border-r p-5 lg:block', style: { backgroundColor: colors.panel, borderColor: colors.border } },
        createElement(
          'div',
          { className: 'flex h-full flex-col' },
          createElement(
            'button',
            {
              className: 'rounded-[0.9rem] px-2 py-3 text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#ff4f00]',
              onClick: () => router.push('/'),
              type: 'button',
            },
            createElement(BrandLogo, { textColor: colors.text, subtitle: 'Practice dashboard', compact: true })
          ),
          createElement(
            'nav',
            { className: 'mt-8 space-y-2' },
            ...navItems.map((item) => {
              const isActive = activeSection === item.id
              return createElement(
                'button',
                {
                  key: item.id,
                  className: 'flex w-full items-center gap-3 rounded-[0.9rem] px-4 py-3 text-left text-sm font-semibold transition-colors',
                  style: { backgroundColor: isActive ? colors.primary : 'transparent', color: isActive ? '#fffefb' : colors.muted },
                  onClick: () => setActiveSection(item.id),
                  type: 'button',
                },
                createElement(item.icon, { size: 19 }),
                createElement('span', null, item.label)
              )
            })
          ),
          createElement(
            'button',
            {
              className: 'mt-6 flex w-full items-center gap-3 rounded-[0.9rem] px-4 py-3 text-left text-sm font-semibold transition-all hover:scale-[1.02]',
              style: { background: 'linear-gradient(135deg, rgba(255, 79, 0, 0.15), rgba(255, 150, 50, 0.1))', border: '1px solid rgba(255, 79, 0, 0.3)', color: colors.primary },
              onClick: () => router.push('/dashboard/interview'),
              type: 'button',
            },
            createElement(ClipboardCheck, { size: 19 }),
            createElement('span', null, '🎤 Interview Coach')
          ),
          createElement(
            'div',
            { className: 'mt-4 rounded-[1rem] p-4', style: { backgroundColor: colors.soft } },
            createElement('p', { className: 'text-sm font-semibold', style: { color: colors.text } }, 'Ready for a round?'),
            createElement('p', { className: 'mt-1 text-xs leading-5', style: { color: colors.muted } }, 'Start with one quick game and review the feedback after.'),
            createElement(Button, { className: 'mt-4 h-9 w-full rounded-[0.85rem]', type: 'button', onClick: () => setActiveSection('games') }, 'Open Games')
          )
        )
      ),
      createElement(
        'div',
        { className: 'min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6' },
        createElement(
          'header',
          { className: 'mb-5 rounded-[1.25rem] border p-4 backdrop-blur-xl', style: { backgroundColor: colors.panel, borderColor: colors.border } },
          createElement(
            'div',
            { className: 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between' },
            createElement(
              'div',
              null,
              createElement('p', { className: 'text-sm font-medium', style: { color: colors.primary } }, titleCase(activeSection)),
              createElement('h1', { className: 'text-2xl font-semibold', style: { color: colors.text } }, navItems.find((item) => item.id === activeSection)?.label)
            ),
            createElement(
              'div',
              { className: 'relative flex items-center gap-3' },
              createElement('div', { className: 'hidden rounded-full px-4 py-2 text-sm font-semibold sm:block', style: { backgroundColor: colors.soft, color: colors.muted } }, user.name),
              createElement(
                'button',
                {
                  className: 'flex h-11 w-11 items-center justify-center rounded-full border transition-colors',
                  style: { backgroundColor: colors.primary, borderColor: 'rgba(255,255,255,0.2)', color: '#fffefb' },
                  type: 'button',
                  onClick: () => setIsAccountMenuOpen((value) => !value),
                  'aria-label': 'Account menu',
                  'aria-expanded': isAccountMenuOpen,
                },
                createElement(User, { size: 20 })
              ),
              createElement(ChevronDown, { size: 16, color: colors.muted }),
              isAccountMenuOpen
                ? createElement(
                    'div',
                    { className: 'absolute right-0 top-14 w-56 rounded-[1rem] border p-2 shadow-2xl', style: { backgroundColor: colors.panel, borderColor: colors.border } },
                    createElement('div', { className: 'px-3 py-2' },
                      createElement('p', { className: 'truncate text-sm font-semibold', style: { color: colors.text } }, user.name),
                      createElement('p', { className: 'truncate text-xs', style: { color: colors.muted } }, user.email)
                    ),
                    createElement(
                      'button',
                      {
                        className: 'mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-left text-sm font-semibold transition-colors',
                        style: { color: colors.text, backgroundColor: colors.soft },
                        type: 'button',
                        onClick: handleGoToDashboard,
                      },
                      createElement(Home, { size: 16 }),
                      'Dashboard'
                    ),
                    createElement(
                      'button',
                      {
                        className: 'mt-2 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-left text-sm font-semibold transition-colors',
                        style: { color: '#ff4f00' },
                        type: 'button',
                        onClick: handleLogout,
                      },
                      createElement(LogOut, { size: 16 }),
                      'Logout'
                    )
                  )
                : null
            )
          ),
          createElement(
            'nav',
            { className: 'mt-4 grid grid-cols-4 gap-2 lg:hidden' },
            ...navItems.map((item) => {
              const isActive = activeSection === item.id
              return createElement(
                'button',
                {
                  key: item.id,
                  className: 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[0.85rem] text-xs font-semibold',
                  style: { backgroundColor: isActive ? colors.primary : colors.soft, color: isActive ? '#fffefb' : colors.muted },
                  onClick: () => setActiveSection(item.id),
                  type: 'button',
                },
                createElement(item.icon, { size: 17 }),
                createElement('span', null, item.label)
              )
            })
          )
        ),
        contentBySection[activeSection]()
      )
    )
  )
}
