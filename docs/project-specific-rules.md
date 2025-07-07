# 项目特定代码审查规则配置指南

## 概述

项目特定规则功能允许你为不同的 GitLab 项目配置专门的代码审查规则。这些规则会在进行代码审查时自动应用，以确保项目遵循特定的编码标准和最佳实践。

## 配置文件位置

系统会按以下顺序查找配置文件：

1. `project-rules.config.json` - 项目根目录
2. `config/project-rules.json` - config 目录
3. `.mcp/project-rules.json` - .mcp 目录

## 配置文件格式

配置文件使用 JSON 格式，结构如下：

```json
{
  "$schema": "./project-rules-schema.json",
  "description": "项目特定的代码审查规则配置文件",
  "projects": {
    "项目标识符": {
      "projectIdentifier": "项目标识符",
      "projectName": "项目名称",
      "description": "项目描述",
      "enableDefaultRules": true,
      "excludeDefaultRules": ["要排除的默认规则ID"],
      "additionalProjectTypes": ["额外的项目类型"],
      "rules": [
        {
          "id": "规则ID",
          "title": "规则标题",
          "description": "规则描述",
          "severity": "error|warning|info",
          "category": "security|performance|maintainability|style|best-practice",
          "applicableFiles": ["文件模式"],
          "projectTypes": ["项目类型"]
        }
      ]
    }
  }
}
```

## 配置选项说明

### 项目配置选项

- **projectIdentifier**: 项目的唯一标识符，通常是 GitLab 项目路径（如 `group/project`）或项目 ID
- **projectName**: 项目的显示名称
- **description**: 项目描述（可选）
- **enableDefaultRules**: 是否启用自动检测的项目类型的默认规则（默认：true）
- **excludeDefaultRules**: 要排除的默认规则 ID 列表（可选）
- **additionalProjectTypes**: 额外的项目类型，除了自动检测的类型外（可选）
- **rules**: 项目特定的规则列表

### 规则配置选项

- **id**: 规则的唯一标识符
- **title**: 规则的简短标题
- **description**: 规则的详细描述
- **severity**: 严重程度 (`error`、`warning`、`info`)
- **category**: 规则类别 (`security`、`performance`、`maintainability`、`style`、`best-practice`)
- **applicableFiles**: 规则适用的文件模式列表（支持 glob 模式）
- **projectTypes**: 规则适用的项目类型列表

## 使用示例

### 1. 后端 API 服务项目

```json
{
  "backend/api-service": {
    "projectIdentifier": "backend/api-service",
    "projectName": "API Service",
    "description": "后端API服务项目",
    "enableDefaultRules": true,
    "excludeDefaultRules": ["no-any-type"],
    "additionalProjectTypes": ["backend", "node"],
    "rules": [
      {
        "id": "api-rate-limiting",
        "title": "API Rate Limiting",
        "description": "确保所有公开API端点都有速率限制保护",
        "severity": "error",
        "category": "security",
        "applicableFiles": ["**/controllers/*.js", "**/routes/*.js"],
        "projectTypes": ["backend"]
      }
    ]
  }
}
```

### 2. React 前端项目

```json
{
  "frontend/web-app": {
    "projectIdentifier": "frontend/web-app",
    "projectName": "Web Application",
    "enableDefaultRules": true,
    "additionalProjectTypes": ["react", "typescript"],
    "rules": [
      {
        "id": "component-folder-structure",
        "title": "Component Folder Structure",
        "description": "组件应该有统一的文件夹结构",
        "severity": "warning",
        "category": "maintainability",
        "applicableFiles": ["**/components/**/*.tsx"],
        "projectTypes": ["react"]
      }
    ]
  }
}
```

### 3. 支付服务项目

```json
{
  "microservices/payment-service": {
    "projectIdentifier": "microservices/payment-service",
    "projectName": "Payment Service",
    "enableDefaultRules": true,
    "additionalProjectTypes": ["go", "backend"],
    "rules": [
      {
        "id": "payment-security-audit",
        "title": "Payment Security Audit",
        "description": "支付相关代码必须进行严格的安全审计",
        "severity": "error",
        "category": "security",
        "applicableFiles": ["**/payment/*.go", "**/transaction/*.go"],
        "projectTypes": ["go"]
      }
    ]
  }
}
```

## 文件模式说明

文件模式支持 glob 语法：

- `*.js` - 匹配所有 .js 文件
- `**/*.js` - 匹配所有目录下的 .js 文件
- `**/controllers/*.js` - 匹配所有 controllers 目录下的 .js 文件
- `src/**/*.tsx` - 匹配 src 目录及其子目录下的所有 .tsx 文件

## 规则优先级

1. 项目特定规则具有最高优先级
2. 如果 `enableDefaultRules` 为 true，会加载自动检测的项目类型的默认规则
3. `excludeDefaultRules` 中指定的规则会被排除
4. 相同 ID 的规则，项目特定规则会覆盖默认规则

## 使用流程

1. 创建配置文件 `project-rules.config.json`
2. 根据项目需求配置规则
3. 运行 GitLab 代码审查工具时，系统会自动加载并应用这些规则
4. 在代码审查报告中会显示项目特定规则的应用情况

## 调试和验证

如果配置没有生效，可以检查：

1. 日志中是否有加载配置文件的信息
2. 配置文件路径是否正确
3. JSON 格式是否有效
4. 项目标识符是否与 GitLab 项目路径匹配

## 最佳实践

1. **保持规则简洁明确**：每个规则应该检查一个具体的问题
2. **合理设置严重程度**：根据问题的影响程度设置适当的 severity
3. **使用有意义的 ID**：规则 ID 应该描述性强，便于理解和引用
4. **定期更新规则**：随着项目发展，定期审查和更新规则
5. **团队共识**：确保团队成员了解并认同这些规则

## 扩展性

你可以通过以下方式扩展功能：

1. 添加新的规则类别
2. 支持更多的项目类型
3. 集成外部工具的规则
4. 添加规则的自动修复建议 