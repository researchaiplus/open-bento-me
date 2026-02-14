// 统一的日志工具，支持环境感知和模块化日志记录
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 999 // 禁用所有日志
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const getCurrentLogLevel = (): LogLevel => {
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }
  // Default to 'warn' in production so info/debug are suppressed; 'debug' in dev
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
};

const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getCurrentLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

// 生成时间戳
const timestamp = () => new Date().toISOString();

// 增强的消息格式化函数，支持复杂数据
const formatMessage = (level: string, message: string, module?: string, data?: any): string => {
  let formattedMessage: string;
  
  // 根据环境选择不同的格式
  if (process.env.NODE_ENV === 'production') {
    formattedMessage = `[${level.toUpperCase()}]${module ? ` [${module}]` : ''} ${message}`;
  } else {
    formattedMessage = `[${timestamp()}] [${level.toUpperCase()}]${module ? ` [${module}]` : ''} ${message}`;
  }
  
  // 添加数据信息
  if (data !== undefined) {
    try {
      if (typeof data === 'object') {
        formattedMessage += ` | Data: ${JSON.stringify(data, null, 2)}`;
      } else {
        formattedMessage += ` | Data: ${data}`;
      }
    } catch (e) {
      formattedMessage += ` | Data: [Unserializable]`;
    }
  }
  
  return formattedMessage;
};

// 核心日志函数
const log = (level: LogLevel, message: string, module?: string, data?: any) => {
  if (shouldLog(level)) {
    const formattedMessage = formatMessage(level, message, module, data);
    
    // 使用相应的控制台方法
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }
};

// 创建特定模块的日志记录器
const createModuleLogger = (moduleName: string) => {
  return {
    debug: (message: string, data?: any) => log('debug', message, moduleName, data),
    info: (message: string, data?: any) => log('info', message, moduleName, data),
    warn: (message: string, data?: any) => log('warn', message, moduleName, data),
    error: (message: string, data?: any) => log('error', message, moduleName, data),
  };
};

// 向后兼容的直接函数导出
export const debug = (message: string, data?: any) => log('debug', message, undefined, data);
export const info = (message: string, data?: any) => log('info', message, undefined, data);
export const warn = (message: string, data?: any) => log('warn', message, undefined, data);
export const error = (message: string, data?: any) => log('error', message, undefined, data);

// 主要的 logger 对象，支持所有功能
export const logger = {
  debug: (message: string, data?: any) => log('debug', message, '', data),
  info: (message: string, data?: any) => log('info', message, '', data),
  warn: (message: string, data?: any) => log('warn', message, '', data),
  error: (message: string, data?: any) => log('error', message, '', data),
  
  // 创建特定模块的日志记录器
  forModule: (moduleName: string) => createModuleLogger(moduleName),
  
  // 向后兼容的API
  getLogFilePath: (filename: string) => `logs/${filename}`
};

// 默认导出，保持兼容性
export default logger;