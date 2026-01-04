const { describe, it } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const {
  shouldIgnore,
  matchesExtension,
  groupFilesByExtension,
  getRelativePath,
  DEFAULT_IGNORE,
} = require("../src/utils/fileUtils");

describe("File Utilities", () => {
  describe("shouldIgnore", () => {
    it("should ignore node_modules", () => {
      const result = shouldIgnore(
        "node_modules",
        "/project/node_modules",
        DEFAULT_IGNORE
      );
      assert.strictEqual(result, true);
    });

    it("should ignore .git", () => {
      const result = shouldIgnore(".git", "/project/.git", DEFAULT_IGNORE);
      assert.strictEqual(result, true);
    });

    it("should ignore hidden files", () => {
      const result = shouldIgnore(".hidden", "/project/.hidden", []);
      assert.strictEqual(result, true);
    });

    it("should not ignore regular files", () => {
      const result = shouldIgnore(
        "index.js",
        "/project/src/index.js",
        DEFAULT_IGNORE
      );
      assert.strictEqual(result, false);
    });

    it("should ignore paths containing ignored directories", () => {
      const fullPath = path.join(
        "/project",
        "node_modules",
        "package",
        "index.js"
      );
      const result = shouldIgnore("index.js", fullPath, DEFAULT_IGNORE);
      assert.strictEqual(result, true);
    });
  });

  describe("matchesExtension", () => {
    it("should match correct extension", () => {
      assert.strictEqual(matchesExtension("file.js", ".js"), true);
      assert.strictEqual(matchesExtension("file.css", ".css"), true);
    });

    it("should not match incorrect extension", () => {
      assert.strictEqual(matchesExtension("file.js", ".css"), false);
    });

    it("should skip minified files", () => {
      assert.strictEqual(matchesExtension("file.min.js", ".js"), false);
      assert.strictEqual(matchesExtension("bundle.min.css", ".css"), false);
    });

    it("should match all files when extension is null", () => {
      assert.strictEqual(matchesExtension("file.js", null), true);
      assert.strictEqual(matchesExtension("file.anything", null), true);
    });
  });

  describe("groupFilesByExtension", () => {
    it("should group files by extension", () => {
      const files = [
        "/src/index.js",
        "/src/utils.js",
        "/styles/main.css",
        "/styles/reset.css",
        "/index.html",
      ];

      const groups = groupFilesByExtension(files);

      assert.strictEqual(groups[".js"].length, 2);
      assert.strictEqual(groups[".css"].length, 2);
      assert.strictEqual(groups[".html"].length, 1);
    });

    it("should handle files without extension", () => {
      const files = ["Makefile", "Dockerfile"];
      const groups = groupFilesByExtension(files);

      assert.strictEqual(groups["no-extension"].length, 2);
    });
  });

  describe("getRelativePath", () => {
    it("should return relative path", () => {
      const filePath = path.join("/project", "src", "index.js");
      const baseDir = "/project";
      const result = getRelativePath(filePath, baseDir);

      assert.strictEqual(result, path.join("src", "index.js"));
    });
  });

  describe("DEFAULT_IGNORE", () => {
    it("should contain common directories to ignore", () => {
      assert.ok(DEFAULT_IGNORE.includes("node_modules"));
      assert.ok(DEFAULT_IGNORE.includes(".git"));
      assert.ok(DEFAULT_IGNORE.includes("dist"));
      assert.ok(DEFAULT_IGNORE.includes("build"));
      assert.ok(DEFAULT_IGNORE.includes("coverage"));
    });
  });
});
