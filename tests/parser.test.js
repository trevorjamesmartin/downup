require("jest");

const Lexer = require("../lexer.js");
const Parser = require("../parser.js");

describe("Parser test", () => {

    test("parse anchor link", () => {
        let input = "[link to document](./README.md)";
        let lex = new Lexer(input);
        let p = new Parser(lex);
        expect(p.Parse()).toBe(`<a href="./README.md">link to document</a>`);
    });

    test("parse image link", () => {
        let input = "[![Electron Logo](https://electronjs.org/images/electron-logo.svg)](https://electronjs.org)";
        let lex = new Lexer(input);
        let p = new Parser(lex);
        expect(p.Parse()).toBe(`<a href="https://electronjs.org"><img src="https://electronjs.org/images/electron-logo.svg" alt="Electron Logo"></img></a>`);
    });

    test("parse code block", () => {
        let input = "code: `<br>`";
        let expectedOutput = "code: <pre><code>&lt;br&gt;</code></pre>";
        let lex = new Lexer(input);
        let p = new Parser(lex);
        expect(p.Parse(0)).toBe(expectedOutput);
    });

    test("parse header tag", () => {

        let sample = [
            {
                input: "# Markdown fun\n\nan exercise in parsing", 
                expectedOutput: "<h1>Markdown fun</h1>\n\nan exercise in parsing"
            },
            {
                input: "# first heading\n## second heading\n### third heading",
                expectedOutput: "<h1>first heading</h1>\n<h2>second heading</h2>\n<h3>third heading</h3>\n"
            }
        ];

        let lex, p, output;

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse(0);
            expect(output).toBe(expectedOutput);
        }

    }); 

    test("parse hr tag", () => {
        let sample = [
            {
                input: "## ultra super best goodness\n#\n\nemail ruined spam", 
                expectedOutput: "<h2>ultra super best goodness</h2>\n<hr>\n\nemail ruined spam"
            }
        ];

        let lex, p, output;

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse(0);
            expect(output).toBe(expectedOutput);
        }
        
    });

    test("parse image tag", () => {

        let sample = [
            {
                input: "![](./image.jpg)",
                expectedOutput: `<img src="./image.jpg" alt=""></img>`
            },
            {
                input: "![happy trees](./bobross.png)",
                expectedOutput: `<img src="./bobross.png" alt="happy trees"></img>`
            },
            {
                input: "[picture of happy trees](./bobross.png)",
                expectedOutput: `<a href="./bobross.png">picture of happy trees</a>`
            },
            {
                input: `## another test\n\nlets try displaying an image\n![](./image.jpg)\n\n#\n\n### this one has an alt tag\n\n[picture of happy trees](./bobross.jpg)\n#\n\nthat was just a link, this one should be an image\n\n![picture of happy trees](./bobross.jpg)`,

                expectedOutput: `<h2>another test</h2>\n\nlets try displaying an image\n<img src="./image.jpg" alt=""></img>\n\n<hr>\n\n<h3>this one has an alt tag</h3>\n\n<a href="./bobross.jpg">picture of happy trees</a><hr>\n\nthat was just a link, this one should be an image\n\n<img src="./bobross.jpg" alt="picture of happy trees"></img>`
            },
        ];

        let lex, p, output;

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse(0);
            expect(output).toBe(expectedOutput);
        }


    });

    test("parse ordered list", () => {
        let sample = [
            {
                input: '1. something\n2. something else\n3. uno mas',
                expectedOutput: '<ol><li>something</li>\n<li>something else</li>\n<li>uno mas</li></ol>'
            },           {
                input: '1. something\n42. something else\n34. uno mas',
                expectedOutput: '<ol><li>something</li>\n<li>something else</li>\n<li>uno mas</li></ol>'
            },
        ];

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse();
            expect(output).toBe(expectedOutput);
        }
    });

    test("parse unordered list", () => {
        let sample = [
            {
                input: "- item1\n- item2\n- item3",
                expectedOutput: '<ul><li>item1</li>\n<li>item2</li>\n<li>item3</li></ul>'
            },
            {
                input: "+ item1\n+ item2\n+ item3",
                expectedOutput: '<ul><li>item1</li>\n<li>item2</li>\n<li>item3</li></ul>'
            },
            {
                input: "* item1\n* item2\n* item3",
                expectedOutput: '<ul><li>item1</li>\n<li>item2</li>\n<li>item3</li></ul>'
            },
            {
                input: "+ item1\n- item2\n* item3",
                expectedOutput: '<ul><li>item1</li>\n<li>item2</li>\n<li>item3</li></ul>'
            },
        ];

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse();
            expect(output).toBe(expectedOutput);
        }

    });

    test("parse emphasis", () => {

        let sample  = [
            {
                input: 'this is normal text. **this is emphasized text.**',
                expectedOutput: 'this is normal text. <strong>this is emphasized text.</strong>'
            },
            {
                input: `Italicized text is the *cat's meow*.`,
                expectedOutput: `Italicized text is the <em>cat's meow</em>.`
            },
            {
                input: `Love**is**bold`,
                expectedOutput: `Love<strong>is</strong>bold`,
            }
        ]

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse(1); // don't wrap result in <p>aragraph
            expect(output).toBe(expectedOutput);
        }
    });

    test("parse blockquotes", ()=> {
        let sample = [
            {
                // 1 liner
                input:`> Dorothy followed her through many of the beautiful rooms in her castle.`,
                expectedOutput: `<blockquote>Dorothy followed her through many of the beautiful rooms in her castle.</blockquote>`
            },
            {
                // 1 multi-line block quote
                input: `> If you tell the truth, you don't have to remember anything.\n> - Mark Twain`,
                expectedOutput: `<blockquote>If you tell the truth, you don't have to remember anything.\n<ul><li>Mark Twain</li></ul></blockquote>` 
            },
            {
                // 2 multiline block quotes
                input: `> It is better to remain silent at the risk of being thought a fool, than to talk and remove all doubt of it.\n> - Maurice Switzer, Mrs. Goose, Her Book\n\n> I have not failed. I've just found 10,000 ways that won't work.\n> - Thomas A. Edison`,
                expectedOutput:`<blockquote>It is better to remain silent at the risk of being thought a fool, than to talk and remove all doubt of it.\n<ul><li>Maurice Switzer, Mrs. Goose, Her Book</li></ul></blockquote><blockquote>I have not failed. I've just found 10,000 ways that won't work.\n<ul><li>Thomas A. Edison</li></ul></blockquote>`
            },
            {
                input : `> #### The quarterly results look great!\n>\n> - Revenue was off the chart.\n> - Profits were higher than ever.\n>\n>  *Everything* is going according to **plan**.`,
                expectedOutput: `<blockquote><h4>The quarterly results look great!</h4>\n\n<ul><li>Revenue was off the chart.</li>\n<li>Profits were higher than ever.</li></ul><em>Everything</em> is going according to <strong>plan</strong>.</blockquote>`
            }
        ];

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse(0);
            expect(output).toBe(expectedOutput);
        }

    });

    test("parse table", () => {
        let sample = [
            {
                input: `| Syntax | Description |\n| --- | ----------- |\n| Header | Title |\n| Paragraph | Text |`,
                expectedOutput:`<table><thead><tr><th>Syntax</th><th>Description</th></tr></thead><tbody><tr><td>Header</td><td>Title</td></tr><tr><td>Paragraph</td><td>Text</td></tr></tbody></table>`
            },
            {
                input: `| Syntax | Description |\n| Header | Title |\n| Paragraph | Text |`,
                expectedOutput:`<table><tbody><tr><td>Syntax</td><td>Description</td></tr><tr><td>Header</td><td>Title</td></tr><tr><td>Paragraph</td><td>Text</td></tr></tbody></table>`
            },
        ];

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse();
            expect(output).toBe(expectedOutput);
        }

    });

    test("parse escaped html", () => {
        let sample = [
            {
                input: `_\\<blockquote\\>_**inner html**_\\<\\/blockquote\\>_`,
                expectedOutput: `<em>&lt;blockquote&gt;</em><strong>inner html</strong><em>&lt;/blockquote&gt;</em>`
            }
        ];

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse();
            expect(output).toBe(expectedOutput);
        }

    });

    test("parse paragraphs", () => {
        let input = `You can use two or more spaces (commonly referred to as “trailing whitespace”) for line breaks in nearly every Markdown application, but it’s controversial. It’s hard to see trailing whitespace in an editor, and many people accidentally or intentionally put two spaces after every sentence. For this reason, you may want to use something other than trailing whitespace for line breaks. If your Markdown application supports HTML, you can use the br HTML tag.\n\n\nFor compatibility, use trailing white space or the br HTML tag at the end of the line.\n\n\nThere are two other options I don’t recommend using. CommonMark and a few other lightweight markup languages let you type a backslash (\) at the end of the line, but not all Markdown applications support this, so it isn’t a great option from a compatibility perspective. And at least a couple lightweight markup languages don’t require anything at the end of the line — just type return and they’ll create a line break.`;

        let expectedOutput = `<p>\nYou can use two or more spaces (commonly referred to as “trailing whitespace”) for line breaks in nearly every Markdown application, but it’s controversial. It’s hard to see trailing whitespace in an editor, and many people accidentally or intentionally put two spaces after every sentence. For this reason, you may want to use something other than trailing whitespace for line breaks. If your Markdown application supports HTML, you can use the br HTML tag.\n</p>\n<p>\nFor compatibility, use trailing white space or the br HTML tag at the end of the line.\n</p>\n<p>\nThere are two other options I don’t recommend using. CommonMark and a few other lightweight markup languages let you type a backslash (\) at the end of the line, but not all Markdown applications support this, so it isn’t a great option from a compatibility perspective. And at least a couple lightweight markup languages don’t require anything at the end of the line — just type return and they’ll create a line break.\n</p>`;

        p = new Parser(new Lexer(input));
        output = p.Parse();
        expect(output).toBe(expectedOutput);
    });

    test("parse mixed", () => {
        let input = `# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\nAlternatively, for H1 and H2, an underline-ish style: TODO\n`;

        let expectedOutput= '<h1>H1</h1>\n' +
                            '<h2>H2</h2>\n' +
                            '<h3>H3</h3>\n' +
                            '<h4>H4</h4>\n' +
                            '<h5>H5</h5>\n' +
                            '<h6>H6</h6>\n' +
                            '<p>\n<br>\nAlternatively, for H1 and H2, an underline-ish style: TODO\n' +
                            '</p>'; 
        
        let lex = new Lexer(input);
        let p = new Parser(lex);
        expect(p.Parse()).toBe(expectedOutput);
    });

});


