'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2, FileText, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Novel } from '@/types'

export default function NovelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const novelId = params.id as string
  const [novel, setNovel] = useState<Novel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNovel()
  }, [novelId])

  const fetchNovel = async () => {
    try {
      const response = await fetch(`/api/novels/${novelId}`)
      if (response.ok) {
        const data = await response.json()
        setNovel(data.novel)
      } else {
        toast.error('作品不存在')
        router.push('/novels')
      }
    } catch (error) {
      console.error('Failed to fetch novel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-gray-400">加载中...</div>
  }

  if (!novel) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/novels">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{novel.title}</h1>
            <p className="text-gray-500 text-sm">{novel.genre || '未分类'}</p>
          </div>
        </div>
        <Link href={`/novels/${novel.id}/write`}>
          <Button className="h-11 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300">
            <Sparkles className="h-4 w-4 mr-2" />
            AI续写
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 作品信息卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">作品信息</h2>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">状态</p>
              <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full ${
                novel.status === 'published'
                  ? 'bg-emerald-50 text-emerald-600'
                  : novel.status === 'archived'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-amber-50 text-amber-600'
              }`}>
                {novel.status === 'published' ? '已发布' : novel.status === 'archived' ? '已归档' : '草稿'}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">总章节</p>
              <p className="text-2xl font-bold text-gray-800">{novel.chapters?.length || 0} <span className="text-sm font-normal text-gray-500">章</span></p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">创建时间</p>
              <p className="text-gray-700">{new Date(novel.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>

            <div className="pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">简介</p>
              <p className="text-gray-600 text-sm leading-relaxed">{novel.synopsis || '暂无简介'}</p>
            </div>
          </div>
        </div>

        {/* 章节列表 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">章节列表</h2>
              <p className="text-sm text-gray-500 mt-1">管理您的章节内容</p>
            </div>
            <Link href={`/novels/${novel.id}/write`}>
              <Button variant="outline" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-cyan-600 hover:border-cyan-200 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                新建章节
              </Button>
            </Link>
          </div>

          <ScrollArea className="h-[400px]">
            {novel.chapters && novel.chapters.length > 0 ? (
              <div className="space-y-3">
                {novel.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">
                          第{chapter.chapterNumber}章 {chapter.title || '无标题'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(chapter.createdAt).toLocaleDateString('zh-CN')} · {chapter.tokensUsed} tokens
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-cyan-500" />
                </div>
                <p className="text-gray-500 mb-4">还没有章节</p>
                <Link href={`/novels/${novel.id}/write`}>
                  <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI生成第一章
                  </Button>
                </Link>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
