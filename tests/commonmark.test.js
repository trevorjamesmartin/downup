require("jest");

const Lexer = require("../lexer.js");
const Parser = require("../parser.js");

/**
 * @note commonmark spec 0.31.2 (2024-01-28)
 *       (stored locally for unit testing)
 * 
 * origin: https://spec.commonmark.org/0.31.2/spec.json 
 * 
 * latest: https://spec.commonmark.org/current/
 *
 */

const spec = require("../commonmark/spec.0.31.2.json");


/**
 * Uncomment any 'section' to run its unit tests
 */
const todaysTests = [
//'Tabs',
//'Backslash escapes',
//'Entity and numeric character references',
//'Precedence',
//'Thematic breaks',
//'ATX headings',
//'Setext headings',
//'Indented code blocks',
//'Fenced code blocks',
//'HTML blocks',
//'Link reference definitions',
//'Paragraphs',
//'Blank lines',
//'Block quotes',
//'List items',
//'Lists',
//'Inlines',
i//'Code spans',
//'Emphasis and strong emphasis',
//'Links',
//'Images',
//'Autolinks',
//'Raw HTML',
//'Hard line breaks',
//'Soft line breaks',
//'Textual content'
];

describe("commonmark", () => {
    
    if (!todaysTests[0]) {
        test("... TODO", () => {
            expect(true).toBe(true);         
        });
    }

    for (let testSection of todaysTests) {
        test(testSection, () => {
            const sample = spec.filter(({section}) => section === testSection);
            for (let { markdown, html, section } of sample) {
                let lexer = new Lexer(markdown);
                let parser = new Parser(lexer, 2);
                let output = parser.Parse();
                console.log(JSON.stringify({output, html, markdown}, null, 2));
                expect(output).toBe(html);
            }
        });
    }
});

