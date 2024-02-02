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

});

