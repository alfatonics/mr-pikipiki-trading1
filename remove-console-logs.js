#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Files to clean
const files = [
  "client/src/pages/Contracts.jsx",
  "client/src/pages/Transport.jsx",
  "client/src/pages/Repairs.jsx",
  "client/src/pages/Reports.jsx",
  "client/src/pages/MyJobs.jsx",
  "client/src/pages/MyRequests.jsx",
  "client/src/pages/Suppliers.jsx",
  "client/src/pages/Customers.jsx",
  "client/src/pages/Approvals.jsx",
  "client/src/pages/Users.jsx",
  "client/src/pages/Motorcycles.jsx",
  "client/src/App.jsx",
];

console.log("🧹 Starting console.log cleanup...\n");

let totalRemoved = 0;

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");
  const originalLineCount = lines.length;

  // Count console statements before
  const beforeCount = (
    content.match(/console\.(log|error|warn|info|debug)/g) || []
  ).length;

  // Remove lines that contain only console statements (full line removal)
  const newLines = lines.filter((line) => {
    const trimmed = line.trim();
    // Remove lines that are just console statements
    if (
      trimmed.startsWith("console.log(") ||
      trimmed.startsWith("console.error(") ||
      trimmed.startsWith("console.warn(") ||
      trimmed.startsWith("console.info(") ||
      trimmed.startsWith("console.debug(")
    ) {
      return false;
    }
    return true;
  });

  content = newLines.join("\n");

  // Also remove inline console statements using regex
  content = content.replace(
    /console\.(log|error|warn|info|debug)\([^;]*\);?\s*/g,
    ""
  );

  // Count console statements after
  const afterCount = (
    content.match(/console\.(log|error|warn|info|debug)/g) || []
  ).length;
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
  `\n🎉 Cleanup complete! Total removed: ${totalRemoved} console statements`
);
