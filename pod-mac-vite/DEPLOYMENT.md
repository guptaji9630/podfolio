# Deployment Guide

This guide will help you deploy your portfolio to production.

## Architecture
- **Frontend**: Deployed on Vercel (React + Vite)
- **Backend**: Deployed on Render.com (Express API)

## Prerequisites
- GitHub account with your code pushed
- Vercel account (sign up at https://vercel.com)
- Render account (sign up at https://render.com)
- Resend API key for email service
- Gemini API key for AI features
- Custom domain (optional)

---

## Step 1: Deploy Backend to Render.com

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up/Login with your GitHub account
3. Authorize Render to access your repositories

### 1.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pod-backend-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `pod-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

### 1.3 Set Environment Variables
In the Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=3000
RESEND_API_KEY=your_resend_api_key_here
RECIPIENT_EMAIL=your_email@example.com
ALLOWED_ORIGINS=http://localhost:3000
```

**Note**: We'll update `ALLOWED_ORIGINS` after deploying the frontend.

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for the deployment to complete (5-10 minutes)
3. **Copy your backend URL**: `https://pod-backend-api.onrender.com`

### 1.5 Test Backend
Visit: `https://your-backend-url.onrender.com/health`
You should see a health check response.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up/Login with your GitHub account
3. Authorize Vercel to access your repositories

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `pod`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Set Environment Variables
Click **"Environment Variables"** and add:

```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_AI_TOOLS=true
```

Replace `your-backend-url.onrender.com` with the actual URL from Step 1.4.

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. **Copy your frontend URL**: `https://your-project.vercel.app`

### 2.5 Test Frontend
Visit your Vercel URL and test the application.

---

## Step 3: Update Backend CORS

### 3.1 Update ALLOWED_ORIGINS
1. Go back to your Render dashboard
2. Navigate to your backend service
3. Go to **"Environment"** tab
4. Update `ALLOWED_ORIGINS` to include your Vercel URL:

```
ALLOWED_ORIGINS=https://your-project.vercel.app
```

5. Save changes (this will trigger a redeploy)

---

## Step 4: Custom Domain (Optional)

### 4.1 Configure Frontend Domain
1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `yourdomain.com`)
4. Follow Vercel's DNS configuration instructions
5. Add DNS records at your domain registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 4.2 Configure Backend Subdomain (Optional)
1. In Render dashboard, go to your backend service
2. Click **"Settings"** → **"Custom Domain"**
3. Add subdomain (e.g., `api.yourdomain.com`)
4. Add DNS record at your domain registrar:
   ```
   Type: CNAME
   Name: api
   Value: your-backend.onrender.com
   ```

### 4.3 Update Environment Variables
After adding custom domain:

**In Render (Backend)**:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**In Vercel (Frontend)** - if using custom backend subdomain:
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Step 5: Verify Deployment

### Test Checklist
- [ ] Frontend loads correctly
- [ ] Contact form sends emails
- [ ] AI chat works
- [ ] No CORS errors in console
- [ ] All apps/features work
- [ ] Mobile responsive

---

## Automatic Deployments

Both Vercel and Render automatically deploy when you push to your main branch!

### How it works:
1. Push code to GitHub: `git push origin main`
2. Vercel automatically builds and deploys frontend
3. Render automatically builds and deploys backend
4. Changes are live in 2-5 minutes

---

## Environment Variables Reference

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | https://api.yourdomain.com/api |
| VITE_GEMINI_API_KEY | Google Gemini API key | AIza... |
| VITE_ENABLE_ANALYTICS | Enable analytics | false |
| VITE_ENABLE_AI_TOOLS | Enable AI features | true |

### Backend (Render)
| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | production |
| PORT | Server port | 3000 |
| RESEND_API_KEY | Email service key | re_... |
| RECIPIENT_EMAIL | Your email | you@example.com |
| ALLOWED_ORIGINS | Allowed domains | https://yourdomain.com |
| RATE_LIMIT_MAX | Max requests | 100 |
| RATE_LIMIT_WINDOW | Time window (ms) | 900000 |

---

## Troubleshooting

### CORS Errors
- Make sure `ALLOWED_ORIGINS` in backend includes your frontend URL
- Ensure no trailing slashes in URLs
- Redeploy backend after updating environment variables

### Build Failures
- Check build logs in Vercel/Render dashboard
- Verify all dependencies are in `package.json`
- Ensure environment variables are set correctly

### API Not Working
- Verify backend is deployed and running
- Check `VITE_API_BASE_URL` points to correct backend URL
- Test backend health endpoint directly

### Email Not Sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors
- Ensure `RECIPIENT_EMAIL` is valid

---

## Monitoring

### Vercel
- Dashboard: https://vercel.com/dashboard
- View deployments, analytics, and logs

### Render
- Dashboard: https://dashboard.render.com
- View logs: Select service → "Logs" tab
- Monitor resources and uptime

---

## Costs

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month, unlimited deployments
- **Render**: 750 hours/month (one service 24/7), goes to sleep after 15 min inactivity

### Tips to Stay Free
- Backend on Render free tier sleeps after 15 min inactivity (first request takes ~30s to wake)
- Consider upgrading to paid tier ($7/month) for instant responses
- Vercel free tier is generous for personal portfolios

---

## Next Steps

1. [ ] Deploy backend to Render
2. [ ] Deploy frontend to Vercel
3. [ ] Update CORS settings
4. [ ] Test all features
5. [ ] Configure custom domain
6. [ ] Set up monitoring
7. [ ] Share your portfolio! 🚀

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Your Repository**: https://github.com/your-username/your-repo

Good luck with your deployment! 🎉
