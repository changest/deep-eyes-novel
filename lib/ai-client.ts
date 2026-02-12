export type AIProvider = 'openai' | 'kimi' | 'anthropic' | 'custom'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIGenerateOptions {
  temperature?: number
  max_tokens?: number
  model?: string
  stream?: boolean
}

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model: string
}

export const systemPrompt = `你是一位专业网络小说作家，擅长创作吸引读者的长篇连载小说。
要求：
- 情节紧凑，每章都有冲突或转折
- 人物对话生动自然
- 环境描写细腻但不拖沓
- 根据指定风格调整文笔 (玄幻/科幻/言情/悬疑等)
- 每章字数控制在3000-5000字

请直接输出小说内容，不要包含任何解释性文字。`

// 预设配置
export const providerPresets: Record<AIProvider, { name: string; baseUrl: string; models: string[] }> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k']
  },
  kimi: {
    name: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  },
  custom: {
    name: '自定义 API',
    baseUrl: '',
    models: ['自定义模型']
  }
}

class AIClient {
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl
    }
    return providerPresets[this.config.provider].baseUrl
  }

  private buildRequestBody(messages: AIMessage[], options: AIGenerateOptions) {
    const { provider } = this.config

    // OpenAI 兼容格式 (包括 Kimi、自定义API)
    if (provider === 'openai' || provider === 'kimi' || provider === 'custom') {
      return {
        model: options.model || this.config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 4096,
        stream: options.stream ?? true,
      }
    }

    // Anthropic 格式
    if (provider === 'anthropic') {
      const systemMessage = messages.find(m => m.role === 'system')
      const userMessages = messages.filter(m => m.role !== 'system')

      return {
        model: options.model || this.config.model,
        system: systemMessage?.content,
        messages: userMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 4096,
        stream: options.stream ?? true,
      }
    }

    throw new Error(`Unsupported provider: ${provider}`)
  }

  private getHeaders(): Record<string, string> {
    const { provider } = this.config

    if (provider === 'anthropic') {
      return {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      }
    }

    // OpenAI 兼容格式
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    }
  }

  private getEndpoint(): string {
    const baseUrl = this.getBaseUrl()

    if (this.config.provider === 'anthropic') {
      return `${baseUrl}/messages`
    }

    // OpenAI 兼容格式
    return `${baseUrl}/chat/completions`
  }

  async *streamGenerate(
    messages: AIMessage[],
    options: AIGenerateOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(this.buildRequestBody(messages, options)),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        if (this.config.provider === 'anthropic') {
          // Anthropic SSE 格式
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') return

              try {
                const parsed = JSON.parse(data)
                const content = parsed.delta?.text
                if (content) yield content
              } catch {
                // Ignore parse errors
              }
            }
          }
        } else {
          // OpenAI 兼容格式
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') return

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) yield content
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async generateNonStream(
    messages: AIMessage[],
    options: AIGenerateOptions = {}
  ): Promise<string> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(this.buildRequestBody(messages, { ...options, stream: false })),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${error}`)
    }

    const data = await response.json()

    if (this.config.provider === 'anthropic') {
      return data.content?.[0]?.text || ''
    }

    // OpenAI 兼容格式
    return data.choices?.[0]?.message?.content || ''
  }
}

// 创建客户端实例
export function createAIClient(config: AIConfig): AIClient {
  return new AIClient(config)
}

// 简单的 API Key 加密（Base64，实际生产环境应使用更安全的加密方式）
export function encryptApiKey(apiKey: string): string {
  return Buffer.from(apiKey).toString('base64')
}

export function decryptApiKey(encryptedKey: string): string {
  return Buffer.from(encryptedKey, 'base64').toString('utf-8')
}
