module.exports = {
    h1: ({text}) => `<h1>${text}</h1>\n`,
    h2: ({text}) => `<h2>${text}</h2>\n`,
    h3: ({text}) => `<h3>${text}</h3>\n`,
    h4: ({text}) => `<h4>${text}</h4>\n`,
    h5: ({text}) => `<h5>${text}</h5>\n`,
    h6: ({text}) => `<h6>${text}</h6>\n`,
    hr: () => '<hr>',
    emphasis: {
        "**": ({text}) => `<strong>${text}</strong>`,
        "__": ({text}) => `<strong>${text}</strong>`,
        "*": ({text}) => `<em>${text}</em>`,
        "_": ({text}) => `<em>${text}</em>`,
        "~~": ({text}) => `<s>${text}</s>`, 
    },
};

