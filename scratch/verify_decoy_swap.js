// verify_decoy_swap.js
// Automated verification for:
// 1. Choosing between crucial framing clues vs neutral decoy clues
// 2. Swapped blood drop marker turning into '?' on crime scene & UI updating to safe

const fs = require('fs');
const vm = require('vm');

// Mock DOM
class MockElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    const self = this;
    this._classes = new Set();
    this.classList = {
      add: (...classes) => classes.forEach(c => self._classes.add(c)),
      remove: (...classes) => classes.forEach(c => self._classes.delete(c)),
      contains: (c) => self._classes.has(c),
      has: (c) => self._classes.has(c)
    };
    this.children = [];
    this.dataset = {};
    this.style = {};
    this._innerHTML = '';
    this.textContent = '';
    this.title = '';
    this.src = '';
    this.disabled = false;
    this.parentNode = null;
  }
  get className() {
    return Array.from(this._classes).join(' ');
  }
  set className(val) {
    this._classes = new Set(val.split(' ').filter(Boolean));
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
    }
  }
  get outerHTML() {
    return `<${this.tagName.toLowerCase()} class="${this.className}">${this.innerHTML}</${this.tagName.toLowerCase()}>`;
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  addEventListener(event, fn) {}
  replaceChild(newChild, oldChild) {
    const idx = this.children.indexOf(oldChild);
    if (idx !== -1) {
      newChild.parentNode = this;
      this.children[idx] = newChild;
    }
    return oldChild;
  }
  cloneNode(deep = true) {
    const clone = new MockElement(this.tagName, this.id);
    clone._classes = new Set(this._classes);
    clone.style = { ...this.style };
    clone._innerHTML = this._innerHTML;
    clone.textContent = this.textContent;
    clone.title = this.title;
    clone.src = this.src;
    return clone;
  }
}

const domElements = {};
const document = {
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = new MockElement('div', id);
    return domElements[id];
  },
  createElement: (tag) => new MockElement(tag),
  addEventListener: (event, fn) => {}
};

// Setup sandbox
const sandbox = {
  document,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date,
  renderDossier: () => {},
  updateTurnStepBar: () => {},
  setEndTurnBtnState: () => {},
  addLog: () => {},
  updateGuideBanner: () => {},
  triggerFinalAccusationVote: () => {},
  showEvidenceRevealModal: () => {},
  showKillerActionModal: () => {}
};

vm.createContext(sandbox);

// Load required JS files
const files = [
  './js/cards.js',
  './js/scenarios.js',
  './js/board.js',
  './js/game.js'
];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInContext(code, sandbox);
});

console.log('=== TEST 1: Check FORGED_CLUES_LIST categories ===');
const list = vm.runInContext('FORGED_CLUES_LIST', sandbox);
console.log(`Total forged clues: ${list.length}`);
const crucialClues = list.filter(c => c.category === 'crucial');
const neutralClues = list.filter(c => c.category === 'neutral');
console.log(`Crucial framing clues: ${crucialClues.length} (expected 18)`);
console.log(`Neutral decoy clues: ${neutralClues.length} (expected 8)`);

if (crucialClues.length !== 18 || neutralClues.length !== 8) {
  console.error('FAIL: Decoy count mismatch!');
  process.exit(1);
}

// Check every crucial clue has targetSuspectId and isCritical: true
crucialClues.forEach(c => {
  if (!c.targetSuspectId || !c.targetSuspectName || c.isCritical !== true) {
    console.error(`FAIL: Crucial clue invalid:`, c);
    process.exit(1);
  }
});
console.log('PASS: All crucial clues have isCritical: true and target suspect!');

// Check neutral clues have isCritical: false
neutralClues.forEach(c => {
  if (c.isCritical !== false) {
    console.error(`FAIL: Neutral clue invalid:`, c);
    process.exit(1);
  }
});
console.log('PASS: All neutral clues have isCritical: false!');

console.log('\n=== TEST 2: isClueCrucialForKiller before and after swap ===');
const SCENARIOS = vm.runInContext('SCENARIOS', sandbox);
const scenario = SCENARIOS[0];
const killerSuspectId = scenario.killerSuspectId;
const specialClue = scenario.specialClues[0];

const clueObj = {
  ...specialClue,
  isKillerEvidence: true,
  canBeWiped: true,
  wiped: false,
  inspected: false
};

const isClueCrucialForKiller = vm.runInContext('isClueCrucialForKiller', sandbox);

// Before swap
const beforeSwapCrucial = isClueCrucialForKiller(clueObj, scenario);
console.log(`Before swap - isClueCrucialForKiller: ${beforeSwapCrucial} (expected true)`);
if (beforeSwapCrucial !== true) {
  console.error('FAIL: Should be crucial before swap!');
  process.exit(1);
}

// After swap
clueObj.isSwapped = true;
clueObj.isForged = true;
const afterSwapCrucial = isClueCrucialForKiller(clueObj, scenario);
console.log(`After swap - isClueCrucialForKiller: ${afterSwapCrucial} (expected false)`);
if (afterSwapCrucial !== false) {
  console.error('FAIL: Should NOT be crucial after swap!');
  process.exit(1);
}
console.log('PASS: isClueCrucialForKiller properly returns false after swap!');

console.log('\n=== TEST 3: Room Scene Marker Rendering & Banner Update ===');
// Setup game state
const roomId = scenario.murderRoom;
const clue1 = {
  id: specialClue.id,
  roomId: roomId,
  title: specialClue.title,
  revealTitle: specialClue.revealTitle,
  revealDesc: specialClue.revealDesc,
  x: 50,
  y: 50,
  isKillerEvidence: true,
  canBeWiped: true,
  wiped: false,
  inspected: false
};

const gameState = {
  scenario: scenario,
  currentPlayerIndex: 0,
  players: [
    {
      id: 'p1',
      name: 'Player 1',
      suspectId: killerSuspectId,
      isKiller: true,
      currentRoomId: roomId,
      wipedCluesDetailed: []
    }
  ],
  roomClues: {
    [roomId]: [clue1]
  },
  discoveredClues: [],
  turnMoved: false,
  turnClueActionDone: false
};

vm.runInContext(`G = ${JSON.stringify(gameState)}`, sandbox);
const renderRoomScene = vm.runInContext('renderRoomScene', sandbox);
const doSwapClue = vm.runInContext('doSwapClue', sandbox);

// 3.1 Render room scene BEFORE swap (Killer sees blood drop 🩸)
const G = vm.runInContext('G', sandbox);
const jigsawParent = new MockElement('div', 'jigsaw-parent');
jigsawParent.appendChild(document.getElementById('btn-room-jigsaw'));

renderRoomScene(roomId, G, () => {}, () => {});
const markersContainer = document.getElementById('rsv-clue-markers');
const markerBefore = markersContainer.children[0];
console.log('Marker before swap innerHTML:', markerBefore.innerHTML);
if (!markerBefore.innerHTML.startsWith('🩸')) {
  console.error('FAIL: Marker before swap should start with 🩸!');
  process.exit(1);
}
const bannerBefore = document.getElementById('rsv-killer-evidence-banner');
console.log('Banner before swap className:', bannerBefore.className);
if (!bannerBefore.className.includes('danger')) {
  console.error('FAIL: Banner before swap should be danger!');
  process.exit(1);
}
console.log('PASS: Before swap, marker is 🩸 and banner is danger.');

// 3.2 Perform doSwapClue with a crucial framing clue
const chosenDecoy = crucialClues.find(c => c.targetSuspectId !== killerSuspectId);
console.log(`\nSwapping clue with framing decoy: "${chosenDecoy.title}" (targeting ${chosenDecoy.targetSuspectName})`);
doSwapClue(G.roomClues[roomId][0], chosenDecoy);

// 3.3 Check marker and banner AFTER swap
const markerAfter = markersContainer.children[0];
console.log('Marker after swap innerHTML:', markerAfter.innerHTML);
console.log('Marker after swap classes:', markerAfter.className);
if (!markerAfter.innerHTML.startsWith('?')) {
  console.error('FAIL: Marker after swap MUST start with ? ! Actual:', markerAfter.innerHTML);
  process.exit(1);
}
if (!markerAfter.classList.has('swapped-decoy-marker')) {
  console.error('FAIL: Marker after swap should have swapped-decoy-marker class!');
  process.exit(1);
}

const bannerAfter = document.getElementById('rsv-killer-evidence-banner');
console.log('Banner after swap className:', bannerAfter.className);
if (!bannerAfter.className.includes('safe')) {
  console.error('FAIL: Banner after swap should be safe!');
  process.exit(1);
}
console.log('PASS: After swap, marker is ? and banner is safe 🛡️!');

// 3.4 Check clue action button below image
const cluesList = document.getElementById('rsv-clues-button-list');
const btnAfter = cluesList.children[0];
console.log('Button after swap innerHTML:', btnAfter.innerHTML);
if (!btnAfter.innerHTML.includes('?')) {
  console.error('FAIL: Button after swap should show icon ?!');
  process.exit(1);
}
if (!btnAfter.innerHTML.includes('หลักฐานลวง')) {
  console.error('FAIL: Button after swap should mention หลักฐานลวง!');
  process.exit(1);
}
console.log('PASS: Action button after swap displays ? and mentions หลักฐานลวง!');

// 3.5 Check discovered clues entry
const discovered = G.discoveredClues[0];
console.log('Discovered clue entry in dossier:', discovered);
console.log('\n=== TEST 4: Neutral Decoy Swap ===');
const neutralClue = neutralClues[0];
const clue2 = {
  id: 'test_clue_2',
  roomId: roomId,
  title: 'หลักฐานมัดตัว 2',
  revealTitle: 'รอยเลือดของฆาตกร',
  revealDesc: 'รอยเลือดตรงกับตัวคุณ',
  x: 70,
  y: 70,
  isKillerEvidence: true,
  canBeWiped: true,
  wiped: false,
  inspected: false
};

G.roomClues[roomId].push(clue2);
G.turnMoved = false;
G.turnClueActionDone = false;

doSwapClue(clue2, neutralClue);
const neutralDiscovered = G.discoveredClues.find(c => c.id.startsWith('forged_test_clue_2'));
console.log('Neutral decoy entry in dossier:', neutralDiscovered);
if (!neutralDiscovered || neutralDiscovered.isCritical !== false || neutralDiscovered.category !== 'neutral') {
  console.error('FAIL: Neutral decoy should have isCritical: false and category: neutral!');
  process.exit(1);
}
console.log('PASS: Neutral decoy swap recorded with isCritical: false!');

console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎉');
