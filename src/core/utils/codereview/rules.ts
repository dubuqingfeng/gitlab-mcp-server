// Code review rules for different project types and file extensions

export interface CodeReviewRule {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'security' | 'performance' | 'maintainability' | 'style' | 'best-practice';
  applicableFiles?: string[]; // file extensions or patterns
  projectTypes?: string[]; // project types this rule applies to
}

export interface ProjectTypeConfig {
  name: string;
  description: string;
  patterns: string[]; // patterns to identify this project type
  defaultRules: string[]; // rule IDs that apply by default
}

// Define all available code review rules
export const CODE_REVIEW_RULES: Record<string, CodeReviewRule> = {
  // TypeScript/JavaScript rules
  'ts-strict-mode': {
    id: 'ts-strict-mode',
    title: 'TypeScript Strict Mode',
    description: 'Ensure TypeScript strict mode is enabled for better type safety',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.ts', '*.tsx'],
    projectTypes: ['typescript', 'react', 'node']
  },
  'no-any-type': {
    id: 'no-any-type',
    title: 'Avoid any Type',
    description: 'Avoid using "any" type, prefer specific types or unknown',
    severity: 'warning',
    category: 'maintainability',
    applicableFiles: ['*.ts', '*.tsx'],
    projectTypes: ['typescript', 'react', 'node']
  },
  'async-await-best-practice': {
    id: 'async-await-best-practice',
    title: 'Async/Await Best Practices',
    description: 'Use proper error handling with async/await, avoid mixing with .then()',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.ts', '*.tsx', '*.js', '*.jsx'],
    projectTypes: ['typescript', 'javascript', 'react', 'node']
  },
  'environment-variables': {
    id: 'environment-variables',
    title: 'Environment Variables Validation',
    description: 'Validate environment variables at startup and provide defaults',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*.ts', '*.js'],
    projectTypes: ['node', 'backend']
  },

  // React specific rules
  'react-hooks-dependencies': {
    id: 'react-hooks-dependencies',
    title: 'React Hooks Dependencies',
    description: 'Ensure all dependencies are included in useEffect, useMemo, useCallback dependency arrays',
    severity: 'error',
    category: 'best-practice',
    applicableFiles: ['*.tsx', '*.jsx'],
    projectTypes: ['react']
  },
  'react-key-prop': {
    id: 'react-key-prop',
    title: 'React Key Prop',
    description: 'Provide unique key prop for list items, avoid using array index',
    severity: 'warning',
    category: 'performance',
    applicableFiles: ['*.tsx', '*.jsx'],
    projectTypes: ['react']
  },
  'react-component-naming': {
    id: 'react-component-naming',
    title: 'React Component Naming',
    description: 'Use PascalCase for React components and meaningful names',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*.tsx', '*.jsx'],
    projectTypes: ['react']
  },

  // Go specific rules
  'go-error-handling': {
    id: 'go-error-handling',
    title: 'Go Error Handling',
    description: 'Always handle errors explicitly, avoid ignoring them with _',
    severity: 'error',
    category: 'best-practice',
    applicableFiles: ['*.go'],
    projectTypes: ['go']
  },
  'go-context-usage': {
    id: 'go-context-usage',
    title: 'Go Context Usage',
    description: 'Pass context as first parameter in functions that need it',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.go'],
    projectTypes: ['go']
  },
  'go-interface-naming': {
    id: 'go-interface-naming',
    title: 'Go Interface Naming',
    description: 'Interface names should end with -er when possible (e.g., Reader, Writer)',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*.go'],
    projectTypes: ['go']
  },

  // Python specific rules
  'python-type-hints': {
    id: 'python-type-hints',
    title: 'Python Type Hints',
    description: 'Use type hints for function parameters and return values',
    severity: 'warning',
    category: 'maintainability',
    applicableFiles: ['*.py'],
    projectTypes: ['python']
  },
  'python-docstrings': {
    id: 'python-docstrings',
    title: 'Python Docstrings',
    description: 'Provide docstrings for public functions and classes',
    severity: 'info',
    category: 'maintainability',
    applicableFiles: ['*.py'],
    projectTypes: ['python']
  },
  'python-exception-handling': {
    id: 'python-exception-handling',
    title: 'Python Exception Handling',
    description: 'Catch specific exceptions instead of bare except clauses',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.py'],
    projectTypes: ['python']
  },

  // Rust specific rules
  'rust-error-handling': {
    id: 'rust-error-handling',
    title: 'Rust Error Handling',
    description: 'Use Result<T, E> for recoverable errors and proper error propagation with ?',
    severity: 'error',
    category: 'best-practice',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-option-handling': {
    id: 'rust-option-handling',
    title: 'Rust Option Handling',
    description: 'Prefer pattern matching or combinator methods over unwrap() for Option types',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-ownership-borrowing': {
    id: 'rust-ownership-borrowing',
    title: 'Rust Ownership and Borrowing',
    description: 'Use borrowing (&) instead of moving when possible, avoid unnecessary clones',
    severity: 'warning',
    category: 'performance',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-lifetime-management': {
    id: 'rust-lifetime-management',
    title: 'Rust Lifetime Management',
    description: 'Use explicit lifetime annotations when necessary and prefer static lifetimes for constants',
    severity: 'warning',
    category: 'maintainability',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-memory-safety': {
    id: 'rust-memory-safety',
    title: 'Rust Memory Safety',
    description: 'Avoid unsafe code unless absolutely necessary, document unsafe blocks thoroughly',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-concurrency': {
    id: 'rust-concurrency',
    title: 'Rust Concurrency Safety',
    description: 'Use thread-safe types (Arc, Mutex) for shared data, prefer channels for communication',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-performance-clones': {
    id: 'rust-performance-clones',
    title: 'Rust Performance - Avoid Unnecessary Clones',
    description: 'Minimize clone() calls, use references or move semantics appropriately',
    severity: 'warning',
    category: 'performance',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-naming-conventions': {
    id: 'rust-naming-conventions',
    title: 'Rust Naming Conventions',
    description: 'Use snake_case for functions/variables, PascalCase for types, SCREAMING_SNAKE_CASE for constants',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-module-organization': {
    id: 'rust-module-organization',
    title: 'Rust Module Organization',
    description: 'Organize code into logical modules, use pub carefully for API design',
    severity: 'info',
    category: 'maintainability',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-clippy-lints': {
    id: 'rust-clippy-lints',
    title: 'Rust Clippy Lints',
    description: 'Address Clippy warnings and suggestions, use #[allow] sparingly with justification',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-documentation': {
    id: 'rust-documentation',
    title: 'Rust Documentation',
    description: 'Provide documentation comments (///) for public APIs, include examples in doc tests',
    severity: 'info',
    category: 'maintainability',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },
  'rust-testing': {
    id: 'rust-testing',
    title: 'Rust Testing',
    description: 'Write unit tests with #[test], integration tests in tests/ directory, use #[cfg(test)]',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.rs'],
    projectTypes: ['rust']
  },

  // Shell Script specific rules
  'sh-shebang': {
    id: 'sh-shebang',
    title: 'Shell Script Shebang',
    description: 'Always include shebang (#!/bin/bash or #!/bin/sh) at the top of shell scripts',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },
  'sh-error-handling': {
    id: 'sh-error-handling',
    title: 'Shell Script Error Handling',
    description: 'Use "set -e" to exit on error, "set -u" for undefined variables, and proper error checking',
    severity: 'error',
    category: 'best-practice',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },
  'sh-variable-quoting': {
    id: 'sh-variable-quoting',
    title: 'Shell Variable Quoting',
    description: 'Always quote variables to prevent word splitting and globbing: "$VAR" not $VAR',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },
  'sh-command-substitution': {
    id: 'sh-command-substitution',
    title: 'Shell Command Substitution',
    description: 'Use $(command) instead of `command` for better readability and nesting',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },
  'sh-function-naming': {
    id: 'sh-function-naming',
    title: 'Shell Function Naming',
    description: 'Use snake_case for function names and avoid spaces in function declarations',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },
  'sh-array-handling': {
    id: 'sh-array-handling',
    title: 'Shell Array Handling',
    description: 'Use "${array[@]}" to properly expand arrays, avoid unquoted array expansions',
    severity: 'warning',
    category: 'best-practice',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },
  'sh-portability': {
    id: 'sh-portability',
    title: 'Shell Script Portability',
    description: 'Avoid bash-specific features if using #!/bin/sh, use POSIX-compliant syntax',
    severity: 'warning',
    category: 'maintainability',
    applicableFiles: ['*.sh'],
    projectTypes: ['sh']
  },
  'sh-debugging': {
    id: 'sh-debugging',
    title: 'Shell Script Debugging',
    description: 'Consider using "set -x" for debugging, but remove or make conditional in production',
    severity: 'info',
    category: 'best-practice',
    applicableFiles: ['*.sh', '*.bash'],
    projectTypes: ['sh']
  },

  // Security rules (universal)
  'no-hardcoded-secrets': {
    id: 'no-hardcoded-secrets',
    title: 'No Hardcoded Secrets',
    description: 'Avoid hardcoding API keys, passwords, or sensitive data in source code',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'input-validation': {
    id: 'input-validation',
    title: 'Input Validation',
    description: 'Validate and sanitize all user inputs before processing',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },

  // 代码风格优化模式专用规则
  'code-style-consistent-naming': {
    id: 'code-style-consistent-naming',
    title: 'Consistent Naming Convention',
    description: 'Use consistent naming conventions throughout the codebase (camelCase, PascalCase, snake_case)',
    severity: 'warning',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-function-length': {
    id: 'code-style-function-length',
    title: 'Function Length Control',
    description: 'Keep functions concise and focused. Consider splitting functions longer than 50 lines',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-comments-quality': {
    id: 'code-style-comments-quality',
    title: 'High-Quality Comments',
    description: 'Write meaningful comments that explain "why" not "what". Remove outdated comments',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-magic-numbers': {
    id: 'code-style-magic-numbers',
    title: 'No Magic Numbers',
    description: 'Replace magic numbers with named constants or configuration values',
    severity: 'warning',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-code-duplication': {
    id: 'code-style-code-duplication',
    title: 'Avoid Code Duplication',
    description: 'Extract common code into reusable functions or modules (DRY principle)',
    severity: 'warning',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-error-messages': {
    id: 'code-style-error-messages',
    title: 'Meaningful Error Messages',
    description: 'Provide clear, actionable error messages that help users understand and fix issues',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-api-design': {
    id: 'code-style-api-design',
    title: 'Consistent API Design',
    description: 'Follow consistent patterns for API design, parameter ordering, and return values',
    severity: 'warning',
    category: 'style',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'code-style-imports-organization': {
    id: 'code-style-imports-organization',
    title: 'Organized Imports',
    description: 'Group and sort imports logically (standard library, third-party, local)',
    severity: 'info',
    category: 'style',
    applicableFiles: ['*.js', '*.ts', '*.jsx', '*.tsx', '*.py', '*.go', '*.rs'],
    projectTypes: ['*']
  },

  // 通用安全扫描模式专用规则
  'security-authentication': {
    id: 'security-authentication',
    title: 'Proper Authentication',
    description: 'Implement proper authentication mechanisms and avoid weak authentication methods',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-authorization': {
    id: 'security-authorization',
    title: 'Authorization Checks',
    description: 'Verify user permissions before accessing resources or performing actions',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-data-encryption': {
    id: 'security-data-encryption',
    title: 'Data Encryption',
    description: 'Encrypt sensitive data at rest and in transit using strong encryption algorithms',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-session-management': {
    id: 'security-session-management',
    title: 'Secure Session Management',
    description: 'Implement secure session handling with proper timeouts and invalidation',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-logging-monitoring': {
    id: 'security-logging-monitoring',
    title: 'Security Logging',
    description: 'Log security events and monitor for suspicious activities',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-cors-configuration': {
    id: 'security-cors-configuration',
    title: 'CORS Configuration',
    description: 'Configure CORS headers properly to prevent unauthorized cross-origin requests',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['backend', 'node', 'web']
  },
  'security-rate-limiting': {
    id: 'security-rate-limiting',
    title: 'Rate Limiting',
    description: 'Implement rate limiting to prevent abuse and DoS attacks',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['backend', 'node', 'web']
  },
  'security-error-handling': {
    id: 'security-error-handling',
    title: 'Secure Error Handling',
    description: 'Avoid exposing sensitive information in error messages',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-dependency-scanning': {
    id: 'security-dependency-scanning',
    title: 'Dependency Security',
    description: 'Regularly scan and update dependencies for known vulnerabilities',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml'],
    projectTypes: ['*']
  },
  'security-file-upload': {
    id: 'security-file-upload',
    title: 'Secure File Upload',
    description: 'Validate file types, sizes, and scan for malware in file uploads',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'security-http-headers': {
    id: 'security-http-headers',
    title: 'Security HTTP Headers',
    description: 'Include security headers like CSP, HSTS, X-Frame-Options, etc.',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['backend', 'web']
  },
  'security-password-policy': {
    id: 'security-password-policy',
    title: 'Password Security',
    description: 'Implement strong password policies and secure password storage',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },

  // === 专业安全扫描模式专用规则 (Professional Security Rules) ===
  // 1. 网络安全类规则
  'professional-network-request-restriction': {
    id: 'professional-network-request-restriction',
    title: 'Network Request Restriction',
    description: '禁止或限制网络请求，采用白名单方式防止助记词、私钥传播到网上',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'professional-logging-prohibition': {
    id: 'professional-logging-prohibition',
    title: 'Logging Prohibition',
    description: '禁止打印日志，避免助记词、私钥的输出与泄露',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'professional-file-write-prohibition': {
    id: 'professional-file-write-prohibition',
    title: 'File Write Prohibition',
    description: '禁止本地写文件行为，防止助记词、私钥写入到本地文件中',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },

  // 2. 数据泄露防护规则
  'professional-signature-data-leakage': {
    id: 'professional-signature-data-leakage',
    title: 'Signature Data Leakage Prevention',
    description: '防止助记词、私钥被替换成签名结果或附加到签名结果里泄露',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'professional-error-sanitization': {
    id: 'professional-error-sanitization',
    title: 'Error Message Sanitization',
    description: '返回错误不能是原生错误，需要脱敏后才能给出',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'professional-sensitive-hardcode-detection': {
    id: 'professional-sensitive-hardcode-detection',
    title: 'Sensitive Information Hardcode Detection',
    description: '检测硬编码的敏感信息（API 密钥、密码、token、IP 地址、域名）',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'professional-keyword-blacklist': {
    id: 'professional-keyword-blacklist',
    title: 'Keyword Blacklist Check',
    description: '关键字屏蔽：unsafe、reflect、cat、replace 等危险关键字',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },

  // 3. 依赖管理规则
  'professional-gomod-replace-prohibition': {
    id: 'professional-gomod-replace-prohibition',
    title: 'Go.mod Replace Prohibition',
    description: 'master 分支go.mod 中禁止使用 replace 关键字，防止安全模块失效',
    severity: 'error',
    category: 'security',
    applicableFiles: ['go.mod', 'go.sum'],
    projectTypes: ['go']
  },
  'professional-dependency-security-scan': {
    id: 'professional-dependency-security-scan',
    title: 'Dependency Security Scan',
    description: '检测依赖库漏洞或版本变更，防止引入有安全风险的依赖',
    severity: 'error',
    category: 'security',
    applicableFiles: ['go.mod', 'package.json', 'requirements.txt', 'Cargo.toml'],
    projectTypes: ['*']
  },
  'professional-new-dependency-detection': {
    id: 'professional-new-dependency-detection',
    title: 'New Dependency Detection',
    description: '检测 MR 中新增的依赖库，确保新依赖的安全性',
    severity: 'warning',
    category: 'security',
    applicableFiles: ['go.mod', 'package.json', 'requirements.txt', 'Cargo.toml'],
    projectTypes: ['*']
  },

  // 4. 代码安全规则
  'professional-reflection-dynamic-call-detection': {
    id: 'professional-reflection-dynamic-call-detection',
    title: 'Reflection and Dynamic Call Detection',
    description: '反射、动态调用检测，防止通过反射绕过安全检查',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['*']
  },
  'sql-injection-prevention': {
    id: 'sql-injection-prevention',
    title: 'SQL Injection Prevention',
    description: 'Use parameterized queries or ORM methods to prevent SQL injection',
    severity: 'error',
    category: 'security',
    applicableFiles: ['*'],
    projectTypes: ['backend', 'database']
  },

  // Performance rules
  'large-file-handling': {
    id: 'large-file-handling',
    title: 'Large File Handling',
    description: 'Use streaming for large file operations instead of loading into memory',
    severity: 'warning',
    category: 'performance',
    applicableFiles: ['*'],
    projectTypes: ['backend', 'node']
  },
  'database-n-plus-one': {
    id: 'database-n-plus-one',
    title: 'Database N+1 Query Problem',
    description: 'Avoid N+1 query problems by using eager loading or batch queries',
    severity: 'warning',
    category: 'performance',
    applicableFiles: ['*'],
    projectTypes: ['backend', 'database']
  }
};

// Define project type configurations
export const PROJECT_TYPES: Record<string, ProjectTypeConfig> = {
  typescript: {
    name: 'TypeScript',
    description: 'TypeScript project',
    patterns: ['tsconfig.json', '*.ts', '*.tsx'],
    defaultRules: [
      'ts-strict-mode',
      'no-any-type',
      'async-await-best-practice',
      'no-hardcoded-secrets',
      'input-validation'
    ]
  },
  javascript: {
    name: 'JavaScript',
    description: 'JavaScript project',
    patterns: ['package.json', '*.js', '*.jsx'],
    defaultRules: [
      'async-await-best-practice',
      'no-hardcoded-secrets',
      'input-validation'
    ]
  },
  react: {
    name: 'React',
    description: 'React application',
    patterns: ['package.json', 'src/**/*.tsx', 'src/**/*.jsx', 'react'],
    defaultRules: [
      'ts-strict-mode',
      'no-any-type',
      'react-hooks-dependencies',
      'react-key-prop',
      'react-component-naming',
      'no-hardcoded-secrets'
    ]
  },
  node: {
    name: 'Node.js',
    description: 'Node.js application',
    patterns: ['package.json', 'server.js', 'app.js', 'index.js'],
    defaultRules: [
      'async-await-best-practice',
      'environment-variables',
      'no-hardcoded-secrets',
      'input-validation',
      'large-file-handling'
    ]
  },
  go: {
    name: 'Go',
    description: 'Go application',
    patterns: ['go.mod', 'go.sum', '*.go'],
    defaultRules: [
      'go-error-handling',
      'go-context-usage',
      'go-interface-naming',
      'no-hardcoded-secrets',
      'input-validation'
    ]
  },
  python: {
    name: 'Python',
    description: 'Python application',
    patterns: ['requirements.txt', 'pyproject.toml', '*.py'],
    defaultRules: [
      'python-type-hints',
      'python-docstrings',
      'python-exception-handling',
      'no-hardcoded-secrets',
      'input-validation'
    ]
  },
  rust: {
    name: 'Rust',
    description: 'Rust application',
    patterns: ['Cargo.toml', 'Cargo.lock', '*.rs', 'src/main.rs', 'src/lib.rs'],
    defaultRules: [
      'rust-error-handling',
      'rust-option-handling',
      'rust-ownership-borrowing',
      'rust-memory-safety',
      'rust-concurrency',
      'rust-performance-clones',
      'rust-clippy-lints',
      'rust-testing',
      'no-hardcoded-secrets',
      'input-validation'
    ]
  },
  sh: {
    name: 'Shell Script',
    description: 'Shell/Bash scripting',
    patterns: ['*.sh', '*.bash', '*.zsh', 'bashrc', 'zshrc'],
    defaultRules: [
      'sh-shebang',
      'sh-error-handling',
      'sh-variable-quoting',
      'sh-command-substitution',
      'no-hardcoded-secrets',
      'input-validation'
    ]
  },
  backend: {
    name: 'Backend',
    description: 'Backend application',
    patterns: ['api', 'server', 'backend'],
    defaultRules: [
      'environment-variables',
      'no-hardcoded-secrets',
      'input-validation',
      'sql-injection-prevention',
      'large-file-handling',
      'database-n-plus-one'
    ]
  },
  database: {
    name: 'Database',
    description: 'Database related code',
    patterns: ['*.sql', 'migrations', 'schema'],
    defaultRules: [
      'sql-injection-prevention',
      'database-n-plus-one'
    ]
  }
};

/**
 * Detect project type based on file patterns and project structure
 */
export function detectProjectType(filePaths: string[], projectStructure?: string[]): string[] {
  const detectedTypes: string[] = [];
  
  for (const [typeId, config] of Object.entries(PROJECT_TYPES)) {
    const hasPattern = config.patterns.some(pattern => {
      return filePaths.some(file => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(file);
        }
        return file.includes(pattern);
      });
    });
    
    if (hasPattern) {
      detectedTypes.push(typeId);
    }
  }
  
  return detectedTypes;
}

/**
 * Get applicable rules for a specific file and project type
 */
export function getApplicableRules(
  fileName: string, 
  projectTypes: string[], 
  includeUniversal: boolean = true
): CodeReviewRule[] {
  const applicableRules: CodeReviewRule[] = [];
  
  for (const rule of Object.values(CODE_REVIEW_RULES)) {
    // Check if rule applies to any of the detected project types
    const appliesToProjectType = rule.projectTypes?.some(pt => 
      pt === '*' || projectTypes.includes(pt)
    ) || rule.projectTypes?.length === 0;
    
    // Check if rule applies to the specific file
    const appliesToFile = rule.applicableFiles?.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName.endsWith(pattern.replace('*', ''));
    });
    
    if (appliesToProjectType && (appliesToFile || includeUniversal)) {
      applicableRules.push(rule);
    }
  }
  
  // Sort by severity (error > warning > info)
  return applicableRules.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Get default rules for detected project types
 */
export function getDefaultRulesForProjectTypes(projectTypes: string[]): CodeReviewRule[] {
  const ruleIds = new Set<string>();
  
  for (const projectType of projectTypes) {
    const config = PROJECT_TYPES[projectType];
    if (config) {
      config.defaultRules.forEach(ruleId => ruleIds.add(ruleId));
    }
  }
  
  return Array.from(ruleIds)
    .map(ruleId => CODE_REVIEW_RULES[ruleId])
    .filter(Boolean);
}

/**
 * Format rules for display
 */
export function formatRulesOutput(rules: CodeReviewRule[]): string {
  if (rules.length === 0) {
    return "No applicable rules found.";
  }
  
  const groupedByCategory = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, CodeReviewRule[]>);
  
  let output = `📋 **Code Review Rules (${rules.length} total)**\n\n`;
  
  for (const [category, categoryRules] of Object.entries(groupedByCategory)) {
    const emoji = getCategoryEmoji(category);
    output += `${emoji} **${category.toUpperCase()}** (${categoryRules.length} rules)\n\n`;
    
    for (const rule of categoryRules) {
      const severityEmoji = getSeverityEmoji(rule.severity);
      output += `  ${severityEmoji} **${rule.title}**\n`;
      output += `     ${rule.description}\n`;
      output += `     🎯 Files: ${rule.applicableFiles?.join(', ') || 'All'}\n\n`;
    }
  }
  
  return output;
}

function getCategoryEmoji(category: string): string {
  const emojis = {
    security: '🔒',
    performance: '⚡',
    maintainability: '🔧',
    style: '🎨',
    'best-practice': '✨'
  };
  return emojis[category as keyof typeof emojis] || '📌';
}

function getSeverityEmoji(severity: string): string {
  const emojis = {
    error: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return emojis[severity as keyof typeof emojis] || '📝';
}

/**
 * 获取代码风格优化模式的规则
 */
export function getCodeStyleOptimizationRules(projectTypes: string[]): CodeReviewRule[] {
  const allRules = Object.values(CODE_REVIEW_RULES);
  
  // 获取所有style类别的规则，以及部分best-practice规则
  const styleRules = allRules.filter(rule => rule.category === 'style');
  const bestPracticeRules = allRules.filter(rule => 
    rule.category === 'best-practice' && 
    (rule.id.includes('naming') || rule.id.includes('duplication') || rule.id.includes('function') || rule.id.includes('api'))
  );
  
  // 合并规则并过滤适用的项目类型
  const combinedRules = [...styleRules, ...bestPracticeRules];
  
  return combinedRules.filter(rule => 
    rule.projectTypes?.some(pt => pt === '*' || projectTypes.includes(pt)) || 
    rule.projectTypes?.length === 0
  );
}

/**
 * 获取通用安全扫描模式的规则
 */
export function getGeneralSecurityScanRules(projectTypes: string[]): CodeReviewRule[] {
  const allRules = Object.values(CODE_REVIEW_RULES);
  
  // 获取所有security类别的规则
  const securityRules = allRules.filter(rule => rule.category === 'security');
  
  return securityRules.filter(rule => 
    rule.projectTypes?.some(pt => pt === '*' || projectTypes.includes(pt)) || 
    rule.projectTypes?.length === 0
  );
}

/**
 * 获取专业安全扫描模式的规则（仅包含专业级别的特定安全规则）
 */
export function getProfessionalSecurityScanRules(projectTypes: string[], customRules?: CodeReviewRule[]): CodeReviewRule[] {
  const allRules = Object.values(CODE_REVIEW_RULES);
  
  // 获取所有以 'professional-' 开头的专业安全规则
  const professionalRules = allRules.filter(rule => 
    rule.id.startsWith('professional-') && rule.category === 'security'
  );
  
  // 过滤适用的项目类型
  const applicableRules = professionalRules.filter(rule => 
    rule.projectTypes?.some(pt => pt === '*' || projectTypes.includes(pt)) || 
    rule.projectTypes?.length === 0
  );
  
  // 如果有自定义规则，添加它们（但确保是安全类别的）
  if (customRules && customRules.length > 0) {
    const customSecurityRules = customRules.filter(rule => rule.category === 'security');
    return [...applicableRules, ...customSecurityRules];
  }
  
  return applicableRules;
}
