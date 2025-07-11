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
- `gitlab_code_review`: 对 MR 进行综合代码审查
- `gitlab_branch_code_review`: 对指定分支进行全面代码审查
- `gitlab_commit_review`: 对指定提交进行代码审查
- `get_file_content`: 获取仓库中特定文件的内容
- `list_branches`: 列出项目的所有分支
- `write_gitlab_mr_note`: 在 MR 中写入审查备注（支持灵活的通知模式）

### 🆕 专门的代码审查模式
- `gitlab_code_style_review`: 代码风格优化审查模式 - 专注于代码风格和最佳实践
- `gitlab_general_security_review`: 通用安全扫描审查模式 - 专注于常见安全漏洞检查
- `gitlab_professional_security_review`: 专业安全扫描审查模式 - 支持自定义安全规则的高级扫描

## 依赖
- `@gitbeaker/rest`: GitLab API 客户端库

详细使用说明请参考 [GitLab 文档](docs/gitlab.md)

# Lark 机器人集成

支持通过 Lark（飞书）机器人发送通知，可以在写入 GitLab MR 评论时自动发送 Lark 通知。

## 环境变量
```bash
export LARK_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"  # Lark 机器人 Webhook URL
export LARK_SECRET_KEY="your_secret_key"  # 可选：签名密钥（如果机器人启用了签名验证）
export LARK_ENABLE_NOTIFICATION="true"  # 可选：是否启用通知，默认为 true
export GITLAB_NOTE_MODE="gitlab_only"  # 可选：通知模式 - gitlab_only(仅GitLab)、lark_only(仅Lark)、both(两者都发)，默认为 gitlab_only
```

## 功能特性
- 灵活的通知模式：可以选择只写 GitLab、只发 Lark 或两者都做
- 支持富文本卡片消息，包含项目名称、MR 标题、评论内容等信息
- 支持自定义 Lark 消息（文本或卡片格式）
- 失败不影响主流程，确保 GitLab 操作的可靠性

## 通知模式说明
- **gitlab_only**: 仅写入 GitLab MR 评论，不发送 Lark 通知（默认）
- **lark_only**: 仅发送 Lark 通知，不写入 GitLab MR 评论
- **both**: 同时写入 GitLab MR 评论并发送 Lark 通知

## 使用示例
```javascript
// 使用环境变量配置的默认模式
await write_gitlab_mr_note({
  projectId: "group/project",
  mergeRequestIid: 123,
  note: "代码审查完成，LGTM！"
});

// 明确指定只写入 GitLab
await write_gitlab_mr_note({
  projectId: "group/project",
  mergeRequestIid: 123,
  note: "内部备注",
  notificationMode: "gitlab_only"
});

// 只发送 Lark 通知，不写入 GitLab
await write_gitlab_mr_note({
  projectId: "group/project",
  mergeRequestIid: 123,
  note: "团队通知：代码已审查",
  notificationMode: "lark_only"
});

// 强制两者都执行（覆盖环境变量）
await write_gitlab_mr_note({
  projectId: "group/project",
  mergeRequestIid: 123,
  note: "重要通知",
  notificationMode: "both"
});

```

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

### 🎯 专门代码审查模式详细说明

#### 1. 代码风格优化模式 (`gitlab_code_style_review`)
专注于代码风格和编码最佳实践的审查模式，包括：
- 一致的命名规范检查
- 函数和类长度控制
- 代码重复检测
- 注释质量评估
- 导入语句组织
- 魔法数字替换
- 错误消息清晰度
- API设计一致性

#### 2. 通用安全扫描模式 (`gitlab_general_security_review`)
专注于常见安全漏洞检查的审查模式，包括：
- 敏感数据加密检查
- 用户输入验证
- 身份验证和授权
- 会话管理安全
- 错误处理安全
- 依赖包漏洞扫描
- 文件上传安全
- CORS和限流配置
- 安全日志记录

#### 3. 专业安全扫描模式 (`gitlab_professional_security_review`)
专门针对加密货币钱包和区块链应用的安全审查，重点保护助记词、私钥等敏感信息：
- 🌐 网络请求白名单限制，防止敏感信息传播
- 🚫 日志输出和本地文件写入禁止
- 🔐 签名结果数据泄露防护
- 🛡️ 错误信息脱敏和敏感信息硬编码检测
- 📦 依赖管理安全（go.mod replace 禁用等）
- 💻 反射和动态调用检测
- ⚠️ 危险关键字屏蔽（unsafe、reflect、cat、replace）

### 📚 使用示例

```bash
# 代码风格优化审查
gitlab_code_style_review --projectId "group/project" --mergeRequestIid 123

# 通用安全扫描审查
gitlab_general_security_review --projectId "group/project" --mergeRequestIid 123

# 专业安全扫描审查（支持自定义规则）
gitlab_professional_security_review --projectId "group/project" --mergeRequestIid 123 --customRules [...]
```

详细使用说明请参考：
- [Code Review 文档](docs/codereview.md)
- [项目特定规则配置指南](docs/project-specific-rules.md)
- [专门的代码审查模式](docs/specialized-review-modes.md) - 🆕 新增的三种专门审查模式详细说明