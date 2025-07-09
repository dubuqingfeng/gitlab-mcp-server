# 打包优化指南

## 优化概览

本文档说明了对 GitLab MCP Server 打包流程进行的优化。

## 主要优化点

### 1. 统一构建目录
- 将构建输出目录从 `build/` 统一改为 `dist/`
- 保持与 TypeScript 配置一致

### 2. 精简发布文件
- 仅包含必要文件：`dist/`、`README.md`、`LICENSE`
- 移除源代码和配置文件，减小包体积
- 使用 `.npmignore` 精确控制发布内容

### 3. 优化构建策略
- **标准构建** (`npm run build`)：使用外部依赖，生成小体积包
- **完整构建** (`npm run build:full`)：打包所有依赖，生成独立可执行文件
- **简单构建** (`npm run build:simple`)：快速构建，使用外部依赖
- **干净构建** (`npm run build:clean`)：构建并移除绝对路径

### 4. 路径处理
- 禁用 source map (`--sourcemap=none`) 避免包含源码路径
- 自动移除构建产物中的绝对路径信息
- 提供 `remove-paths` 脚本清理路径信息

### 5. 构建分析工具
- `npm run analyze`：分析构建产物大小
- 自动检测过大文件（>1MB）
- 提供优化建议

## 使用方法

### 开发环境
```bash
# 开发模式
npm run dev

# HTTP 服务开发模式
npm run dev:http
```

### 构建打包
```bash
# 清理旧的构建文件
npm run clean

# 标准构建（推荐）
npm run build

# 干净构建（移除所有路径信息）
npm run build:clean

# 仅移除路径信息
npm run remove-paths

# 分析构建结果
npm run analyze
```

### 发布流程
```bash
# 更新版本
npm run version:patch  # 或 minor/major

# 发布到 npm
npm run release
```

## 构建模式对比

| 模式 | 命令 | 包大小 | 特点 |
|------|------|--------|------|
| 标准构建 | `npm run build` | ~50KB | 依赖外部包，体积小，自动处理路径 |
| 完整构建 | `npm run build:full` | ~5MB | 包含所有依赖，独立运行 |
| 简单构建 | `npm run build:simple` | ~50KB | 快速构建，用于测试 |
| 干净构建 | `npm run build:clean` | ~50KB | 构建并清理路径信息 |

## 文件结构

发布后的包结构：
```
@dubuqingfeng/gitlab-mcp-server/
├── dist/
│   ├── index.js          # 主入口（可执行）
│   └── http-server.js    # HTTP 服务器
├── README.md
└── LICENSE
```

## 路径信息处理

构建过程会自动处理以下路径信息：
- 移除用户特定路径（如 `/Users/username/...`）
- 将绝对路径转换为相对路径
- 保留必要的模块引用路径（如 `src/...`）

如果需要手动清理路径：
```bash
npm run remove-paths
```

## 注意事项

1. **依赖管理**：标准构建模式下，用户需要安装 dependencies
2. **Node 版本**：要求 Node.js >= 18.0.0
3. **可执行权限**：构建脚本会自动为 `index.js` 添加可执行权限
4. **隐私保护**：构建产物不包含开发环境的绝对路径信息

## 故障排除

### 包体积过大
- 使用 `npm run analyze` 查看具体文件大小
- 考虑使用 `--external` 标记更多依赖
- 检查是否有不必要的文件被包含

### 构建失败
- 确保已安装所有 devDependencies
- 运行 `npm run clean` 清理旧文件
- 检查 TypeScript 配置是否正确

### 路径信息泄露
- 使用 `npm run build:clean` 进行干净构建
- 检查是否启用了 source map
- 运行 `npm run remove-paths` 手动清理 