'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, MoreVertical, Trash2, Edit, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Novel } from '@/types'

export default function NovelsPage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNovels()
  }, [])

  const fetchNovels = async () => {
    try {
      const response = await fetch('/api/novels')
      if (response.ok) {
        const data = await response.json()
        setNovels(data.novels || [])
      }
    } catch (error) {
      console.error('Failed to fetch novels:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个作品吗？此操作不可撤销。')) return

    try {
      const response = await fetch(`/api/novels/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('作品已删除')
        setNovels(novels.filter(n => n.id !== id))
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的作品</h1>
          <p className="text-gray-500 mt-1">管理您的所有创作项目</p>
        </div>
        <Link href="/novels/new">
          <Button className="h-11 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            开始创作
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-12">加载中...</div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {novels.map((novel) => (
            <div
              key={novel.id}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate group-hover:text-cyan-600 transition-colors">
                    {novel.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {novel.genre || '未分类'} · {novel._count?.chapters || 0} 章节
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border-gray-100 rounded-xl shadow-lg">
                    <DropdownMenuItem asChild>
                      <Link href={`/novels/${novel.id}`} className="text-gray-700 hover:text-cyan-600 rounded-lg cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(novel.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-gray-400 line-clamp-2 mb-5 min-h-[40px]">
                {novel.synopsis || '暂无简介'}
              </p>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                  novel.status === 'published'
                    ? 'bg-emerald-50 text-emerald-600'
                    : novel.status === 'archived'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {novel.status === 'published' ? '已发布' : novel.status === 'archived' ? '已归档' : '草稿'}
                </span>
                <Link href={`/novels/${novel.id}`}>
                  <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-cyan-600 hover:border-cyan-200 transition-all">
                    查看详情
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-white/50 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-cyan-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有创建作品</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            开始创作您的第一部作品，让AI为您的灵感注入生命
          </p>
          <Link href="/novels/new">
            <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              创建第一本小说
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
