# downup

zero dependency markdown parsing

## Description

The practical use of markdown as intermediary language bewteen client and application to prevent malicious code from reaching critical systems can be readily observed on most modern distributed version control systems. Given the right context, its a pattern worth repeating. 

_feel free to fork the repo_

## Acknowledgements

This library is a work in progress with current efforts aiming to meet the [commonmark spec](https://spec.commonmark.org/). Any 


## Getting Started

- this was primarily written for the frontend code
- it assumes nothing about the quality of your code

Download or clone the repo

`git clone https://github.com/trevorjamesmartin/downup.git`

Build the ECMAScript module

`cd ./downup
npm install
npm build`
this generates a file named './vendor.mjs'

## Usage

_import the ECMAScript module_

`const { default: downup } = await import("/vendor.mjs");`

_write your wrapper function_

```function toHTML(markdown) {
    let lexer = new downup.Lexer(markdown);
    let parser = new downup.Parser(lexer);
    let html = parser.Parse();
    return html;
}

let input = "# Hello dragon";

console.log(input);
// # Hello dragon

console.log(toHTML(input));
// <h1>Hello dragon</h1>
```
#

_(optional)_ to override the default tags
```
    ...
    let parser = new downup.Parser(lexer, {
        h1:({text}) => bespokeHeadline(text),
        h2:({text}) => bespokeSubtitle(text),
    });
    ...
```

for the input parameters expected, see [defaultTags.js](./defaultTags.js)
at the most basic level, tag functions return a string

