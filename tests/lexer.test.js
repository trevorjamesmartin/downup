import("jest");


describe("Lexer test", () => {
    let Lexer;
    
    beforeAll(async () => {
        let _ = await import('../lexer.js');
        Lexer = _.Lexer;
    })

    test("NextToken", () => {
        let input = `## Something`;
        let testdata = [
            {Type: 'HEADING', Literal: '##'},
            {Type: 'WSPACE', Literal: ' '},
            {Type: 'CONTENT', Literal: 'S'},
            {Type: 'CONTENT', Literal: 'o'},
            {Type: 'CONTENT', Literal: 'm'},
            {Type: 'CONTENT', Literal: 'e'},
            {Type: 'CONTENT', Literal: 't'},
            {Type: 'CONTENT', Literal: 'h'},
            {Type: 'CONTENT', Literal: 'i'},
            {Type: 'CONTENT', Literal: 'n'},
            {Type: 'CONTENT', Literal: 'g'},
            {Type: 'EOF', Literal: ''},
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
        expect(original.toString() === duplicate.toString()).toBe(true);
        let ot = original.NextToken();
        expect(original.toString() === duplicate.toString()).toBe(false);
        let dt = duplicate.NextToken();
        expect(original.toString() === duplicate.toString()).toBe(true);
        expect(ot.Type === dt.Type).toBe(true);
        expect(ot.Literal === dt.Literal).toBe(true);
    });

});

