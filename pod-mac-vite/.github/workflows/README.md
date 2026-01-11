# GitHub Actions Workflows

This directory contains CI/CD workflows for automatic deployment and testing.

## Workflows

### 1. `deploy-frontend.yml` - Frontend Deployment
**Triggers:** Push to `main` or `Backend` branch (when `pod/` files change)

**What it does:**
- Builds the Vite frontend
- Deploys to Vercel automatically
- Runs on every commit to main branches

**Required Secrets:**
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_GEMINI_API_KEY` - Google Gemini API key

### 2. `deploy-backend.yml` - Backend Deployment
**Triggers:** Push to `main` or `Backend` branch (when `pod-backend/` files change)

**What it does:**
- Verifies backend builds successfully
- Runs type checking
- Optionally triggers Render deployment via webhook
- Render auto-deploys from GitHub (no manual trigger needed)

**Required Secrets (Optional):**
- `RENDER_DEPLOY_HOOK_URL` - Render deploy hook URL (optional, for manual trigger)

### 3. `ci.yml` - Continuous Integration
**Triggers:** Pull requests and pushes to main branches

**What it does:**
- Builds both frontend and backend
- Runs type checking
- Ensures code quality before merging

**No secrets required** (uses dummy values for CI)

---

## Setup Instructions

### Step 1: Get Vercel Credentials

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Link your project:
   ```bash
   cd pod
   vercel link
   ```

3. Get your credentials:
   ```bash
   # Get Vercel token
   vercel login
   # Then go to: https://vercel.com/account/tokens
   # Create a new token and copy it
   
   # Get project details
   cat .vercel/project.json
   ```
   
   You'll see:
   ```json
   {
     "orgId": "team_xxxxx",
     "projectId": "prj_xxxxx"
   }
   ```

### Step 2: Get Render Deploy Hook (Optional)

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Settings** → **Deploy Hook**
4. Copy the webhook URL

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:

   **For Vercel Deployment:**
   ```
   Name: VERCEL_TOKEN
   Value: <your-vercel-token>
   
   Name: VERCEL_ORG_ID
   Value: <your-org-id>
   
   Name: VERCEL_PROJECT_ID
   Value: <your-project-id>
   
   Name: VITE_API_BASE_URL
   Value: https://your-backend.onrender.com/api
   
   Name: VITE_GEMINI_API_KEY
   Value: <your-gemini-api-key>
   ```

   **For Render Deployment (Optional):**
   ```
   Name: RENDER_DEPLOY_HOOK_URL
   Value: <your-render-deploy-hook-url>
   ```

### Step 4: Test the Workflow

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test: GitHub Actions deployment"
   git push origin Backend
   ```

3. Go to **Actions** tab in your GitHub repo
4. Watch the workflows run!

---

## Workflow Behavior

### Automatic Deployments
- **Frontend**: Deploys to Vercel on every push to `main` or `Backend` branch
- **Backend**: Render auto-deploys on every push (GitHub Actions just verifies the build)

### Manual Deployments
You can manually trigger deployments:
1. Go to **Actions** tab
2. Select a workflow
3. Click **"Run workflow"**
4. Choose the branch and run

### Path Filtering
Workflows only run when relevant files change:
- Frontend workflow: Only runs when files in `pod/` change
- Backend workflow: Only runs when files in `pod-backend/` change

This saves GitHub Actions minutes and speeds up deployments!

---

## Monitoring Deployments

### GitHub Actions
- View workflow runs: `https://github.com/<username>/<repo>/actions`
- See build logs and errors
- Get deployment status

### Vercel
- Dashboard: `https://vercel.com/dashboard`
- View deployment logs and analytics

### Render
- Dashboard: `https://dashboard.render.com`
- View deployment logs and service health

---

## Troubleshooting

### Vercel Deployment Fails
- Check if `VERCEL_TOKEN` is valid
- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
- Ensure environment variables are set in GitHub Secrets

### Backend Build Fails
- Check TypeScript errors in the logs
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `package.json`

### Workflows Not Triggering
- Check if you're pushing to the correct branch (`main` or `Backend`)
- Verify the file paths changed match the workflow path filters
- Check if workflows are enabled in repository settings

---

## Cost Optimization

### GitHub Actions
- **Free tier**: 2,000 minutes/month for private repos
- **Public repos**: Unlimited minutes
- Path filtering reduces unnecessary workflow runs

### Tips to Save Minutes
- Workflows only run when relevant files change
- Use `workflow_dispatch` for manual control
- Cache dependencies to speed up builds

---

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate tokens** regularly
4. **Use minimal permissions** for tokens
5. **Review workflow runs** for any exposed secrets

---

## Next Steps

1. ✅ Push workflows to GitHub
2. ✅ Set up GitHub Secrets
3. ✅ Make a test commit
4. ✅ Watch automated deployment!
5. 🎉 Enjoy hands-free deployments!

---

## Useful Commands

```bash
# View workflow status
gh run list

# View workflow logs
gh run view <run-id> --log

# Re-run a failed workflow
gh run rerun <run-id>

# Trigger manual workflow
gh workflow run deploy-frontend.yml
```

**Happy Deploying! 🚀**
