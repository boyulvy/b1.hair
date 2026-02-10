const express = require('express');
const cors = require('cors');
const HackerNewsAggregator = require('./aggregate');
const GitHubAggregator = require('./github-aggregator');

const app = express();
app.use(cors());
app.use(express.json());

const hnAggregator = new HackerNewsAggregator();
const ghAggregator = new GitHubAggregator(process.env.GITHUB_API_KEY);

let cachedHNResult = null;
let cachedGHResult = null;
let lastHNUpdateTime = null;
let lastGHUpdateTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    service: 'Hacker News Aggregator API',
    version: '1.0.0',
    endpoints: {
      '/api/latest': '获取最新聚合结果',
      '/api/aggregate': '触发新的聚合',
      '/api/telegram': '获取Telegram格式消息',
      '/api/stats': '获取统计信息'
    },
    cache: {
      hasCache: cachedResult !== null,
      lastUpdate: lastUpdateTime,
      cacheDuration: '30分钟'
    }
  });
});

// 获取最新Hacker News结果
app.get('/api/latest', async (req, res) => {
  try {
    // 检查缓存
    const now = Date.now();
    if (cachedHNResult && lastHNUpdateTime && (now - lastHNUpdateTime) < CACHE_DURATION) {
      console.log('返回Hacker News缓存结果');
      return res.json({
        ...cachedHNResult,
        cached: true,
        cacheAge: Math.floor((now - lastHNUpdateTime) / 1000) + '秒',
        source: 'hackernews'
      });
    }
    
    // 获取新数据
    console.log('获取Hacker News新数据...');
    const result = await hnAggregator.aggregate();
    cachedHNResult = result;
    lastHNUpdateTime = now;
    
    res.json({
      ...result,
      cached: false,
      cacheAge: '0秒',
      source: 'hackernews'
    });
  } catch (error) {
    console.error('获取Hacker News数据失败:', error);
    res.status(500).json({
      error: '获取数据失败',
      message: error.message,
      source: 'hackernews'
    });
  }
});

// 获取GitHub趋势结果
app.get('/api/github', async (req, res) => {
  try {
    // 检查缓存
    const now = Date.now();
    if (cachedGHResult && lastGHUpdateTime && (now - lastGHUpdateTime) < CACHE_DURATION) {
      console.log('返回GitHub缓存结果');
      return res.json({
        ...cachedGHResult,
        cached: true,
        cacheAge: Math.floor((now - lastGHUpdateTime) / 1000) + '秒',
        source: 'github'
      });
    }
    
    // 获取新数据
    console.log('获取GitHub新数据...');
    const result = await ghAggregator.aggregate();
    cachedGHResult = result;
    lastGHUpdateTime = now;
    
    res.json({
      ...result,
      cached: false,
      cacheAge: '0秒',
      source: 'github'
    });
  } catch (error) {
    console.error('获取GitHub数据失败:', error);
    res.status(500).json({
      error: '获取数据失败',
      message: error.message,
      source: 'github'
    });
  }
});

// 获取所有数据源结果
app.get('/api/all', async (req, res) => {
  try {
    const now = Date.now();
    
    // 获取Hacker News数据（使用缓存或新数据）
    let hnResult;
    if (cachedHNResult && lastHNUpdateTime && (now - lastHNUpdateTime) < CACHE_DURATION) {
      hnResult = cachedHNResult;
    } else {
      hnResult = await hnAggregator.aggregate();
      cachedHNResult = hnResult;
      lastHNUpdateTime = now;
    }
    
    // 获取GitHub数据（使用缓存或新数据）
    let ghResult;
    if (cachedGHResult && lastGHUpdateTime && (now - lastGHUpdateTime) < CACHE_DURATION) {
      ghResult = cachedGHResult;
    } else {
      ghResult = await ghAggregator.aggregate();
      cachedGHResult = ghResult;
      lastGHUpdateTime = now;
    }
    
    // 合并结果
    const combinedResult = {
      hackernews: {
        totalStories: hnResult.totalStories,
        filteredStories: hnResult.filteredStories,
        categories: Object.keys(hnResult.categorized).length,
        timestamp: hnResult.timestamp
      },
      github: {
        totalRepositories: ghResult.totalRepositories,
        filteredRepositories: ghResult.filteredRepositories,
        categories: Object.keys(ghResult.categorized).length,
        timestamp: ghResult.timestamp
      },
      combined: {
        totalItems: hnResult.filteredStories + ghResult.filteredRepositories,
        hackernewsItems: hnResult.filteredStories,
        githubItems: ghResult.filteredRepositories,
        allCategories: [...Object.keys(hnResult.categorized), ...Object.keys(ghResult.categorized)],
        timestamp: new Date().toISOString()
      }
    };
    
    res.json({
      success: true,
      data: combinedResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('获取所有数据失败:', error);
    res.status(500).json({
      error: '获取所有数据失败',
      message: error.message
    });
  }
});

// 触发新的Hacker News聚合
app.get('/api/aggregate', async (req, res) => {
  try {
    console.log('手动触发Hacker News聚合...');
    const result = await hnAggregator.aggregate();
    cachedHNResult = result;
    lastHNUpdateTime = Date.now();
    
    res.json({
      success: true,
      message: 'Hacker News聚合完成',
      result: {
        totalStories: result.totalStories,
        filteredStories: result.filteredStories,
        categories: Object.keys(result.categorized).length
      },
      timestamp: result.timestamp,
      source: 'hackernews'
    });
  } catch (error) {
    console.error('Hacker News聚合失败:', error);
    res.status(500).json({
      error: '聚合失败',
      message: error.message,
      source: 'hackernews'
    });
  }
});

// 触发新的GitHub聚合
app.get('/api/aggregate-github', async (req, res) => {
  try {
    console.log('手动触发GitHub聚合...');
    const result = await ghAggregator.aggregate();
    cachedGHResult = result;
    lastGHUpdateTime = Date.now();
    
    res.json({
      success: true,
      message: 'GitHub聚合完成',
      result: {
        totalRepositories: result.totalRepositories,
        filteredRepositories: result.filteredRepositories,
        categories: Object.keys(result.categorized).length
      },
      timestamp: result.timestamp,
      source: 'github'
    });
  } catch (error) {
    console.error('GitHub聚合失败:', error);
    res.status(500).json({
      error: '聚合失败',
      message: error.message,
      source: 'github'
    });
  }
});

// 获取Hacker News Telegram格式消息
app.get('/api/telegram', async (req, res) => {
  try {
    let result;
    const now = Date.now();
    
    // 使用缓存或获取新数据
    if (cachedHNResult && lastHNUpdateTime && (now - lastHNUpdateTime) < CACHE_DURATION) {
      result = cachedHNResult;
    } else {
      result = await hnAggregator.aggregate();
      cachedHNResult = result;
      lastHNUpdateTime = now;
    }
    
    const telegramMessage = hnAggregator.formatForTelegram(result);
    
    res.json({
      success: true,
      message: telegramMessage,
      format: 'telegram',
      length: telegramMessage.length,
      timestamp: result.timestamp,
      source: 'hackernews'
    });
  } catch (error) {
    console.error('生成Hacker News Telegram消息失败:', error);
    res.status(500).json({
      error: '生成消息失败',
      message: error.message,
      source: 'hackernews'
    });
  }
});

// 获取GitHub Telegram格式消息
app.get('/api/telegram-github', async (req, res) => {
  try {
    let result;
    const now = Date.now();
    
    // 使用缓存或获取新数据
    if (cachedGHResult && lastGHUpdateTime && (now - lastGHUpdateTime) < CACHE_DURATION) {
      result = cachedGHResult;
    } else {
      result = await ghAggregator.aggregate();
      cachedGHResult = result;
      lastGHUpdateTime = now;
    }
    
    const telegramMessage = ghAggregator.formatForTelegram(result);
    
    res.json({
      success: true,
      message: telegramMessage,
      format: 'telegram',
      length: telegramMessage.length,
      timestamp: result.timestamp,
      source: 'github'
    });
  } catch (error) {
    console.error('生成GitHub Telegram消息失败:', error);
    res.status(500).json({
      error: '生成消息失败',
      message: error.message,
      source: 'github'
    });
  }
});

// 获取合并的Telegram消息
app.get('/api/telegram-all', async (req, res) => {
  try {
    const now = Date.now();
    
    // 获取Hacker News消息
    let hnResult;
    if (cachedHNResult && lastHNUpdateTime && (now - lastHNUpdateTime) < CACHE_DURATION) {
      hnResult = cachedHNResult;
    } else {
      hnResult = await hnAggregator.aggregate();
      cachedHNResult = hnResult;
      lastHNUpdateTime = now;
    }
    
    // 获取GitHub消息
    let ghResult;
    if (cachedGHResult && lastGHUpdateTime && (now - lastGHUpdateTime) < CACHE_DURATION) {
      ghResult = cachedGHResult;
    } else {
      ghResult = await ghAggregator.aggregate();
      cachedGHResult = ghResult;
      lastGHUpdateTime = now;
    }
    
    const hnMessage = hnAggregator.formatForTelegram(hnResult);
    const ghMessage = ghAggregator.formatForTelegram(ghResult);
    
    const combinedMessage = `📊 技术内容聚合报告\n\n${hnMessage}\n\n${ghMessage}`;
    
    res.json({
      success: true,
      message: combinedMessage,
      format: 'telegram',
      length: combinedMessage.length,
      timestamp: new Date().toISOString(),
      sources: ['hackernews', 'github']
    });
  } catch (error) {
    console.error('生成合并Telegram消息失败:', error);
    res.status(500).json({
      error: '生成消息失败',
      message: error.message
    });
  }
});

// 获取统计信息
app.get('/api/stats', (req, res) => {
  res.json({
    caches: {
      hackernews: {
        hasCache: cachedHNResult !== null,
        lastUpdate: lastHNUpdateTime ? new Date(lastHNUpdateTime).toISOString() : null,
        cacheAge: lastHNUpdateTime ? Math.floor((Date.now() - lastHNUpdateTime) / 1000) + '秒' : '无缓存'
      },
      github: {
        hasCache: cachedGHResult !== null,
        lastUpdate: lastGHUpdateTime ? new Date(lastGHUpdateTime).toISOString() : null,
        cacheAge: lastGHUpdateTime ? Math.floor((Date.now() - lastGHUpdateTime) / 1000) + '秒' : '无缓存'
      }
    },
    service: {
      uptime: process.uptime() + '秒',
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      sources: ['hackernews', 'github']
    }
  });
});

// Vercel需要导出handler
module.exports = app;