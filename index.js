const Lexer = require("./lexer.js");
const Parser = require("./parser.js");
    
module.exports = function(markdown) {
    const down = markdown;
    const up = new Parser(new Lexer(markdown)).Parse();
    return {down, up}
}


