const fs = require('fs');

const content = fs.readFileSync('./js/scenarios.js', 'utf8');
const lines = content.split('\n');

const suspects = [
  'สคาร์เล็ต', 'สการ์เลต', 'Scarlett',
  'มัสตาร์ด', 'Mustard',
  'ไวท์', 'White',
  'กรีน', 'Green',
  'พีค็อก', 'Peacock',
  'พลัม', 'Plum'
];

console.log('--- Scanning scenarios.js for ANY suspect name in clues ---');
let inClue = false;
let currentScenario = '';

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (line.includes('id: "') && line.includes('{')) {
    currentScenario = line.trim();
  }
  
  // Only check clue fields (title, revealTitle, revealDesc, wipedText)
  const isClueField = line.includes('title:') || line.includes('revealTitle:') || line.includes('revealDesc:') || line.includes('wipedText:');
  
  if (isClueField) {
    for (const s of suspects) {
      if (line.includes(s)) {
        console.log(`Line ${lineNum} [${currentScenario}]: ${line.trim()}`);
      }
    }
  }
});
