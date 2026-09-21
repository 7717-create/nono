/**
 * cards.js — Card definitions, lore, images & management
 * Suspects, Weapons, Rooms + Deal/Shuffle logic
 */

const SUSPECTS = [
  {
    id: 'scarlett',
    name: 'มิส สคาร์เล็ต',
    nameEn: 'Miss Scarlett',
    emoji: '🔴',
    color: '#e05555',
    image: 'assets/images/scarlett.jpg',
    role: 'หญิงสาวชุดราตรีสีแดงทรงเสน่ห์',
    desc: 'สาวสวยลึกลับในชุดราตรีสีแดงสด มักโปรยเสน่ห์และรอยยิ้มที่ยากจะคาดเดาความในใจ มีข่าวลือว่าเธอกำลังตกที่นั่งลำบากเรื่องหนี้สินมหาศาล',
    motive: 'ต้องการเงินประกันและมรดกเพื่อลบล้างหนี้สินลับ',
    startRow: 0,
    startCol: 7
  },
  {
    id: 'mustard',
    name: 'พันเอก มัสตาร์ด',
    nameEn: 'Colonel Mustard',
    emoji: '🟡',
    color: '#d4a017',
    image: 'assets/images/mustard.jpg',
    role: 'นายพลทหารผ่านศึกผู้ทรงเกียรติ',
    desc: 'นายทหารอังกฤษรุ่นลายครามผู้ผ่านศึกมานับไม่ถ้วน เคร่งขรึม มีระเบียบวินัยสูง แต่มักซ่อนอารมณ์ฉุนเฉียวและความลับในอดีตสงครามไว้',
    motive: 'ถูกแบล็กเมลเรื่องความลับทางการทหารในอดีต',
    startRow: 0,
    startCol: 17
  },
  {
    id: 'white',
    name: 'คุณนายไวท์',
    nameEn: 'Mrs. White',
    emoji: '⚪',
    color: '#c8cdd8',
    image: 'assets/images/white.jpg',
    role: 'หัวหน้าแม่บ้านประจำคฤหาสน์',
    desc: 'หญิงชราผู้ดูแลคฤหาสน์หลังนี้มานานหลายทศวรรษ รู้จักซอกหลืบและกุญแจทุกดอกของบ้านเป็นอย่างดี ใบหน้าบึ้งตึงและไม่เคยไว้ใจแขกคนไหน',
    motive: 'แค้นเคืองที่กำลังจะถูกไล่ออกจากคฤหาสน์หลังรับใช้มาทั้งชีวิต',
    startRow: 9,
    startCol: 0
  },
  {
    id: 'green',
    name: 'บาทหลวง กรีน',
    nameEn: 'Reverend Green',
    emoji: '🟢',
    color: '#4caf88',
    image: 'assets/images/green.jpg',
    role: 'นักบวชลึกลับผู้มีวาจาน่าเลื่อมใส',
    desc: 'นักบวชผู้มีวาทศิลป์เป็นเลิศและดูเมตตา ทว่าเบื้องหลังกลับมีส่วนพัวพันกับกองทุนการกุศลที่เงินหายไปอย่างน่าสงสัย',
    motive: 'ปกปิดคดีทุจริตเงินบริจาคที่เจ้าของคฤหาสน์กำลังจะเปิดโปง',
    startRow: 14,
    startCol: 0
  },
  {
    id: 'peacock',
    name: 'คุณนายพีค็อก',
    nameEn: 'Mrs. Peacock',
    emoji: '🔵',
    color: '#5b9cf6',
    image: 'assets/images/peacock.jpg',
    role: 'คุณหญิงม่ายมหาเศรษฐีผู้หยิ่งยโส',
    desc: 'คุณนายชนชั้นสูงผู้สวมเครื่องเพชรไพลินและขนนกยูงระยิบระยับ รักษาภาพพจน์ผู้ดีเก่า แต่กำลังเผชิญวิกฤตล้มละลายลับๆ',
    motive: 'พยายามขัดขวางไม่ให้พินัยกรรมฉบับใหม่มีผลบังคับใช้',
    startRow: 23,
    startCol: 6
  },
  {
    id: 'plum',
    name: 'ศาสตราจารย์ พลัม',
    nameEn: 'Professor Plum',
    emoji: '🟣',
    color: '#7b6cd6',
    image: 'assets/images/plum.jpg',
    role: 'นักวิชาการแว่นหนาจอมเจ้าเล่ห์',
    desc: 'อาจารย์มหาวิทยาลัยผู้เชี่ยวชาญด้านโบราณคดีและเคมี ฉลาดหลักแหลมแต่หมกมุ่นกับสิ่งประดิษฐ์และตำราต้องห้าม',
    motive: 'ต้องการชิงงานวิจัยชิ้นสำคัญที่ถูกขโมยไปเก็บไว้ที่นี่',
    startRow: 23,
    startCol: 19
  },
];

const WEAPONS = [
  {
    id: 'ladder',
    name: 'บันไดไม้ห้องสมุด / ของหนักทับศีรษะ',
    nameEn: 'Library Ladder / Heavy Object',
    emoji: '🪜',
    image: 'assets/images/weapons.jpg',
    desc: 'บันไดปีนหนังสือไม้โอ๊คขนาดใหญ่ มีเสี้ยนไม้บิ่นหักและรอยครูดลึกจากการถูกผลักลงมาทับศีรษะ',
    lethality: 'การผลักของหนักหล่นทับศีรษะ (Falling Impact)'
  },
  {
    id: 'tome',
    name: 'สารานุกรมสันเหล็กเล่มหนา',
    nameEn: 'Heavy Iron-bound Tome',
    emoji: '📕',
    image: 'assets/images/weapons.jpg',
    desc: 'หนังสือสารานุกรมโบราณเล่มหนา มีสันเหล็กหนักและรอยคราบเลือดแห้งกรังติดอยู่',
    lethality: 'อาวุธทุบตีด้วยของหนัก (Blunt Force)'
  },
  {
    id: 'poison',
    name: 'ยาพิษไซยาไนด์ / สารพิษในแก้วไวน์',
    nameEn: 'Cyanide Poison / Wine Goblet',
    emoji: '🧪',
    image: 'assets/images/weapons.jpg',
    desc: 'ขวดแก้วสีชาบรรจุสารไซยาไนด์กลิ่นอัลมอนด์ขม ผสมในเครื่องดื่มหรือไวน์สังหารเหยื่ออย่างเงียบกริบ',
    lethality: 'สารพิษและของมีคม (Toxic Poisoning)'
  },
  {
    id: 'rope',
    name: 'เชือกกำมะหยี่รัดคอ / เชือกเส้นหนา',
    nameEn: 'Velvet Cord / Coiled Rope',
    emoji: '🪢',
    image: 'assets/images/weapons.jpg',
    desc: 'เชือกกำมะหยี่สีทองเส้นหนาที่มีพู่ไหมประดับ ใช้รัดคอจากด้านหลังอย่างเงียบกริบจนขาดใจ',
    lethality: 'อาวุธรัดคอไร้เสียง (Strangulation)'
  },
  {
    id: 'stairs_pot',
    name: 'การผลักตกบันไดหินอ่อน / กระถางต้นไม้โบราณ',
    nameEn: 'Marble Stairs Fall / Antique Pot',
    emoji: '🪴',
    image: 'assets/images/weapons.jpg',
    desc: 'การผลักตกบันไดหินอ่อนลงมากระแทกกับขอบกระถางต้นไม้ดินเผาโบราณจนแตกกระจาย',
    lethality: 'การผลักตกจากที่สูง (High Fall & Impact)'
  },
  {
    id: 'revolver',
    name: 'ปืนพกลูกโม่ / กระสุนสังหารระยะประชิด',
    nameEn: 'Revolver / Gunshot',
    emoji: '🔫',
    image: 'assets/images/weapons.jpg',
    desc: 'ปืนพกลูกโม่รุ่นโบราณบรรจุกระสุน ยิงในระยะประชิดด้วยหมอนอิงเก็บเสียง มีกลิ่นดินปืนจางๆ',
    lethality: 'อาวุธปืนระยะประชิด (Ballistic)'
  },
  {
    id: 'wrench',
    name: 'ประแจเหล็กกล้า / ของหนักทุบกระดูก',
    nameEn: 'Steel Wrench / Heavy Crushing',
    emoji: '🔩',
    image: 'assets/images/weapons.jpg',
    desc: 'ประแจเหล็กกล้าขนาดใหญ่ หนักและแข็งแกร่ง สามารถใช้ทุบกะโหลกศีรษะได้อย่างรุนแรง',
    lethality: 'อาวุธกระแทกอย่างรุนแรง (Heavy Crushing)'
  },
  {
    id: 'knife',
    name: 'มีดกริชโบราณ / มีดทำครัว',
    nameEn: 'Dagger Knife / Kitchen Blade',
    emoji: '🔪',
    image: 'assets/images/weapons.jpg',
    desc: 'มีดสั้นด้ามแกะสลักหรือมีดทำครัวคมกริบ รอยแผลแทงทะลุจุดตายได้อย่างแม่นยำไร้เสียง',
    lethality: 'อาวุธมีคมสังหารเงียบ (Piercing)'
  },
  {
    id: 'candlestick',
    name: 'เชิงเทียนทองเหลือง',
    nameEn: 'Candlestick',
    emoji: '🕯️',
    image: 'assets/images/weapons.jpg',
    desc: 'เชิงเทียนทองเหลืองโบราณ น้ำหนักมากพอที่จะกระแทกศีรษะจนถึงแก่ความตายได้ในพริบตา',
    lethality: 'อาวุธทุบตีระยะประชิด (Blunt Force)'
  },
  {
    id: 'lead-pipe',
    name: 'ท่อตะกั่ว / อาวุธทุบทำลายกระดูก',
    nameEn: 'Lead Pipe',
    emoji: '🔧',
    image: 'assets/images/weapons.jpg',
    desc: 'ท่อน้ำตะกั่วเก่าจากห้องทดลอง มีน้ำหนักถ่วงและคราบสนิมติดอยู่ตามพื้นผิว',
    lethality: 'อาวุธทุบทำลายกระดูก (Heavy Impact)'
  },
  {
    id: 'statue',
    name: 'รูปปั้นหินอ่อนโบราณ / หินแกะสลักหนัก',
    nameEn: 'Antique Marble Statue',
    emoji: '🗿',
    image: 'assets/images/weapons.jpg',
    desc: 'รูปสลักหินอ่อนกรีกโบราณน้ำหนักมาก มีรอยคราบเลือดติดที่ฐานหินสี่เหลี่ยม',
    lethality: 'อาวุธทุบกระแทกด้วยของหนัก (Crushing Impact)'
  },
  {
    id: 'sword',
    name: 'ดาบโบราณประดับฝาผนัง / คมดาบอัศวิน',
    nameEn: 'Cavalry Sword / Knight Blade',
    emoji: '⚔️',
    image: 'assets/images/weapons.jpg',
    desc: 'ดาบยาวทหารม้าโบราณที่แขวนประดับฝาผนัง คมดาบเหล็กกล้าแทงทะลุหัวใจได้อย่างแม่นยำ',
    lethality: 'อาวุธมีคมแทงฟัน (Slashing & Piercing)'
  },
  {
    id: 'fire_poker',
    name: 'เหล็กเขี่ยไฟเตาผิง / แท่งเหล็กเผาไหม้',
    nameEn: 'Fireplace Poker',
    emoji: '🔥',
    image: 'assets/images/weapons.jpg',
    desc: 'แท่งเหล็กดัดสำหรับเขี่ยฟืนในเตาผิง ปลายแหลมคมและมีรอยเขม่าควันดำไหม้เกรียม',
    lethality: 'อาวุธทุบแทงและเผาไหม้ (Thermal & Piercing)'
  },
  {
    id: 'clock_weight',
    name: 'ลูกตุ้มนาฬิกาโบราณ / ของหนักถ่วงเวลา',
    nameEn: 'Grandfather Clock Weight',
    emoji: '🕰️',
    image: 'assets/images/weapons.jpg',
    desc: 'ลูกตุ้มถ่วงทองเหลืองตันขนาดใหญ่จากนาฬิกาตั้งพื้น ถูกปลดสายสลิงมาใช้ทุบศีรษะ',
    lethality: 'อาวุธทุบตีด้วยของหนัก (Blunt Trauma)'
  },
  {
    id: 'trophy_antler',
    name: 'เขากวางสตัฟฟ์ / ถ้วยรางวัลล่าสัตว์',
    nameEn: 'Hunting Trophy Antler',
    emoji: '🦌',
    image: 'assets/images/weapons.jpg',
    desc: 'หัวกวางสตัฟฟ์ที่มีกิ่งเขากวางแหลมคม ถูกกระชากลงมาใช้แทงอย่างทารุณ',
    lethality: 'อาวุธแทงทะลุหลายจุด (Multi-piercing)'
  },
  {
    id: 'silk_scarf',
    name: 'ผ้าพันคอไหม / การรัดคอไร้ร่องรอย',
    nameEn: 'Silk Scarf / Suffocation',
    emoji: '🧣',
    image: 'assets/images/weapons.jpg',
    desc: 'ผ้าพันคอไหมทอมือเนื้อหนา ใช้รัดหลอดลมเหยื่อจากด้านหลังจนขาดอากาศหายใจอย่างเงียบงัน',
    lethality: 'การรัดคอไร้เสียง (Strangulation)'
  },
  {
    id: 'hypodermic',
    name: 'เข็มฉีดยาพิษ / สารสกัดพืชมีพิษ',
    nameEn: 'Hypodermic Syringe / Belladonna',
    emoji: '💉',
    image: 'assets/images/weapons.jpg',
    desc: 'กระบอกฉีดยาแก้วโบราณบรรจุสารสกัดเบลลาดอนนาเข้มข้น ฉีดเข้าเส้นเลือดโดยตรง',
    lethality: 'สารพิษเข้าสู่กระแสเลือด (Lethal Injection)'
  },
  {
    id: 'chandelier',
    name: 'โคมระย้าคริสตัล / ของตกจากเพดาน',
    nameEn: 'Crystal Chandelier Fall',
    emoji: '💎',
    image: 'assets/images/weapons.jpg',
    desc: 'การตัดโซ่ยึดโคมระย้าคริสตัลให้ร่วงหล่นลงมาทับเหยื่อ เศษแก้วและโลหะทับร่างแหลกเหลว',
    lethality: 'การถล่มทับจากที่สูง (Crushing Impact)'
  },
  {
    id: 'cue_stick',
    name: 'ไม้คิวบิลเลียดถ่วงตะกั่ว',
    nameEn: 'Weighted Billiard Cue',
    emoji: '🎱',
    image: 'assets/images/weapons.jpg',
    desc: 'ไม้คิวไม้เมเปิ้ลเนื้อแข็งที่มีการเจาะถ่วงตะกั่วที่ด้ามจับ ฟาดกระแทกขมับอย่างรุนแรง',
    lethality: 'อาวุธฟาดกระแทก (Blunt Trauma)'
  },
  {
    id: 'chemical_acid',
    name: 'สารเคมีกรดเข้มข้น / สารละลายกัดกร่อน',
    nameEn: 'Concentrated Chemical Acid',
    emoji: '⚗️',
    image: 'assets/images/weapons.jpg',
    desc: 'ขวดแก้วบรรจุกรดกำมะถันและสารปรอทเข้มข้น ใช้สาดใส่หรือบังคับกลืนทำลายระบบทางเดินหายใจ',
    lethality: 'สารเคมีกัดกร่อนรุนแรง (Chemical Corrosive)'
  }
];

const ROOMS = [
  {
    id: 'kitchen',
    name: 'ห้องครัว',
    nameEn: 'Kitchen',
    emoji: '🍳',
    desc: 'ห้องครัวขนาดใหญ่ปูกระเบื้องลายตารางหมากรุก มีเตาอบขนาดมหึมาและมีดทำครัวแขวนเรียงราย มีบันไดลับเชื่อมไปยังห้องทำงาน',
    secretPassage: 'study',
    secretName: 'ห้องทำงาน (Study)'
  },
  {
    id: 'ballroom',
    name: 'ห้องเต้นรำ',
    nameEn: 'Ballroom',
    emoji: '💃',
    desc: 'โถงจัดเลี้ยงโอ่อ่าปูหินอ่อนขัดมันและโคมไฟระย้าคริสตัลขนาดยักษ์ หน้าต่างบานสูงมองเห็นสวนภายนอก',
    secretPassage: null
  },
  {
    id: 'conservatory',
    name: 'เรือนกระจก',
    nameEn: 'Conservatory',
    emoji: '🌿',
    desc: 'เรือนกระจกปลูกพืชเมืองร้อนและพรรณไม้หายาก มีน้ำพุหินอ่อนตรงกลาง เสียงฝนกระทบกระจกทำให้ไม่ได้ยินเสียงภายนอก เชื่อมไปยังห้องนั่งเล่น',
    secretPassage: 'lounge',
    secretName: 'ห้องนั่งเล่น (Lounge)'
  },
  {
    id: 'billiard-room',
    name: 'ห้องบิลเลียด',
    nameEn: 'Billiard Room',
    emoji: '🎱',
    desc: 'ห้องสันทนาการบุผนังไม้สัก มีโต๊ะบิลเลียดผ้าสักหลาดสีเขียวตั้งอยู่ตรงกลาง แสงไฟสลัวชวนให้วางแผนลับ',
    secretPassage: null
  },
  {
    id: 'library',
    name: 'ห้องสมุด',
    nameEn: 'Library',
    emoji: '📚',
    desc: 'ห้องสมุดสองชั้นที่เต็มไปด้วยตู้หนังสือสูงจรดเพดาน เก้าอี้หนังนุ่มและลูกโลกโบราณ กลิ่นกระดาษเก่าและหมึกพิมพ์',
    secretPassage: null
  },
  {
    id: 'study',
    name: 'ห้องทำงาน',
    nameEn: 'Study',
    emoji: '📖',
    desc: 'ห้องทำงานส่วนตัวของเจ้าของคฤหาสน์ มีโต๊ะไม้มะฮอกกานี ตู้เซฟซ่อนหลังภาพวาด และบันไดลับเชื่อมไปยังห้องครัว',
    secretPassage: 'kitchen',
    secretName: 'ห้องครัว (Kitchen)'
  },
  {
    id: 'hall',
    name: 'โถงกลาง',
    nameEn: 'Hall',
    emoji: '🚪',
    desc: 'ทางเดินโถงกลางที่เชื่อมต่อห้องต่างๆ ในคฤหาสน์ เสาหินโรมันและรูปปั้นหินอ่อนตั้งตระหง่าน',
    secretPassage: null
  },
  {
    id: 'lounge',
    name: 'ห้องนั่งเล่น',
    nameEn: 'Lounge',
    emoji: '🛋️',
    desc: 'ห้องรับแขกแสนอบอุ่นที่มีเตาผิงลุกโชนตลอดเวลา โซฟากำมะหยี่สีแดง และทางลับที่แอบทะลุไปยังเรือนกระจก',
    secretPassage: 'conservatory',
    secretName: 'เรือนกระจก (Conservatory)'
  },
  {
    id: 'dining-room',
    name: 'ห้องอาหาร',
    nameEn: 'Dining Room',
    emoji: '🍽️',
    desc: 'โต๊ะอาหารยาวรองรับแขกได้สิบกว่าคน มีเชิงเทียนเงินและถาดอาหารหรูหรา เป็นสถานที่ที่ทุกคนพบกันก่อนเกิดเหตุ',
    secretPassage: null
  },
];

/**
 * Build full card deck (21 cards) and pick solution randomly
 */
function buildDeckAndSolution() {
  const suspectCards = SUSPECTS.map(s => ({
    type: 'suspect',
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    emoji: s.emoji,
    image: s.image,
    role: s.role,
    desc: s.desc,
    motive: s.motive,
    color: s.color
  }));

  const weaponCards = WEAPONS.map(w => ({
    type: 'weapon',
    id: w.id,
    name: w.name,
    nameEn: w.nameEn,
    emoji: w.emoji,
    image: w.image,
    desc: w.desc,
    lethality: w.lethality
  }));

  const roomCards = ROOMS.map(r => ({
    type: 'room',
    id: r.id,
    name: r.name,
    nameEn: r.nameEn,
    emoji: r.emoji,
    desc: r.desc,
    secretPassage: r.secretPassage,
    secretName: r.secretName
  }));

  // Pick solution (1 Suspect + 1 Weapon + 1 Room)
  const solution = {
    suspect: pick(suspectCards),
    weapon:  pick(weaponCards),
    room:    pick(roomCards),
  };

  // Remaining cards to deal to players
  const remaining = [
    ...suspectCards.filter(c => c.id !== solution.suspect.id),
    ...weaponCards.filter(c  => c.id !== solution.weapon.id),
    ...roomCards.filter(c    => c.id !== solution.room.id),
  ];

  shuffle(remaining);
  return { solution, deck: remaining };
}

/**
 * Deal cards evenly to players
 */
function dealCards(deck, numPlayers) {
  const hands = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, i) => hands[i % numPlayers].push(card));
  return hands;
}

// Utilities
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRoomById(id) { return ROOMS.find(r => r.id === id); }
function getSuspectById(id) { return SUSPECTS.find(s => s.id === id); }
function getWeaponById(id) { return WEAPONS.find(w => w.id === id); }
