const fs = require('fs');
const vm = require('vm');
const path = require('path');

const context = { console, Math, Set, Array, Object, document: { addEventListener: () => {}, getElementById: () => null }, window: {} };
context.global = context;
context.window = context;
vm.createContext(context);

const basePath = path.resolve(__dirname, '..');
vm.runInContext(fs.readFileSync(path.join(basePath, 'js/cards.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(basePath, 'js/scenarios.js'), 'utf8'), context);

const scenarios = vm.runInContext('SCENARIOS', context);
const suspects = vm.runInContext('SUSPECTS', context);

suspects.forEach(s => {
  const scList = scenarios.filter(sc => sc.applicableKiller === s.id);
  console.log('\n================================================================================');
  console.log(`👤 ตัวละคร: ${s.name} (${s.nameEn}) [${s.id}] — มี ${scList.length} รูปแบบคดี`);
  console.log('================================================================================');
  
  if (scList.length < 2) {
    console.log('WARNING: Less than 2 scenarios!');
    return;
  }

  const sc1 = scList[0];
  const sc2 = scList[1];

  console.log(`[คดี A] ${sc1.title}`);
  console.log(`       🔪 อาวุธ: ${sc1.weaponName} | 🏠 ห้อง: ${sc1.murderRoom} | ⚰️ ซ่อนศพ: ${sc1.hiddenCorpseLocation}`);
  console.log(`[คดี B] ${sc2.title}`);
  console.log(`       🔪 อาวุธ: ${sc2.weaponName} | 🏠 ห้อง: ${sc2.murderRoom} | ⚰️ ซ่อนศพ: ${sc2.hiddenCorpseLocation}`);

  console.log('\n--- เปรียบเทียบหลักฐานเฉพาะห้อง (Special Clues) ---');
  console.log('  คดี A:');
  sc1.specialClues.forEach((c, i) => console.log(`    A${i+1}. [${c.roomId}] "${c.title}" ➔ "${c.revealTitle}"`));
  console.log('  คดี B:');
  sc2.specialClues.forEach((c, i) => console.log(`    B${i+1}. [${c.roomId}] "${c.title}" ➔ "${c.revealTitle}"`));

  console.log('\n--- เปรียบเทียบคำใบ้เชื่อมโยงคนร้าย (Subtle Killer Clues) ---');
  console.log('  คดี A:');
  sc1.subtleKillerClues.forEach((c, i) => console.log(`    A${i+1}. "${c.title}" ➔ "${c.revealTitle}"`));
  console.log('  คดี B:');
  sc2.subtleKillerClues.forEach((c, i) => console.log(`    B${i+1}. "${c.title}" ➔ "${c.revealTitle}"`));

  // Check word / concept overlap
  const words1 = (sc1.specialClues.concat(sc1.subtleKillerClues)).map(c => c.title + ' ' + c.revealTitle + ' ' + c.revealDesc).join(' ');
  const words2 = (sc2.specialClues.concat(sc2.subtleKillerClues)).map(c => c.title + ' ' + c.revealTitle + ' ' + c.revealDesc).join(' ');

  console.log('\n--- ตรวจสอบคำหรือความคล้ายคลึงระหว่างคดี A และ B ---');
  // Compare each clue in A against all clues in B
  const cluesA = sc1.specialClues.concat(sc1.subtleKillerClues);
  const cluesB = sc2.specialClues.concat(sc2.subtleKillerClues);

  let potentialSimilarities = [];
  cluesA.forEach(ca => {
    cluesB.forEach(cb => {
      // Check title similarity
      if (ca.title === cb.title || ca.revealTitle === cb.revealTitle) {
        potentialSimilarities.push({ type: 'EXACT', ca: ca.revealTitle, cb: cb.revealTitle });
      }
    });
  });

  if (potentialSimilarities.length === 0) {
    console.log(`✓ ไม่มีคำใบ้หรือหลักฐานที่ซ้ำกันหรือชื่อตรงกันระหว่าง 2 คดีของ ${s.name}`);
  } else {
    console.log(`⚠️ พบความคล้ายคลึง:`, potentialSimilarities);
  }
});
