# Deployment Guide for kubeseg-drift-lab

This guide will help you deploy your application to GitHub Pages (frontend) and Render/Railway (backend) with secure OpenAI API key management.

## 📋 Prerequisites

- GitHub account
- Render account (free tier available) OR Railway account
- OpenAI API key
- Node.js and npm installed locally

## 🚀 Step-by-Step Deployment

### Part 1: Deploy Backend to Render (Recommended)

#### 1.1 Create Render Account

1. Go to https://render.com
2. Sign up with your GitHub account
3. Connect your GitHub account if prompted

#### 1.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect account"** if not already connected
   - Select your `kubeseg-drift-lab` repository
   - Click **"Connect"**

#### 1.3 Configure the Service

Fill in these settings:

- **Name**: `kubeseg-drift-lab-backend` (or your preferred name)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan**: **Free** (or upgrade for better performance)

#### 1.4 Set Environment Variables

1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-openai-api-key-here`
4. Click **"Save Changes"**

#### 1.5 Deploy

1. Click **"Create Web Service"** at the bottom
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your service URL (e.g., `https://kubeseg-drift-lab-backend.onrender.com`)

#### 1.6 Update Backend CORS

Update `backend/main.py` to allow your GitHub Pages domain:

```python
# Around line 41-47, update CORS:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourusername.github.io",  # Your GitHub Pages URL
        "http://localhost:5173",  # Local development
        "*"  # For demo purposes (less secure)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Commit and push this change:**

```bash
git add backend/main.py
git commit -m "Update CORS for production"
git push origin main
```

Render will automatically redeploy.

---

### Part 2: Deploy Frontend to GitHub Pages

#### 2.1 Update Configuration Files

**A. Update `frontend/vite.config.ts`:**
The base path should match your repository name. If your repo is `kubeseg-drift-lab`, it's already set correctly. If different, update:

```typescript
base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
```

**B. Update `frontend/package.json`:**
Update the homepage URL:

```json
"homepage": "https://yourusername.github.io/kubeseg-drift-lab"
```

Replace `yourusername` with your GitHub username.

**C. Create Environment File:**
Create `frontend/.env.production`:

```
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

Replace `your-backend-url.onrender.com` with your actual Render backend URL from Step 1.5.

#### 2.2 Install GitHub Pages Deployment Tool

```bash
cd frontend
npm install --save-dev gh-pages
```

#### 2.3 Build and Deploy

```bash
# Make sure you're in the frontend directory
cd frontend

# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

This will:

- Build your React app
- Create/update the `gh-pages` branch
- Push to GitHub

#### 2.4 Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages** (left sidebar)
3. Under **"Source"**, select:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes for GitHub to build
6. Your site will be available at: `https://yourusername.github.io/kubeseg-drift-lab`

---

### Part 3: Verify Deployment

#### 3.1 Test Backend

1. Open your backend URL: `https://your-backend.onrender.com/`
2. You should see API information
3. Test an endpoint: `https://your-backend.onrender.com/api/gaps`

#### 3.2 Test Frontend

1. Open your GitHub Pages URL
2. Navigate through all tabs
3. Check browser console (F12) for any errors
4. Test features that require API calls

#### 3.3 Common Issues

**CORS Errors:**

- Make sure backend CORS includes your GitHub Pages domain
- Check browser console for specific error

**API Not Found:**

- Verify `VITE_API_BASE_URL` in `.env.production` is correct
- Check that backend is running (visit backend URL directly)
- Check browser Network tab to see actual API calls

**OpenAI Errors:**

- Verify `OPENAI_API_KEY` is set correctly on Render
- Check Render logs for API key errors
- Ensure API key has credits

---

## 🔄 Updating Your Deployment

### Update Backend:

```bash
# Make changes, then:
git add .
git commit -m "Your changes"
git push origin main
# Render auto-deploys
```

### Update Frontend:

```bash
cd frontend
npm run deploy
# GitHub Pages auto-updates
```

---

## 🔐 Security Checklist

✅ **DO:**

- Store OpenAI API key only on backend (Render environment variables)
- Use environment variables for all secrets
- Keep `.env` files in `.gitignore`
- Use HTTPS for all deployments

❌ **DON'T:**

- Commit API keys to Git
- Expose API keys in frontend code
- Share API keys in screenshots
- Use `allow_origins=["*"]` in production (use specific domains)

---

## 💰 Cost Estimates

- **GitHub Pages**: Free
- **Render Free Tier**: Free (with limitations: spins down after 15 min inactivity)
- **OpenAI API**: Pay-per-use (~$0.01-0.10 per request, depends on model)

**Note:** Render free tier has cold starts (first request after inactivity takes ~30 seconds). For production, consider paid tier ($7/month).

---

## 🆘 Troubleshooting

### Backend won't start

- Check Render logs: Go to your service → "Logs" tab
- Verify `requirements.txt` is correct
- Check that `main.py` is in the `backend` directory

### Frontend can't connect to backend

- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings in backend
- Test backend URL directly in browser
- Check browser Network tab for actual requests

### Build fails

- Run `npm run build` locally first to catch errors
- Check TypeScript errors: `npm run build`
- Verify all imports are correct

---

## 📝 Quick Reference

**Backend URL**: `https://your-backend.onrender.com`  
**Frontend URL**: `https://yourusername.github.io/kubeseg-drift-lab`  
**Environment Variable**: `OPENAI_API_KEY` (on Render)  
**Frontend Config**: `frontend/.env.production`

---

## 🎉 You're Done!

Once deployed, share your GitHub Pages URL with others. The OpenAI API key stays secure on the backend, and users can access your application from anywhere!
