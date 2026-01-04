const fs = require("fs");

/**
 * JavaScript Analyzer - Zero Dependencies
 * Uses regex-based parsing to detect unused variables and functions
 */

/**
 * Analyze JavaScript file for unused variables and functions
 * @param {string} filePath - Path to JavaScript file
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeJavaScript(filePath) {
  const code = await fs.promises.readFile(filePath, "utf-8");
  return analyzeJavaScriptCode(code, filePath);
}

/**
 * Analyze JavaScript code string
 * @param {string} code - JavaScript code
 * @param {string} filePath - Optional file path for reporting
 * @returns {Object} Analysis results
 */
function analyzeJavaScriptCode(code, filePath = "unknown") {
  // Remove comments to avoid false positives
  const codeWithoutComments = removeComments(code);

  // Extract all declarations
  const variables = extractVariableDeclarations(codeWithoutComments, filePath);
  const functions = extractFunctionDeclarations(codeWithoutComments, filePath);

  // Find unused items
  const unusedVariables = findUnusedIdentifiers(variables, codeWithoutComments);
  const unusedFunctions = findUnusedIdentifiers(functions, codeWithoutComments);

  return {
    unusedVariables,
    unusedFunctions,
    totalVariables: variables.length,
    totalFunctions: functions.length,
  };
}

/**
 * Remove single-line and multi-line comments from code
 * @param {string} code - Source code
 * @returns {string} Code without comments
 */
function removeComments(code) {
  let result = "";
  let i = 0;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;

  while (i < code.length) {
    // Handle string literals
    if (!inString && !inTemplate && (code[i] === '"' || code[i] === "'")) {
      inString = true;
      stringChar = code[i];
      result += code[i];
      i++;
      continue;
    }

    if (inString) {
      if (code[i] === "\\" && i + 1 < code.length) {
        result += code[i] + code[i + 1];
        i += 2;
        continue;
      }
      if (code[i] === stringChar) {
        inString = false;
      }
      result += code[i];
      i++;
      continue;
    }

    // Handle template literals
    if (!inString && !inTemplate && code[i] === "`") {
      inTemplate = true;
      result += code[i];
      i++;
      continue;
    }

    if (inTemplate) {
      if (code[i] === "\\" && i + 1 < code.length) {
        result += code[i] + code[i + 1];
        i += 2;
        continue;
      }
      if (code[i] === "`") {
        inTemplate = false;
      }
      result += code[i];
      i++;
      continue;
    }

    // Handle single-line comments
    if (code[i] === "/" && code[i + 1] === "/") {
      while (i < code.length && code[i] !== "\n") {
        i++;
      }
      continue;
    }

    // Handle multi-line comments
    if (code[i] === "/" && code[i + 1] === "*") {
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        if (code[i] === "\n") {
          result += "\n"; // Preserve line numbers
        }
        i++;
      }
      i += 2; // Skip */
      continue;
    }

    result += code[i];
    i++;
  }

  return result;
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
 * Get column number for a position in code
 * @param {string} code - Source code
 * @param {number} index - Character index
 * @returns {number} Column number (0-based)
 */
function getColumnNumber(code, index) {
  const lines = code.substring(0, index).split("\n");
  return lines[lines.length - 1].length;
}

/**
 * Extract variable declarations (const, let, var)
 * @param {string} code - Source code
 * @param {string} filePath - File path for reporting
 * @returns {Array} Variable declarations
 */
function extractVariableDeclarations(code, filePath) {
  const declarations = [];

  // Match: const/let/var name = ...
  const simpleVarRegex = /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  let match;

  while ((match = simpleVarRegex.exec(code)) !== null) {
    const name = match[2];
    if (!name.startsWith("_")) {
      declarations.push({
        name,
        location: {
          file: filePath,
          line: getLineNumber(code, match.index),
          column: getColumnNumber(code, match.index),
        },
        isParameter: false,
      });
    }
  }

  // Match destructuring: const { a, b } = ... or const [a, b] = ...
  const destructureObjRegex = /\b(const|let|var)\s+\{([^}]+)\}\s*=/g;
  const destructureArrRegex = /\b(const|let|var)\s+\[([^\]]+)\]\s*=/g;

  // Object destructuring
  while ((match = destructureObjRegex.exec(code)) !== null) {
    const content = match[2];
    // Extract identifiers from destructuring pattern
    const identifiers = content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];

    identifiers.forEach((name) => {
      // Skip common keywords that might appear
      if (!["as", "default", "from"].includes(name) && !name.startsWith("_")) {
        declarations.push({
          name,
          location: {
            file: filePath,
            line: getLineNumber(code, match.index),
            column: getColumnNumber(code, match.index),
          },
          isParameter: false,
        });
      }
    });
  }

  // Array destructuring
  while ((match = destructureArrRegex.exec(code)) !== null) {
    const content = match[2];
    const identifiers = content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];

    identifiers.forEach((name) => {
      if (!name.startsWith("_")) {
        declarations.push({
          name,
          location: {
            file: filePath,
            line: getLineNumber(code, match.index),
            column: getColumnNumber(code, match.index),
          },
          isParameter: false,
        });
      }
    });
  }

  return declarations;
}

/**
 * Extract function declarations
 * @param {string} code - Source code
 * @param {string} filePath - File path for reporting
 * @returns {Array} Function declarations
 */
function extractFunctionDeclarations(code, filePath) {
  const declarations = [];

  // Match: function name(...) { or async function name(...)
  const funcRegex =
    /\b(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let match;

  while ((match = funcRegex.exec(code)) !== null) {
    const name = match[1];
    if (!name.startsWith("_")) {
      declarations.push({
        name,
        location: {
          file: filePath,
          line: getLineNumber(code, match.index),
          column: getColumnNumber(code, match.index),
        },
      });
    }
  }

  return declarations;
}

/**
 * Find unused identifiers by counting occurrences
 * @param {Array} declarations - List of declarations
 * @param {string} code - Code to search in
 * @returns {Array} Unused identifiers
 */
function findUnusedIdentifiers(declarations, code) {
  const unused = [];

  declarations.forEach((decl) => {
    const { name } = decl;
    // Count occurrences as whole word
    const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, "g");
    const matches = code.match(regex) || [];

    // If only 1 occurrence, it's just the declaration (unused)
    if (matches.length <= 1) {
      unused.push(decl);
    }
  });

  // Remove duplicates by name
  const seen = new Set();
  return unused.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { analyzeJavaScript, analyzeJavaScriptCode };
