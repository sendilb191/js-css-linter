const fs = require("fs");
const path = require("path");

/**
 * File Utilities - Zero Dependencies
 * Helpers for file operations and pattern matching
 */

/**
 * Default directories to ignore
 */
const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".cache",
  ".nuxt",
  "out",
  "vendor",
  "__pycache__",
  ".vscode",
  ".idea",
];

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
 * Synchronous version of findFiles
 * @param {string} pattern - Glob-like pattern
 * @param {Object} options - Search options
 * @returns {string[]} Matching file paths
 */
function findFilesSync(pattern, options = {}) {
  const { cwd = process.cwd(), ignore = [] } = options;

  const files = [];
  const extension = getExtensionFromPattern(pattern);

  walkDirectorySync(cwd, files, extension, ignore);

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
  const allIgnore = [...DEFAULT_IGNORE, ...ignore];

  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (error) {
    return; // Directory doesn't exist or can't be read
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Check if should ignore
    if (shouldIgnore(entry.name, fullPath, allIgnore)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, files, extension, ignore);
    } else if (entry.isFile()) {
      if (matchesExtension(entry.name, extension)) {
        files.push(fullPath);
      }
    }
  }
}

/**
 * Synchronous directory walker
 */
function walkDirectorySync(dir, files, extension, ignore) {
  const allIgnore = [...DEFAULT_IGNORE, ...ignore];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(entry.name, fullPath, allIgnore)) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDirectorySync(fullPath, files, extension, ignore);
    } else if (entry.isFile()) {
      if (matchesExtension(entry.name, extension)) {
        files.push(fullPath);
      }
    }
  }
}

/**
 * Check if a path should be ignored
 * @param {string} name - File or directory name
 * @param {string} fullPath - Full path
 * @param {string[]} ignoreList - List of patterns to ignore
 * @returns {boolean} True if should ignore
 */
function shouldIgnore(name, fullPath, ignoreList) {
  // Check direct name match
  if (ignoreList.includes(name)) {
    return true;
  }

  // Check if path contains ignored directory
  for (const pattern of ignoreList) {
    if (
      fullPath.includes(path.sep + pattern + path.sep) ||
      fullPath.includes(path.sep + pattern)
    ) {
      return true;
    }
  }

  // Skip hidden files/directories (except current dir)
  if (name.startsWith(".") && name !== ".") {
    return true;
  }

  return false;
}

/**
 * Check if file matches extension
 * @param {string} filename - File name
 * @param {string|null} extension - Extension to match
 * @returns {boolean} True if matches
 */
function matchesExtension(filename, extension) {
  if (!extension) return true;

  // Skip minified files
  if (filename.includes(".min.")) {
    return false;
  }

  return filename.endsWith(extension);
}

/**
 * Find files by multiple extensions
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - Array of extensions (e.g., [".js", ".jsx"])
 * @param {Object} options - Options
 * @returns {Promise<string[]>} Matching file paths
 */
async function findFilesByExtensions(dir, extensions, options = {}) {
  const allFiles = [];

  for (const ext of extensions) {
    const files = await findFiles(`**/*${ext}`, { cwd: dir, ...options });
    allFiles.push(...files);
  }

  return allFiles;
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

/**
 * Get file info
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} File info
 */
async function getFileInfo(filePath) {
  const stats = await fs.promises.stat(filePath);
  const ext = path.extname(filePath);

  return {
    path: filePath,
    name: path.basename(filePath),
    extension: ext,
    size: stats.size,
    modified: stats.mtime,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
  };
}

/**
 * Read file contents
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} File contents
 */
async function readFileContents(filePath) {
  return fs.promises.readFile(filePath, "utf-8");
}

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} True if exists
 */
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get relative path from base directory
 * @param {string} filePath - Full file path
 * @param {string} baseDir - Base directory
 * @returns {string} Relative path
 */
function getRelativePath(filePath, baseDir) {
  return path.relative(baseDir, filePath);
}

/**
 * Group files by extension
 * @param {string[]} files - Array of file paths
 * @returns {Object} Files grouped by extension
 */
function groupFilesByExtension(files) {
  const groups = {};

  files.forEach((file) => {
    const ext = path.extname(file) || "no-extension";
    if (!groups[ext]) {
      groups[ext] = [];
    }
    groups[ext].push(file);
  });

  return groups;
}

/**
 * Filter files by size
 * @param {string[]} files - Array of file paths
 * @param {Object} options - Size options
 * @param {number} options.minSize - Minimum size in bytes
 * @param {number} options.maxSize - Maximum size in bytes
 * @returns {Promise<string[]>} Filtered files
 */
async function filterFilesBySize(files, options = {}) {
  const { minSize = 0, maxSize = Infinity } = options;
  const filtered = [];

  for (const file of files) {
    const stats = await fs.promises.stat(file);
    if (stats.size >= minSize && stats.size <= maxSize) {
      filtered.push(file);
    }
  }

  return filtered;
}

module.exports = {
  findFiles,
  findFilesSync,
  findFilesByExtension,
  findFilesByExtensions,
  walkDirectory,
  walkDirectorySync,
  getFileInfo,
  readFileContents,
  fileExists,
  getRelativePath,
  groupFilesByExtension,
  filterFilesBySize,
  shouldIgnore,
  matchesExtension,
  DEFAULT_IGNORE,
};
