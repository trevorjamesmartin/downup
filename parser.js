const tkn = require('./token.js');

class Parser {

    constructor(lexer) {
        this.errors = [];
        this.lex = lexer;
        this.currentToken = undefined;
        this.peekToken = undefined;
        this.nextToken(); // currentToken
        this.nextToken(); // peekToken
        
        this.prefixParseFns = {};

        //  override to customize your markup element(s)
        this.tagFns = {
            h1: ({text}) => `<h1>${text}</h1>\n`,
            h2: ({text}) => `<h2>${text}</h2>\n`,
            h3: ({text}) => `<h3>${text}</h3>\n`,
            h4: ({text}) => `<h4>${text}</h4>\n`,
            h5: ({text}) => `<h5>${text}</h5>\n`,
            h6: ({text}) => `<h6>${text}</h6>\n`,
            hr: () => '<hr>',
        }; 
        
        //  alternatively, you can register a tag for output
        this.registerTag("img", function({src, alt}) {
            return `<img src="${src}" alt="${alt || ''}"></img>`
        });

        // readers
        this.registerPrefix(tkn.LBRACE, this.parseLinkToResource); // <a href...

        this.registerPrefix(tkn.HEADING, this.parseHeader);   // <h{0-5}>...

        this.registerPrefix(tkn.BANG, this.parseBanger);         // <img...

        // TODO: unordered lists can MINUS PLUS or ASTERISK
        //
        
        // TODO: ordered lists start with any number (yes, any number) followed by a period
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

/*
 * Register your flavor of markup 
 *
 * @param {string} tagname  - "h1", "h2", "hr"...
 * @param {function} f      - (object) => string
 *
 */
Parser.prototype.registerTag = function(tagname, f) {
    this.tagFns[tagname] = f;
}

Parser.prototype.Parse = function() {
    let f;
    let text = '';
    while (this.currentToken.Type != tkn.EOF) {
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
        this.errors.push(`[parseBetween] expected current token to be '${startChar}', got '${JSON.stringify(this.currentToken)}'`);
        return
    }

    let content = this.filter((token) => token.Literal != endChar) || '';

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

    for (let ok = (this.peekToken.Type != tkn.EOF); ok && f(this.peekToken); this.nextToken()) {
        literal += this.currentToken.Literal;
        ok = (this.peekToken.Type != tkn.EOF);
    }

    if (f(this.currentToken)) {
        literal += this.currentToken.Literal;
    }

    return literal;
}


Parser.prototype.parseLinkToResource = function() { 
    let text = this.parseBetween(tkn.LBRACE, tkn.RBRACE);

    if (text[0] === tkn.LBRACE) {
        return text;    
    }

    if (this.currentToken.Literal !== tkn.LPAREN) {
        // not a link, re-wrap
        return `[${text}]`;
    }
        
    let href = this.parseBetween(tkn.LPAREN, tkn.RPAREN);

    if (href[0] === tkn.LPAREN) {
        return text + href;
    }

    if (typeof this.tagFns["a"] === 'function') {
        return this.tagFns["a"]({href, text});
    }

    return `<a href="${href}">${text}</a>`;
}

Parser.prototype.parseBanger = function() {
   if (this.peekToken.Literal !== tkn.LBRACE) {
        // not followed by link
        return this.currentToken.Literal
    }

    this.nextToken();

    let description = "";

    if (this.peekToken.Literal !== tkn.RBRACE){
        description = this.parseBetween(tkn.LBRACE, tkn.RBRACE);
    } else {
        this.nextToken();
        this.nextToken();
    }

    if (this.currentToken.Literal !== tkn.LPAREN) {
        // not a link, re-wrap
        return `![${description}]`;
    }
        
    let url = this.parseBetween(tkn.LPAREN, tkn.RPAREN);

    if (url[0] === tkn.LPAREN) {
        // missing closing paren
        return `![${description}](${url}`;
    }
    let img = '';

    if (typeof this.tagFns['img'] === 'function') {
        img = this.tagFns['img']({ src: url, alt: description });
    } else {
        // default to returning the text as-is
        img = `![${description}](${url})`;
    }

    if (this.currentToken.Type === tkn.EOL) {
        img += this.currentToken.Literal;
    }

    return img
}

Parser.prototype.parseHeader = function () {
    let t = this.currentToken;
    
    let num = t.Literal.length;

    if (num === 1 && this.peekToken.Type === tkn.EOL) {
        this.nextToken();
        this.nextToken();
        return this.tagFns['hr']() + '\n\n';
    }
    
    let tag = '';
    
    if (num > 0 && num < 8) {
        // name the element
        tag = `h${num}`;
    } else {
        return this.currentToken.Literal;
    }
    
    // expect space

    if (this.peekToken.Type != tkn.WSPACE) {
        return this.currentToken.Literal;
    }

    this.nextToken();
    this.nextToken();

    let text = this.filter((toke) => toke.Type != tkn.EOL);

    this.nextToken();

    if (typeof this.tagFns[tag] === 'function') {
        // return your flavor
        return this.tagFns[tag]({text});
    }

    // return vanilla HTML
    return `<${tag}>${text}</${tag}>\n`;
}

module.exports = Parser;

