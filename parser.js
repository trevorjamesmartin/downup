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
        this.postProcessFns = {};

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

        // @note: adding the paragraph tag(s) after processing
        this.registerProcessor(tkn.CONTENT, this.wrapParagraphs)
    };

    _parse(text, pass=1) {
        if (!this.tagFns) {
            return
        }
        let tagFns = {...this.tagFns}; 
        let p = new Parser(new Lexer(text, tagFns));
        return p.Parse(pass);
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
 * @params {string}     tokenType   - initial token type
 * @params {function}   f           - post process function
 */
Parser.prototype.registerProcessor = function(tokenType, f) {
    this.postProcessFns[tokenType] = f.bind(this);
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
    let postprocess = this.postProcessFns[startType];

    while (this.currentToken.Type != tkn.EOF) {
        f = this.prefixParseFns[this.currentToken.Type];
        
        if (typeof f === 'function') {
            text += f();
        } else {
            text += this.currentToken.Literal;
        }

        this.nextToken();
    }

    if (depth === 2 && typeof postprocess === 'function') {
        text = postprocess(text);
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
    
    let plaintext = this.escapeHTML(code);

    let wrapper = this.tagFns[lit] || this.tagFns["```"];

    return wrapper(plaintext);
}

// todo : extract table logic into this.tagFns["table"]
Parser.prototype.parsePipe = function() {
    let row, cols, headers;
    let tbl = {header:[], rows:[]};
    let alignment = [];

    while (this.currentToken.Literal === '|') {
        row = this.filter((toke) => toke.Type !== tkn.EOL) || '';
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
                        alignment.push(align);
                        break;
                    case ":--":
                        headers++;
                        align = value.endsWith(":") ? "center" : "left";
                        alignment.push(align);
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

    let head = '';

    function getAlignment(idx) {
        let aln = alignment[idx] || "";
        if (aln.length > 0) {
            aln = ` style="text-align: ${alignment[idx]};" `
        }
        return aln;
    }

    if (tbl.header.length > 0) {
        let arr = tbl.header[0];
        head += '<thead><tr>';
        head += arr.map((c, idx) => {
            return `<th${getAlignment(idx)}>${this._parse(this.escapeHTML(c), 0)}</th>`;
        }).join('');
        
        head += '</tr></thead>';
    }

    let body = '';

    if (tbl.rows.length > 0) {
        
        body += '<tbody>';

        for (let bRow of tbl.rows) {
            body += '<tr>';
            body += bRow.map((c, idx) =>{
                return `<td${getAlignment(idx)}>${ this._parse( this.escapeHTML(c), 0)}</td>`
            }).join('');
            body += '</tr>';
        }
        body += '</tbody>';
    }

    let result = `<table>${head}${body}</table>`;

    return result;
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

    // no rewind ? 
    //return `> ${quotes.join('\n' + bq)}`;
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

    if (text[0] === tkn.BANG && text[1] === tkn.LBRACE) {
        // image with link ?
        text = this._parse(text);
    }

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
        // return your flavor
        return this.tagFns[tag]({text});
    }

    return text;
    // return vanilla HTML
    //return `<${tag}>${text}</${tag}>\n`;
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

Parser.prototype.wrapParagraphs = function(text) {
    let result = '<p>';

    let eols = 0;
    let lines = text.replaceAll('\r', '\n').split('\n');

    for (let line of lines) {
        if (line.length === 0) {
            eols++;
        } else {

            if (eols === 1) {
                result += '<br>';
                eols = 0;
            } else if (eols > 1) {
                // trailing whitespace === separation of paragraphs
                result += '</p><p>';
                eols = 0;
            }

            result += line;
        }
    }

    if (result.endsWith('</p><p>')) {
        result = result.slice(0, -3);
    }

    if (!result.endsWith('</p>')) {
        result += '</p>';
    }

    return result; 
}

module.exports = Parser;

