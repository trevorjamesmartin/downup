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


/**
 *  Lexer
 **/
class Lexer {
    /**
     * @constructor
     * @param {string} input - markdown text
     * @returns {Lexer}
     */
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.readPosition = 0;
        this.ch = '';
        this.readChar();
    }
}

/**
 * advance positions and update Lexer.ch
 */
Lexer.prototype.readChar = function() {
    if (this.readPosition >= this.input.length) {
        this.ch = 0;
    } else {
        this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition++;
}

/**
 * take a peek at the next character
 * @returns {string}
 */
Lexer.prototype.peekChar = function() {
    if (this.readPosition >= this.input.length) {
        return 0
    }
    return this.input[this.readPosition];
}

/**
 * @returns {Token}
 **/
Lexer.prototype.NextToken = function() {
    let token, literal;

    switch (this.ch) {
        case ' ':
            literal = this.readWhile([' ']);
            token = new Token(WSPACE, literal);
            break;
        case CRASH:
            literal = this.readWhile([CRASH]);
            token = new Token(HEADING, literal);
            break;

        case 0:
            literal = "";
            token = new Token(EOF, literal);
            break;

        default:
            literal = this.ch;
            token = new Token(CONTENT, literal)
            break;
    }

    this.readChar();
    return token;
}

/**
 * continue reading while... 
 *
 * @param {string[]} chars - array of Token.Literal values
 * 
 * @returns {string}
 *
 **/
Lexer.prototype.readWhile = function(chars) {
    let literal = this.ch;

    while (chars.includes(this.peekChar())) {
        literal += this.ch;
        this.readChar();
    }
    return literal;
}

Lexer.prototype.toString = function() {
    return JSON.stringify(this);
}

Lexer.hydrate = function(state) {
    let {input, position, readPosition, ch} = JSON.parse(state);
    let lex = new Lexer(input);
    if (position) {
        lex.position = position;
        lex.readPosition = readposition;
        lex.ch = ch;
    }
    return lex;
}

Lexer.prototype.Clone = function() {
    return Lexer.hydrate(this.toString());
}

export { Lexer };

