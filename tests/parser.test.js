require("jest");

const Lexer = require("../lexer.js");
const Parser = require("../parser.js");

describe("Parser test", () => {

    test("parse url", () => {
        let input = "[link to document](./README.md)";
        let lex = new Lexer(input);
        let p = new Parser(lex);
        expect(p.Parse()).toBe(`<a href="./README.md">link to document</a>`);
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
            output = p.Parse();
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
            output = p.Parse();
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
            output = p.Parse();
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
            output = p.Parse();
            expect(output).toBe(expectedOutput);
        }
    });

    test("parse blockquotes", ()=> {
        let sample = [
            {
                input:`> Dorothy followed her through many of the beautiful rooms in her castle.`,
                expectedOutput: `<blockquote>Dorothy followed her through many of the beautiful rooms in her castle.</blockquote>` 
            }
        ];

        for (let {input, expectedOutput} of sample) {
            lex = new Lexer(input);
            p = new Parser(lex);
            output = p.Parse();
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

    test("parse mixed", () => {
        let input = `# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\nAlternatively, for H1 and H2, an underline-ish style:\n\nAlt-H1\n======\n\nAlt-H2\n------\n\n`;

        let expectedOutput= '<h1>H1</h1>\n' +
                            '<h2>H2</h2>\n' +
                            '<h3>H3</h3>\n' +
                            '<h4>H4</h4>\n' +
                            '<h5>H5</h5>\n' +
                            '<h6>H6</h6>\n' +
                            '\n' +
                            'Alternatively, for H1 and H2, an underline-ish style:\n' +
                            '\n' +
                            'Alt-H1\n' + // TODO
                            '======\n' +
                            '\n' +
                            'Alt-H2\n' + // TODO
                            '------\n' +
                            '\n';
        
        let lex = new Lexer(input);
        let p = new Parser(lex);

        expect(p.Parse()).toBe(expectedOutput);

    });

});


