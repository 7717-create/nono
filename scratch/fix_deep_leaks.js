const fs = require('fs');

let content = fs.readFileSync('./js/scenarios.js', 'utf8');

const replacements = [
  ['revealTitle:"การ์ดเชิญงานเต้นรำระบุชื่อสคาร์เล็ต"', 'revealTitle:"การ์ดเชิญงานเต้นรำหรูหราของสุภาพสตรี"'],
  ['revealTitle:"สัญญาเงินกู้ระบุชื่อสคาร์เล็ตที่ขาดวิ่น"', 'revealTitle:"สัญญาเงินกู้ลับที่ขาดวิ่น"'],
  ['revealTitle:"เศษผ้าจากชุดราตรีสคาร์เล็ตติดซอกโซ่"', 'revealTitle:"เศษผ้าจากชุดราตรีสีแดงสดติดซอกโซ่"'],
  ['revealTitle:"กระดุมมุกสีแดงจากชุดราตรีสคาร์เล็ต"', 'revealTitle:"กระดุมมุกสีแดงจากชุดราตรีหรูหรา"'],
  ['title:"ตลับไม้ขีดไฟตรา Col. Mustard"', 'title:"ตลับไม้ขีดไฟตรานายทหารโบราณ"'],
  ['revealTitle:"เข็มกลัดเงินแท้สลักชื่อ Mrs. White"', 'revealTitle:"เข็มกลัดเงินแท้สลักอักษรย่อ W ของคนทำงานบ้าน"']
];

replacements.forEach(([from, to]) => {
  if (content.includes(from)) {
    console.log('Replacing:', from, '->', to);
    content = content.split(from).join(to);
  } else {
    console.error('NOT FOUND:', from);
  }
});

fs.writeFileSync('./js/scenarios.js', content, 'utf8');
console.log('Saved scenarios.js successfully!');
