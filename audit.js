const fs = require('fs');
const html = fs.readFileSync('lockin-landing.html', 'utf8');

const imgMissingAlt = Array.from(html.matchAll(/<img([^>]*)>/g))
    .filter(m => !m[1].includes('alt='))
    .map(m => m[0]);

const btnMissingAria = Array.from(html.matchAll(/<button([^>]*)>(.*?)<\/button>/gs))
    .filter(m => !m[1].includes('aria-label=') && !m[2].match(/[a-zA-Z]/))
    .map(m => m[0]);

const linkMissingAria = Array.from(html.matchAll(/<a([^>]*)>(.*?)<\/a>/gs))
    .filter(m => !m[1].includes('aria-label=') && (!m[2] || !m[2].match(/[a-zA-Z]/)))
    .map(m => m[0]);

const ids = Array.from(html.matchAll(/id="([^"]+)"/g)).map(m => m[1]);
const dupIds = ids.filter((e, i, a) => a.indexOf(e) !== i);

console.log(JSON.stringify({
    imgMissingAlt: imgMissingAlt.length > 0 ? imgMissingAlt : 'None',
    btnMissingAria: btnMissingAria.length > 0 ? btnMissingAria : 'None',
    linkMissingAria: linkMissingAria.length > 0 ? linkMissingAria : 'None',
    dupIds: [...new Set(dupIds)]
}, null, 2));
