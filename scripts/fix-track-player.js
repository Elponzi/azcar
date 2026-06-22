const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// The `react-native-track-player` dependency is a git fork (#feat/turbomodule).
// On a fresh install it is missing two things that a published package would ship,
// which break the iOS build:
//
//   1. The New Architecture codegen spec. Its codegenConfig sets
//      `includesGeneratedCode: true`, so React Native's app-level codegen SKIPS it,
//      expecting the generated spec to ship with the package. It doesn't (the
//      package's `files` excludes `ios/build`). TPMusicModule.h then fails with
//      "RNTPMusicModuleSpec.h file not found".
//
//   2. The compiled JS entry (`lib/commonjs/index.js`). The fork's `prepare`
//      (`bob build`) never runs for a git dependency — git deps don't get their
//      devDependencies, so `bob` isn't available. Metro then fails to resolve the
//      package `main`.
//
// This module repairs both in node_modules. It is idempotent and must run before
// any iOS build (the Metro bundle + native compile both depend on it).

function fixTrackPlayer(rootDir) {
  const pkgDir = path.join(rootDir, 'node_modules', 'react-native-track-player');
  if (!fs.existsSync(pkgDir)) {
    console.log('react-native-track-player not installed — skipping repair.');
    return;
  }

  // --- Fix 1: generate the iOS codegen spec ---------------------------------
  // Output dir matches codegenConfig.outputDir.ios so the relative #import in
  // TPMusicModule.h ("build/generated/source/codegen/RNTPMusicModuleSpec/...")
  // resolves against ios/.
  const codegenOut = path.join(pkgDir, 'ios', 'build', 'generated', 'source', 'codegen');
  const specHeader = path.join(codegenOut, 'RNTPMusicModuleSpec', 'RNTPMusicModuleSpec.h');

  if (fs.existsSync(specHeader)) {
    console.log('react-native-track-player: codegen spec already present.');
  } else {
    console.log('react-native-track-player: generating iOS codegen spec...');
    fs.mkdirSync(codegenOut, { recursive: true });

    const codegenPkg = path.join(rootDir, 'node_modules', '@react-native', 'codegen', 'lib', 'cli');
    const combineCli = path.join(codegenPkg, 'combine', 'combine-js-to-schema-cli.js');
    const generateCli = path.join(codegenPkg, 'generators', 'generate-all.js');
    const schemaPath = path.join(codegenOut, 'schema.json');
    const srcDir = path.join(pkgDir, 'src');

    // Step 1: combine the JS spec (src/) into a schema.
    run('node', [combineCli, '-p', 'ios', '-l', 'RNTPMusicModuleSpec', schemaPath, srcDir]);
    // Step 2: generate spec files. Output dir is the codegen root; the iOS module
    // spec lands at <out>/RNTPMusicModuleSpec/RNTPMusicModuleSpec.h.
    run('node', [generateCli, schemaPath, 'RNTPMusicModuleSpec', codegenOut]);

    if (!fs.existsSync(specHeader)) {
      throw new Error('Failed to generate RNTPMusicModuleSpec.h');
    }
    console.log('react-native-track-player: codegen spec generated.');
  }

  // --- Fix 2: point the package entry at its TypeScript source --------------
  // `lib/` is never built for a git dependency, so resolve `main` to src/ and let
  // Metro/babel-preset-expo transpile it (Metro transforms node_modules sources).
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const sourceEntry = './src/index.tsx';
  const libExists = fs.existsSync(path.join(pkgDir, 'lib', 'commonjs', 'index.js'));

  if (!libExists && (pkgJson.main !== sourceEntry || pkgJson['react-native'] !== sourceEntry)) {
    pkgJson.main = sourceEntry;
    pkgJson['react-native'] = sourceEntry;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log('react-native-track-player: entry repointed to source (lib/ not built).');
  } else {
    console.log('react-native-track-player: JS entry OK.');
  }
}

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

module.exports = { fixTrackPlayer };
