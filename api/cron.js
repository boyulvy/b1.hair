const HackerNewsAggregator = require('./aggregate');

// 全局缓存
let cachedResult = null;
let lastUpdateTime = null;

module.exports = async (req, res) => {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // 验证请求（简单验证）
  const authToken = req.query.token || req.headers['x-cron-token'];
  const validToken = process.env.CRON_TOKEN || 'your-secret-token';
  
  if (authToken !== validToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('🚀 Cron job triggered:', new Date().toISOString());
  
  try {
    const aggregator = new HackerNewsAggregator();
    const result = await aggregator.aggregate();
    
    // 更新缓存
    cachedResult = result;
    lastUpdateTime = Date.now();
    
    const telegramMessage = aggregator.formatForTelegram(result);
    
    // 这里可以集成消息发送逻辑
    // 例如：发送到Telegram、保存到数据库等
    
    console.log('✅ Cron job completed successfully');
    console.log(`📊 Results: ${result.totalStories} stories, ${result.filteredStories} filtered`);
    
    // 返回成功响应
    res.status(200).json({
      success: true,
      message: 'Cron job executed successfully',
      data: {
        totalStories: result.totalStories,
        filteredStories: result.filteredStories,
        categories: Object.keys(result.categorized).length,
        timestamp: result.timestamp,
        telegramMessageLength: telegramMessage.length
      },
      cacheUpdated: true,
      nextRun: 'In 6 hours'
    });
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Cron job execution failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};