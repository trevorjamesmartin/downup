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
const ESCAPED       = "ESCAPED";
const NUMBER        = "NUMBER";

const BACKSLASH     = "\\";

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

const UNDERSCORE    = "_";
const TILDE         = "~";
const PERIOD        = ".";

const BACKTICK      = "`";

const PIPE          = "|";

var keywords = {
    '#': CRASH,
    '!': BANG,
    '[': LBRACE,
    ']': RBRACE,
    '(': LPAREN,
    ')': RPAREN,
    ' ': WSPACE,
    '\r': EOL,
    '\n': EOL,
    '\t': WSPACE,
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

    // CONSTANTS

    CONTENT,
    WSPACE,
    EOL,
    EOF,
    HEADING,
    ESCAPED,
    NUMBER,

    TABS,
    NEW_LINE,
    CR,

    EQUALS,
    PLUS,
    MINUS,
    CRASH,
    POINT,
    BANG,
    ASTERISK,
    SLASH,
    LT,
    GT,
    COMMA,
    SEMICOLON,
    LPAREN,
    RPAREN,
    LBRACE,
    RBRACE,
    LBRACKET,
    RBRACKET,
    COLON,
    TILDE,
    UNDERSCORE,
    PERIOD,
    BACKTICK,
    BACKSLASH,
    PIPE,
}
