const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const credFile = 'credentials.json';
const isWindows = os.platform() === 'win32';

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

function getCredentials() {
  const credPath = path.join(rootDir, credFile);
  if (!fs.existsSync(credPath)) {
    console.error(`Error: ${credFile} not found at root.`);
    process.exit(1);
  }
  const content = fs.readFileSync(credPath, 'utf8');
  const creds = JSON.parse(content);
  return {
    keystorePath: creds.android.keystore.keystorePath,
    storePassword: creds.android.keystore.keystorePassword,
    keyAlias: creds.android.keystore.keyAlias,
    keyPassword: creds.android.keystore.keyPassword,
  };
}

// 0. Auto-increment version in app.json
console.log('--- Step 0: Incrementing version in app.json ---');
const appJsonPath = path.join(rootDir, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

if (!appJson.expo.android) appJson.expo.android = {};
const oldVersionCode = appJson.expo.android.versionCode || 0;
appJson.expo.android.versionCode = oldVersionCode + 1;

const versionParts = appJson.expo.version.split('.');
if (versionParts.length === 3) {
  versionParts[2] = parseInt(versionParts[2], 10) + 1;
  appJson.expo.version = versionParts.join('.');
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log(`Version updated to: ${appJson.expo.version} (versionCode: ${appJson.expo.android.versionCode})`);

// 1. Run Prebuild
console.log('--- Step 1: Prebuilding Android project ---');
runCommand('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', '--clean']);

// 2. Configure Permissions (Unix only)
if (!isWindows) {
  console.log('--- Step 2: Setting executable permissions for gradlew ---');
  runCommand('chmod', ['+x', path.join(androidDir, 'gradlew')]);
} else {
  console.log('--- Step 2: Skipping chmod on Windows ---');
}

// 3. Configure Signing
console.log('--- Step 3: Configuring Production Signing ---');
const creds = getCredentials();
const gradlePropsPath = path.join(androidDir, 'gradle.properties');

// Path relative to android/app/ folder where it's used in build.gradle
// rootDir/credentials/... -> android/app/../../credentials/...
const relativeKeystorePath = path.join('..', '..', creds.keystorePath);

const signingProps = `
RELEASE_STORE_FILE=${relativeKeystorePath.replace(/\\/g, '/')}
RELEASE_STORE_PASSWORD=${creds.storePassword}
RELEASE_KEY_ALIAS=${creds.keyAlias}
RELEASE_KEY_PASSWORD=${creds.keyPassword}
`;
fs.appendFileSync(gradlePropsPath, signingProps);

const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

const releaseSigningConfig = `
        release {
            if (project.hasProperty('RELEASE_STORE_FILE')) {
                storeFile file(RELEASE_STORE_FILE)
                storePassword RELEASE_STORE_PASSWORD
                keyAlias RELEASE_KEY_ALIAS
                keyPassword RELEASE_KEY_PASSWORD
            }
        }`;

// Inject release signing config into the signingConfigs block
if (buildGradle.includes('signingConfigs {')) {
  if (!buildGradle.includes('RELEASE_STORE_FILE')) {
    console.log('Injecting release signing config into existing signingConfigs block...');
    buildGradle = buildGradle.replace('signingConfigs {', 'signingConfigs {' + releaseSigningConfig);
  }
} else {
  console.log('Creating new signingConfigs block...');
  const signingConfigBlock = `
    signingConfigs {${releaseSigningConfig}
    }`;
  buildGradle = buildGradle.replace(/buildTypes\s*{\s*release\s*{/, signingConfigBlock + '\n    buildTypes {\n        release {');
}

// Ensure release build type uses the release signing config
console.log('Updating release build type to use release signing config...');

const buildTypesIndex = buildGradle.indexOf('buildTypes {');
if (buildTypesIndex !== -1) {
  let buildTypesContent = buildGradle.substring(buildTypesIndex);
  const releaseIndex = buildTypesContent.indexOf('release {');
  if (releaseIndex !== -1) {
     const releaseBlockStart = buildTypesIndex + releaseIndex;
     const partToPatch = buildGradle.substring(releaseBlockStart);
     const updatedPart = partToPatch.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release');
     buildGradle = buildGradle.substring(0, releaseBlockStart) + updatedPart;
  }
}

fs.writeFileSync(buildGradlePath, buildGradle);

// 4. Run Gradle Build
console.log('--- Step 4: Running Gradle bundleRelease ---');
const gradleCommand = isWindows ? 'gradlew' : './gradlew';
runCommand(gradleCommand, ['bundleRelease'], { cwd: androidDir });

console.log('--- Build Process Completed Successfully ---');
console.log(`Signed AAB is located at: android/app/build/outputs/bundle/release/app-release.aab`);
