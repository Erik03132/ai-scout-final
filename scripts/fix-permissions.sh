#!/bin/bash

# Fix Permissions Script
# Solves common "EPERM" errors with npm on macOS

echo "🚑 Fixing npm permissions..."

USER_NAME=$(whoami)
GROUP_NAME=$(id -g)

# 1. Fix .npm directory
if [ -d "$HOME/.npm" ]; then
    echo " -> Fixing ~/.npm ownership..."
    sudo chown -R $USER_NAME:$GROUP_NAME "$HOME/.npm"
else
    echo " -> ~/.npm not found, skipping."
fi

# 2. Fix local node_modules
if [ -d "node_modules" ]; then
    echo " -> Fixing ./node_modules..."
    sudo chown -R $USER_NAME:$GROUP_NAME node_modules
fi

echo "✅ Done! You can try running your command again."
