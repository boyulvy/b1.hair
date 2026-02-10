const axios = require('axios');

class HackerNewsAggregator {
  constructor() {
    this.baseUrl = 'https://hacker-news.firebaseio.com/v0';
    this.keywords = [
      'AI', '人工智能', 'tech', 'technology', 'programming',
      'coding', 'startup', 'innovation', 'research', 'news',
      'development', 'software', 'hardware', 'cloud', 'web3'
    ];
  }
  
  async getTopStories(limit = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/topstories.json`);
      const storyIds = response.data.slice(0, limit);
      
      const stories = [];
      for (const id of storyIds) {
        try {
          const story = await this.getStoryDetails(id);
          if (story && !story.deleted && !story.dead) {
            stories.push(story);
          }
        } catch (error) {
          console.log(`Failed to get story ${id}: ${error.message}`);
        }
      }
      
      return stories;
    } catch (error) {
      console.error('Failed to get top stories:', error.message);
      return [];
    }
  }
  
  async getStoryDetails(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/item/${id}.json`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get story ${id}: ${error.message}`);
    }
  }
  
  filterStories(stories) {
    return stories.filter(story => {
      if (!story.title || !story.url) return false;
      
      const text = (story.title + ' ' + (story.text || '')).toLowerCase();
      
      // 检查关键词
      const hasKeyword = this.keywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      // 检查分数和评论数
      const hasEngagement = (story.score || 0) > 50 || (story.descendants || 0) > 10;
      
      return hasKeyword || hasEngagement;
    });
  }
  
  categorizeStories(stories) {
    const categorized = {
      'AI/人工智能': [],
      '科技新闻': [],
      '编程开发': [],
      '创业创新': [],
      '科学研究': [],
      '其他': []
    };
    
    stories.forEach(story => {
      const text = (story.title + ' ' + (story.text || '')).toLowerCase();
      let category = '其他';
      
      if (text.includes('ai') || text.includes('人工智能') || text.includes('machine learning')) {
        category = 'AI/人工智能';
      } else if (text.includes('tech') || text.includes('technology') || text.includes('news')) {
        category = '科技新闻';
      } else if (text.includes('programming') || text.includes('coding') || text.includes('software')) {
        category = '编程开发';
      } else if (text.includes('startup') || text.includes('innovation') || text.includes('business')) {
        category = '创业创新';
      } else if (text.includes('research') || text.includes('science') || text.includes('paper')) {
        category = '科学研究';
      }
      
      categorized[category].push(story);
    });
    
    // 移除空分类
    Object.keys(categorized).forEach(category => {
      if (categorized[category].length === 0) {
        delete categorized[category];
      }
    });
    
    return categorized;
  }
  
  sortByEngagement(stories) {
    return stories.sort((a, b) => {
      const scoreA = (a.score || 0) + (a.descendants || 0);
      const scoreB = (b.score || 0) + (b.descendants || 0);
      return scoreB - scoreA;
    });
  }
  
  async aggregate() {
    console.log('Starting Hacker News aggregation...');
    
    const stories = await this.getTopStories(50);
    const filtered = this.filterStories(stories);
    const categorized = this.categorizeStories(filtered);
    const sortedStories = this.sortByEngagement(filtered);
    
    return {
      totalStories: stories.length,
      filteredStories: filtered.length,
      categorized,
      stories: sortedStories.slice(0, 20),
      timestamp: new Date().toISOString(),
      generatedAt: new Date().toLocaleString('zh-CN')
    };
  }
  
  formatForTelegram(result) {
    const date = new Date(result.timestamp).toLocaleDateString('zh-CN');
    
    let message = `🤖 Hacker News 聚合报告 (${date})\n`;
    message += `共筛选出 ${result.filteredStories} 条优质内容\n\n`;
    
    if (result.filteredStories === 0) {
      message += '⚠️ 今天没有收集到内容\n';
      return message;
    }
    
    // 按分类输出
    for (const [category, stories] of Object.entries(result.categorized)) {
      if (stories.length === 0) continue;
      
      message += `🏷️ ${category} (${stories.length}条)\n`;
      
      stories.slice(0, 3).forEach((story, index) => {
        let title = story.title;
        if (title.length > 60) {
          title = title.substring(0, 60) + '...';
        }
        
        message += `${index + 1}. ${title}\n`;
        message += `   👍 ${story.score || 0} 分`;
        message += `   💬 ${story.descendants || 0} 评论`;
        
        if (story.by) {
          message += `   👤 ${story.by}\n`;
        } else {
          message += '\n';
        }
        
        if (story.url) {
          const url = new URL(story.url);
          message += `   🔗 ${url.hostname}\n`;
          message += `   📖 [阅读原文](${story.url})\n`;
        }
        
        message += '\n';
      });
      
      message += '\n';
    }
    
    // 添加统计信息
    message += `📈 今日统计\n`;
    message += `• 总故事数: ${result.totalStories} 条\n`;
    message += `• 优质内容: ${result.filteredStories} 条\n`;
    message += `• 分类数量: ${Object.keys(result.categorized).length} 类\n`;
    message += `• 数据来源: Hacker News API\n`;
    
    return message;
  }
  
  formatForWeb(result) {
    const date = new Date(result.timestamp).toLocaleDateString('zh-CN');
    
    let html = `
    <div class="report">
      <div class="header">
        <h1>🤖 Hacker News 聚合报告</h1>
        <p class="date">${date} - 共筛选出 ${result.filteredStories} 条优质内容</p>
        <p class="update-time">更新时间: ${result.generatedAt}</p>
      </div>
    `;
    
    if (result.filteredStories === 0) {
      html += `<div class="empty">⚠️ 今天没有收集到内容</div>`;
      return html;
    }
    
    // 按分类输出
    for (const [category, stories] of Object.entries(result.categorized)) {
      if (stories.length === 0) continue;
      
      html += `
      <div class="category">
        <h2>🏷️ ${category} <span class="count">(${stories.length}条)</span></h2>
      `;
      
      stories.slice(0, 5).forEach((story, index) => {
        let title = story.title;
        if (title.length > 80) {
          title = title.substring(0, 80) + '...';
        }
        
        const url = story.url ? new URL(story.url).hostname : '无链接';
        
        html += `
        <div class="story">
          <div class="story-header">
            <span class="rank">${index + 1}.</span>
            <h3 class="title">${title}</h3>
          </div>
          <div class="story-meta">
            <span class="score">👍 ${story.score || 0} 分</span>
            <span class="comments">💬 ${story.descendants || 0} 评论</span>
            <span class="author">👤 ${story.by || '匿名'}</span>
            <span class="domain">🔗 ${url}</span>
          </div>
          ${story.url ? `<a href="${story.url}" target="_blank" class="read-link">📖 阅读原文</a>` : ''}
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
          <div class="stat-value">${result.totalStories}</div>
          <div class="stat-label">总故事数</div>
        </div>
        <div class="stat">
          <div class="stat-value">${result.filteredStories}</div>
          <div class="stat-label">优质内容</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Object.keys(result.categorized).length}</div>
          <div class="stat-label">分类数量</div>
        </div>
        <div class="stat">
          <div class="stat-value">Hacker News</div>
          <div class="stat-label">数据来源</div>
        </div>
      </div>
    </div>
    `;
    
    html += `</div>`;
    return html;
  }
}

module.exports = HackerNewsAggregator;