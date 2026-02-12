'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, FileText, BarChart3, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Novel, QuotaInfo } from '@/types'

export default function DashboardPage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [novelsRes, quotaRes] = await Promise.all([
          fetch('/api/novels'),
          fetch('/api/user/quota'),
        ])

        if (novelsRes.ok) {
          const novelsData = await novelsRes.json()
          setNovels(novelsData.novels || [])
        }

        if (quotaRes.ok) {
          const quotaData = await quotaRes.json()
          setQuota(quotaData)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const recentNovels = novels.slice(0, 5)
  const totalChapters = novels.reduce((sum, novel) => sum + (novel._count?.chapters || 0), 0)

  return (
    <div className="space-y-8">
      {/* 头部欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500 mt-1">让AI为您的创作注入灵感</p>
        </div>
        <Link href="/novels/new">
          <Button className="h-11 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300 group">
            <Plus className="h-4 w-4 mr-2" />
            开始创作
          </Button>
        </Link>
      </div>

      {/* 统计卡片 - 魅族风格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">我的作品</p>
              <p className="text-3xl font-bold text-gray-800">{novels.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-cyan-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">总章节数</p>
              <p className="text-3xl font-bold text-gray-800">{totalChapters}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">今日配额</p>
              <p className="text-3xl font-bold text-gray-800">
                {quota ? quota.remaining.toLocaleString() : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                style={{
                  width: quota ? `${(quota.usedToday / quota.dailyQuota) * 100}%` : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 快速开始区域 */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-cyan-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium text-cyan-100">AI 创作助手</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">开启您的创作之旅</h2>
            <p className="text-cyan-100 mb-4 max-w-md">
              使用深瞳 AI，只需输入想法，即可生成精彩的小说章节。让创作变得简单而有趣。
            </p>
            <Link href="/novels/new">
              <Button className="bg-white text-cyan-600 hover:bg-gray-100 rounded-xl font-medium shadow-lg">
                立即体验
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="hidden md:flex items-center justify-center w-32 h-32 bg-white/10 rounded-3xl backdrop-blur-sm">
            <Sparkles className="h-16 w-16 text-white/80" />
          </div>
        </div>
      </div>

      {/* 最近作品 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">最近的作品</h2>
          <Link href="/novels" className="text-sm text-cyan-500 hover:text-cyan-600 font-medium">
            查看全部
          </Link>
        </div>

        {isLoading ? (
          <div className="text-gray-400 py-8">加载中...</div>
        ) : recentNovels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNovels.map((novel) => (
              <Link
                key={novel.id}
                href={`/novels/${novel.id}`}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors truncate">
                      {novel.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {novel._count?.chapters || 0} 章节 · {novel.genre || '未分类'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    novel.status === 'published'
                      ? 'bg-emerald-50 text-emerald-600'
                      : novel.status === 'archived'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {novel.status === 'published' ? '已发布' : novel.status === 'archived' ? '已归档' : '草稿'}
                  </span>
                </div>
                {novel.synopsis && (
                  <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                    {novel.synopsis}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/50 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">还没有创建任何作品</p>
            <Link href="/novels/new">
              <Button className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                创建第一本小说
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
