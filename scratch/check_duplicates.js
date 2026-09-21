const fs = require('fs');
const vm = require('vm');
const path = require('path');

const context = {
  console,
  Math,
  Set,
  Array,
  Object,
  document: { addEventListener: () => {}, getElementById: () => null },
  window: {}
};
context.global = context;
context.window = context;
vm.createContext(context);

const basePath = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(basePath, 'js/scenarios.js'), 'utf8');
vm.runInContext(code, context);

const scenarios = vm.runInContext('SCENARIOS', context);
console.log('Total Scenarios:', scenarios.length);

const titleMap = new Map();
const revealTitleMap = new Map();
const revealDescMap = new Map();
const duplicatesFound = [];

scenarios.forEach(sc => {
  const scClues = [];
  
  (sc.specialClues || []).forEach(c => {
    scClues.push({ type: 'specialClue', title: c.title, revealTitle: c.revealTitle, revealDesc: c.revealDesc, id: c.id });
  });

  (sc.subtleKillerClues || []).forEach(c => {
    scClues.push({ type: 'subtleKillerClue', title: c.title, revealTitle: c.revealTitle, revealDesc: c.revealDesc, id: c.title });
  });

  scClues.forEach(c => {
    // Check title
    if (titleMap.has(c.title)) {
      duplicatesFound.push({
        field: 'title (ชื่อร่องรอย)',
        value: c.title,
        scenario1: titleMap.get(c.title),
        scenario2: sc.id
      });
    } else {
      titleMap.set(c.title, sc.id);
    }

    // Check revealTitle
    if (revealTitleMap.has(c.revealTitle)) {
      duplicatesFound.push({
        field: 'revealTitle (ชื่อหลักฐานที่เปิดเผย)',
        value: c.revealTitle,
        scenario1: revealTitleMap.get(c.revealTitle),
        scenario2: sc.id
      });
    } else {
      revealTitleMap.set(c.revealTitle, sc.id);
    }

    // Check revealDesc
    if (revealDescMap.has(c.revealDesc)) {
      duplicatesFound.push({
        field: 'revealDesc (คำอธิบายหลักฐาน)',
        value: c.revealDesc,
        scenario1: revealDescMap.get(c.revealDesc),
        scenario2: sc.id
      });
    } else {
      revealDescMap.set(c.revealDesc, sc.id);
    }
  });
});

console.log('\n======================================================');
console.log('ผลการตรวจสอบความซ้ำซ้อนของคำใบ้และหลักฐานทั้ง 12 คดี:');
console.log('======================================================');

if (duplicatesFound.length === 0) {
  console.log('✓ ไม่พบคำใบ้หรือหลักฐานที่ซ้ำกันเลยแม้แต่รายการเดียว (0 Duplicates)');
  console.log(`- จำนวนร่องรอย (Titles) ทั้งหมด: ${titleMap.size} รายการ (ไม่ซ้ำกันเลย)`);
  console.log(`- จำนวนหลักฐาน (Reveal Titles) ทั้งหมด: ${revealTitleMap.size} รายการ (ไม่ซ้ำกันเลย)`);
  console.log(`- จำนวนคำอธิบาย (Reveal Descriptions) ทั้งหมด: ${revealDescMap.size} รายการ (ไม่ซ้ำกันเลย)`);
} else {
  console.log(`พบรายการที่ซ้ำกัน ${duplicatesFound.length} รายการ:`);
  duplicatesFound.forEach((d, i) => {
    console.log(`[${i + 1}] ฟิลด์: ${d.field}`);
    console.log(`    ข้อความ: "${d.value}"`);
    console.log(`    พบซ้ำระหว่าง: คดี ${d.scenario1} กับ คดี ${d.scenario2}`);
  });
}

console.log('\n======================================================');
console.log('สรุปรายการคำใบ้และหลักฐานของทั้ง 12 คดี:');
console.log('======================================================');

scenarios.forEach((sc, idx) => {
  console.log(`\n[คดีที่ ${idx + 1}] ${sc.title}`);
  console.log(`  👤 คนร้าย: ${sc.applicableKiller} | 🔪 อาวุธ: ${sc.weaponName} | 🏠 ห้อง: ${sc.murderRoom}`);
  console.log(`  ⚰️ จุดซ่อนศพ: ${sc.hiddenCorpseLocation}`);
  console.log(`  📍 หลักฐานเฉพาะห้อง (Special Clues ${sc.specialClues.length} ชิ้น):`);
  sc.specialClues.forEach((c, ci) => {
    console.log(`     ${ci + 1}. [ห้อง ${c.roomId}] "${c.title}" ➔ "${c.revealTitle}"`);
  });
  console.log(`  🩸 คำใบ้เชื่อมโยงคนร้าย (Subtle Killer Clues ${sc.subtleKillerClues.length} ชิ้น):`);
  sc.subtleKillerClues.forEach((c, ci) => {
    console.log(`     ${ci + 1}. "${c.title}" ➔ "${c.revealTitle}"`);
  });
});
