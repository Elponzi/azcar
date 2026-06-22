const fs = require('fs');
const path = require('path');

// The Xcode project/scheme name is derived by `expo prebuild` from `expo.name`
// (e.g. "أذكار AI" sanitizes to "AI"), NOT from app.json's `scheme` field. It can
// therefore change across Expo versions or config edits, so we detect it from the
// generated ios/ directory rather than hardcoding it.
//
// Returns { workspace, scheme, projectName } — workspace/scheme are basenames
// relative to iosDir (e.g. "AI.xcworkspace", "AI").
function getXcodeProject(iosDir) {
  if (!fs.existsSync(iosDir)) {
    throw new Error(`iOS project not found at ${iosDir} — run prebuild first.`);
  }
  const projects = fs
    .readdirSync(iosDir)
    .filter((name) => name.endsWith('.xcodeproj'));

  if (projects.length === 0) {
    throw new Error(`No .xcodeproj found in ${iosDir}.`);
  }
  if (projects.length > 1) {
    console.warn(`Multiple .xcodeproj found in ${iosDir}, using ${projects[0]}.`);
  }

  const projectName = path.basename(projects[0], '.xcodeproj');
  const workspace = `${projectName}.xcworkspace`;

  if (!fs.existsSync(path.join(iosDir, workspace))) {
    throw new Error(`Expected ${workspace} in ${iosDir} but it does not exist.`);
  }

  // The app scheme matches the project name in an Expo-generated project.
  return { workspace, scheme: projectName, projectName };
}

module.exports = { getXcodeProject };
