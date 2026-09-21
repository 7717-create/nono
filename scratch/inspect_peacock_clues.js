const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('./js/scenarios.js', 'utf8');
const result = vm.runInNewContext(code + '\n;({ SCENARIOS, DEFAULT_ROOM_CLUES, FORGED_CLUES_LIST });', {
  window: {},
  console: console
});

const SCENARIOS = result.SCENARIOS;

console.log('--- Inspecting Peacock scenarios clues ---');
SCENARIOS.filter(s => s.applicableKiller === 'peacock').forEach(s => {
  console.log(`\nScenario ${s.id}: ${s.title}`);
  s.specialClues.forEach(c => {
    console.log(`  Special Clue: [${c.roomId}] "${c.title}" | "${c.revealTitle}" | "${c.revealDesc}"`);
  });
  (s.subtleKillerClues || []).forEach(c => {
    console.log(`  Subtle Clue: "${c.title}" | "${c.revealTitle}" | "${c.revealDesc}"`);
  });
});
