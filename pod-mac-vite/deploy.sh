#!/bin/bash

# Deployment Script for Pod Portfolio
# This script helps you deploy both frontend and backend

echo "🚀 Pod Portfolio Deployment Helper"
echo "===================================="
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes. Please commit or stash them first."
    echo ""
    git status -s
    echo ""
    read -p "Do you want to commit these changes now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "Deploy: Update deployment configurations"
    else
        echo "❌ Aborting deployment. Please commit your changes first."
        exit 1
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "STEP 1: Deploy Backend to Render"
echo "================================="
echo "1. Go to https://render.com/login"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Select 'pod-backend' as root directory"
echo "5. Render will auto-detect the render.yaml config"
echo "6. Add these environment variables:"
echo "   - RESEND_API_KEY=your_key"
echo "   - RECIPIENT_EMAIL=your@email.com"
echo "   - ALLOWED_ORIGINS=http://localhost:3000"
echo "7. Click 'Create Web Service'"
echo "8. Wait for deployment (~5-10 min)"
echo "9. Copy your backend URL (e.g., https://pod-backend-api.onrender.com)"
echo ""
echo "STEP 2: Deploy Frontend to Vercel"
echo "=================================="
echo "1. Go to https://vercel.com/login"
echo "2. Click 'Add New...' → 'Project'"
echo "3. Import your GitHub repository"
echo "4. Select 'pod' as root directory"
echo "5. Vercel will auto-detect Vite configuration"
echo "6. Add these environment variables:"
echo "   - VITE_API_BASE_URL=https://your-backend-url.onrender.com/api"
echo "   - VITE_GEMINI_API_KEY=your_gemini_key"
echo "   - VITE_ENABLE_AI_TOOLS=true"
echo "7. Click 'Deploy'"
echo "8. Wait for deployment (~2-5 min)"
echo "9. Copy your frontend URL (e.g., https://your-project.vercel.app)"
echo ""
echo "STEP 3: Update Backend CORS"
echo "==========================="
echo "1. Go back to Render dashboard"
echo "2. Select your backend service"
echo "3. Go to 'Environment' tab"
echo "4. Update ALLOWED_ORIGINS with your Vercel URL"
echo "5. Save (this will trigger a redeploy)"
echo ""
echo "🎉 You're all set! Test your deployed app!"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""
