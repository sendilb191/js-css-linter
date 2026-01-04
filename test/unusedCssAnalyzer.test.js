const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  extractUsedFromHTML,
  extractUsedFromJS,
} = require("../src/analyzers/unusedCssAnalyzer");

describe("Unused CSS Analyzer", () => {
  describe("extractUsedFromHTML", () => {
    it("should extract classes from class attribute", () => {
      const html = '<div class="container main-content"></div>';
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromHTML(html, usedClasses, usedIds);

      assert.ok(usedClasses.has("container"), "Should find container class");
      assert.ok(
        usedClasses.has("main-content"),
        "Should find main-content class"
      );
    });

    it("should extract IDs from id attribute", () => {
      const html = '<div id="header"></div><section id="main"></section>';
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromHTML(html, usedClasses, usedIds);

      assert.ok(usedIds.has("header"), "Should find header ID");
      assert.ok(usedIds.has("main"), "Should find main ID");
    });

    it("should handle single and double quotes", () => {
      const html = `<div class="double" id='single'></div>`;
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromHTML(html, usedClasses, usedIds);

      assert.ok(
        usedClasses.has("double"),
        "Should find class with double quotes"
      );
      assert.ok(usedIds.has("single"), "Should find ID with single quotes");
    });

    it("should handle JSX className", () => {
      const html = '<div className="react-class"></div>';
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromHTML(html, usedClasses, usedIds);

      assert.ok(usedClasses.has("react-class"), "Should find JSX className");
    });
  });

  describe("extractUsedFromJS", () => {
    it("should extract from classList methods", () => {
      const js = `
        element.classList.add('active');
        element.classList.remove('hidden');
        element.classList.toggle('visible');
      `;
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromJS(js, usedClasses, usedIds);

      assert.ok(
        usedClasses.has("active"),
        "Should find active from classList.add"
      );
      assert.ok(
        usedClasses.has("hidden"),
        "Should find hidden from classList.remove"
      );
      assert.ok(
        usedClasses.has("visible"),
        "Should find visible from classList.toggle"
      );
    });

    it("should extract from getElementById", () => {
      const js = `document.getElementById('main-container');`;
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromJS(js, usedClasses, usedIds);

      assert.ok(
        usedIds.has("main-container"),
        "Should find ID from getElementById"
      );
    });

    it("should extract from querySelector", () => {
      const js = `
        document.querySelector('.button');
        document.querySelector('#header');
        document.querySelectorAll('.item');
      `;
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromJS(js, usedClasses, usedIds);

      assert.ok(
        usedClasses.has("button"),
        "Should find class from querySelector"
      );
      assert.ok(
        usedClasses.has("item"),
        "Should find class from querySelectorAll"
      );
      assert.ok(usedIds.has("header"), "Should find ID from querySelector");
    });

    it("should extract from jQuery selectors", () => {
      const js = `
        $('.container');
        $('#main');
        $('.card .title');
      `;
      const usedClasses = new Set();
      const usedIds = new Set();

      extractUsedFromJS(js, usedClasses, usedIds);

      assert.ok(usedClasses.has("container"), "Should find jQuery class");
      assert.ok(usedClasses.has("card"), "Should find jQuery nested class");
      assert.ok(usedClasses.has("title"), "Should find jQuery nested class");
      assert.ok(usedIds.has("main"), "Should find jQuery ID");
    });
  });
});
