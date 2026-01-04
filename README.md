# js-css-linter

A **zero-dependency** static analysis tool to detect unused variables, functions, and CSS in your codebase.

## Features

- 🔍 **Unused JavaScript Variables** - Detect variables that are declared but never used
- 📦 **Unused Functions** - Find functions that are defined but never called
- 🎨 **Unused CSS** - Identify CSS classes and IDs that aren't used in HTML or JS files
- 📊 **Multiple Output Formats** - Console, JSON, or HTML reports
- 🚀 **Zero Dependencies** - Pure Node.js, no external packages required
- ⚡ **Fast & Lightweight** - Regex-based parsing for speed

## Installation

```bash
npm install js-css-linter
```

Or globally:

```bash
npm install -g js-css-linter
```

## CLI Usage

```bash
# Analyze current directory
js-css-linter

# Analyze specific directory
js-css-linter -d ./src

# Custom file patterns
js-css-linter --js "src/**/*.js" --css "styles/**/*.css"

# Generate JSON report
js-css-linter -f json -o report.json

# Generate HTML report
js-css-linter -f html -o report.html
```

### CLI Options

| Option             | Description                                       |
| ------------------ | ------------------------------------------------- |
| `-h, --help`       | Show help message                                 |
| `-v, --version`    | Show version number                               |
| `-d, --directory`  | Directory to analyze (default: current directory) |
| `--js <pattern>`   | Glob pattern for JavaScript files                 |
| `--css <pattern>`  | Glob pattern for CSS files                        |
| `--html <pattern>` | Glob pattern for HTML files                       |
| `-f, --format`     | Output format: console, json, html                |
| `-o, --output`     | Output file path                                  |

## Programmatic API

```javascript
const { JsCssLinter } = require("js-css-linter");

const linter = new JsCssLinter();

// Full project analysis
const results = await linter.analyze({
  jsFiles: ["src/**/*.js"],
  cssFiles: ["styles/**/*.css"],
  htmlFiles: ["public/**/*.html"],
});

console.log(linter.report(results));
```

### Analyze JavaScript Only

```javascript
const { analyzeJavaScript } = require("js-css-linter");

const result = await analyzeJavaScript("path/to/file.js");
console.log(result.unusedVariables);
console.log(result.unusedFunctions);
```

### Analyze CSS Only

```javascript
const { findUnusedCSS } = require("js-css-linter");

const result = await findUnusedCSS({
  cssFiles: ["styles.css"],
  htmlFiles: ["index.html"],
  jsFiles: ["app.js"],
});

console.log(result.unusedSelectors);
```

## What It Detects

### JavaScript

- Unused variable declarations (`const`, `let`, `var`)
- Unused function declarations
- Unused destructured variables
- Unused function parameters (marked separately)

### CSS

- Unused class selectors (`.class-name`)
- Unused ID selectors (`#id-name`)
- Cross-references with HTML `class` and `id` attributes
- Cross-references with JavaScript DOM methods:
  - `classList.add/remove/toggle`
  - `getElementById`
  - `querySelector/querySelectorAll`
  - jQuery selectors

## Configuration

Variables and functions starting with `_` (underscore) are ignored by default. This is a common convention for intentionally unused variables.

```javascript
const _intentionallyUnused = "ignored";
```

## Example Output

```
📊 JS-CSS-Linter Analysis Report

══════════════════════════════════════════════════

🔍 JavaScript Analysis

  ⚠ Unused Variables (2):
    • tempValue
      src/utils.js:15:6
    • debugFlag
      src/config.js:8:4

  ⚠ Unused Functions (1):
    • legacyHandler()
      src/handlers.js:42:0

🎨 CSS Analysis

  ⚠ Unused CSS Selectors (3):
    • .old-button
      styles/main.css:24:0
    • #deprecated-header
      styles/layout.css:12:0

══════════════════════════════════════════════════

📈 Summary

  Total unused variables: 2
  Total unused functions: 1
  Total unused CSS selectors: 2

  ⚠ Found 5 potential issue(s) to review.
```

## Running Tests

```bash
npm test
```

## License

MIT
