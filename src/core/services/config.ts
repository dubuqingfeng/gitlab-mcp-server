import fs from 'fs';
import path from 'path';

const projectMapPath = path.resolve(__dirname, 'gitlab-project-map.json');
const projectMapObj = JSON.parse(fs.readFileSync(projectMapPath, 'utf-8'));

export const GitlabProjectIDMap = new Map<string, number>(Object.entries(projectMapObj));