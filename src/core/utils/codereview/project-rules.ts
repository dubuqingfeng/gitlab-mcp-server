/**
 * Project-specific code review rules configuration
 * 项目特定的代码审查规则配置
 */

import { CodeReviewRule } from './rules.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loggers } from '../logger.js';

export interface ProjectSpecificConfig {
  /** 项目标识符 (例如: gitlab项目路径 'group/project' 或项目ID) */
  projectIdentifier: string | number;
  /** 项目名称 */
  projectName: string;
  /** 项目描述 */
  description?: string;
  /** 项目特定的规则 */
  rules: CodeReviewRule[];
  /** 是否启用默认规则 */
  enableDefaultRules?: boolean;
  /** 要排除的默认规则ID列表 */
  excludeDefaultRules?: string[];
  /** 额外的项目类型（会自动检测，这里可以手动添加） */
  additionalProjectTypes?: string[];
}

/**
 * 从外部配置文件加载项目规则
 */
function loadExternalRules(): Record<string, ProjectSpecificConfig> {
  const configPaths = [
    join(process.cwd(), 'project-rules.config.json'),
    join(process.cwd(), 'config', 'project-rules.json'),
    join(process.cwd(), '.mcp', 'project-rules.json')
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);
        loggers.logger.info(`Loaded project-specific rules from: ${configPath}`);
        return config.projects || {};
      } catch (error) {
        loggers.logger.error(`Failed to load project rules from ${configPath}:`, error);
      }
    }
  }

  loggers.logger.info('No external project rules configuration found, using built-in defaults');
  return {};
}

/**
 * 内置的项目特定规则配置（作为默认值）
 */
const BUILTIN_PROJECT_RULES: Record<string, ProjectSpecificConfig> = {
  // 示例：Node.js 后端项目
  'backend/api-service': {
    projectIdentifier: 'backend/api-service',
    projectName: 'API Service',
    description: '后端API服务项目',
    enableDefaultRules: true,
    excludeDefaultRules: ['no-any-type'], // 排除某些默认规则
    additionalProjectTypes: ['backend', 'node'],
    rules: [
      {
        id: 'api-rate-limiting',
        title: 'API Rate Limiting',
        description: '确保所有公开API端点都有速率限制保护',
        severity: 'error',
        category: 'security',
        applicableFiles: ['**/controllers/*.js', '**/routes/*.js'],
        projectTypes: ['backend']
      },
      {
        id: 'api-auth-check',
        title: 'API Authentication Check',
        description: '检查所有需要认证的端点是否正确使用了认证中间件',
        severity: 'error',
        category: 'security',
        applicableFiles: ['**/routes/*.js', '**/middleware/*.js'],
        projectTypes: ['backend']
      },
      {
        id: 'api-response-format',
        title: 'API Response Format',
        description: '保持API响应格式一致，使用标准的响应结构',
        severity: 'warning',
        category: 'maintainability',
        applicableFiles: ['**/controllers/*.js'],
        projectTypes: ['backend']
      },
      {
        id: 'database-transaction',
        title: 'Database Transaction Management',
        description: '涉及多个数据库操作时必须使用事务',
        severity: 'error',
        category: 'best-practice',
        applicableFiles: ['**/services/*.js', '**/models/*.js'],
        projectTypes: ['backend']
      }
    ]
  },

  // 示例：React 前端项目
  'frontend/web-app': {
    projectIdentifier: 'frontend/web-app',
    projectName: 'Web Application',
    description: '前端Web应用项目',
    enableDefaultRules: true,
    additionalProjectTypes: ['react', 'typescript'],
    rules: [
      {
        id: 'component-folder-structure',
        title: 'Component Folder Structure',
        description: '组件应该有统一的文件夹结构：Component/index.tsx, Component/styles.ts, Component/types.ts',
        severity: 'warning',
        category: 'maintainability',
        applicableFiles: ['**/components/**/*.tsx'],
        projectTypes: ['react']
      },
      {
        id: 'use-custom-hooks',
        title: 'Use Custom Hooks',
        description: '复杂的状态逻辑应该提取到自定义Hook中',
        severity: 'info',
        category: 'best-practice',
        applicableFiles: ['**/components/**/*.tsx', '**/hooks/*.ts'],
        projectTypes: ['react']
      },
      {
        id: 'accessibility-requirements',
        title: 'Accessibility Requirements',
        description: '确保所有交互元素都有适当的ARIA标签和键盘支持',
        severity: 'warning',
        category: 'best-practice',
        applicableFiles: ['**/components/**/*.tsx'],
        projectTypes: ['react']
      }
    ]
  },

  // 示例：Go 微服务项目
  'microservices/payment-service': {
    projectIdentifier: 'microservices/payment-service',
    projectName: 'Payment Service',
    description: '支付微服务项目',
    enableDefaultRules: true,
    additionalProjectTypes: ['go', 'backend'],
    rules: [
      {
        id: 'payment-security-audit',
        title: 'Payment Security Audit',
        description: '支付相关代码必须进行严格的安全审计，包括加密、日志脱敏等',
        severity: 'error',
        category: 'security',
        applicableFiles: ['**/payment/*.go', '**/transaction/*.go'],
        projectTypes: ['go']
      },
      {
        id: 'payment-idempotency',
        title: 'Payment Idempotency',
        description: '所有支付操作必须实现幂等性',
        severity: 'error',
        category: 'best-practice',
        applicableFiles: ['**/handlers/*.go', '**/services/*.go'],
        projectTypes: ['go']
      },
      {
        id: 'payment-logging',
        title: 'Payment Transaction Logging',
        description: '所有支付交易必须有完整的日志记录，但要注意敏感信息脱敏',
        severity: 'error',
        category: 'security',
        applicableFiles: ['**/payment/*.go', '**/logger/*.go'],
        projectTypes: ['go']
      }
    ]
  },

  // 示例：Blockchain 项目
  'blockchain/smart-contracts': {
    projectIdentifier: 'blockchain/smart-contracts',
    projectName: 'Smart Contracts',
    description: '智能合约项目',
    enableDefaultRules: false, // 智能合约有特殊规则，不使用默认规则
    rules: [
      {
        id: 'reentrancy-guard',
        title: 'Reentrancy Guard',
        description: '确保所有外部调用都有重入保护',
        severity: 'error',
        category: 'security',
        applicableFiles: ['*.sol'],
        projectTypes: ['solidity']
      },
      {
        id: 'overflow-protection',
        title: 'Integer Overflow Protection',
        description: '使用 SafeMath 或 Solidity 0.8+ 的内置溢出保护',
        severity: 'error',
        category: 'security',
        applicableFiles: ['*.sol'],
        projectTypes: ['solidity']
      },
      {
        id: 'gas-optimization',
        title: 'Gas Optimization',
        description: '优化存储使用和循环操作以减少 gas 消耗',
        severity: 'warning',
        category: 'performance',
        applicableFiles: ['*.sol'],
        projectTypes: ['solidity']
      }
    ]
  }
};

/**
 * 合并内置规则和外部配置的规则
 * 外部配置的规则会覆盖同名的内置规则
 */
export const PROJECT_SPECIFIC_RULES: Record<string, ProjectSpecificConfig> = {
  ...BUILTIN_PROJECT_RULES,
  ...loadExternalRules()
};

/**
 * 根据项目标识符获取项目特定规则
 */
export function getProjectSpecificRules(projectIdentifier: string | number): ProjectSpecificConfig | null {
  // 先尝试直接匹配
  if (PROJECT_SPECIFIC_RULES[String(projectIdentifier)]) {
    return PROJECT_SPECIFIC_RULES[String(projectIdentifier)];
  }

  // 尝试查找匹配的项目
  for (const [key, config] of Object.entries(PROJECT_SPECIFIC_RULES)) {
    if ((config as ProjectSpecificConfig).projectIdentifier === projectIdentifier) {
      return config as ProjectSpecificConfig;
    }
  }

  return null;
}

/**
 * 获取所有已配置的项目列表
 */
export function getConfiguredProjects(): Array<{
  identifier: string | number;
  name: string;
  description?: string;
  ruleCount: number;
}> {
  return Object.values(PROJECT_SPECIFIC_RULES).map(config => ({
    identifier: config.projectIdentifier,
    name: config.projectName,
    description: config.description,
    ruleCount: config.rules.length
  }));
}

/**
 * 合并项目特定规则和默认规则
 */
export function mergeProjectRules(
  projectConfig: ProjectSpecificConfig,
  defaultRules: CodeReviewRule[]
): CodeReviewRule[] {
  const mergedRules: Map<string, CodeReviewRule> = new Map();

  // 如果启用默认规则，先添加默认规则
  if (projectConfig.enableDefaultRules !== false) {
    defaultRules.forEach(rule => {
      // 检查是否在排除列表中
      if (!projectConfig.excludeDefaultRules?.includes(rule.id)) {
        mergedRules.set(rule.id, rule);
      }
    });
  }

  // 添加项目特定规则（可能会覆盖默认规则）
  projectConfig.rules.forEach(rule => {
    mergedRules.set(rule.id, rule);
  });

  return Array.from(mergedRules.values());
} 