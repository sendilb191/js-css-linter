const { describe, it } = require("node:test");
const assert = require("node:assert");
const { analyzeJavaScriptCode } = require("../src/analyzers/jsAnalyzer");

describe("JavaScript Analyzer", () => {
  it("should detect unused variables", () => {
    const code = `
      const usedVar = 'hello';
      const unusedVar = 'world';
      console.log(usedVar);
    `;

    const result = analyzeJavaScriptCode(code, "test.js");

    const unusedNames = result.unusedVariables.map((v) => v.name);
    assert.ok(unusedNames.includes("unusedVar"), "Should detect unusedVar");
    assert.ok(!unusedNames.includes("usedVar"), "Should not include usedVar");
  });

  it("should detect unused functions", () => {
    const code = `
      function usedFunction() {
        return 'used';
      }
      
      function unusedFunction() {
        return 'unused';
      }
      
      usedFunction();
    `;

    const result = analyzeJavaScriptCode(code, "test.js");

    const unusedNames = result.unusedFunctions.map((f) => f.name);
    assert.ok(
      unusedNames.includes("unusedFunction"),
      "Should detect unusedFunction"
    );
  });

  it("should ignore variables starting with underscore", () => {
    const code = `
      const _ignoredVar = 'ignored';
      const normalUnused = 'unused';
    `;

    const result = analyzeJavaScriptCode(code, "test.js");

    const unusedNames = result.unusedVariables.map((v) => v.name);
    assert.ok(
      !unusedNames.includes("_ignoredVar"),
      "Should ignore _ignoredVar"
    );
    assert.ok(
      unusedNames.includes("normalUnused"),
      "Should detect normalUnused"
    );
  });

  it("should handle destructuring", () => {
    const code = `
      const data = getData();
      const { name, age } = data;
      console.log(name);
    `;

    const result = analyzeJavaScriptCode(code, "test.js");

    const unusedNames = result.unusedVariables.map((v) => v.name);
    assert.ok(
      unusedNames.includes("age"),
      "Should detect unused 'age' from destructuring"
    );
    assert.ok(!unusedNames.includes("name"), "Should not include used 'name'");
  });

  it("should return location information", () => {
    const code = `const unusedVar = 'test';`;

    const result = analyzeJavaScriptCode(code, "test.js");

    assert.ok(result.unusedVariables[0].location, "Should have location");
    assert.strictEqual(result.unusedVariables[0].location.file, "test.js");
    assert.ok(typeof result.unusedVariables[0].location.line === "number");
  });

  it("should ignore comments", () => {
    const code = `
      // const commentedVar = 'test';
      /* const blockCommentVar = 'test'; */
      const realUnused = 'real';
    `;

    const result = analyzeJavaScriptCode(code, "test.js");

    const unusedNames = result.unusedVariables.map((v) => v.name);
    assert.ok(
      !unusedNames.includes("commentedVar"),
      "Should not detect commented var"
    );
    assert.ok(
      !unusedNames.includes("blockCommentVar"),
      "Should not detect block comment var"
    );
    assert.ok(unusedNames.includes("realUnused"), "Should detect realUnused");
  });
});
