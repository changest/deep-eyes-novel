'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function NewNovelPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    synopsis: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建失败')
      }

      toast.success('作品创建成功')
      router.push(`/novels/${data.novel.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href="/novels">
          <Button variant="ghost" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回作品列表
          </Button>
        </Link>
      </div>

      {/* 标题区域 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">开始创作</h1>
        </div>
        <p className="text-gray-500 ml-13">创建一个新的作品，让AI为您的灵感注入生命</p>
      </div>

      {/* 表单卡片 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              作品标题 <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              placeholder="为您的作品取一个吸引人的名字"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre" className="text-sm font-medium text-gray-700">
              作品类型
            </Label>
            <Input
              id="genre"
              placeholder="如：玄幻、科幻、言情、悬疑、都市..."
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="synopsis" className="text-sm font-medium text-gray-700">
              作品简介
            </Label>
            <Textarea
              id="synopsis"
              placeholder="简要描述您的故事背景、主要角色和情节走向..."
              value={formData.synopsis}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              rows={5}
              className="rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-cyan-400/20 transition-all resize-none"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建作品'
              )}
            </Button>
            <Link href="/novels">
              <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">
                取消
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* 提示卡片 */}
      <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-100/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-1">创作小贴士</h3>
            <p className="text-sm text-gray-600">
              详细的简介有助于AI更好地理解您的创作意图，生成更符合预期的内容。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
