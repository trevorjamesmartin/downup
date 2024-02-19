// Markdown Object
class Mobject {
    // @param {string} type - Markdown Object Type
    // @param {object} obj  - map of functions
    constructor(type, obj) {
        this.type = type;
        
        // loosey goosey attr injection...
        for (let key of Object.keys(obj)) {
            if (typeof obj[key] === 'function') {
                this[key] = obj[key].bind(this);
            } else {
                this[key] = obj[key];
            }
        }
    }
}

Mobject.prototype.markdown = function() {
    return `[${this.type}] markdown : ${JSON.stringify(this.obj)}`;
}

Mobject.prototype.html = function() {
    return `[${this.type}] html : ${JSON.stringify(this.obj)}`;
}

module.exports = Mobject;

