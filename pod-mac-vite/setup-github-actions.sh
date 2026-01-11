#!/bin/bash

# GitHub Actions Setup Script
# This script helps you set up GitHub Secrets for automated deployments

echo "🔧 GitHub Actions Setup Helper"
echo "=============================="
echo ""
echo "This script will guide you through setting up GitHub Secrets"
echo "for automated deployments to Vercel and Render."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Prerequisites:${NC}"
echo "1. GitHub CLI installed (gh)"
echo "2. Vercel CLI installed (vercel)"
echo "3. Logged into both services"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI is not installed${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo ""

# Get repo info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "${BLUE}Repository: ${GREEN}${REPO}${NC}"
echo ""

echo "================================================"
echo "STEP 1: Set up Vercel"
echo "================================================"
echo ""
echo "1. First, link your project to Vercel:"
echo "   cd pod && vercel link"
echo ""
read -p "Have you linked your project? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please run: cd pod && vercel link"
    exit 1
fi

echo ""
echo "2. Get your Vercel credentials:"
echo ""

# Check if .vercel directory exists
if [ -d "pod/.vercel" ]; then
    ORG_ID=$(cat pod/.vercel/project.json | grep -o '"orgId": "[^"]*' | cut -d'"' -f4)
    PROJECT_ID=$(cat pod/.vercel/project.json | grep -o '"projectId": "[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}Found Vercel project configuration:${NC}"
    echo "   Org ID: $ORG_ID"
    echo "   Project ID: $PROJECT_ID"
    echo ""
else
    echo -e "${YELLOW}⚠️  .vercel directory not found${NC}"
    echo "Please run: cd pod && vercel link"
    exit 1
fi

echo "3. Get your Vercel Token:"
echo "   Go to: https://vercel.com/account/tokens"
echo "   Create a new token and copy it"
echo ""
read -p "Enter your Vercel Token: " VERCEL_TOKEN
echo ""

# Set GitHub secrets
echo "Setting GitHub Secrets..."
echo ""

gh secret set VERCEL_TOKEN -b"$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID -b"$ORG_ID"
gh secret set VERCEL_PROJECT_ID -b"$PROJECT_ID"

echo -e "${GREEN}✅ Vercel secrets configured!${NC}"
echo ""

echo "================================================"
echo "STEP 2: Set up Environment Variables"
echo "================================================"
echo ""

read -p "Enter your backend URL (e.g., https://pod-backend.onrender.com/api): " API_URL
read -p "Enter your Gemini API Key: " GEMINI_KEY

gh secret set VITE_API_BASE_URL -b"$API_URL"
gh secret set VITE_GEMINI_API_KEY -b"$GEMINI_KEY"

echo -e "${GREEN}✅ Environment variables configured!${NC}"
echo ""

echo "================================================"
echo "STEP 3: Optional - Render Deploy Hook"
echo "================================================"
echo ""
echo "If you want to manually trigger Render deployments:"
echo "1. Go to your Render dashboard"
echo "2. Select your backend service"
echo "3. Settings → Deploy Hook"
echo "4. Copy the webhook URL"
echo ""
read -p "Do you want to set up Render deploy hook? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Render Deploy Hook URL: " RENDER_HOOK
    gh secret set RENDER_DEPLOY_HOOK_URL -b"$RENDER_HOOK"
    echo -e "${GREEN}✅ Render deploy hook configured!${NC}"
else
    echo "Skipping Render deploy hook (Render auto-deploys from GitHub anyway)"
fi

echo ""
echo "================================================"
echo "🎉 Setup Complete!"
echo "================================================"
echo ""
echo -e "${GREEN}All GitHub Secrets have been configured!${NC}"
echo ""
echo "Next steps:"
echo "1. Make a change to your code"
echo "2. Commit and push: git push origin Backend"
echo "3. Go to: https://github.com/$REPO/actions"
echo "4. Watch your automated deployment! 🚀"
echo ""
echo "View your secrets at:"
echo "https://github.com/$REPO/settings/secrets/actions"
echo ""
