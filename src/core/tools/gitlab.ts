import { FastMCP } from "fastmcp";
import { z } from "zod";
import * as services from "../services/index.js";
import { 
  CodeReviewRule,
  detectProjectType, 
  getApplicableRules, 
  getDefaultRulesForProjectTypes, 
  formatRulesOutput,
  PROJECT_TYPES,
  CODE_REVIEW_RULES
} from "../utils/codereview/rules.js";
import {
  getProjectSpecificRules,
  getConfiguredProjects
} from "../utils/codereview/project-rules.js";
import {
  logFormattedContent,
  formatRulesByCategory,
  collectMergeRequestRules
} from "../utils/gitlab-helpers.js";
import { loggers } from "../utils/logger.js";

/**
 * Register all tools with the MCP server
 * 
 * @param server The FastMCP server instance
 */
export function registerGitlabTools(server: FastMCP) {
  // GitLab Merge Request 工具
  server.addTool({
    name: "get_merge_request",
    description: "Get detailed information about a specific GitLab merge request",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      mergeRequestIid: z.number().describe("Merge request IID (internal ID shown in GitLab UI)")
    }),
    execute: async (params) => {
      try {
        const mergeRequest = await services.GitlabService.getMergeRequest({
          projectId: params.projectId,
          mergeRequestIid: params.mergeRequestIid
        });
        
        return services.GitlabService.formatMergeRequest(mergeRequest);
      } catch (error) {
        return `Error fetching merge request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  // GitLab Merge Requests 列表工具
  server.addTool({
    name: "list_merge_requests",
    description: "List merge requests for a GitLab project",
    parameters: z.object({
      projectId: z.union([z.string(), z.number()]).describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      state: z.enum(['opened', 'closed', 'merged', 'all']).optional().describe("Filter by merge request state (default: opened)"),
      per_page: z.number().min(1).max(100).optional().describe("Number of results per page (default: 20)"),
      page: z.number().min(1).optional().describe("Page number (default: 1)")
    }),
    execute: async (params) => {
      try {
        const mergeRequests = await services.GitlabService.listMergeRequests(params.projectId, {
          state: params.state,
          per_page: params.per_page,
          page: params.page
        });
        
        if (mergeRequests.length === 0) {
          return `No merge requests found for project ${params.projectId} with state "${params.state || 'opened'}"`;
        }
        
        const summary = `Found ${mergeRequests.length} merge request(s) for project ${params.projectId}:\n\n`;

        // 获取详细 diff
        const changes = await services.GitlabService.getMergeRequestChanges(params.projectId, mergeRequests[0].iid);

        let review = '';
        // Add changes summary if available
        if (changes.changes && changes.changes.length > 0) {
          review += `🔍 **Diff 信息**\n`;
          review += services.GitlabService.formatChanges(changes, {
            locale: 'zh',
            showFullDiff: true,
            showFullFiles: true
          });
          review += '\n';
        }
        const formattedMRs = mergeRequests.map(mr => {
          const status = mr.draft || mr.work_in_progress ? '🚧' : 
                        mr.state === 'opened' ? '🟢' : 
                        mr.state === 'merged' ? '🟣' : '🔴';
          const conflicts = mr.has_conflicts ? '⚠️' : '';
          return `${status} **#${mr.iid}** ${mr.title} ${conflicts}
   👤 ${mr.author.name} | 🔀 ${mr.source_branch} → ${mr.target_branch}
   📅 ${new Date(mr.updated_at).toLocaleDateString()} | 🔗 ${mr.web_url}`;
        }).join('\n\n');
        
        return summary + review + formattedMRs;
      } catch (error) {
        return `Error fetching merge requests: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  // Code Review Rules 工具
  server.addTool({
    name: "get_code_review_rules",
    description: "Get code review rules based on project type and file extensions. Automatically detects project type or allows manual specification.",
    parameters: z.object({
      projectTypes: z.array(z.string()).optional().describe("Specific project types to get rules for (e.g., ['typescript', 'react']). If not provided, will attempt auto-detection."),
      filePaths: z.array(z.string()).optional().describe("File paths to analyze for project type detection and rule applicability (e.g., ['src/App.tsx', 'package.json'])"),
      fileName: z.string().optional().describe("Specific file name to get applicable rules for (e.g., 'App.tsx', 'main.go', 'api.py')"),
      category: z.enum(['security', 'performance', 'maintainability', 'style', 'best-practice']).optional().describe("Filter rules by category"),
      severity: z.enum(['error', 'warning', 'info']).optional().describe("Filter rules by severity level"),
      includeUniversal: z.boolean().optional().default(true).describe("Include universal rules that apply to all projects (default: true)")
    }),
    execute: async (params) => {
      try {
        let projectTypes: string[] = [];
        
        // Detect project types if not provided
        if (!params.projectTypes || params.projectTypes.length === 0) {
          if (params.filePaths && params.filePaths.length > 0) {
            projectTypes = detectProjectType(params.filePaths);
            if (projectTypes.length === 0) {
              return "❌ Could not detect project type from provided file paths. Please specify project types manually.";
            }
          } else {
            // Return available project types for user to choose from
            const availableTypes = Object.entries(PROJECT_TYPES).map(([id, config]) => 
              `• **${config.name}** (${id}): ${config.description}`
            ).join('\n');
            
            return `🔍 **Available Project Types:**\n\n${availableTypes}\n\n` +
                   `Please specify projectTypes parameter or provide filePaths for auto-detection.`;
          }
        } else {
          projectTypes = params.projectTypes;
        }

        let applicableRules;
        
        // Get rules for specific file or all applicable rules
        if (params.fileName) {
          applicableRules = getApplicableRules(
            params.fileName, 
            projectTypes, 
            params.includeUniversal
          );
        } else {
          applicableRules = getDefaultRulesForProjectTypes(projectTypes);
        }

        // Apply filters
        if (params.category) {
          applicableRules = applicableRules.filter(rule => rule.category === params.category);
        }
        
        if (params.severity) {
          applicableRules = applicableRules.filter(rule => rule.severity === params.severity);
        }

        // Format output
        let output = `🎯 **Detected Project Types:** ${projectTypes.map(pt => PROJECT_TYPES[pt]?.name || pt).join(', ')}\n\n`;
        
        if (params.fileName) {
          output += `📄 **File:** ${params.fileName}\n\n`;
        }
        
        if (params.category) {
          output += `🏷️ **Category Filter:** ${params.category}\n\n`;
        }
        
        if (params.severity) {
          output += `⚠️ **Severity Filter:** ${params.severity}\n\n`;
        }
        
        output += formatRulesOutput(applicableRules);
        
        return output;
      } catch (error) {
        return `❌ Error getting code review rules: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  // 获取所有可用规则的工具
  server.addTool({
    name: "list_all_code_review_rules",
    description: "List all available code review rules with their details",
    parameters: z.object({
      category: z.enum(['security', 'performance', 'maintainability', 'style', 'best-practice']).optional().describe("Filter rules by category"),
      severity: z.enum(['error', 'warning', 'info']).optional().describe("Filter rules by severity level"),
      projectType: z.string().optional().describe("Filter rules by project type (e.g., 'typescript', 'react', 'go')")
    }),
    execute: async (params) => {
      try {
        let rules = Object.values(CODE_REVIEW_RULES);
        
        // Apply filters
        if (params.category) {
          rules = rules.filter(rule => rule.category === params.category);
        }
        
        if (params.severity) {
          rules = rules.filter(rule => rule.severity === params.severity);
        }
        
        if (params.projectType) {
          rules = rules.filter(rule => 
            rule.projectTypes?.includes(params.projectType!) || 
            rule.projectTypes?.includes('*')
          );
        }
        
        let output = `📚 **All Available Code Review Rules**\n\n`;
        
        if (params.category) {
          output += `🏷️ **Category Filter:** ${params.category}\n\n`;
        }
        
        if (params.severity) {
          output += `⚠️ **Severity Filter:** ${params.severity}\n\n`;
        }
        
        if (params.projectType) {
          output += `🎯 **Project Type Filter:** ${params.projectType}\n\n`;
        }
        
        output += formatRulesOutput(rules);
        
        return output;
      } catch (error) {
        return `❌ Error listing code review rules: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  // 获取项目类型信息的工具
  server.addTool({
    name: "get_project_types",
    description: "Get information about available project types and their detection patterns",
    parameters: z.object({
      filePaths: z.array(z.string()).optional().describe("File paths to analyze for project type detection")
    }),
    execute: async (params) => {
      try {
        let output = `🏗️ **Available Project Types**\n\n`;
        
        if (params.filePaths && params.filePaths.length > 0) {
          const detectedTypes = detectProjectType(params.filePaths);
          output += `🔍 **Detected Types for provided files:** ${detectedTypes.length > 0 ? detectedTypes.join(', ') : 'None detected'}\n\n`;
          output += `📁 **Analyzed Files:** ${params.filePaths.join(', ')}\n\n`;
        }
        
        for (const [typeId, config] of Object.entries(PROJECT_TYPES)) {
          output += `🎯 **${config.name}** (${typeId})\n`;
          output += `   📝 ${config.description}\n`;
          output += `   🔍 Detection patterns: ${config.patterns.join(', ')}\n`;
          output += `   📋 Default rules: ${config.defaultRules.length} rules\n\n`;
        }
        
        return output;
      } catch (error) {
        return `❌ Error getting project types: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  // 获取项目特定规则配置的工具
  server.addTool({
    name: "get_project_specific_rules",
    description: "Get project-specific code review rules configuration",
    parameters: z.object({
      projectIdentifier: z.union([z.string(), z.number()]).optional().describe("Project identifier to get rules for. If not provided, lists all configured projects."),
      includeBuiltinRules: z.boolean().optional().default(true).describe("Include built-in default rules in the output")
    }),
    execute: async (params) => {
      try {
        if (params.projectIdentifier) {
          // 获取特定项目的规则
          const projectConfig = getProjectSpecificRules(params.projectIdentifier);
          
          if (!projectConfig) {
            return `❌ No project-specific rules found for project: ${params.projectIdentifier}`;
          }
          
          let output = `📋 **Project-Specific Rules Configuration**\n\n`;
          output += `🎯 **Project**: ${projectConfig.projectName}\n`;
          output += `📌 **Identifier**: ${projectConfig.projectIdentifier}\n`;
          
          if (projectConfig.description) {
            output += `📝 **Description**: ${projectConfig.description}\n`;
          }
          
          output += `\n⚙️ **Configuration**:\n`;
          output += `- Enable Default Rules: ${projectConfig.enableDefaultRules !== false ? '✅' : '❌'}\n`;
          
          if (projectConfig.excludeDefaultRules && projectConfig.excludeDefaultRules.length > 0) {
            output += `- Excluded Default Rules: ${projectConfig.excludeDefaultRules.join(', ')}\n`;
          }
          
          if (projectConfig.additionalProjectTypes && projectConfig.additionalProjectTypes.length > 0) {
            output += `- Additional Project Types: ${projectConfig.additionalProjectTypes.join(', ')}\n`;
          }
          
          output += `\n📚 **Project-Specific Rules** (${projectConfig.rules.length} rules):\n\n`;
          output += formatRulesOutput(projectConfig.rules);
          
          if (params.includeBuiltinRules && projectConfig.enableDefaultRules !== false) {
            const projectTypes = projectConfig.additionalProjectTypes || [];
            const defaultRules = getDefaultRulesForProjectTypes(projectTypes);
            const filteredDefaultRules = defaultRules.filter(
              rule => !projectConfig.excludeDefaultRules?.includes(rule.id)
            );
            
            output += `\n📚 **Applicable Default Rules** (${filteredDefaultRules.length} rules):\n\n`;
            output += formatRulesOutput(filteredDefaultRules);
          }
          
          return output;
        } else {
          // 列出所有已配置的项目
          const configuredProjects = getConfiguredProjects();
          
          if (configuredProjects.length === 0) {
            return '❌ No project-specific rules configured. See documentation for how to configure project rules.';
          }
          
          let output = `📋 **Configured Projects with Specific Rules**\n\n`;
          output += `Total: ${configuredProjects.length} projects\n\n`;
          
          configuredProjects.forEach(project => {
            output += `🎯 **${project.name}**\n`;
            output += `   📌 Identifier: ${project.identifier}\n`;
            if (project.description) {
              output += `   📝 Description: ${project.description}\n`;
            }
            output += `   📚 Rules: ${project.ruleCount} project-specific rules\n\n`;
          });
          
          output += `💡 Use \`get_project_specific_rules\` with a projectIdentifier to see detailed rules for a specific project.`;
          
          return output;
        }
      } catch (error) {
        return `❌ Error getting project-specific rules: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "write_gitlab_mr_note",
    description: "Write a note to a GitLab merge request with configurable notification modes",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      mergeRequestIid: z.number().describe("Merge request IID (internal ID shown in GitLab UI)"),
      note: z.string().describe("Note to write to the merge request"),
      notificationMode: z.enum(['gitlab_only', 'lark_only', 'both']).optional().describe("Notification mode (default: based on GITLAB_NOTE_MODE env var or 'gitlab_only')")
    }),
    execute: async (params) => {
      try {
        // 获取通知模式：优先使用参数，其次环境变量，最后默认值
        const envMode = process.env.GITLAB_NOTE_MODE?.toLowerCase();
        let mode: 'gitlab_only' | 'lark_only' | 'both' = 'gitlab_only';
        
        if (params.notificationMode) {
          mode = params.notificationMode;
        } else if (envMode === 'gitlab_only' || envMode === 'lark_only' || envMode === 'both') {
          mode = envMode as 'gitlab_only' | 'lark_only' | 'both';
        }
        
        loggers.gitlab.info('Writing GitLab MR note', { 
          projectId: params.projectId, 
          mergeRequestIid: params.mergeRequestIid,
          mode 
        });
        
        let gitlabResult = null;
        let larkResult = { sent: false, error: null as any };
        
        // 根据 mode 分别调用服务
        if (mode === 'gitlab_only' || mode === 'both') {
          // 调用 GitLab 服务写入 note
          gitlabResult = await services.GitlabService.writeNote(
            params.projectId,
            params.mergeRequestIid,
            params.note
          );
          loggers.gitlab.info('GitLab note written successfully', { 
            noteId: gitlabResult.id 
          });
        }
        
        if (mode === 'lark_only' || mode === 'both') {
          // 调用 Lark 服务发送通知
          try {
            const larkClient = services.getLarkClient();
            
            if (larkClient.isConfigured()) {
              // 获取 MR 和项目信息用于构建 Lark 卡片
              const [mr, project] = await Promise.all([
                services.GitlabService.getMergeRequest({
                  projectId: params.projectId,
                  mergeRequestIid: params.mergeRequestIid
                }),
                services.GitlabService.getProject(params.projectId)
              ]);
              
              const card = larkClient.buildMRNoteCard({
                projectName: project.name || 'Unknown Project',
                mrTitle: mr.title || 'Unknown MR',
                mrUrl: mr.web_url || '',
                noteContent: params.note,
                author: gitlabResult?.author?.name || gitlabResult?.author?.username || 'System',
                mrIid: params.mergeRequestIid
              });
              
              await larkClient.sendCardMessage(card);
              larkResult.sent = true;
              loggers.gitlab.info('Lark notification sent successfully');
            } else {
              larkResult.error = 'Lark not configured';
              loggers.gitlab.warn('Lark service is not configured');
            }
          } catch (larkError) {
            larkResult.error = larkError instanceof Error ? larkError.message : 'Unknown error';
            loggers.gitlab.error('Failed to send Lark notification', { error: larkError });
            if (mode === 'lark_only') {
              throw new Error(`Lark notification failed: ${larkResult.error}`);
            }
          }
        }
        
        // 格式化返回结果
        let response = `✅ 操作完成 (模式: ${mode})\n\n`;
        
        if (gitlabResult) {
          response += `📝 **GitLab Note**\n`;
          response += `- ID: ${gitlabResult.id}\n`;
          response += `- 作者: ${gitlabResult.author?.name || 'Unknown'}\n`;
          response += `- 时间: ${new Date(gitlabResult.created_at).toLocaleString('zh-CN')}\n\n`;
        }
        
        if (larkResult.sent) {
          response += `🔔 **Lark 通知**: 已发送\n`;
        } else if (larkResult.error) {
          response += `⚠️ **Lark 通知**: 失败 - ${larkResult.error}\n`;
        }
        
        if (mode === 'gitlab_only') {
          response += `\n💡 提示: 仅写入 GitLab，未发送 Lark 通知`;
        } else if (mode === 'lark_only') {
          response += `\n💡 提示: 仅发送 Lark 通知，未写入 GitLab`;
        }
        
        return response;
      } catch (error) {
        loggers.gitlab.error('Failed to write GitLab MR note', { error });
        return `❌ 操作失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "gitlab_code_review",
    description: "Perform comprehensive code review for a GitLab merge request",
    parameters: z.object({
      projectId: z.string().optional().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      mergeRequestIid: z.number().optional().describe("Merge request IID (internal ID shown in GitLab UI)"),
      url: z.string().optional().describe("GitLab merge request URL"),
    }),
    execute: async (params) => {
      try {
        // 使用优化后的获取逻辑
        const { projectId, mergeRequestIid } = await services.GitlabService.getProjectAndMRInfo(params);
        
        // Get merge request details and changes
        const [mr, changes] = await Promise.all([
          services.GitlabService.getMergeRequest({
            projectId: projectId,
            mergeRequestIid: mergeRequestIid
          }),
          services.GitlabService.getMergeRequestChanges(projectId, mergeRequestIid)
        ]);

        // Get MR info for review report
        const projectName = mr.project?.name || '';
        const title = mr.title || '';
        
        // Detect project type based on MR info and changes
        let detectedTypes = services.GitlabService.detectProjectTypes(mr, changes);

        // Collect all applicable rules
        const ruleCollection = collectMergeRequestRules(mr, changes, detectedTypes);
        const { 
          allRules, 
          projectSpecificRules, 
          fileSpecificRules, 
          hasProjectConfig, 
          projectConfig 
        } = ruleCollection;

        loggers.gitlab.info('=== GitLab Code Review Content ===');
        loggers.gitlab.info(`\n--- Detected Types ---`);
        loggers.gitlab.info(JSON.stringify(detectedTypes, null, 2));
        loggers.gitlab.info(`\n--- Total Rules ---`);
        loggers.gitlab.info(`Total: ${allRules.length}, Project-specific: ${projectSpecificRules.length}, File-specific: ${fileSpecificRules.length}`);
        loggers.gitlab.info('\n=== End of Content ===\n');

        // Start building the review
        let review = `🔍 **GitLab Merge Request 代码审查报告**\n\n`;
        
        // MR Info section
        review += `📋 **MR信息**\n`;
        review += `- **标题**: ${title}\n`;
        review += `- **分支**: ${mr.source_branch} → ${mr.target_branch}\n`;
        review += `- **作者**: ${mr.author?.name || 'Unknown'}\n`;
        review += `- **状态**: ${mr.state}\n`;
        review += `- **项目**: ${projectName}\n\n`;

        if (detectedTypes.length > 0 && !detectedTypes.includes('*')) {
          review += `🎯 **检测到的项目类型**: ${detectedTypes.join(', ')}\n\n`;
        }

        // Changes summary
        if (changes.changes && changes.changes.length > 0) {
          review += `🔍 **Diff 信息**\n`;
          review += services.GitlabService.formatChanges(changes, {
            locale: 'zh',
            showFullDiff: true,
            showFullFiles: true
          });
          review += '\n';
          
          // File-specific rules info
          if (fileSpecificRules.length > 0) {
            const changedFiles = changes.changes.map(change => change.new_path || change.old_path).filter(Boolean);
            review += `📁 **基于变更文件的特定规则** (${changedFiles.length} 个文件):\n`;
            review += `变更文件: ${changedFiles.map(f => `\`${f}\``).join(', ')}\n\n`;
          }
        }

        // Project-specific configuration
        if (hasProjectConfig && projectConfig) {
          review += `🎯 **项目特定配置**: ${projectConfig.projectName}\n`;
          if (projectConfig.description) {
            review += `📝 ${projectConfig.description}\n`;
          }
          
          if (projectSpecificRules.length > 0) {
            review += `\n📋 **项目特定规则** (共 ${projectSpecificRules.length} 条特定规则):\n\n`;
            review += formatRulesByCategory(projectSpecificRules, '项目特定');
          }
        }

        // All applicable rules
        if (allRules.length > 0) {
          review += `📚 **适用的代码审查规则** (${allRules.length} 条):\n\n`;
          review += formatRulesByCategory(allRules);
        }

        // Review checklist
        review += `📝 **代码审查检查清单**:\n\n`;
        review += `- ✅ 代码逻辑是否正确且符合预期功能\n`;
        review += `- ✅ 是否遵循项目的编码规范和最佳实践\n`;
        review += `- ✅ 错误处理是否完善\n`;
        review += `- ✅ 性能是否有潜在问题\n`;
        review += `- ✅ 安全性检查（输入验证、权限控制等）\n`;
        review += `- ✅ 测试覆盖是否充分\n`;
        review += `- ✅ 文档和注释是否清晰\n`;
        review += `- ✅ 是否有代码重复或可以重构的地方\n\n`;

        // Suggestions
        review += `💡 **建议**:\n`;
        review += `- 请仔细检查每个变更的文件\n`;
        review += `- 关注边界条件和异常处理\n`;
        review += `- 确保新功能不会破坏现有功能\n`;
        review += `- 如有疑问，请及时与开发者沟通\n\n`;

        // Next steps
        review += `🔧 **后续操作**:\n`;
        review += `- 如需将此审查结果写入MR，请使用 write_gitlab_mr_note 工具\n`;
        review += `- 建议在实际审查代码后，提供具体的改进建议，需要把用到的规则也写入审查报告里\n`;
        // 添加当前审查时间
        review += `- 当前审查时间: ${new Date().toLocaleString('zh-CN')}\n`;
        
        // Prepare content for response
        const content = [
          {
            type: 'text',
            text: '请注意，以下是本次 merge request 的 diff 简要信息',
          },
          {
            type: 'text',
            text: '请注意，以下是本次 merge request 的 diff 信息，请根据 diff 信息进行 code review'
          },
          {
            type: 'text',
            text: review
          },
          {
            type: 'text',
            text: '请注意，你需要使用中文进行回复，并且需要使用 markdown 格式进行回复'
          },
          {
            type: 'text',
            text: '请注意你需要搜索相关的文件并一起纳入考虑',
          },
          {
            type: 'text',
            text: '请注意，你需要使用 write_gitlab_mr_note 工具自动写入 review 结果'
          }
        ];
        
        // Log formatted content
        logFormattedContent(content, 'GitLab Code Review Content');
        
        return JSON.stringify(content, null, 2);
      } catch (error) {
        return `❌ 代码审查失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "gitlab_branch_code_review",
    description: "Perform comprehensive code review for a specific branch in GitLab project",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      branchName: z.string().describe("Branch name to review (e.g., 'main', 'develop', 'feature/new-feature')"),
      maxFiles: z.number().optional().default(50).describe("Maximum number of files to analyze (default: 50)")
    }),
    execute: async (params) => {
      try {
        const { projectId, branchName, maxFiles = 50 } = params;
        
        // Get project and branch information
        const [project, branch, files] = await Promise.all([
          services.GitlabService.getProject(projectId),
          services.GitlabService.getBranch(projectId, branchName),
          services.GitlabService.getBranchFiles(projectId, branchName, true)
        ]);

        // Extract file paths for project type detection
        const filePaths = files.slice(0, 100).map((file: any) => file.path);
        const detectedTypes = services.GitlabService.detectProjectTypes({ project }, { changes: files.map(f => ({ new_path: f.path })) });

        // Get applicable rules for detected project types
        const applicableRules = getDefaultRulesForProjectTypes(detectedTypes);

        let review = `🌿 **分支代码审查报告**\n\n`;
        
        // Branch Info section
        review += `📋 **分支信息**\n`;
        review += `- **分支名**: ${branch.name}\n`;
        review += `- **项目**: ${project.name}\n`;
        review += `- **最新提交**: ${branch.commit?.short_id} - ${branch.commit?.title}\n`;
        review += `- **作者**: ${branch.commit?.author_name}\n`;
        review += `- **提交时间**: ${new Date(branch.commit?.committed_date).toLocaleString('zh-CN')}\n\n`;

        // Code overview
        review += `📂 **代码库概览**\n`;
        review += `- **文件总数**: ${files.length}\n`;
        review += `- **分析文件数**: ${Math.min(files.length, maxFiles)}\n`;
        if (detectedTypes.length > 0 && !detectedTypes.includes('*')) {
          review += `- **检测到的项目类型**: ${detectedTypes.join(', ')}\n`;
        }
        review += `\n`;

        // File structure (limited display)
        const displayFiles = files.slice(0, 20);
        review += `📁 **文件结构示例**\n`;
        review += displayFiles.map((file: any) => `- ${file.path}`).join('\n');
        if (files.length > 20) {
          review += `\n... 还有 ${files.length - 20} 个文件\n`;
        }
        review += `\n`;

        // Applicable rules
        if (applicableRules.length > 0) {
          review += `📚 **适用的代码审查规则** (${applicableRules.length} 条):\n\n`;
          review += formatRulesByCategory(applicableRules);
        }

        // Review checklist for branch
        review += `📝 **分支代码审查检查清单**:\n\n`;
        review += `- ✅ 项目结构是否合理且符合最佳实践\n`;
        review += `- ✅ 代码风格是否一致\n`;
        review += `- ✅ 安全性配置和实践\n`;
        review += `- ✅ 性能优化机会\n`;
        review += `- ✅ 文档和注释完整性\n`;
        review += `- ✅ 测试覆盖率\n`;
        review += `- ✅ 依赖管理和版本控制\n\n`;

        // Suggestions
        review += `💡 **建议**:\n`;
        review += `- 重点关注核心业务逻辑文件\n`;
        review += `- 检查配置文件的安全性\n`;
        review += `- 确保关键功能有适当的测试\n`;
        review += `- 如需详细文件分析，请使用 get_file_content 工具\n\n`;

        return review;
      } catch (error) {
        return `❌ 分支代码审查失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "gitlab_commit_review",
    description: "Perform code review for a specific commit in GitLab project",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      commitSha: z.string().describe("Commit SHA to review (full or short SHA)")
    }),
    execute: async (params) => {
      try {
        const { projectId, commitSha } = params;
        
        // Get project and commit information
        const [project, commit, commitDiff] = await Promise.all([
          services.GitlabService.getProject(projectId),
          services.GitlabService.getCommit(projectId, commitSha),
          services.GitlabService.getCommitDiff(projectId, commitSha)
        ]);

        // Basic project type detection based on commit title and message
        const detectedTypes = services.GitlabService.detectProjectTypes(
          { project, title: commit.title, description: commit.message }, 
          commitDiff
        );

        // Get applicable rules
        const applicableRules = getDefaultRulesForProjectTypes(detectedTypes);

        let review = `📝 **提交代码审查报告**\n\n`;
        
        // Commit Info section
        review += `📋 **提交信息**\n`;
        review += `- **提交SHA**: ${commit.short_id} (${commit.id})\n`;
        review += `- **项目**: ${project.name}\n`;
        review += `- **标题**: ${commit.title}\n`;
        review += `- **作者**: ${commit.author_name} <${commit.author_email}>\n`;
        review += `- **提交时间**: ${new Date(commit.committed_date).toLocaleString('zh-CN')}\n`;
        review += `- **提交者**: ${commit.committer_name} <${commit.committer_email}>\n\n`;

        // Commit message
        if (commit.message && commit.message !== commit.title) {
          review += `📝 **提交描述**:\n`;
          review += `\`\`\`\n${commit.message}\n\`\`\`\n\n`;
        }

        // Change statistics
        if (commitDiff.stats) {
          review += `📊 **变更统计**:\n`;
          review += `- **新增行数**: ${commitDiff.stats.additions}\n`;
          review += `- **删除行数**: ${commitDiff.stats.deletions}\n`;
          review += `- **总变更**: ${commitDiff.stats.total}\n`;
          review += `- **修改文件**: ${commitDiff.files_changed} 个\n\n`;
        }

        // Project type detection
        if (detectedTypes.length > 0 && !detectedTypes.includes('*')) {
          review += `🎯 **检测到的项目类型**: ${detectedTypes.join(', ')}\n\n`;
        }

        // Applicable rules
        if (applicableRules.length > 0) {
          review += `📚 **适用的代码审查规则** (${applicableRules.length} 条):\n\n`;
          review += formatRulesByCategory(applicableRules);
        }

        // Review checklist for commit
        review += `📝 **提交审查检查清单**:\n\n`;
        review += `- ✅ 提交信息是否清晰描述了变更内容\n`;
        review += `- ✅ 变更范围是否合理（单一职责）\n`;
        review += `- ✅ 代码变更是否遵循项目规范\n`;
        review += `- ✅ 是否有潜在的安全风险\n`;
        review += `- ✅ 性能影响评估\n`;
        review += `- ✅ 是否影响现有功能\n`;
        review += `- ✅ 测试覆盖是否充分\n\n`;

        // Suggestions
        review += `💡 **建议**:\n`;
        review += `- 检查提交是否遵循原子性原则\n`;
        review += `- 确认变更与提交信息的一致性\n`;
        review += `- 如需查看具体文件变更，请使用 MR 相关工具\n`;
        review += `- 考虑是否需要相应的文档更新\n\n`;

        return review;
      } catch (error) {
        return `❌ 提交审查失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "get_file_content",
    description: "Get the content of a specific file from a GitLab repository",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      filePath: z.string().describe("Path to the file in the repository (e.g., 'src/index.ts')"),
      branch: z.string().optional().default("main").describe("Branch name (default: 'main')")
    }),
    execute: async (params) => {
      try {
        const { projectId, filePath, branch = "main" } = params;
        
        const content = await services.GitlabService.getFileContent(projectId, filePath, branch);
        
        // Detect file type for appropriate formatting
        const fileExtension = filePath.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
          'ts': 'typescript',
          'tsx': 'typescript',
          'js': 'javascript',
          'jsx': 'javascript',
          'py': 'python',
          'go': 'go',
          'rs': 'rust',
          'java': 'java',
          'cpp': 'cpp',
          'c': 'c',
          'sh': 'bash',
          'yml': 'yaml',
          'yaml': 'yaml',
          'json': 'json',
          'md': 'markdown',
          'sql': 'sql'
        };
        
        const language = languageMap[fileExtension || ''] || '';
        
        return `📄 **文件内容**: \`${filePath}\` (分支: ${branch})\n\n\`\`\`${language}\n${content}\n\`\`\``;
      } catch (error) {
        return `❌ 获取文件内容失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "list_branches",
    description: "List all branches in a GitLab project",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      search: z.string().optional().describe("Search pattern for branch names")
    }),
    execute: async (params) => {
      try {
        const { projectId, search } = params;
        
        const branches = await services.GitlabService.listBranches(projectId, search);
        
        if (branches.length === 0) {
          return `没有找到分支${search ? ` (搜索: "${search}")` : ''}`;
        }

        let output = `🌿 **项目分支列表** (${branches.length} 个分支)${search ? ` - 搜索: "${search}"` : ''}\n\n`;
        
        branches.forEach((branch: any) => {
          const isDefault = branch.default ? ' 🏠 (默认)' : '';
          const isProtected = branch.protected ? ' 🔒' : '';
          output += `- **${branch.name}**${isDefault}${isProtected}\n`;
          if (branch.commit) {
            output += `  📝 ${branch.commit.short_id}: ${branch.commit.title}\n`;
            output += `  👤 ${branch.commit.author_name} | 📅 ${new Date(branch.commit.committed_date).toLocaleDateString()}\n`;
          }
          output += '\n';
        });
        
        return output;
      } catch (error) {
        return `❌ 获取分支列表失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });

  server.addTool({
    name: "write_gitlab_commit_note",
    description: "Write a note to a GitLab commit",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      commitSha: z.string().describe("Commit SHA to write note to"),
      note: z.string().describe("Note to write to the commit")
    }),
    execute: async (params) => {
      try {
        const result = await services.GitlabService.writeCommitNote(params.projectId, params.commitSha, params.note);
        return `✅ 成功为提交 ${params.commitSha} 添加评论\n\n${JSON.stringify(result, null, 2)}`;
      } catch (error) {
        return `❌ 添加提交评论失败: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });
}