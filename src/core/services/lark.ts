import { loggers } from '../utils/logger.js';

export interface LarkConfig {
  webhookUrl?: string;
  secretKey?: string; // 可选：签名密钥
  enableNotification?: boolean;
}

export interface LarkMessageCard {
  config?: {
    wide_screen_mode?: boolean;
  };
  header?: {
    title: {
      content: string;
      tag: 'plain_text';
    };
    template?: string; // 颜色主题：blue, green, orange, red, grey, etc.
  };
  elements: LarkElement[];
}

export interface LarkElement {
  tag: string;
  content?: string;
  text?: {
    content: string;
    tag: 'plain_text' | 'lark_md';
  };
  fields?: Array<{
    is_short: boolean;
    text: {
      content: string;
      tag: 'plain_text' | 'lark_md';
    };
  }>;
  actions?: Array<{
    tag: 'button';
    text: {
      content: string;
      tag: 'plain_text';
    };
    url?: string;
    type?: string;
    value?: any;
  }>;
  elements?: Array<{
    tag: string;
    content: string;
  }>;
}

// 获取 Lark 配置
export const getLarkConfig = (): LarkConfig => {
  return {
    webhookUrl: process.env.LARK_WEBHOOK_URL,
    secretKey: process.env.LARK_SECRET_KEY,
    enableNotification: process.env.LARK_ENABLE_NOTIFICATION !== 'false'
  };
};

// 创建 Lark 客户端实例
export const getLarkClient = () => {
  const config = getLarkConfig();
  return new LarkClient(config);
};

export class LarkClient {
  private config: LarkConfig;

  constructor(config: LarkConfig) {
    this.config = config;
    loggers.gitlab.info('Lark client initialized', { 
      hasWebhook: !!config.webhookUrl,
      enableNotification: config.enableNotification 
    });
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!this.config.webhookUrl && this.config.enableNotification !== false;
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(content: string): Promise<void> {
    if (!this.config.webhookUrl || !this.config.enableNotification) {
      loggers.gitlab.debug('Lark notification skipped', { 
        hasWebhook: !!this.config.webhookUrl,
        enabled: this.config.enableNotification 
      });
      return;
    }

    const payload = {
      msg_type: 'text',
      content: {
        text: content
      }
    };

    await this.sendToWebhook(payload);
  }

  /**
   * 发送卡片消息
   */
  async sendCardMessage(card: LarkMessageCard): Promise<void> {
    if (!this.config.webhookUrl || !this.config.enableNotification) {
      loggers.gitlab.debug('Lark notification skipped', { 
        hasWebhook: !!this.config.webhookUrl,
        enabled: this.config.enableNotification 
      });
      return;
    }

    const payload = {
      msg_type: 'interactive',
      card: card
    };

    await this.sendToWebhook(payload);
  }

  /**
   * 构建 GitLab MR Note 卡片消息
   */
  buildMRNoteCard(params: {
    projectName: string;
    mrTitle: string;
    mrUrl: string;
    noteContent: string;
    author?: string;
    mrIid?: number;
  }): LarkMessageCard {
    const { projectName, mrTitle, mrUrl, noteContent, author, mrIid } = params;

    return {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          content: `🔔 GitLab MR 新评论`,
          tag: 'plain_text'
        },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**项目**: ${projectName}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'div',
          text: {
            content: `**MR**: #${mrIid} ${mrTitle}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            content: `**评论内容**:\n${this.formatNoteContent(noteContent)}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `评论者: ${author || 'System'} | 时间: ${new Date().toLocaleString('zh-CN')}`
            }
          ]
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                content: '查看 MR',
                tag: 'plain_text'
              },
              url: mrUrl,
              type: 'primary'
            }
          ]
        }
      ]
    };
  }

  /**
   * 格式化 Note 内容以适应 Lark 显示
   */
  private formatNoteContent(content: string): string {
    // 限制长度，避免消息过长
    const maxLength = 10000;
    let formatted = content;

    // 如果内容过长，截断并添加省略号
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength) + '...';
    }

    // 转换一些 Markdown 格式以更好地在 Lark 中显示
    formatted = formatted
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '`$2`') // 简化代码块
      .replace(/\n{3,}/g, '\n\n'); // 限制连续换行

    return formatted;
  }

  /**
   * 发送请求到 Webhook（带重试机制）
   */
  private async sendToWebhook(payload: any): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('Lark webhook URL not configured');
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 基础延迟 1 秒
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        // 如果配置了密钥，添加签名
        if (this.config.secretKey) {
          const sign = this.generateSign(timestamp, this.config.secretKey);
          payload.timestamp = timestamp.toString();
          payload.sign = sign;
        }

        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        loggers.gitlab.info('Lark API response', JSON.stringify({ 
          url: this.config.webhookUrl, 
          status: response.status,
          attempt: attempt + 1 
        }));

        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`Lark API error: ${response.status} - ${errorText}`);
          
          // 判断是否应该重试
          const shouldRetry = this.shouldRetryRequest(response.status, attempt, maxRetries);
          
          if (!shouldRetry) {
            loggers.gitlab.error('Lark API error (no retry)', JSON.stringify({ 
              url: this.config.webhookUrl, 
              status: response.status,
              error: errorText,
              attempt: attempt + 1
            }));
            throw lastError;
          }

          loggers.gitlab.warn('Lark API error (will retry)', JSON.stringify({ 
            url: this.config.webhookUrl, 
            status: response.status,
            error: errorText,
            attempt: attempt + 1,
            nextRetryIn: `${baseDelay * Math.pow(2, attempt)}ms`
          }));
          
          // 等待后重试
          await this.delay(baseDelay * Math.pow(2, attempt));
          continue;
        }

        const result = await response.json();
        if (result.code !== 0) {
          lastError = new Error(`Lark API error: ${result.msg || 'Unknown error'}`);
          
          // API 返回错误码，根据错误码判断是否重试
          const shouldRetry = this.shouldRetryApiError(result.code, attempt, maxRetries);
          
          if (!shouldRetry) {
            loggers.gitlab.error('Lark API error (no retry)', JSON.stringify({ 
              url: this.config.webhookUrl,
              code: result.code,
              msg: result.msg,
              attempt: attempt + 1
            }));
            throw lastError;
          }

          loggers.gitlab.warn('Lark API error (will retry)', JSON.stringify({ 
            url: this.config.webhookUrl,
            code: result.code,
            msg: result.msg,
            attempt: attempt + 1,
            nextRetryIn: `${baseDelay * Math.pow(2, attempt)}ms`
          }));
          
          await this.delay(baseDelay * Math.pow(2, attempt));
          continue;
        }

        loggers.gitlab.info('Lark notification sent successfully', { 
          attempt: attempt + 1 
        });
        return; // 成功，退出
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 网络错误等，判断是否重试
        if (attempt < maxRetries) {
          loggers.gitlab.warn('Failed to send Lark notification (will retry)', JSON.stringify({ 
            url: this.config.webhookUrl, 
            error: lastError.message,
            attempt: attempt + 1,
            nextRetryIn: `${baseDelay * Math.pow(2, attempt)}ms`
          }));
          
          await this.delay(baseDelay * Math.pow(2, attempt));
          continue;
        }
        
        loggers.gitlab.error('Failed to send Lark notification (all retries exhausted)', JSON.stringify({ 
          url: this.config.webhookUrl, 
          error: lastError.message,
          attempts: maxRetries + 1
        }));
        // 不抛出错误，避免影响主流程
        return;
      }
    }
  }

  /**
   * 判断 HTTP 状态码是否应该重试
   */
  private shouldRetryRequest(statusCode: number, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false;
    }
    
    // 5xx 服务器错误应该重试
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
    
    // 429 Too Many Requests 应该重试
    if (statusCode === 429) {
      return true;
    }
    
    // 408 Request Timeout 应该重试
    if (statusCode === 408) {
      return true;
    }
    
    // 其他 4xx 客户端错误不应该重试
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }
    
    return true;
  }

  /**
   * 判断 API 错误码是否应该重试
   */
  private shouldRetryApiError(code: number, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false;
    }
    
    // 根据飞书文档，某些错误码可能是临时的
    // 这里可以根据实际情况调整
    const retryableCodes = [
      50001, // 系统繁忙
      50002, // 请求频率超限
      // 添加其他可重试的错误码
    ];
    
    return retryableCodes.includes(code);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成签名（如果配置了密钥）
   */
  private generateSign(timestamp: number, secret: string): string {
    const crypto = require('crypto');
    const stringToSign = `${timestamp}\n${secret}`;
    const sign = crypto
      .createHmac('sha256', stringToSign)
      .digest('base64');
    return sign;
  }
}

// 保留兼容性：导出一个默认的 LarkService 类，使用单例模式
export class LarkService {
  private static client: LarkClient | null = null;

  private static getClient(): LarkClient {
    if (!this.client) {
      this.client = getLarkClient();
    }
    return this.client;
  }

  static initialize(config: LarkConfig) {
    this.client = new LarkClient(config);
  }

  static loadFromEnv() {
    this.client = getLarkClient();
  }

  static async sendTextMessage(content: string): Promise<void> {
    return this.getClient().sendTextMessage(content);
  }

  static async sendCardMessage(card: LarkMessageCard): Promise<void> {
    return this.getClient().sendCardMessage(card);
  }

  static buildMRNoteCard(params: {
    projectName: string;
    mrTitle: string;
    mrUrl: string;
    noteContent: string;
    author?: string;
    mrIid?: number;
  }): LarkMessageCard {
    return this.getClient().buildMRNoteCard(params);
  }

  static isConfigured(): boolean {
    return this.getClient().isConfigured();
  }
}

// 初始化时自动从环境变量加载配置
LarkService.loadFromEnv(); 