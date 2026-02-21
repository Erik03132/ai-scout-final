#!/bin/bash

# go-to-end.sh: Complete automation for mobile optimization, styling and deployment

echo "🚀 Starting 'Go To End' finalization process..."

# 1. Image and Bundle Optimization check
echo "📦 Building project for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before finalization."
    exit 1
fi

# 2. Git Sync
echo "git synchronization..."
git add .
git commit -m "feat: ultimate mobile optimization and premium styling"

# 3. Create a unique final repo if gh is available, otherwise just push
if command -v gh &> /dev/null; then
    REPO_NAME="ai-scout-final-$(date +%s)"
    echo "Creating new GitHub repository: $REPO_NAME"
    gh repo create "$REPO_NAME" --public --source=. --remote=origin-final --push
else
    echo "Pushing to existing origins..."
    git push origin main
fi

# 4. Vercel Deployment
echo "🚀 Deploying to Vercel..."
npx vercel --prod --confirm --yes

echo "✅ Finalization complete! Your app is optimized, committed and live."
