const fs = require('fs');

const content = fs.readFileSync('js/scenarios.js', 'utf8');
const lines = content.split('\n');

const leaks = JSON.parse(fs.readFileSync('scratch/leaks_report.json', 'utf8'));
let map = new Map();
leaks.forEach(l => map.set(l.lineNum, lines[l.lineNum - 1]));

function cleanClueLine(line) {
  let res = line;

  // Specific context phrases first
  res = res.replace(/นักบวชกรีน/g, 'นักบวช');
  res = res.replace(/เสื้อคลุมกรีน/g, 'เสื้อคลุมนักบวช');
  res = res.replace(/ชุดราตรีพีค็อก/g, 'ชุดราตรีสตรีชั้นสูง');
  res = res.replace(/จดหมายแบล็กเมลเรื่องหนี้สินจากเซอร์ ฮิวจ์ถึงพีค็อก/g, 'จดหมายแบล็กเมลเรื่องหนี้สินการพนันจากเซอร์ ฮิวจ์');
  res = res.replace(/พินัยกรรมจำลองที่มีรอยขีดฆ่าชื่อพีค็อก/g, 'พินัยกรรมจำลองที่มีรอยขีดฆ่าชื่อทายาทหญิง');
  res = res.replace(/ร่างพินัยกรรมตัดชื่อพีค็อกของเซอร์ ฮิวจ์/g, 'ร่างพินัยกรรมตัดชื่อทายาทหญิงของเซอร์ ฮิวจ์');
  res = res.replace(/จดหมายวิงวอนขอเงินจากพีค็อกถึงเซอร์ ฮิวจ์/g, 'จดหมายวิงวอนขอเงินชดใช้หนี้สินถึงเซอร์ ฮิวจ์');
  res = res.replace(/จดหมายที่พีค็อกขอร้องเซอร์ ฮิวจ์ให้ช่วยปลดหนี้/g, 'จดหมายขอร้องเซอร์ ฮิวจ์ให้ช่วยปลดหนี้สินมหาศาล');
  res = res.replace(/ที่เซอร์ ฮิวจ์ขโมยมาจากพลัม/g, 'ที่เซอร์ ฮิวจ์ขโมยมา');
  res = res.replace(/ที่พลัมพกติดตัว/g, 'จากห้องทดลอง');
  res = res.replace(/ลายมือพลัม/g, 'ลายมือนักวิจัย');

  // Plum cleaning
  res = res.replace(/ของศาสตราจารย์พลัม/g, 'ของนักวิชาการ');
  res = res.replace(/ของศาสตราจารย์/g, 'ของนักวิชาการ');
  res = res.replace(/ศาสตราจารย์พลัม/g, 'นักวิชาการ');
  res = res.replace(/ลายมือของพลัม/g, 'ลายมือนักวิชาการ');
  res = res.replace(/เฉพาะตัวของพลัม/g, 'เฉพาะตัว');
  res = res.replace(/ตกค้างของพลัม/g, 'ตกค้าง');
  res = res.replace(/ของพลัมใน/g, 'ใน');
  res = res.replace(/เศษเลนส์แว่นตาของพลัม/g, 'เศษเลนส์แว่นสายตากลม');
  res = res.replace(/เศษผ้าสูททวีดของพลัม/g, 'เศษผ้าสูททวีดสีม่วง');
  res = res.replace(/ของพลัม/g, '');
  res = res.replace(/พลัม/g, '');

  // Peacock cleaning
  res = res.replace(/ของคุณนายพีค็อก/g, 'ของสตรีชั้นสูง');
  res = res.replace(/คุณนายพีค็อก/g, 'สตรีชั้นสูง');
  res = res.replace(/ของพีค็อก/g, '');
  res = res.replace(/พีค็อก/g, '');

  // Green cleaning
  res = res.replace(/ของบาทหลวงกรีน/g, 'ของนักบวช');
  res = res.replace(/บาทหลวงกรีน/g, 'นักบวช');
  res = res.replace(/ของบาทหลวง/g, 'ของนักบวช');
  res = res.replace(/ที่บาทหลวง/g, 'ที่นักบวช');
  res = res.replace(/ของกรีน/g, '');
  res = res.replace(/กรีน/g, '');

  // White cleaning
  res = res.replace(/ของแม่บ้านชราไวท์/g, 'ของคนทำงานบ้าน');
  res = res.replace(/ของแม่บ้านไวท์/g, 'ของคนทำงานบ้าน');
  res = res.replace(/แม่บ้านชราไวท์/g, 'คนทำงานบ้าน');
  res = res.replace(/แม่บ้านไวท์/g, 'คนทำงานบ้าน');
  res = res.replace(/ของคุณนายไวท์/g, 'ของหัวหน้าคนทำงานบ้าน');
  res = res.replace(/คุณนายไวท์/g, 'หัวหน้าคนทำงานบ้าน');
  res = res.replace(/ของหญิงชราไวท์/g, 'ของหญิงชราทำงานบ้าน');
  res = res.replace(/กระโปรงสีดำของไวท์/g, 'กระโปรงสีดำของคนทำงานบ้าน');
  res = res.replace(/ของไวท์/g, 'ของคนทำงานบ้าน');

  // Scarlett cleaning
  res = res.replace(/ของมิส สคาร์เล็ต/g, 'ของสุภาพสตรีเจ้าเสน่ห์');
  res = res.replace(/ที่มิส สคาร์เล็ตสูบเป็นประจำ/g, 'สำหรับสตรีชั้นสูง');
  res = res.replace(/มิส สคาร์เล็ต/g, 'สุภาพสตรีเจ้าเสน่ห์');

  // Mustard cleaning
  res = res.replace(/ของนายทหารมัสตาร์ด/g, 'เกรดนายทหาร');
  res = res.replace(/ของนายพลมัสตาร์ด/g, 'เกรดนายทหาร');
  res = res.replace(/ของพันเอกมัสตาร์ด/g, 'ของนายทหารระดับสูง');
  res = res.replace(/ของพันเอก มัสตาร์ด/g, 'ของนายทหารระดับสูง');
  res = res.replace(/พันเอกมัสตาร์ด/g, 'นายทหารชั้นผู้ใหญ่');
  res = res.replace(/พันเอก มัสตาร์ด/g, 'นายทหารชั้นผู้ใหญ่');
  res = res.replace(/ทหารมัสตาร์ด/g, 'ทหารชั้นผู้ใหญ่');
  res = res.replace(/ระบุชื่อมัสตาร์ด/g, 'สลักตรากองทัพ');
  res = res.replace(/ยศพันเอกทองเหลือง/g, 'ตราปีกนกอินทรีทองเหลือง');
  res = res.replace(/ปักยศพันเอก/g, 'ปักตรากองทัพ');
  res = res.replace(/ยศพันเอก/g, 'เครื่องแบบทหาร');
  res = res.replace(/ขี้เถ้าซิการ์ฮาวานาของมัสตาร์ด/g, 'ขี้เถ้าซิการ์ฮาวานาเกรดนายทหาร');
  res = res.replace(/ของมัสตาร์ด/g, 'เกรดนายทหาร');

  // Fix awkward spacings and quotes
  res = res.replace(/\s{2,}/g, ' ');
  res = res.replace(/\s+\"/g, '"');

  return res;
}

// Test on all 240 lines
let remainingSuspects = [];
const suspects = ['กรีน', 'พีค็อก', 'พลัม', 'สการ์เล็ต', 'มัสตาร์ด', 'ไวท์', 'ศาสตราจารย์', 'พันเอก', 'คุณนาย', 'มิส', 'บาทหลวง'];

for (let [lineNum, origText] of map) {
  let cleaned = cleanClueLine(origText);
  for (let s of suspects) {
    if (cleaned.includes(s)) {
      remainingSuspects.push({ lineNum, suspect: s, orig: origText.trim(), cleaned: cleaned.trim() });
    }
  }
}

console.log('Remaining suspect mentions after cleanClueLine:', remainingSuspects.length);
remainingSuspects.forEach(r => {
  console.log(`L${r.lineNum} [${r.suspect}]: ${r.cleaned}`);
});
