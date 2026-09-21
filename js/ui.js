/**
 * ui.js — UI controller: modals, step-by-step guidance banner, visual card pickers & animations
 */

const LOG_MAX = 4;

function addLog(text, type = '') {
  const log = document.getElementById('game-log');
  if (!log) return;
  const entry = document.createElement('div');
  entry.classList.add('log-entry');
  if (type) entry.classList.add(type);
  entry.textContent = text;
  log.prepend(entry);
  while (log.children.length > LOG_MAX) log.removeChild(log.lastChild);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
  }
}

function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function updateGuideBanner(icon, text) {
  const iconEl = document.getElementById('guide-icon');
  const textEl = document.getElementById('guide-text');
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.innerHTML = text;
}

/**
 * Show Turn Transition / Hot-Seat Cover
 * Displayed when transitioning to any player's turn so the next player presses "Start"
 */
function showHotSeatCover(player, onStart, isGameStart = false) {
  const coverScreen = document.getElementById('screen-hotseat-cover');
  if (!coverScreen) {
    if (onStart) onStart();
    return;
  }

  const labelEl = document.getElementById('cover-player-label');
  const readyBtn = document.getElementById('btn-cover-ready');

  // Per user request: DO NOT display any player information (no name, avatar, suspect, role, or room).
  // Show ONLY the game logo until the player presses the button!
  if (labelEl) {
    if (player.isAI) {
      labelEl.innerHTML = `🤖 <strong>ถึงตาของระบบ AI</strong><br><small style="color:var(--text-dim); display:inline-block; margin-top:4px;">กดปุ่มเพื่อเริ่ม หรือระบบจะดำเนินการให้อัตโนมัติ</small>`;
    } else if (isGameStart) {
      labelEl.innerHTML = `🔒 <strong>ส่งต่ออุปกรณ์ให้ผู้เล่นคนแรก</strong><br><small style="color:var(--text-dim); display:inline-block; margin-top:4px;">ข้อมูลและบทบาทการสืบสวนจะปรากฏหลังจากกดปุ่มด้านล่าง</small>`;
    } else {
      labelEl.innerHTML = `🔒 <strong>ส่งต่ออุปกรณ์ให้ผู้เล่นคนถัดไป</strong><br><small style="color:var(--text-dim); display:inline-block; margin-top:4px;">ข้อมูลและบทบาทการสืบสวนจะปรากฏหลังจากกดปุ่มด้านล่าง</small>`;
    }
  }

  let countdownTimer = null;

  const proceed = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    coverScreen.classList.remove('active');
    coverScreen.style.display = 'none';
    if (onStart) onStart();
  };

  if (readyBtn) {
    const freshBtn = readyBtn.cloneNode(true);
    readyBtn.parentNode.replaceChild(freshBtn, readyBtn);

    if (player.isAI) {
      let secondsLeft = 2;
      freshBtn.innerHTML = `▶️ เริ่มตา AI (${secondsLeft}s) ➔`;
      freshBtn.onclick = proceed;

      countdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          proceed();
        } else {
          freshBtn.innerHTML = `▶️ เริ่มตา AI (${secondsLeft}s) ➔`;
        }
      }, 1000);
    } else {
      freshBtn.innerHTML = isGameStart
        ? `▶️ กดเพื่อเปิดเผยข้อมูล & เริ่มเกม 👁️`
        : `▶️ กดเพื่อเริ่มเทิร์น & เปิดเผยข้อมูล 👁️`;
      freshBtn.onclick = proceed;
    }
  }

  coverScreen.style.display = 'flex';
  coverScreen.classList.add('active');
}

function updateTurnIndicator(player, phaseText) {
  const nameEl = document.getElementById('turn-player-name');
  const phaseEl = document.getElementById('turn-phase');
  const avatarEl = document.getElementById('turn-player-avatar');
  const roleBadge = document.getElementById('player-role-badge');
  const curRoomText = document.getElementById('player-current-room-text');

  if (nameEl) {
    nameEl.textContent = (player.name && player.name !== player.suspectName)
      ? `${player.name} (${player.suspectName})`
      : (player.name || player.suspectName || '');
  }
  if (phaseEl) phaseEl.textContent = phaseText;
  if (avatarEl && player.image) avatarEl.src = player.image;

  // Show role badge (only reveals killer identity to the human killer)
  if (roleBadge) {
    if (player.isKiller && !player.isAI) {
      roleBadge.textContent = '🩸 ฆาตกรตัวจริง';
      roleBadge.className = 'badge-role-killer';
    } else {
      roleBadge.textContent = '🔍 นักสืบ';
      roleBadge.className = 'badge-role-detective';
    }
  }

  if (curRoomText) {
    const room = player.currentRoomId ? MANSION_ROOMS[player.currentRoomId] : null;
    curRoomText.textContent = room ? `${room.name} ${room.emoji}` : 'กำลังเลือกห้อง 🗺️';
  }

  // Update Killer-Only Destroyed Evidence Panel
  renderKillerWipedList(player);
}

/**
 * Render Killer-Only Destroyed Evidence List & Murder Method Summary
 */
function renderKillerWipedList(player, gameState) {
  const panel = document.getElementById('killer-wiped-panel');
  const countBadge = document.getElementById('killer-wiped-count');
  const listContainer = document.getElementById('killer-wiped-list');
  const murderSummary = document.getElementById('killer-murder-summary');
  if (!panel) return;

  if (!player.isKiller || player.isAI) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');

  const state = gameState || (typeof G !== 'undefined' ? G : null);
  const scenario = state ? state.scenario : null;
  const murderRoom = scenario ? MANSION_ROOMS[scenario.murderRoom] : null;

  if (murderSummary && scenario) {
    murderSummary.innerHTML = `
      <div class="kms-title">🩸 ข้อมูลแผนการสังหารของคุณในตานี้:</div>
      <div class="kms-row"><span class="kms-label">📂 ชื่อคดี:</span> <span class="kms-val">${scenario.title}</span></div>
      <div class="kms-row"><span class="kms-label">🔪 วิธีการสังหาร:</span> <span class="kms-val">${scenario.weaponEmoji || '🔪'} ${scenario.weaponName || ''}</span></div>
      <div class="kms-row"><span class="kms-label">🚪 ห้องเกิดเหตุ:</span> <span class="kms-val">${murderRoom ? `${murderRoom.name} (${murderRoom.nameEn})` : 'ห้องเกิดเหตุ'}</span></div>
      <div class="kms-row"><span class="kms-label">⚰️ จุดซ่อนศพ:</span> <span class="kms-val" style="color: #ffcccc;">${scenario.hiddenCorpseLocation || 'จุดซ่อนศพลับ'}</span></div>
      <div class="kms-story">
        <strong style="color: #ff9999; display: block; margin-bottom: 3px;">📖 คุณลงมืออย่างไรในตานี้:</strong>
        ${scenario.introStory || ''}
      </div>
    `;
  }

  const wiped = player.wipedCluesDetailed || [];
  if (countBadge) countBadge.textContent = `${wiped.length} ชิ้น`;

  if (listContainer) {
    if (wiped.length === 0) {
      listContainer.innerHTML = '<div class="kwp-empty">ยังไม่มีหลักฐานที่ถูกทำลาย (เมื่อคุณเลือก "🧹 เช็ดทำลายร่องรอย" หลักฐานจะหายไปจากห้องอย่างสมบูรณ์ และมาปรากฏในรายการนี้)</div>';
    } else {
      listContainer.innerHTML = '';
      wiped.forEach((c, idx) => {
        const room = MANSION_ROOMS[c.roomId];
        const item = document.createElement('div');
        item.classList.add('kwp-item');
        item.innerHTML = `
          <div class="kwp-header">
            <strong class="kwp-title">🧹 ${idx + 1}. ${c.title}</strong>
            <span class="kwp-room">${room ? room.name : ''} ${room ? room.emoji : ''}</span>
          </div>
          <div class="kwp-desc">${c.revealDesc || c.revealTitle}</div>
          <div class="kwp-footer">
            <span class="kwp-status">✓ หายไปจากห้องแล้ว (นักสืบจะไม่พบ)</span>
          </div>
        `;
        listContainer.appendChild(item);
      });
    }
  }
}

function renderPlayersList(players, currentIndex) {
  const container = document.getElementById('players-list');
  if (!container) return;
  container.innerHTML = '';

  const currentPlayer = players[currentIndex];

  players.forEach((p, idx) => {
    const row = document.createElement('div');
    row.classList.add('player-row');
    if (idx === currentIndex) row.classList.add('active');
    if (p.eliminated) row.classList.add('eliminated');

    const suspect = getSuspectById(p.suspectId) || SUSPECTS.find(s => s.id === p.suspectId) || {};

    const img = document.createElement('img');
    img.classList.add('player-thumb');
    img.src = p.image || suspect.image || 'assets/images/scarlett.jpg';
    img.alt = p.name;
    img.style.borderColor = p.color || suspect.color || 'var(--border-gold)';

    const info = document.createElement('div');
    info.classList.add('player-row-info');

    const name = document.createElement('span');
    name.classList.add('player-row-name');
    name.textContent = p.name;

    // Character role (e.g. หญิงสาวชุดราตรีสีแดงทรงเสน่ห์)
    const charRole = document.createElement('span');
    charRole.classList.add('player-row-char-role');
    charRole.textContent = `🎭 ${p.suspectRole || suspect.role || ''}`;

    const loc = document.createElement('span');
    loc.classList.add('player-row-role');
    const curRoom = p.currentRoomId ? MANSION_ROOMS[p.currentRoomId] : null;
    loc.textContent = curRoom ? `📍 ${curRoom.name} ${curRoom.emoji}` : '📍 กำลังเลือกห้อง 🗺️';

    const type = document.createElement('span');
    type.classList.add('player-row-type');
    type.textContent = p.eliminated ? '❌ หลุดจากคดีแล้ว' : (p.isAI ? '🤖 ผู้ช่วย AI' : (idx === currentIndex ? '👤 คุณ' : '👥 ผู้เล่น'));

    info.appendChild(name);
    info.appendChild(charRole);
    info.appendChild(loc);
    info.appendChild(type);

    const inspectBtn = document.createElement('button');
    inspectBtn.classList.add('btn-player-inspect');
    inspectBtn.innerHTML = '👁️ อ่านโรล';
    inspectBtn.title = `คลิกเพื่ออ่านบทบาทและประวัติของ ${p.name}`;

    row.appendChild(img);
    row.appendChild(info);
    row.appendChild(inspectBtn);

    row.style.cursor = 'pointer';
    row.title = `คลิกเพื่ออ่านบทบาท & ข้อมูลของ ${p.name}`;
    row.onclick = () => {
      showPlayerRoleModal(p, currentPlayer, typeof G !== 'undefined' && G ? G.scenario : null);
    };

    container.appendChild(row);
  });
}

/**
 * Render Detective Dossier (Discovered Evidence Log)
 */
function renderDossier(gameState) {
  const container = document.getElementById('dossier-clues-list');
  const countBadge = document.getElementById('dossier-count-badge');
  const progressText = document.getElementById('dossier-progress-text');
  const progressBar = document.getElementById('dossier-progress-bar');
  if (!container) return;

  const clues = gameState.discoveredClues || [];
  if (countBadge) countBadge.textContent = `พบ ${clues.length} เบาะแส`;
  if (progressText) progressText.textContent = `${clues.length} / 15 หลักฐาน`;
  if (progressBar) {
    const pct = Math.min(100, Math.round((clues.length / 15) * 100));
    progressBar.style.width = `${pct}%`;
  }

  if (clues.length === 0) {
    container.innerHTML = '<div class="dossier-empty">ยังไม่พบร่องรอยใดๆ เดินเข้าห้องแล้วแตะเครื่องหมาย ? เพื่อเริ่มสืบ!</div>';
    return;
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isPlayerKiller = currentPlayer && currentPlayer.isKiller && !currentPlayer.isAI;

  container.innerHTML = '';
  clues.forEach(c => {
    const room = MANSION_ROOMS[c.roomId];
    const item = document.createElement('div');
    item.classList.add('dossier-item');

    if (c.wiped) {
      item.classList.add('dossier-wiped');
      item.innerHTML = `
        <div class="di-header">
          <span class="di-badge wiped">⚠️ รอยถูกทำลาย</span>
          <span class="di-room">${room ? room.name : ''}</span>
        </div>
        <div class="di-title">🧹 ${c.title}</div>
        <div class="di-desc">${c.wipedText || 'ร่องรอยนี้ถูกเช็ดทำความสะอาดใหม่อย่างเร่งรีบ! (น่าสงสัยมาก)'}</div>
        <div class="di-finder">ตรวจพบโดย: ${c.discoveredByName}</div>
      `;
    } else {
      if (c.isCritical) item.classList.add('dossier-critical');
      const forgedBadge = (c.isForged && isPlayerKiller) ? '<span class="di-badge forged" style="background:#5c1d73; color:#f0c0ff; margin-left:4px;">🎭 คุณสลับหลักฐานนี้</span>' : '';
      item.innerHTML = `
        <div class="di-header">
          <span class="di-badge ${c.isCritical ? 'critical' : 'decoy'}">
            ${c.isCritical ? '⭐ หลักฐานสำคัญ' : '☕ เบาะแสลวง'}
          </span>
          ${forgedBadge}
          <span class="di-room">${room ? room.name : ''}</span>
        </div>
        <div class="di-title">${c.revealTitle}</div>
        <div class="di-desc">${c.revealDesc}</div>
        <div class="di-finder">ตรวจพบโดย: ${c.discoveredByName}</div>
      `;
    }

    container.appendChild(item);
  });
}

/**
 * Show Secret Role Modal (Briefing)
 */
function showSecretRoleModal(player, scenario, onOk) {
  const badgeEl = document.getElementById('sr-badge');
  const titleEl = document.getElementById('sr-title');
  const avatarEl = document.getElementById('sr-avatar');
  const nameEl = document.getElementById('sr-player-name');
  const descEl = document.getElementById('sr-desc');
  const missionBox = document.getElementById('sr-mission-box');

  if (avatarEl) avatarEl.src = player.image || 'assets/images/scarlett.jpg';
  if (nameEl) {
    nameEl.textContent = (player.name && player.name !== player.suspectName)
      ? `${player.name} (${player.suspectName})`
      : (player.name || player.suspectName || '');
  }

  if (player.isKiller) {
    if (badgeEl) {
      badgeEl.textContent = '🩸 คุณคือฆาตกรตัวจริง (The Killer)';
      badgeEl.className = 'modal-header-tag danger-tag';
    }
    if (titleEl) titleEl.textContent = scenario ? scenario.title : 'ภารกิจลับ: ทำลายหลักฐานและปกปิดจุดซ่อนศพ!';
    if (descEl) {
      const room = scenario ? MANSION_ROOMS[scenario.murderRoom] : null;
      descEl.innerHTML = `
        <div class="killer-briefing-dossier" style="background: rgba(226, 75, 75, 0.12); border: 1px solid rgba(226, 75, 75, 0.4); border-radius: 8px; padding: 14px; margin-bottom: 12px; text-align: left;">
          <div style="font-weight: 700; color: #ff8888; font-size: 1.05rem; margin-bottom: 8px;">
            🩸 แผนการฆาตกรรมของคุณในตานี้:
          </div>
          <div style="margin-bottom: 6px; font-size: 0.95rem;">
            <strong style="color: var(--gold-light);">🔪 วิธีการสังหาร:</strong> 
            <span style="color: #fff; font-weight: 600;">${scenario ? `${scenario.weaponEmoji || '🔪'} ${scenario.weaponName || ''}` : ''}</span>
          </div>
          <div style="margin-bottom: 6px; font-size: 0.95rem;">
            <strong style="color: var(--gold-light);">🚪 ห้องเกิดเหตุ (สถานที่ลงมือ):</strong> 
            <span style="color: #fff; font-weight: 600;">${room ? `${room.name} (${room.nameEn})` : 'ห้องเกิดเหตุ'}</span>
          </div>
          <div style="margin-bottom: 10px; font-size: 0.95rem;">
            <strong style="color: var(--gold-light);">⚰️ จุดซ่อนศพ เซอร์ ฮิวจ์:</strong> 
            <span style="color: #ffcccc; font-weight: 600;">${scenario ? scenario.hiddenCorpseLocation : 'จุดซ่อนศพลับ'}</span>
          </div>
          <div style="border-top: 1px dashed rgba(226, 75, 75, 0.3); padding-top: 10px; margin-top: 10px;">
            <strong style="color: #ff9999; display: block; margin-bottom: 4px;">📖 เรื่องราวการลงมือสังหารของคุณในตานี้:</strong>
            <p style="color: #f5e6e8; font-size: 0.92rem; line-height: 1.6; margin: 0 0 8px 0;">
              ${scenario ? scenario.introStory : ''}
            </p>
          </div>
        </div>
      `;
    }
    if (missionBox) {
      missionBox.className = 'sr-mission-box killer-box';
      missionBox.innerHTML = `
        <h4>🎯 ภารกิจและคำแนะนำสำหรับฆาตกร:</h4>
        <div style="color: #ffd2d2; font-size: 0.9rem; margin-bottom: 8px; line-height: 1.5;">
          ${scenario ? scenario.killerBriefing : ''}
        </div>
        <ul>
          <li>เดินเข้าห้องเกิดเหตุ หรือห้องต่างๆ เพื่อลบร่องรอย</li>
          <li>คลิกจุด <strong>?</strong> หรือปุ่มร่องรอย แล้วเลือก <strong>"🧹 เช็ดทำลายร่องรอย"</strong></li>
          <li>หลักฐานที่ถูกทำลายจะหายไปจากห้องอย่างสมบูรณ์ นักสืบจะตรวจไม่พบอีก</li>
          <li>หลอกล่อนักสืบและป้ายความผิดให้ผู้เล่นอื่น!</li>
        </ul>
      `;
    }
  } else {
    if (badgeEl) {
      badgeEl.textContent = '🔍 คุณคือนักสืบผู้บริสุทธิ์ (Innocent Detective)';
      badgeEl.className = 'modal-header-tag';
    }
    if (titleEl) titleEl.textContent = 'ภารกิจ: สืบหาร่องรอยและชี้ตัวฆาตกร!';
    if (descEl) {
      descEl.innerHTML = `
        ในค่ำคืนนี้ เซอร์ ฮิวจ์ แบล็ควูด ได้หายตัวไปอย่างลึกลับ และศพของเขาถูกนำไปซ่อนไว้!
        <br>หนึ่งในผู้ต้องสงสัยที่อยู่ในบ้านคือ <strong>ฆาตกรตัวจริง</strong> ที่กำลังแอบหาทางทำลายหลักฐานและปกปิดจุดซ่อนศพ!
      `;
    }
    if (missionBox) {
      missionBox.className = 'sr-mission-box detective-box';
      missionBox.innerHTML = `
        <h4>🔍 คำสั่งสำหรับนักสืบ:</h4>
        <ul>
          <li>เลือกเดินเข้าห้องต่างๆ เพื่อตรวจร่องรอย (เลือกได้ 1 จุดต่อเทิร์น)</li>
          <li>รวบรวมเบาะแสสำคัญ และสังเกตคนที่เดินเข้าห้องเกิดเหตุเพื่อลบรอย</li>
          <li>เมื่อมั่นใจแล้ว ให้กดปุ่ม <strong>"ชี้ตัวคนร้ายขั้นสุดท้าย!"</strong> เพื่อชี้ตัวฆาตกรและหาศพของเซอร์ ฮิวจ์!</li>
        </ul>
      `;
    }
  }

  const okBtn = document.getElementById('btn-secret-role-ok');
  if (okBtn) {
    const fresh = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(fresh, okBtn);
    fresh.addEventListener('click', () => {
      hideModal('modal-secret-role');
      if (onOk) onOk();
    }, { once: true });
  }

  showModal('modal-secret-role');
}

/**
 * Show Player & Character Role Inspector Modal
 * Allows any player to view their own role/mission or friends' character profiles anytime
 */
function showPlayerRoleModal(targetPlayer, currentPlayer, scenario) {
  const badgeEl = document.getElementById('pr-badge');
  const titleEl = document.getElementById('pr-title');
  const avatarEl = document.getElementById('pr-avatar');
  const nameEl = document.getElementById('pr-suspect-name');
  const rolePillEl = document.getElementById('pr-role-pill');
  const descEl = document.getElementById('pr-desc');
  const motiveEl = document.getElementById('pr-motive');
  const secretBox = document.getElementById('pr-secret-box');
  const secretTitle = document.getElementById('pr-secret-title');
  const secretDesc = document.getElementById('pr-secret-desc');
  const otherBox = document.getElementById('pr-other-box');
  const closeBtn = document.getElementById('btn-player-role-close');

  const suspect = getSuspectById(targetPlayer.suspectId) || SUSPECTS.find(s => s.id === targetPlayer.suspectId) || {};
  const isSelf = currentPlayer && (targetPlayer.name === currentPlayer.name && targetPlayer.suspectId === currentPlayer.suspectId);

  if (avatarEl) avatarEl.src = targetPlayer.image || suspect.image || 'assets/images/scarlett.jpg';
  if (nameEl) nameEl.textContent = `${targetPlayer.name} (${suspect.name || ''})`;
  if (rolePillEl) rolePillEl.textContent = targetPlayer.suspectRole || suspect.role || 'ผู้ต้องสงสัย';
  if (descEl) descEl.textContent = suspect.desc || 'ไม่มีข้อมูลเพิ่มเติม';
  if (motiveEl) motiveEl.textContent = suspect.motive || 'ไม่มีข้อมูลแรงจูงใจ';

  if (isSelf) {
    if (badgeEl) {
      badgeEl.textContent = targetPlayer.isKiller ? '🩸 บทบาทลับของคุณ (ฆาตกรตัวจริง)' : '🔍 บทบาทของคุณ (นักสืบผู้บริสุทธิ์)';
      badgeEl.className = targetPlayer.isKiller ? 'modal-header-tag danger-tag' : 'modal-header-tag';
    }
    if (titleEl) titleEl.textContent = `บทบาทและข้อมูลของคุณ — ${targetPlayer.name}`;

    if (secretBox) {
      secretBox.classList.remove('hidden');
      secretBox.style.display = 'block';
    }
    if (otherBox) {
      otherBox.classList.add('hidden');
      otherBox.style.display = 'none';
    }

    if (targetPlayer.isKiller) {
      if (secretTitle) secretTitle.innerHTML = '🩸 คุณคือฆาตกรตัวจริง! (The Killer)';
      if (secretDesc) {
        const murderRoom = scenario ? MANSION_ROOMS[scenario.murderRoom] : null;
        secretDesc.innerHTML = `
          <div class="killer-role-dossier" style="background: rgba(226, 75, 75, 0.12); border: 1px solid rgba(226, 75, 75, 0.4); border-radius: 8px; padding: 12px; margin-top: 6px; text-align: left;">
            <div style="font-weight: 700; color: #ff8888; font-size: 1rem; margin-bottom: 8px;">
              📂 ${scenario ? scenario.title : 'แผนการฆาตกรรมของคุณ'}
            </div>
            <div style="margin-bottom: 6px; font-size: 0.9rem;">
              <strong style="color: var(--gold-light);">🔪 วิธีการสังหาร:</strong> 
              <span style="color: #fff; font-weight: 600;">${scenario ? `${scenario.weaponEmoji || '🔪'} ${scenario.weaponName || ''}` : ''}</span>
            </div>
            <div style="margin-bottom: 6px; font-size: 0.9rem;">
              <strong style="color: var(--gold-light);">🚪 ห้องเกิดเหตุ:</strong> 
              <span style="color: #fff; font-weight: 600;">${murderRoom ? `${murderRoom.name} (${murderRoom.nameEn})` : 'ห้องเกิดเหตุ'}</span>
            </div>
            <div style="margin-bottom: 10px; font-size: 0.9rem;">
              <strong style="color: var(--gold-light);">⚰️ จุดซ่อนศพ เซอร์ ฮิวจ์:</strong> 
              <span style="color: #ffcccc; font-weight: 600;">${scenario ? scenario.hiddenCorpseLocation : 'จุดซ่อนศพลับ'}</span>
            </div>
            <div style="border-top: 1px dashed rgba(226, 75, 75, 0.3); padding-top: 8px; margin-top: 8px;">
              <strong style="color: #ff9999; display: block; margin-bottom: 4px;">📖 เรื่องราวการฆาตกรรมในตานี้ (คุณลงมือยังไง):</strong>
              <p style="color: #e0e0e0; font-size: 0.88rem; line-height: 1.5; margin: 0 0 8px 0;">
                ${scenario ? scenario.introStory : ''}
              </p>
              <strong style="color: #ff9999; display: block; margin-bottom: 4px;">🎯 แผนการและภารกิจ:</strong>
              <p style="color: #ffdede; font-size: 0.86rem; line-height: 1.45; margin: 0;">
                ${scenario ? scenario.killerBriefing : 'แอบเดินไปเช็ดทำลายร่องรอยในห้อง หรือสลับวางหลักฐานลวงเพื่อป้ายความผิดให้คนอื่น ก่อนที่นักสืบจะชี้ตัวคุณ!'}
              </p>
            </div>
          </div>
        `;
      }
    } else {
      if (secretTitle) secretTitle.innerHTML = '🔍 คุณคือนักสืบผู้บริสุทธิ์! (Innocent Detective)';
      if (secretDesc) {
        secretDesc.innerHTML = `
          <strong>เป้าหมาย:</strong> เดินสำรวจห้องต่างๆ ในคฤหาสน์ ตรวจร่องรอย ถอดรหัสภาพจิ๊กซอว์ และรวบรวมเบาะแสทั้ง 5 จุดที่สาวถึงตัวคนร้ายจริง<br>
          เมื่อมีหลักฐานมั่นใจ ให้กดปุ่ม <strong>"ชี้ตัวคนร้ายขั้นสุดท้าย!"</strong> เพื่อชี้ตัวฆาตกร อาวุธ และห้องเกิดเหตุ!
        `;
      }
    }
  } else {
    if (badgeEl) {
      badgeEl.textContent = `👥 ข้อมูลตัวละครของ ${targetPlayer.name}`;
      badgeEl.className = 'modal-header-tag';
    }
    if (titleEl) titleEl.textContent = `ประวัติ & ข้อมูลบทบาทของ ${targetPlayer.name}`;

    if (secretBox) {
      secretBox.classList.add('hidden');
      secretBox.style.display = 'none';
    }
    if (otherBox) {
      otherBox.classList.remove('hidden');
      otherBox.style.display = 'block';
    }
  }

  if (closeBtn) {
    closeBtn.onclick = () => hideModal('modal-player-role');
  }

  showModal('modal-player-role');
}

/**
 * Update Turn 3-Step Progress Bar
 */
function updateTurnStepBar(step) {
  const s1 = document.getElementById('step-node-1');
  const s2 = document.getElementById('step-node-2');
  const s3 = document.getElementById('step-node-3');

  if (!s1 || !s2 || !s3) return;

  [s1, s2, s3].forEach(s => s.className = 'step-node');

  if (step === 1) {
    s1.classList.add('active');
  } else if (step === 2) {
    s1.classList.add('completed');
    s2.classList.add('active');
  } else if (step === 3) {
    s1.classList.add('completed');
    s2.classList.add('completed');
    s3.classList.add('active');
  }
}

/**
 * Show Evidence Reveal Modal (When clicking ?)
 */
function showEvidenceRevealModal(clue, onOk) {
  const tagEl   = document.getElementById('er-tag');
  const titleEl = document.getElementById('er-title');
  const iconEl  = document.getElementById('er-icon-box');
  const itemTitle = document.getElementById('er-item-title');
  const itemDesc  = document.getElementById('er-item-desc');
  const alertBox  = document.getElementById('er-alert-box');

  if (clue.wiped) {
    if (tagEl) {
      tagEl.textContent = '⚠️ ร่องรอยถูกทำลาย!';
      tagEl.className = 'modal-header-tag danger-tag';
    }
    if (titleEl) titleEl.textContent = 'มีคนแอบทำลายหลักฐาน!';
    if (iconEl) iconEl.textContent = '🧹';
    if (itemTitle) itemTitle.textContent = clue.title;
    if (itemDesc) itemDesc.textContent = clue.wipedText || 'ร่องรอยนี้ถูกเช็ดทำความสะอาดใหม่อย่างเร่งรีบ! (น่าสงสัยมาก มีคนพยายามอำพรางคดี!)';
    if (alertBox) {
      alertBox.className = 'er-alert-box danger-alert';
      alertBox.innerHTML = '🚨 <strong>ข้อสังเกต:</strong> แสดงว่าฆาตกรตัวจริงต้องเพิ่งเข้ามาในห้องนี้เพื่อลบหลักฐาน!';
    }
  } else {
    if (clue.isCritical) {
      if (tagEl) {
        tagEl.textContent = '⭐ หลักฐานชิ้นสำคัญ!';
        tagEl.className = 'modal-header-tag danger-tag';
      }
      if (titleEl) titleEl.textContent = 'พบหลักฐานมัดตัว!';
      if (iconEl) iconEl.textContent = '🩸';
      if (itemTitle) itemTitle.textContent = clue.revealTitle;
      if (itemDesc) itemDesc.textContent = clue.revealDesc;
      if (alertBox) {
        alertBox.className = 'er-alert-box success-alert';
        alertBox.innerHTML = '💡 <strong>หลักฐานชิ้นนี้เกี่ยวข้องกับคดีโดยตรง!</strong> บันทึกลงแฟ้มแล้วใช้ชี้ตัวคนร้ายได้';
      }
    } else {
      if (tagEl) {
        tagEl.textContent = '☕ เบาะแสลวง';
        tagEl.className = 'modal-header-tag';
      }
      if (titleEl) titleEl.textContent = 'ตรวจสอบร่องรอยแล้ว';
      if (iconEl) iconEl.textContent = '🔍';
      if (itemTitle) itemTitle.textContent = clue.revealTitle;
      if (itemDesc) itemDesc.textContent = clue.revealDesc;
      if (alertBox) {
        alertBox.className = 'er-alert-box info-alert';
        alertBox.innerHTML = 'ℹ️ สิ่งนี้เป็นเพียงสิ่งของทั่วไป ไม่เกี่ยวข้องกับการฆาตกรรม';
      }
    }
  }

  const okBtn = document.getElementById('btn-evidence-ok');
  if (okBtn) {
    const fresh = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(fresh, okBtn);
    fresh.addEventListener('click', () => {
      hideModal('modal-evidence-reveal');
      if (onOk) onOk();
    }, { once: true });
  }

  showModal('modal-evidence-reveal');
}

/**
 * Show Killer Action Modal (Wipe vs Inspect vs Swap Decoy)
 */
function showKillerActionModal(clue, onWipe, onInspect, onSwap, onCancel) {
  const titleEl = document.getElementById('ka-clue-title');
  if (titleEl) titleEl.textContent = `ร่องรอย: ${clue.title}`;

  const optionsGrid = document.getElementById('ka-options-grid');
  const decoyWrap   = document.getElementById('killer-decoy-wrap');
  const decoyList   = document.getElementById('killer-decoy-list');
  const decoyBack   = document.getElementById('btn-killer-decoy-back');
  const cancelBtn   = document.getElementById('btn-killer-cancel');
  const wipeBtn     = document.getElementById('btn-killer-wipe');
  const swapBtn     = document.getElementById('btn-killer-swap');
  const inspectBtn  = document.getElementById('btn-killer-inspect');

  // Reset display
  if (optionsGrid) optionsGrid.classList.remove('hidden');
  if (decoyWrap) decoyWrap.classList.add('hidden');

  if (wipeBtn) {
    const freshWipe = wipeBtn.cloneNode(true);
    wipeBtn.parentNode.replaceChild(freshWipe, wipeBtn);
    freshWipe.addEventListener('click', () => {
      hideModal('modal-killer-action');
      if (onWipe) onWipe();
    }, { once: true });
  }

  if (inspectBtn) {
    const freshInspect = inspectBtn.cloneNode(true);
    inspectBtn.parentNode.replaceChild(freshInspect, inspectBtn);
    freshInspect.addEventListener('click', () => {
      hideModal('modal-killer-action');
      if (onInspect) onInspect();
    }, { once: true });
  }

  if (swapBtn) {
    const freshSwap = swapBtn.cloneNode(true);
    swapBtn.parentNode.replaceChild(freshSwap, swapBtn);
    freshSwap.addEventListener('click', () => {
      if (optionsGrid) optionsGrid.classList.add('hidden');
      if (decoyWrap) {
        decoyWrap.classList.remove('hidden');
        renderDecoys();
      }
    });
  }

  let activeDecoyCategory = 'crucial';
  let activeSuspectFilter = 'all';

  const tabCrucial = document.getElementById('tab-decoy-crucial');
  const tabNeutral = document.getElementById('tab-decoy-neutral');
  const suspectFiltersContainer = document.getElementById('decoy-suspect-filters');

  if (tabCrucial) {
    tabCrucial.onclick = () => {
      activeDecoyCategory = 'crucial';
      tabCrucial.classList.add('active');
      if (tabNeutral) tabNeutral.classList.remove('active');
      renderDecoys();
    };
  }

  if (tabNeutral) {
    tabNeutral.onclick = () => {
      activeDecoyCategory = 'neutral';
      tabNeutral.classList.add('active');
      if (tabCrucial) tabCrucial.classList.remove('active');
      renderDecoys();
    };
  }

  function renderSuspectFilters(killerSuspectId) {
    if (!suspectFiltersContainer) return;
    suspectFiltersContainer.innerHTML = '';

    if (activeDecoyCategory !== 'crucial') {
      suspectFiltersContainer.classList.add('hidden');
      return;
    }
    suspectFiltersContainer.classList.remove('hidden');

    const suspectsList = (typeof SUSPECTS !== 'undefined') ? Object.values(SUSPECTS) : [];
    const innocentSuspects = suspectsList.filter(s => s.id !== killerSuspectId);

    // "ทั้งหมด" chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.classList.add('suspect-filter-chip');
    if (activeSuspectFilter === 'all') allChip.classList.add('active');
    allChip.textContent = 'ทั้งหมด';
    allChip.onclick = () => {
      activeSuspectFilter = 'all';
      renderDecoys();
    };
    suspectFiltersContainer.appendChild(allChip);

    // Innocent suspects chips
    innocentSuspects.forEach(s => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.classList.add('suspect-filter-chip');
      if (activeSuspectFilter === s.id) chip.classList.add('active');
      chip.textContent = s.name;
      chip.onclick = () => {
        activeSuspectFilter = s.id;
        renderDecoys();
      };
      suspectFiltersContainer.appendChild(chip);
    });
  }

  function renderDecoys() {
    if (!decoyList) return;
    decoyList.innerHTML = '';

    const list = (typeof FORGED_CLUES_LIST !== 'undefined') ? FORGED_CLUES_LIST : [];
    const currentPlayer = (typeof G !== 'undefined' && G.players) ? G.players[G.currentPlayerIndex] : null;
    const killerSuspectId = (typeof G !== 'undefined' && G.scenario) ? G.scenario.killerSuspectId : (currentPlayer ? currentPlayer.suspectId : null);

    renderSuspectFilters(killerSuspectId);

    // Filter by category
    let filtered = list.filter(item => {
      const cat = item.category || (item.isCritical ? 'crucial' : 'neutral');
      return cat === activeDecoyCategory;
    });

    // If crucial category, exclude killer's own suspect ID and apply suspect filter
    if (activeDecoyCategory === 'crucial') {
      filtered = filtered.filter(item => item.targetSuspectId !== killerSuspectId);
      if (activeSuspectFilter !== 'all') {
        filtered = filtered.filter(item => item.targetSuspectId === activeSuspectFilter);
      }
    }

    if (filtered.length === 0) {
      decoyList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 24px; font-size: 0.85rem;">ไม่มีเบาะแสในหมวดหมู่นี้</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('decoy-clue-card');
      const isCrucial = (item.category === 'crucial' || item.isCritical);
      card.classList.add(isCrucial ? 'crucial' : 'neutral');

      const badgeHtml = isCrucial
        ? `<span class="dcc-badge crucial">🎯 ป้ายความผิดให้: ${item.targetSuspectName || 'ผู้ต้องสงสัยอื่น'}</span>`
        : `<span class="dcc-badge neutral">🍃 ร่องรอยทั่วไป (หลอกตรวจ)</span>`;

      card.innerHTML = `
        <div class="dcc-header">
          <strong>🎭 ${item.title}</strong>
          ${badgeHtml}
        </div>
        <div class="dcc-desc">${item.revealDesc}</div>
        <div class="dcc-action-label">คลิกเพื่อสลับเป็นหลักฐานนี้ ➔</div>
      `;
      card.addEventListener('click', () => {
        hideModal('modal-killer-action');
        if (onSwap) onSwap(item);
      });
      decoyList.appendChild(card);
    });
  }

  if (decoyBack) {
    const freshBack = decoyBack.cloneNode(true);
    decoyBack.parentNode.replaceChild(freshBack, decoyBack);
    freshBack.addEventListener('click', () => {
      if (decoyWrap) decoyWrap.classList.add('hidden');
      if (optionsGrid) optionsGrid.classList.remove('hidden');
    });
  }

  if (cancelBtn) {
    const freshCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(freshCancel, cancelBtn);
    freshCancel.addEventListener('click', () => {
      hideModal('modal-killer-action');
      if (onCancel) onCancel();
    }, { once: true });
  }

  showModal('modal-killer-action');
}

/**
 * Generate a hint for Jigsaw (both genuine and bogus/vague hints)
 */
function generateJigsawHint(roomId, gameState) {
  const room = MANSION_ROOMS[roomId] || MANSION_ROOMS['hall'];
  const scenario = gameState.scenario;

  // Genuine hints pool
  const genuineHints = [];

  // 1. Murder room hint
  if (roomId === scenario.murderRoom) {
    genuineHints.push({
      isGenuine: true,
      badge: '⭐ เบาะแสสำคัญ: ห้องเกิดเหตุฆาตกรรม',
      text: `🩸 <strong>ห้องเกิดเหตุฆาตกรรม!</strong> ภาพที่ต่อสมบูรณ์เผยให้เห็นคราบเลือดและการดิ้นรนต่อสู้อย่างดุเดือด ยืนยันได้ 100% ว่า <strong>${room.name} คือห้องที่เกิดเหตุฆาตกรรม!</strong>`
    });
  } else {
    const murderRoomObj = MANSION_ROOMS[scenario.murderRoom];
    genuineHints.push({
      isGenuine: true,
      badge: '⭐ เบาะแสสำคัญ: ทิศทางห้องเกิดเหตุ',
      text: `🩸 <strong>ร่องรอยการดิ้นรน:</strong> ภาพสะท้อนให้เห็นรอยหยดเลือดแห้งที่เชื่อมต่อตรงไปยัง <strong>${murderRoomObj ? murderRoomObj.name : 'ห้องอื่น'}</strong> น่าจะเป็นห้องที่เกิดเหตุฆาตกรรม!`
    });
  }

  // 2. Critical clue room
  let critRoomId = null;
  for (const [rId, clues] of Object.entries(gameState.roomClues)) {
    if (clues.some(c => c.isCritical && !c.wiped)) {
      critRoomId = rId;
      break;
    }
  }
  if (critRoomId) {
    const critRoomObj = MANSION_ROOMS[critRoomId];
    genuineHints.push({
      isGenuine: true,
      badge: '⭐ เบาะแสสำคัญ: หลักฐานมัดตัวคนร้าย',
      text: `🔍 <strong>พบเบาะแสสำคัญ:</strong> สังเกตพบร่องรอยการหลบหนีและสิ่งของต้องสงสัยมุ่งหน้าไปยัง <strong>${critRoomObj ? critRoomObj.name : 'ห้องอื่น'}</strong> มีหลักฐานมัดตัวคนร้ายซ่อนอยู่ที่นั่น!`
    });
  }

  // 3. Hidden corpse location
  if (scenario.hiddenCorpseLocation) {
    genuineHints.push({
      isGenuine: true,
      badge: '⭐ เบาะแสสำคัญ: จุดซ่อนศพลับ',
      text: `⚰️ <strong>จุดซ่อนศพของ เซอร์ ฮิวจ์:</strong> แผนผังในภาพมีรอยขีดเขียนลับชี้ไปยัง <strong>${scenario.hiddenCorpseLocation}</strong> คนร้ายต้องนำศพไปซ่อนไว้ที่นั่นแน่นอน!`
    });
  }

  // 4. Weapon hint
  if (scenario.weaponName) {
    genuineHints.push({
      isGenuine: true,
      badge: '⭐ เบาะแสสำคัญ: อาวุธสังหาร',
      text: `🔪 <strong>ร่องรอยอาวุธสังหาร:</strong> พบคราบรอยครูดและลักษณะบาดแผลที่เข้าได้กับ <strong>${scenario.weaponName} (${scenario.weaponEmoji || ''})</strong> อย่างชัดเจน!`
    });
  }

  // Bogus / Random / Vague hints pool (ใบ้มั่วๆ / ข้อมูลสับสน / เบาะแสไม่แน่นอน)
  const bogusHints = [
    {
      isGenuine: false,
      badge: '💭 ข้อมูลชวนสับสน (คำบอกเล่าพยาน)',
      text: 'มีพยานอ้างว่าได้ยินเสียงกรีดร้องดังมาจากสวนหลังบ้านในคืนเกิดเหตุ แต่ไม่มีใครยืนยันได้ว่าเป็นเรื่องจริงหรือเสียงลมพายุ...'
    },
    {
      isGenuine: false,
      badge: '💭 เบาะแสลวงตา (ภาพสะท้อนเงา)',
      text: 'แสงไฟจากโคมระย้ากระทบกับผ้าม่านทำให้เกิดเงามืดวูบวาบ อาจเป็นเพียงภาพลวงตาจากลมพายุที่พัดหน้าต่างเปิดออก...'
    },
    {
      isGenuine: false,
      badge: '💭 เสียงลือเสียงเล่าอ้าง (คำให้การคนรับใช้)',
      text: 'คนรับใช้เล่าว่าได้ยินเสียงแก้วแตกแถวห้องอาหาร แต่เมื่อตรวจดูแล้วกลับไม่พบเศษแก้วหรือร่องรอยความผิดปกติใดๆ...'
    },
    {
      isGenuine: false,
      badge: '💭 คำให้การคลุมเครือ (สิ่งมีชีวิตแปลกปลอม)',
      text: 'แขกคนหนึ่งอ้างว่าเห็นแมวดำวิ่งผ่านบันไดลับในเวลาที่เกิดเหตุ แต่ไม่มีรอยเท้าของคนอื่น...'
    },
    {
      isGenuine: false,
      badge: '💭 ข้อสังเกตทั่วไป (ฝุ่นผงโบราณ)',
      text: 'พบรอยเปื้อนฝุ่นหนาที่ตู้ไม้โบราณ คาดว่าเป็นเพียงรอยเก่าที่ไม่มีใครเช็ดมานานหลายสัปดาห์ ไม่เกี่ยวข้องกับคดี...'
    },
    {
      isGenuine: false,
      badge: '💭 ข่าวลือในคฤหาสน์ (แรงจูงใจร่วม)',
      text: 'เซอร์ ฮิวจ์ เคยมีปากเสียงกับแขกเกือบทุกคนเรื่องหนี้สินและผลประโยชน์ ทุกคนดูมีพิรุธไปหมดในสายตาคุณ...'
    },
    {
      isGenuine: false,
      badge: '💭 รอยที่น่าสงสัย? (คราบน้ำหก)',
      text: 'มีคราบน้ำชาเอิร์ลเกรย์หกเปื้อนพรม แต่ตรวจดูแล้วเป็นเพียงคราบเครื่องดื่มที่หกค้างไว้เมื่อหัวค่ำ...'
    },
    {
      isGenuine: false,
      badge: '💭 คำให้การชวนเวียนหัว (ช่วงเวลาทับซ้อน)',
      text: 'พยานบอกว่าเห็นแขกหลายคนเดินเข้าออกห้องบอลรูมพร้อมๆ กัน ทำให้ช่วงเวลาของคดีดูสับสนไปหมด...'
    },
    {
      isGenuine: false,
      badge: '💭 เบาะแสไม่แน่นอน (เสียงชั้นบน)',
      text: 'ได้ยินเสียงฝีเท้าหนักๆ บนชั้นสอง แต่เมื่อเดินขึ้นไปดูกลับพบเพียงหน้าต่างที่ปิดไม่สนิทและผ้าม่านสะบัด...'
    },
    {
      isGenuine: false,
      badge: '💭 รายงานคลาดเคลื่อน (มีดทำครัว)',
      text: 'มีคนอ้างว่าพบมีดเล่มหนึ่งตกอยู่ แต่จริงๆ แล้วเป็นเพียงมีดปอกผลไม้ธรรมดาที่แม่ครัวลืมเก็บไว้...'
    },
    {
      isGenuine: false,
      badge: '💭 ซากปริศนา (เปลือกถั่วลิสง)',
      text: 'พบเปลือกถั่วลิสงกระจัดกระจายใต้โต๊ะทำงาน คล้ายมีใครบางคนแอบมานั่งเคี้ยวแก้เครียด... แต่นี่ไม่ใช่หลักฐานฆาตกรรมแน่นอน'
    },
    {
      isGenuine: false,
      badge: '💭 กลิ่นลึกลับ (ควันซิการ์)',
      text: 'ได้กลิ่นควันซิการ์ฉุนกึกในโถงทางเดิน แต่เมื่อตามรอยไปพบเพียงก้นซิการ์ที่คนสวนแอบมาสูบทิ้งไว้เมื่อตอนบ่าย'
    },
    {
      isGenuine: false,
      badge: '💭 ร่องรอยสีแดง (แยมสตรอว์เบอร์รี)',
      text: 'พบหยดสีแดงเหนียวข้นบนขอบโต๊ะไม้! แต่เมื่อก้มลงดมใกล้ๆ กลับมีกลิ่นหอมหวาน... มันคือแยมสตรอว์เบอร์รีที่เด็กรับใช้ทำหก'
    },
    {
      isGenuine: false,
      badge: '💭 เอกสารต้องสงสัย (บิลค่าตัดชุด)',
      text: 'พบเศษกระดาษฉีกขาดมีตัวเลขหลักพันถูกขยำทิ้งไว้... อ่านดูดีๆ ปรากฏว่าเป็นใบเสร็จค่าตัดชุดราตรีหรู ไม่เกี่ยวข้องกับคดี'
    },
    {
      isGenuine: false,
      badge: '💭 เสียงประหลาด (ท่อประปาเก่า)',
      text: 'มีคนได้ยินเสียงเคาะดังกึกกักจังหวะสม่ำเสมอหลังกำแพงห้องสมุด... แท้จริงแล้วเป็นเพียงเสียงท่อน้ำประปาเก่าที่มีฟองอากาศ'
    },
    {
      isGenuine: false,
      badge: '💭 เส้นใยปริศนา (ขนแมวเปอร์เซีย)',
      text: 'พบเส้นขนสีขาวฟูติดอยู่บนพนักเก้าอี้กำมะหยี่สีแดง... สรุปได้ว่าเป็นขนของเจ้า "มียู" แมวทรงเลี้ยงของเลดี้ ไม่ใช่เส้นผมคนร้าย'
    },
    {
      isGenuine: false,
      badge: '💭 ข้อความลับ (รายการจ่ายตลาด)',
      text: 'พบสมุดบันทึกลับที่เขียนว่า "ซื้อนม, ขนมปัง, กำจัดหนู, ยาฆ่าแมลง"... ดูเหมือนจะเป็นเพียงรายการซื้อของเข้าครัวของแม่บ้าน'
    },
    {
      isGenuine: false,
      badge: '💭 วัตถุแวววาว (กระดุมเสื้อโค้ต)',
      text: 'ประกายระยิบระยับใต้พรมทำให้ตกใจ! แต่เมื่อหยิบขึ้นมาพบว่าเป็นเพียงกระดุมเสื้อโค้ตธรรมดาที่หลุดร่วงมานานแล้ว'
    },
    {
      isGenuine: false,
      badge: '💭 เงาตะคุ่ม (หุ่นโชว์เสื้อผ้า)',
      text: 'แขกคนหนึ่งตกใจแทบสิ้นสติ อ้างว่าเห็นคนยืนนิ่งถือมีดในเงามืด... แต่พอเปิดไฟดู ปรากฏว่าเป็นหุ่นลองเสื้อในห้องตัดเย็บ'
    },
    {
      isGenuine: false,
      badge: '💭 ข่าวลือแม่ครัว (สูตรลับหายสาบสูญ)',
      text: 'แม่ครัวโวยวายว่ามีคนบุกรุกห้องครัวขโมยสมุดสูตรพายแอปเปิ้ลประจำตระกูลไป ซึ่งอาจไม่มีส่วนเกี่ยวข้องกับการฆาตกรรมแม้แต่น้อย'
    },
    {
      isGenuine: false,
      badge: '💭 รอยมือเปื้อน (คราบช็อกโกแลต)',
      text: 'พบรอยฝ่ามือสีน้ำตาลเข้มบนบานประตูห้องนั่งเล่น... ตรวจพิสูจน์แล้วคือคราบช็อกโกแลตฟองดูว์ที่แขกคนหนึ่งกินเลอะมือ'
    },
    {
      isGenuine: false,
      badge: '💭 ประตูลับที่ถูกลืม (ห้องเก็บไม้กวาด)',
      text: 'พบรอยแยกหลังตู้หนังสือ คิดว่าเป็นประตูลับของฆาตกร... พอผลักเข้าไปกลับเป็นแค่ตู้เก็บไม้กวาดและถังน้ำเก่าๆ'
    },
    {
      isGenuine: false,
      badge: '💭 คราบปริศนา (เทียนไขหยด)',
      text: 'พบคราบสีขาวขุ่นเกาะเป็นก้อนข้างเตาผิง... ตรวจสอบแล้วเป็นเพียงน้ำตาเทียนที่ละลายหยดลงมา ไม่ใช่สารเคมีพิษใดๆ'
    },
    {
      isGenuine: false,
      badge: '💭 กุญแจลึกลับ (กุญแจตู้ไปรษณีย์)',
      text: 'พบลูกกุญแจทองเหลืองตกอยู่หน้าเตาผิง คิดว่าไขห้องลับได้... แต่ลองเอาไปไขดูแล้วมันคือลูกกุญแจตู้ไปรษณีย์หน้าบ้าน'
    },
    {
      isGenuine: false,
      badge: '💭 พยานปากเอก (นกแก้วช่างพูด)',
      text: 'นกแก้วในกรงตะโกนคำว่า "อย่าทำ! อย่านะ!" ซ้ำๆ... แต่พ่อบ้านบอกว่ามันชอบพูดคำนี้ตลอดเวลาไม่ว่าจะเห็นใครเดินผ่านก็ตาม'
    },
    {
      isGenuine: false,
      badge: '💭 กลิ่นน้ำหอมฉุน (ขวดโคโลญจ์ตกแตก)',
      text: 'มีกลิ่นน้ำหอมหรูหราตลบอบอวลในห้องน้ำ ทำให้สงสัยแขกสุภาพสตรี... แต่จริงๆ คนสวนเพิ่งทำขวดโคโลญจ์ตกแตกเมื่อหัวค่ำ'
    },
    {
      isGenuine: false,
      badge: '💭 รอยเท้าประหลาด (รอยรองเท้าคนส่งของ)',
      text: 'พบรอยรองเท้าเปื้อนโคลนเดินรอบสนามหญ้า... สอบสวนแล้วคือรอยเท้าของคนส่งของที่มาส่งน้ำแข็งเมื่อช่วงเย็น'
    },
    {
      isGenuine: false,
      badge: '💭 แผนผังลึกลับ (เกมล่าสมบัติ)',
      text: 'พบกระดาษเขียนผังคฤหาสน์พร้อมกากบาทสีแดงน่าสงสัย... ปรากฏว่าเป็นแผนที่ล่าสมบัติของเด็กๆ ในงานเลี้ยงสัปดาห์ก่อน'
    },
    {
      isGenuine: false,
      badge: '💭 กระจกแตกร้าว (ลูกเทนนิสหลงทาง)',
      text: 'กระจกหน้าต่างห้องรับแขกมีรอยร้าวเป็นใยแมงมุม... ตรวจสอบพบลูกเทนนิสตกอยู่ด้านนอก คาดว่าโดนตีมาโดนตั้งแต่เมื่อวาน'
    },
    {
      isGenuine: false,
      badge: '💭 เสียงโหยหวน (ลมพัดปล่องไฟ)',
      text: 'แขกหลายคนสาบานว่าได้ยินเสียงวิญญาณโหยหวนในท่อระบายควัน... ช่างบอกว่าเกิดจากลมกรรโชกแรงพัดผ่านปล่องไฟแคบๆ'
    },
    {
      isGenuine: false,
      badge: '💭 รอยขูดขีดบนตู้ (ฟันสุนัขแทะ)',
      text: 'พบรอยขูดขีดลึกเหมือนรอยต่อสู้ดิ้นรนที่ขาโต๊ะไม้สัก... แต่ดูจากรอยฟันแล้ว เกิดจากสุนัขชอบแทะขาโต๊ะเวลาคันฟัน'
    },
    {
      isGenuine: false,
      badge: '💭 หน้าต่างเปิดอ้า (สลักกลอนพัง)',
      text: 'หน้าต่างห้องใต้หลังคาเปิดกว้างเหมือนมีคนปีนเข้าออก... ที่แท้สลักกลอนพังมาสามเดือนแล้ว ลมพัดแรงทีไรก็เปิดเองทุกที'
    },
    {
      isGenuine: false,
      badge: '💭 เชือกผูกเงื่อน (เชือกมัดพัสดุ)',
      text: 'พบเศษเชือกป่านถูกตัดเป็นท่อนๆ ตกอยู่... นึกว่าเป็นเชือกรัดคอ ที่แท้เป็นเชือกมัดกล่องพัสดุที่คนรับใช้แกะทิ้งไว้'
    },
    {
      isGenuine: false,
      badge: '💭 นาฬิกาหยุดเดิน (ถ่านหมดอายุ)',
      text: 'นาฬิกาโบราณในห้องโถงหยุดเดินที่เวลา 21:15 น. ทุกคนคิดว่าเป็นเวลาตาย!... แต่พ่อบ้านบอกว่าถ่านมันหมดมาตั้งแต่เมื่อวานแล้ว'
    },
    {
      isGenuine: false,
      badge: '💭 เสียงประตูดังลั่น (บานพับขึ้นสนิม)',
      text: 'มีเสียงประตูปิดกระแทกดังสนั่นในความมืด... พ่อบ้านยืนยันว่าบานพับขึ้นสนิมและลมกรรโชกพัดปิดเองเป็นประจำ'
    },
    {
      isGenuine: false,
      badge: '💭 ผงแป้งปริศนา (แป้งสาลีทำขนมปัง)',
      text: 'พบละอองผงสีขาวกระจายอยู่เต็มพื้นห้องโถง นึกว่าเป็นสารพิษ... สรุปคือคนครัวทำถุงแป้งสาลีรั่วระหว่างเดินผ่าน'
    },
    {
      isGenuine: false,
      badge: '💭 สิ่งมีชีวิตใต้เตียง (รองเท้าแตะขนสัตว์)',
      text: 'มีคนตกใจร้องลั่นว่าเห็นเงาสิ่งมีชีวิตขนปุยหมอบนิ่งอยู่ใต้เตียง... ก้มดูแล้วเป็นเพียงรองเท้าแตะขนสัตว์คู่โปรดของเจ้าของบ้าน'
    }
  ];

  // 40% genuine, 60% bogus (เพิ่มสัดส่วนคำใบ้มั่วๆ ชวนสับสนตามที่ต้องการ)
  const pickGenuine = Math.random() < 0.40;
  if (pickGenuine && genuineHints.length > 0) {
    return genuineHints[Math.floor(Math.random() * genuineHints.length)];
  } else {
    return bogusHints[Math.floor(Math.random() * bogusHints.length)];
  }
}

/**
 * Show 3x3 Jigsaw Puzzle Modal
 * Uses distinct puzzle_room.svg, no numbers, and enforces End Turn upon completion (1 action per turn)
 */
function showJigsawModal(roomId, gameState, onSolved, onEndTurn) {
  const room = MANSION_ROOMS[roomId] || MANSION_ROOMS['hall'];
  const titleEl = document.getElementById('jigsaw-room-title');
  const gridEl = document.getElementById('jigsaw-grid');
  const movesEl = document.getElementById('jigsaw-moves');
  const statusEl = document.getElementById('jigsaw-status-text');
  const secretBox = document.getElementById('jigsaw-secret-box');
  const secretBadge = document.getElementById('jigsaw-hint-badge');
  const secretText = document.getElementById('jigsaw-secret-text');
  const shuffleBtn = document.getElementById('btn-jigsaw-shuffle');
  const endTurnBtn = document.getElementById('btn-jigsaw-end-turn');
  const closeBtn = document.getElementById('btn-jigsaw-close');

  if (titleEl) titleEl.textContent = `🧩 ถอดรหัสภาพจิ๊กซอว์ 3x3 — ${room.name} (${room.emoji})`;

  // High-contrast, landmark-rich illustration for intuitive 3x3 solving
  const puzzleImage = 'assets/images/puzzle_room.svg';

  let moves = 0;
  let selectedTileIndex = null;
  let tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  let isCurrentlySolved = false;

  function updateStats() {
    if (movesEl) movesEl.textContent = moves;
  }

  function isSolved(arr) {
    return arr.every((v, i) => v === i);
  }

  function shuffleTiles() {
    do {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
    } while (isSolved(tiles));
  }

  function startNewPuzzle() {
    moves = 0;
    selectedTileIndex = null;
    isCurrentlySolved = false;
    shuffleTiles();
    updateStats();
    if (statusEl) {
      statusEl.textContent = 'กำลังถอดรหัส...';
      statusEl.style.color = 'var(--gold-light)';
    }
    if (secretBox) {
      secretBox.classList.add('hidden');
      secretBox.style.display = 'none';
    }
    if (secretText) secretText.innerHTML = '';
    if (secretBadge) secretBadge.innerHTML = '';
    if (endTurnBtn) {
      endTurnBtn.classList.add('hidden');
      endTurnBtn.style.display = 'none';
    }
    if (shuffleBtn) {
      shuffleBtn.classList.remove('hidden');
      shuffleBtn.style.display = '';
    }
    if (closeBtn) {
      closeBtn.classList.remove('hidden');
      closeBtn.style.display = '';
    }
    renderGrid();
  }

  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    tiles.forEach((tileNum, posIdx) => {
      const tile = document.createElement('div');
      tile.classList.add('jigsaw-tile');
      tile.dataset.pos = posIdx;

      const col = tileNum % 3;
      const row = Math.floor(tileNum / 3);

      tile.style.backgroundImage = `url('${puzzleImage}')`;
      tile.style.backgroundSize = '300px 300px';
      tile.style.backgroundPosition = `${col * -100}px ${row * -100}px`;

      // Per user request: NO numbers displayed on the tiles!

      if (selectedTileIndex === posIdx) {
        tile.classList.add('selected');
      }

      if (!isCurrentlySolved) {
        tile.addEventListener('click', () => onTileClick(posIdx));
      }

      gridEl.appendChild(tile);
    });
  }

  function onTileClick(posIdx) {
    if (isCurrentlySolved) return;

    if (selectedTileIndex === null) {
      selectedTileIndex = posIdx;
      renderGrid();
    } else if (selectedTileIndex === posIdx) {
      selectedTileIndex = null;
      renderGrid();
    } else {
      const temp = tiles[selectedTileIndex];
      tiles[selectedTileIndex] = tiles[posIdx];
      tiles[posIdx] = temp;
      selectedTileIndex = null;
      moves++;
      updateStats();

      renderGrid();

      if (isSolved(tiles)) {
        isCurrentlySolved = true;
        if (!gameState.solvedJigsaws) gameState.solvedJigsaws = {};
        gameState.solvedJigsaws[roomId] = true;

        if (statusEl) {
          statusEl.textContent = '🎉 ถอดรหัสสำเร็จแล้ว!';
          statusEl.style.color = '#70e000';
        }

        // Generate hint (genuine or bogus)
        const hint = generateJigsawHint(roomId, gameState);
        if (secretBadge) {
          secretBadge.innerHTML = hint.badge;
          secretBadge.className = hint.isGenuine ? 'jsb-tag genuine-hint' : 'jsb-tag bogus-hint';
        }
        if (secretText) secretText.innerHTML = hint.text;
        if (secretBox) {
          secretBox.classList.remove('hidden');
          secretBox.style.display = 'block';
        }

        // Per user request:
        // "หากเล่นมินิเกมส์จบไม่มีปุ่มเล่นอีกรอบมีแค่กดจบเทิร์นเท่านั้นเทิร์นถัดไปถึงจะเล่นได้อีกครั้ง"
        if (shuffleBtn) {
          shuffleBtn.classList.add('hidden');
          shuffleBtn.style.display = 'none';
        }
        if (closeBtn) {
          closeBtn.classList.add('hidden');
          closeBtn.style.display = 'none';
        }
        if (endTurnBtn) {
          endTurnBtn.classList.remove('hidden');
          endTurnBtn.style.display = 'block';
          const freshEnd = endTurnBtn.cloneNode(true);
          endTurnBtn.parentNode.replaceChild(freshEnd, endTurnBtn);
          freshEnd.onclick = () => {
            hideModal('modal-jigsaw');
            if (onEndTurn) onEndTurn();
          };
        }

        addLog(`🧩 ถอดรหัสภาพใน ${room.name} สำเร็จ! ได้รับคำใบ้สืบสวน`, 'success');
        updateStats();
        if (onSolved) onSolved();
      }
    }
  }

  if (shuffleBtn) {
    shuffleBtn.onclick = () => {
      startNewPuzzle();
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => hideModal('modal-jigsaw');
  }

  startNewPuzzle();
  showModal('modal-jigsaw');
}

// ============================================================
//  VOTING COUNTDOWN TIMER (1-MINUTE LIMIT)
// ============================================================
let voteTimerInterval = null;

function stopVoteTimer() {
  if (voteTimerInterval) {
    clearInterval(voteTimerInterval);
    voteTimerInterval = null;
  }
}

function startVoteCountdown(countdownElId, onTimeout) {
  stopVoteTimer();
  let remainingSeconds = 60;
  const el = document.getElementById(countdownElId);
  if (el) {
    el.textContent = '01:00';
    el.classList.remove('urgent');
  }

  voteTimerInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds < 0) {
      stopVoteTimer();
      if (onTimeout) onTimeout();
      return;
    }

    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (el) {
      el.textContent = formatted;
      if (remainingSeconds <= 10) {
        el.classList.add('urgent');
      } else {
        el.classList.remove('urgent');
      }
    }
  }, 1000);
}

/**
 * Show Final Accusation Vote Modal (15 Clues)
 */
function showFinalAccusationVoteModal(onConfirm, onTimeout) {
  renderVisualPicker('final-vote-suspects', SUSPECTS, 'suspect');
  renderVisualPicker('final-vote-weapons',  WEAPONS,  'weapon');
  renderVisualPicker('final-vote-rooms',    ROOMS,    'room');

  const confirmBtn = document.getElementById('btn-final-vote-confirm');
  const freshConfirm = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(freshConfirm, confirmBtn);
  freshConfirm.disabled = true;

  let sel = { suspect: null, weapon: null, room: null };

  function checkReady() {
    freshConfirm.disabled = !(sel.suspect && sel.weapon && sel.room);
  }

  ['suspect', 'weapon', 'room'].forEach(type => {
    const picker = document.getElementById(`final-vote-${type}s`);
    if (!picker) return;
    picker.onclick = e => {
      const card = e.target.closest('.picker-card');
      if (!card) return;
      document.querySelectorAll(`#final-vote-${type}s .picker-card`).forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      sel[type] = card.dataset.id;
      checkReady();
    };
  });

  freshConfirm.addEventListener('click', () => {
    stopVoteTimer();
    hideModal('modal-final-vote');
    if (onConfirm && sel.suspect && sel.weapon && sel.room) {
      onConfirm({ suspectId: sel.suspect, weaponId: sel.weapon, roomId: sel.room });
    }
  });

  startVoteCountdown('final-vote-timer-countdown', () => {
    hideModal('modal-final-vote');
    if (onTimeout) onTimeout();
  });

  showModal('modal-final-vote');
}

/**
 * Accuse Modal (No cancel allowed - 1-minute countdown)
 */
function showAccuseModal(onConfirm, onTimeout) {
  renderVisualPicker('accuse-suspects', SUSPECTS, 'suspect');
  renderVisualPicker('accuse-weapons',  WEAPONS,  'weapon');
  renderVisualPicker('accuse-rooms',    ROOMS,    'room');

  const confirmBtn = document.getElementById('btn-accuse-confirm');
  const freshConfirm = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(freshConfirm, confirmBtn);
  freshConfirm.disabled = true;

  let sel = { suspect: null, weapon: null, room: null };

  function checkReady() {
    freshConfirm.disabled = !(sel.suspect && sel.weapon && sel.room);
  }

  ['suspect', 'weapon', 'room'].forEach(type => {
    const picker = document.getElementById(`accuse-${type}s`);
    if (!picker) return;
    picker.onclick = e => {
      const card = e.target.closest('.picker-card');
      if (!card) return;
      document.querySelectorAll(`#accuse-${type}s .picker-card`).forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      sel[type] = card.dataset.id;
      checkReady();
    };
  });

  freshConfirm.addEventListener('click', () => {
    stopVoteTimer();
    hideModal('modal-accuse');
    if (onConfirm && sel.suspect && sel.weapon && sel.room) {
      onConfirm({ suspectId: sel.suspect, weaponId: sel.weapon, roomId: sel.room });
    }
  });

  startVoteCountdown('accuse-timer-countdown', () => {
    hideModal('modal-accuse');
    if (onTimeout) onTimeout();
  });

  showModal('modal-accuse');
}

/**
 * Result Modal
 */
function showResultModal(won, winnerName, scenario, isKillerWin, onPlayAgain, customDesc) {
  stopVoteTimer();
  const iconEl  = document.getElementById('result-icon');
  const titleEl = document.getElementById('result-title');
  const descEl  = document.getElementById('result-desc');
  const solEl   = document.getElementById('result-solution');

  if (won) {
    iconEl.textContent = '🏆';
    titleEl.textContent = isKillerWin ? 'ฆาตกรชนะคดี!' : 'นักสืบคลี่คลายคดีสำเร็จ!';
    if (customDesc) {
      descEl.textContent = customDesc;
    } else {
      descEl.textContent = `${winnerName} ${isKillerWin ? 'เอาตัวรอดและอำพรางจุดซ่อนศพได้อย่างแนบเนียน ไม่มีใครค้นพบศพของเซอร์ ฮิวจ์!' : 'ชี้ตัวฆาตกรตัวจริงได้สำเร็จ และบังคับให้คนร้ายเปิดเผยจุดซ่อนศพของเซอร์ ฮิวจ์!'}`;
    }
  } else {
    iconEl.textContent = '💀';
    titleEl.textContent = 'การชี้ตัวผิดพลาด!';
    descEl.textContent = customDesc || `${winnerName} กล่าวหาผู้บริสุทธิ์และถูกคุมตัวออกนอกคฤหาสน์!`;
  }

  const s = getSuspectById(scenario.killerSuspectId);
  const r = MANSION_ROOMS[scenario.murderRoom];

  solEl.innerHTML = `
    <div class="sol-row">
      <span class="sol-label">👤 ฆาตกรตัวจริง:</span>
      <strong>${s?.emoji || '👤'} ${s?.name || ''} (${s?.nameEn || ''})</strong>
    </div>
    <div class="sol-row">
      <span class="sol-label">🔪 วิธีการสังหาร:</span>
      <strong>${scenario.weaponEmoji || '🔪'} ${scenario.weaponName || ''}</strong>
    </div>
    <div class="sol-row">
      <span class="sol-label">🏠 ห้องเกิดเหตุ:</span>
      <strong>${r?.emoji || '🏠'} ${r?.name || ''} (${r?.nameEn || ''})</strong>
    </div>
    <div class="sol-row">
      <span class="sol-label">⚰️ จุดซ่อนศพ:</span>
      <strong style="color: var(--gold-light);">${scenario.hiddenCorpseLocation || 'ซ่อนอยู่ในคฤหาสน์'}</strong>
    </div>
  `;

  const btn = document.getElementById('btn-play-again');
  const freshBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(freshBtn, btn);
  freshBtn.addEventListener('click', () => { hideModal('modal-result'); if (onPlayAgain) onPlayAgain(); });

  showModal('modal-result');
}

/**
 * Visual Picker Helpers
 */
function renderVisualPicker(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  renderVisualPickerInto(container, items.map(i => ({ ...i, type })));
}

function renderVisualPickerInto(container, items) {
  items.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('picker-card');
    card.dataset.id = item.id;

    const img = document.createElement('img');
    img.classList.add('picker-card-img');
    img.src = item.image || (item.type === 'weapon' ? 'assets/images/weapons.jpg' : 'assets/images/floorplan.jpg');
    img.alt = item.name;

    const body = document.createElement('div');
    body.classList.add('picker-card-body');

    const name = document.createElement('span');
    name.classList.add('picker-card-name');
    name.textContent = `${item.emoji} ${item.name}`;

    const desc = document.createElement('span');
    desc.classList.add('picker-card-desc');
    desc.textContent = item.role || item.lethality || (item.secretName ? `ทางลับ: ${item.secretName}` : (item.nameEn || ''));

    body.appendChild(name);
    body.appendChild(desc);
    card.appendChild(img);
    card.appendChild(body);
    container.appendChild(card);
  });
}
