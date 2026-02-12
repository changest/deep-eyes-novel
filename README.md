# 深瞳 (Shentong)

> 用AI点亮创作灵感

一个基于 Next.js + Kimi API 的全栈AI小说创作平台，采用魅族式设计美学，支持AI辅助创作、作品管理、配额控制等功能。

## 功能特性

- 🔐 **用户认证** - JWT Token认证，支持登录/注册
- 🤖 **AI生成** - 基于Kimi API的流式文本生成
- 📚 **小说管理** - 创建、编辑、删除小说项目
- 📝 **章节管理** - 章节CRUD，支持查看历史章节
- 💰 **配额系统** - 每日Token限额，使用统计
- 📤 **导出功能** - 支持导出为Markdown/TXT格式
- 🎨 **魅族美学** - 简洁优雅的界面设计

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Next.js API Routes
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma
- **AI API**: Kimi (Moonshot AI)

## 快速开始

### 1. 安装依赖

```bash
cd novel-ai
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并配置您的API密钥：

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"

# AI API - 已配置您的Kimi API Key
KIMI_API_KEY="sk-ttiNDgoZqi6nAXnyBzJn7A1yhpxSgde6rfMJ2oYo5Ln6HU5O"
KIMI_BASE_URL="https://api.moonshot.cn/v1"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 使用指南

### 1. 注册/登录
- 首次使用需要注册账号
- 默认每日Token限额为50,000

### 2. 创建小说
- 点击"新建小说"按钮
- 填写标题、类型和简介

### 3. AI写作
- 进入小说详情页，点击"AI续写"
- 在左侧面板输入写作提示
- 调整创意度参数（Temperature）
- 点击"开始生成"等待AI输出
- 可暂停/继续生成过程

### 4. 保存章节
- 生成完成后点击"保存到章节"
- 章节会自动编号并关联到当前小说

### 5. 导出内容
- 生成或编辑完成后可导出为Markdown或TXT格式

## 项目结构

```
novel-ai/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证路由组
│   ├── (dashboard)/       # 主应用路由组
│   ├── api/               # API路由
│   └── layout.tsx         # 根布局
├── components/            # React组件
│   ├── ui/               # shadcn/ui组件
│   ├── layout/           # 布局组件
│   └── novel/            # 小说相关组件
├── lib/                   # 工具库
│   ├── prisma.ts         # Prisma客户端
│   ├── auth.ts           # JWT工具
│   └── kimi.ts           # Kimi API封装
├── types/                 # TypeScript类型
└── prisma/
    └── schema.prisma     # 数据库模型
```

## API端点

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/auth/login | POST | 用户登录 |
| /api/auth/register | POST | 用户注册 |
| /api/auth/refresh | POST | 刷新Token |
| /api/auth/logout | POST | 退出登录 |
| /api/novels | GET/POST | 小说列表/创建 |
| /api/novels/[id] | GET/PUT/DELETE | 小说详情/更新/删除 |
| /api/novels/[id]/chapters | GET/POST | 章节列表/创建 |
| /api/novels/[id]/generate | POST | AI生成内容（流式） |
| /api/user/quota | GET | 用户配额信息 |

## 部署

### Vercel部署

1. 推送代码到GitHub
2. 在Vercel导入项目
3. 配置环境变量
4. 部署

### 数据库迁移（生产）

```bash
# 将SQLite切换到PostgreSQL
# 修改 prisma/schema.prisma:
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }

npx prisma migrate deploy
```

## 注意事项

1. **API Key安全** - 不要将Kimi API Key暴露到前端
2. **配额管理** - 免费用户每日50,000 tokens限额
3. **流式生成** - AI生成使用Server-Sent Events实现实时输出

## License

MIT
