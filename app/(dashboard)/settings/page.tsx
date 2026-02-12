'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { QuotaInfo } from '@/types'
import { BarChart3, Coins, Calendar, Sparkles, Zap, Info, Key, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/user/quota')
      if (response.ok) {
        const data = await response.json()
        setQuota(data)
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">设置</h1>
        <p className="text-gray-500 mt-1">管理您的账户和配额信息</p>
      </div>

      {/* Token配额卡片 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Token 使用配额</h2>
            <p className="text-sm text-gray-500">查看您的每日AI生成配额使用情况</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-gray-400 py-8 text-center">加载中...</div>
        ) : quota ? (
          <div className="space-y-6">
            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 text-center">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">每日限额</p>
                <p className="text-2xl font-bold text-gray-800">{quota.dailyQuota.toLocaleString()}</p>
                <Coins className="h-4 w-4 text-amber-500 mx-auto mt-3" />
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50/50 rounded-2xl p-5 text-center">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">今日已用</p>
                <p className="text-2xl font-bold text-cyan-600">{quota.usedToday.toLocaleString()}</p>
                <Zap className="h-4 w-4 text-cyan-500 mx-auto mt-3" />
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-5 text-center">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">剩余</p>
                <p className="text-2xl font-bold text-emerald-600">{quota.remaining.toLocaleString()}</p>
                <Calendar className="h-4 w-4 text-emerald-500 mx-auto mt-3" />
              </div>
            </div>

            {/* 进度条 */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">使用进度</span>
                <span className="font-medium text-gray-700">
                  {Math.round((quota.usedToday / quota.dailyQuota) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(quota.usedToday / quota.dailyQuota) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Info className="h-4 w-4" />
              配额将于每天 00:00 重置
            </p>
          </div>
        ) : (
          <div className="text-gray-400 py-8 text-center">无法加载配额信息</div>
        )}
      </div>

      {/* API 配置卡片 */}
      <Link href="/settings/api">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">AI API 配置</h2>
                <p className="text-sm text-gray-500">配置您自己的 AI 服务提供商</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl">
            <p className="text-sm text-gray-600">
              支持 OpenAI、Kimi、Claude 等多种 AI 服务，也可配置自定义 API 地址
            </p>
          </div>
        </div>
      </Link>

      {/* 关于卡片 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">关于深瞳</h2>
        </div>

        <div className="space-y-4 text-gray-600">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">版本</span>
            <span className="font-medium">v1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">AI 引擎</span>
            <span className="font-medium">Kimi (Moonshot AI)</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-500">技术支持</span>
            <span className="font-medium">Next.js + Prisma + Tailwind</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl">
          <p className="text-sm text-gray-600">
            深瞳致力于为创作者提供优雅的AI写作体验，让每个人都能轻松创作出精彩的故事。
          </p>
        </div>
      </div>
    </div>
  )
}
