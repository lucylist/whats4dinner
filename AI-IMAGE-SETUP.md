# 🎨 AI Image Generation Setup Guide

Your dinner app now automatically generates beautiful, AI-powered food images for every meal!

## ✅ What's Already Done

- ✅ Backend server created (`/server` folder)
- ✅ Dependencies installed
- ✅ Frontend updated to use AI images
- ✅ Image caching to save costs

## 🔑 Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in with your account
3. Click **"Create new secret key"**
4. Give it a name like "Dinner App"
5. **Copy the key** (starts with `sk-`)
6. **Important:** Save it somewhere safe - you can only see it once!

## 💰 Cost Information

- **DALL-E 3**: ~$0.04 per image (1024x1024)
- **Caching**: After first generation, images are cached (free!)
- **Estimate**: ~$0.40 for 10 meals, then free for subsequent views

## ⚙️ Step 2: Add API Key to Server

1. Open the file: `/whats4dinner/server/.env`
2. Replace `your_openai_api_key_here` with your actual key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   PORT=3001
   ```
3. Save the file

## 🚀 Step 3: Start the Backend Server

Open a **new terminal** and run:

```bash
cd /Users/lucylist/Documents/cursor/whats4dinner/server
npm start
```

You should see:
```
🚀 Server running on http://localhost:3001
📸 AI image generation ready!
```

**Keep this terminal open!**

## 🎯 Step 4: Start the Frontend (if not running)

In your **existing terminal** (or another new one):

```bash
cd /Users/lucylist/Documents/cursor/whats4dinner
npm run dev
```

## ✨ How It Works

1. **Add a new meal** → AI automatically generates a beautiful food image
2. **View meals library** → Shows loading spinner while generating
3. **Cached forever** → Same meal = instant load next time
4. **Still customizable** → Click edit (✏️) to upload your own

## 🎨 What You'll See

When you add a meal like "Spaghetti Carbonara":

1. **Loading state**: 
   ```
   🔄 Generating AI image...
   ```

2. **Generated image**: 
   - Professional food photography
   - Well-lit, appetizing presentation
   - Restaurant-quality plating
   - Photo-realistic

3. **Subsequent views**: 
   - Instant loading (from cache)
   - No additional cost

## 🔧 Troubleshooting

### "Cannot connect to server"
- Make sure backend server is running (`npm start` in server folder)
- Check it's on port 3001: http://localhost:3001/health

### "Failed to generate image"
- Check your API key is correct in `.env`
- Verify you have OpenAI credits: https://platform.openai.com/account/billing
- Check terminal for error messages

### Images not showing
- Wait a few seconds - AI generation takes 5-10 seconds
- Check browser console (F12) for errors
- Verify both frontend and backend are running

## 🎁 Bonus Features

- **Smart caching**: Never generates the same image twice
- **Graceful fallback**: Shows placeholder if generation fails
- **Background processing**: Doesn't block UI while generating
- **Professional prompts**: Optimized for appetizing food photos

## 📝 Quick Reference

### Backend Server (Terminal 1):
```bash
cd /Users/lucylist/Documents/cursor/whats4dinner/server
npm start
```

### Frontend App (Terminal 2):
```bash
cd /Users/lucylist/Documents/cursor/whats4dinner
npm run dev
```

### Access Points:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Cache Status**: http://localhost:3001/api/cache

---

## 🎉 Ready to Go!

Once both servers are running, just add meals and watch the AI magic happen! Every meal gets a beautiful, custom-generated food photo automatically. 

**Enjoy your AI-powered dinner planner!** 🍽️✨
