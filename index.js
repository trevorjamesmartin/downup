const {Lexer} = await import("./lexer.js");
const {Parser} = await import("./parser.js");
    
function MarkdownUp(markdown) {
    const down = markdown;
    const up = new Parser(new Lexer(markdown)).Parse();
    return {down, up}
}

export {MarkdownUp}


