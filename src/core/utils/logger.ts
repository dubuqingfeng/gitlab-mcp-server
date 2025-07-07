import pino from 'pino';

// 日志级别配置
const LOG_LEVELS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

// 根据环境变量获取日志级别
const getLogLevel = (): string => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  return level && level in LOG_LEVELS ? level : 'info';
};

// 创建日志传输配置
const getTransport = () => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境：使用 JSON 格式，可以配合日志收集系统
    return undefined;
  }
  
  // 开发环境：使用 pretty 格式
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      errorLikeObjectKeys: ['err', 'error'],
      singleLine: false,
    },
  };
};

// 创建基础日志配置
const baseOptions: pino.LoggerOptions = {
  level: getLogLevel(),
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // 生产环境的额外配置
  ...(process.env.NODE_ENV === 'production' && {
    redact: {
      paths: ['req.headers.authorization', '*.password', '*.token', '*.secret'],
      censor: '[REDACTED]',
    },
  }),
  transport: getTransport(),
};

// 创建主日志实例
const logger = pino.default(baseOptions);

// 创建带命名空间的子日志器工厂
export const createLogger = (namespace: string) => {
  return logger.child({ namespace });
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
export const console = {
  log: (...args: any[]) => logger.info(args.length === 1 ? args[0] : args),
  error: (...args: any[]) => logger.error(args.length === 1 ? args[0] : args),
  warn: (...args: any[]) => logger.warn(args.length === 1 ? args[0] : args),
  info: (...args: any[]) => logger.info(args.length === 1 ? args[0] : args),
  debug: (...args: any[]) => logger.debug(args.length === 1 ? args[0] : args),
  trace: (...args: any[]) => logger.trace(args.length === 1 ? args[0] : args),
};

// 导出日志级别类型
export type LogLevel = keyof typeof LOG_LEVELS;

// 导出 pino 类型，方便类型提示
export type Logger = pino.Logger;

// 默认导出主日志实例
export default logger; 