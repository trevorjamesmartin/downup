
class Parser {

    constructor(lexer) {
        this.errors = [];
        this.lex = lexer;
        this.currentToken = undefined;
        this.peekToken = undefined;
        this.nextToken(); // currentToken
        this.nextToken(); // peekToken
        this.prefixParseFns = {};

        this.registerPrefix('[', this.parseLinkToResource); // <a href...

        this.registerPrefix('HEADING', this.parseHeader);   // <h{0-5}>...

        this.registerPrefix('!', this.parseBanger);         // <img...

        // TODO: unordered lists can MINUS PLUS or ASTERISK
        //
        
        // TODO: ordered lists start with any number (yes, any number)
        //
        
        // TODO: Emphasis, aka italics, with *asterisks* or _underscores_.

        //       Strong emphasis, aka bold, with **asterisks** or __underscores__.

        //       Combined emphasis with **asterisks and _underscores_**.

        //       Strikethrough uses two tildes. ~~Scratch this.~~
        
        // TODO: <table...
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


Parser.prototype.parseLinkToResource = function() { 
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

Parser.prototype.parseBanger = function() {
    if (this.peekToken.Literal !== '[') {
        // not followed by link
        return this.currentToken.Literal
    }

    this.nextToken();

    let description = "";

    if (this.peekToken.Literal !== "]"){
        description = this.parseBetween("[", "]");
    } else {
        this.nextToken();
        this.nextToken();
    }

    if (this.currentToken.Literal !== "(") {
        // not a link, re-wrap
        return `[${description}]`;
    }
        
    let url = this.parseBetween("(", ")");

    if (url[0] === "(") {
        // missing closing paren
        return `[${description}]${url}`;
    }
    let img = `<img src="${url}" alt="${description || ''}"></img>`;

    if (this.currentToken.Type === "EOL") {
        img += this.currentToken.Literal;
    }

    return img
}

Parser.prototype.parseHeader = function () {
    let t = this.currentToken;
    
    let num = t.Literal.length;

    if (num === 1 && this.peekToken.Type === 'EOL') {
        this.nextToken();
        this.nextToken();
        return "<hr>\n\n";
    }
    
    let el = '';
    
    if (num > 0 && num < 8) {
        // name the element
        el = `h${num}`;
    } else {
        return this.currentToken.Literal;
    }
    
    // expect space

    if (this.peekToken.Type != 'WSPACE') {
        return this.currentToken.Literal;
    }

    this.nextToken();
    this.nextToken();

    let innerText = this.filter((toke) => toke.Type != 'EOL');
    
    let result = `<${el}>${innerText}</${el}>\n`;
    
    this.nextToken();

    return result;
}

//export { Parser }
module.exports = Parser;

