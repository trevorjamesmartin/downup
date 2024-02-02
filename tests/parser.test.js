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

});

