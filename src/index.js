const {
  analyzeJavaScript,
  analyzeJavaScriptCode,
} = require("./analyzers/jsAnalyzer");
const { analyzeCSS, analyzeCSSCode } = require("./analyzers/cssAnalyzer");
const { findUnusedCSS } = require("./analyzers/unusedCssAnalyzer");
const { Reporter } = require("./reporter");
const { findFiles } = require("./utils/fileUtils");

/**
 * JS-CSS-Linter - Zero Dependencies
 * A static analysis tool to detect unused code
 */
class JsCssLinter {
  constructor(options = {}) {
    this.options = {
      ignorePatterns: options.ignorePatterns || [],
      reportFormat: options.reportFormat || "console",
      ...options,
    };
    this.reporter = new Reporter(this.options.reportFormat);
  }

  /**
   * Analyze JavaScript files for unused variables and functions
   * @param {string|string[]} files - File path(s)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeJS(files) {
    const fileList = Array.isArray(files) ? files : [files];
    const results = {
      unusedVariables: [],
      unusedFunctions: [],
      files: [],
    };

    for (const file of fileList) {
      try {
        const analysis = await analyzeJavaScript(file);
        results.unusedVariables.push(...analysis.unusedVariables);
        results.unusedFunctions.push(...analysis.unusedFunctions);
        results.files.push(file);
      } catch (error) {
        console.error(`Error analyzing ${file}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Analyze CSS files for unused selectors
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeUnusedCSS(options) {
    const { cssFiles, htmlFiles = [], jsFiles = [] } = options;
    return await findUnusedCSS({
      cssFiles: Array.isArray(cssFiles) ? cssFiles : [cssFiles],
      htmlFiles: Array.isArray(htmlFiles) ? htmlFiles : [htmlFiles],
      jsFiles: Array.isArray(jsFiles) ? jsFiles : [jsFiles],
    });
  }

  /**
   * Run full analysis on a project
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Complete analysis results
   */
  async analyze(options = {}) {
    const { jsFiles = [], cssFiles = [], htmlFiles = [] } = options;

    const results = {
      javascript: { unusedVariables: [], unusedFunctions: [] },
      css: { unusedSelectors: [] },
      summary: {},
    };

    // Analyze JavaScript
    if (jsFiles.length > 0) {
      results.javascript = await this.analyzeJS(jsFiles);
    }

    // Analyze CSS
    if (cssFiles.length > 0) {
      results.css = await this.analyzeUnusedCSS({
        cssFiles,
        htmlFiles,
        jsFiles,
      });
    }

    // Generate summary
    results.summary = {
      totalUnusedVariables: results.javascript.unusedVariables.length,
      totalUnusedFunctions: results.javascript.unusedFunctions.length,
      totalUnusedCSSSelectors: results.css.unusedSelectors?.length || 0,
    };

    return results;
  }

  /**
   * Generate a report from analysis results
   * @param {Object} results - Analysis results
   * @returns {string} Formatted report
   */
  report(results) {
    return this.reporter.generate(results);
  }
}

module.exports = {
  JsCssLinter,
  analyzeJavaScript,
  analyzeJavaScriptCode,
  analyzeCSS,
  analyzeCSSCode,
  findUnusedCSS,
  findFiles,
};
