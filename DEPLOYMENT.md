# 🚀 VeriCrypt Deployment Guide (Render + Vercel)

This guide walks you through deploying **VeriCrypt** into production:
* **Backend**: Hosted on [Render](https://render.com) (Node.js Web Service)
* **Frontend**: Hosted on [Vercel](https://vercel.com) (Vite React SPA)
* **Database**: Hosted on [MongoDB Atlas](https://cloud.mongodb.com)

---

## 📋 Pre-Deployment Checklist

1. [x] **MongoDB Atlas**: IP Access List includes `0.0.0.0/0` (Allow access from anywhere).
2. [x] **Backend**: Configured for Render container environment (`PORT`, `render.yaml`, production CORS).
3. [x] **Frontend**: Configured for Vercel SPA routing (`vercel.json`, `VITE_API_BASE_URL`).

---

## Part 1: Deploy Backend to Render

### Option A: Automatic Blueprint (Easiest)
1. Push your latest code to your GitHub / GitLab repository.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your repository.
5. Render will automatically detect [`render.yaml`](render.yaml) and configure the service.
6. Set the `MONGODB_URI` environment variable when prompted.
7. Click **Apply**.

---

### Option B: Manual Web Service Setup
1. Log in to [Render](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your repository.
4. Configure the settings:
   * **Name**: `vericrypt-backend`
   * **Region**: Choose the closest region to your MongoDB Atlas cluster (e.g., `Singapore` or `Frankfurt` or `Oregon`).
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`
5. Click **Advanced** → **Add Environment Variables**:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.thvmxfs.mongodb.net/vericrypt?retryWrites=true&w=majority` | Your Atlas connection string |
   | `JWT_SECRET` | *(Generate a strong 32+ character random string)* | Used to sign auth JWTs |
   | `JWT_EXPIRES_IN` | `24h` | Token expiration |
   | `FILE_STORAGE_PATH`| `./uploads` | Storage directory |
   | `CLIENT_URL` | `https://*.vercel.app` *(or your actual Vercel URL)* | Allows CORS from Vercel |
   | `RSA_KEY_SIZE` | `2048` | Key size |
6. Click **Create Web Service**.
7. Once deployed, copy your Render backend URL (e.g., `https://vericrypt-backend.onrender.com`).
8. Test the health endpoint in your browser: `https://vericrypt-backend.onrender.com/health`. It should return `{"status":"healthy",...}`.

---

## Part 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your repository.
4. In the project configuration:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click **Edit** and select `frontend`.
   * **Build and Output Settings**: Defaults are correct (`npm run build` → `dist`).
5. Open the **Environment Variables** section and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://vericrypt-backend.onrender.com` *(your Render backend URL from Part 1)* |
6. Click **Deploy**.
7. Vercel will build the frontend and provide your live URL (e.g., `https://vericrypt-frontend.vercel.app`).

---

## Part 3: Final Link & Verification

1. Go back to your **Render Dashboard** → `vericrypt-backend` → **Environment**.
2. Update `CLIENT_URL` with your exact Vercel production domain:
   ```text
   CLIENT_URL=https://vericrypt-frontend.vercel.app
   ```
3. Open your Vercel URL in your browser:
   * Click **Laksh** (Sender) 1-click login.
   * Verify file sharing, verification, and dashboard metrics.
   * Everything is now live in production!
