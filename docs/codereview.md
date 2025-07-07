# Code Review Rules Tools

这个 MCP 服务器提供了智能的代码审查规则工具，可以根据不同的项目类型和文件扩展名提供相应的代码审查建议。

## 可用工具

### 1. `get_code_review_rules`

根据项目类型和文件扩展名获取适用的代码审查规则。

**参数：**
- `projectTypes` (可选): 指定项目类型数组，如 `['typescript', 'react']`
- `filePaths` (可选): 用于自动检测项目类型的文件路径数组
- `fileName` (可选): 特定文件名，获取该文件适用的规则
- `category` (可选): 按类别过滤规则 (`security`, `performance`, `maintainability`, `style`, `best-practice`)
- `severity` (可选): 按严重程度过滤 (`error`, `warning`, `info`)
- `includeUniversal` (可选): 是否包含通用规则 (默认: true)

**使用示例：**

```json
// 自动检测项目类型并获取规则
{
  "filePaths": ["package.json", "src/App.tsx", "tsconfig.json"]
}

// 为特定文件获取规则
{
  "fileName": "App.tsx",
  "projectTypes": ["react", "typescript"]
}

// 为 Rust 文件获取规则
{
  "fileName": "main.rs",
  "projectTypes": ["rust"]
}

// 只获取安全相关的错误级别规则
{
  "projectTypes": ["node"],
  "category": "security",
  "severity": "error"
}
```

### 2. `list_all_code_review_rules`

列出所有可用的代码审查规则。

**参数：**
- `category` (可选): 按类别过滤
- `severity` (可选): 按严重程度过滤
- `projectType` (可选): 按项目类型过滤

### 3. `get_project_types`

获取可用的项目类型信息和检测模式。

**参数：**
- `filePaths` (可选): 用于分析项目类型检测的文件路径

## 支持的项目类型

- **TypeScript**: 基于 `tsconfig.json`, `*.ts`, `*.tsx` 文件检测
- **JavaScript**: 基于 `package.json`, `*.js`, `*.jsx` 文件检测
- **React**: 基于 React 相关文件和依赖检测
- **Node.js**: 基于 Node.js 应用特征检测
- **Go**: 基于 `go.mod`, `*.go` 文件检测
- **Python**: 基于 `requirements.txt`, `*.py` 文件检测
- **Rust**: 基于 `Cargo.toml`, `*.rs` 文件检测
- **Backend**: 后端应用通用规则
- **Database**: 数据库相关代码规则

## 规则类别

1. **Security (🔒)**: 安全相关规则
2. **Performance (⚡)**: 性能优化规则
3. **Maintainability (🔧)**: 可维护性规则
4. **Style (🎨)**: 代码风格规则
5. **Best Practice (✨)**: 最佳实践规则

## 严重程度

- **Error (🚨)**: 必须修复的错误
- **Warning (⚠️)**: 建议修复的警告
- **Info (ℹ️)**: 提示性信息

## 使用场景

1. **代码审查**: 在 Code Review 过程中获取相关检查点
2. **项目初始化**: 为新项目设置代码规范
3. **教育培训**: 学习不同技术栈的最佳实践
4. **自动化检查**: 集成到 CI/CD 流程中

## 示例输出

```
🎯 **Detected Project Types:** TypeScript, React

📄 **File:** App.tsx

📋 **Code Review Rules (6 total)**

✨ **BEST-PRACTICE** (3 rules)

  🚨 **React Hooks Dependencies**
     Ensure all dependencies are included in useEffect, useMemo, useCallback dependency arrays
     🎯 Files: *.tsx, *.jsx

  ⚠️ **TypeScript Strict Mode**
     Ensure TypeScript strict mode is enabled for better type safety
     🎯 Files: *.ts, *.tsx

  ⚠️ **Avoid any Type**
     Avoid using "any" type, prefer specific types or unknown
     🎯 Files: *.ts, *.tsx

🔒 **SECURITY** (2 rules)

  🚨 **No Hardcoded Secrets**
     Avoid hardcoding API keys, passwords, or sensitive data in source code
     🎯 Files: All

  🚨 **Input Validation**
     Validate and sanitize all user inputs before processing
     🎯 Files: All

⚡ **PERFORMANCE** (1 rules)

  ⚠️ **React Key Prop**
     Provide unique key prop for list items, avoid using array index
     🎯 Files: *.tsx, *.jsx
```

### Rust 项目示例

```
🎯 **Detected Project Types:** Rust

📄 **File:** src/main.rs

📋 **Code Review Rules (12 total)**

✨ **BEST-PRACTICE** (4 rules)

  🚨 **Rust Error Handling**
     Use Result<T, E> for recoverable errors and proper error propagation with ?
     🎯 Files: *.rs

  ⚠️ **Rust Option Handling**
     Prefer pattern matching or combinator methods over unwrap() for Option types
     🎯 Files: *.rs

  ⚠️ **Rust Clippy Lints**
     Address Clippy warnings and suggestions, use #[allow] sparingly with justification
     🎯 Files: *.rs

  ⚠️ **Rust Testing**
     Write unit tests with #[test], integration tests in tests/ directory, use #[cfg(test)]
     🎯 Files: *.rs

🔒 **SECURITY** (4 rules)

  🚨 **Rust Memory Safety**
     Avoid unsafe code unless absolutely necessary, document unsafe blocks thoroughly
     🎯 Files: *.rs

  ⚠️ **Rust Concurrency Safety**
     Use thread-safe types (Arc, Mutex) for shared data, prefer channels for communication
     🎯 Files: *.rs

  🚨 **No Hardcoded Secrets**
     Avoid hardcoding API keys, passwords, or sensitive data in source code
     🎯 Files: All

  🚨 **Input Validation**
     Validate and sanitize all user inputs before processing
     🎯 Files: All

⚡ **PERFORMANCE** (2 rules)

  ⚠️ **Rust Ownership and Borrowing**
     Use borrowing (&) instead of moving when possible, avoid unnecessary clones
     🎯 Files: *.rs

  ⚠️ **Rust Performance - Avoid Unnecessary Clones**
     Minimize clone() calls, use references or move semantics appropriately
     🎯 Files: *.rs

🔧 **MAINTAINABILITY** (2 rules)

  ⚠️ **Rust Lifetime Management**
     Use explicit lifetime annotations when necessary and prefer static lifetimes for constants
     🎯 Files: *.rs

  ℹ️ **Rust Documentation**
     Provide documentation comments (///) for public APIs, include examples in doc tests
     🎯 Files: *.rs
```

## 扩展规则

规则定义在 `src/core/utils/codereview/rules.ts` 文件中，可以通过修改该文件来：

1. 添加新的规则
2. 定义新的项目类型
3. 调整现有规则的适用范围
4. 修改规则的严重程度和分类

每个规则包含以下属性：
- `id`: 唯一标识符
- `title`: 规则标题
- `description`: 详细描述
- `severity`: 严重程度
- `category`: 规则类别
- `applicableFiles`: 适用的文件模式
- `projectTypes`: 适用的项目类型

## Rust 特殊规则说明

Rust 规则特别关注以下几个核心方面：

### 内存安全与所有权
- **rust-memory-safety**: 检查 unsafe 代码的使用
- **rust-ownership-borrowing**: 优化所有权和借用模式
- **rust-performance-clones**: 减少不必要的内存分配

### 错误处理
- **rust-error-handling**: 推广 Result<T, E> 模式
- **rust-option-handling**: 安全处理 Option 类型，避免 panic

### 并发安全
- **rust-concurrency**: 检查线程安全的数据共享模式

### 代码质量
- **rust-clippy-lints**: 集成 Clippy 静态分析建议
- **rust-testing**: 促进测试驱动开发
- **rust-documentation**: 确保 API 文档的完整性

这些规则帮助开发者遵循 Rust 的核心原则：内存安全、并发安全和零成本抽象。 