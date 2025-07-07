/**
 * 日志使用示例
 * 展示如何使用增强的日志系统
 */

// 方式1：使用默认日志器
import logger from './logger.js';

// 方式2：使用预定义的模块日志器
import { loggers } from './logger.js';

// 方式3：创建自定义命名空间的日志器
import { createLogger } from './logger.js';

// 方式4：使用 console 兼容层（快速迁移）
import { console } from './logger.js';

// 示例：使用默认日志器
export function exampleDefaultLogger() {
  logger.info('这是一条信息日志');
  logger.warn('这是一条警告日志');
  logger.error('这是一条错误日志');
  
  // 带上下文信息
  logger.info({ userId: 123, action: 'login' }, '用户登录');
  
  // 错误日志最佳实践
  try {
    throw new Error('示例错误');
  } catch (err) {
    logger.error({ err }, '捕获到错误');
  }
}

// 示例：使用模块日志器
export function exampleModuleLogger() {
  const serverLogger = loggers.server;
  const gitlabLogger = loggers.gitlab;
  
  serverLogger.info('服务器启动中...');
  serverLogger.debug({ port: 3000, env: 'development' }, '服务器配置');
  
  gitlabLogger.info({ projectId: 123, mrId: 456 }, '获取 MR 信息');
  gitlabLogger.error({ err: new Error('API 错误') }, 'GitLab API 调用失败');
}

// 示例：创建自定义日志器
export function exampleCustomLogger() {
  const authLogger = createLogger('auth');
  const dbLogger = createLogger('database');
  
  authLogger.info({ username: 'user@example.com' }, '用户尝试登录');
  authLogger.warn({ attempts: 3 }, '登录失败次数过多');
  
  dbLogger.debug({ query: 'SELECT * FROM users', duration: 125 }, 'SQL 查询执行');
  dbLogger.error({ connection: 'timeout' }, '数据库连接失败');
}

// 示例：使用 console 兼容层（用于快速迁移）
export function exampleConsoleCompat() {
  // 直接替换原有的 console.log
  console.log('简单的日志信息');
  console.error('错误信息');
  console.warn('警告信息');
  console.debug('调试信息');
  
  // 支持多参数
  console.log('用户', { id: 123 }, '执行了操作');
}

// 示例：日志级别控制
export function exampleLogLevels() {
  // 设置环境变量 LOG_LEVEL=debug 可以看到所有日志
  // 设置环境变量 LOG_LEVEL=warn 只能看到 warn 及以上级别
  
  logger.trace('最详细的跟踪信息'); // 只在 LOG_LEVEL=trace 时显示
  logger.debug('调试信息'); // 在 LOG_LEVEL=debug 或更低时显示
  logger.info('一般信息'); // 默认级别
  logger.warn('警告信息');
  logger.error('错误信息');
  logger.fatal('致命错误'); // 最高级别
}

// 示例：结构化日志（推荐）
export function exampleStructuredLogging() {
  // 不推荐：字符串拼接
  // logger.info('User ' + userId + ' logged in from ' + ip);
  
  // 推荐：结构化日志
  logger.info(
    {
      userId: 123,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date().toISOString()
    },
    '用户登录事件'
  );
  
  // 性能监控示例
  const startTime = Date.now();
  // ... 执行一些操作
  const duration = Date.now() - startTime;
  
  logger.info(
    {
      operation: 'database_query',
      duration,
      query: 'SELECT * FROM users',
      rowCount: 100
    },
    '数据库查询完成'
  );
}

// 示例：生产环境的敏感信息处理
export function exampleSensitiveData() {
  // 在生产环境，这些敏感字段会被自动隐藏
  logger.info({
    user: {
      id: 123,
      email: 'user@example.com',
      password: 'secret123', // 会被隐藏为 [REDACTED]
      token: 'abc123xyz', // 会被隐藏为 [REDACTED]
    }
  }, '用户信息');
}

// 使用建议：
// 1. 优先使用模块日志器（loggers.xxx）或创建专属日志器
// 2. 使用结构化日志而不是字符串拼接
// 3. 错误日志始终使用 { err } 或 { error } 字段
// 4. 添加足够的上下文信息便于调试
// 5. 合理使用日志级别
// 6. 在生产环境注意敏感信息保护 