# Quick Start Guide for Mac

## Prerequisites
- Python 3.12+ (you have it ✓)
- Node.js 18+ (you have it ✓)
- npm (you have it ✓)

## Step-by-Step Instructions

### Option 1: Using the Startup Scripts (Easiest)

1. **Open Terminal** (Applications → Utilities → Terminal)

2. **Start the Backend** (in one terminal window):
   ```bash
   cd ~/Desktop/CodingFiles/kubeseg-drift-lab
   ./start-backend.sh
   ```
   
   You should see:
   ```
   Starting backend server on http://localhost:8000
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

3. **Start the Frontend** (in a NEW terminal window):
   ```bash
   cd ~/Desktop/CodingFiles/kubeseg-drift-lab
   ./start-frontend.sh
   ```
   
   You should see:
   ```
   Starting frontend on http://localhost:5173
   VITE v7.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

4. **Open your browser** and go to: `http://localhost:5173`

### Option 2: Manual Setup

#### Backend Setup:

1. Open Terminal and navigate to the project:
   ```bash
   cd ~/Desktop/CodingFiles/kubeseg-drift-lab/backend
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
   (You should see `(venv)` in your prompt)

3. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

4. Keep this terminal window open. The backend is now running on `http://localhost:8000`

#### Frontend Setup:

1. Open a **NEW Terminal window** (keep the backend running)

2. Navigate to the frontend:
   ```bash
   cd ~/Desktop/CodingFiles/kubeseg-drift-lab/frontend
   ```

3. If you haven't installed dependencies yet, fix npm cache and install:
   ```bash
   npm cache clean --force
   npm install
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

5. The frontend will open at `http://localhost:5173` (or similar port)

## Troubleshooting

### Backend Issues:

- **"Module not found"**: Make sure you're in the `backend` directory and the virtual environment is activated
- **"Port 8000 already in use"**: Another process is using port 8000. Either stop it or change the port:
  ```bash
  uvicorn main:app --reload --port 8001
  ```
- **Architecture mismatch error** (arm64 vs x86_64): If you see an error about incompatible architecture, recreate the venv:
  ```bash
  cd backend
  rm -rf venv
  python3 -m venv venv
  source venv/bin/activate
  arch -arm64 pip install -r requirements.txt
  ```
  The startup script now handles this automatically.

### Frontend Issues:

- **npm cache errors**: Run `npm cache clean --force` then try `npm install` again
- **Port conflicts**: Vite will automatically use the next available port (5174, 5175, etc.)

### Testing the Backend:

Open `http://localhost:8000` in your browser - you should see the API info.

Test the API directly:
```bash
curl http://localhost:8000/api/gaps
```

## What You Should See

1. **Backend Terminal**: Shows FastAPI logs and API requests
2. **Frontend Terminal**: Shows Vite dev server info
3. **Browser**: The kubeseg-gaps dashboard with two tabs:
   - **Gaps & Suggestions**: Shows risky flows, unprotected flows, and policy suggestions
   - **Policy Drift**: Shows missing policies and over-permissive policies

## Stopping the Servers

- Press `Ctrl+C` in each terminal window to stop the servers
- Or close the terminal windows

## Next Steps

- Explore the mock data in `backend/data/`
- Modify the flows/policies to see different analysis results
- Check out the API docs at `http://localhost:8000/docs` (FastAPI auto-generated docs)

