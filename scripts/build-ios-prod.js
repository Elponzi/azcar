const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { fixTrackPlayer } = require('./fix-track-player');
const { getXcodeProject } = require('./ios-project');

// Production iOS build — archives and exports a signed .ipa for App Store / TestFlight.
// Mirrors `build-prod.js` (Android). Requires Apple Developer signing.
//
// Expected `credentials.json` shape (gitignored, kept at repo root):
// {
//   "ios": {
//     "teamId": "ABCDE12345",            // Apple Developer Team ID (required)
//     "method": "app-store",             // app-store | ad-hoc | development | enterprise
//     "bundleIdentifier": "com.hartha.aloufi.azkardrive"  // optional, defaults from app.json
//   }
// }

const rootDir = process.cwd();
const iosDir = path.join(rootDir, 'ios');
const credFile = 'credentials.json';

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

function getCredentials() {
  const credPath = path.join(rootDir, credFile);
  if (!fs.existsSync(credPath)) {
    console.error(`Error: ${credFile} not found at root.`);
    process.exit(1);
  }
  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  if (!creds.ios || !creds.ios.teamId) {
    console.error(`Error: ${credFile} is missing "ios.teamId".`);
    process.exit(1);
  }
  return {
    teamId: creds.ios.teamId,
    method: creds.ios.method || 'app-store',
    bundleIdentifier: creds.ios.bundleIdentifier,
  };
}

// 0. Auto-increment version in app.json (mirrors build-prod.js)
console.log('--- Step 0: Incrementing version in app.json ---');
const appJsonPath = path.join(rootDir, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

if (!appJson.expo.ios) appJson.expo.ios = {};
const oldBuildNumber = parseInt(appJson.expo.ios.buildNumber || '0', 10);
appJson.expo.ios.buildNumber = String(oldBuildNumber + 1);

const versionParts = appJson.expo.version.split('.');
if (versionParts.length === 3) {
  versionParts[2] = parseInt(versionParts[2], 10) + 1;
  appJson.expo.version = versionParts.join('.');
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log(`Version updated to: ${appJson.expo.version} (buildNumber: ${appJson.expo.ios.buildNumber})`);

const bundleId =
  appJson.expo.ios.bundleIdentifier || 'com.hartha.aloufi.azkardrive';

// 1. Run Prebuild (clean)
console.log('--- Step 1: Prebuilding iOS project ---');
runCommand('npx', ['expo', 'prebuild', '--platform', 'ios', '--no-install', '--clean']);

// 2. Install CocoaPods dependencies
console.log('--- Step 2: Installing CocoaPods dependencies ---');
runCommand('pod', ['install'], { cwd: iosDir });

// 3. Repair the react-native-track-player git fork (codegen spec + JS entry)
console.log('--- Step 3: Repairing react-native-track-player ---');
fixTrackPlayer(rootDir);

// 3b. Read signing credentials
console.log('--- Step 3b: Loading signing credentials ---');
const creds = getCredentials();
const signingBundleId = creds.bundleIdentifier || bundleId;

// 3c. Detect the generated workspace/scheme (name derives from expo.name)
const { workspace, scheme } = getXcodeProject(iosDir);
console.log(`--- Detected Xcode workspace: ${workspace} (scheme: ${scheme}) ---`);

// 4. Archive
console.log('--- Step 4: Archiving (xcodebuild archive) ---');
const archivePath = path.join(iosDir, 'build', `${scheme}.xcarchive`);
runCommand(
  'xcodebuild',
  [
    '-workspace', workspace,
    '-scheme', scheme,
    '-configuration', 'Release',
    '-destination', "'generic/platform=iOS'",
    '-archivePath', path.join('build', `${scheme}.xcarchive`),
    'archive',
    'CODE_SIGN_STYLE=Automatic',
    `DEVELOPMENT_TEAM=${creds.teamId}`,
    '-allowProvisioningUpdates',
  ],
  { cwd: iosDir }
);

// 5. Write exportOptions.plist
console.log('--- Step 5: Writing exportOptions.plist ---');
const exportOptionsPath = path.join(iosDir, 'build', 'exportOptions.plist');
const exportOptions = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>${creds.method}</string>
    <key>teamID</key>
    <string>${creds.teamId}</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
`;
fs.writeFileSync(exportOptionsPath, exportOptions);

// 6. Export .ipa
console.log('--- Step 6: Exporting signed .ipa ---');
const exportDir = path.join(iosDir, 'build', 'ipa');
runCommand(
  'xcodebuild',
  [
    '-exportArchive',
    '-archivePath', path.join('build', `${scheme}.xcarchive`),
    '-exportOptionsPlist', path.join('build', 'exportOptions.plist'),
    '-exportPath', path.join('build', 'ipa'),
    '-allowProvisioningUpdates',
  ],
  { cwd: iosDir }
);

console.log('--- Build Process Completed Successfully ---');
console.log(`Signed .ipa is located at: ${path.relative(rootDir, exportDir)}/`);
console.log(`Bundle identifier: ${signingBundleId}`);
console.log(`Archive: ${path.relative(rootDir, archivePath)}`);
