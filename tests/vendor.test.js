require("jest");


describe("build ecmascript module", () => {

    beforeAll(async () => {
        const esbuild = require('esbuild');
        await esbuild.build({entryPoints: ['index.js'], bundle: true, minify: true, format: 'esm', outfile: 'vendor.mjs'});
    });

    test("test build", async () => {
        const {default: downup} = await import('../vendor.mjs');
        const keys = Object.keys(downup);

        expect(keys.includes('token')).toBe(true);
        expect(keys.includes('Lexer')).toBe(true);
        expect(keys.includes('Parser')).toBe(true);

        let input = "# simple h1 element";
        let expectedHtml = `<h1>simple h1 element</h1>`;

        let dp = new downup.Parser(new downup.Lexer(input));

        expect(dp.Parse()).toBe(expectedHtml);
    });
    

});



