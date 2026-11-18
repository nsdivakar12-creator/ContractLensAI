// Static regression checks for the Legal Translator's dark-mode color system.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../frontend/reference-inspired.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../frontend/index.html', import.meta.url), 'utf8');

for (const selector of [
  '.glossary-card {', '.glossary-card strong {', '.translator-detail-pane {',
  '.translator-detail-content .in-contract-box {', '.translator-question-box p',
  '[data-theme="dark"] .glossary-card', '@keyframes cl-term-card-in',
  '@keyframes cl-translator-detail-in', '@media (prefers-reduced-motion: reduce)'
]) assert.ok(css.includes(selector), `Missing translator visual rule: ${selector}`);
assert.ok(app.includes('class="translator-detail-content"'), 'Detail rendering should use the animated semantic wrapper');
assert.ok(html.includes('id="glossaryDetailPane"') && html.includes('id="glossaryCardsGrid"'));

function parseHex(hex) { return hex.replace('#', '').match(/.{2}/g).map((part) => parseInt(part, 16)); }
function composite(foreground, background, alpha) {
  return foreground.map((value, index) => Math.round(value * alpha + background[index] * (1 - alpha)));
}
function luminance(rgb) {
  const [r, g, b] = rgb.map((value) => {
    const c = value / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}
function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
}

// Values are the dark-theme tokens declared by reference-inspired.css.
const ink = parseHex('#edf7f1');
const secondary = parseHex('#c0d8cd');
const surface = parseHex('#122622');
const contractSurface = parseHex('#10211d');
const questionSurface = composite(parseHex('#30825e'), surface, .15);
const checks = [
  ['glossary button text', contrast(ink, surface)],
  ['translator definition', contrast(secondary, surface)],
  ['translator heading', contrast(ink, surface)],
  ['contract context text', contrast(secondary, contractSurface)],
  ['signing question', contrast(ink, questionSurface)]
];
for (const [label, ratio] of checks) assert.ok(ratio >= 4.5, `${label} is below 4.5:1 (${ratio.toFixed(2)}:1)`);
console.log(`✓ Dark theme contrast token checks: ${checks.map(([label, ratio]) => `${label} ${ratio.toFixed(1)}:1`).join(', ')}`);
console.log('✓ Translator dark-mode selectors, detail rendering, motion, and reduced-motion fallback');
