const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  removeJSComments,
  removeCSSComments,
  removeHTMLComments,
  extractJSComments,
  extractCommentTags,
  findTodoComments,
} = require("../src/utils/commentUtils");

describe("Comment Utilities", () => {
  describe("removeJSComments", () => {
    it("should remove single-line comments", () => {
      const code = `const x = 1; // this is a comment
const y = 2;`;
      const result = removeJSComments(code);

      assert.ok(!result.includes("this is a comment"));
      assert.ok(result.includes("const x = 1;"));
      assert.ok(result.includes("const y = 2;"));
    });

    it("should remove multi-line comments", () => {
      const code = `const x = 1;
/* this is a
   multi-line comment */
const y = 2;`;
      const result = removeJSComments(code);

      assert.ok(!result.includes("multi-line comment"));
      assert.ok(result.includes("const x = 1;"));
      assert.ok(result.includes("const y = 2;"));
    });

    it("should preserve strings containing comment-like content", () => {
      const code = `const str = "// not a comment";
const str2 = '/* also not a comment */';`;
      const result = removeJSComments(code);

      assert.ok(result.includes("// not a comment"));
      assert.ok(result.includes("/* also not a comment */"));
    });

    it("should preserve template literals", () => {
      const code = "const tpl = `// template ${value} content`;";
      const result = removeJSComments(code);

      assert.ok(result.includes("// template"));
    });
  });

  describe("removeCSSComments", () => {
    it("should remove CSS comments", () => {
      const css = `.button { /* comment */ color: red; }`;
      const result = removeCSSComments(css);

      assert.ok(!result.includes("comment"));
      assert.ok(result.includes("color: red"));
    });

    it("should preserve line numbers", () => {
      const css = `.a { color: red; }
/* multi
   line
   comment */
.b { color: blue; }`;
      const result = removeCSSComments(css);
      const lines = result.split("\n");

      assert.strictEqual(lines.length, 5);
    });
  });

  describe("removeHTMLComments", () => {
    it("should remove HTML comments", () => {
      const html = `<div><!-- comment --><span>text</span></div>`;
      const result = removeHTMLComments(html);

      assert.ok(!result.includes("comment"));
      assert.ok(result.includes("<span>text</span>"));
    });

    it("should handle multi-line HTML comments", () => {
      const html = `<div>
<!-- multi
     line
     comment -->
<span>text</span>
</div>`;
      const result = removeHTMLComments(html);

      assert.ok(!result.includes("multi"));
      assert.ok(result.includes("<span>text</span>"));
    });
  });

  describe("extractJSComments", () => {
    it("should extract single-line comments", () => {
      const code = `const x = 1; // first comment
const y = 2; // second comment`;
      const comments = extractJSComments(code);

      assert.strictEqual(comments.length, 2);
      assert.strictEqual(comments[0].type, "single");
      assert.strictEqual(comments[0].content, "first comment");
    });

    it("should extract multi-line comments", () => {
      const code = `/* This is a
   multi-line comment */
const x = 1;`;
      const comments = extractJSComments(code);

      assert.strictEqual(comments.length, 1);
      assert.strictEqual(comments[0].type, "multi");
      assert.ok(comments[0].content.includes("multi-line"));
    });

    it("should detect JSDoc comments", () => {
      const code = `/**
 * This is JSDoc
 * @param {string} name
 */
function test() {}`;
      const comments = extractJSComments(code);

      assert.strictEqual(comments.length, 1);
      assert.strictEqual(comments[0].isJSDoc, true);
    });
  });

  describe("extractCommentTags", () => {
    it("should extract TODO tags", () => {
      const result = extractCommentTags("TODO: fix this later");

      assert.strictEqual(result.tag, "TODO");
      assert.strictEqual(result.message, "fix this later");
    });

    it("should extract FIXME tags", () => {
      const result = extractCommentTags("FIXME: this is broken");

      assert.strictEqual(result.tag, "FIXME");
      assert.strictEqual(result.message, "this is broken");
    });

    it("should extract HACK tags", () => {
      const result = extractCommentTags("HACK: temporary workaround");

      assert.strictEqual(result.tag, "HACK");
    });

    it("should return null for non-tagged comments", () => {
      const result = extractCommentTags("just a regular comment");

      assert.strictEqual(result, null);
    });
  });

  describe("findTodoComments", () => {
    it("should find all TODO comments in code", () => {
      const code = `
// TODO: implement this
function foo() {}

// FIXME: broken logic
function bar() {}

/* HACK: temporary fix */
const x = 1;
`;
      const todos = findTodoComments(code, "test.js");

      assert.strictEqual(todos.length, 3);
      assert.ok(todos.some((t) => t.tag === "TODO"));
      assert.ok(todos.some((t) => t.tag === "FIXME"));
      assert.ok(todos.some((t) => t.tag === "HACK"));
      assert.strictEqual(todos[0].file, "test.js");
    });
  });
});
