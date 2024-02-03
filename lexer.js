const { Token, Lookup, ...tkn } = require('./token.js');

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
    let delimit = ['!', ' ', '\n', '\r', '\t', '[', ']', '(', ')', '{', '}', 0];

    switch (this.ch) {
        case ' ':
            literal = this.filter((ch) => ch === ' ');
            token = new Token(tkn.WSPACE, literal);
            break;

        case '#':
            literal = this.filter((ch) => ch === '#');
            token = new Token(tkn.HEADING, literal);
            break;

        case '\t':
            literal = this.filter((ch) => ch === '\t');
            token = new Token(tkn.TABS, literal);
            break;

        case '\n':
        case '\r':
            literal = this.ch;
            token = new Token(tkn.EOL, literal);
            break;

        case 0:
            literal = "";
            token = new Token(tkn.EOF, literal);
            break;

        default:
            literal = this.filter((ch) => !delimit.includes(ch));
            if (literal) {
                token = new Token(tkn.CONTENT, literal);
            } else {
                token = new Token(Lookup(this.ch), this.ch);
            }
            break;
    }

    this.readChar();
    return token;
}

/**
 * continue reading while condition
 *
 * @param {function} f - conditional filter, returns a boolean 
 * 
 * @returns {string}
 *
 **/
Lexer.prototype.filter = function(f) {
    if (!f(this.ch)) {
        return
    }

    let literal = '';

    let notFinished = (this.readPosition < this.input.length);
    
    for (let ok = notFinished; ok === true && f(this.peekChar()); this.readChar()) {
        literal += this.ch;
        ok = (this.readPosition < this.input.length) 
    }

    if (f(this.ch)) {
        literal += this.ch;
    }

    return literal;
}

Lexer.prototype.toString = function() {
    return JSON.stringify(this);
}

Lexer.hydrate = function(state) {
    let lex;
    if (state) {
        try {
            let obj = JSON.parse(state);
            lex = new Lexer(obj.input);
            lex.position = obj.position;
            lex.readPosition = obj.readPosition,
            lex.ch = obj.ch;
        } catch (error) {
            return new Error(error);
        }
    }
    return lex;
}

Lexer.prototype.Clone = function() {
    return Lexer.hydrate(this.toString());
}

module.exports = Lexer;

