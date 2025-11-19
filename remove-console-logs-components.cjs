#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Component files to clean
const files = [
  "client/src/components/DocumentManager.jsx",
  "client/src/components/Layout.jsx",
  "client/src/components/TableWithSearch.jsx",
  // Keep ErrorBoundary console.error for actual error reporting
];

console.log("🧹 Starting console.log cleanup in components...\n");

let totalRemoved = 0;

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");

  // Count console statements before
  const beforeCount = (content.match(/console\.(log|warn|info|debug)/g) || [])
    .length;

  // Remove lines that contain only console statements (but keep console.error in some cases)
  const newLines = lines.filter((line) => {
    const trimmed = line.trim();
    // Remove debug console statements but keep error logging in critical components
    if (
      trimmed.startsWith("console.log(") ||
      trimmed.startsWith("console.warn(") ||
      trimmed.startsWith("console.info(") ||
      trimmed.startsWith("console.debug(")
    ) {
      return false;
    }
    return true;
  });

  content = newLines.join("\n");

  // Also remove inline console statements using regex (except console.error)
  content = content.replace(
    /console\.(log|warn|info|debug)\([^;]*\);?\s*/g,
    ""
  );

  // Count console statements after
  const afterCount = (content.match(/console\.(log|warn|info|debug)/g) || [])
    .length;
  const removed = beforeCount - afterCount;

  if (removed > 0) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(
      `✅ ${path.basename(filePath)}: Removed ${removed} console statements`
    );
    totalRemoved += removed;
  } else {
    console.log(
      `   ${path.basename(filePath)}: Already clean (0 console statements)`
    );
  }
});

console.log(
  `\n🎉 Component cleanup complete! Total removed: ${totalRemoved} console statements`
);
