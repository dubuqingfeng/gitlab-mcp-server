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
