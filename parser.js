const tkn = require('./token.js');

const Mobject = require('./mobject.js');

const Lexer = require('./lexer.js');

const defaultTags = require('./defaultTags.js');

class Parser {

    constructor(lexer, customTags={}) {
        this.errors = [];
        this.lex = lexer;
        this.formatOut = 'html';
        this.currentToken = undefined;
        this.peekToken = undefined;
        this.nextToken(); // currentToken
        this.nextToken(); // peekToken
        
        this.prefixParseFns = {};
        this.postProcessFns = [];

        //  customize your markup elementd(s)
        this.tagFns = {...defaultTags, ...customTags};

        // readers
        this.registerReader(tkn.LBRACE, this.parseLinkToResource);  // <a href...

        this.registerReader(tkn.HEADING, this.parseHeader);         // <hr>, <h{0-6}>

        this.registerReader(tkn.BANG, this.parseBanger);            // <img...

        this.registerReader(tkn.MINUS, this.parseMinus);
 
        this.registerReader(tkn.PLUS, this.parsePlus);
        this.registerReader(tkn.ASTERISK, this.parseAsterisk);
        this.registerReader(tkn.NUMBER, this.parseNumber);
        
        this.registerReader(tkn.UNDERSCORE, this.parseUnderscore);
        this.registerReader(tkn.TILDE, this.parseTilde);

        this.registerReader(tkn.PERIOD, this.parsePeriod);

        this.registerReader(tkn.GT, this.parseGT);

        this.registerReader(tkn.BACKTICK, this.parseBacktick);
        
        this.registerReader(tkn.PIPE, this.parsePipe);

        this.registerReader(tkn.ESCAPED, this.parseEscapedChar);
        // @note: adding the paragraph tag(s) after processing
        this.registerProcessor(this.wrapParagraphs)
    };

    // @param {string} format - mobject function name returning the result
    setFormat(format) {
        this.formatOut = format;
    }

    _unwrap(obj) {
        let res, keys;

        switch (typeof obj) {
            case 'object':
                if (typeof obj[this.formatOut] === 'function') {
                    res = obj[this.formatOut]();
                } else {
                    throw new Error(`expected function named ${this.formatOut}, got=${typeof obj[this.formatOut]}`);
                    res = "";
                }
                break;

            case 'string':
            default:
                res = obj;
                break;
        }
        return res
    }

    _parse(text, depth=0) {
        if (!this.tagFns) {
            return
        }
        let tagFns = {...this.tagFns}; 
        let p = new Parser(new Lexer(text, tagFns));
        p.setFormat(this.formatOut);
        let result = p.Parse(depth);
        return this._unwrap(result);
    }
}

/*
 * @params {string}     tokenType   - initial token type
 * @params {function}   f           - process function
 */
Parser.prototype.registerReader = function(tokenType, f) {
    this.prefixParseFns[tokenType] = f.bind(this);
}

/*
 * @params {function}   f           - post process function
 */
Parser.prototype.registerProcessor = function(f) {
    this.postProcessFns.push(f.bind(this));
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

Parser.prototype.Parse = function(depth=2) {
    let f;
    let text = '';
    let startType = this.currentToken.Type;

    while (this.currentToken.Type != tkn.EOF) {
        f = this.prefixParseFns[this.currentToken.Type];
        
        if (typeof f === 'function') {
            text += this._unwrap(f());
        } else {
            text += this.currentToken.Literal;
        }

        this.nextToken();
    }

    if (depth === 2) {
        for (let ppf of this.postProcessFns) {
            if (typeof ppf === 'function') {
                text = ppf(this._unwrap(text));
            }
        }
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
    let closer = { '[':']', '{':'}', '(':')' }[startChar];
    let depth = 0;

    if (endChar === closer) {
        depth++;
    }

    let content = this.filter(
        (token) => {
            let ok = true;
            
            if (token.Literal === startChar && endChar === closer) {
                depth++;
            }

            if (token.Literal === endChar) {
                depth--;
                ok = depth > 0;
            }
            
            return ok;
        }) || '';

    this.nextToken();

    if (this.currentToken.Literal !== endChar) {
        return startChar + content;
    }

    this.nextToken();
    
    return content;
}

Parser.prototype.escapeHTML = function(code) {
    let browserSafe = '';
    const tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };

    if (typeof code === 'string') {
        browserSafe = code.replace(/[&<>]/g, function(tag) {
            return tagsToReplace[tag] || tag;
        });
    }

    return browserSafe;
}

Parser.prototype.parseBacktick = function() {
    let lit = this.currentToken.Literal;
    this.nextToken();
    let code = this.parseUntil(lit) || '';
    
    let text = this.escapeHTML(code);

    let wrapper = this.tagFns[lit] || this.tagFns["```"];

    return wrapper({ text });
}

// todo : extract table logic into this.tagFns["table"]
Parser.prototype.parsePipe = function() {
    let row, cols, headers;
    let tbl = {header:[], rows:[], alignment:[]};
    let orig = [];
    
    while (this.currentToken.Literal === '|') {
        row = this.filter((toke) => toke.Type !== tkn.EOL) || '';
        orig.push(row);
        orig.push('\n');
        this.nextToken();
        this.nextToken();
        headers = 0;

        cols = row.split('|')
                  .filter((c) => c !== '')
                  .map((c) => {
                let align = "";
                let value = c.trim();
                switch(value.substring(0, 3)) {
                    case "---":
                        headers++;
                        align = value.endsWith(":") ? "right" : "";
                        tbl.alignment.push(align);
                        break;
                    case ":--":
                        headers++;
                        align = value.endsWith(":") ? "center" : "left";
                        tbl.alignment.push(align);
                        break;
                    default:
                        break;
                }
                
                return value;
            });

        if (headers && cols.length === headers && tbl.rows.length > 0) {
            // previous row was headers
            tbl.header.push(tbl.rows.pop());
        } else {
            tbl.rows.push(cols);
        }

        headers = 0;
    }

    let obj = { markdown: () => [...orig].join('') }

    let f = this.tagFns['table'];

    if (typeof f === 'function') {
        obj = { ...obj, html: () => f(tbl) }
    } else {
        obj = { ...obj, html: () => JSON.stringify(tbl) }
    }

    return new Mobject("table", obj);
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
    let content = [];
    
    while (this.currentToken.Literal === bq) {
        // collect 
        this.nextToken();
        if (this.currentToken.Type === tkn.WSPACE) {
            this.nextToken();
        }
        
        content.push(this.filter((token) => token.Type != tkn.EOL) || '');
        
        this.nextToken();
        
        if (this.currentToken.Type === tkn.EOL) {
            this.nextToken();
        }
    }

    let innerText = content.join('\n');
    let innerHTML = this._parse(innerText);

    let f = this.tagFns["blockquote"];

    if (typeof f === 'function') {
        return f(innerHTML);
    }

    return innerText;
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

// @returns Mobject
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

    if (text[0] === tkn.BANG && text[1] === tkn.LBRACE) {
        // image with link ?
        text = this._parse(text);
    }

    if (href[0] === tkn.LPAREN) {
        // not a link, re-wrap
        return `[${text}]${href}`;
    }

    if (typeof this.tagFns["a"] === 'function') {
        return new Mobject("a", { 
            html: () => this.tagFns["a"]({href, text}),
            markdown: () => `[${text}](${href})`
        });
    }

    return new Mobject("a", {
        html: () => `<a href="${href}">${text}</a>`,
        Markdown: () => `[${text}](${href})`
        });
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

    // todo: check tokens for horizontal rule 
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
    
    text = this._parse(text, 0);

    this.nextToken();

    if (typeof this.tagFns[tag] === 'function') {
        return this.tagFns[tag]({text});
    }

    return text;
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

    if (items.length > 0) {
        let ul = this.tagFns["ul"];
        const resolved = items.map((item) => this._parse(item, 0));
        return ul(resolved);
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

    if (items.length > 0) {
        let ol = this.tagFns["ol"];
        const resolved = items.map((item) => this._parse(item, 0));
        return ol(resolved);
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
        innerText = this._parse(input, 0);
    } else {
        innerText = input;
    }
    
    return f({ text: innerText });
}

Parser.prototype.parseEscapedChar = function() {
    let lit  = this.currentToken.Literal;
    return this.escapeHTML(lit.slice(1)); 
}

Parser.prototype.readElementName = function(text) {
    // identify first tag in text
    let start = text.indexOf('<');
    let end = text.indexOf('>');
    return text.substring(start + 1, end);
}

Parser.prototype.wrapParagraphs = function(text) {
    if (this.formatOut !== 'html') {
        console.log(this.formatOut);
        return text; 
    }
    let result = [];
    let inParagraph = false;
    let skipProcess = false;
    let eols = 0;
    
    let lines = [...text.replaceAll('\r', '\n').split('\n')];
    let inElement;
    
    for (let line of lines) {
               
        if (inElement) {
            // check for the closing tag
            let s = (line.indexOf(inElement) -1) || 0;
            if (line.substring(s).startsWith(`/${inElement}>`)) {
                skipProcess = true;
                inElement = null;
                result.push(line);
            }
        }

        if (!skipProcess) {
            switch(line[0]) {
                case tkn.LT:
                    // element
                    if (inParagraph) {
                        result.push('</p>');
                        inParagraph = false;
                    }
                    result.push(line);
                    inElement = this.readElementName(line);
                    if (line.includes(`</${inElement}>`)) {
                        inElement = null;
                    }
                    eols = 0;
                    break;
                    
                case undefined:
                    // blank line
                    eols++;
                    break;

                default:
                    
                    if (eols > 1 && inParagraph) {
                        result.push('</p>');
                        eols = 0;
                        inParagraph = false;
                    }

                    if (!inParagraph) {
                        result.push('<p>');
                        inParagraph = true;
                    } else {
                        for (let i = 0; i <= eols; i++) {
                            result.push('<br>');
                        }
                    }

                    result.push(line);
            }
        }
    
        skipProcess = false;
    }

    if (inParagraph) {
        // close the paragraph if we haven't done so
        result.push('</p>');
    }

    return result.join('\n'); 
}

module.exports = Parser;

