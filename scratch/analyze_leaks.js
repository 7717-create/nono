const fs = require('fs');

const content = fs.readFileSync('js/scenarios.js', 'utf8');
const lines = content.split('\n');

const suspects = ['กรีน', 'พีค็อก', 'พลัม', 'สการ์เล็ต', 'มัสตาร์ด', 'ไวท์', 'ศาสตราจารย์', 'พันเอก', 'คุณนาย', 'มิส', 'บาทหลวง'];

let findings = [];
lines.forEach((line, idx) => {
  // Only inspect lines inside clue objects: title, revealTitle, revealDesc, desc
  if (line.includes('title:') || line.includes('revealTitle:') || line.includes('revealDesc:') || line.includes('desc:')) {
    for (let s of suspects) {
      if (line.includes(s)) {
        findings.push({ lineNum: idx + 1, suspect: s, line: line.trim() });
        break;
      }
    }
  }
});

console.log('Total clue lines matching suspects in scenarios.js:', findings.length);
findings.forEach(f => {
  console.log(`L${f.lineNum} [${f.suspect}]: ${f.line}`);
});
