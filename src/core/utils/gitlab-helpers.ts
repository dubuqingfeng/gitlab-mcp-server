import { loggers } from "./logger.js";
import { 
  CodeReviewRule,
  getDefaultRulesForProjectTypes,
  getApplicableRules
} from "./codereview/rules.js";
import {
  getProjectSpecificRules
} from "./codereview/project-rules.js";

/**
 * Log formatted content with line breaks
 * 
 * @param content Array of content items with text property
 * @param title Title for the log section
 */
export function logFormattedContent(content: Array<{ type: string; text: string }>, title: string = 'GitLab Code Review Content') {
  loggers.logger.info(`=== ${title} ===`);
  content.forEach((item, index) => {
    loggers.logger.info(`\n--- Content ${index + 1} ---`);
    if (item.text) {
      // 将文本按换行符分割，然后逐行输出
      const lines = item.text.split('\n');
      lines.forEach(line => {
        loggers.logger.info(line);
      });
    }
  });
  loggers.logger.info('\n=== End of Content ===\n');
}

/**
 * Merge multiple rule arrays and remove duplicates
 * 
 * @param ruleSets Array of rule sets to merge
 * @returns Merged array of unique rules
 */
export function mergeRuleSets(...ruleSets: CodeReviewRule[][]): CodeReviewRule[] {
  const mergedRules = new Map<string, CodeReviewRule>();
  
  ruleSets.forEach(ruleSet => {
    ruleSet.forEach(rule => {
      mergedRules.set(rule.id, rule);
    });
  });
  
  return Array.from(mergedRules.values());
}

/**
 * Format rules by category with emojis
 * 
 * @param rules Array of rules to format
 * @param prefix Optional prefix for the section title
 * @returns Formatted string with rules grouped by category
 */
export function formatRulesByCategory(rules: CodeReviewRule[], prefix: string = ''): string {
  const rulesByCategory = rules.reduce((acc: Record<string, CodeReviewRule[]>, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  const categoryEmojis: Record<string, string> = {
    security: '🔒',
    performance: '⚡',
    maintainability: '🔧',
    style: '🎨',
    'best-practice': '✅'
  };

  let output = '';
  for (const [category, categoryRules] of Object.entries(rulesByCategory)) {
    const emoji = categoryEmojis[category] || '📋';
    output += `${emoji} **${category.toUpperCase()}${prefix ? ` (${prefix})` : ''}**\n`;
    
    categoryRules.forEach((rule, index) => {
      const severityEmoji = rule.severity === 'error' ? '🚨' : 
                           rule.severity === 'warning' ? '⚠️' : 'ℹ️';
      output += `${index + 1}. ${severityEmoji} **${rule.title}**: ${rule.description}\n`;
    });
    output += '\n';
  }
  
  return output;
}

/**
 * Collect all applicable rules for a merge request
 * 
 * @param mr Merge request details
 * @param changes Merge request changes
 * @param detectedTypes Detected project types
 * @returns Object containing all collected rules and metadata
 */
export function collectMergeRequestRules(
  mr: any, 
  changes: any, 
  detectedTypes: string[]
): {
  allRules: CodeReviewRule[];
  projectSpecificRules: CodeReviewRule[];
  fileSpecificRules: CodeReviewRule[];
  hasProjectConfig: boolean;
  projectConfig?: any;
} {
  // Start with default rules for detected project types
  let defaultRules = getDefaultRulesForProjectTypes(detectedTypes) || [];
  let fileSpecificRules: CodeReviewRule[] = [];
  let projectSpecificRules: CodeReviewRule[] = [];
  let hasProjectConfig = false;
  let projectConfig;
  
  // Get file-specific rules based on changed files
  if (changes.changes && changes.changes.length > 0) {
    const changedFiles = changes.changes.map((change: any) => change.new_path || change.old_path).filter(Boolean);
    
    // Collect rules for each changed file
    const fileRuleSets = changedFiles.map((filePath: string) => {
      const fileName = filePath.split('/').pop() || filePath;
      return getApplicableRules(fileName, detectedTypes, false); // Don't include universal rules yet
    });
    
    fileSpecificRules = mergeRuleSets(...fileRuleSets);
  }
  
  // Check for project-specific configuration
  const projectPath = mr.project?.path_with_namespace || mr.project_id;
  projectConfig = getProjectSpecificRules(projectPath);
  
  if (projectConfig) {
    hasProjectConfig = true;
    projectSpecificRules = projectConfig.rules;
    
    // Add additional project types if specified
    if (projectConfig.additionalProjectTypes) {
      const additionalTypes = projectConfig.additionalProjectTypes.filter(
        (type: string) => !detectedTypes.includes(type)
      );
      detectedTypes.push(...additionalTypes);
      
      // Re-fetch default rules with additional types
      defaultRules = getDefaultRulesForProjectTypes(detectedTypes) || [];
    }
    
    // Apply project configuration (exclude rules, etc.)
    if (projectConfig.enableDefaultRules !== false && projectConfig.excludeDefaultRules && projectConfig.excludeDefaultRules.length > 0) {
      defaultRules = defaultRules.filter(
        rule => !projectConfig.excludeDefaultRules!.includes(rule.id)
      );
    }
  }
  
  // Get universal rules
  const universalRules = getApplicableRules('', ['*'], true).filter(
    rule => rule.projectTypes?.includes('*')
  );
  
  // Merge all rules in priority order: project-specific > file-specific > default > universal
  const allRules = mergeRuleSets(
    projectSpecificRules,
    fileSpecificRules,
    defaultRules,
    universalRules
  );
  
  return {
    allRules,
    projectSpecificRules,
    fileSpecificRules,
    hasProjectConfig,
    projectConfig
  };
} 