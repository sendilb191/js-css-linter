const fs = require("fs");
const path = require("path");

/**
 * File Utilities - Zero Dependencies
 * Provides glob-like file searching using only Node.js built-ins
 */

/**
 * Find files matching a pattern
 * @param {string} pattern - Glob-like pattern (e.g., "**\/*.js")
 * @param {Object} options - Search options
 * @param {string} options.cwd - Base directory
 * @param {string[]} options.ignore - Patterns to ignore
 * @returns {Promise<string[]>} Matching file paths
 */
async function findFiles(pattern, options = {}) {
  const { cwd = process.cwd(), ignore = [] } = options;

  const files = [];
  const extension = getExtensionFromPattern(pattern);

  await walkDirectory(cwd, files, extension, ignore);

  return files;
}

/**
 * Extract extension from glob pattern
 * @param {string} pattern - Glob pattern
 * @returns {string|null} File extension or null
 */
function getExtensionFromPattern(pattern) {
  const match = pattern.match(/\*\.(\w+)$/);
  return match ? `.${match[1]}` : null;
}

/**
 * Recursively walk directory and collect matching files
 * @param {string} dir - Directory to walk
 * @param {string[]} files - Array to collect files into
 * @param {string|null} extension - File extension to match
 * @param {string[]} ignore - Patterns to ignore
 */
async function walkDirectory(dir, files, extension, ignore) {
  const defaultIgnore = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".cache",
  ];

  const allIgnore = [...defaultIgnore, ...ignore];

  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (error) {
    // Directory doesn't exist or can't be read
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Check if should ignore
    if (allIgnore.some((ig) => entry.name === ig || fullPath.includes(ig))) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, files, extension, ignore);
    } else if (entry.isFile()) {
      // Check extension match
      if (!extension || entry.name.endsWith(extension)) {
        // Skip minified files
        if (!entry.name.includes(".min.")) {
          files.push(fullPath);
        }
      }
    }
  }
}

/**
 * Find files by extension in a directory
 * @param {string} dir - Directory to search
 * @param {string} ext - File extension (e.g., ".js")
 * @returns {Promise<string[]>} Matching file paths
 */
async function findFilesByExtension(dir, ext) {
  return findFiles(`**/*${ext}`, { cwd: dir });
}

module.exports = { findFiles, findFilesByExtension, walkDirectory };
