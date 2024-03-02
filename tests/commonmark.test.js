require("jest");

const Lexer = require("../lexer.js");
const Parser = require("../parser.js");

describe("commonmark", () => {

    test("tabs", () => {
        /**
         * https://spec.commonmark.org/0.31.2/#tabs
         *
         * Tabs in lines are not expanded to spaces. However, in contexts where spaces
         * help to define block structure, tabs behave as if they were replaced by spaces
         * with a tab stop of 4 characters.
         *
         * Thus, for example, a tab can be used instead of four spaces in an indented code block.
         * (Note, however, that internal tabs are passed through as literal tabs, not expanded to spaces.)
         */
        let example = [
            {
                input: `\tfoo\tbaz\t\tbim\n`, 
                expected: `<pre><code>foo	baz		bim\n</code></pre>`
            },
            {
                input: `  \tfoo\tbaz\t\tbim\n`, 
                expected: `<pre><code>foo	baz		bim\n</code></pre>`
            },       
            {
                input: `    a	a\n    ὐ	a\n`, 
                expected: `<pre><code>a\ta\nὐ\ta\n</code></pre>`
            },
            {
                input: `- foo\n\n\t\tbar\n`,
                expected: `<ul><li>foo</li></ul><pre><code>bar\n</code></pre>`
                // @note : I'm not wrapping list-item content in paragraphs
            },
            {
                input: `- foo\n\t\tbar\n`,
                // @todo : preserve whitespace inside codeblock
                expected: "<ul><li>foo\n<pre><code>bar</code></pre></li></ul>"
            }
        ];


        for (let {input, expected} of example) {
            let lexer = new Lexer(input);
            let parser = new Parser(lexer);
            let output = parser.Parse();
            //console.log(output);
            expect(output).toBe(expected);
        }

    });

});

