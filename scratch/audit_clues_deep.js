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

console.log('=== DEEP AUDIT OF CLUE STRINGS IN scenarios.js ===');
let leaks = [];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  const trimmed = line.trim();
  
  // Exclude scenario level headers/story, focus on clue definitions
  // Scenario headers: applicableKiller, introStory, killerBriefing, id: "scarlett_...", title: "คดีที่..."
  const isScenarioHeader = trimmed.startsWith('applicableKiller:') ||
                           trimmed.startsWith('introStory:') ||
                           trimmed.startsWith('killerBriefing:') ||
                           trimmed.startsWith('targetSuspectName:') ||
                           trimmed.startsWith('targetSuspectId:') ||
                           (trimmed.startsWith('title:"คดีที่') || trimmed.startsWith('title: "คดีที่'));

  if (!isScenarioHeader) {
    for (const s of suspects) {
      if (line.includes(s)) {
        leaks.push({ lineNum, s, line: trimmed });
      }
    }
  }
});

console.log(`Found ${leaks.length} suspect occurrences outside scenario headers:`);
leaks.forEach(l => {
  console.log(`Line ${l.lineNum} [${l.s}]: ${l.line}`);
});
