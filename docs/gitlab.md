# GitLab Integration

本项目使用 `@gitbeaker/rest` 库集成了 GitLab API，提供了两个主要工具来获取和查看 Merge Request 信息。

## 环境变量设置

在使用 GitLab 工具之前，需要设置以下环境变量：

```bash
# GitLab Personal Access Token (必需)
export GITLAB_TOKEN="your_personal_access_token_here"

# GitLab 实例 URL (可选，默认为 https://gitlab.com)
# 注意：使用 gitbeaker 时不需要添加 /api/v4 后缀
export GITLAB_URL="https://your-gitlab-instance.com"
```

### 如何获取 GitLab Personal Access Token

1. 登录到你的 GitLab 实例
2. 进入 **Settings** > **Access Tokens**
3. 创建一个新的 Personal Access Token
4. 选择所需的权限（至少需要 `api` 或 `read_api` 权限）
5. 复制生成的 token 并设置为 `GITLAB_TOKEN` 环境变量

## 可用工具

### 1. get_merge_request

获取特定 Merge Request 的详细信息。

**参数：**
- `projectId` (string | number): GitLab 项目 ID 或项目路径（例如：'group/project' 或 123）
- `mergeRequestIid` (number): Merge Request 的内部 ID（在 GitLab UI 中显示的 ID）

**示例：**
```typescript
// 使用项目路径
{
  "projectId": "mygroup/myproject",
  "mergeRequestIid": 42
}

// 使用项目 ID
{
  "projectId": 123,
  "mergeRequestIid": 42
}
```

**返回信息包括：**
- MR 标题和描述
- 状态（开放/合并/关闭/草稿）
- 作者、分配者、审查者信息
- 源分支和目标分支
- 合并状态和冲突信息
- 评论数量、点赞/点踩数
- 创建和更新时间
- GitLab 链接

### 2. list_merge_requests

列出项目的 Merge Request 列表。

**参数：**
- `projectId` (string | number): GitLab 项目 ID 或项目路径
- `state` (optional): 过滤状态 ('opened' | 'closed' | 'merged')，默认为 'opened'
  - 注意：使用 'all' 时会忽略状态过滤，显示所有状态的 MR
- `per_page` (optional): 每页结果数量 (1-100)，默认为 20
- `page` (optional): 页码，默认为 1

**示例：**
```typescript
// 获取开放的 MR
{
  "projectId": "mygroup/myproject",
  "state": "opened",
  "per_page": 10,
  "page": 1
}

// 获取所有状态的 MR
{
  "projectId": 123,
  "state": "all"
}
```

## 错误处理

工具会处理以下常见错误：

- **认证错误**: 如果 `GITLAB_TOKEN` 未设置或无效
- **项目不存在**: 如果指定的项目 ID/路径不存在
- **MR 不存在**: 如果指定的 Merge Request IID 不存在
- **权限错误**: 如果 token 没有足够权限访问项目
- **网络错误**: 如果无法连接到 GitLab 实例

## 使用场景

1. **代码审查**: 快速查看 MR 的详细信息，包括审查者和状态
2. **项目管理**: 列出所有开放的 MR，了解项目进度
3. **CI/CD 集成**: 在自动化流程中检查 MR 状态
4. **团队协作**: 快速分享 MR 信息给团队成员

## 注意事项

- 确保 GitLab token 有足够的权限访问目标项目
- 项目 ID 可以在 GitLab 项目主页找到
- Merge Request IID 是在 GitLab UI 中显示的编号，不是内部数据库 ID
- 如果使用自建 GitLab 实例，请正确设置 `GITLAB_URL` 环境变量 