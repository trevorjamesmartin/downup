const tkn = require('./token.js');

const Lexer = require('./lexer.js');

const defaultTags = require('./defaultTags.js');


class Parser {

    constructor(lexer, customTags={}) {
        this.errors = [];
        this.lex = lexer;
        this.currentToken = undefined;
        this.peekToken = undefined;
        this.nextToken(); // currentToken
        this.nextToken(); // peekToken
        
        this.prefixParseFns = {};

        //  customize your markup elementd(s)
        this.tagFns = {...defaultTags, ...customTags};

        // readers
        this.registerPrefix(tkn.LBRACE, this.parseLinkToResource);  // <a href...

        this.registerPrefix(tkn.HEADING, this.parseHeader);         // <hr>, <h{0-6}>

        this.registerPrefix(tkn.BANG, this.parseBanger);            // <img...

        this.registerPrefix(tkn.MINUS, this.parseMinus);
 
        this.registerPrefix(tkn.PLUS, this.parsePlus);
        this.registerPrefix(tkn.ASTERISK, this.parseAsterisk);
        this.registerPrefix(tkn.NUMBER, this.parseNumber);
        
        this.registerPrefix(tkn.UNDERSCORE, this.parseUnderscore);
        this.registerPrefix(tkn.TILDE, this.parseTilde);

        this.registerPrefix(tkn.PERIOD, this.parsePeriod);

        this.registerPrefix(tkn.GT, this.parseGT);

        this.registerPrefix(tkn.BACKTICK, this.parseBacktick);
        
        // TODO: <table...
    };


    _parse(text) {
        if (!this.tagFns) {
            return
        }
        let tagFns = {...this.tagFns}; 
        let p = new Parser(new Lexer(text, tagFns));
        return p.Parse();
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

Parser.prototype.ParseElements = function() {
    let f, i;
    let elements = [];

    while (this.currentToken.Type != tkn.EOF) {
        f = this.prefixParseFns[this.currentToken.Type];
        
        if (typeof f === 'function') {
            elements.push(f());
        } else {
            elements.push(this.currentToken.Literal);
        }

        this.nextToken();
    }
    return elements;
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

Parser.prototype.parseBacktick = function() {
    let lit = this.currentToken.Literal;
    this.nextToken();
    let code = this.parseUntil(lit) || '';

    if (code.length > 0) {
        return `<pre><code>${code}</code></pre>`; 
    }

    return code;
}

Parser.prototype.parseGT = function() {
    // Blockquotes begin with `> `
    if (this.peekToken.Type !== tkn.WSPACE) {
        return this.currentToken.Literal;
    }

    let content = this.parseBlockQuote(this.currentToken.Literal);
    

    return content;
}


Parser.prototype.parseBlockQuote = function(bq) {
    let quotes = [];

    // TODO : multi-line blockquote + test

    while (this.currentToken.Literal === bq) {

        switch(bq) {
            case ">":
                this.nextToken(); // ` `
                this.nextToken(); // CONTENT
                break;
            default:
                this.nextToken(); // CONTENT
                break;
        }
        
        // start with a single case
        let content = this.filter((token) => token.Type != tkn.EOL) || '';
        quotes.push(this._parse(content));
        this.nextToken();
    }
    return `<blockquote>${quotes.join('')}</blockquote>`;
}


Parser.prototype.parseUntil = function(endChar) {
    if (this.currentToken.Literal === endChar) {
        this.errors.push(`[parseUntil] expects current token NOT to be '${endChar}', got '${JSON.stringify(this.currentToken)}'`);
        return "[error: OFF BY 1]"
    }

    let content = this.filter((token) => token.Literal != endChar) || '';

    this.nextToken();

    if (this.currentToken.Literal !== endChar) {
        return endChar + content;
    }
    
    return content;
}


Parser.prototype.continues = function() {
    return this.peekToken.Type !== tkn.EOF;
}


Parser.prototype.filter = function(f) {
    if (!f(this.currentToken)) {
        return
    }

    let literal = '';

    for (let ok = this.continues(); ok && f(this.peekToken); this.nextToken()) {
        literal += this.currentToken.Literal;
        ok = this.continues(); 
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

Parser.prototype.parseMinus = function() {
    if (this.currentToken.Literal === tkn.MINUS &&
        this.peekToken.Type === tkn.WSPACE) {
        return this.parseUnorderedList();
    }
    return this.currentToken.Literal;
}

Parser.prototype.parsePlus = function() {
    if (this.currentToken.Literal === tkn.PLUS &&
        this.peekToken.Type === tkn.WSPACE) {
        return this.parseUnorderedList();
    }
    return this.currentToken.Literal;
}

Parser.prototype.parseUnderscore = function() {
    if (this.currentToken.Literal.length < 3) {
        return this.parseEmphasis();
    }
    return this.currentToken.Literal;
}

Parser.prototype.parseTilde = function() {
    if (this.currentToken.Literal.length === 2) {
        return this.parseEmphasis();
    }
    return this.currentToken.Literal;
}

Parser.prototype.parsePeriod = function() {
    return this.currentToken.Literal;
}

Parser.prototype.parseAsterisk = function() {
    if (this.currentToken.Literal === tkn.ASTERISK &&
        this.peekToken.Type === tkn.WSPACE) {
        return this.parseUnorderedList();
    }

    if (this.currentToken.Literal.length < 3) {
        return this.parseEmphasis();
    }

    return this.currentToken.Literal;
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

    if (!text) {
        return `# ${this.currentToken.Literal}`;
    }
    
    text = this._parse(text);

    this.nextToken();

    if (typeof this.tagFns[tag] === 'function') {
        // return your flavor
        return this.tagFns[tag]({text});
    }

    // return vanilla HTML
    return `<${tag}>${text}</${tag}>\n`;
}


Parser.prototype.parseNumber = function() {
    let t = this.currentToken;
    
    if (t.Literal.endsWith('.') && 
        this.peekToken.Type === tkn.WSPACE) {
        // ordered list ?
        return this.parseOrderedList();
    }

    return t.Literal;
}

Parser.prototype.parseUnorderedList = function() {
    let b = this.currentToken.Literal;
    let wspace = this.peekToken.Type;
    let bullets = [tkn.MINUS, tkn.PLUS, tkn.ASTERISK];
    let items =[];
    while (wspace === tkn.WSPACE && bullets.includes(b)) {
        this.nextToken(); // -
        this.nextToken(); // ' '
        items.push(this.filter((toke) => toke.Type != tkn.EOL)); // item
        this.nextToken() // EOL
        this.nextToken() // -
        b = this.currentToken.Literal;
        wspace = this.peekToken.Type;
    }

    // bullet wspace content (eol || eof)
    // (-, +, *) content\n
    
    if (items.length > 0) {
        // parse each item & return a list
        const resolved = items.map((item) => this._parse(item)); 
        return `<ul>${resolved.map((text) => `<li>${text}</li>`).join('\n')}</ul>`;
    }
   
    return t.Literal;
}

Parser.prototype.parseOrderedList = function() {
    let idx = this.currentToken.Literal; 
    let wspace = this.peekToken.Type;
    
    let items = [];

    while (idx.endsWith('.') && wspace === tkn.WSPACE) {
        this.nextToken(); // 1.
        this.nextToken(); // ' '

        items.push(this.filter((toke) => toke.Type != tkn.EOL)); // list item
        
        this.nextToken(); // EOL
        this.nextToken(); // 2.

        idx = this.currentToken.Literal; 
        wspace = this.peekToken.Type;
    }

    // number wspace content (eol || eof)
    // 1. content\n
    // 2. content\n

    if (items.length > 0) {
        // parse each item & return a list
        const resolved = items.map((item) => this._parse(item)); 
        return `<ol>${resolved.map((text) => `<li>${text}</li>`).join('\n')}</ol>`;
    }
    
    return idx 
}


Parser.prototype.parseEmphasis = function() {
    let lit = this.currentToken.Literal;
    let f = this.tagFns["emphasis"][lit];
    let innerText;
    
    if (!f) {
        return this.currentToken.Literal;
    }

    this.nextToken();
    let input = this.parseUntil(lit);
    if (this.currentToken.Literal === lit) {
        innerText = this._parse(input);
    } else {
        innerText = input;
    }
    
    return f({ text: innerText });
}

module.exports = Parser;

