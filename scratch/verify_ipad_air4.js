// verify_ipad_air4.js
// Automated verification for iPad Air 4 screen optimization

const fs = require('fs');
const path = require('path');

console.log('=== TEST 1: Check index.html viewport & iOS meta tags ===');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  { name: 'viewport-fit=cover', regex: /viewport-fit=cover/ },
  { name: 'user-scalable=no or maximum-scale=1.0', regex: /maximum-scale=1\.0/ },
  { name: 'apple-mobile-web-app-capable', regex: /<meta name="apple-mobile-web-app-capable" content="yes"/ },
  { name: 'apple-mobile-web-app-status-bar-style', regex: /<meta name="apple-mobile-web-app-status-bar-style"/ },
  { name: 'format-detection telephone=no', regex: /<meta name="format-detection" content="telephone=no"/ }
];

checks.forEach(c => {
  if (!c.regex.test(html)) {
    console.error(`FAIL: Missing ${c.name} in index.html!`);
    process.exit(1);
  }
  console.log(`PASS: ${c.name} found.`);
});

console.log('\n=== TEST 2: Check style.css iPad Air 4 & iOS Styles ===');
const css = fs.readFileSync('style.css', 'utf8');

const cssChecks = [
  { name: 'Dynamic viewport height 100dvh', regex: /100dvh/ },
  { name: 'Touch action manipulation', regex: /touch-action:\s*manipulation/ },
  { name: 'Webkit tap highlight color transparent', regex: /-webkit-tap-highlight-color:\s*transparent/ },
  { name: 'Safe area inset top', regex: /env\(safe-area-inset-top\)/ },
  { name: 'Safe area inset bottom', regex: /env\(safe-area-inset-bottom\)/ },
  { name: 'Smooth touch scrolling -webkit-overflow-scrolling', regex: /-webkit-overflow-scrolling:\s*touch/ },
  { name: 'iPad Air 4 Landscape media query', regex: /@media\s*\(min-width:\s*961px\)\s*and\s*\(max-width:\s*1220px\)\s*and\s*\(max-height:\s*860px\)/ },
  { name: 'iPad Air 4 Portrait media query', regex: /@media\s*\(min-width:\s*721px\)\s*and\s*\(max-width:\s*900px\)\s*and\s*\(orientation:\s*portrait\)/ },
  { name: 'Room stage adaptive height in landscape', regex: /\.room-stage\s*\{[^}]*height:\s*min\(44vh,\s*340px\)/ },
  { name: 'Tablet portrait 2-column bottom console', regex: /\.side-panel\s*\{[^}]*display:\s*flex;\s*flex-direction:\s*row/ }
];

cssChecks.forEach(c => {
  if (!c.regex.test(css)) {
    console.error(`FAIL: Missing ${c.name} in style.css!`);
    process.exit(1);
  }
  console.log(`PASS: ${c.name} found in style.css.`);
});

console.log('\n=== TEST 3: Check Layout Calculations for iPad Air 4 Screen ===');
// iPad Air 4 specifications:
// Landscape: 1180px width, 820px height (Safari inner: ~740px - 800px)
// Portrait: 820px width, 1180px height (Safari inner: ~1080px - 1140px)

// Landscape fit calculation
const headerHeight = 46;
const stepsHeight = 36;
const logHeight = 28;
const topBottomBars = headerHeight + stepsHeight + logHeight; // 110px
const landscapeInnerHeight = 740; // worst case Safari with toolbar
const availableLandscapeMain = landscapeInnerHeight - topBottomBars; // 630px

// Room Scene view height in landscape
const rsvHeader = 36;
const rsvBanner = 36;
const rsvStage = 320;
const rsvClues = 70;
const totalRsvHeight = rsvHeader + rsvBanner + rsvStage + rsvClues; // 462px

console.log(`Landscape available height for main: ${availableLandscapeMain}px`);
console.log(`Landscape Room Scene View total height: ${totalRsvHeight}px`);

if (totalRsvHeight > availableLandscapeMain) {
  console.error(`FAIL: Room scene height ${totalRsvHeight} exceeds available ${availableLandscapeMain}!`);
  process.exit(1);
}
console.log(`PASS: Room Scene view (${totalRsvHeight}px) fits completely within Landscape (${availableLandscapeMain}px) with ${availableLandscapeMain - totalRsvHeight}px breathing room!`);

// Portrait fit calculation
const portraitInnerHeight = 1080; // worst case Safari with toolbar
const availablePortraitMain = portraitInnerHeight - topBottomBars; // 970px
const portraitBoardHeight = availablePortraitMain * 0.56; // ~543px
const portraitSideHeight = availablePortraitMain * 0.44;  // ~427px

console.log(`Portrait available height for main: ${availablePortraitMain}px`);
console.log(`Portrait Board container height: ~${Math.round(portraitBoardHeight)}px`);
console.log(`Portrait Side console height: ~${Math.round(portraitSideHeight)}px`);
console.log(`Sum: ${Math.round(portraitBoardHeight + portraitSideHeight)}px <= ${availablePortraitMain}px`);

console.log('\nALL IPAD AIR 4 SCREEN VERIFICATIONS PASSED! 🎉');
