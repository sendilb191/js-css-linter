const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  analyzeCSSCode,
  findDuplicateSelectors,
} = require("../src/analyzers/cssAnalyzer");

describe("CSS Analyzer", () => {
  it("should extract class selectors", () => {
    const css = `
      .button { color: red; }
      .container { margin: 0; }
    `;

    const result = analyzeCSSCode(css, "test.css");

    assert.ok(result.classes.includes("button"), "Should find .button class");
    assert.ok(
      result.classes.includes("container"),
      "Should find .container class"
    );
  });

  it("should extract ID selectors", () => {
    const css = `
      #header { background: blue; }
      #footer { padding: 20px; }
    `;

    const result = analyzeCSSCode(css, "test.css");

    assert.ok(result.ids.includes("header"), "Should find #header ID");
    assert.ok(result.ids.includes("footer"), "Should find #footer ID");
  });

  it("should extract element selectors", () => {
    const css = `
      div { display: block; }
      span { display: inline; }
    `;

    const result = analyzeCSSCode(css, "test.css");

    assert.ok(result.elements.includes("div"), "Should find div element");
    assert.ok(result.elements.includes("span"), "Should find span element");
  });

  it("should handle complex selectors", () => {
    const css = `
      .container .inner { padding: 10px; }
      #main .button:hover { color: blue; }
    `;

    const result = analyzeCSSCode(css, "test.css");

    assert.ok(result.classes.includes("container"), "Should find .container");
    assert.ok(result.classes.includes("inner"), "Should find .inner");
    assert.ok(result.classes.includes("button"), "Should find .button");
    assert.ok(result.ids.includes("main"), "Should find #main");
  });

  it("should find duplicate selectors", () => {
    const css = `
      .button { color: red; }
      .container { margin: 0; }
      .button { background: blue; }
    `;

    const duplicates = findDuplicateSelectors(css, "test.css");

    assert.strictEqual(duplicates.length, 1, "Should find one duplicate");
    assert.strictEqual(
      duplicates[0].selector,
      ".button",
      "Duplicate should be .button"
    );
    assert.strictEqual(duplicates[0].count, 2, "Should have count of 2");
  });

  it("should return location information", () => {
    const css = `.test { color: red; }`;

    const result = analyzeCSSCode(css, "test.css");

    assert.ok(result.selectors[0].location, "Should have location");
    assert.strictEqual(result.selectors[0].location.file, "test.css");
  });

  it("should handle multiple selectors on same rule", () => {
    const css = `.btn, .button, #submit { cursor: pointer; }`;

    const result = analyzeCSSCode(css, "test.css");

    assert.ok(result.classes.includes("btn"), "Should find .btn");
    assert.ok(result.classes.includes("button"), "Should find .button");
    assert.ok(result.ids.includes("submit"), "Should find #submit");
  });
});
