# Deploy Frontend on Render (Simpler Option)

This guide shows how to deploy both frontend and backend on Render, which is simpler than using GitHub Pages.

## ✅ Benefits of Render for Frontend

- **Everything in one place** - Both frontend and backend on Render
- **Easier management** - One dashboard for everything
- **Environment variables** - Easy to configure
- **No GitHub Pages setup** - No need for gh-pages branch
- **Better CORS** - Can use same domain/subdomain

## 🚀 Quick Setup

### Option 1: Using render.yaml (Recommended)

I've created a `render.yaml` file in your project root. This makes deployment automatic:

1. **Go to Render Dashboard**

   - Visit https://render.com
   - Click "New +" → "Blueprint"

2. **Connect Repository**

   - Select your GitHub repository
   - Render will detect `render.yaml` automatically

3. **Review Configuration**

   - Backend: `kubeseg-drift-lab-backend`
   - Frontend: `kubeseg-drift-lab-frontend`
   - Environment variables will be set automatically

4. **Set OpenAI API Key**

   - After creating services, go to backend service
   - Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `sk-your-key-here`

5. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for both to deploy (5-10 minutes)

### Option 2: Manual Setup

#### Deploy Frontend as Static Site

1. **Go to Render Dashboard**

   - Click "New +" → "Static Site"

2. **Connect Repository**

   - Select your GitHub repository
   - Branch: `main` (or your default branch)

3. **Configure Static Site**

   - **Name**: `kubeseg-drift-lab-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free

4. **Set Environment Variable**

   - Go to "Environment" tab
   - Add: `VITE_API_BASE_URL` = `https://kubeseg-drift-lab.onrender.com`
   - (Use your actual backend URL)

5. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment

## 📝 Important Notes

### Backend URL

After deploying, update the frontend environment variable with your actual backend URL:

- If using `render.yaml`: It's automatically set to `https://kubeseg-drift-lab-backend.onrender.com`
- If manual: Use your backend service URL from Render

### CORS Configuration

Your backend CORS is already set to allow all origins (`allow_origins=["*"]`), so it will work with your Render frontend URL.

### Environment Variables

**Backend** (already set):

- `OPENAI_API_KEY` - Your OpenAI API key

**Frontend** (set during deployment):

- `VITE_API_BASE_URL` - Your backend URL (e.g., `https://kubeseg-drift-lab.onrender.com`)

## 🔄 Updating Your Deployment

### Update Backend:

```bash
git add .
git commit -m "Your changes"
git push origin main
# Render auto-deploys
```

### Update Frontend:

```bash
git add .
git commit -m "Your changes"
git push origin main
# Render auto-deploys
```

## 🌐 Your URLs

After deployment:

- **Backend**: `https://kubeseg-drift-lab-backend.onrender.com`
- **Frontend**: `https://kubeseg-drift-lab-frontend.onrender.com`

## 🆘 Troubleshooting

### Frontend can't connect to backend

- Verify `VITE_API_BASE_URL` is set correctly in Render
- Check that backend URL is correct (no trailing slash)
- Check browser console for CORS errors

### Build fails

- Check Render logs for build errors
- Verify `package.json` has correct build script
- Ensure `frontend/dist` directory is created after build

### Environment variables not working

- Vite requires `VITE_` prefix for environment variables
- Rebuild after changing environment variables
- Check that variables are set in Render dashboard

## 💰 Cost

- **Backend**: Free tier (spins down after inactivity)
- **Frontend**: Free tier (always available)
- **Total**: $0/month (free tier)

For production, consider upgrading backend to paid tier ($7/month) to avoid cold starts.
