
class Parser {

    constructor(lexer) {
        this.errors = [];
        this.lex = lexer;
        this.currentToken = undefined;
        this.peekToken = undefined;
        this.nextToken(); // currentToken
        this.nextToken(); // peekToken
        this.prefixParseFns = {};

        this.registerPrefix('[', this.parseLinkToResource)

    }

}

Parser.prototype.registerPrefix = function(tokenLiteral, f) {
    this.prefixParseFns[tokenLiteral] = f.bind(this);
}

Parser.prototype.Parse = function() {
    let f;
    let text = '';
    while (this.currentToken.Type != 'EOF') {
        f = this.prefixParseFns[this.currentToken.Type];
        
        if (typeof f === 'function') {
            text += f();
        } else {
            text += this.currentToken.Literal;
        }

        this.nextToken();
    }
    return text;
}

Parser.prototype.nextToken = function() {
    this.currentToken = this.peekToken;
    this.peekToken = this.lex.NextToken();
}

Parser.prototype.parseBetween = function(startChar, endChar) {
    if (this.currentToken.Literal === startChar) {
        this.nextToken();
    } else {
        return new Error(`should be called from the startChar: "${startChar}". caller was "${this.currentToken.Literal}"`);
    }

    let content = this.filter((token) => token.Literal != endChar);

    this.nextToken();

    if (this.currentToken.Literal !== endChar) {
        return startChar + content;
    }

    this.nextToken();
    
    return content;
}


Parser.prototype.filter = function(f) {
    if (!f(this.currentToken)) {
        return
    }

    let literal = '';

    for (let ok = (this.peekToken.Type != 'EOF'); ok && f(this.peekToken); this.nextToken()) {
        literal += this.currentToken.Literal;
        ok = (this.peekToken.Type != 'EOF');
    }

    if (f(this.currentToken)) {
        literal += this.currentToken.Literal;
    }

    return literal;
}


Parser.prototype.parseLinkToResource = function(foo) { 
    let content = this.parseBetween("[", "]");

    if (content[0] === "[") {
        return content;    
    }

    if (this.currentToken.Literal !== "(") {
        // not a link, re-wrap
        return `[${content}]`;
    }
        
    let url = this.parseBetween("(", ")");

    if (url[0] === "(") {
        return content + url;
    }

    return `<a href="${url}">${content}</a>`;
}

export { Parser }

