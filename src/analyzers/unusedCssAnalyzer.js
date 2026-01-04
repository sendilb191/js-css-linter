const fs = require("fs");
const { analyzeCSSCode } = require("./cssAnalyzer");

/**
 * Unused CSS Analyzer - Zero Dependencies
 * Finds CSS selectors not used in HTML or JS files
 */

/**
 * Find unused CSS selectors
 * @param {Object} options - Analysis options
 * @param {string[]} options.cssFiles - CSS file paths
 * @param {string[]} options.htmlFiles - HTML file paths to check against
 * @param {string[]} options.jsFiles - JS file paths to check against
 * @returns {Promise<Object>} Unused CSS analysis results
 */
async function findUnusedCSS(options) {
  const { cssFiles, htmlFiles = [], jsFiles = [] } = options;

  // Collect all CSS selectors
  const allSelectors = [];
  const allClasses = new Set();
  const allIds = new Set();

  for (const cssFile of cssFiles) {
    try {
      const code = await fs.promises.readFile(cssFile, "utf-8");
      const analysis = analyzeCSSCode(code, cssFile);
      allSelectors.push(...analysis.selectors);
      analysis.classes.forEach((c) => allClasses.add(c));
      analysis.ids.forEach((id) => allIds.add(id));
    } catch (error) {
      console.error(`Error reading CSS file ${cssFile}:`, error.message);
    }
  }

  // Collect all used classes and IDs from HTML files
  const usedClasses = new Set();
  const usedIds = new Set();

  for (const htmlFile of htmlFiles) {
    try {
      const content = await fs.promises.readFile(htmlFile, "utf-8");
      extractUsedFromHTML(content, usedClasses, usedIds);
    } catch (error) {
      console.error(`Error reading HTML file ${htmlFile}:`, error.message);
    }
  }

  // Collect classes and IDs used in JavaScript files
  for (const jsFile of jsFiles) {
    try {
      const content = await fs.promises.readFile(jsFile, "utf-8");
      extractUsedFromJS(content, usedClasses, usedIds);
    } catch (error) {
      console.error(`Error reading JS file ${jsFile}:`, error.message);
    }
  }

  // Find unused classes
  const unusedClasses = [];
  allClasses.forEach((className) => {
    if (!usedClasses.has(className)) {
      // Find the selector info for this class
      const selectorInfo = allSelectors.find((s) =>
        s.selector.includes(`.${className}`)
      );
      unusedClasses.push({
        name: className,
        type: "class",
        location: selectorInfo?.location,
      });
    }
  });

  // Find unused IDs
  const unusedIds = [];
  allIds.forEach((id) => {
    if (!usedIds.has(id)) {
      const selectorInfo = allSelectors.find((s) =>
        s.selector.includes(`#${id}`)
      );
      unusedIds.push({
        name: id,
        type: "id",
        location: selectorInfo?.location,
      });
    }
  });

  // Combine unused selectors
  const unusedSelectors = [...unusedClasses, ...unusedIds];

  return {
    unusedSelectors,
    unusedClasses,
    unusedIds,
    totalClasses: allClasses.size,
    totalIds: allIds.size,
    usedClasses: usedClasses.size,
    usedIds: usedIds.size,
  };
}

/**
 * Extract used classes and IDs from HTML content
 * @param {string} html - HTML content
 * @param {Set} usedClasses - Set to add found classes to
 * @param {Set} usedIds - Set to add found IDs to
 */
function extractUsedFromHTML(html, usedClasses, usedIds) {
  // Extract classes from class="..." attributes
  const classRegex = /class\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = classRegex.exec(html)) !== null) {
    const classes = match[1].split(/\s+/).filter((c) => c.trim());
    classes.forEach((c) => usedClasses.add(c));
  }

  // Extract IDs from id="..." attributes
  const idRegex = /id\s*=\s*["']([^"']+)["']/gi;
  while ((match = idRegex.exec(html)) !== null) {
    usedIds.add(match[1].trim());
  }

  // Extract classes from className="..." (JSX)
  const jsxClassRegex = /className\s*=\s*["']([^"']+)["']/gi;
  while ((match = jsxClassRegex.exec(html)) !== null) {
    const classes = match[1].split(/\s+/).filter((c) => c.trim());
    classes.forEach((c) => usedClasses.add(c));
  }
}

/**
 * Extract used classes and IDs from JavaScript content
 * @param {string} js - JavaScript content
 * @param {Set} usedClasses - Set to add found classes to
 * @param {Set} usedIds - Set to add found IDs to
 */
function extractUsedFromJS(js, usedClasses, usedIds) {
  let match;

  // Look for classList.add(), classList.remove(), classList.toggle()
  const classListRegex =
    /classList\.(add|remove|toggle|contains)\s*\(\s*["']([^"']+)["']/gi;
  while ((match = classListRegex.exec(js)) !== null) {
    match[2].split(/\s+/).forEach((c) => usedClasses.add(c.trim()));
  }

  // Look for className = "..."
  const classNameRegex = /className\s*=\s*["']([^"']+)["']/gi;
  while ((match = classNameRegex.exec(js)) !== null) {
    match[1].split(/\s+/).forEach((c) => usedClasses.add(c.trim()));
  }

  // Look for document.getElementById("...")
  const getByIdRegex = /getElementById\s*\(\s*["']([^"']+)["']/gi;
  while ((match = getByIdRegex.exec(js)) !== null) {
    usedIds.add(match[1].trim());
  }

  // Look for document.querySelector("#...") and document.querySelector("....")
  const querySelectorRegex = /querySelector(?:All)?\s*\(\s*["']([^"']+)["']/gi;
  while ((match = querySelectorRegex.exec(js)) !== null) {
    const selector = match[1];

    // Extract classes from selector
    const classMatches = selector.match(/\.([a-zA-Z_-][\w-]*)/g);
    if (classMatches) {
      classMatches.forEach((c) => usedClasses.add(c.substring(1)));
    }

    // Extract IDs from selector
    const idMatches = selector.match(/#([a-zA-Z_-][\w-]*)/g);
    if (idMatches) {
      idMatches.forEach((id) => usedIds.add(id.substring(1)));
    }
  }

  // Look for jQuery selectors $(".class") or $("#id")
  const jQueryRegex = /\$\s*\(\s*["']([^"']+)["']/gi;
  while ((match = jQueryRegex.exec(js)) !== null) {
    const selector = match[1];

    const classMatches = selector.match(/\.([a-zA-Z_-][\w-]*)/g);
    if (classMatches) {
      classMatches.forEach((c) => usedClasses.add(c.substring(1)));
    }

    const idMatches = selector.match(/#([a-zA-Z_-][\w-]*)/g);
    if (idMatches) {
      idMatches.forEach((id) => usedIds.add(id.substring(1)));
    }
  }
}

module.exports = { findUnusedCSS, extractUsedFromHTML, extractUsedFromJS };
