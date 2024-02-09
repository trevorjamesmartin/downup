require("jest");

const Lexer = require('../lexer.js');

describe("Lexer test", () => {
    
    test("NextToken", () => {
        let input = `## Something\n\n[link to document](./README.md)\n123\n456\n789\n1. start of ordered list\n2. next element\n3. uno mas`;
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
            { Type: '.', Literal: '.' },
            { Type: 'CONTENT', Literal: '/README' },
            { Type: '.', Literal: '.' },
            { Type: 'CONTENT', Literal: 'md' },
            { Type: ')', Literal: ')' },
            { Type: 'EOL', Literal: '\n' },
            { Type: 'NUMBER', Literal: '123'},
            { Type: 'EOL', Literal: '\n' },
            { Type: 'NUMBER', Literal: '456'},
            { Type: 'EOL', Literal: '\n' },
            { Type: 'NUMBER', Literal: '789'},
            { Type: 'EOL', Literal: '\n' },
            { Type: 'NUMBER', Literal: '1.'},
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'start' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'of' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'ordered' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'list' },
            { Type: 'EOL', Literal: '\n' },
            { Type: 'NUMBER', Literal: '2.'},
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'next' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'element' },
            { Type: 'EOL', Literal: '\n' },
            { Type: 'NUMBER', Literal: '3.'},
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'uno' },
            { Type: 'WSPACE', Literal: ' ' },
            { Type: 'CONTENT', Literal: 'mas' },
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

