/**
 *
 * Token
 *
 */
class Token {
    /**
     * @constructor
     * @param {string} tokenType
     * @param {string} tokenLiteral
     */
    constructor(tokenType, tokenLiteral) {
        this.Type = tokenType;
        this.Literal = tokenLiteral;
    }
}

const CONTENT       = "CONTENT";
const WSPACE        = "WSPACE";
const HEADING       = "HEADING";
const EOF           = "EOF";
const EOL           = "EOL";

const TABS          = "\t";
const NEW_LINE      = "\n";
const CR            = "\r";

const EQUALS        = "=";
const PLUS          = "+";
const MINUS         = "-";
const CRASH         = "#";
const POINT         = ".";
const BANG          = "!";
const ASTERISK      = "*";
const SLASH         = "/";
const LT            = "<";
const GT            = ">";
const COMMA         = ",";
const SEMICOLON     = ";";
const LPAREN        = "(";
const RPAREN        = ")";
const LBRACE        = "[";
const RBRACE        = "]";
const LBRACKET      = "{";
const RBRACKET      = "}";
const COLON         = ":";

var keywords = {
    '#': CRASH,
    '!': BANG,
    '[': LBRACE,
    ']': RBRACE,
    '(': LPAREN,
    ')': RPAREN,
    ' ': WSPACE,
};

function Lookup(text) {
    if (keywords[text]) {
        return keywords[text]
    }

    return CONTENT;
}


module.exports = {
    Token,
    Lookup,

    CONTENT,
    WSPACE,
    EOL,
    EOF,
    HEADING,

}
