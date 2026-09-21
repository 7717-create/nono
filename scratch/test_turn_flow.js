const fs = require('fs');
const vm = require('vm');

const domMock = `
  const document = {
    addEventListener: () => {},
    getElementById: (id) => ({
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      innerHTML: '',
      textContent: '',
      title: '',
      style: {},
      addEventListener: () => {},
      onclick: null,
      appendChild: () => {},
      cloneNode: function() { return this; },
      parentNode: { replaceChild: () => {} },
      querySelectorAll: () => []
    }),
    createElement: () => ({
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      innerHTML: '',
      textContent: '',
      title: '',
      style: {},
      dataset: {},
      addEventListener: () => {},
      appendChild: () => {}
    })
  };
  const window = {};
`;

const cardsCode = fs.readFileSync('./js/cards.js', 'utf8');
const scenariosCode = fs.readFileSync('./js/scenarios.js', 'utf8');
const boardCode = fs.readFileSync('./js/board.js', 'utf8');
const gameCode = fs.readFileSync('./js/game.js', 'utf8');

const sandbox = {
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  Date: Date,
  Math: Math
};

vm.createContext(sandbox);
vm.runInContext(domMock, sandbox);
vm.runInContext(cardsCode, sandbox);
vm.runInContext(scenariosCode, sandbox);
vm.runInContext(`
  // Mock UI functions
  function showMansionMap() {}
  function showRoomScene() {}
  function updateTurnStepBar(step) { globalThis.currentStep = step; }
  function updateTurnIndicator() {}
  function updateGuideBanner() {}
  function renderPlayersList() {}
  function renderDossier() {}
  function renderKillerWipedList() {}
  function showEvidenceRevealModal(c, cb) { cb(); }
  function showKillerActionModal(clue, onWipe, onInspect, onSwap) {
    globalThis.lastActionModal = { clue, onWipe, onInspect, onSwap };
  }
  function addLog(msg, type) { globalThis.logs.push({ msg, type }); }
`, sandbox);
vm.runInContext(boardCode, sandbox);
vm.runInContext(gameCode, sandbox);

sandbox.logs = [];

console.log('=== TEST: Turn 1 Room Entry & Immediate Clue Action ===');

// Setup Game
vm.runInContext(`
  G = newGameState({
    players: [
      { name: 'Killer Player', isAI: false },
      { name: 'Detective AI', isAI: true }
    ]
  });
  // Force player 0 to be killer
  G.players[0].isKiller = true;
  G.players[1].isKiller = false;
  G.scenario.killerSuspectId = G.players[0].suspectId;
  G.players[0].currentRoomId = null;
`, sandbox);

console.log('1. Starting turn for Player 0 (currentRoomId is null)');
vm.runInContext('startTurn();', sandbox);
console.log('Current Step after startTurn:', sandbox.currentStep);
if (sandbox.currentStep !== 1) {
  console.error('FAIL: Expected Step 1 (Mansion Map)!');
  process.exit(1);
}

// Player chooses room
const murderRoom = vm.runInContext('G.scenario.murderRoom;', sandbox);
console.log(`2. Player enters murder room "${murderRoom}"`);
vm.runInContext(`doSelectRoom("${murderRoom}");`, sandbox);

console.log('Current Step after room entry:', sandbox.currentStep);
if (sandbox.currentStep !== 2) {
  console.error('FAIL: Expected Step 2 (Inspect Clues) after room entry!');
  process.exit(1);
}

const turnMoved = vm.runInContext('G.turnMoved;', sandbox);
const turnClueActionDone = vm.runInContext('G.turnClueActionDone;', sandbox);
console.log(`G.turnMoved: ${turnMoved}, G.turnClueActionDone: ${turnClueActionDone}`);

// Check if clue action is allowed
const roomClues = vm.runInContext(`G.roomClues["${murderRoom}"];`, sandbox);
const killerClue = roomClues.find(c => c.isKillerEvidence || c.canBeWiped);
console.log(`3. Killer attempts to wipe clue: "${killerClue.title}"`);

vm.runInContext(`doWipeClue(G.roomClues["${murderRoom}"][0]);`, sandbox);

if (!sandbox.lastActionModal) {
  console.error('FAIL: showKillerActionModal was NOT called! Killer was blocked!');
  process.exit(1);
}
console.log('PASS: showKillerActionModal was called successfully!');

// Killer chooses Wipe
sandbox.lastActionModal.onWipe();

const afterWipeDone = vm.runInContext('G.turnClueActionDone;', sandbox);
console.log('Current Step after wipe action:', sandbox.currentStep);
console.log('G.turnClueActionDone after wipe:', afterWipeDone);

if (sandbox.currentStep !== 3 || afterWipeDone !== true) {
  console.error('FAIL: Expected Step 3 and turnClueActionDone = true after wiping clue!');
  process.exit(1);
}

console.log('4. Attempting 2nd clue action in same turn (should be blocked)');
sandbox.lastActionModal = null;
vm.runInContext(`doInspectClue(G.roomClues["${murderRoom}"][0]);`, sandbox);
const lastLog = sandbox.logs[sandbox.logs.length - 1];
console.log('Blocked log:', lastLog.msg);
if (!lastLog.msg.includes('จำกัด 1 จุดต่อ 1 เทิร์น')) {
  console.error('FAIL: 2nd action was not blocked properly!');
  process.exit(1);
}

console.log('\nALL TURN FLOW TESTS PASSED SUCCESSFULLY! 🎉');
