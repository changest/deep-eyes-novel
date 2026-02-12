export interface User {
  id: string
  email: string
  username: string
  avatarUrl?: string
  dailyQuota: number
  quotaResetAt: string
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

export interface Novel {
  id: string
  userId: string
  title: string
  genre?: string
  synopsis?: string
  status: 'draft' | 'published' | 'archived'
  settings?: NovelSettings
  createdAt: string
  updatedAt: string
  chapters?: Chapter[]
  _count?: {
    chapters: number
  }
}

export interface NovelSettings {
  style?: string
  tone?: string
  targetAudience?: string
  wordCountPerChapter?: number
}

export interface Chapter {
  id: string
  novelId: string
  chapterNumber: number
  title?: string
  content: string
  promptUsed: string
  tokensUsed: number
  model: string
  temperature: number
  createdAt: string
  updatedAt: string
}

export interface UsageLog {
  id: string
  userId: string
  novelId?: string
  requestType: 'generate' | 'continue' | 'rewrite'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  createdAt: string
}

export interface GenerateRequest {
  prompt: string
  genre?: string
  style?: string
  temperature?: number
  maxTokens?: number
  previousContext?: string
}

export interface QuotaInfo {
  dailyQuota: number
  usedToday: number
  remaining: number
  resetAt: string
}
