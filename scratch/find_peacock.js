const fs = require('fs');

if (fs.existsSync('./scratch/leaks_report.json')) {
  const leaks = JSON.parse(fs.readFileSync('./scratch/leaks_report.json', 'utf8'));
  console.log('Leaks matching มุก or ส้นเข็ม:');
  leaks.forEach(l => {
    if (l.line && (l.line.includes('มุก') || l.line.includes('ส้นเข็ม') || l.line.includes('พีค็อก'))) {
      console.log(`Line ${l.lineNum}: ${l.line.trim()}`);
    }
  });
}
