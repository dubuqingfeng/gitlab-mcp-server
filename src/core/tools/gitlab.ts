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
    description: "Write a note to a GitLab merge request",
    parameters: z.object({
      projectId: z.string().describe("GitLab project ID or project path (e.g., 'group/project' or 123)"),
      mergeRequestIid: z.number().describe("Merge request IID (internal ID shown in GitLab UI)"),
      note: z.string().describe("Note to write to the merge request")
    }),
    execute: async (params) => {
      try {
        const note = await services.GitlabService.writeNote(params.projectId, params.mergeRequestIid, params.note);
        return JSON.stringify(note, null, 2);
      } catch (error) {
        return `❌ Error writing note: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
}