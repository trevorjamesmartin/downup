/**
 * not part of the library...
 *
 * run from the command line, this script
 *
 * - reads the 'commonmark spec' test cases
 * 
 * - sorting them by section,
 *   evaluates each case using the downup.Parser
 * 
 * - stores the result as a JSON file 
 *
 */
const Lexer = require("../lexer.js");
const Parser = require("../parser.js");

const commonMarkTests = require("./spec.0.31.2.json");
const commonMarkSections = new Set(
    commonMarkTests.map(({section}) => section));

const results = {};

const FILE_OUT = "observable.json"; 

/*
 * @note with the exception of 'Link reference definitions',
 * all resulting html seem to end with a new-line character
 */
for (let key  of commonMarkSections) {
    results[key] = [];
    const samples = commonMarkTests.filter(({ section }) => section === key);
    
    console.log(`[${key}](${samples.length})`);
    
    for (let {markdown, html} of samples) {
        // see how close we are
        let lex = new Lexer(markdown);

        results[key].push({
            expected: html,
            received: (new Parser(lex)).Parse(),
            markdown 
        });
    }
}

(require('fs')).writeFile(FILE_OUT, JSON.stringify(results, null, 2), 
  {
    encoding: "utf8",
    flag: "w",
    mode: 0o644
  }, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("File written successfully\n");
    }
});

