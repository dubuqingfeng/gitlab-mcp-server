import fs from 'fs';
import path from 'path';

let projectMapObj: Record<string, number> = {};

// 先尝试从环境变量读取
if (process.env.GITLAB_PROJECT_MAP) {
  try {
    projectMapObj = JSON.parse(process.env.GITLAB_PROJECT_MAP);
    console.log('Loaded project map from environment variable GITLAB_PROJECT_MAP');
  } catch (error) {
    console.error('Error parsing GITLAB_PROJECT_MAP environment variable:', error);
    // 如果环境变量解析失败，继续尝试从文件读取
  }
}

// 如果环境变量不存在或解析失败，尝试从文件读取
if (Object.keys(projectMapObj).length === 0) {
  const projectMapPath = path.resolve(__dirname, 'gitlab-project-map.json');
  
  // 检查文件是否存在
  if (fs.existsSync(projectMapPath)) {
    try {
      projectMapObj = JSON.parse(fs.readFileSync(projectMapPath, 'utf-8'));
      console.log(`Loaded project map from file: ${projectMapPath}`);
    } catch (error) {
      console.error(`Error reading or parsing ${projectMapPath}:`, error);
      // 如果读取或解析失败，使用空对象
      projectMapObj = {};
    }
  } else {
    console.warn(`File ${projectMapPath} does not exist. Using empty project map.`);
  }
}

export const GitlabProjectIDMap = new Map<string, number>(Object.entries(projectMapObj));