import { Gitlab } from '@gitbeaker/rest';
import { GitlabProjectIDMap } from './config.js';
import { loggers } from '../utils/logger.js';

// 创建 GitLab API 客户端实例
const getGitlabClient = () => {
  const token = process.env.GITLAB_TOKEN;
  const host = process.env.GITLAB_URL || 'https://gitlab.com';
  
  if (!token) {
    throw new Error('GITLAB_TOKEN environment variable is required');
  }

  return new Gitlab({
    host,
    token,
  });
};

export interface MergeRequestParams {
  projectId: string | number;
  mergeRequestIid: number;
}

export interface ListMergeRequestsOptions {
  state?: 'opened' | 'closed' | 'merged' | 'all';
  per_page?: number;
  page?: number;
}


// 使用 gitbeaker 的内置类型
export type MergeRequest = any; // gitbeaker 会提供正确的类型

export class GitlabService {

  static async getProjectIdByUrl(projectPathOrUrl: string): Promise<number> {
    let projectPath: string;
    
    // 如果输入的是完整URL，提取项目路径
    if (projectPathOrUrl.startsWith('http')) {
      try {
        const urlObj = new URL(projectPathOrUrl);
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        
        // 找到 - 或者其他GitLab路径标识符的位置，项目路径在它之前
        const dashIndex = pathParts.findIndex(part => part === '-');
        if (dashIndex !== -1) {
          projectPath = pathParts.slice(0, dashIndex).join('/');
        } else {
          // 如果没有找到 -，可能是简单的项目路径
          projectPath = pathParts.join('/');
        }
      } catch (error) {
        throw new Error(`Invalid URL format: ${projectPathOrUrl}`);
      }
    } else {
      // 直接使用项目路径
      projectPath = projectPathOrUrl;
    }
    
    if (!projectPath) {
      throw new Error(`Could not extract project path from: ${projectPathOrUrl}`);
    }
    
    // 首先检查缓存（只检查项目名称，保持向后兼容）
    const projectName = projectPath.split('/').pop();
    if (projectName) {
      const cachedId = GitlabProjectIDMap.get(projectName);
      if (cachedId) {
        return cachedId;
      } else {
        loggers.gitlab.info(`Project ${projectName} not found in GitlabProjectIDMap, will try to get project ID from API`);
      }
    }
    
    // 通过API获取项目信息
    try {
      const api = getGitlabClient();
      // 使用完整的项目路径进行查询
      const project = await api.Projects.show(projectPath);
      return project.id;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get project ID for "${projectPath}": ${error.message}`);
      }
      throw error;
    }
  }

  static async getMergeRequest({ projectId, mergeRequestIid }: MergeRequestParams): Promise<MergeRequest> {
    try {
      const api = getGitlabClient();
      const mergeRequest = await api.MergeRequests.show(projectId, mergeRequestIid);
      return mergeRequest;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  static async listMergeRequests(
    projectId: string | number, 
    options: ListMergeRequestsOptions = {}
  ): Promise<MergeRequest[]> {
    try {
      const api = getGitlabClient();
      const { state = 'opened', per_page = 20, page = 1 } = options;
      
      // 修正 state 类型，去掉 'all' 选项
      const validState = state === 'all' ? undefined : state;
      
      const mergeRequests = await api.MergeRequests.all({
        projectId,
        state: validState,
        perPage: per_page,
        page,
      });
      
      return Array.isArray(mergeRequests) ? mergeRequests : [mergeRequests];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  static async getProject(projectId: string | number) {
    try {
      const api = getGitlabClient();
      const project = await api.Projects.show(projectId);
      return project;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  // 暂时移除这些可能不支持的方法，专注于核心功能
  // static async getMergeRequestApprovals(projectId: string | number, mergeRequestIid: number) {
  //   // 审批功能可能需要企业版或特定配置
  // }

  static async getMergeRequestChanges(projectId: string | number, mergeRequestIid: number) {
    try {
      const api = getGitlabClient();
      
      // 使用新的 API 方法获取 MR 基本信息和 diffs
      const [mr, diffs] = await Promise.all([
        api.MergeRequests.show(projectId, mergeRequestIid),
        api.MergeRequests.allDiffs(projectId, mergeRequestIid)
      ]);
      
      // 将 diffs 转换为与旧格式兼容的 changes 结构
      const changes = Array.isArray(diffs) ? diffs.map((diff: any) => ({
        old_path: diff.old_path,
        new_path: diff.new_path,
        a_mode: diff.a_mode,
        b_mode: diff.b_mode,
        diff: diff.diff,
        new_file: diff.new_file,
        renamed_file: diff.renamed_file,
        deleted_file: diff.deleted_file
      })) : [];
      
      // Return the merge request data - we'll analyze based on available info
      return {
        merge_request: mr,
        source_branch: mr.source_branch,
        target_branch: mr.target_branch,
        changes: changes,
        title: mr.title,
        description: mr.description
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  static formatMergeRequest(mr: MergeRequest): string {
    const status = mr.draft || mr.work_in_progress ? '🚧 Draft' : mr.state;
    const conflicts = mr.has_conflicts ? '⚠️ Has conflicts' : '✅ No conflicts';
    const mergeStatus = mr.detailed_merge_status || mr.merge_status || 'unknown';
    
    return `
📋 **Merge Request #${mr.iid}**
📌 **Title**: ${mr.title}
📊 **Status**: ${status}
🔀 **Branch**: ${mr.source_branch} → ${mr.target_branch}
👤 **Author**: ${mr.author?.name || 'Unknown'} (@${mr.author?.username || 'unknown'})
👥 **Assignees**: ${mr.assignees?.length > 0 ? mr.assignees.map((a: any) => `${a.name} (@${a.username})`).join(', ') : 'None'}
👁️ **Reviewers**: ${mr.reviewers?.length > 0 ? mr.reviewers.map((r: any) => `${r.name} (@${r.username})`).join(', ') : 'None'}
🔄 **Merge Status**: ${mergeStatus}
${conflicts}
💬 **Comments**: ${mr.user_notes_count || 0}
👍 **Upvotes**: ${mr.upvotes || 0} | 👎 **Downvotes**: ${mr.downvotes || 0}
📅 **Created**: ${new Date(mr.created_at).toLocaleString('zh-CN')}
📝 **Updated**: ${new Date(mr.updated_at).toLocaleString('zh-CN')}
🔗 **URL**: ${mr.web_url}

**Description**:
${mr.description || 'No description provided'}
    `.trim();
  }

  static formatMergeRequestList(mrs: MergeRequest[]): string {
    if (mrs.length === 0) {
      return 'No merge requests found.';
    }

    const summary = `Found ${mrs.length} merge request(s):\n\n`;
    const formattedMRs = mrs.map(mr => {
      const status = mr.draft || mr.work_in_progress ? '🚧' : 
                    mr.state === 'opened' ? '🟢' : 
                    mr.state === 'merged' ? '🟣' : '🔴';
      const conflicts = mr.has_conflicts ? '⚠️' : '';
      return `${status} **#${mr.iid}** ${mr.title} ${conflicts}
   👤 ${mr.author?.name || 'Unknown'} | 🔀 ${mr.source_branch} → ${mr.target_branch}
   📅 ${new Date(mr.updated_at).toLocaleDateString()} | 🔗 ${mr.web_url}`;
    }).join('\n\n');

    return summary + formattedMRs;
  }

  static async writeNote(projectId: string | number, mergeRequestIid: number, note: string) {
    try {
      const api = getGitlabClient();
      const result = await api.MergeRequestNotes.create(projectId, mergeRequestIid, note);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  static formatChanges(changes: any, options: {
    maxDiffLines?: number;
    maxFiles?: number; 
    locale?: 'zh' | 'en';
    showFullDiff?: boolean;
    showFullFiles?: boolean;
  } = {}): string {
    const {
      maxDiffLines = 20,
      maxFiles = 10,
      locale = 'zh',
      showFullDiff = false,
      showFullFiles = false,
    } = options;

    // 国际化文本
    const i18n = {
      zh: {
        noChanges: '没有发现文件变更',
        filesSummary: (count: number) => `📁 **文件变更汇总** (共 ${count} 个文件)`,
        moreFiles: (remaining: number) => `\n📋 **还有 ${remaining} 个文件未显示**`,
        moreChanges: (total: number, shown: number) => `   *... 还有 ${total - shown} 行变更*`,
        status: {
          new: '🆕 新增',
          deleted: '🗑️ 删除',
          renamed: '📝 重命名',
          modified: '✏️ 修改'
        }
      },
      en: {
        noChanges: 'No file changes found',
        filesSummary: (count: number) => `📁 **File Changes Summary** (${count} files total)`,
        moreFiles: (remaining: number) => `\n📋 **${remaining} more files not shown**`,
        moreChanges: (total: number, shown: number) => `   *... ${total - shown} more lines*`,
        status: {
          new: '🆕 Added',
          deleted: '🗑️ Deleted', 
          renamed: '📝 Renamed',
          modified: '✏️ Modified'
        }
      }
    };

    const t = i18n[locale];

    if (!changes.changes || changes.changes.length === 0) {
      return t.noChanges;
    }

    let output = `${t.filesSummary(changes.changes.length)}\n\n`;
    
    // 限制显示的文件数量
    const filesToShow = showFullFiles ? changes.changes : changes.changes.slice(0, maxFiles);
    const remainingFiles = showFullFiles ? 0 : changes.changes.length - maxFiles;

    
    for (const change of filesToShow) {
      const { old_path, new_path, deleted_file, new_file, renamed_file } = change;
      
      let status = '';
      if (new_file) {
        status = t.status.new;
      } else if (deleted_file) {
        status = t.status.deleted;
      } else if (renamed_file) {
        status = t.status.renamed;
      } else {
        status = t.status.modified;
      }
      
      const filePath = new_path || old_path;
      output += `${status} **${filePath}**\n`;
      
      if (renamed_file && old_path !== new_path) {
        output += `   📂 ${old_path} → ${new_path}\n`;
      }
      
      if (change.diff) {
        const allLines = change.diff.split('\n');
        
        if (showFullDiff || allLines.length <= maxDiffLines) {
          // 显示完整diff或者行数不超过限制
          output += `\`\`\`diff\n${change.diff}\n\`\`\`\n`;
        } else {
          // 截断diff并显示提示
          const diffPreview = allLines.slice(0, maxDiffLines).join('\n');
          output += `\`\`\`diff\n${diffPreview}\n\`\`\`\n`;
          output += `${t.moreChanges(allLines.length, maxDiffLines)}\n`;
        }
      }
      
      output += '\n';
    }
    
    // 如果有更多文件未显示，添加提示
    if (remainingFiles > 0) {
      output += t.moreFiles(remainingFiles);
    }
    
    return output;
  }

  static extractFileExtensions(changes: any): string[] {
    if (!changes.changes) return [];
    
    const extensions = new Set<string>();
    for (const change of changes.changes) {
      const filePath = change.new_path || change.old_path;
      if (filePath) {
        const match = filePath.match(/\.([^.]+)$/);
        if (match) {
          extensions.add(match[1]);
        }
      }
    }
    
    return Array.from(extensions);
  }

  static extractFilePaths(changes: any): string[] {
    if (!changes.changes) return [];
    
    return changes.changes.map((change: any) => change.new_path || change.old_path).filter(Boolean);
  }

  /**
   * 解析GitLab MR URL，提取项目路径和MR ID
   */
  static parseGitlabMrUrl(url: string): { projectPath: string; mergeRequestIid: number } {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      // 查找 merge_requests 的位置
      const mrIndex = pathParts.findIndex(part => part === 'merge_requests');
      if (mrIndex === -1 || mrIndex === pathParts.length - 1) {
        throw new Error('Invalid GitLab merge request URL format');
      }
      
      // 获取MR ID
      const mergeRequestIid = parseInt(pathParts[mrIndex + 1]);
      if (isNaN(mergeRequestIid)) {
        throw new Error('Invalid merge request ID in URL');
      }
      
      // 获取项目路径（去除 -/merge_requests 部分）
      const dashIndex = pathParts.findIndex(part => part === '-');
      const projectEndIndex = dashIndex !== -1 ? dashIndex : mrIndex;
      const projectPath = pathParts.slice(0, projectEndIndex).join('/');
      
      if (!projectPath) {
        throw new Error('Could not extract project path from URL');
      }
      
      return { projectPath, mergeRequestIid };
    } catch (error) {
      throw new Error(`Failed to parse GitLab URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取项目ID和MR ID，支持URL和显式参数两种方式
   */
  static async getProjectAndMRInfo(params: {
    projectId?: string;
    mergeRequestIid?: number;
    url?: string;
  }): Promise<{ projectId: number; mergeRequestIid: number }> {
    // 优先使用URL解析
    if (params.url) {
      const { projectPath, mergeRequestIid } = this.parseGitlabMrUrl(params.url);
      const projectId = await this.getProjectIdByUrl(projectPath);
      return { projectId, mergeRequestIid };
    }
    
    // 使用显式参数
    if (params.projectId && params.mergeRequestIid) {
      let projectId: number;
      
      // 如果projectId是数字字符串，直接转换
      if (typeof params.projectId === 'string' && /^\d+$/.test(params.projectId)) {
        projectId = parseInt(params.projectId);
      } 
      // 如果是项目路径，需要获取项目ID
      else if (typeof params.projectId === 'string') {
        projectId = await this.getProjectIdByUrl(params.projectId);
      } 
      // 其他情况当作数字处理
      else {
        projectId = Number(params.projectId);
      }
      
      return { projectId, mergeRequestIid: params.mergeRequestIid };
    }
    
    throw new Error('请提供有效的项目ID和MR ID，或者提供完整的GitLab MR URL');
  }

  /**
   * 基于 MR 信息和文件变更检测项目类型
   * @param mr Merge Request 信息
   * @param changes 文件变更信息（可选）
   * @returns 检测到的项目类型数组
   */
  static detectProjectTypes(mr: MergeRequest, changes?: any): string[] {
    const detectedTypes: string[] = [];
    const typesSet = new Set<string>();
    
    // 从 MR 信息中提取关键词进行分析
    const projectName = mr.project?.name || '';
    const branchName = mr.source_branch || '';
    const title = mr.title || '';
    const description = mr.description || '';
    const analysisContext = [projectName, branchName, title, description].join(' ').toLowerCase();
    
    // 基于关键词检测项目类型
    const keywordPatterns = [
      { keywords: ['typescript', 'tsx', 'ts'], type: 'typescript' },
      { keywords: ['react', 'jsx'], type: 'react' },
      { keywords: ['node', 'npm', 'nodejs'], type: 'node' },
      { keywords: ['go', 'golang'], type: 'go' },
      { keywords: ['python', 'py', 'pip'], type: 'python' },
      { keywords: ['rust', 'rs', 'cargo'], type: 'rust' },
      { keywords: ['shell', 'sh', 'bash', 'zsh'], type: 'sh' },
      { keywords: ['backend', 'api', 'server'], type: 'backend' },
      { keywords: ['database', 'sql', 'migration'], type: 'database' }
    ];
    
    // 从 MR 上下文中检测类型
    keywordPatterns.forEach(({ keywords, type }) => {
      if (keywords.some(keyword => analysisContext.includes(keyword))) {
        typesSet.add(type);
      }
    });
    
    // 如果有文件变更信息，基于文件扩展名和路径进行更精确的检测
    if (changes?.changes && changes.changes.length > 0) {
      const filePaths = changes.changes.map((change: any) => 
        change.new_path || change.old_path
      ).filter(Boolean);
      
      // 基于文件扩展名检测
      const extensionPatterns = [
        { extensions: ['.ts', '.tsx'], types: ['typescript'] },
        { extensions: ['.jsx', '.tsx'], types: ['react'] },
        { extensions: ['.js', '.mjs'], types: ['javascript', 'node'] },
        { extensions: ['.go'], types: ['go'] },
        { extensions: ['.py'], types: ['python'] },
        { extensions: ['.rs'], types: ['rust'] },
        { extensions: ['.sh', '.bash', '.zsh'], types: ['sh'] },
        { extensions: ['.sql'], types: ['database'] }
      ];
      
      filePaths.forEach((filePath: string) => {
        // 检测文件扩展名
        extensionPatterns.forEach(({ extensions, types }) => {
          if (extensions.some(ext => filePath.endsWith(ext))) {
            types.forEach(type => typesSet.add(type));
          }
        });
        
        // 检测特定文件名模式
        const filePatterns = [
          { patterns: ['package.json', 'node_modules'], types: ['node'] },
          { patterns: ['tsconfig.json'], types: ['typescript'] },
          { patterns: ['go.mod', 'go.sum'], types: ['go'] },
          { patterns: ['requirements.txt', 'pyproject.toml', 'setup.py'], types: ['python'] },
          { patterns: ['Cargo.toml', 'Cargo.lock'], types: ['rust'] },
          { patterns: ['Dockerfile', 'docker-compose'], types: ['backend'] },
          { patterns: ['migration', 'schema'], types: ['database'] }
        ];
        
        filePatterns.forEach(({ patterns, types }) => {
          if (patterns.some(pattern => filePath.includes(pattern))) {
            types.forEach(type => typesSet.add(type));
          }
        });
      });
      
      // 如果检测到 React 相关文件，确保也添加 TypeScript（如果有 .tsx）
      if (typesSet.has('react') && filePaths.some((fp: string) => fp.endsWith('.tsx'))) {
        typesSet.add('typescript');
      }
    }
    
    // 如果没有检测到任何类型，返回通用类型
    detectedTypes.push(...Array.from(typesSet));
    if (detectedTypes.length === 0) {
      detectedTypes.push('*');
    }
    
    return detectedTypes;
  }

  /**
   * 获取指定分支的所有文件列表
   */
  static async getBranchFiles(projectId: string | number, branch: string = 'main', recursive: boolean = true): Promise<any[]> {
    try {
      const api = getGitlabClient();
      
      // 获取分支的文件树
      const tree = await api.Repositories.allRepositoryTrees(projectId, {
        ref: branch,
        recursive: recursive,
        perPage: 1000 // 增加单页限制
      });
      
      // 过滤出文件（排除目录）
      const files = Array.isArray(tree) ? tree.filter((item: any) => item.type === 'blob') : [];
      
      return files;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取指定文件的内容
   */
  static async getFileContent(projectId: string | number, filePath: string, branch: string = 'main'): Promise<string> {
    try {
      const api = getGitlabClient();
      
      const file = await api.RepositoryFiles.show(projectId, filePath, branch);
      
      // GitLab返回的内容是base64编码的
      if (file.content && file.encoding === 'base64') {
        return Buffer.from(file.content, 'base64').toString('utf-8');
      }
      
      return file.content || '';
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get file content: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取指定提交的详细信息
   */
  static async getCommit(projectId: string | number, commitSha: string): Promise<any> {
    try {
      const api = getGitlabClient();
      const commit = await api.Commits.show(projectId, commitSha);
      return commit;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取指定提交的文件变更 (简化版本，基于提交信息推断)
   */
  static async getCommitDiff(projectId: string | number, commitSha: string): Promise<any> {
    try {
      const api = getGitlabClient();
      // 获取提交详细信息，其中包含stats等基础变更信息
      const commit = await api.Commits.show(projectId, commitSha);
      
      // 注意：这是一个简化的实现，主要提供提交的基本信息
      // 如需完整的diff内容，可能需要额外的API调用或使用其他端点
      const stats = commit.stats || {};
      
      return {
        commit_sha: commitSha,
        changes: [], // 暂时为空，可以在后续版本中扩展
        stats: {
          additions: stats.additions || 0,
          deletions: stats.deletions || 0,
          total: stats.total || 0
        },
        files_changed: commit.stats?.total || 0,
        message: commit.message,
        author: commit.author_name
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取分支信息
   */
  static async getBranch(projectId: string | number, branchName: string): Promise<any> {
    try {
      const api = getGitlabClient();
      const branch = await api.Branches.show(projectId, branchName);
      return branch;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 列出项目的所有分支
   */
  static async listBranches(projectId: string | number, search?: string): Promise<any[]> {
    try {
      const api = getGitlabClient();
      const branches = await api.Branches.all(projectId, {
        search: search,
        perPage: 100
      });
      
      return Array.isArray(branches) ? branches : [branches];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 格式化分支代码审查报告
   */
  static formatBranchCodeReview(branch: any, files: any[], projectName: string, detectedTypes: string[]): string {
    return `
🌿 **分支代码审查报告**

📋 **分支信息**
- **分支名**: ${branch.name}
- **项目**: ${projectName}
- **最新提交**: ${branch.commit?.short_id} - ${branch.commit?.title}
- **作者**: ${branch.commit?.author_name}
- **提交时间**: ${new Date(branch.commit?.committed_date).toLocaleString('zh-CN')}

📂 **代码库概览**
- **文件总数**: ${files.length}
- **检测到的项目类型**: ${detectedTypes.join(', ')}

📁 **文件结构**
${files.slice(0, 20).map(file => `- ${file.path} (${file.mode})`).join('\n')}
${files.length > 20 ? `\n... 还有 ${files.length - 20} 个文件` : ''}
    `.trim();
  }

  /**
   * 格式化提交审查报告
   */
  static formatCommitReview(commit: any, changes: any, projectName: string): string {
    return `
📝 **提交代码审查报告**

📋 **提交信息**
- **提交SHA**: ${commit.short_id} (${commit.id})
- **项目**: ${projectName}
- **标题**: ${commit.title}
- **作者**: ${commit.author_name} <${commit.author_email}>
- **提交时间**: ${new Date(commit.committed_date).toLocaleString('zh-CN')}
- **提交者**: ${commit.committer_name} <${commit.committer_email}>

📝 **提交描述**:
${commit.message || '无描述'}

🔍 **文件变更**
${changes.changes && changes.changes.length > 0 ? `共修改了 ${changes.changes.length} 个文件` : '无文件变更'}
    `.trim();
  }

  /**
   * 为提交写评论
   */
  static async writeCommitNote(projectId: string | number, commitSha: string, note: string) {
    try {
      const api = getGitlabClient();
      const result = await api.CommitDiscussions.create(projectId, commitSha, note);
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GitLab API error: ${error.message}`);
      }
      throw error;
    }
  }
}
