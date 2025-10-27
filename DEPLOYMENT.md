# 🚀 MR PIKIPIKI TRADING - Vercel Deployment Guide

Mwongozo kamili wa kuhost application yako kwenye Vercel.

## 📋 Table of Contents
1. [Pre-requisites](#pre-requisites)
2. [Database Setup (Neon PostgreSQL)](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Pre-requisites

Kabla ya kudeploy, hakikisha una:
- ✅ Account ya GitHub (tayari una!)
- ✅ Account ya Vercel ([vercel.com](https://vercel.com))
- ✅ Account ya Neon Database ([neon.tech](https://neon.tech)) - **FREE!**

---

## 🗄️ Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Database

1. **Nenda** [neon.tech](https://neon.tech)
2. **Sign up/Login** kwa GitHub account yako
3. **Click** "Create Project"
4. **Settings:**
   - Project Name: `mr-pikipiki-trading`
   - Region: Chagua karibu na wewe (e.g., `Europe - Frankfurt` au `Asia - Singapore`)
   - PostgreSQL Version: `16` (recommended)
5. **Click** "Create Project"

### Step 2: Get Database Connection String

Baada ya kutengeneza project:

1. Utaona **Connection String** - inakaa hivi:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

2. **COPY** connection string hii - utaitumia kwenye Vercel! 🔑

### Step 3: Initialize Database Schema

Baada ya kudeploy Vercel, utahitaji ku-setup database tables:

```bash
# Option 1: Using Neon SQL Editor (Recommended)
# - Open your Neon project dashboard
# - Click "SQL Editor"
# - Paste contents of server/database/schema.sql
# - Run the query

# Option 2: Using local connection
# Set DATABASE_URL in your .env file
npm run db:init
npm run db:seed
```

---

## 🔐 Environment Variables

Hizi ni environment variables **MUHIMU** kwa production:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection string from Neon | `postgresql://user:pass@host/db?sslmode=require` |
| `DB_SSL` | Enable SSL for database | `true` |
| `JWT_SECRET` | Secret key for JWT tokens | Use a strong random string |
| `PORT` | Server port (Vercel auto-assigns) | `5000` |

### Generate JWT Secret

Tumia moja ya commands hizi ku-generate JWT_SECRET yenye usalama:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-random.org/api-key-generator
```

**Example output:**
```
Xy7pK3nM9vQ2wR5tU8yA1bN4cZ6dE0fG==
```

---

## 🌐 Vercel Deployment

### Method 1: Deploy from GitHub (Recommended)

#### Step 1: Connect to Vercel

1. **Nenda** [vercel.com](https://vercel.com)
2. **Click** "New Project"
3. **Import** GitHub repository yako: `alfatonics/mr-pikipiki-trading1`
4. **Click** "Import"

#### Step 2: Configure Project

1. **Project Name:** `mr-pikipiki-trading` (au name yoyote)
2. **Framework Preset:** Vercel ita-detect automatically ✨
3. **Root Directory:** `./` (leave as default)
4. **Build Command:** Will use the one from package.json
5. **Output Directory:** Will use the one from vercel.json

#### Step 3: Add Environment Variables

**MUHIMU SANA!** 🚨

Click "Environment Variables" section, ongeza hizi:

```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://your-neon-connection-string
DB_SSL=true
JWT_SECRET=your-generated-secret-from-above
PORT=5000
```

**How to add:**
1. Name: `NODE_ENV` → Value: `production` → Click "Add"
2. Name: `DATABASE_URL` → Value: Your Neon connection string → Click "Add"
3. Name: `DB_SSL` → Value: `true` → Click "Add"
4. Name: `JWT_SECRET` → Value: Your generated secret → Click "Add"
5. Name: `PORT` → Value: `5000` → Click "Add"

#### Step 4: Deploy! 🚀

1. **Click** "Deploy"
2. **Wait** ~2-5 minutes
3. Utapata URL kama: `https://mr-pikipiki-trading.vercel.app` 🎉

---

### Method 2: Deploy using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow the prompts and add environment variables when asked
```

---

## ✅ Post-Deployment

### 1. Initialize Database

Kama database yako ni tupu, lazima u-setup schema na data:

**Using Neon SQL Editor:**
1. Open Neon dashboard → Your Project → SQL Editor
2. Copy & paste contents from `server/database/schema.sql`
3. Click "Run"
4. (Optional) Copy & paste contents from `server/database/seed.js` SQL version

### 2. Create Admin User

Tumia API endpoint ku-create admin:

```bash
# Replace with your actual Vercel URL
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!",
    "email": "admin@mrpikipiki.com",
    "role": "admin",
    "fullName": "System Administrator"
  }'
```

### 3. Test Your Deployment

1. **Health Check:**
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return: `{"status":"ok","message":"MR PIKIPIKI TRADING API is running"}`

2. **Database Check:**
   ```
   https://your-app.vercel.app/api/test-db
   ```
   Should show database connection info

3. **Login to Frontend:**
   ```
   https://your-app.vercel.app/login
   ```
   Use admin credentials created above

---

## 🔧 Troubleshooting

### Problem: "Database connection failed"

**Solution:**
1. Check DATABASE_URL ni correct kwenye Vercel environment variables
2. Hakikisha DB_SSL=true
3. Verify Neon database iko active (inaenda sleep after inactivity on free plan)

```bash
# Test database connection
curl https://your-app.vercel.app/api/test-db
```

### Problem: "Invalid token" / Authentication issues

**Solution:**
1. Hakikisha JWT_SECRET iko set kwenye Vercel
2. Clear browser cache/localStorage
3. Generate new JWT_SECRET na re-deploy

### Problem: "CORS errors"

**Solution:**
The CORS config in `server/app.js` already allows Vercel domains. If issues persist:

1. Check your frontend URL ni correct
2. Verify headers zinakuwa included kwenye request
3. Check Vercel function logs for errors

### Problem: "Build failed"

**Solution:**
1. Check build logs kwenye Vercel dashboard
2. Verify dependencies ziko correct kwenye package.json
3. Ensure Node.js version ni compatible:

```json
// Add to package.json if needed
"engines": {
  "node": ">=18.x"
}
```

### Problem: "Function timeout"

**Solution:**
Vercel free plan has 10s timeout. For long operations:

1. Optimize database queries
2. Add indexes to frequently queried columns
3. Consider upgrading Vercel plan if needed

---

## 📱 Mobile App Configuration

Kama una mobile app (iOS/Android) based on memory, update API URL:

```javascript
// In your mobile app config
const API_URL = 'https://your-app.vercel.app/api';
```

---

## 🔄 Continuous Deployment

Good news! Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Vercel will automatically deploy! 🎉
```

---

## 📊 Monitoring

### Vercel Dashboard
- **View logs:** Vercel Dashboard → Your Project → Functions
- **Check analytics:** See request counts, response times
- **Error tracking:** See function errors in real-time

### Database Monitoring
- **Neon Dashboard:** Check connection count, query performance
- **Set up alerts:** For high CPU or connection usage

---

## 💰 Cost Estimate

**FREE TIER LIMITS:**

| Service | Free Tier | Enough For |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth/month, Unlimited deployments | ~10,000 page views |
| **Neon** | 512 MB storage, 0.5 GB RAM | Small to medium business |

**Total Cost:** **$0/month** for starter usage! 🎉

---

## 🎓 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

---

## ✉️ Support

Kama una maswali:
1. Check Vercel function logs
2. Check Neon database logs
3. Review this guide again
4. Open GitHub issue

---

**🎉 Hongera! Your MR PIKIPIKI TRADING system is now LIVE on the internet!**

Deployment URL: `https://your-app.vercel.app`

