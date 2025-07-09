// 简单的日志实现，不依赖任何外部库

// 保存原生的 console 方法引用，防止循环依赖
const nativeConsole = {
  log: globalThis.console.log.bind(globalThis.console),
  error: globalThis.console.error.bind(globalThis.console),
  warn: globalThis.console.warn.bind(globalThis.console),
  info: globalThis.console.info.bind(globalThis.console),
  debug: globalThis.console.debug.bind(globalThis.console),
  trace: globalThis.console.trace.bind(globalThis.console),
};

// 日志级别配置
const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

// 日志颜色配置（使用 ANSI 颜色代码）
const LOG_COLORS = {
  fatal: '\x1b[35m', // Magenta
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[32m', // Green
  trace: '\x1b[90m', // Gray
  reset: '\x1b[0m',  // Reset
} as const;

// 根据环境变量获取日志级别
const getLogLevel = (): string => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  return level && level in LOG_LEVELS ? level : 'info';
};

// 日志级别类型
export type LogLevel = keyof typeof LOG_LEVELS;

// Logger 接口
export interface Logger {
  fatal: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
  child: (bindings: Record<string, any>) => Logger;
}

// 创建日志器类
class SimpleLogger implements Logger {
  private namespace?: string;
  private currentLevel: LogLevel;
  private useColors: boolean;

  constructor(namespace?: string) {
    this.namespace = namespace;
    this.currentLevel = getLogLevel() as LogLevel;
    this.useColors = process.env.NODE_ENV !== 'production' && process.stdout.isTTY;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, args: any[]): string {
    const timestamp = this.formatTimestamp();
    const namespace = this.namespace ? `[${this.namespace}]` : '';
    const levelStr = level.toUpperCase().padEnd(5);
    
    // 处理错误对象
    const formattedArgs = args.map(arg => {
      if (arg && typeof arg === 'object') {
        if (arg.err || arg.error) {
          const error = arg.err || arg.error;
          if (error instanceof Error) {
            return `${error.message}\n${error.stack}`;
          }
        }
        // 对于普通对象，如果只有一个参数且是对象，展开它
        if (args.length === 1 && !Array.isArray(arg)) {
          return JSON.stringify(arg, null, 2);
        }
      }
      return arg;
    });

    const message = formattedArgs.join(' ');
    
    if (this.useColors) {
      const color = LOG_COLORS[level];
      return `${LOG_COLORS.reset}${timestamp} ${color}${levelStr}${LOG_COLORS.reset} ${namespace} ${message}`;
    }
    
    return `${timestamp} ${levelStr} ${namespace} ${message}`;
  }

  private log(level: LogLevel, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const message = this.formatMessage(level, args);
    
    // 使用适当的 console 方法
    switch (level) {
      case 'fatal':
      case 'error':
        nativeConsole.error(message);
        break;
      case 'warn':
        nativeConsole.warn(message);
        break;
      default:
        nativeConsole.log(message);
    }
  }

  fatal(...args: any[]): void {
    this.log('fatal', ...args);
  }

  error(...args: any[]): void {
    this.log('error', ...args);
  }

  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  info(...args: any[]): void {
    this.log('info', ...args);
  }

  debug(...args: any[]): void {
    this.log('debug', ...args);
  }

  trace(...args: any[]): void {
    this.log('trace', ...args);
  }

  child(bindings: Record<string, any>): Logger {
    // 简单实现：添加命名空间
    const childNamespace = bindings.namespace || this.namespace;
    return new SimpleLogger(childNamespace);
  }
}

// 创建主日志实例
const logger = new SimpleLogger();

// 创建带命名空间的子日志器工厂
export const createLogger = (namespace: string): Logger => {
  return new SimpleLogger(namespace);
};

// 常用模块的预定义日志器
export const loggers = {
  server: createLogger('server'),
  gitlab: createLogger('gitlab'),
  tools: createLogger('tools'),
  utils: createLogger('utils'),
  logger: logger,
};

// Console 兼容层 - 用于快速替换 console.log
export const loggerConsole = {
  log: (...args: any[]) => logger.info(...args),
  error: (...args: any[]) => logger.error(...args),
  warn: (...args: any[]) => logger.warn(...args),
  info: (...args: any[]) => logger.info(...args),
  debug: (...args: any[]) => logger.debug(...args),
  trace: (...args: any[]) => logger.trace(...args),
};

// 默认导出主日志实例
export default logger; 