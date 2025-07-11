# 专门的代码审查模式

本文档详细介绍 GitLab MCP 服务器中新增的三种专门的代码审查模式，每种模式都针对不同的审查需求进行了优化。

## 概述

除了原有的综合代码审查工具，我们新增了三种专门的审查模式：

1. **代码风格优化模式** (`gitlab_code_style_review`) - 专注于代码风格和最佳实践
2. **通用安全扫描模式** (`gitlab_general_security_review`) - 专注于常见安全漏洞
3. **专业安全扫描模式** (`gitlab_professional_security_review`) - 支持自定义规则的高级安全扫描

## 1. 代码风格优化模式

### 功能特点

代码风格优化模式专注于提高代码质量和一致性，包括：

- **命名规范检查** - 确保变量、函数、类等命名的一致性
- **函数长度控制** - 识别过长的函数并建议重构
- **代码重复检测** - 发现重复代码并建议提取公共逻辑
- **注释质量评估** - 检查注释的意义和清晰度
- **导入语句组织** - 确保导入语句的有序组织
- **魔法数字检查** - 识别硬编码数字并建议使用常量
- **错误消息优化** - 确保错误消息的清晰性和可操作性
- **API设计一致性** - 检查API设计的一致性模式

### 使用方法

```bash
# 基础用法
gitlab_code_style_review --projectId "group/project" --mergeRequestIid 123

# 使用URL
gitlab_code_style_review --url "https://gitlab.com/group/project/-/merge_requests/123"
```

### 审查报告示例

```markdown
🎨 **代码风格优化审查报告**

📋 **MR信息**
- **标题**: 添加用户管理功能
- **分支**: feature/user-management → main
- **作者**: 开发者
- **状态**: opened
- **项目**: 用户管理系统

🎯 **检测到的项目类型**: TypeScript, React

🔍 **变更文件信息**
变更文件 (3 个): `src/UserManager.tsx`, `src/utils/validation.ts`, `src/types/user.ts`

🎨 **代码风格优化规则** (8 条):

🎨 **STYLE** (5 rules)
  ⚠️ **Consistent Naming Convention**
     Use consistent naming conventions throughout the codebase
     🎯 Files: All

  ℹ️ **Function Length Control**
     Keep functions concise and focused. Consider splitting functions longer than 50 lines
     🎯 Files: All

  ⚠️ **No Magic Numbers**
     Replace magic numbers with named constants or configuration values
     🎯 Files: All

📝 **代码风格检查清单**:
- ✅ 命名规范是否一致（变量、函数、类等）
- ✅ 函数和类的长度是否合理
- ✅ 代码重复是否已消除
- ✅ 注释是否清晰有意义
- ✅ 导入语句是否有序组织
- ✅ 魔法数字是否已用常量替代
- ✅ 错误消息是否清晰可操作
- ✅ API设计是否一致

💡 **代码风格优化建议**:
- 关注代码的可读性和一致性
- 确保命名能够自解释
- 重构复杂的函数和类
- 提高代码的可维护性
- 遵循项目的编码规范
```

## 2. 通用安全扫描模式

### 功能特点

通用安全扫描模式专注于常见的安全漏洞检查，包括：

- **数据加密检查** - 验证敏感数据的加密处理
- **输入验证** - 确保所有用户输入都经过验证
- **身份验证和授权** - 检查认证和权限控制
- **会话管理** - 验证会话的安全处理
- **错误处理安全** - 防止错误信息泄露
- **依赖包安全** - 检查第三方依赖的安全性
- **文件上传安全** - 验证文件上传的安全措施
- **CORS和限流** - 检查跨域和限流配置
- **安全日志** - 确保安全事件的记录

### 使用方法

```bash
# 基础用法
gitlab_general_security_review --projectId "group/project" --mergeRequestIid 123

# 使用URL
gitlab_general_security_review --url "https://gitlab.com/group/project/-/merge_requests/123"
```

### 安全检查清单

- ✅ 敏感数据是否已加密存储和传输
- ✅ 用户输入是否已验证和清理
- ✅ 身份验证和授权是否正确实施
- ✅ 会话管理是否安全
- ✅ 错误处理是否避免信息泄露
- ✅ 第三方依赖是否存在已知漏洞
- ✅ 文件上传是否有安全验证
- ✅ API是否有适当的限流和CORS配置
- ✅ 安全日志是否完整

## 3. 专业安全扫描模式

### 功能特点

专业安全扫描模式专门针对加密货币钱包和区块链应用的安全审查，重点保护助记词、私钥等敏感信息：

**🌐 网络安全类**
- **网络请求白名单限制** - 防止助记词、私钥传播到网上
- **日志输出禁止** - 避免敏感信息在日志中泄露  
- **本地文件写入禁止** - 防止敏感信息写入本地文件

**🔐 数据泄露防护**
- **签名结果数据泄露检测** - 防止助记词、私钥在签名结果中泄露
- **错误信息脱敏** - 确保原生错误不会暴露敏感信息
- **敏感信息硬编码检测** - 检查API密钥、密码、token、IP地址、域名等
- **危险关键字屏蔽** - 检测 unsafe、reflect、cat、replace 等关键字

**📦 依赖管理**
- **go.mod replace 禁用** - 防止模块替换导致安全模块失效
- **依赖库安全检测** - 检测依赖库漏洞或版本变更
- **新增依赖库检测** - 识别MR中新增的依赖库

**💻 代码安全**
- **反射、动态调用检测** - 防止通过反射绕过安全检查

### 使用方法

```bash
# 基础用法
gitlab_professional_security_review --projectId "group/project" --mergeRequestIid 123

# 使用URL
gitlab_professional_security_review --url "https://gitlab.com/group/project/-/merge_requests/123"

# 适用场景：钱包应用、区块链项目、加密货币相关项目
```

### 专业安全检查清单

**🌐 网络安全类**
- ✅ 网络请求是否采用白名单限制
- ✅ 是否禁止或限制日志输出
- ✅ 是否禁止本地文件写入操作

**🔐 数据泄露防护**
- ✅ 助记词、私钥是否可能在签名结果中泄露
- ✅ 错误信息是否已脱敏处理
- ✅ 是否存在敏感信息硬编码
- ✅ 危险关键字检查（unsafe、reflect、cat、replace）

**📦 依赖管理**
- ✅ go.mod 是否使用了 replace 关键字
- ✅ 依赖库是否存在安全漏洞或异常变更
- ✅ 是否新增了未经审核的依赖库

**💻 代码安全**
- ✅ 是否使用了反射或动态调用

## 最佳实践建议

### 选择合适的审查模式

1. **开发阶段初期** - 使用代码风格优化模式确保代码质量
2. **功能开发完成** - 使用通用安全扫描模式检查基本安全问题
3. **生产部署前** - 使用专业安全扫描模式进行深度安全审查
4. **关键功能更新** - 结合多种模式进行综合审查

### 集成到CI/CD流程

```yaml
# GitLab CI示例
code_style_review:
  stage: review
  script:
    - gitlab_code_style_review --projectId $CI_PROJECT_PATH --mergeRequestIid $CI_MERGE_REQUEST_IID

security_scan:
  stage: security
  script:
    - gitlab_general_security_review --projectId $CI_PROJECT_PATH --mergeRequestIid $CI_MERGE_REQUEST_IID

professional_security:
  stage: security
  script:
    - gitlab_professional_security_review --projectId $CI_PROJECT_PATH --mergeRequestIid $CI_MERGE_REQUEST_IID
  only:
    - main
    - production
```

### 自定义规则配置

专业安全扫描模式支持自定义规则，可以根据项目需求添加特定的安全检查：

```json
{
  "customRules": [
    {
      "id": "pci-dss-compliance",
      "title": "PCI DSS Compliance",
      "description": "Ensure PCI DSS compliance for payment processing",
      "severity": "error",
      "category": "security",
      "applicableFiles": ["**/payment/**"],
      "projectTypes": ["*"]
    },
    {
      "id": "gdpr-data-protection",
      "title": "GDPR Data Protection",
      "description": "Verify GDPR compliance for personal data handling",
      "severity": "error",
      "category": "security",
      "applicableFiles": ["**/user/**", "**/profile/**"],
      "projectTypes": ["*"]
    }
  ]
}
```

## 注意事项

1. **环境变量配置** - 确保已正确配置 GitLab 访问令牌
2. **权限要求** - 需要有读取项目和MR的权限
3. **规则更新** - 定期更新安全规则以覆盖最新的威胁
4. **结果处理** - 建议将审查结果自动写入MR评论中
5. **持续改进** - 根据审查结果持续优化项目的安全和质量标准

## 常见问题解答

### Q: 如何选择使用哪种审查模式？
A: 根据审查目标选择：代码质量问题使用代码风格优化模式，基础安全问题使用通用安全扫描模式，高级安全要求使用专业安全扫描模式。

### Q: 是否可以同时使用多种模式？
A: 是的，可以依次使用不同的模式，每种模式会产生独立的审查报告。

### Q: 如何添加自定义安全规则？
A: 在专业安全扫描模式中使用 `customRules` 参数传入自定义规则配置。

### Q: 审查结果如何处理？
A: 可以使用 `write_gitlab_mr_note` 工具将审查结果自动写入MR评论中。

### Q: 如何与现有的CI/CD流程集成？
A: 可以在GitLab CI配置中添加相应的job，在不同阶段调用不同的审查模式。

## 总结

这三种专门的代码审查模式为不同的审查需求提供了针对性的解决方案：

- **代码风格优化模式** - 提升代码质量和一致性
- **通用安全扫描模式** - 识别常见安全漏洞
- **专业安全扫描模式** - 提供企业级安全审查

通过合理使用这些模式，可以显著提高代码质量和安全性，建立更加健壮的开发流程。 