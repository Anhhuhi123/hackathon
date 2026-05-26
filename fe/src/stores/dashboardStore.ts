import { create } from 'zustand'
import apiClient from '../lib/apiClient'

type MatchSummary = any
type MatchDetail = any
type BetSummary = any
type SelectionSummary = any
type BetQuote = any

interface DashboardState {
  user: any | null
  wallet: any | null
  featuredMatches: MatchSummary[]
  matchList: MatchSummary[]
  matchDetail: MatchDetail | null
  recentBets: BetSummary[]
  betHistory: BetSummary[]
  selectedSelections: SelectionSummary[]
  currentStake: number
  currentQuote: BetQuote | null
  isBootstrapping: boolean
  isLoadingMatches: boolean
  isLoadingMatchDetail: boolean
  isCreatingQuote: boolean
  isPlacingBet: boolean
  error: string | null

  loadBootstrap: () => Promise<void>
  loadMatches: (filters?: any) => Promise<void>
  createQuote: () => Promise<void>
  placeBet: () => Promise<void>
  refreshWallet: () => Promise<void>
  refreshBetHistory: () => Promise<void>
  toggleSelection: (selection: SelectionSummary) => void
  setStake: (amount: number) => void
  clearQuote: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  user: null,
  wallet: null,
  featuredMatches: [],
  matchList: [],
  matchDetail: null,
  recentBets: [],
  betHistory: [],
  selectedSelections: [],
  currentStake: 0,
  currentQuote: null,
  isBootstrapping: false,
  isLoadingMatches: false,
  isLoadingMatchDetail: false,
  isCreatingQuote: false,
  isPlacingBet: false,
  error: null,

  loadBootstrap: async () => {
    set({ isBootstrapping: true, error: null })
    try {
      const res = await apiClient.apiFetch('/api/v1/dashboard/bootstrap')
      if (!res.ok) {
        if (res.status === 401) throw new Error('AUTH_ERROR')
        const text = await res.text()
        throw new Error(text || 'BOOTSTRAP_FAILED')
      }
      const data = await res.json()
      const { user, wallet, featured_matches, recent_bets } = data
      set({ user, wallet, featuredMatches: featured_matches || [], recentBets: recent_bets || [] })
    } catch (err: any) {
      set({ error: err.message || 'Đã xảy ra lỗi khi tải dashboard' })
    } finally {
      set({ isBootstrapping: false })
    }
  },

  loadMatches: async (filters = {}) => {
    set({ isLoadingMatches: true, error: null })
    try {
      const qs = new URLSearchParams(filters).toString()
      const res = await apiClient.apiFetch(`/api/v1/matches?${qs}`)
      if (!res.ok) throw new Error('MATCHES_FAILED')
      const data = await res.json()
      set({ matchList: data.items || [] })
    } catch (err: any) {
      set({ error: err.message || 'Không thể tải trận đấu' })
    } finally {
      set({ isLoadingMatches: false })
    }
  },
  
  createQuote: async () => {
    const state = get()
    set({ isCreatingQuote: true, error: null })
    try {
      const body = JSON.stringify({
        stake_amount: state.currentStake,
        selections: state.selectedSelections.map((s: any) => ({ selection_id: s.id })),
      })
      const res = await apiClient.apiFetch('/api/v1/bet-quotes', { method: 'POST', body })
      if (res.status === 201) {
        const quote = await res.json()
        set({ currentQuote: quote })
      } else {
        const data = await res.json()
        throw new Error(data.message || 'Tạo quote thất bại')
      }
    } catch (err: any) {
      set({ error: err.message || 'Không thể tạo quote' })
    } finally {
      set({ isCreatingQuote: false })
    }
  },

  placeBet: async () => {
    const state = get()
    set({ isPlacingBet: true, error: null })
    try {
      if (!state.currentQuote) throw new Error('NO_QUOTE')
      const idempotencyKey = (globalThis.crypto && (globalThis.crypto as any).randomUUID) ? (globalThis.crypto as any).randomUUID() : Math.random().toString(36).slice(2)
      const res = await apiClient.apiFetch('/api/v1/bets', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ quote_id: state.currentQuote.id }),
      })
      if (res.status === 201 || res.status === 200) {
        // on success, reset bet slip and refresh wallet + bets
        set({ currentQuote: null, selectedSelections: [], currentStake: 0 })
        // best-effort refresh
        await get().refreshWallet()
        await get().refreshBetHistory()
      } else {
        const data = await res.json()
        throw new Error(data.message || 'Đặt cược thất bại')
      }
    } catch (err: any) {
      set({ error: err.message || 'Không thể đặt cược' })
    } finally {
      set({ isPlacingBet: false })
    }
  },

  refreshWallet: async () => {
    try {
      const res = await apiClient.apiFetch('/api/v1/wallet/summary')
      if (!res.ok) return
      const wallet = await res.json()
      set({ wallet })
    } catch (err) {
      // silent
    }
  },

  refreshBetHistory: async () => {
    try {
      const res = await apiClient.apiFetch('/api/v1/bets')
      if (!res.ok) return
      const data = await res.json()
      set({ betHistory: data.items || [] })
    } catch (err) {
      // silent
    }
  },

  toggleSelection: (selection: SelectionSummary) => {
    const { selectedSelections } = get()
    const exists = selectedSelections.find((s: any) => s.id === selection.id)
    let nextSelections = []
    if (exists) {
      nextSelections = selectedSelections.filter((s: any) => s.id !== selection.id)
    } else {
      nextSelections = [...selectedSelections, selection]
    }
    set({ selectedSelections: nextSelections, currentQuote: null })
  },

  setStake: (amount: number) => {
    set({ currentStake: amount, currentQuote: null })
  },

  clearQuote: () => {
    set({ currentQuote: null })
  }
}))

export default useDashboardStore
