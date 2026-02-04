const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const dotAndroidDir = path.join(rootDir, '.android');

function runCommand(command, args, options = {}) {
  console.log(`> Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options
  });
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

// 1. Run Prebuild
console.log('--- Step 1: Prebuilding Android project ---');
runCommand('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', '--clean']);

// 2. Prepare .android folder
console.log('--- Step 2: Moving android to .android ---');
if (fs.existsSync(dotAndroidDir)) {
  console.log(`Removing existing ${dotAndroidDir}...`);
  fs.rmSync(dotAndroidDir, { recursive: true, force: true });
}

if (fs.existsSync(androidDir)) {
  fs.renameSync(androidDir, dotAndroidDir);
} else {
  console.error('Error: "android" directory not found after prebuild.');
  process.exit(1);
}

// 3. Create junction for compatibility
console.log('--- Step 3: Creating temporary junction ---');
runCommand('cmd', ['/c', `mklink /J android .android`]);

// 4. Run Gradle Build
console.log('--- Step 4: Running Gradle bundleRelease ---');
try {
  runCommand('.\gradlew', ['bundleRelease'], { cwd: dotAndroidDir });
} finally {
  // 5. Cleanup junction
  console.log('--- Step 5: Cleaning up junction ---');
  runCommand('cmd', ['/c', 'rd android']);
}

console.log('--- Build Process Completed Successfully ---');
