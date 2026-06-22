const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { fixTrackPlayer } = require('./fix-track-player');
const { getXcodeProject } = require('./ios-project');

// Local iOS build for the Simulator.
// No Apple Developer signing required — mirrors `build-a-local` for Android.
// Produces a .app you can run on the iOS Simulator.

const rootDir = process.cwd();
const iosDir = path.join(rootDir, 'ios');
const derivedData = path.join(iosDir, 'build');
const appJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'app.json'), 'utf8'));
const bundleId =
  (appJson.expo.ios && appJson.expo.ios.bundleIdentifier) ||
  'com.hartha.aloufi.azkardrive';

function runCommand(command, args, options = {}) {
  console.log(`> Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

// 1. Ensure native iOS project exists (generated, gitignored)
if (!fs.existsSync(iosDir)) {
  console.log('--- Step 1: iOS project not found, prebuilding ---');
  runCommand('npx', ['expo', 'prebuild', '--platform', 'ios', '--no-install']);
} else {
  console.log('--- Step 1: Reusing existing ios/ project ---');
}

// 2. Install CocoaPods dependencies
console.log('--- Step 2: Installing CocoaPods dependencies ---');
runCommand('pod', ['install'], { cwd: iosDir });

// 3. Repair the react-native-track-player git fork (codegen spec + JS entry)
console.log('--- Step 3: Repairing react-native-track-player ---');
fixTrackPlayer(rootDir);

// 4. Detect the generated workspace/scheme (name derives from expo.name)
const { workspace, scheme } = getXcodeProject(iosDir);
console.log(`--- Step 4: Building ${scheme} for iOS Simulator (Release) ---`);
runCommand(
  'xcodebuild',
  [
    '-workspace', workspace,
    '-scheme', scheme,
    '-configuration', 'Release',
    '-sdk', 'iphonesimulator',
    '-destination', "'generic/platform=iOS Simulator'",
    '-derivedDataPath', 'build',
    'CODE_SIGNING_ALLOWED=NO',
    'build',
  ],
  { cwd: iosDir }
);

const appPath = path.join(
  derivedData,
  'Build',
  'Products',
  'Release-iphonesimulator',
  `${scheme}.app`
);

console.log('--- Build Process Completed Successfully ---');
console.log(`Simulator .app is located at: ${path.relative(rootDir, appPath)}`);
console.log('Run it with:');
console.log('  xcrun simctl boot "iPhone 17 Pro"  # or any available simulator');
console.log('  open -a Simulator');
console.log(`  xcrun simctl install booted "${path.relative(rootDir, appPath)}"`);
console.log(`  xcrun simctl launch booted ${bundleId}`);
