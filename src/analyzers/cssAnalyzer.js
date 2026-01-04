const fs = require("fs");

/**
 * CSS Analyzer - Zero Dependencies
 * Uses regex-based parsing to extract CSS selectors
 */

/**
 * Parse CSS file and extract all selectors
 * @param {string} filePath - Path to CSS file
 * @returns {Promise<Object>} CSS analysis results
 */
async function analyzeCSS(filePath) {
  const code = await fs.promises.readFile(filePath, "utf-8");
  return analyzeCSSCode(code, filePath);
}

/**
 * Analyze CSS code string
 * @param {string} code - CSS code
 * @param {string} filePath - Optional file path for reporting
 * @returns {Object} Analysis results
 */
function analyzeCSSCode(code, filePath = "unknown") {
  const selectors = [];
  const classes = new Set();
  const ids = new Set();
  const elements = new Set();

  // Remove CSS comments
  const codeWithoutComments = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Preserve line breaks for accurate line numbers
    return match.replace(/[^\n]/g, " ");
  });

  // Match CSS rules: selector { ... }
  // This regex matches selectors followed by braces
  const ruleRegex = /([^{}]+)\{[^{}]*\}/g;
  let match;

  while ((match = ruleRegex.exec(codeWithoutComments)) !== null) {
    const selectorBlock = match[1].trim();

    // Skip @-rules like @media, @keyframes, etc.
    if (selectorBlock.startsWith("@")) continue;

    // Split multiple selectors (comma-separated)
    const selectorList = selectorBlock.split(",").map((s) => s.trim());

    selectorList.forEach((selector) => {
      if (!selector) return;

      const location = {
        file: filePath,
        line: getLineNumber(codeWithoutComments, match.index),
        column: 0,
      };

      selectors.push({ selector, location });

      // Extract classes (.class-name)
      const classMatches = selector.match(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g);
      if (classMatches) {
        classMatches.forEach((c) => classes.add(c.substring(1)));
      }

      // Extract IDs (#id-name)
      const idMatches = selector.match(/#([a-zA-Z_-][a-zA-Z0-9_-]*)/g);
      if (idMatches) {
        idMatches.forEach((id) => ids.add(id.substring(1)));
      }

      // Extract element selectors
      const elemMatches = selector.match(
        /(?:^|[\s>+~])([a-zA-Z][a-zA-Z0-9]*)/g
      );
      if (elemMatches) {
        elemMatches.forEach((e) => {
          const elem = e.trim().replace(/^[>+~]\s*/, "");
          if (
            elem &&
            ![
              "not",
              "nth",
              "first",
              "last",
              "only",
              "hover",
              "focus",
              "active",
              "visited",
              "before",
              "after",
            ].includes(elem)
          ) {
            elements.add(elem);
          }
        });
      }
    });
  }

  return {
    selectors,
    classes: Array.from(classes),
    ids: Array.from(ids),
    elements: Array.from(elements),
    filePath,
  };
}

/**
 * Get line number for a position in code
 * @param {string} code - Source code
 * @param {number} index - Character index
 * @returns {number} Line number (1-based)
 */
function getLineNumber(code, index) {
  return code.substring(0, index).split("\n").length;
}

/**
 * Find duplicate selectors in CSS
 * @param {string} code - CSS code
 * @param {string} filePath - File path for reporting
 * @returns {Array} Duplicate selectors
 */
function findDuplicateSelectors(code, filePath = "unknown") {
  const analysis = analyzeCSSCode(code, filePath);
  const selectorCounts = new Map();

  analysis.selectors.forEach(({ selector, location }) => {
    if (!selectorCounts.has(selector)) {
      selectorCounts.set(selector, []);
    }
    selectorCounts.get(selector).push(location);
  });

  const duplicates = [];
  selectorCounts.forEach((locations, selector) => {
    if (locations.length > 1) {
      duplicates.push({
        selector,
        locations,
        count: locations.length,
      });
    }
  });

  return duplicates;
}

module.exports = { analyzeCSS, analyzeCSSCode, findDuplicateSelectors };
