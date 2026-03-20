#!/usr/bin/env node

/**
 * Switch Google Account for Antigravity
 * Очищает кэш Google сессий и позволяет войти под другим аккаунтом
 * 
 * Usage:
 *   ./switch-google-account.cjs              # Интерактивный выбор
 *   ./switch-google-account.cjs Account-2    # Переключиться на Account-2
 *   ./switch-google-account.cjs --clear      # Только очистить кэш
 *   ./switch-google-account.cjs --list       # Показать доступные аккаунты
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const CONFIG_DIR = path.join(os.homedir(), '.antigravity');
const CONFIG_FILE = path.join(CONFIG_DIR, 'identities.json');
const ANTIGRAVITY_APP = '/Applications/Antigravity.app/Contents/MacOS/Electron';

// Пути к данным Electron (где хранятся сессии)
const ELECTRON_DATA_PATHS = [
  path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity'),
  path.join(os.homedir(), 'Library', 'Application Support', 'electron', 'Antigravity'),
  path.join(os.homedir(), '.config', 'Antigravity'),
];

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('✗ Конфигурация не найдена. Запустите launch-antigravity.cjs для создания.');
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (error) {
    console.error(`✗ Ошибка чтения конфигурации: ${error.message}`);
    process.exit(1);
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function listAccounts(config) {
  console.log('\n📋 Доступные аккаунты Google:\n');
  for (const [key, value] of Object.entries(config.identities)) {
    const active = key === config.active_identity ? ' ✓ (активный)' : '';
    console.log(`  ${key}${active}`);
    console.log(`    Имя:     ${value.name}`);
    console.log(`    Proxy:   ${value.proxy}`);
    console.log(`    Timezone: ${value.mask.timezone}`);
    console.log(`    Locale:  ${value.mask.locale}`);
    console.log('');
  }
}

function clearGoogleSessions() {
  console.log('\n🧹 Очистка кэша Google сессий...\n');

  let cleared = false;

  for (const dataPath of ELECTRON_DATA_PATHS) {
    if (fs.existsSync(dataPath)) {
      console.log(`   Найдено: ${dataPath}`);

      // Пути к кэшу и сессиям
      const sessionPaths = [
        path.join(dataPath, 'Session'),
        path.join(dataPath, 'Sessions'),
        path.join(dataPath, 'Cache'),
        path.join(dataPath, 'Code Cache'),
        path.join(dataPath, 'GPUCache'),
        path.join(dataPath, 'Local Storage', 'leveldb'),
        path.join(dataPath, 'IndexedDB'),
      ];

      for (const sessionPath of sessionPaths) {
        if (fs.existsSync(sessionPath)) {
          console.log(`   → Удаление: ${sessionPath}`);
          execSync(`rm -rf "${sessionPath}"`, { stdio: 'ignore' });
          cleared = true;
        }
      }
    }
  }

  // Примечание: Мы НЕ очищаем Keychain для безопасности
  // Очистки Session и Cache достаточно для сброса сессии Google
  // Если сессия сохраняется, можно вручную удалить в Keychain Access:
  // - GoogleAccounts
  // - Chrome Safe Storage

  if (cleared) {
    console.log('\n✓ Кэш сессий очищен\n');
  } else {
    console.log('\n⚠ Кэш сессий не найден (возможно, уже очищен)\n');
  }

  return cleared;
}

function killAntigravity() {
  try {
    console.log('   → Завершение процесса Antigravity...');
    execSync('pkill -f "Antigravity" || true', { stdio: 'ignore' });
    execSync('pkill -f "Electron" || true', { stdio: 'ignore' });
    console.log('✓ Antigravity закрыт\n');
  } catch (e) {
    // Процесс не запущен
  }
}

function launchAntigravity(identityName) {
  const config = loadConfig();
  const identity = config.identities[identityName];

  if (!identity) {
    console.error(`✗ Идентичность "${identityName}" не найдена`);
    process.exit(1);
  }

  console.log(`\n🚀 Запуск Antigravity...`);
  console.log(`   Аккаунт: ${identity.name}`);
  console.log(`   Proxy: ${identity.proxy}`);
  console.log(`   Timezone: ${identity.mask.timezone}`);
  console.log(`   Locale: ${identity.mask.locale}\n`);

  const env = { ...process.env };

  if (identity.proxy) {
    env.HTTP_PROXY = identity.proxy;
    env.HTTPS_PROXY = identity.proxy;
    env.NO_PROXY = 'localhost,127.0.0.1,::1';
  }

  if (identity.mask?.userAgent) {
    env.USER_AGENT = identity.mask.userAgent;
  }

  if (identity.mask?.timezone) {
    env.TZ = identity.mask.timezone;
  }

  if (identity.mask?.locale) {
    env.LANG = `${identity.mask.locale}.UTF-8`;
    env.LC_ALL = `${identity.mask.locale}.UTF-8`;
  }

  if (!fs.existsSync(ANTIGRAVITY_APP)) {
    console.error(`✗ Antigravity не найден в ${ANTIGRAVITY_APP}`);
    process.exit(1);
  }

  const child = spawn(ANTIGRAVITY_APP, [], {
    env,
    detached: true,
    stdio: 'ignore'
  });

  child.unref();
  console.log(`✓ Antigravity запущен (PID: ${child.pid})`);
  console.log('\n💡 Теперь войдите в Google аккаунт через браузер\n');
}

async function interactiveSelect(config) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const accounts = Object.keys(config.identities);

  console.log('\n📋 Выберите аккаунт для входа:\n');
  accounts.forEach((key, index) => {
    const active = key === config.active_identity ? ' ✓ (текущий)' : '';
    console.log(`  ${index + 1}. ${key}${active}`);
  });
  console.log(`  ${accounts.length + 1}. Только очистить кэш (без запуска)`);
  console.log(`  ${accounts.length + 2}. Отмена\n`);

  return new Promise((resolve) => {
    rl.question('Введите номер (1-' + (accounts.length + 2) + '): ', (answer) => {
      rl.close();
      const choice = parseInt(answer);

      if (choice >= 1 && choice <= accounts.length) {
        resolve(accounts[choice - 1]);
      } else if (choice === accounts.length + 1) {
        resolve('--clear-only');
      } else {
        resolve(null);
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const config = loadConfig();

  if (args[0] === '--list' || args[0] === '-l') {
    listAccounts(config);
    return;
  }

  if (args[0] === '--clear') {
    killAntigravity();
    clearGoogleSessions();
    console.log('\n✓ Готово! Теперь запустите: agi\n');
    return;
  }

  if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔄 Switch Google Account для Antigravity

Usage:
  switch-google-account.cjs              Интерактивный выбор аккаунта
  switch-google-account.cjs <account>    Переключиться на указанный аккаунт
  switch-google-account.cjs --clear      Только очистить кэш сессий
  switch-google-account.cjs --list       Показать доступные аккаунты
  switch-google-account.cjs --help       Показать эту справку

Примеры:
  ./switch-google-account.cjs            # Выбрать аккаунт интерактивно
  ./switch-google-account.cjs Account-2  # Переключиться на Account-2
  ./switch-google-account.cjs --clear    # Очистить кэш и выйти
`);
    return;
  }

  // Kill existing process
  killAntigravity();

  // Clear sessions
  clearGoogleSessions();

  let targetAccount = args[0];

  if (!targetAccount) {
    // Интерактивный выбор
    targetAccount = await interactiveSelect(config);

    if (!targetAccount) {
      console.log('\n✗ Отменено\n');
      process.exit(0);
    }

    if (targetAccount === '--clear-only') {
      console.log('\n✓ Кэш очищен. Запустите "agi" для входа.\n');
      process.exit(0);
    }
  }

  // Update active identity
  if (config.identities[targetAccount]) {
    config.active_identity = targetAccount;
    saveConfig(config);
    console.log(`✓ Активный аккаунт установлен: ${targetAccount}\n`);
  } else {
    console.error(`✗ Аккаунт "${targetAccount}" не найден`);
    listAccounts(config);
    process.exit(1);
  }

  // Launch
  launchAntigravity(targetAccount);
}

main().catch(err => {
  console.error('✗ Ошибка:', err.message);
  process.exit(1);
});
