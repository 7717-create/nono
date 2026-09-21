const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('./js/scenarios.js', 'utf8');
const result = vm.runInNewContext(code + '\n;({ SCENARIOS, DEFAULT_ROOM_CLUES, FORGED_CLUES_LIST });', {
  window: {},
  console: console
});

const SCENARIOS = result.SCENARIOS;
const DEFAULT_ROOM_CLUES = result.DEFAULT_ROOM_CLUES;
const FORGED_CLUES_LIST = result.FORGED_CLUES_LIST;

const suspects = [
  'สคาร์เล็ต', 'สการ์เลต', 'Scarlett',
  'มัสตาร์ด', 'Mustard',
  'ไวท์', 'White',
  'กรีน', 'Green',
  'พีค็อก', 'Peacock',
  'พลัม', 'Plum'
];

let leakCount = 0;

function checkText(txt, loc) {
  if (!txt) return;
  for (const s of suspects) {
    const patterns = [
      'ของ' + s,
      'ของมิส ' + s,
      'ของแม่บ้าน ' + s,
      'ของศาสตราจารย์ ' + s,
      'ของพันเอก ' + s,
      'ของบาทหลวง ' + s,
      'ของท่านผู้หญิง ' + s,
      'ที่ป้ายความผิดให้' + s,
      'ป้ายความผิดให้' + s,
      'ของ' + s.toLowerCase()
    ];
    for (const pat of patterns) {
      if (txt.includes(pat)) {
        console.log(`[LEAK] in ${loc}: "${txt}" (matches "${pat}")`);
        leakCount++;
      }
    }
  }
}

console.log(`Checking ${SCENARIOS.length} scenarios...`);
SCENARIOS.forEach(s => {
  (s.specialClues || []).forEach(c => {
    checkText(c.title, `scenario ${s.id} specialClue title`);
    checkText(c.revealTitle, `scenario ${s.id} specialClue revealTitle`);
    checkText(c.revealDesc, `scenario ${s.id} specialClue revealDesc`);
  });
  (s.subtleKillerClues || []).forEach(c => {
    checkText(c.title, `scenario ${s.id} subtleKillerClues title`);
    checkText(c.revealTitle, `scenario ${s.id} subtleKillerClues revealTitle`);
    checkText(c.revealDesc, `scenario ${s.id} subtleKillerClues revealDesc`);
  });
});

if (DEFAULT_ROOM_CLUES) {
  Object.entries(DEFAULT_ROOM_CLUES).forEach(([room, clist]) => {
    clist.forEach(c => {
      checkText(c.title, `DEFAULT_ROOM_CLUES [${room}] title`);
      checkText(c.revealTitle, `DEFAULT_ROOM_CLUES [${room}] revealTitle`);
      checkText(c.revealDesc, `DEFAULT_ROOM_CLUES [${room}] revealDesc`);
    });
  });
}

if (FORGED_CLUES_LIST) {
  FORGED_CLUES_LIST.forEach(c => {
    checkText(c.title, `FORGED_CLUES_LIST title`);
    checkText(c.revealTitle, `FORGED_CLUES_LIST revealTitle`);
    checkText(c.revealDesc, `FORGED_CLUES_LIST revealDesc`);
  });
}

console.log(`\n>>> Total clue leaks found: ${leakCount} <<<`);
