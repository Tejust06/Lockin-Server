const fs = require('fs');
const file = 'c:/Users/Tejas/OneDrive/Desktop/Antigravity/locking/lockin-landing.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/108,\s*92,\s*231/g, '167, 139, 250');
content = content.replace(/190,\s*250,\s*40/g, '96, 165, 250');
content = content.replace(/255,\s*189,\s*46/g, '255, 255, 255');
content = content.replace(/#FFBD2E/gi, '#FFFFFF');
content = content.replace(/34,\s*197,\s*94/g, '96, 165, 250');
content = content.replace(/#22C55E/gi, '#60A5FA');

const btnRegex = /<button id="theme-toggle"[\s\S]*?<\/button>/g;
content = content.replace(btnRegex, '');

fs.writeFileSync(file, content);
console.log("Colors and button fixed.");
