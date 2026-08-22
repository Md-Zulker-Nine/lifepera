const fs = require('fs');
const path = require('path');
const blogDir = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
let fixedCount = 0;
let strayACount = 0;
let cookieBarCount = 0;
let cookieJSCount = 0;

files.forEach(file => {
  const filePath = path.join(blogDir, file);
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;

  // FIX 1: Remove stray </a> between CTA closing div and related-tools
  const strayAMatch = c.match(/<\/div>\s*\n<\/a>\s*\n\s*\n\s*<div class="related-tools">/);
  if (strayAMatch) {
    c = c.replace(/<\/div>\s*\n<\/a>\s*\n\s*\n\s*<div class="related-tools">/g, '</div>\n\n<div class="related-tools">');
    strayACount++;
  }

  // FIX 2: Remove inline cookie bar HTML
  const cookieBarMatch = c.match(/<div class="cookie-bar" id="cookieBar">[\s\S]*?<\/div>\s*<\/div>\s*\n/);
  if (cookieBarMatch) {
    c = c.replace(/<div class="cookie-bar" id="cookieBar">[\s\S]*?<\/div>\s*<\/div>\s*\n/g, '');
    cookieBarCount++;
  }

  // FIX 3: Remove inline cookie JS (function acceptCookies + IIFE)
  const cookieJSMatch = c.match(/function acceptCookies\(\)\{[\s\S]*?localStorage\.setItem\('cookiesAccepted','true'\)\}/);
  if (cookieJSMatch) {
    c = c.replace(/function acceptCookies\(\)\{[\s\S]*?localStorage\.setItem\('cookiesAccepted','true'\)\}/g, '');
    cookieJSCount++;
  }

  // Remove the IIFE cookie check
  c = c.replace(/\(function\(\)\{if\(!localStorage\.getItem\('cookiesAccepted'\)\)document\.getElementById\('cookieBar'\)\.style\.display='block'\}\)\(\);?\s*/g, '');

  // Remove empty script tags left behind
  c = c.replace(/<script>\s*<\/script>/g, '');

  if (c !== orig) {
    fs.writeFileSync(filePath, c, 'utf8');
    fixedCount++;
  }
});

console.log('Processed ' + files.length + ' blog posts');
console.log('Fixed stray </a>: ' + strayACount);
console.log('Removed cookie bar HTML: ' + cookieBarCount);
console.log('Removed cookie JS: ' + cookieJSCount);
console.log('Files modified: ' + fixedCount);
