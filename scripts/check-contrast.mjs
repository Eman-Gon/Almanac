#!/usr/bin/env node
// Verifies the Cold Chain palette in app/globals.css meets WCAG AA.
//
// The palette is a ramp, not a set of semantics, so this script cannot infer
// which pairs matter — the PAIRS table below encodes the combinations the UI
// actually renders. Add a row whenever a token starts being used against a new
// ground. Run: npm run check:contrast

import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));

const tokens = new Map();
for (const [, name, value] of root.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens.set(name, value);
}

const srgbToLinear = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => srgbToLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [ink, ground, minimum, why]
// 4.5 = AA body text. 3.0 = AA large text / UI component boundary.
const PAIRS = [
  ["slate-950", "white", 4.5, "headings on panel"],
  ["slate-900", "white", 4.5, "primary ink on panel"],
  ["slate-800", "white", 4.5, "body ink on panel"],
  ["slate-700", "white", 4.5, "body ink on panel"],
  ["slate-600", "white", 4.5, "muted ink on panel"],
  ["slate-500", "white", 4.5, "soft ink on panel"],
  ["slate-900", "slate-100", 4.5, "primary ink on ground"],
  ["slate-600", "slate-100", 4.5, "muted ink on ground"],
  ["slate-600", "slate-50", 4.5, "muted ink on sunken"],
  ["blue-700", "white", 4.5, "link / accent ink"],
  ["blue-600", "white", 4.5, "accent ink"],
  ["white", "blue-600", 4.5, "label on primary button"],
  ["white", "red-600", 4.5, "label on danger button"],
  ["white", "navy-950", 4.5, "nav label on rail"],
  ["green-700", "white", 4.5, "ok ink"],
  ["green-700", "green-100", 4.5, "ok chip"],
  ["green-600", "white", 4.5, "ok ink"],
  ["amber-700", "white", 4.5, "warn ink"],
  ["amber-700", "amber-100", 4.5, "warn chip"],
  ["amber-600", "white", 4.5, "warn ink"],
  ["red-700", "white", 4.5, "risk ink"],
  ["red-700", "red-100", 4.5, "risk chip"],
  ["red-600", "white", 4.5, "risk ink"],
  ["purple-600", "white", 4.5, "note ink"],
  ["purple-600", "purple-100", 4.5, "note chip"],
  ["blue-700", "blue-100", 4.5, "info chip"],
  ["slate-300", "white", 1.4, "hairline against panel"],
  ["blue-500", "white", 3.0, "focus ring"],
];

let failed = 0;
const rows = PAIRS.map(([ink, ground, min, why]) => {
  const inkHex = tokens.get(ink);
  const groundHex = tokens.get(ground);
  if (!inkHex || !groundHex) {
    failed++;
    return `  MISSING  --${ink} on --${ground} (token not found)`;
  }
  const value = ratio(inkHex, groundHex);
  const ok = value >= min;
  if (!ok) failed++;
  return `  ${ok ? "pass" : "FAIL"}  ${value.toFixed(2).padStart(5)}:1  (min ${min})  --${ink} on --${ground}  · ${why}`;
});

console.log("Cold Chain contrast · WCAG AA\n");
console.log(rows.join("\n"));
console.log(`\n${PAIRS.length - failed}/${PAIRS.length} pass`);

// Focus indicators must reach 3:1 against their background (WCAG 2.2 SC 1.4.11).
// A translucent ring composites toward the ground and silently loses contrast —
// rgba(13,110,140,0.38) measured 1.79:1 on white while every token pair above
// still passed. Checking tokens alone cannot catch that, so scan the declared
// rings for alpha and fail on sight.
const alphaRings = [];
for (const [, rule] of css.matchAll(/([^{}]*:focus-visible[^{}]*\{[^}]*\})/g)) {
  for (const [, prop, alpha] of rule.matchAll(/(outline|box-shadow)\s*:[^;]*rgba\([^)]*?,\s*(0?\.\d+)\s*\)/g)) {
    const selector = rule.slice(0, rule.indexOf("{")).trim().replace(/\s+/g, " ");
    alphaRings.push(`  FAIL  ${selector} — ${prop} uses rgba alpha ${alpha}; use a solid token`);
  }
}

console.log("\nFocus indicators · WCAG 2.2 SC 1.4.11 (no translucent rings)");
console.log(alphaRings.length ? alphaRings.join("\n") : "  pass  no :focus-visible ring uses rgba alpha");

if (failed > 0 || alphaRings.length > 0) {
  if (failed > 0) console.error(`\n${failed} pair(s) below minimum. Re-point the token or justify the exception.`);
  if (alphaRings.length > 0) console.error(`\n${alphaRings.length} translucent focus ring(s). Solid rings only.`);
  process.exit(1);
}
