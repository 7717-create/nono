const fs = require('fs');

const content = fs.readFileSync('js/scenarios.js', 'utf8');
const lines = content.split('\n');

const leaks = JSON.parse(fs.readFileSync('scratch/leaks_report.json', 'utf8'));

// Map lineNum to line text
let map = new Map();
leaks.forEach(l => map.set(l.lineNum, lines[l.lineNum - 1]));

console.log('Total unique leak lines:', map.size);

function cleanLine(text) {
  let cleaned = text;

  // 1. Specific phrases in revealTitle / revealDesc
  cleaned = cleaned.replace(/ของนายทหารมัสตาร์ด/g, 'เกรดนายทหารชั้นผู้ใหญ่');
  cleaned = cleaned.replace(/ของนายพลมัสตาร์ด/g, 'เกรดนายทหารชั้นผู้ใหญ่');
  cleaned = cleaned.replace(/ของพันเอกมัสตาร์ด/g, 'ของนายทหารระดับสูง');
  cleaned = cleaned.replace(/ของพันเอก มัสตาร์ด/g, 'ของนายทหารระดับสูง');
  cleaned = cleaned.replace(/พันเอกมัสตาร์ด/g, 'นายทหารชั้นผู้ใหญ่');
  cleaned = cleaned.replace(/พันเอก มัสตาร์ด/g, 'นายทหารชั้นผู้ใหญ่');
  cleaned = cleaned.replace(/ของมัสตาร์ด/g, 'เกรดทหาร');
  cleaned = cleaned.replace(/ทหารมัสตาร์ด/g, 'ทหารชั้นผู้ใหญ่');
  cleaned = cleaned.replace(/ระบุชื่อมัสตาร์ด/g, 'สลักตรากองทัพ');
  cleaned = cleaned.replace(/มัสตาร์ด/g, 'นายทหาร');

  cleaned = cleaned.replace(/ของมิส สคาร์เล็ต/g, 'ของสุภาพสตรีเจ้าเสน่ห์');
  cleaned = cleaned.replace(/มิส สคาร์เล็ต/g, 'สุภาพสตรีชุดแดง');
  cleaned = cleaned.replace(/สการ์เล็ต/g, 'สุภาพสตรี');

  cleaned = cleaned.replace(/ของแม่บ้านชราไวท์/g, 'ของคนทำงานบ้าน');
  cleaned = cleaned.replace(/ของแม่บ้านไวท์/g, 'ของคนทำงานบ้าน');
  cleaned = cleaned.replace(/แม่บ้านชราไวท์/g, 'คนทำงานบ้าน');
  cleaned = cleaned.replace(/แม่บ้านไวท์/g, 'คนทำงานบ้าน');
  cleaned = cleaned.replace(/ของคุณนายไวท์/g, 'ของหัวหน้าแม่บ้าน');
  cleaned = cleaned.replace(/คุณนายไวท์/g, 'หัวหน้าแม่บ้าน');
  cleaned = cleaned.replace(/ของหญิงชราไวท์/g, 'ของคนทำงานบ้าน');
  cleaned = cleaned.replace(/ของไวท์/g, 'ของคนทำงานบ้าน');
  cleaned = cleaned.replace(/ไวท์/g, 'คนทำงานบ้าน');

  cleaned = cleaned.replace(/ของบาทหลวงกรีน/g, 'ของนักบวช');
  cleaned = cleaned.replace(/บาทหลวงกรีน/g, 'นักบวช');
  cleaned = cleaned.replace(/ของบาทหลวง/g, 'ของนักบวช');
  cleaned = cleaned.replace(/บาทหลวง/g, 'นักบวช');
  cleaned = cleaned.replace(/ของกรีน/g, '');
  cleaned = cleaned.replace(/กรีน/g, '');

  cleaned = cleaned.replace(/ของพีค็อก/g, '');
  cleaned = cleaned.replace(/พีค็อก/g, '');

  cleaned = cleaned.replace(/ของศาสตราจารย์พลัม/g, 'ของนักวิชาการ');
  cleaned = cleaned.replace(/ศาสตราจารย์พลัม/g, 'นักวิชาการ');
  cleaned = cleaned.replace(/ของศาสตราจารย์/g, 'ของนักวิชาการ');
  cleaned = cleaned.replace(/ศาสตราจารย์/g, 'นักวิชาการ');
  cleaned = cleaned.replace(/ของพลัม/g, '');
  cleaned = cleaned.replace(/พลัม/g, '');

  // Clean any double spaces or dangling quotes
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\s+\"/g, '"');

  return cleaned;
}

let sampleDiffs = [];
for (let [lineNum, origText] of map) {
  let newText = cleanLine(origText);
  sampleDiffs.push({ lineNum, origText: origText.trim(), newText: newText.trim() });
}

console.log('Processed all lines. Sample 30 diffs:');
sampleDiffs.slice(0, 30).forEach(d => {
  console.log(`L${d.lineNum}:`);
  console.log(`  - ${d.origText}`);
  console.log(`  + ${d.newText}`);
});
