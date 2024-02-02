import("jest");

const {Lexer} = await import("../lexer.js");
const {Parser} = await import("../parser.js");

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

});


