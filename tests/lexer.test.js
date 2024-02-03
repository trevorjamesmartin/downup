require("jest");

const Lexer = require('../lexer.js');

describe("Lexer test", () => {
    
    test("NextToken", () => {
        let input = `## Something\n\n[link to document](./README.md)`;
        let testdata = [
            { Type: 'HEADING', Literal: '##' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'Something' },
            { Type: 'EOL', Literal: '\n' },
            { Type: 'EOL', Literal: '\n' },
            { Type: '[', Literal: '[' },
            { Type: 'CONTENT', Literal: 'link' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'to' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'document' },
            { Type: ']', Literal: ']' },
            { Type: '(', Literal: '(' },
            { Type: 'CONTENT', Literal: './README.md' },
            { Type: ')', Literal: ')' },
            { Type: 'EOF', Literal: '' },
        ];

        let lex = new Lexer(input);
        let token;

        for (let data of testdata) {
            token = lex.NextToken();
            expect(token.Type).toBe(data.Type);
            expect(token.Literal).toBe(data.Literal);
        }

    });

    test("Clone", () => {
        let input = "### heading3";
        let original = new Lexer(input);
        let duplicate = original.Clone();
        expect(original === duplicate).toBe(false);
        expect(original.toString() === duplicate.toString()).toBe(true);
        let ot = original.NextToken();
        expect(original.toString() === duplicate.toString()).toBe(false);
        let dt = duplicate.NextToken();
        expect(original.toString() === duplicate.toString()).toBe(true);
        expect(ot.Type === dt.Type).toBe(true);
        expect(ot.Literal === dt.Literal).toBe(true);
    });

});

