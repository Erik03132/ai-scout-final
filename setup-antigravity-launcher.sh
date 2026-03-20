#!/bin/bash

# Antigravity Launcher Setup Script
# Run this once to install the launcher

set -e

echo "🚀 Antigravity Launcher Setup"
echo ""

# Create config directory
CONFIG_DIR="$HOME/.antigravity"
echo "📁 Creating config directory: $CONFIG_DIR"
mkdir -p "$CONFIG_DIR"

# Copy launcher script
LAUNCHER_DIR="$CONFIG_DIR/bin"
echo "📁 Creating launcher directory: $LAUNCHER_DIR"
mkdir -p "$LAUNCHER_DIR"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy scripts
echo "📋 Copying launcher scripts..."
cp "$SCRIPT_DIR/launch-antigravity.cjs" "$LAUNCHER_DIR/"
cp "$SCRIPT_DIR/agi" "$LAUNCHER_DIR/"
chmod +x "$LAUNCHER_DIR/launch-antigravity.cjs" "$LAUNCHER_DIR/agi"

# Create default config if not exists
CONFIG_FILE="$CONFIG_DIR/identities.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "📝 Creating default identities config..."
  cat > "$CONFIG_FILE" << 'EOF'
{
  "active_identity": "Account-1",
  "identities": {
    "Account-1": {
      "name": "Identity-Alpha-Mac",
      "proxy": "http://user:pass@proxy-ip:port",
      "mask": {
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "viewport": { "width": 1920, "height": 1080 },
        "timezone": "Europe/Berlin",
        "locale": "de-DE"
      }
    },
    "Account-2": {
      "name": "Identity-Beta-Windows",
      "proxy": "http://user:pass@other-proxy-ip:port",
      "mask": {
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "viewport": { "width": 1440, "height": 900 },
        "timezone": "America/New_York",
        "locale": "en-US"
      }
    }
  }
}
EOF
  echo "   ✏️  Edit $CONFIG_FILE to configure your identities"
else
  echo "✓ Config already exists: $CONFIG_FILE"
fi

# Detect shell
SHELL_NAME=$(basename "$SHELL")
RC_FILE=""

if [[ "$SHELL_NAME" == "zsh" ]]; then
  RC_FILE="$HOME/.zshrc"
elif [[ "$SHELL_NAME" == "bash" ]]; then
  RC_FILE="$HOME/.bashrc"
fi

# Add to PATH and create aliases
if [ -n "$RC_FILE" ]; then
  echo ""
  echo "📝 Adding to $RC_FILE..."
  
  # Check if already added
  if grep -q "antigravity/bin" "$RC_FILE" 2>/dev/null; then
    echo "✓ PATH already configured in $RC_FILE"
  else
    echo "" >> "$RC_FILE"
    echo "# Antigravity Launcher" >> "$RC_FILE"
    echo "export PATH=\"\$HOME/.antigravity/bin:\$PATH\"" >> "$RC_FILE"
    echo "alias agi=\"launch-antigravity.cjs\"" >> "$RC_FILE"
    echo "alias agi-list=\"launch-antigravity.cjs --list\"" >> "$RC_FILE"
    echo "alias agi-set=\"launch-antigravity.cjs --set\"" >> "$RC_FILE"
    echo "✓ Added PATH and aliases to $RC_FILE"
  fi
  
  echo ""
  echo "⚠️  Restart your terminal or run: source $RC_FILE"
else
  echo ""
  echo "⚠️  Could not detect shell. Please add manually:"
  echo ""
  echo "   export PATH=\"\$HOME/.antigravity/bin:\$PATH\""
  echo "   alias agi=\"launch-antigravity.cjs\""
  echo ""
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Usage:"
echo "   agi                    # Launch with active identity"
echo "   agi -i Account-2       # Launch with specific identity"
echo "   agi -l                 # List all identities"
echo "   agi-set Account-1      # Set active identity"
echo ""
echo "📝 Config file: $CONFIG_FILE"
echo ""
