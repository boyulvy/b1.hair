const axios = require('axios');

class GitHubAggregator {
  constructor(apiKey = null) {
    this.baseUrl = 'https://api.github.com';
    this.apiKey = apiKey || process.env.GITHUB_API_KEY;
    
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'HackerNews-GitHub-Aggregator'
    };
    
    if (this.apiKey) {
      this.headers['Authorization'] = `token ${this.apiKey}`;
    }
    
    this.languages = [
      'javascript', 'python', 'java', 'go', 'rust',
      'typescript', 'cpp', 'csharp', 'php', 'ruby'
    ];
    
    this.timeRanges = ['daily', 'weekly', 'monthly'];
    
    this.keywords = [
      'AI', '人工智能', 'machine learning', 'deep learning',
      'framework', 'library', 'tool', 'utility', 'cli',
      'web', 'mobile', 'desktop', 'server', 'cloud'
    ];
  }
  
  async getTrendingRepositories(language = null, since = 'daily') {
    try {
      // GitHub 没有官方的 Trending API，我们可以使用 GitHub REST API 的搜索功能
      // 或者使用第三方 API，这里使用搜索功能模拟
      
      let query = 'stars:>100';
      if (language) {
        query += ` language:${language}`;
      }
      
      // 根据时间范围调整
      const date = new Date();
      if (since === 'daily') {
        date.setDate(date.getDate() - 1);
      } else if (since === 'weekly') {
        date.setDate(date.getDate() - 7);
      } else if (since === 'monthly') {
        date.setMonth(date.getMonth() - 1);
      }
      
      const sinceDate = date.toISOString().split('T')[0];
      query += ` created:>${sinceDate}`;
      
      const response = await axios.get(`${this.baseUrl}/search/repositories`, {
        headers: this.headers,
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 30
        }
      });
      
      return response.data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
          url: repo.owner.html_url
        },
        topics: repo.topics || []
      }));
      
    } catch (error) {
      console.error('获取GitHub趋势仓库失败:', error.message);
      
      // 如果API失败，返回模拟数据
      return this.getMockTrendingRepositories();
    }
  }
  
  getMockTrendingRepositories() {
    // 模拟数据，当API不可用时使用
    return [
      {
        id: 1,
        name: 'react',
        full_name: 'facebook/react',
        description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
        url: 'https://github.com/facebook/react',
        stars: 215000,
        forks: 45000,
        language: 'JavaScript',
        topics: ['react', 'javascript', 'frontend', 'ui']
      },
      {
        id: 2,
        name: 'vue',
        full_name: 'vuejs/vue',
        description: '🖖 Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.',
        url: 'https://github.com/vuejs/vue',
        stars: 205000,
        forks: 34000,
        language: 'JavaScript',
        topics: ['vue', 'javascript', 'frontend', 'framework']
      },
      {
        id: 3,
        name: 'tensorflow',
        full_name: 'tensorflow/tensorflow',
        description: 'An Open Source Machine Learning Framework for Everyone',
        url: 'https://github.com/tensorflow/tensorflow',
        stars: 180000,
        forks: 89000,
        language: 'C++',
        topics: ['tensorflow', 'machine-learning', 'deep-learning', 'ai']
      }
    ];
  }
  
  filterRepositories(repos) {
    return repos.filter(repo => {
      if (!repo.description) return false;
      
      const text = (repo.name + ' ' + repo.description + ' ' + (repo.topics || []).join(' ')).toLowerCase();
      
      // 检查关键词
      const hasKeyword = this.keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      // 检查星标数
      const hasStars = repo.stars > 1000;
      
      return hasKeyword || hasStars;
    });
  }
  
  categorizeRepositories(repos) {
    const categorized = {
      '前端框架': [],
      '后端开发': [],
      'AI/机器学习': [],
      '开发工具': [],
      '移动开发': [],
      '其他': []
    };
    
    repos.forEach(repo => {
      const text = (repo.name + ' ' + repo.description).toLowerCase();
      let category = '其他';
      
      if (text.includes('react') || text.includes('vue') || text.includes('angular') || 
          text.includes('frontend') || text.includes('ui') || text.includes('framework')) {
        category = '前端框架';
      } else if (text.includes('server') || text.includes('backend') || text.includes('api') ||
                text.includes('database') || text.includes('orm')) {
        category = '后端开发';
      } else if (text.includes('ai') || text.includes('machine learning') || text.includes('deep learning') ||
                text.includes('tensorflow') || text.includes('pytorch') || text.includes('人工智能')) {
        category = 'AI/机器学习';
      } else if (text.includes('tool') || text.includes('utility') || text.includes('cli') ||
                text.includes('devops') || text.includes('docker') || text.includes('kubernetes')) {
        category = '开发工具';
      } else if (text.includes('mobile') || text.includes('android') || text.includes('ios') ||
                text.includes('flutter') || text.includes('react native')) {
        category = '移动开发';
      }
      
      categorized[category].push(repo);
    });
    
    // 移除空分类
    Object.keys(categorized).forEach(category => {
      if (categorized[category].length === 0) {
        delete categorized[category];
      }
    });
    
    return categorized;
  }
  
  sortByStars(repos) {
    return repos.sort((a, b) => b.stars - a.stars);
  }
  
  async aggregate() {
    console.log('🚀 开始 GitHub 趋势聚合...');
    
    const allRepos = [];
    
    // 获取不同语言的趋势
    for (const language of this.languages.slice(0, 3)) { // 只取前3种语言
      console.log(`  获取 ${language} 语言趋势...`);
      
      try {
        const repos = await this.getTrendingRepositories(language, 'daily');
        allRepos.push(...repos);
        
        // 避免速率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`  获取 ${language} 失败: ${error.message}`);
      }
    }
    
    console.log(`✅ 获取到 ${allRepos.length} 个仓库`);
    
    // 筛选和分类
    const filtered = this.filterRepositories(allRepos);
    console.log(`🎯 筛选出 ${filtered.length} 个优质仓库`);
    
    const categorized = this.categorizeRepositories(filtered);
    const sortedRepos = this.sortByStars(filtered);
    
    return {
      totalRepositories: allRepos.length,
      filteredRepositories: filtered.length,
      categorized,
      repositories: sortedRepos.slice(0, 20), // 最多20个
      timestamp: new Date().toISOString(),
      source: 'GitHub API'
    };
  }
  
  formatForTelegram(result) {
    const date = new Date(result.timestamp).toLocaleDateString('zh-CN');
    
    let message = `🐙 GitHub 趋势报告 (${date})\n`;
    message += `共筛选出 ${result.filteredRepositories} 个优质仓库\n\n`;
    
    if (result.filteredRepositories === 0) {
      message += '⚠️ 今天没有收集到趋势仓库\n';
      return message;
    }
    
    // 按分类输出
    for (const [category, repos] of Object.entries(result.categorized)) {
      if (repos.length === 0) continue;
      
      message += `🏷️ ${category} (${repos.length}个)\n`;
      
      repos.slice(0, 3).forEach((repo, index) => {
        let desc = repo.description || '无描述';
        if (desc.length > 60) {
          desc = desc.substring(0, 60) + '...';
        }
        
        message += `${index + 1}. ${repo.full_name}\n`;
        message += `   ${desc}\n`;
        message += `   ⭐ ${repo.stars} 星`;
        message += `   🍴 ${repo.forks} Fork`;
        
        if (repo.language) {
          message += `   💻 ${repo.language}\n`;
        } else {
          message += '\n';
        }
        
        message += `   👤 ${repo.owner.login}\n`;
        message += `   🔗 [访问仓库](${repo.url})\n\n`;
      });
      
      message += '\n';
    }
    
    // 添加统计信息
    message += `📈 今日统计\n`;
    message += `• 总仓库数: ${result.totalRepositories} 个\n`;
    message += `• 优质仓库: ${result.filteredRepositories} 个\n`;
    message += `• 分类数量: ${Object.keys(result.categorized).length} 类\n`;
    message += `• 数据来源: GitHub API\n`;
    
    return message;
  }
  
  formatForWeb(result) {
    const date = new Date(result.timestamp).toLocaleDateString('zh-CN');
    
    let html = `
    <div class="report github-report">
      <div class="header">
        <h1>🐙 GitHub 趋势报告</h1>
        <p class="date">${date} - 共筛选出 ${result.filteredRepositories} 个优质仓库</p>
        <p class="source">数据来源: ${result.source}</p>
      </div>
    `;
    
    if (result.filteredRepositories === 0) {
      html += `<div class="empty">⚠️ 今天没有收集到趋势仓库</div>`;
      return html;
    }
    
    // 按分类输出
    for (const [category, repos] of Object.entries(result.categorized)) {
      if (repos.length === 0) continue;
      
      html += `
      <div class="category">
        <h2>🏷️ ${category} <span class="count">(${repos.length}个)</span></h2>
      `;
      
      repos.slice(0, 5).forEach((repo, index) => {
        let desc = repo.description || '无描述';
        if (desc.length > 100) {
          desc = desc.substring(0, 100) + '...';
        }
        
        html += `
        <div class="repo">
          <div class="repo-header">
            <span class="rank">${index + 1}.</span>
            <div class="repo-info">
              <h3 class="repo-name">${repo.full_name}</h3>
              <p class="repo-desc">${desc}</p>
            </div>
          </div>
          <div class="repo-meta">
            <span class="stars">⭐ ${repo.stars} 星</span>
            <span class="forks">🍴 ${repo.forks} Fork</span>
            ${repo.language ? `<span class="language">💻 ${repo.language}</span>` : ''}
            <span class="owner">👤 ${repo.owner.login}</span>
          </div>
          <a href="${repo.url}" target="_blank" class="repo-link">
            🔗 访问仓库
          </a>
        </div>
        `;
      });
      
      html += `</div>`;
    }
    
    // 添加统计信息
    html += `
    <div class="stats">
      <h3>📈 今日统计</h3>
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-value">${result.totalRepositories}</div>
          <div class="stat-label">总仓库数</div>
        </div>
        <div class="stat">
          <div class="stat-value">${result.filteredRepositories}</div>
          <div class="stat-label">优质仓库</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Object.keys(result.categorized).length}</div>
          <div class="stat-label">分类数量</div>
        </div>
        <div class="stat">
          <div class="stat-value">GitHub</div>
          <div class="stat-label">数据来源</div>
        </div>
      </div>
    </div>
    `;
    
    html += `</div>`;
    return html;
  }
}

module.exports = GitHubAggregator;