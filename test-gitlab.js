const { GitlabService } = require('./build/core/services/gitlab.js');

// 设置测试环境变量（如果没有设置的话）
if (!process.env.GITLAB_TOKEN) {
  console.log('⚠️  请设置 GITLAB_TOKEN 环境变量');
  console.log('   export GITLAB_TOKEN="your_gitlab_token"');
  process.exit(1);
}

if (!process.env.GITLAB_URL) {
  console.log('ℹ️  使用默认 GitLab URL: https://gitlab.com');
}

async function testGitlabService() {
  try {
    console.log('🧪 测试 GitLab 服务...');
    
    // 测试获取特定 MR（您需要提供实际的项目 ID 和 MR IID）
    const projectId = process.argv[2] || 'gitlab-org/gitlab';
    const mergeRequestIid = parseInt(process.argv[3]) || 1;
    
    console.log(`📋 获取项目 "${projectId}" 的 MR #${mergeRequestIid}...`);
    
    const mr = await GitlabService.getMergeRequest({
      projectId,
      mergeRequestIid
    });
    
    console.log('✅ 成功获取 MR 信息:');
    console.log(GitlabService.formatMergeRequest(mr));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 提示:');
    console.log('   1. 确保 GITLAB_TOKEN 有效');
    console.log('   2. 确保项目存在且可访问');
    console.log('   3. 确保 MR 存在');
    console.log('   4. 使用方法: node test-gitlab.js <项目ID> <MR_IID>');
    console.log('   例如: node test-gitlab.js gitlab-org/gitlab 1');
  }
}

async function testListMergeRequests() {
  try {
    const projectId = process.argv[2] || 'gitlab-org/gitlab';
    
    console.log(`\n📋 获取项目 "${projectId}" 的 MR 列表...`);
    
    const mrs = await GitlabService.listMergeRequests(projectId, {
      state: 'opened',
      per_page: 5
    });
    
    console.log('✅ 成功获取 MR 列表:');
    console.log(GitlabService.formatMergeRequestList(mrs));
    
  } catch (error) {
    console.error('❌ 获取 MR 列表失败:', error.message);
  }
}

// 运行测试
testGitlabService().then(() => {
  return testListMergeRequests();
}); 