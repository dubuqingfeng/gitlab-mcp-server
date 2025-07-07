Gitlab Mcp server

支持服务：

1. gitlab
6. code-review-rules (代码审查规则)

# 场景

1. gitlab 代码 review，获取信息
4. 智能代码审查规则 - 根据项目类型提供代码审查建议


# GitLab

GitLab 集成使用 `@gitbeaker/rest` 库支持获取 Merge Request 信息。

## 环境变量
```bash
export GITLAB_TOKEN="your_personal_access_token"
export GITLAB_URL="https://gitlab.com"  # 可选，默认为 gitlab.com（注意：不需要 /api/v4 后缀）
```

## 可用工具
- `get_merge_request`: 获取特定 MR 的详细信息
- `list_merge_requests`: 列出项目的 MR 列表

## 依赖
- `@gitbeaker/rest`: GitLab API 客户端库

详细使用说明请参考 [GitLab 文档](docs/gitlab.md)

# Code Review Rules (代码审查规则)

智能代码审查规则系统，根据不同项目类型和文件扩展名提供相应的代码审查建议。

## 可用工具
- `get_code_review_rules`: 获取适用于特定项目和文件的代码审查规则
- `list_all_code_review_rules`: 列出所有可用的代码审查规则  
- `get_project_types`: 获取支持的项目类型信息

## 支持的项目类型
- TypeScript / JavaScript
- React
- Node.js
- Go
- Python  
- Rust
- Backend (通用后端规则)
- Database (数据库相关)

## 规则类别
- 🔒 Security (安全)
- ⚡ Performance (性能)
- 🔧 Maintainability (可维护性)
- 🎨 Style (代码风格)
- ✨ Best Practice (最佳实践)

## 项目特定规则
支持为特定项目配置专属的代码审查规则：
- 可以通过外部 JSON 配置文件定义项目特定规则
- 支持启用/禁用默认规则
- 支持排除特定的默认规则
- 可以添加额外的项目类型

详细使用说明请参考：
- [Code Review 文档](docs/codereview.md)
- [项目特定规则配置指南](docs/project-specific-rules.md)