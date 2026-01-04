#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { JsCssLinter } = require("../src/index");
const { findFiles } = require("../src/utils/fileUtils");

/**
 * CLI for js-css-linter - Zero Dependencies
 */

// ANSI colors
const c = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

const args = process.argv.slice(2);

// Parse command line arguments
const options = {
  format: "console",
  help: false,
  version: false,
  directory: process.cwd(),
  output: null,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case "-h":
    case "--help":
      options.help = true;
      break;
    case "-v":
    case "--version":
      options.version = true;
      break;
    case "-d":
    case "--directory":
      options.directory = args[++i];
      break;
    case "-f":
    case "--format":
      options.format = args[++i];
      break;
    case "-o":
    case "--output":
      options.output = args[++i];
      break;
  }
}

// Show help
if (options.help) {
  console.log(`
${c.bold}${c.cyan}js-css-linter${c.reset} - Find unused code in your JavaScript and CSS files
${c.gray}Zero dependencies • Pure Node.js${c.reset}

${c.bold}Usage:${c.reset}
  js-css-linter [options]

${c.bold}Options:${c.reset}
  -h, --help          Show this help message
  -v, --version       Show version number
  -d, --directory     Directory to analyze (default: current directory)
  -f, --format        Output format: console, json, html (default: console)
  -o, --output        Output file path (for json/html formats)

${c.bold}Examples:${c.reset}
  js-css-linter                          # Analyze current directory
  js-css-linter -d ./src                 # Analyze src directory
  js-css-linter -f json -o report.json   # Generate JSON report
  js-css-linter -f html -o report.html   # Generate HTML report

${c.bold}What it finds:${c.reset}
  • Unused JavaScript variables
  • Unused JavaScript functions
  • Unused CSS classes and IDs

${c.gray}For more info: https://github.com/your-repo/js-css-linter${c.reset}
  `);
  process.exit(0);
}

// Show version
if (options.version) {
  const pkg = require("../package.json");
  console.log(pkg.version);
  process.exit(0);
}

// Main execution
async function main() {
  console.log(`${c.cyan}\n🔍 Scanning for files...${c.reset}\n`);

  const baseDir = path.resolve(options.directory);

  // Find files using our custom utility
  const [jsFiles, cssFiles, htmlFiles] = await Promise.all([
    findFiles("**/*.js", { cwd: baseDir }),
    findFiles("**/*.css", { cwd: baseDir }),
    findFiles("**/*.html", { cwd: baseDir }),
  ]);

  console.log(
    `${c.gray}  Found ${jsFiles.length} JavaScript file(s)${c.reset}`
  );
  console.log(`${c.gray}  Found ${cssFiles.length} CSS file(s)${c.reset}`);
  console.log(`${c.gray}  Found ${htmlFiles.length} HTML file(s)${c.reset}`);

  if (jsFiles.length === 0 && cssFiles.length === 0) {
    console.log(
      `${c.yellow}\n⚠ No files found to analyze. Check your directory.${c.reset}\n`
    );
    process.exit(0);
  }

  // Run analysis
  const linter = new JsCssLinter({ reportFormat: options.format });

  console.log(`${c.cyan}\n⏳ Analyzing files...${c.reset}\n`);

  const results = await linter.analyze({
    jsFiles,
    cssFiles,
    htmlFiles,
  });

  // Generate report
  const report = linter.report(results);

  // Output results
  if (options.output) {
    await fs.promises.writeFile(options.output, report);
    console.log(`${c.green}\n✓ Report saved to ${options.output}${c.reset}\n`);
  } else {
    console.log(report);
  }

  // Exit with error code if issues found
  const totalIssues =
    (results.summary.totalUnusedVariables || 0) +
    (results.summary.totalUnusedFunctions || 0) +
    (results.summary.totalUnusedCSSSelectors || 0);

  process.exit(totalIssues > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`${c.red}\n❌ Error:${c.reset}`, error.message);
  process.exit(1);
});
