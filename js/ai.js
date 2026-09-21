/**
 * ai.js — AI player logic for Detective vs Killer mystery
 * Smart room navigation, clue inspection, killer evidence tampering, and accusations.
 */

function aiChooseRoomToEnter(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const roomKeys = Object.keys(MANSION_ROOMS).filter(k => k !== player.currentRoomId);

  if (player.isKiller) {
    const murderRoom = gameState.scenario.murderRoom;
    const murderClues = gameState.roomClues[murderRoom] || [];
    const hasUnwiped = murderClues.some(c => c.canBeWiped && !c.wiped);

    // If murder room has unwiped clues, 70% chance to head there
    if (hasUnwiped && Math.random() < 0.7) {
      return murderRoom;
    }

    // Otherwise, pick another room to pretend to investigate
    return roomKeys[Math.floor(Math.random() * roomKeys.length)];
  } else {
    // Detective: pick rooms with uninspected clues
    const roomsWithUninspected = roomKeys.filter(r => {
      const clues = gameState.roomClues[r] || [];
      return clues.some(c => !c.inspected && !c.wiped);
    });

    if (roomsWithUninspected.length > 0) {
      return roomsWithUninspected[Math.floor(Math.random() * roomsWithUninspected.length)];
    }

    return roomKeys[Math.floor(Math.random() * roomKeys.length)];
  }
}

function aiChooseClueActionInRoom(roomId, gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const clues = gameState.roomClues[roomId] || [];

  if (player.isKiller) {
    // Look for unwiped critical clue
    const unwiped = clues.find(c => c.canBeWiped && !c.wiped);
    if (unwiped) {
      // 80% chance to wipe, 20% to inspect
      return {
        action: Math.random() < 0.8 ? 'wipe' : 'inspect',
        clue: unwiped
      };
    }
  }

  // Pick uninspected clue
  const uninspected = clues.find(c => !c.inspected && !c.wiped);
  if (uninspected) {
    return { action: 'inspect', clue: uninspected };
  }

  // All inspected, inspect any
  if (clues.length > 0) {
    return { action: 'inspect', clue: clues[0] };
  }

  return { action: 'endTurn' };
}

function aiCheckShouldAccuse(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  if (player.isKiller) return null; // Killer never accuses unless desperate

  const criticals = (gameState.discoveredClues || []).filter(c => c.isCritical && !c.wiped);
  if (criticals.length >= 2) {
    // High chance to identify scenario
    return {
      suspectId: gameState.scenario.killerSuspectId,
      roomId: gameState.scenario.murderRoom,
      weaponId: gameState.scenario.weaponId
    };
  }

  return null;
}
