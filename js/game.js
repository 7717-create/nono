/**
 * game.js — Main game controller for Detective vs Killer mystery
 * 1 action per turn, crime scene inspection, killer evidence tampering, and accusations.
 */

let G = null;

let playerKillerHistory = [];

function pickFairKillerPlayerIndex(numPlayers, cycleRound) {
  // Reset killer history at the start of each 6-game set (round 1, 7, 13, 19, 25, 31, 37, 43, 49) or when all players have been killer
  if (cycleRound % 6 === 1 || playerKillerHistory.length >= numPlayers) {
    playerKillerHistory = [];
  }

  // Find players who haven't been killer yet in this half
  const available = [];
  for (let i = 0; i < numPlayers; i++) {
    if (!playerKillerHistory.includes(i)) {
      available.push(i);
    }
  }

  const pool = available.length > 0 ? available : Array.from({ length: numPlayers }, (_, i) => i);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  playerKillerHistory.push(picked);
  return picked;
}

function newGameState(config) {
  // 1. Pick next unplayed scenario from the 12-game non-repeating shuffled cycle
  const scenario = getNextUnplayedScenario();
  const killerSuspect = getSuspectById(scenario.applicableKiller);

  // 2. Secretly designate 1 player as the KILLER with fair player rotation
  const killerIndex = pickFairKillerPlayerIndex(config.players.length, scenario.cycleRound);

  // 3. Assign suspects:
  // - The killer player gets the scenario's designated killer suspect
  // - The remaining players get distinct other suspects randomly from the other 5 suspects
  const otherSuspects = SUSPECTS.filter(s => s.id !== killerSuspect.id).sort(() => Math.random() - 0.5);
  const assignedSuspects = [];
  let otherIdx = 0;
  for (let i = 0; i < config.players.length; i++) {
    if (i === killerIndex) {
      assignedSuspects.push(killerSuspect);
    } else {
      assignedSuspects.push(otherSuspects[otherIdx++]);
    }
  }

  // 4. Initialize room clues for all 9 rooms
  const roomClues = {};
  Object.keys(MANSION_ROOMS).forEach(rId => {
    roomClues[rId] = getCluesForRoom(rId, scenario);
  });

  const players = config.players.map((p, i) => {
    const suspect = assignedSuspects[i];
    const isKiller = (i === killerIndex);

    // Format display name: use custom name if provided, else use suspect name
    let displayName = p.name;
    if (!displayName || SUSPECTS.some(s => s.name === displayName) || displayName.startsWith('ผู้เล่น ')) {
      displayName = p.name && p.name !== suspect.name ? `${p.name} (${suspect.name})` : suspect.name;
    }

    return {
      name: displayName,
      isAI: p.isAI,
      color: suspect.color,
      emoji: suspect.emoji,
      image: suspect.image,
      suspectId: suspect.id,
      suspectName: suspect.name,
      suspectRole: suspect.role,
      isKiller: isKiller,
      currentRoomId: null, // Initially null: players must choose their starting room on turn 1
      inspectedClues: [],
      wipedClues: [],
      swappedClues: [],
      eliminated: false,
      hasSeenRole: false,
      wipedCluesDetailed: []
    };
  });

  return {
    scenario,
    players,
    roomClues,
    discoveredClues: [],
    solvedJigsaws: {},
    currentPlayerIndex: 0,
    round: 1,
    turnCount: 1,
    gameOver: false,
  };
}

// ============================================================
//  SETUP SCREEN
// ============================================================
let setupConfig = {
  numPlayers: 3,
  players: [],
};

function initSetupScreen() {
  function updatePlayerList() {
    const list = document.getElementById('player-setup-list');
    if (!list) return;
    list.innerHTML = '';
    setupConfig.players = [];

    for (let i = 0; i < setupConfig.numPlayers; i++) {
      const row = document.createElement('div');
      row.classList.add('player-setup-row');

      // 1. Sleek avatar card with dice icon and distinct player badge (no text wrapping)
      const avatarWrap = document.createElement('div');
      avatarWrap.classList.add('setup-avatar-wrapper');
      avatarWrap.title = 'ตัวละครจะถูกสุ่มจาก 6 ผู้ต้องสงสัยเมื่อเริ่มเกม';

      const avatarIcon = document.createElement('div');
      avatarIcon.classList.add('setup-avatar-icon');
      avatarIcon.textContent = '🎲';

      const playerBadge = document.createElement('span');
      playerBadge.classList.add('setup-player-badge');
      playerBadge.textContent = `P${i + 1}`;

      avatarWrap.appendChild(avatarIcon);
      avatarWrap.appendChild(playerBadge);

      // 2. Name input with container and subtitle label
      const nameContainer = document.createElement('div');
      nameContainer.classList.add('player-name-container');

      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('player-name-input');
      input.placeholder = `ชื่อผู้เล่นคนที่ ${i + 1}`;
      input.value = `ผู้เล่น ${i + 1}`;

      const subLabel = document.createElement('div');
      subLabel.classList.add('player-sub-label');
      subLabel.innerHTML = `<span class="random-dice-icon">✨</span> สุ่ม 1 ใน 6 ผู้ต้องสงสัย`;

      nameContainer.appendChild(input);
      nameContainer.appendChild(subLabel);

      // 3. Dropdown select for Human / AI
      const typeSelect = document.createElement('select');
      typeSelect.classList.add('player-type-select');
      const optHuman = document.createElement('option');
      optHuman.value = 'human';
      optHuman.textContent = '👤 ผู้เล่น';
      const optAI = document.createElement('option');
      optAI.value = 'ai';
      optAI.textContent = '🤖 AI';
      typeSelect.appendChild(optHuman);
      typeSelect.appendChild(optAI);
      if (i > 0) typeSelect.value = 'ai';

      row.appendChild(avatarWrap);
      row.appendChild(nameContainer);
      row.appendChild(typeSelect);
      list.appendChild(row);

      setupConfig.players.push({ inputEl: input, typeEl: typeSelect });
    }

    const countDisp = document.getElementById('player-count-display');
    if (countDisp) countDisp.textContent = setupConfig.numPlayers;
  }

  const minusBtn = document.getElementById('btn-players-minus');
  if (minusBtn) {
    minusBtn.onclick = () => {
      if (setupConfig.numPlayers > 2) {
        setupConfig.numPlayers--;
        updatePlayerList();
      }
    };
  }

  const plusBtn = document.getElementById('btn-players-plus');
  if (plusBtn) {
    plusBtn.onclick = () => {
      if (setupConfig.numPlayers < 6) {
        setupConfig.numPlayers++;
        updatePlayerList();
      }
    };
  }

  const startBtn = document.getElementById('btn-start-game');
  if (startBtn) {
    startBtn.onclick = () => {
      const playerConfigs = setupConfig.players.map((p, i) => ({
        name: p.inputEl.value.trim() || `ผู้เล่น ${i + 1}`,
        isAI: p.typeEl.value === 'ai',
      }));
      startGame({ players: playerConfigs });
    };
  }

  const btnPlayCutscene = document.getElementById('btn-play-cutscene');
  if (btnPlayCutscene) {
    btnPlayCutscene.onclick = () => {
      playCutscene(() => showScreen('screen-setup'));
    };
  }

  const btnGuideSetup = document.getElementById('btn-guide-setup');
  if (btnGuideSetup) {
    btnGuideSetup.onclick = () => showModal('modal-guide');
  }

  updatePlayerList();

  // Update 54-game cycle progress in setup screen
  const cycleState = getScenarioCycleState();
  const cycleDisp = document.getElementById('setup-cycle-progress');
  if (cycleDisp) {
    cycleDisp.textContent = `${cycleState.index}/${cycleState.deck.length}`;
  }

  const btnResetCycle = document.getElementById('btn-reset-cycle');
  if (btnResetCycle) {
    btnResetCycle.onclick = () => {
      if (confirm('ต้องการสลับสุ่มลำดับคดีใหม่ทั้งหมด 54 คดีใช่หรือไม่? (ลำดับใหม่จะไม่ซ้ำกับรอบเดิมอย่างแน่นอน)')) {
        const newCycle = resetScenarioCycle();
        if (cycleDisp) {
          cycleDisp.textContent = `${newCycle.index}/${newCycle.deck.length}`;
        }
        alert('สลับสุ่มลำดับคดี 54 คดีใหม่เรียบร้อยแล้ว! ลำดับคดีและคนร้ายจะไม่ซ้ำกับรอบเดิม');
      }
    };
  }
}

// ============================================================
//  GAME START
// ============================================================
function startGame(config) {
  initBoard();
  G = newGameState(config);

  // Update game header badge
  const caseBadge = document.getElementById('game-case-badge');
  const totalRounds = G.scenario.cycleTotal || 54;
  if (caseBadge) {
    caseBadge.textContent = `📁 คดีที่ ${G.scenario.cycleRound}/${totalRounds}`;
    caseBadge.title = `ระบบ ${totalRounds} ตาไม่ซ้ำ: คดีที่ ${G.scenario.cycleRound} จาก ${totalRounds} คดี (${G.scenario.title})`;
  }

  // Play atmospheric prologue cutscene
  playCutscene(() => {
    showScreen('screen-game');
    bindGameButtons();

    // Show hot-seat cover (LOGO ONLY) for the first player before game starts
    const firstPlayer = G.players[0];
    showHotSeatCover(firstPlayer, () => {
      if (!firstPlayer.isAI) {
        showSecretRoleModal(firstPlayer, G.scenario, () => {
          firstPlayer.hasSeenRole = true;
          addLog(`📁 คดีที่ ${G.scenario.cycleRound}/${totalRounds}: "${G.scenario.title}" (ระบบรับประกันเล่น ${totalRounds} ตาไม่ซ้ำ และสลับสุ่มลำดับใหม่ทุกรอบ โดย 6 ตาแรกคนร้ายไม่ซ้ำกัน)`, 'highlight');
          addLog('🔍 คดีฆาตกรรมเริ่มต้นขึ้นแล้ว! ทุกคนอยู่ที่โถงกลางคฤหาสน์', 'highlight');
          startTurn();
        });
      } else {
        addLog(`📁 คดีที่ ${G.scenario.cycleRound}/${totalRounds}: "${G.scenario.title}" (ระบบรับประกันเล่น ${totalRounds} ตาไม่ซ้ำ และสลับสุ่มลำดับใหม่ทุกรอบ โดย 6 ตาแรกคนร้ายไม่ซ้ำกัน)`, 'highlight');
        addLog('🔍 คดีฆาตกรรมเริ่มต้นขึ้นแล้ว! ทุกคนอยู่ที่โถงกลางคฤหาสน์', 'highlight');
        startTurn();
      }
    }, true);
  });
}

// ============================================================
//  TURN MANAGEMENT
// ============================================================
function setEndTurnBtnState(actionDone, nextPlayerName, customLabel = '') {
  const btn = document.getElementById('btn-end-turn');
  if (!btn) return;

  if (actionDone) {
    btn.className = 'btn-action btn-gold-action';
    const titleText = customLabel || 'ตรวจร่องรอยแล้ว ➔ จบเทิร์น';
    btn.innerHTML = `
      <span class="action-icon">✅</span>
      <span class="action-text"><strong>${titleText}</strong><small>ส่งต่อให้ ${nextPlayerName || 'คนถัดไป'}</small></span>
    `;
  } else {
    btn.className = 'btn-action btn-secondary';
    btn.innerHTML = `
      <span class="action-icon">⏩</span>
      <span class="action-text"><strong>ข้ามเทิร์นนี้</strong><small>ส่งต่อให้ ${nextPlayerName || 'คนถัดไป'}</small></span>
    `;
  }
}

function startTurn() {
  if (G.gameOver) return;

  const player = G.players[G.currentPlayerIndex];

  if (player.eliminated) {
    nextPlayer();
    return;
  }

  // Reset turn action flags
  G.turnMoved = false;
  G.turnClueActionDone = false;
  G.turnMiniGamePlayed = false;

  const nextIdx = (G.currentPlayerIndex + 1) % G.players.length;
  const nextP = G.players[nextIdx];

  const curRoom = player.currentRoomId ? MANSION_ROOMS[player.currentRoomId] : null;
  updateTurnIndicator(player, `ตาของ ${player.name}`);
  renderPlayersList(G.players, G.currentPlayerIndex);
  renderDossier(G);
  renderKillerWipedList(player, G);
  setEndTurnBtnState(false, nextP ? nextP.name : '');

  // If player has not selected a room yet: show Mansion Overview Map to choose a room
  if (!player.currentRoomId) {
    updateTurnStepBar(1);
    showMansionMap();
    renderMansionMap(G, (roomId) => doSelectRoom(roomId));
    updateGuideBanner('🗺️', `<strong>ขั้นตอนที่ 1 (ตาของ ${player.name}):</strong> คลิกเลือกห้อง 1 ห้องบนแผนผังคฤหาสน์เพื่อเดินเข้าไปสืบสวน`);
  } else {
    // If player is already inside a room: show Room Scene View with ? markers and buttons
    updateTurnStepBar(2);
    showRoomScene();
    renderRoomScene(player.currentRoomId, G, (clue) => doInspectClue(clue), (clue) => doWipeClue(clue));
    
    if (player.isKiller && !player.isAI) {
      updateGuideBanner('🩸', `<strong>ขั้นตอนที่ 2 (อยู่ใน${curRoom.name}):</strong> คุณคือฆาตกร! แตะมาร์กเกอร์สีแดง 🩸 เพื่อทำลาย/สลับหลักฐาน หรือตรวจร่องรอย <strong>1 จุดต่อเทิร์น</strong> (หรือคลิก "สลับดูแผนผัง" เพื่อย้ายห้อง)`);
    } else {
      updateGuideBanner('🔍', `<strong>ขั้นตอนที่ 2 (อยู่ใน${curRoom.name}):</strong> ตรวจร่องรอยในห้องนี้ได้ <strong>1 จุดต่อเทิร์น</strong> (หรือคลิก "สลับดูแผนผัง" เพื่อย้ายห้อง)`);
    }
  }

  addLog(`เทิร์นของ ${player.name} (${curRoom ? curRoom.name : 'กำลังเลือกห้อง'})`, 'highlight');

  if (player.isAI) {
    setTimeout(() => handleAITurn(), 900);
  }
}

// ============================================================
//  PLAYER ACTIONS
// ============================================================
function doSelectRoom(roomId) {
  if (G.gameOver) return;

  const player = G.players[G.currentPlayerIndex];

  // If player clicked the room they are already in: just return to room scene without consuming turn!
  if (player.currentRoomId === roomId) {
    showRoomScene();
    renderRoomScene(roomId, G, (clue) => doInspectClue(clue), (clue) => doWipeClue(clue));
    updateTurnStepBar(2);
    const room = MANSION_ROOMS[roomId];
    if (player.isKiller && !player.isAI) {
      updateGuideBanner('🩸', `<strong>ขั้นตอนที่ 2 (อยู่ใน${room.name}):</strong> คุณคือฆาตกร! เลือกตรวจหรือลบหลักฐาน <strong>1 จุดเท่านั้นต่อเทิร์น</strong>`);
    } else {
      updateGuideBanner('🔍', `<strong>ขั้นตอนที่ 2 (อยู่ใน${room.name}):</strong> ตรวจร่องรอยในห้องนี้ได้ <strong>1 จุดเท่านั้นต่อเทิร์น</strong>`);
    }
    return;
  }

  const isMove = player.currentRoomId !== null;
  player.currentRoomId = roomId;

  // Mark that player has moved this turn
  G.turnMoved = true;
  G.turnClueActionDone = false;
  G.turnMiniGamePlayed = false;

  const room = MANSION_ROOMS[roomId];
  addLog(`${player.name} ${isMove ? 'ย้ายไปที่' : 'เดินเข้าสู่'} ${room.emoji} ${room.name}`, 'highlight');

  // Transition to Step 2: Inspect or wipe clues in this room!
  updateTurnStepBar(2);
  showRoomScene();
  renderRoomScene(roomId, G, (clue) => doInspectClue(clue), (clue) => doWipeClue(clue));
  renderPlayersList(G.players, G.currentPlayerIndex);
  updateTurnIndicator(player, `อยู่ใน${room.name}`);

  const nextIdx = (G.currentPlayerIndex + 1) % G.players.length;
  const nextP = G.players[nextIdx];

  // Player hasn't completed a clue action yet, so button is skip or end turn
  setEndTurnBtnState(false, nextP ? nextP.name : '');

  if (player.isKiller && !player.isAI) {
    updateGuideBanner(
      '🩸',
      `<strong>ขั้นตอนที่ 2 (${room.name}):</strong> คุณคือฆาตกร! เลือกตรวจหรือทำลายหลักฐาน <strong>1 จุด</strong> ในห้องนี้ (แตะมาร์กเกอร์สีแดง 🩸 หรือปุ่มด้านล่าง)`
    );
  } else {
    updateGuideBanner(
      '🔍',
      `<strong>ขั้นตอนที่ 2 (${room.name}):</strong> ตรวจร่องรอยในห้องนี้ได้ <strong>1 จุด</strong> (แตะมาร์กเกอร์ <strong>"?"</strong> หรือปุ่มด้านล่าง)`
    );
  }

  if (player.isAI) {
    setTimeout(() => {
      const actionObj = aiChooseClueActionInRoom(roomId, G);
      if (player.isKiller && actionObj.clue && actionObj.clue.canBeWiped) {
        const r = Math.random();
        if (r < 0.45) {
          doWipeClue(actionObj.clue);
        } else if (r < 0.85 && typeof FORGED_CLUES_LIST !== 'undefined' && FORGED_CLUES_LIST.length > 0) {
          const randomForged = FORGED_CLUES_LIST[Math.floor(Math.random() * FORGED_CLUES_LIST.length)];
          doSwapClue(actionObj.clue, randomForged);
        } else {
          doInspectClue(actionObj.clue);
        }
      } else if (actionObj.action === 'wipe' && actionObj.clue) {
        doWipeClue(actionObj.clue);
      } else if (actionObj.action === 'inspect' && actionObj.clue) {
        doInspectClue(actionObj.clue);
      } else {
        doEndTurn();
      }
    }, 1000);
  }
}

function doInspectClue(clue) {
  if (G.gameOver) return;

  if (G.turnClueActionDone) {
    addLog('คุณตรวจร่องรอยในเทิร์นนี้ไปแล้ว (จำกัด 1 จุดต่อ 1 เทิร์น) กรุณากดจบเทิร์น', 'danger');
    return;
  }

  const player = G.players[G.currentPlayerIndex];
  clue.inspected = true;
  if (!player.inspectedClues.includes(clue.id)) {
    player.inspectedClues.push(clue.id);
  }

  // Add to discovered clues
  if (!G.discoveredClues.some(c => c.id === clue.id)) {
    G.discoveredClues.push({
      ...clue,
      discoveredByName: player.name
    });
  }

  G.turnClueActionDone = true;
  updateTurnStepBar(3);

  const nextIdx = (G.currentPlayerIndex + 1) % G.players.length;
  const nextP = G.players[nextIdx];
  setEndTurnBtnState(true, nextP ? nextP.name : '', '✅ ตรวจร่องรอยแล้ว ➔ จบเทิร์น');

  renderDossier(G);
  renderRoomScene(player.currentRoomId, G, (c) => doInspectClue(c), (c) => doWipeClue(c));

  addLog(`${player.name} ตรวจสอบ: ${clue.title}`, clue.isCritical ? 'danger' : '');

  // Check 15-clue counter
  if (G.discoveredClues.length >= 15) {
    if (!player.isAI) {
      showEvidenceRevealModal(clue, () => {
        triggerFinalAccusationVote();
      });
    } else {
      triggerFinalAccusationVote();
    }
    return;
  }

  // If human, show reveal modal
  if (!player.isAI) {
    showEvidenceRevealModal(clue, () => {
      updateGuideBanner('✅', `<strong>ขั้นตอนที่ 3:</strong> ตรวจร่องรอยครบ 1 จุดแล้ว! กรุณากดปุ่ม <strong>"จบเทิร์น ➔"</strong> ด้านขวา หรือกดชี้ตัวคนร้าย`);
    });
  } else {
    setTimeout(() => doEndTurn(), 600);
  }
}

function doSwapClue(originalClue, forgedClue) {
  if (G.gameOver) return;

  if (G.turnClueActionDone) {
    addLog('คุณได้ดำเนินการกับร่องรอยในเทิร์นนี้แล้ว (จำกัด 1 จุดต่อ 1 เทิร์น) กรุณากดจบเทิร์น', 'danger');
    return;
  }

  const player = G.players[G.currentPlayerIndex];
  
  // 1. Mark clue as swapped and update original clue in roomClues
  originalClue.isSwapped = true;
  originalClue.isForged = true;
  originalClue.isKillerEvidence = false;
  originalClue.canBeWiped = false;
  originalClue.inspected = true;
  originalClue.title = forgedClue.title;
  originalClue.revealTitle = forgedClue.revealTitle;
  originalClue.revealDesc = forgedClue.revealDesc;
  originalClue.isCritical = !!forgedClue.isCritical;
  originalClue.targetSuspectId = forgedClue.targetSuspectId || null;
  originalClue.targetSuspectName = forgedClue.targetSuspectName || null;
  originalClue.category = forgedClue.category || (forgedClue.isCritical ? 'crucial' : 'neutral');

  if (!player.swappedClues) player.swappedClues = [];
  player.swappedClues.push(originalClue.id);

  // 2. Insert forged decoy clue into discovered clues for this room
  const forgedEntry = {
    id: `forged_${originalClue.id}_${Date.now()}`,
    roomId: originalClue.roomId,
    title: forgedClue.title,
    revealTitle: forgedClue.revealTitle,
    revealDesc: forgedClue.revealDesc,
    isCritical: !!forgedClue.isCritical,
    targetSuspectId: forgedClue.targetSuspectId || null,
    targetSuspectName: forgedClue.targetSuspectName || null,
    category: forgedClue.category || (forgedClue.isCritical ? 'crucial' : 'neutral'),
    isForged: true,
    isSwapped: true,
    wiped: false,
    discoveredByName: player.name
  };

  G.discoveredClues.push(forgedEntry);

  G.turnClueActionDone = true;
  updateTurnStepBar(3);

  const nextIdx = (G.currentPlayerIndex + 1) % G.players.length;
  const nextP = G.players[nextIdx];
  setEndTurnBtnState(true, nextP ? nextP.name : '', '🎭 สลับหลักฐานแล้ว ➔ จบเทิร์น');

  const room = MANSION_ROOMS[originalClue.roomId];
  // Public game log looks like a normal clue check so detectives cannot detect the decoy swap
  addLog(`${player.name} ตรวจสอบ: ${forgedClue.title} ใน ${room ? room.name : ''}`, forgedClue.isCritical ? 'danger' : '');

  renderDossier(G);
  renderRoomScene(player.currentRoomId, G, (c) => doInspectClue(c), (c) => doWipeClue(c));

  if (G.discoveredClues.length >= 15) {
    triggerFinalAccusationVote();
    return;
  }

  updateGuideBanner('🎭', `<strong>ขั้นตอนที่ 3:</strong> จัดฉากวางหลักฐาน <strong>"${forgedClue.title}"</strong> สำเร็จ! จุดนี้เปลี่ยนเป็น <strong>"?"</strong> และบันทึกลงแฟ้มแล้ว กรุณากดปุ่ม <strong>"จบเทิร์น ➔"</strong> ด้านขวา`);
}

function doWipeClue(clue) {
  if (G.gameOver) return;

  if (G.turnClueActionDone) {
    addLog('คุณได้ดำเนินการกับร่องรอยในเทิร์นนี้แล้ว (จำกัด 1 จุดต่อ 1 เทิร์น) กรุณากดจบเทิร์น', 'danger');
    return;
  }

  const player = G.players[G.currentPlayerIndex];

  // Show Killer Action Modal
  showKillerActionModal(
    clue,
    // onWipe:
    () => {
      clue.wiped = true;
      clue.inspected = true;
      if (!player.wipedClues.includes(clue.id)) {
        player.wipedClues.push(clue.id);
      }

      // Record in player's wiped clues detailed list (visible only to killer)
      if (!player.wipedCluesDetailed) player.wipedCluesDetailed = [];
      player.wipedCluesDetailed.push({
        id: clue.id,
        roomId: clue.roomId,
        title: clue.title,
        revealTitle: clue.revealTitle,
        revealDesc: clue.revealDesc,
        wipedAtRound: G.round || 1,
        wipedAtTurn: G.turnCount
      });

      // Per user request:
      // "หากคนร้ายทำลายหลักฐานหลักฐานนั้นจะหายไปเลยไม่ปรากฎในห้องนั้นอีกแต่จะขึ้นริสที่คนร้ายทำลายหลักฐานไปในหน้าจอคนร้าย"
      // Remove clue completely from the room so it never appears in that room again!
      G.roomClues[clue.roomId] = (G.roomClues[clue.roomId] || []).filter(c => c.id !== clue.id);

      G.turnClueActionDone = true;
      updateTurnStepBar(3);

      const nextIdx = (G.currentPlayerIndex + 1) % G.players.length;
      const nextP = G.players[nextIdx];
      setEndTurnBtnState(true, nextP ? nextP.name : '', '🧹 ทำลายหลักฐานแล้ว ➔ จบเทิร์น');

      const room = MANSION_ROOMS[clue.roomId];
      addLog(`🧹 คุณทำลายหลักฐาน "${clue.title}" ใน ${room ? room.name : ''} สำเร็จ! (หลักฐานหายไปจากห้องแล้ว)`, 'highlight');

      renderKillerWipedList(player, G);
      renderDossier(G);
      renderRoomScene(player.currentRoomId, G, (c) => doInspectClue(c), (c) => doWipeClue(c));

      updateGuideBanner('🧹', `<strong>ขั้นตอนที่ 3:</strong> ทำลายหลักฐานสำเร็จ! หลักฐานชิ้นนี้หายไปจากห้องเรียบร้อย และถูกบันทึกในหน้ารายการของคนร้าย กรุณากดปุ่ม <strong>"จบเทิร์น ➔"</strong> ด้านขวา`);
    },
    // onInspect:
    () => {
      doInspectClue(clue);
    },
    // onSwap:
    (forgedClue) => {
      doSwapClue(clue, forgedClue);
    },
    // onCancel:
    () => {}
  );
}

// ============================================================
//  ACCUSATION
// ============================================================
function doAccuse(suspectId, weaponId, roomId) {
  if (G.gameOver) return;

  const player = G.players[G.currentPlayerIndex];
  const scenario = G.scenario;

  const isKillerCorrect = (suspectId === scenario.killerSuspectId);
  const isWeaponCorrect = (weaponId === scenario.weaponId);
  const isRoomCorrect   = (roomId === scenario.murderRoom);

  // In this investigation mode, naming the correct Killer, Weapon, and Room wins the case!
  const won = isKillerCorrect && isWeaponCorrect && isRoomCorrect;

  if (won) {
    G.gameOver = true;
    addLog(`🏆 ${player.name} ชี้ตัวฆาตกร อาวุธ และห้องเกิดเหตุได้ถูกต้องสมบูรณ์!`, 'success');
    showResultModal(true, player.name, scenario, false, () => {
      showScreen('screen-setup');
      initSetupScreen();
    });
  } else {
    player.eliminated = true;
    addLog(`💀 ${player.name} กล่าวหาผู้บริสุทธิ์หรือระบุหลักฐานผิดและหลุดจากคดี!`, 'danger');
    renderPlayersList(G.players, G.currentPlayerIndex);

    const activePlayers = G.players.filter(p => !p.eliminated);
    const detectives = activePlayers.filter(p => !p.isKiller);

    // If all detectives eliminated, killer wins
    if (detectives.length === 0) {
      G.gameOver = true;
      const killer = G.players.find(p => p.isKiller);
      addLog(`🩸 ฆาตกร (${killer ? killer.name : ''}) รอดพ้นการจับกุมและชนะคดี!`, 'danger');
      showResultModal(true, killer ? killer.name : 'ฆาตกร', scenario, true, () => {
        showScreen('screen-setup');
        initSetupScreen();
      });
      return;
    }

    showResultModal(false, player.name, scenario, false, () => {
      nextPlayer();
    });
  }
}

/**
 * Handle 1-minute vote timeout: Killer escapes and wins!
 */
function handleVoteTimeout() {
  if (G.gameOver) return;
  G.gameOver = true;
  const killer = G.players.find(p => p.isKiller) || { name: 'ฆาตกร' };
  const killerName = killer.name;

  addLog('🚨 หมดเวลาตัดสินคดี 1 นาที! ผู้เล่นไม่สามารถตกลงชี้ตัวคนร้ายได้ทันเวลา!', 'danger');
  addLog(`🩸 คนร้าย (${killerName}) ฉวยโอกาสในความลังเลของเหล่านักสืบ หลบหนีออกจากคฤหาสน์แบล็ควูดได้สำเร็จและชนะคดี!`, 'danger');

  const timeoutDesc = `🚨 หมดเวลาตัดสินคดี 1 นาที! ผู้เล่นไม่สามารถตกลงชี้ตัวคนร้ายได้ทันเวลา ฆาตกรตัวจริง (${killerName}) จึงฉวยโอกาสหลบหนีออกจากคฤหาสน์แบล็ควูดไปได้อย่างลอยนวลและชนะคดี!`;

  showResultModal(true, killerName, G.scenario, true, () => {
    showScreen('screen-setup');
    initSetupScreen();
  }, timeoutDesc);
}

/**
 * 15-Clues Forced Accusation Vote
 */
function triggerFinalAccusationVote() {
  if (G.gameOver) return;
  addLog('🚨 รวบรวมเบาะแสครบ 15 ชิ้นแล้ว! เข้าสู่การตัดสินคดีขั้นสุดท้าย! (จำกัดเวลา 1 นาที)', 'danger');

  showFinalAccusationVoteModal(({ suspectId, weaponId, roomId }) => {
    const scenario = G.scenario;
    const isKillerCorrect = (suspectId === scenario.killerSuspectId);
    const isWeaponCorrect = (weaponId === scenario.weaponId);
    const isRoomCorrect   = (roomId === scenario.murderRoom);
    const won = isKillerCorrect && isWeaponCorrect && isRoomCorrect;

    G.gameOver = true;
    if (won) {
      addLog(`🏆 นักสืบคลี่คลายคดีสำเร็จ! ชี้ตัวฆาตกรตัวจริง วิธีการสังหาร และระบุห้องเกิดเหตุได้ถูกต้อง`, 'success');
      showResultModal(true, 'ทีมนักสืบ', scenario, false, () => {
        showScreen('screen-setup');
        initSetupScreen();
      });
    } else {
      const killer = G.players.find(p => p.isKiller);
      addLog(`🩸 ทีมนักสืบชี้ตัวผิดพลาด! ฆาตกรตัวจริง (${killer ? killer.name : ''}) อำพรางคดีสำเร็จและชนะการสืบสวน!`, 'danger');
      showResultModal(true, killer ? killer.name : 'ฆาตกร', scenario, true, () => {
        showScreen('screen-setup');
        initSetupScreen();
      });
    }
  }, () => {
    handleVoteTimeout();
  });
}

// ============================================================
//  AI TURN AUTOMATION
// ============================================================
async function handleAITurn() {
  const player = G.players[G.currentPlayerIndex];
  if (!player.isAI || G.gameOver) return;

  await sleep(800);

  // 1. If has not entered a room yet: must pick a room to enter (entering a room ends turn)
  if (!player.currentRoomId) {
    const targetRoom = aiChooseRoomToEnter(G);
    doSelectRoom(targetRoom);
    return;
  }

  // 2. Check if AI detective wants to accuse
  const accusation = aiCheckShouldAccuse(G);
  if (accusation) {
    addLog(`🤖 ${player.name} รวบรวมหลักฐานครบแล้วและทำการชี้ตัวฆาตกร!`, 'highlight');
    await sleep(700);
    doAccuse(accusation.suspectId, accusation.weaponId, accusation.roomId);
    return;
  }

  // 3. If already in a room: 35% chance to move to another room (moving ends turn)
  const wantToMove = Math.random() < 0.35;
  if (wantToMove) {
    const targetRoom = aiChooseRoomToEnter(G);
    if (targetRoom !== player.currentRoomId) {
      doSelectRoom(targetRoom);
      return;
    }
  }

  // 4. Perform 1 clue action in current room
  const actionObj = aiChooseClueActionInRoom(player.currentRoomId, G);
  if (player.isKiller && actionObj.clue && actionObj.clue.canBeWiped) {
    const r = Math.random();
    if (r < 0.45) {
      doWipeClue(actionObj.clue);
    } else if (r < 0.85 && typeof FORGED_CLUES_LIST !== 'undefined' && FORGED_CLUES_LIST.length > 0) {
      const randomForged = FORGED_CLUES_LIST[Math.floor(Math.random() * FORGED_CLUES_LIST.length)];
      doSwapClue(actionObj.clue, randomForged);
    } else {
      doInspectClue(actionObj.clue);
    }
  } else if (actionObj.action === 'wipe' && actionObj.clue) {
    doWipeClue(actionObj.clue);
  } else if (actionObj.action === 'inspect' && actionObj.clue) {
    doInspectClue(actionObj.clue);
  } else {
    doEndTurn();
  }
}

// ============================================================
//  END TURN
// ============================================================
function doEndTurn() {
  if (G.gameOver) return;
  nextPlayer();
}

function nextPlayer() {
  const totalPlayers = G.players.length;
  let next = (G.currentPlayerIndex + 1) % totalPlayers;
  let attempts = 0;

  while (G.players[next].eliminated && attempts < totalPlayers) {
    next = (next + 1) % totalPlayers;
    attempts++;
  }

  if (attempts >= totalPlayers) {
    G.gameOver = true;
    return;
  }

  G.currentPlayerIndex = next;
  G.turnCount++;
  const nextP = G.players[next];

  // Show turn transition cover so the next player presses "Start"
  showHotSeatCover(nextP, () => {
    if (!nextP.isAI && !nextP.hasSeenRole) {
      showSecretRoleModal(nextP, G.scenario, () => {
        nextP.hasSeenRole = true;
        startTurn();
      });
    } else {
      startTurn();
    }
  }, false);
}

// ============================================================
//  BUTTON BINDINGS
// ============================================================
function bindGameButtons() {
  // Back to mansion map
  const btnBackToMap = document.getElementById('btn-back-to-map');
  if (btnBackToMap) {
    btnBackToMap.onclick = () => {
      if (G.turnClueActionDone) {
        addLog('คุณได้ตรวจร่องรอยในเทิร์นนี้แล้ว ไม่สามารถย้ายห้องได้ กรุณากดจบเทิร์น', 'danger');
        return;
      }
      if (G.turnMoved) {
        addLog('คุณได้ย้ายห้องในเทิร์นนี้แล้ว (จำกัด 1 ครั้งต่อเทิร์น) กรุณาตรวจร่องรอยในห้องนี้ หรือกดจบเทิร์น', 'danger');
        return;
      }
      showMansionMap();
      renderMansionMap(G, (roomId) => doSelectRoom(roomId));
      updateGuideBanner('🗺️', `เลือกห้อง 1 ห้องเพื่อย้ายเข้าไปสืบสวน`);
    };
  }

  // Accuse button
  const btnAccuse = document.getElementById('btn-accuse');
  if (btnAccuse) {
    btnAccuse.onclick = () => {
      showAccuseModal(({ suspectId, weaponId, roomId }) => {
        doAccuse(suspectId, weaponId, roomId);
      }, () => {
        handleVoteTimeout();
      });
    };
  }

  // End turn button
  const btnEndTurn = document.getElementById('btn-end-turn');
  if (btnEndTurn) {
    btnEndTurn.onclick = () => doEndTurn();
  }

  // Role inspection buttons (view own role anytime)
  const btnMyRole = document.getElementById('btn-my-role');
  if (btnMyRole) {
    btnMyRole.onclick = () => {
      const player = G.players[G.currentPlayerIndex];
      showPlayerRoleModal(player, player, G.scenario);
    };
  }
  const badgeMyRole = document.getElementById('player-role-badge');
  if (badgeMyRole) {
    badgeMyRole.onclick = () => {
      const player = G.players[G.currentPlayerIndex];
      showPlayerRoleModal(player, player, G.scenario);
    };
  }

  // Guide modal
  const btnGuide = document.getElementById('btn-guide');
  if (btnGuide) btnGuide.onclick = () => showModal('modal-guide');

  const btnGuideClose = document.getElementById('btn-guide-close');
  if (btnGuideClose) btnGuideClose.onclick = () => hideModal('modal-guide');

  // Menu button
  const btnMenu = document.getElementById('btn-menu');
  if (btnMenu) {
    btnMenu.onclick = () => {
      if (confirm('ต้องการออกจากคดีปัจจุบันและกลับหน้าหลัก?')) {
        showScreen('screen-setup');
        initSetupScreen();
      }
    };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initBoard();
  initSetupScreen();
  showScreen('screen-setup');
});
