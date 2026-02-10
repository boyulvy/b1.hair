# b1.hair - Hacker News Aggregator

A Hacker News content aggregation system deployed on Vercel. This project aggregates popular content from Hacker News API, filters quality content based on keywords and engagement, and presents it through a beautiful responsive web interface.

## 🚀 Features

- ✅ **Auto Aggregation** - Fetch popular content from Hacker News API
- ✅ **Smart Filtering** - Filter quality content based on keywords and engagement
- ✅ **Category Organization** - Automatically categorize by topics (AI, Tech, Programming, etc.)
- ✅ **Web Interface** - Beautiful responsive web interface
- ✅ **API Endpoints** - Provides JSON and Telegram format output
- ✅ **Scheduled Tasks** - Vercel Cron auto-update
- ✅ **Cache Optimization** - 30-minute cache to reduce API calls

## 🌐 Demo

After deployment, visit:
- **Home Page**: `https://your-project.vercel.app`
- **API Endpoint**: `https://your-project.vercel.app/api/latest`
- **Telegram Format**: `https://your-project.vercel.app/api/telegram`

## 📦 Deploy to Vercel

### Method 1: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/boyulvy/b1.hair)

### Method 2: Manual Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Navigate to project directory
cd /path/to/b1.hair

# 4. Deploy to Vercel
vercel --prod
```

### Method 3: Git Deployment

1. Push this repository to GitHub
2. Import the repository in Vercel dashboard
3. Deploy with one click

## ⚙️ Environment Variables (Optional)

Add environment variables in Vercel project settings:

```env
# Cron job security token (optional)
CRON_TOKEN=your-secret-token-here

# Other configuration
NODE_ENV=production
```

## 📡 API Endpoints

### Get Latest Data
```
GET /api/latest
```
Returns JSON format aggregated results with 30-minute cache.

### Manually Trigger Aggregation
```
GET /api/aggregate
```
Force refresh data and update cache.

### Get Telegram Format
```
GET /api/telegram
```
Returns formatted Telegram messages.

### Get Statistics
```
GET /api/stats
```
Returns service status and cache information.

### Cron Job Endpoint
```
GET /api/cron?token=your-secret-token
```
Endpoint called by Vercel Cron, requires token verification.

## ⏰ Scheduled Tasks

Vercel Cron is configured to run daily at:
- **UTC 02:00** (Beijing Time 10:00)

Modify the `crons` section in `vercel.json` to adjust timing.

## 🎨 Frontend Features

### Homepage Functions
1. **Real-time Data Display** - Show latest aggregation results
2. **Statistics Panel** - Key metrics at a glance
3. **Category Browsing** - View content by topic
4. **Story Details** - Display score, comments, author, etc.
5. **Original Links** - Direct links to original content

### Control Buttons
- **Refresh Data** - Manually trigger data update
- **View Telegram Format** - Preview messages sent to Telegram

## 🔧 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Visit http://localhost:3000
```

## 📁 Project Structure

```
b1.hair/
├── api/
│   ├── index.js              # Main API routes
│   ├── aggregate.js          # Aggregator core logic
│   ├── github-aggregator.js  # GitHub aggregator
│   └── cron.js               # Cron job endpoint
├── public/
│   └── index.html            # Frontend page
├── package.json              # Project configuration
├── vercel.json               # Vercel configuration
└── README.md                 # Documentation
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + JavaScript
- **API**: Hacker News Firebase API
- **Deployment**: Vercel Serverless Functions
- **Scheduled Tasks**: Vercel Cron
- **Cache**: In-memory cache (30 minutes)

## 🔒 Security Considerations

1. **API Rate Limiting** - Reasonable request frequency control
2. **Cache Mechanism** - Reduce calls to Hacker News API
3. **Cron Verification** - Scheduled tasks require token verification
4. **Error Handling** - Comprehensive error handling and logging

## 📈 Performance Optimization

- **Responsive Design** - Adapts to various device screens
- **Cache Strategy** - 30-minute data cache
- **Lazy Loading** - Load content on demand
- **Code Splitting** - Optimize loading speed

## 📄 License

MIT License

---

Based on [hn-aggregator](https://github.com/alexkyo06/hn-aggregator)