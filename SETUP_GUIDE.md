# Setup Guide

## 1. Upload to GitHub
- Drag all files to new repository
- Name: jobmatch-ai

## 2. Deploy to Vercel
- Import GitHub repo
- Set Root Directory: `frontend`
- Add environment variables

## 3. Environment Variables
```
DATABASE_URL=your-postgres-url
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-random-32-char-string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=JobMatch AI
```

## 4. Database Setup
- Use Vercel Postgres or Neon
- Run schema.sql in SQL editor

## 5. n8n Setup
- Import workflow JSON
- Update credential IDs
- Get webhook URLs