/**
 * Reporter - Zero Dependencies
 * Generates reports from analysis results using ANSI colors
 */

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Apply color to text
 */
function colorize(text, ...codes) {
  return codes.join("") + text + colors.reset;
}

class Reporter {
  constructor(format = "console") {
    this.format = format;
  }

  /**
   * Generate a report from analysis results
   * @param {Object} results - Analysis results
   * @returns {string} Formatted report
   */
  generate(results) {
    switch (this.format) {
      case "json":
        return this.generateJSON(results);
      case "html":
        return this.generateHTML(results);
      case "console":
      default:
        return this.generateConsole(results);
    }
  }

  /**
   * Generate console output with ANSI colors
   * @param {Object} results - Analysis results
   * @returns {string} Console formatted output
   */
  generateConsole(results) {
    const lines = [];

    lines.push(
      colorize("\n📊 JS-CSS-Linter Analysis Report\n", colors.bold, colors.cyan)
    );
    lines.push(colorize("═".repeat(50), colors.gray));

    // JavaScript Results
    if (results.javascript) {
      lines.push(
        colorize("\n🔍 JavaScript Analysis\n", colors.bold, colors.yellow)
      );

      if (results.javascript.unusedVariables?.length > 0) {
        lines.push(
          colorize(
            `  ⚠ Unused Variables (${results.javascript.unusedVariables.length}):`,
            colors.red
          )
        );
        results.javascript.unusedVariables.forEach((item) => {
          const loc = item.location;
          const paramTag = item.isParameter
            ? colorize(" (parameter)", colors.gray)
            : "";
          lines.push(colorize(`    • ${item.name}${paramTag}`, colors.gray));
          lines.push(
            colorize(`      ${loc.file}:${loc.line}:${loc.column}`, colors.dim)
          );
        });
      } else {
        lines.push(colorize("  ✓ No unused variables found", colors.green));
      }

      lines.push("");

      if (results.javascript.unusedFunctions?.length > 0) {
        lines.push(
          colorize(
            `  ⚠ Unused Functions (${results.javascript.unusedFunctions.length}):`,
            colors.red
          )
        );
        results.javascript.unusedFunctions.forEach((item) => {
          const loc = item.location;
          lines.push(colorize(`    • ${item.name}()`, colors.gray));
          lines.push(
            colorize(`      ${loc.file}:${loc.line}:${loc.column}`, colors.dim)
          );
        });
      } else {
        lines.push(colorize("  ✓ No unused functions found", colors.green));
      }
    }

    // CSS Results
    if (results.css) {
      lines.push(colorize("\n🎨 CSS Analysis\n", colors.bold, colors.yellow));

      if (results.css.unusedSelectors?.length > 0) {
        lines.push(
          colorize(
            `  ⚠ Unused CSS Selectors (${results.css.unusedSelectors.length}):`,
            colors.red
          )
        );
        results.css.unusedSelectors.forEach((item) => {
          const prefix = item.type === "class" ? "." : "#";
          const loc = item.location;
          lines.push(colorize(`    • ${prefix}${item.name}`, colors.gray));
          if (loc) {
            lines.push(
              colorize(
                `      ${loc.file}:${loc.line}:${loc.column}`,
                colors.dim
              )
            );
          }
        });
      } else {
        lines.push(colorize("  ✓ No unused CSS selectors found", colors.green));
      }
    }

    // Summary
    if (results.summary) {
      lines.push(colorize("\n" + "═".repeat(50), colors.gray));
      lines.push(colorize("\n📈 Summary\n", colors.bold, colors.cyan));
      lines.push(
        `  Total unused variables: ${colorize(
          String(results.summary.totalUnusedVariables || 0),
          colors.yellow
        )}`
      );
      lines.push(
        `  Total unused functions: ${colorize(
          String(results.summary.totalUnusedFunctions || 0),
          colors.yellow
        )}`
      );
      lines.push(
        `  Total unused CSS selectors: ${colorize(
          String(results.summary.totalUnusedCSSSelectors || 0),
          colors.yellow
        )}`
      );

      const total =
        (results.summary.totalUnusedVariables || 0) +
        (results.summary.totalUnusedFunctions || 0) +
        (results.summary.totalUnusedCSSSelectors || 0);

      lines.push("");
      if (total === 0) {
        lines.push(
          colorize(
            "  ✓ No issues found! Your code is clean.",
            colors.green,
            colors.bold
          )
        );
      } else {
        lines.push(
          colorize(
            `  ⚠ Found ${total} potential issue(s) to review.`,
            colors.yellow,
            colors.bold
          )
        );
      }
    }

    lines.push("\n");
    return lines.join("\n");
  }

  /**
   * Generate JSON output
   * @param {Object} results - Analysis results
   * @returns {string} JSON formatted output
   */
  generateJSON(results) {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Generate HTML report
   * @param {Object} results - Analysis results
   * @returns {string} HTML formatted output
   */
  generateHTML(results) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JS-CSS-Linter Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .section { margin: 20px 0; }
    .issue { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 10px 0; border-radius: 4px; }
    .issue.error { background: #f8d7da; border-left-color: #dc3545; }
    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 10px 15px; margin: 10px 0; border-radius: 4px; }
    .location { color: #666; font-size: 12px; font-family: monospace; }
    .summary { background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .summary h3 { margin-top: 0; color: #0056b3; }
    .count { font-size: 24px; font-weight: bold; color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 JS-CSS-Linter Report</h1>
    
    <div class="section">
      <h2>🔍 JavaScript Analysis</h2>
      ${this.generateHTMLSection(
        results.javascript?.unusedVariables,
        "Unused Variables",
        "variable"
      )}
      ${this.generateHTMLSection(
        results.javascript?.unusedFunctions,
        "Unused Functions",
        "function"
      )}
    </div>
    
    <div class="section">
      <h2>🎨 CSS Analysis</h2>
      ${this.generateHTMLSection(
        results.css?.unusedSelectors,
        "Unused Selectors",
        "selector"
      )}
    </div>
    
    <div class="summary">
      <h3>📈 Summary</h3>
      <p>Unused Variables: <span class="count">${
        results.summary?.totalUnusedVariables || 0
      }</span></p>
      <p>Unused Functions: <span class="count">${
        results.summary?.totalUnusedFunctions || 0
      }</span></p>
      <p>Unused CSS Selectors: <span class="count">${
        results.summary?.totalUnusedCSSSelectors || 0
      }</span></p>
    </div>
  </div>
</body>
</html>`;
  }

  generateHTMLSection(items, title, type) {
    if (!items || items.length === 0) {
      return `<div class="success">✓ No unused ${type}s found</div>`;
    }

    return items
      .map((item) => {
        const name = item.name || item.selector;
        const loc = item.location;
        return `
        <div class="issue">
          <strong>${name}</strong>
          ${
            loc
              ? `<div class="location">${loc.file}:${loc.line}:${loc.column}</div>`
              : ""
          }
        </div>
      `;
      })
      .join("");
  }
}

module.exports = { Reporter };
