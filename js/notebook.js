/**
 * notebook.js — Detective notebook logic
 * Tracks player deductions, auto-marks seen cards, and links to card inspector
 */

const NB_UNKNOWN  = '?';    // ยังไม่รู้
const NB_CLEAR    = '✓';    // รู้แน่ว่าไม่ใช่ (เห็นการ์ดแล้ว)
const NB_SUSPECT  = '✗';    // สงสัยว่าใช่คำตอบ
const NB_MINE     = '★';    // การ์ดในมือเราเอง

function initNotebooks(players) {
  return players.map(player => {
    const nb = {};
    [...SUSPECTS, ...WEAPONS, ...ROOMS].forEach(item => {
      nb[item.id] = NB_UNKNOWN;
    });
    // Mark own hand cards
    player.hand.forEach(card => {
      nb[card.id] = NB_MINE;
    });
    return nb;
  });
}

function markCardSeen(notebooks, viewerIndex, cardId) {
  if (!notebooks[viewerIndex]) return;
  const current = notebooks[viewerIndex][cardId];
  if (current === NB_MINE) return;
  notebooks[viewerIndex][cardId] = NB_CLEAR;
}

function renderNotebook(gameState, currentPlayerIndex) {
  const container = document.getElementById('notebook-content');
  if (!container) return;
  container.innerHTML = '';

  const nb = gameState.notebooks[currentPlayerIndex];
  if (!nb) return;

  const sections = [
    { title: '👤 ผู้ต้องสงสัย (Suspects)', items: SUSPECTS },
    { title: '🔪 อาวุธสังหาร (Weapons)',   items: WEAPONS  },
    { title: '🏠 ห้องเกิดเหตุ (Rooms)',     items: ROOMS    },
  ];

  sections.forEach(section => {
    const secDiv = document.createElement('div');
    secDiv.classList.add('notebook-section');

    const h4 = document.createElement('h4');
    h4.textContent = section.title;
    secDiv.appendChild(h4);

    const table = document.createElement('table');
    table.classList.add('notebook-table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>ชื่อการ์ด (คลิกดูข้อมูล)</th><th>สถานะ</th>`;

    // Columns for other players who showed cards
    gameState.players.forEach((p, pi) => {
      if (pi !== currentPlayerIndex) {
        const th = document.createElement('th');
        th.textContent = p.name.substring(0, 6);
        th.title = p.name;
        headerRow.appendChild(th);
      }
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    section.items.forEach(item => {
      const tr = document.createElement('tr');

      // Card name (clickable to inspect)
      const tdName = document.createElement('td');
      tdName.innerHTML = `<span style="cursor:pointer; text-decoration:underline;">${item.emoji} ${item.name}</span>`;
      tdName.title = 'คลิกเพื่อดูภาพวาดและประวัติ';
      tdName.addEventListener('click', () => {
        showCardInspectModal(item);
      });
      tr.appendChild(tdName);

      // Status mark (clickable to cycle)
      const tdMark = document.createElement('td');
      tdMark.classList.add('nb-mark');
      const mark = nb[item.id] || NB_UNKNOWN;
      tdMark.textContent = mark;
      applyMarkStyle(tdMark, mark);

      if (mark !== NB_MINE) {
        tdMark.style.cursor = 'pointer';
        tdMark.title = 'คลิกเพื่อเปลี่ยนเครื่องหมาย (✓ ไม่ใช่ / ✗ สงสัย / ? ไม่รู้)';
        tdMark.addEventListener('click', () => {
          const next = cycleUserMark(nb[item.id]);
          nb[item.id] = next;
          tdMark.textContent = next;
          applyMarkStyle(tdMark, next);
        });
      } else {
        tdMark.title = 'การ์ดในมือคุณ (ไม่ใช่คำตอบแน่นอน)';
      }
      tr.appendChild(tdMark);

      // Seen-by columns
      gameState.players.forEach((p, pi) => {
        if (pi === currentPlayerIndex) return;
        const tdSeen = document.createElement('td');
        tdSeen.classList.add('nb-mark');
        const seenKey = `seen_${pi}_${item.id}`;
        const seenMark = gameState.notebookSeen[currentPlayerIndex]?.[seenKey] || '';
        tdSeen.textContent = seenMark;
        if (seenMark === '✓') tdSeen.style.color = 'var(--success)';
        tr.appendChild(tdSeen);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    secDiv.appendChild(table);
    container.appendChild(secDiv);
  });

  // Legend
  const legend = document.createElement('div');
  legend.style.cssText = 'font-size:0.8rem; color:var(--text-muted); margin-top:10px; line-height:1.6;';
  legend.innerHTML = `
    <strong>สัญลักษณ์:</strong>
    <span style="color:var(--success)"> ✓ ไม่ใช่คำตอบ (เห็นการ์ดแล้ว)</span> ·
    <span style="color:var(--danger)"> ✗ สงสัยว่าใช่คำตอบ</span> ·
    <span style="color:var(--gold-light)"> ★ การ์ดในมือเรา</span> ·
    ? ยังไม่แน่ใจ
  `;
  container.appendChild(legend);
}

function applyMarkStyle(el, mark) {
  el.classList.remove('known', 'unknown', 'maybe');
  if (mark === NB_CLEAR || mark === NB_MINE) el.classList.add('known');
  else if (mark === NB_SUSPECT) el.classList.add('unknown');
  else el.classList.add('maybe');
}

function cycleUserMark(current) {
  const cycle = [NB_UNKNOWN, NB_CLEAR, NB_SUSPECT];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}
