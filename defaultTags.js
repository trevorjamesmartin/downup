module.exports = {
    table: ({header, rows, alignment}) => {
        let html = '<table>';
        if (header.length > 0 && header[0].length > 0) {
            let hd = header.shift();
            html += '<thead><tr>';
            let idx = 0;
            for (let item of hd) {
                let aln = alignment[idx] ? ` style="text-align: ${alignment[idx]};" ` : '';
                html += `<th${aln}>${item}</th>`;
                idx++
            }
            html += '</tr></thead>';
        }
        if (rows.length > 0) {
            html +=  '<tbody>';
            for (let row of rows) {
                html += '<tr>';
                let idx = 0;
                for (let item of row) {
                    let aln = alignment[idx] ? ` style="text-align: ${alignment[idx]};" ` : '';
                    html += `<td${aln}>${item}</td>`;
                    idx++;
                }
                html += '</tr>';
            }
            html += '</tbody>';
        }
        html += '</table>';
        return html + '\n';
    },
    h1: ({text}) => `<h1>${text}</h1>\n`,
    h2: ({text}) => `<h2>${text}</h2>\n`,
    h3: ({text}) => `<h3>${text}</h3>\n`,
    h4: ({text}) => `<h4>${text}</h4>\n`,
    h5: ({text}) => `<h5>${text}</h5>\n`,
    h6: ({text}) => `<h6>${text}</h6>\n`,
    hr: () => '<hr>',
    img: ({src, alt}) => `<img src="${src}" alt="${alt || ''}"></img>`,
    emphasis: {
        "**": ({text}) => `<strong>${text}</strong>`,
        "__": ({text}) => `<strong>${text}</strong>`,
        "*": ({text}) => `<em>${text}</em>`,
        "_": ({text}) => `<em>${text}</em>`,
        "~~": ({text}) => `<s>${text}</s>`, 
    },

    ol: (items) => {
        let listElements = items?.map((i) => `<li>${i}</li>`).join('\n')
        return `<ol>${listElements}</ol>`;
    },

    ul: (items) => {
        let listElements = items?.map((i) => `<li>${i}</li>`).join('\n')
        return `<ul>${listElements}</ul>`;
    },

    blockquote: (html) => `<blockquote>${html}</blockquote>`,
    
    codeblock: ({text}) => `<pre><code>${text}</code></pre>`,


};

