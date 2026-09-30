const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.onerror = function(message, source, lineno, colno, error) {
    console.log("Error:", message);
    if(error) console.log(error.stack);
};

dom.window.addEventListener('load', () => {
    console.log("Loaded successfully");
    console.log("Main innerHTML length:", dom.window.document.querySelector('main').innerHTML.length);
    console.log("Classes on view-home:", dom.window.document.getElementById('view-home').className);
});
