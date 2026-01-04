/**
 * Comment Utilities - Zero Dependencies
 * Helpers for handling comments in JavaScript and CSS code
 */

/**
 * Remove JavaScript comments from code
 * Handles single-line, multi-line, and preserves strings/template literals
 * @param {string} code - Source code
 * @returns {string} Code without comments
 */
function removeJSComments(code) {
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
 * Remove CSS comments from code
 * @param {string} code - CSS source code
 * @returns {string} Code without comments
 */
function removeCSSComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Preserve line breaks for accurate line numbers
    return match.replace(/[^\n]/g, " ");
  });
}

/**
 * Remove HTML comments from code
 * @param {string} code - HTML source code
 * @returns {string} Code without comments
 */
function removeHTMLComments(code) {
  return code.replace(/<!--[\s\S]*?-->/g, (match) => {
    // Preserve line breaks for accurate line numbers
    return match.replace(/[^\n]/g, " ");
  });
}

/**
 * Extract all comments from JavaScript code
 * @param {string} code - Source code
 * @returns {Array} Array of comment objects with type, content, and location
 */
function extractJSComments(code) {
  const comments = [];
  let i = 0;
  let line = 1;
  let column = 0;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;

  while (i < code.length) {
    // Track line numbers
    if (code[i] === "\n") {
      line++;
      column = 0;
    } else {
      column++;
    }

    // Handle string literals
    if (!inString && !inTemplate && (code[i] === '"' || code[i] === "'")) {
      inString = true;
      stringChar = code[i];
      i++;
      continue;
    }

    if (inString) {
      if (code[i] === "\\" && i + 1 < code.length) {
        i += 2;
        continue;
      }
      if (code[i] === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }

    // Handle template literals
    if (!inString && !inTemplate && code[i] === "`") {
      inTemplate = true;
      i++;
      continue;
    }

    if (inTemplate) {
      if (code[i] === "\\" && i + 1 < code.length) {
        i += 2;
        continue;
      }
      if (code[i] === "`") {
        inTemplate = false;
      }
      i++;
      continue;
    }

    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      const startLine = line;
      const startCol = column;
      let content = "";
      i += 2;
      while (i < code.length && code[i] !== "\n") {
        content += code[i];
        i++;
      }
      comments.push({
        type: "single",
        content: content.trim(),
        line: startLine,
        column: startCol,
      });
      continue;
    }

    // Multi-line comment
    if (code[i] === "/" && code[i + 1] === "*") {
      const startLine = line;
      const startCol = column;
      let content = "";
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        if (code[i] === "\n") {
          line++;
          column = 0;
        }
        content += code[i];
        i++;
      }
      i += 2; // Skip */
      comments.push({
        type: "multi",
        content: content.trim(),
        line: startLine,
        column: startCol,
        isJSDoc: content.trim().startsWith("*"),
      });
      continue;
    }

    i++;
  }

  return comments;
}

/**
 * Check if a line is a TODO/FIXME/HACK comment
 * @param {string} content - Comment content
 * @returns {Object|null} Tag info or null
 */
function extractCommentTags(content) {
  const tagPattern = /\b(TODO|FIXME|HACK|XXX|NOTE|BUG|OPTIMIZE)\b[:\s]*(.*)/i;
  const match = content.match(tagPattern);

  if (match) {
    return {
      tag: match[1].toUpperCase(),
      message: match[2].trim(),
    };
  }

  return null;
}

/**
 * Find all TODO/FIXME comments in code
 * @param {string} code - Source code
 * @param {string} filePath - File path for reporting
 * @returns {Array} Array of tagged comments
 */
function findTodoComments(code, filePath = "unknown") {
  const comments = extractJSComments(code);
  const todos = [];

  comments.forEach((comment) => {
    const tag = extractCommentTags(comment.content);
    if (tag) {
      todos.push({
        ...tag,
        file: filePath,
        line: comment.line,
        column: comment.column,
      });
    }
  });

  return todos;
}

module.exports = {
  removeJSComments,
  removeCSSComments,
  removeHTMLComments,
  extractJSComments,
  extractCommentTags,
  findTodoComments,
};
