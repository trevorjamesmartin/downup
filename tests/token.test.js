require("jest");

const { Token, Lookup, ...tkn } = require('../token.js');


describe("Token test", () => {

    test("constants", () => {
        
        expect(tkn.CR).toBe('\r');
        expect(tkn.NEW_LINE).toBe('\n');
        expect(tkn.TABS).toBe('\t');

        expect(tkn.WSPACE).toBe('WSPACE');
        expect(tkn.CONTENT).toBe('CONTENT');
        expect(tkn.HEADING).toBe('HEADING');
        expect(tkn.EOL).toBe('EOL');
        expect(tkn.EOF).toBe('EOF');

        expect(Lookup(' ')).toBe(tkn.WSPACE);

    });

    test("end of line characters", () => {
        
        expect(Lookup('\n')).toBe(tkn.EOL);
        expect(Lookup('\r')).toBe(tkn.EOL);

    });

    test("structure", () => {

        let t = new Token(tkn.CONTENT, "something");

        expect(t.Type).toBe(tkn.CONTENT);

        expect(t.Literal).toBe("something");

    })


});
