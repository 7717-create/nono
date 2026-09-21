/**
 * board.js — Mansion Overview Map & Crime Scene Room Views
 * Features 1-click room entry, visual room art, and interactive ? clue markers.
 */

// 9 Rooms + Central Grand Hall
const MANSION_ROOMS = {
  'kitchen': {
    id: 'kitchen',
    name: 'ห้องครัว',
    nameEn: 'Kitchen',
    emoji: '🍳',
    color: '#8b4513',
    image: 'assets/images/kitchen.jpg',
    secretPassage: 'study',
    secretName: 'ห้องทำงาน (Study)',
    desc: 'ห้องครัวโบราณ เตาผิงหิน เขียงไม้ และบันไดลับเชื่อมไปยังห้องทำงาน'
  },
  'ballroom': {
    id: 'ballroom',
    name: 'ห้องเต้นรำ',
    nameEn: 'Ballroom',
    emoji: '💃',
    color: '#4a3b32',
    image: 'assets/images/ballroom.jpg',
    secretPassage: null,
    desc: 'โถงเต้นรำหินอ่อนโอ่อ่า โคมไฟระย้าคริสตัลระยิบระยับ และผ้าม่านกำมะหยี่'
  },
  'conservatory': {
    id: 'conservatory',
    name: 'เรือนกระจก',
    nameEn: 'Conservatory',
    emoji: '🌿',
    color: '#1b4332',
    image: 'assets/images/conservatory.jpg',
    secretPassage: 'lounge',
    secretName: 'ห้องนั่งเล่น (Lounge)',
    desc: 'เรือนกระจกพรรณไม้เมืองร้อน บันไดหินอ่อน และทางลับใต้ดินทะลุไปห้องนั่งเล่น'
  },
  'dining-room': {
    id: 'dining-room',
    name: 'ห้องอาหาร',
    nameEn: 'Dining Room',
    emoji: '🍽️',
    color: '#582f0e',
    image: 'assets/images/dining_room.jpg',
    secretPassage: null,
    desc: 'โต๊ะอาหารไม้มะฮอกกานียาว เชิงเทียนเงิน ถังบ่มไวน์ และจานชามหรูหรา'
  },
  'hall': {
    id: 'hall',
    name: 'โถงกลางคฤหาสน์',
    nameEn: 'Grand Hall',
    emoji: '🚪',
    color: '#2b2d42',
    image: 'assets/images/hall.jpg',
    secretPassage: null,
    desc: 'ใจกลางคฤหาสน์ จุดเริ่มต้นของทุกคน และเป็นจุดที่พบร่องรอยหยดเลือดลึกลับเป็นทางยาว!'
  },
  'billiard-room': {
    id: 'billiard-room',
    name: 'ห้องบิลเลียด',
    nameEn: 'Billiard Room',
    emoji: '🎱',
    color: '#1e3f20',
    image: 'assets/images/billiard_room.jpg',
    secretPassage: null,
    desc: 'ห้องสันทนาการผนังไม้สัก โต๊ะบิลเลียดผ้าสักหลาดสีเขียว และแผ่นกระดานพื้นลับ'
  },
  'study': {
    id: 'study',
    name: 'ห้องทำงาน',
    nameEn: 'Study',
    emoji: '📖',
    color: '#3d314a',
    image: 'assets/images/study.jpg',
    secretPassage: 'kitchen',
    secretName: 'ห้องครัว (Kitchen)',
    desc: 'ห้องทำงานส่วนตัว โต๊ะเอกสารลับ บันไดปีนหนังสือ และประตูลับ'
  },
  'library': {
    id: 'library',
    name: 'ห้องสมุด',
    nameEn: 'Library',
    emoji: '📚',
    color: '#3c2a21',
    image: 'assets/images/library.jpg',
    secretPassage: null,
    desc: 'ตู้หนังสือไม้สองชั้นสูงจรดเพดาน สารานุกรมโบราณ และโซฟาหนัง'
  },
  'lounge': {
    id: 'lounge',
    name: 'ห้องนั่งเล่น',
    nameEn: 'Lounge',
    emoji: '🛋️',
    color: '#641220',
    image: 'assets/images/lounge.jpg',
    secretPassage: 'conservatory',
    secretName: 'เรือนกระจก (Conservatory)',
    desc: 'ห้องรับแขกแสนอบอุ่น เตาผิงลุกโชน นาฬิกาตั้งพื้นโบราณ และทางลับทะลุไปเรือนกระจก'
  }
};

// 3x3 Grid arrangement (with Grand Hall at center)
const MANSION_GRID_ORDER = [
  'kitchen',     'ballroom',     'conservatory',
  'dining-room', 'hall',         'billiard-room',
  'study',       'library',      'lounge'
];

function initBoard() {
  // Ready
}

/**
 * Check if a clue is crucial evidence belonging to the killer's crime
 */
function isClueCrucialForKiller(clue, scenario) {
  if (!clue) return false;
  if (clue.isSwapped === true || clue.isForged === true) return false;
  if (clue.isKillerEvidence === true || clue.isKillerClue === true) return true;
  if (clue.canBeWiped === true) return true;
  if (scenario && scenario.specialClues && scenario.specialClues.some(sc => sc.id === clue.id)) return true;
  return false;
}

/**
 * Render Mansion Map View (3x3 Room Grid)
 */
function renderMansionMap(gameState, onSelectRoom) {
  const boardEl = document.getElementById('game-board');
  if (!boardEl || !gameState) return;
  boardEl.innerHTML = '';

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isKiller = currentPlayer && currentPlayer.isKiller;

  MANSION_GRID_ORDER.forEach(roomId => {
    const r = MANSION_ROOMS[roomId];
    const card = document.createElement('div');
    card.classList.add('manor-room-card');
    card.dataset.roomId = r.id;

    // Is current player in this room?
    const isPlayerHere = currentPlayer && currentPlayer.currentRoomId === r.id;
    if (isPlayerHere) {
      card.classList.add('current-player-room');
    }

    // Killer evidence badge on map for killer
    let killerBadgeHtml = '';
    if (isKiller) {
      const roomClues = gameState.roomClues[r.id] || [];
      const crucialClues = roomClues.filter(c => isClueCrucialForKiller(c, gameState.scenario) && !c.wiped);
      const wipedClues = (currentPlayer.wipedCluesDetailed || []).filter(c => c.roomId === r.id);

      if (crucialClues.length > 0) {
        killerBadgeHtml = `<div class="mrc-killer-badge danger" title="ห้องนี้มีหลักฐานสำคัญมัดตัวคุณ ${crucialClues.length} ชิ้น!">🩸 มีหลักฐานมัดตัว (${crucialClues.length})</div>`;
      } else if (wipedClues.length > 0) {
        killerBadgeHtml = `<div class="mrc-killer-badge wiped" title="หลักฐานสำคัญในห้องนี้ถูกทำลายหมดแล้ว">🧹 ทำลายแล้ว (${wipedClues.length})</div>`;
      } else {
        killerBadgeHtml = `<div class="mrc-killer-badge safe" title="ห้องนี้ไม่มีหลักฐานสำคัญของคุณ">🛡️ ปลอดภัย</div>`;
      }
    }

    // Header
    const header = document.createElement('div');
    header.classList.add('mrc-header');
    header.innerHTML = `
      <div class="mrc-title-wrap">
        <span class="mrc-emoji">${r.emoji}</span>
        <div>
          <div class="mrc-name">${r.name}</div>
          <div class="mrc-name-en">${r.nameEn}</div>
          ${killerBadgeHtml}
        </div>
      </div>
      ${r.secretPassage ? `<span class="mrc-secret-pill" title="ทางลับไป${r.secretName}">⚡ ทางลับ</span>` : ''}
    `;
    card.appendChild(header);

    // Occupants area
    const tokensArea = document.createElement('div');
    tokensArea.classList.add('mrc-tokens-area');
    
    // Find players in this room
    const occupants = gameState.players.filter(p => !p.eliminated && p.currentRoomId === r.id);
    if (occupants.length === 0) {
      tokensArea.innerHTML = '<span class="mrc-empty-label">ไม่มีใครอยู่ในห้องนี้</span>';
    } else {
      occupants.forEach(p => {
        const pill = document.createElement('div');
        pill.classList.add('mrc-player-pill');
        pill.style.borderColor = p.color || 'var(--border-gold)';
        pill.title = `${p.name} (${p.suspectName || ''})`;

        const img = document.createElement('img');
        img.classList.add('mrc-player-avatar');
        img.src = p.image || 'assets/images/scarlett.jpg';
        img.alt = p.name;

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('mrc-player-name');
        nameSpan.textContent = p.name;

        pill.appendChild(img);
        pill.appendChild(nameSpan);
        tokensArea.appendChild(pill);
      });
    }
    card.appendChild(tokensArea);

    // Enter Room Action Button
    const actionWrap = document.createElement('div');
    actionWrap.classList.add('mrc-action-wrap');

    const btn = document.createElement('button');
    btn.classList.add('btn-enter-room');
    
    if (isPlayerHere) {
      btn.innerHTML = '🔍 อยู่ในห้องนี้ (ตรวจร่องรอย ?)';
      btn.classList.add('btn-inspect-here');
    } else {
      btn.innerHTML = `🚶 เข้า${r.name}`;
    }

    btn.addEventListener('click', () => {
      onSelectRoom(r.id);
    });

    actionWrap.appendChild(btn);
    card.appendChild(actionWrap);

    boardEl.appendChild(card);
  });
}

/**
 * Render Crime Scene Room View with Interactive ? Clue Markers
 */
function renderRoomScene(roomId, gameState, onInspectClue, onWipeClue) {
  const room = MANSION_ROOMS[roomId] || MANSION_ROOMS['hall'];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isKiller = currentPlayer && currentPlayer.isKiller;

  // Header texts
  const nameEl = document.getElementById('rsv-room-name');
  const subEl  = document.getElementById('rsv-room-name-en');
  const emojiEl = document.getElementById('rsv-emoji');
  const imgEl  = document.getElementById('rsv-room-image');

  if (nameEl) nameEl.textContent = room.name;
  if (subEl) subEl.textContent = room.nameEn;
  if (emojiEl) emojiEl.textContent = room.emoji;
  if (imgEl) imgEl.src = room.image;

  // Killer Crucial Evidence Room Status Banner
  const killerBannerEl = document.getElementById('rsv-killer-evidence-banner');
  if (killerBannerEl) {
    if (isKiller) {
      killerBannerEl.classList.remove('hidden');
      const roomClues = gameState.roomClues[roomId] || [];
      const crucialClues = roomClues.filter(c => isClueCrucialForKiller(c, gameState.scenario) && !c.wiped);
      const wipedClues = (currentPlayer.wipedCluesDetailed || []).filter(c => c.roomId === roomId);

      if (crucialClues.length > 0) {
        killerBannerEl.className = 'rsv-killer-evidence-banner danger';
        killerBannerEl.innerHTML = `
          <div class="rkeb-icon">🩸</div>
          <div class="rkeb-content">
            <div class="rkeb-title">⚠️ คำเตือนฆาตกร: ห้องนี้มีหลักฐานสำคัญที่มัดตัวคุณ! (พบ ${crucialClues.length} ชิ้น)</div>
            <div class="rkeb-sub">ร่องรอยที่มีสัญลักษณ์ <strong>🩸 [หลักฐานสำคัญมัดตัวคุณ!]</strong> คือหลักฐานของคดีนี้ รีบเลือก <strong>"ทำลายร่องรอย 🧹"</strong> ก่อนที่นักสืบจะตรวจพบ!</div>
          </div>
        `;
      } else if (wipedClues.length > 0) {
        killerBannerEl.className = 'rsv-killer-evidence-banner wiped';
        killerBannerEl.innerHTML = `
          <div class="rkeb-icon">🧹</div>
          <div class="rkeb-content">
            <div class="rkeb-title">🧹 หลักฐานสำคัญในห้องนี้ถูกทำลายหมดแล้ว (${wipedClues.length} ชิ้น)</div>
            <div class="rkeb-sub">คุณได้เช็ดทำลายหลักฐานในห้องนี้ไปแล้ว นักสืบจะไม่สามารถตรวจพบความจริงในห้องนี้ได้อีกต่อไป</div>
          </div>
        `;
      } else {
        killerBannerEl.className = 'rsv-killer-evidence-banner safe';
        killerBannerEl.innerHTML = `
          <div class="rkeb-icon">🛡️</div>
          <div class="rkeb-content">
            <div class="rkeb-title">🛡️ ห้องนี้ปลอดภัย: ไม่มีหลักฐานสำคัญของคนร้าย</div>
            <div class="rkeb-sub">ร่องรอยทั้งหมดในห้องนี้เป็นเพียงร่องรอยทั่วไป (Decoy) ที่ไม่เชื่อมโยงถึงตัวคุณ สามารถตรวจหรือปล่อยผ่านได้</div>
          </div>
        `;
      }
    } else {
      killerBannerEl.classList.add('hidden');
      killerBannerEl.innerHTML = '';
    }
  }

  // Occupants in this room
  const occupantsEl = document.getElementById('rsv-occupants');
  if (occupantsEl) {
    occupantsEl.innerHTML = '';
    const others = gameState.players.filter(p => !p.eliminated && p.currentRoomId === roomId);
    others.forEach(p => {
      const img = document.createElement('img');
      img.classList.add('rsv-occupant-avatar');
      img.src = p.image || 'assets/images/scarlett.jpg';
      img.title = p.name;
      img.style.borderColor = p.color || 'var(--border-gold)';
      occupantsEl.appendChild(img);
    });
  }

  // Jigsaw Puzzle Button
  const btnJigsaw = document.getElementById('btn-room-jigsaw');
  if (btnJigsaw) {
    const isActionUsed = !!(gameState.turnClueActionDone || gameState.turnMiniGamePlayed);
    btnJigsaw.innerHTML = '🧩 ถอดรหัสจิ๊กซอว์';

    if (isActionUsed) {
      btnJigsaw.classList.add('btn-jigsaw-disabled');
      btnJigsaw.title = 'ใช้การกระทำในเทิร์นนี้แล้ว (จำกัด 1 แอคชั่น/เทิร์น)';
    } else {
      btnJigsaw.classList.remove('btn-jigsaw-disabled');
      btnJigsaw.title = 'คลิกเพื่อเล่นมินิเกมส์จิ๊กซอว์ 3x3 ค้นหาคำใบ้ (นับเป็น 1 แอคชั่น)';
    }

    const freshJigsaw = btnJigsaw.cloneNode(true);
    btnJigsaw.parentNode.replaceChild(freshJigsaw, btnJigsaw);
    freshJigsaw.onclick = () => {
      if (gameState.turnClueActionDone || gameState.turnMiniGamePlayed) {
        addLog('คุณได้ใช้การกระทำในเทิร์นนี้ไปแล้ว (จำกัด 1 การกระทำต่อ 1 เทิร์น) ไม่สามารถเล่นมินิเกมส์ได้ กรุณากดจบเทิร์น', 'danger');
        return;
      }

      showJigsawModal(
        roomId,
        gameState,
        // onSolved:
        () => {
          gameState.turnMiniGamePlayed = true;
          gameState.turnClueActionDone = true;
          updateTurnStepBar(3);

          const nextIdx = (gameState.currentPlayerIndex + 1) % gameState.players.length;
          const nextP = gameState.players[nextIdx];
          setEndTurnBtnState(true, nextP ? nextP.name : '', '🧩 ถอดรหัสแล้ว ➔ จบเทิร์น');

          renderRoomScene(roomId, gameState, onInspectClue, onWipeClue);
          updateGuideBanner('✅', '<strong>ขั้นตอนที่ 3:</strong> ถอดรหัสจิ๊กซอว์สำเร็จและได้รับคำใบ้แล้ว! กรุณากดปุ่ม <strong>"จบเทิร์น ➔"</strong> เพื่อส่งต่อเทิร์น');
        },
        // onEndTurn:
        () => {
          doEndTurn();
        }
      );
    };
  }

  // Interactive ? Clue Markers
  const markersContainer = document.getElementById('rsv-clue-markers');
  if (!markersContainer) return;
  markersContainer.innerHTML = '';

  const clues = gameState.roomClues[roomId] || [];
  const isCluesDisabled = !!gameState.turnClueActionDone;

  clues.forEach(clue => {
    const isCrucial = isClueCrucialForKiller(clue, gameState.scenario);
    const marker = document.createElement('div');
    marker.classList.add('clue-marker');
    marker.style.left = `${clue.x}%`;
    marker.style.top  = `${clue.y}%`;

    // Tooltip title
    const tag = document.createElement('span');
    tag.classList.add('marker-tag');

    if (isKiller) {
      if (clue.isSwapped) {
        tag.innerHTML = `🎭 [สลับเป็นหลักฐานลวงแล้ว] ${clue.title}`;
      } else if (isCrucial) {
        tag.innerHTML = `🩸 <strong>[หลักฐานสำคัญของคุณ!]</strong> ${clue.title}`;
      } else {
        tag.innerHTML = `🛡️ [ร่องรอยทั่วไป] ${clue.title}`;
      }
    } else {
      tag.textContent = clue.title;
    }
    marker.appendChild(tag);

    // Marker visual status
    if (clue.wiped) {
      marker.classList.add('wiped');
      marker.innerHTML = '🧹' + tag.outerHTML;
      marker.title = 'ร่องรอยนี้ถูกทำลาย/เช็ดล้างใหม่แล้ว!';
    } else if (clue.isSwapped) {
      marker.classList.add('killer-decoy-marker');
      marker.classList.add('swapped-decoy-marker');
      marker.innerHTML = '?' + tag.outerHTML;
      if (isKiller) {
        marker.title = `🎭 สลับเป็นหลักฐานลวงแล้ว: ${clue.title}`;
      } else {
        marker.title = clue.inspected ? `ตรวจแล้ว: ${clue.revealTitle}` : `คลิกตรวจ: ${clue.title}`;
      }
    } else if (clue.inspected) {
      marker.classList.add('inspected');
      if (isKiller && isCrucial) {
        marker.classList.add('killer-crucial-marker');
        marker.innerHTML = '🩸' + tag.outerHTML;
        marker.title = `ตรวจแล้ว (หลักฐานสำคัญของคุณ): ${clue.revealTitle}`;
      } else {
        marker.innerHTML = '👁️' + tag.outerHTML;
        marker.title = `ตรวจแล้ว: ${clue.revealTitle}`;
      }
    } else {
      if (isKiller && isCrucial) {
        marker.classList.add('killer-crucial-marker');
        marker.innerHTML = '🩸' + tag.outerHTML;
        marker.title = `🩸 หลักฐานสำคัญที่มัดตัวคุณ: ${clue.title} (คลิกเพื่อทำลาย 🧹 หรือแสร้งตรวจ 🔍)`;
      } else if (isKiller && !isCrucial) {
        marker.classList.add('killer-decoy-marker');
        marker.innerHTML = '?' + tag.outerHTML;
        marker.title = `🛡️ ร่องรอยทั่วไป (ไม่ใช่หลักฐานของคุณ): ${clue.title}`;
      } else {
        marker.innerHTML = '?' + tag.outerHTML;
        marker.title = `คลิกตรวจ: ${clue.title}`;
      }
    }

    if (isCluesDisabled) {
      marker.classList.add('clue-marker-disabled');
      marker.style.cursor = 'not-allowed';
      marker.style.opacity = '0.5';
      marker.title = 'ตรวจร่องรอยในเทิร์นนี้แล้ว (จำกัด 1 จุดต่อเทิร์น)';

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        addLog('คุณได้ตรวจร่องรอยในเทิร์นนี้แล้ว (จำกัด 1 จุดต่อ 1 เทิร์น) กรุณากดจบเทิร์น', 'danger');
      });
    } else {
      marker.addEventListener('click', (e) => {
        e.stopPropagation();

        // If current player is Killer and clue can be wiped and not yet wiped
        if (isKiller && clue.canBeWiped && !clue.wiped) {
          onWipeClue(clue);
        } else {
          onInspectClue(clue);
        }
      });
    }

    markersContainer.appendChild(marker);
  });

  // Also render explicit Clue Buttons List below the image (#rsv-clues-button-list)
  const cluesListContainer = document.getElementById('rsv-clues-button-list');
  if (cluesListContainer) {
    cluesListContainer.innerHTML = '';
    
    if (clues.length === 0) {
      cluesListContainer.innerHTML = '<div class="clue-btn-empty">ห้องนี้ไม่มีร่องรอยผิดปกติใดๆ</div>';
    } else {
      clues.forEach((clue, idx) => {
        const isCrucial = isClueCrucialForKiller(clue, gameState.scenario);
        const btn = document.createElement('button');
        btn.classList.add('clue-action-btn');
        
        let icon = '🔍';
        let titleText = `${idx + 1}. ${clue.title}`;
        let statusText = 'ตรวจร่องรอยนี้ (คลิก)';
        
        if (clue.wiped) {
          icon = '🧹';
          statusText = isKiller && isCrucial ? '🧹 [หลักฐานสำคัญ] ถูกเช็ดทำลายแล้ว' : 'ร่องรอยนี้ถูกเช็ดทำลายแล้ว';
          btn.classList.add('clue-btn-wiped');
        } else if (clue.isSwapped) {
          icon = '?';
          titleText = isKiller ? `🎭 [หลักฐานลวง] ${idx + 1}. ${clue.title}` : `${idx + 1}. ${clue.title}`;
          statusText = isKiller ? `🎭 สลับเป็นหลักฐานลวงแล้ว: ${clue.revealTitle}` : (clue.inspected ? `ตรวจแล้ว: ${clue.revealTitle}` : 'ตรวจร่องรอยนี้ (คลิก)');
          btn.classList.add('clue-btn-killer-safe');
          btn.classList.add('clue-btn-swapped');
        } else if (clue.inspected) {
          icon = '👁️';
          statusText = isKiller && isCrucial
            ? `🩸 [หลักฐานสำคัญ] ตรวจแล้ว: ${clue.revealTitle}`
            : `ตรวจแล้ว: ${clue.revealTitle}`;
          btn.classList.add('clue-btn-inspected');
          if (isKiller && isCrucial) btn.classList.add('clue-btn-killer-crucial');
        } else if (isKiller && isCrucial) {
          icon = '🩸';
          titleText = `🩸 [หลักฐานสำคัญมัดตัวคุณ!] ${idx + 1}. ${clue.title}`;
          statusText = '⚠️ หลักฐานนี้เชื่อมโยงถึงคุณ! คลิกเพื่อทำลาย 🧹 หรือแสร้งตรวจ 🔍';
          btn.classList.add('clue-btn-killer-crucial');
        } else if (isKiller && !isCrucial) {
          icon = '🛡️';
          titleText = `🛡️ [ร่องรอยทั่วไป] ${idx + 1}. ${clue.title}`;
          statusText = '🛡️ ร่องรอยทั่วไป: ไม่ใช่หลักฐานของคุณ ปลอดภัย (ตรวจได้ตามปกติ)';
          btn.classList.add('clue-btn-killer-safe');
        }

        if (isCluesDisabled) {
          btn.disabled = true;
          btn.classList.add('clue-btn-disabled');
          statusText = clue.inspected ? `ตรวจแล้ว: ${clue.revealTitle}` : 'ตรวจในเทิร์นนี้แล้ว (จำกัด 1 จุด/เทิร์น)';
        } else {
          btn.addEventListener('click', () => {
            if (isKiller && clue.canBeWiped && !clue.wiped) {
              onWipeClue(clue);
            } else {
              onInspectClue(clue);
            }
          });
        }

        btn.innerHTML = `
          <div class="cab-left">
            <span class="cab-icon">${icon}</span>
            <div class="cab-info">
              <strong class="cab-title">${titleText}</strong>
              <span class="cab-status">${statusText}</span>
            </div>
          </div>
          <span class="cab-arrow">➔</span>
        `;

        cluesListContainer.appendChild(btn);
      });
    }
  }

  // Also update sidebar clues list if available (#panel-clues-action-box)
  const panelCluesBox = document.getElementById('panel-clues-action-box');
  if (panelCluesBox) {
    panelCluesBox.innerHTML = '';
    if (clues.length > 0) {
      clues.forEach((clue, idx) => {
        const isCrucial = isClueCrucialForKiller(clue, gameState.scenario);
        const pBtn = document.createElement('button');
        pBtn.classList.add('btn-action', 'btn-clue-side');
        if (clue.wiped) pBtn.classList.add('side-wiped');
        if (clue.inspected) pBtn.classList.add('side-inspected');
        if (isKiller && isCrucial) pBtn.classList.add('side-killer-crucial');

        let icon = clue.wiped ? '🧹' : (clue.inspected ? '👁️' : '🔍');
        let titleLabel = clue.title;
        let subLabel = clue.wiped ? 'ถูกลบแล้ว' : (clue.inspected ? 'ตรวจแล้ว' : (isCluesDisabled ? 'จำกัด 1 จุด/เทิร์น' : 'คลิกเพื่อตรวจ'));

        if (isKiller && isCrucial) {
          icon = clue.wiped ? '🧹' : '🩸';
          titleLabel = `🩸 ${clue.title}`;
          subLabel = clue.wiped ? 'หลักฐานสำคัญ (ทำลายแล้ว)' : 'หลักฐานสำคัญ (คลิกเพื่อทำลาย 🧹)';
        } else if (isKiller && !isCrucial) {
          icon = clue.wiped ? '🧹' : (clue.inspected ? '👁️' : '🛡️');
          titleLabel = `🛡️ ${clue.title}`;
          subLabel = clue.wiped ? 'ถูกลบแล้ว' : (clue.inspected ? 'ตรวจแล้ว' : 'ร่องรอยทั่วไป (ปลอดภัย)');
        }

        pBtn.innerHTML = `
          <span class="action-icon">${icon}</span>
          <span class="action-text">
            <strong>${titleLabel}</strong>
            <small>${subLabel}</small>
          </span>
        `;

        if (isCluesDisabled) {
          pBtn.disabled = true;
          pBtn.classList.add('btn-disabled');
        } else {
          pBtn.addEventListener('click', () => {
            if (isKiller && clue.canBeWiped && !clue.wiped) {
              onWipeClue(clue);
            } else {
              onInspectClue(clue);
            }
          });
        }

        panelCluesBox.appendChild(pBtn);
      });
    }
  }
}

function showMansionMap() {
  const mapView = document.getElementById('mansion-map-view');
  const roomView = document.getElementById('room-scene-view');
  if (mapView) mapView.classList.remove('hidden');
  if (roomView) roomView.classList.add('hidden');
}

function showRoomScene() {
  const mapView = document.getElementById('mansion-map-view');
  const roomView = document.getElementById('room-scene-view');
  if (mapView) mapView.classList.add('hidden');
  if (roomView) roomView.classList.remove('hidden');
}
