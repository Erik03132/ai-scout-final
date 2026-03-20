#!/usr/bin/env node

/**
 * Antigravity Launcher with Identity/Proxy Support
 * Usage: 
 *   ./launch-antigravity.cjs                    # Запуск с активной идентичностью
 *   ./launch-antigravity.cjs --identity Account-1  # Запуск с конкретной идентичностью
 *   ./launch-antigravity.cjs --list              # Показать доступные идентичности
 *   ./launch-antigravity.cjs --set Account-2     # Установить активную идентичность
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.antigravity');
const CONFIG_FILE = path.join(CONFIG_DIR, 'identities.json');
const ANTIGRAVITY_APP = '/Applications/Antigravity.app/Contents/MacOS/Electron';

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Create default config if not exists
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultConfig = {
    active_identity: 'Account-1',
    identities: {
      'Account-1': {
        name: 'Identity-Alpha-Mac',
        proxy: 'http://user:pass@proxy-ip:port',
        mask: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          timezone: 'Europe/Berlin',
          locale: 'de-DE'
        }
      },
      'Account-2': {
        name: 'Identity-Beta-Windows',
        proxy: 'http://user:pass@other-proxy-ip:port',
        mask: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          viewport: { width: 1440, height: 900 },
          timezone: 'America/New_York',
          locale: 'en-US'
        }
      }
    }
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  console.log(`✓ Created default config at ${CONFIG_FILE}`);
}

function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`✗ Error reading config: ${error.message}`);
    process.exit(1);
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`✗ Error saving config: ${error.message}`);
    process.exit(1);
  }
}

function listIdentities(config) {
  console.log('\n📋 Available Identities:\n');
  for (const [key, value] of Object.entries(config.identities)) {
    const active = key === config.active_identity ? ' ✓ (active)' : '';
    console.log(`  ${key}${active}`);
    console.log(`    Name:  ${value.name}`);
    console.log(`    Proxy: ${value.proxy}`);
    console.log(`    TZ:    ${value.mask.timezone}`);
    console.log(`    Locale: ${value.mask.locale}`);
    console.log('');
  }
}

function setIdentity(identityName) {
  const config = loadConfig();
  if (!config.identities[identityName]) {
    console.error(`✗ Identity "${identityName}" not found`);
    console.log('Available identities:');
    listIdentities(config);
    process.exit(1);
  }
  config.active_identity = identityName;
  saveConfig(config);
  console.log(`✓ Active identity set to: ${identityName}`);
}

function getIdentity(identityName) {
  const config = loadConfig();
  const name = identityName || config.active_identity;
  if (!config.identities[name]) {
    console.error(`✗ Identity "${name}" not found`);
    process.exit(1);
  }
  return config.identities[name];
}

function buildEnvVars(identity) {
  const env = { ...process.env };

  // Proxy settings
  if (identity.proxy) {
    env.HTTP_PROXY = identity.proxy;
    env.HTTPS_PROXY = identity.proxy;
    env.NO_PROXY = 'localhost,127.0.0.1,::1';
  }

  // User agent (Electron apps may respect this)
  if (identity.mask?.userAgent) {
    env.USER_AGENT = identity.mask.userAgent;
  }

  // Timezone
  if (identity.mask?.timezone) {
    env.TZ = identity.mask.timezone;
  }

  // Locale
  if (identity.mask?.locale) {
    env.LANG = `${identity.mask.locale}.UTF-8`;
    env.LC_ALL = `${identity.mask.locale}.UTF-8`;
  }

  return env;
}

function launch(identityName) {
  const identity = getIdentity(identityName);

  console.log(`\n🚀 Launching Antigravity...`);
  console.log(`   Identity: ${identity.name}`);
  console.log(`   Proxy: ${identity.proxy}`);
  console.log(`   Timezone: ${identity.mask.timezone}`);
  console.log(`   Locale: ${identity.mask.locale}\n`);

  const env = buildEnvVars(identity);

  // Check if app exists
  if (!fs.existsSync(ANTIGRAVITY_APP)) {
    console.error(`✗ Antigravity app not found at ${ANTIGRAVITY_APP}`);
    process.exit(1);
  }

  // Spawn the app
  const child = spawn(ANTIGRAVITY_APP, [], {
    env,
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  console.log(`✓ Antigravity launched (PID: ${child.pid})`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case '--list':
  case '-l':
    listIdentities(loadConfig());
    break;

  case '--set':
    if (!args[1]) {
      console.error('✗ Please specify identity name');
      console.log('Usage: launch-antigravity.cjs --set <identity-name>');
      process.exit(1);
    }
    setIdentity(args[1]);
    break;

  case '--identity':
  case '-i':
    if (!args[1]) {
      console.error('✗ Please specify identity name');
      console.log('Usage: launch-antigravity.cjs --identity <identity-name>');
      process.exit(1);
    }
    launch(args[1]);
    break;

  case '--help':
  case '-h':
    console.log(`
🚀 Antigravity Launcher

Usage:
  launch-antigravity.cjs                    Launch with active identity
  launch-antigravity.cjs --identity <name>  Launch with specific identity
  launch-antigravity.cjs --set <name>       Set active identity
  launch-antigravity.cjs --list             List available identities
  launch-antigravity.cjs --help             Show this help

Examples:
  ./launch-antigravity.cjs                  # Launch with default
  ./launch-antigravity.cjs -i Account-2     # Launch with Account-2
  ./launch-antigravity.cjs --set Account-1  # Set Account-1 as default
  ./launch-antigravity.cjs -l               # Show all identities
`);
    break;

  case undefined:
    // No arguments - launch with active identity
    launch();
    break;

  default:
    console.error(`✗ Unknown command: ${command}`);
    console.log('Use --help for usage information');
    process.exit(1);
}
