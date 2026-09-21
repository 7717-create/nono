/**
 * cutscene.js — Cinematic Prologue & Mysterious Audio Atmosphere
 * Provides an immersive story intro with eerie, smooth mystery ambiance (Web Audio API)
 */

const CUTSCENE_SLIDES = [
  {
    image: 'assets/images/manor.jpg',
    tag: 'ค่ำคืนวันที่ 13 ตุลาคม 1923',
    title: 'คดีฆาตกรรม ณ คฤหาสน์แบล็ควูด',
    text: 'ท่ามกลางพายุฝนฟ้าคะนองที่โหมกระหน่ำ คฤหาสน์โบราณอันโอ่อ่าถูกตัดขาดจากโลกภายนอก... ลมหนาวพัดผ่านผ้าม่าน และความเงียบงันอันน่าขนลุกกำลังคืบคลานเข้ามา',
    sound: 'dark_ambient'
  },
  {
    image: 'assets/images/casefile.jpg',
    tag: '🩸 เกิดเหตุสะเทือนขวัญ',
    title: 'การหายตัวไปอย่างลึกลับของเจ้าของบ้าน',
    text: 'ในค่ำคืนนี้ เซอร์ ฮิวจ์ แบล็ควูด มหาเศรษฐีเจ้าของคฤหาสน์ ได้หายตัวไปอย่างไร้ร่องรอย! พบเพียงร่องรอยการต่อสู้และคราบเลือด แต่ไม่มีใครพบศพของเขา... เพราะฆาตกรตัวจริงได้ซ่อนศพเอาไว้ในคฤหาสน์!',
    sound: 'crime_scene'
  },
  {
    type: 'suspects',
    tag: '👥 แขกทั้ง 6 คน',
    title: 'ทุกคนล้วนมีแรงจูงใจและโอกาสเท่ากัน',
    text: 'แขกทั้ง 6 คนที่อยู่ในบ้านต่างตกเป็นผู้ต้องสงสัย ทั้งมิส สคาร์เล็ต, พันเอก มัสตาร์ด, คุณนายไวท์, บาทหลวง กรีน, คุณนายพีค็อก และศาสตราจารย์ พลัม... ทุกคนต่างซ่อนความลับที่ไม่อาจเปิดเผย!',
    sound: 'suspects_whisper'
  },
  {
    image: 'assets/images/floorplan.jpg',
    tag: '🔍 ภารกิจนักสืบของคุณ',
    title: 'ค้นหาตัวฆาตกรตัวจริง และจุดซ่อนศพ!',
    text: 'หน้าที่ของคุณคือ รวบรวมเบาะแสในคฤหาสน์ทั้ง 9 ห้อง เพื่อหาว่า: ใครคือฆาตกร? เกิดเหตุที่ห้องไหน? และฆาตกรนำศพไปซ่อนไว้ที่ใด? จงระวังตัว... เพราะฆาตกรกำลังแฝงตัวอยู่ข้างๆ คุณ!',
    sound: 'detective_resolve'
  }
];

let currentSlideIdx = 0;
let cutsceneCallback = null;
let audioCtx = null;

/**
 * Pure Cinematic Mystery Audio Synthesizer (Web Audio API)
 * Carefully designed with zero digital clicks, smooth attack envelopes, and dark ambient chords.
 */
function playAtmosphericSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const t = audioCtx.currentTime;

    // Master filter to keep everything warm, dark, and vintage noir
    const masterFilter = audioCtx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(900, t);
    masterFilter.connect(audioCtx.destination);

    if (type === 'dark_ambient') {
      // 1. Eerie Deep Swell (No harsh click, smooth 0.6s fade-in)
      const bassNotes = [55, 82.41, 110]; // A1, E2, A2 (Deep mysterious drone)
      bassNotes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        // Gentle envelope: starts at 0, slowly blooms, then decays
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), t + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

        osc.connect(gain);
        gain.connect(masterFilter);
        osc.start(t);
        osc.stop(t + 3.5);
      });

      // 2. Distant haunted chime (Eerie music-box harmonic)
      const chimeFreqs = [440, 523.25, 659.25]; // A Minor chime
      chimeFreqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + 0.4 + i * 0.25);

        gain.gain.setValueAtTime(0.0001, t + 0.4 + i * 0.25);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.45 + i * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4 + i * 0.25);

        osc.connect(gain);
        gain.connect(masterFilter);
        osc.start(t + 0.4 + i * 0.25);
        osc.stop(t + 2.5 + i * 0.25);
      });

    } else if (type === 'crime_scene') {
      // Dissonant dark suspense chord (Diminished harmony)
      const dissonantNotes = [65.41, 92.50, 138.59, 196.00]; // C, F#, C#, G
      dissonantNotes.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

        osc.connect(gain);
        gain.connect(masterFilter);
        osc.start(t);
        osc.stop(t + 3.2);
      });

    } else if (type === 'suspects_whisper') {
      // Eerie clockwork / music box sequence in minor key
      const notes = [329.63, 293.66, 261.63, 246.94]; // E4, D4, C4, B3
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.3);

        gain.gain.setValueAtTime(0.0001, t + i * 0.3);
        gain.gain.linearRampToValueAtTime(0.045, t + i * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.3 + 1.2);

        osc.connect(gain);
        gain.connect(masterFilter);
        osc.start(t + i * 0.3);
        osc.stop(t + i * 0.3 + 1.2);
      });

    } else if (type === 'detective_resolve') {
      // Deep dramatic mystery swell
      const resolveNotes = [73.42, 110.00, 146.83, 220.00]; // D2, A2, D3, A3
      resolveNotes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.07, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

        osc.connect(gain);
        gain.connect(masterFilter);
        osc.start(t);
        osc.stop(t + 3.5);
      });
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

/**
 * Launch the cutscene
 */
function playCutscene(onFinish) {
  cutsceneCallback = onFinish;
  currentSlideIdx = 0;
  showScreen('screen-cutscene');
  renderCurrentSlide();
}

function renderCurrentSlide() {
  const slide = CUTSCENE_SLIDES[currentSlideIdx];
  if (!slide) {
    finishCutscene();
    return;
  }

  playAtmosphericSound(slide.sound);

  const backdrop = document.getElementById('cutscene-backdrop');
  const tagEl = document.getElementById('cutscene-tag');
  const titleEl = document.getElementById('cutscene-title');
  const textEl = document.getElementById('cutscene-text');
  const suspectRow = document.getElementById('cutscene-suspects-row');
  const nextBtn = document.getElementById('btn-cutscene-next');
  const dotsContainer = document.getElementById('cutscene-dots');

  if (tagEl) tagEl.textContent = slide.tag;
  if (titleEl) titleEl.textContent = slide.title;
  if (textEl) textEl.textContent = slide.text;

  // Handle slide backdrop vs suspect row
  if (slide.type === 'suspects') {
    if (backdrop) backdrop.style.backgroundImage = `url('assets/images/manor.jpg')`;
    if (suspectRow) {
      suspectRow.classList.remove('hidden');
      suspectRow.innerHTML = '';
      SUSPECTS.forEach(s => {
        const item = document.createElement('div');
        item.classList.add('cutscene-suspect-card');
        item.innerHTML = `
          <div class="cs-avatar-wrap" style="border-color: ${s.color}">
            <img src="${s.image}" alt="${s.name}" />
          </div>
          <div class="cs-name">${s.name}</div>
          <div class="cs-role">${s.role}</div>
        `;
        suspectRow.appendChild(item);
      });
    }
  } else {
    if (suspectRow) suspectRow.classList.add('hidden');
    if (backdrop && slide.image) {
      backdrop.style.backgroundImage = `url('${slide.image}')`;
    }
  }

  // Update button label on last slide
  const isLast = (currentSlideIdx === CUTSCENE_SLIDES.length - 1);
  if (nextBtn) {
    nextBtn.innerHTML = isLast ? 'ก้าวเข้าสู่คฤหาสน์และเริ่มสืบสวน 🔍' : 'ถัดไป ➔';
    if (isLast) {
      nextBtn.classList.add('btn-climax');
    } else {
      nextBtn.classList.remove('btn-climax');
    }
  }

  // Update dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    CUTSCENE_SLIDES.forEach((_, idx) => {
      const dot = document.createElement('span');
      dot.classList.add('cs-dot');
      if (idx === currentSlideIdx) dot.classList.add('active');
      dotsContainer.appendChild(dot);
    });
  }
}

function nextCutsceneSlide() {
  if (currentSlideIdx < CUTSCENE_SLIDES.length - 1) {
    currentSlideIdx++;
    renderCurrentSlide();
  } else {
    finishCutscene();
  }
}

function finishCutscene() {
  if (cutsceneCallback) {
    const cb = cutsceneCallback;
    cutsceneCallback = null;
    cb();
  } else {
    showScreen('screen-setup');
  }
}

// Bind buttons on load
document.addEventListener('DOMContentLoaded', () => {
  const nextBtn = document.getElementById('btn-cutscene-next');
  if (nextBtn) nextBtn.onclick = () => nextCutsceneSlide();

  const skipBtn = document.getElementById('btn-cutscene-skip');
  if (skipBtn) skipBtn.onclick = () => finishCutscene();
});
