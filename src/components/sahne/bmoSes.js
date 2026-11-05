// BMO'nun sesleri: adarkeser.com'daki index bundle'ından çıkarıldı, okunur hale getirildi.
// Efektlerin hepsi Web Audio ile koddan üretilir, ses dosyası yalnızca konuşmalar içindir.
// Frekans, süre ve seviye değerleri orijinalle aynıdır. Orijinali: original/sound.pretty.js
//
//   const sound = createBmoSound();
//   const bmo = await createBmo(canvas, { projects, sound });
//   sound.greet();
//
// Konuşmaları istemezsen: createBmoSound({ voiceUrl: null })
//
// Tarayıcı ilk tıklamadan önce ses çalmaya izin vermez. Bu yüzden ses o ana kadar
// kapalı kalır, greet() de selamlamayı ilk tıklamaya kadar bekletir.

const MASTER_LEVEL = 1.6;
const VOICE_LEVEL = 0.3;
const DUCKED_LEVEL = 0.4; // BMO konuşurken efektlerin kısıldığı seviye

// Dosya adının ilk parçası grubu verir: speak('whee') whee-1 ya da whee-2'yi çalar
const CLIPS = [
  'again-play-again',
  'again-that-was-fun',
  'annoyed-be-gentle',
  'annoyed-cut-that-out',
  'annoyed-knock-it-off',
  'bye-powering-down',
  'happy-giggle-1',
  'happy-giggle-2',
  'happy-giggle-3',
  'happy-giggle-4',
  'happy-giggle-5',
  'hello-its-me-bmo',
  'hello-there',
  'play-its-bmo-time',
  'play-lets-play',
  'play-made-this-for-you',
  'poked-my-face',
  'poked-that-tickles-1',
  'poked-that-tickles-2',
  'poked-why-are-you-poking',
  'surprised-oh',
  'surprised-whoa-1',
  'surprised-whoa-2',
  'whee-1',
  'whee-2',
];

// Her düğmenin kendi tıkı var: büyük düğmeler daha pes
const BUTTONS = {
  a: { thunk: 150, click: 1700, vol: 1 },
  b: { thunk: 220, click: 2300, vol: 0.85 },
  triangle: { thunk: 250, click: 2800, vol: 0.8 },
  dpad: { thunk: 300, click: 3600, vol: 0.75 },
  blue: { thunk: 380, click: 4400, vol: 0.55 },
  pill: { thunk: 190, click: 1200, vol: 0.6 },
};

const midi = (note) => 440 * 2 ** ((note - 69) / 12);

// Kartuşların notaları pentatonik, hangi sırayla çalınsa da kulağa düzgün gelir
const PENTATONIC = [0, 2, 4, 7, 9];
const scale = (root, step) => root + 12 * Math.floor(step / 5) + PENTATONIC[step % 5];

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const sweepBetween = (from, to) =>
  [0.2, 0.4, 0.6, 0.8, 1].map((t) => [t, from * (to / from) ** easeInOut(t)]);

export function createBmoSound({
  voiceUrl = '/sesler/bmo/',
  storageKey = 'bmo-sound',
} = {}) {
  let on = true;
  try {
    on = localStorage.getItem(storageKey) !== 'off';
  } catch {
    // Gizli sekmede erişim hata verebilir, ses açık başlar
  }

  let ctx = null;
  let master = null;
  let effects = null;
  let voices = null;
  let analyser = null;
  let analyserData = null;
  let reverbSend = null;
  let noise = null;
  const waves = new Map();

  const clips = {};
  const lastClip = {};
  let downloads = null;
  let speaking = null;
  let duckedUntil = -Infinity;
  let resumedAt = -Infinity;
  let greeting = false;

  const canPlay = () =>
    on && ctx !== null && (ctx.state === 'running' || performance.now() - resumedAt < 300);
  const whenAudible = (play) => (...args) => (canPlay() ? play(...args) : undefined);

  function downloadVoices() {
    if (downloads || !voiceUrl) return;
    downloads = CLIPS.map((name) =>
      fetch(`${voiceUrl}${name}.mp3`)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => ({ name, bytes }))
        .catch((error) => {
          console.warn(`BMO sesi yüklenemedi: ${name}`, error);
          return null;
        }),
    );
  }

  function decodeVoices() {
    downloadVoices();
    downloads?.forEach(async (download) => {
      const file = await download;
      if (!file) return;
      const group = file.name.split('-')[0];
      try {
        (clips[group] ??= []).push(await ctx.decodeAudioData(file.bytes));
        if (group === 'hello') flushGreeting();
      } catch (error) {
        console.warn(`BMO sesi çözülemedi: ${file.name}`, error);
      }
    });
  }

  // Efektler ve konuşma ayrı kanallardan geçer, ikisi de sınırlayıcıyla master'a bağlanır
  function buildGraph() {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 10;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.05;

    compressor.connect(limiter);
    limiter.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = MASTER_LEVEL;
    master.connect(compressor);

    effects = ctx.createGain();
    effects.connect(master);

    voices = ctx.createGain();
    voices.connect(master);

    // Ağız konuşmanın genliğine göre açılır
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserData = new Float32Array(analyser.fftSize);
    voices.connect(analyser);

    const reverb = ctx.createConvolver();
    reverb.buffer = impulseResponse(0.8);
    const reverbTone = ctx.createBiquadFilter();
    reverbTone.type = 'lowpass';
    reverbTone.frequency.value = 3200;
    reverbSend = ctx.createGain();
    reverbSend.connect(reverbTone);
    reverbTone.connect(reverb);
    reverb.connect(effects);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  function impulseResponse(seconds) {
    const length = Math.round(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    return buffer;
  }

  // Görev oranı ayarlanabilen kare dalga: 8-bit konsolların sesi
  function pulseWave(duty) {
    if (!waves.has(duty)) {
      const real = new Float32Array(48);
      const imag = new Float32Array(48);
      for (let n = 1; n < 48; n++) {
        real[n] = Math.sin(2 * Math.PI * n * duty) / (Math.PI * n);
        imag[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (Math.PI * n);
      }
      waves.set(duty, ctx.createPeriodicWave(real, imag));
    }
    return waves.get(duty);
  }

  function schedule(param, start, duration, from, points, exponential) {
    param.setValueAtTime(from, start);
    for (const [at, value] of points) {
      if (exponential) param.exponentialRampToValueAtTime(value, start + at * duration);
      else param.linearRampToValueAtTime(value, start + at * duration);
    }
  }

  function envelope(start, duration, { vol, attack = 0.004, hold = 0, shape }) {
    const gain = ctx.createGain();
    if (shape) {
      schedule(gain.gain, start, duration, 0, shape.map(([at, level]) => [at, vol * level]), false);
      return gain;
    }
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + attack);
    if (hold) gain.gain.setValueAtTime(vol, start + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    return gain;
  }

  // pan: -1 sol, 1 sağ. [a, b] verilirse ses süre boyunca a'dan b'ye gider.
  function output(start, duration, pan = 0, wet = 0.15, bus = effects) {
    const panner = ctx.createStereoPanner();
    if (Array.isArray(pan)) schedule(panner.pan, start, duration, pan[0], [[1, pan[1]]], false);
    else panner.pan.value = pan;
    panner.connect(bus);
    if (wet) {
      const send = ctx.createGain();
      send.gain.value = wet;
      panner.connect(send);
      send.connect(reverbSend);
    }
    return panner;
  }

  function tone({ at = 0, wave = 0.5, freq, sweep, dur, vibrato = 0, lowpass, pan, wet, ...level }) {
    const start = ctx.currentTime + at;
    const oscillator = ctx.createOscillator();
    if (typeof wave === 'number') oscillator.setPeriodicWave(pulseWave(wave));
    else oscillator.type = wave;
    if (sweep) schedule(oscillator.frequency, start, dur, freq, sweep, true);
    else oscillator.frequency.value = freq;

    if (vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 6;
      const depth = ctx.createGain();
      schedule(depth.gain, start, dur, 0, [[0.6, vibrato]], false);
      lfo.connect(depth);
      depth.connect(oscillator.detune);
      lfo.start(start);
      lfo.stop(start + dur);
    }

    const gain = envelope(start, dur, level);
    let last = oscillator;
    if (lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      oscillator.connect(filter);
      last = filter;
    }
    last.connect(gain);
    gain.connect(output(start, dur, pan, wet));
    oscillator.start(start);
    oscillator.stop(start + dur + 0.05);
    oscillator.onended = () => gain.disconnect();
  }

  function hiss({ at = 0, type = 'bandpass', freq, sweep, q = 1, dur, pan, wet, ...level }) {
    const start = ctx.currentTime + at;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    if (sweep) schedule(filter.frequency, start, dur, freq, sweep, true);
    else filter.frequency.value = freq;
    const gain = envelope(start, dur, level);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output(start, dur, pan, wet));
    source.start(start, Math.random() * 0.5);
    source.stop(start + dur + 0.05);
    source.onended = () => gain.disconnect();
  }

  // ------------------------------------------------------------- konuşma
  function duck(from, until) {
    const gain = effects.gain;
    gain.cancelScheduledValues(from);
    if (from < duckedUntil + 0.25) {
      gain.setValueAtTime(DUCKED_LEVEL, from);
    } else {
      gain.setValueAtTime(1, from);
      gain.linearRampToValueAtTime(DUCKED_LEVEL, from + 0.04);
    }
    gain.setValueAtTime(DUCKED_LEVEL, until);
    gain.linearRampToValueAtTime(1, until + 0.25);
    duckedUntil = until;
  }

  // Gruptan rastgele bir klip çalar, aynısını üst üste seçmez. BMO konuşuyorsa
  // yeni klip sıraya girer, cut: true verilirse sözünü keser. Bitişe kalan ms döner.
  const speak = whenAudible((group, { at = 0, pan = 0, cut = false } = {}) => {
    greeting = false; // BMO konuşmaya başladıysa selamlamanın yeri geçmiştir
    const now = ctx.currentTime;
    const busy = speaking && speaking.until > now + at;
    const pool = clips[group] ?? [];
    const choices = pool.length > 1 ? pool.filter((clip) => clip !== lastClip[group]) : pool;
    if (!choices.length) return 0;
    const clip = choices[Math.floor(Math.random() * choices.length)];
    lastClip[group] = clip;

    const queued = busy && !cut;
    const start = queued ? speaking.until : now + at;
    if (busy && cut) {
      const { source, level } = speaking;
      level.gain.setValueAtTime(VOICE_LEVEL, start);
      level.gain.linearRampToValueAtTime(0, start + 0.03);
      source.stop(start + 0.03);
    }

    const source = ctx.createBufferSource();
    source.buffer = clip;
    const level = ctx.createGain();
    level.gain.value = VOICE_LEVEL;
    source.connect(level);
    level.connect(output(start, clip.duration, pan, 0.2, voices));
    source.start(start);
    source.onended = () => level.disconnect();

    const until = start + clip.duration;
    speaking = { source, level, from: queued ? speaking.from : start, until };
    duck(start, until);
    return (until - now) * 1000;
  });

  const voiceLeft = () =>
    !on || !speaking ? 0 : Math.max(0, speaking.until - ctx.currentTime) * 1000;

  // 0-1 arası ağız açıklığı, BMO konuşmuyorsa null
  function talkLevel() {
    if (!on || !speaking) return null;
    const now = ctx.currentTime;
    if (now < speaking.from || now > speaking.until) return null;
    analyser.getFloatTimeDomainData(analyserData);
    let sum = 0;
    for (const sample of analyserData) sum += sample * sample;
    const db = 10 * Math.log10(sum / analyserData.length + 1e-12) - 20 * Math.log10(VOICE_LEVEL) + 3;
    return Math.min(1, Math.max(0, (db + 40) / 23));
  }

  // ------------------------------------------------------------- efektler
  const startupJingle = whenAudible(() => {
    [79, 84, 88, 96].forEach((note, i) =>
      tone({
        at: i * 0.075,
        wave: 0.25,
        freq: midi(note),
        dur: i === 3 ? 0.5 : 0.1,
        hold: 0.04,
        vol: 0.067,
        vibrato: i === 3 ? 15 : 0,
        lowpass: 5000,
        wet: 0.25,
      }),
    );
  });

  const press = whenAudible((name, pan) => {
    if (name === 'screen') {
      tone({ wave: 'sine', freq: 600, sweep: [[1, 420]], dur: 0.09, vol: 0.14, pan });
      return;
    }
    const button = BUTTONS[name];
    hiss({ freq: button.click, q: 1.6, dur: 0.025, vol: 0.25 * button.vol, attack: 0.001, pan, wet: 0.08 });
    tone({
      wave: 'sine',
      freq: button.thunk,
      sweep: [[1, button.thunk / 2]],
      dur: 0.07,
      vol: 0.3 * button.vol,
      attack: 0.001,
      pan,
      wet: 0.05,
    });
  });

  const release = whenAudible((name, pan) => {
    const button = BUTTONS[name];
    if (button) {
      hiss({ freq: button.click * 1.3, q: 2, dur: 0.015, vol: 0.15 * button.vol, attack: 0.001, pan, wet: 0.05 });
    }
  });

  const cartHover = whenAudible((index, pan) => {
    const note = scale(84, index);
    tone({ wave: 0.25, freq: midi(note), dur: 0.07, vol: 0.063, pan, wet: 0.2 });
    tone({ wave: 'triangle', freq: midi(note + 12), dur: 0.12, vol: 0.063, pan, wet: 0.3 });
  });

  const cartPick = whenAudible((index) => {
    const note = scale(84, index);
    tone({ wave: 0.5, freq: midi(note), dur: 0.07, hold: 0.03, vol: 0.048, lowpass: 5000 });
    tone({ at: 0.07, wave: 0.5, freq: midi(note + 7), dur: 0.22, hold: 0.04, vol: 0.048, lowpass: 5000, wet: 0.2 });
    tone({ at: 0.07, wave: 'triangle', freq: midi(note - 5), dur: 0.22, vol: 0.064 });
  });

  const cartFly = whenAudible((ms, panFrom, panTo) => {
    hiss({
      freq: 450,
      sweep: [[0.5, 1700], [1, 700]],
      q: 1.1,
      dur: ms / 1000,
      vol: 0.21,
      shape: [[0.15, 0.2], [0.5, 1], [1, 0]],
      pan: [panFrom, panTo],
      wet: 0.25,
    });
  });

  // ms kadar sürtünme, ardından yuvaya oturma tıkı
  const cartSeat = whenAudible((ms, pan) => {
    const slide = ms / 1000;
    if (slide) {
      hiss({
        freq: 2600,
        sweep: [[1, 3600]],
        q: 2.5,
        dur: slide,
        vol: 0.06,
        shape: [[0.2, 0.6], [0.92, 1], [1, 0]],
        pan,
        wet: 0.05,
      });
    }
    hiss({ at: slide, freq: 2300, q: 1.4, dur: 0.04, vol: 0.27, attack: 0.001, pan });
    tone({ at: slide, wave: 'sine', freq: 160, sweep: [[1, 55]], dur: 0.14, vol: 0.26, attack: 0.002, pan, wet: 0.1 });
    hiss({ at: slide + 0.05, freq: 4800, q: 2, dur: 0.025, vol: 0.18, attack: 0.001, pan, wet: 0.1 });
  });

  const cartEject = whenAudible((pan) => {
    hiss({ freq: 3000, q: 1.5, dur: 0.03, vol: 0.3, attack: 0.001, pan });
    tone({ wave: 'sine', freq: 180, sweep: [[0.4, 480], [1, 380]], dur: 0.16, vol: 0.16, pan });
    hiss({
      at: 0.02,
      freq: 3200,
      sweep: [[1, 2400]],
      q: 2.5,
      dur: 0.26,
      vol: 0.07,
      shape: [[0.1, 1], [1, 0]],
      pan,
      wet: 0.05,
    });
  });

  const boot = whenAudible(() => {
    tone({ wave: 0.25, freq: 320, sweep: [[0.75, 2600]], dur: 0.09, vol: 0.05 });
    tone({ wave: 'sine', freq: 90, sweep: [[1, 50]], dur: 0.3, vol: 0.15, attack: 0.01 });
    hiss({ type: 'highpass', freq: 5000, dur: 0.14, vol: 0.05, attack: 0.001, wet: 0.1 });
  });

  const typeLetter = whenAudible((index) => {
    tone({ wave: 0.125, freq: midi(scale(81, index % 5)), dur: 0.05, vol: 0.16 });
  });

  const bootDone = whenAudible(() => {
    tone({ wave: 0.125, freq: midi(83), dur: 0.08, hold: 0.04, vol: 0.06 });
    tone({ at: 0.08, wave: 0.125, freq: midi(88), dur: 0.6, hold: 0.08, vol: 0.06, vibrato: 18, wet: 0.3 });
    tone({ at: 0.08, wave: 'triangle', freq: midi(76), dur: 0.5, vol: 0.09, wet: 0.3 });
  });

  const zoomIn = whenAudible((ms) => {
    const dur = ms / 1000;
    hiss({
      freq: 260,
      sweep: sweepBetween(260, 3800),
      q: 0.9,
      dur,
      vol: 0.115,
      shape: [[0.3, 0.3], [0.8, 1], [1, 0]],
      wet: 0.3,
    });
    tone({
      wave: 'triangle',
      freq: 220,
      sweep: sweepBetween(220, 880),
      dur,
      vol: 0.029,
      shape: [[0.4, 0.6], [0.85, 1], [1, 0]],
      wet: 0.4,
    });
  });

  const zoomOut = whenAudible((ms) => {
    const dur = ms / 1000;
    hiss({
      freq: 3800,
      sweep: sweepBetween(3800, 260),
      q: 0.9,
      dur,
      vol: 0.115,
      shape: [[0.2, 1], [0.7, 0.3], [1, 0]],
      wet: 0.3,
    });
    tone({
      wave: 'triangle',
      freq: 880,
      sweep: sweepBetween(880, 220),
      dur,
      vol: 0.029,
      shape: [[0.15, 1], [0.6, 0.6], [1, 0]],
      wet: 0.4,
    });
  });

  // Ekran katmanı açılırken
  const arrive = whenAudible(() => {
    [91, 96, 100, 103].forEach((note, i) =>
      tone({ at: i * 0.035, wave: 'triangle', freq: midi(note), dur: 0.3, vol: 0.045, wet: 0.45 }),
    );
  });

  const confirm = whenAudible(() => {
    tone({ wave: 0.5, freq: midi(86), dur: 0.06, hold: 0.03, vol: 0.048, lowpass: 5000 });
    tone({ at: 0.06, wave: 0.5, freq: midi(93), dur: 0.25, hold: 0.06, vol: 0.048, lowpass: 5000, wet: 0.2 });
  });

  const back = whenAudible(() => {
    tone({ wave: 0.25, freq: midi(93), dur: 0.06, hold: 0.03, vol: 0.067, lowpass: 5000 });
    tone({ at: 0.06, wave: 0.25, freq: midi(86), dur: 0.2, hold: 0.04, vol: 0.067, lowpass: 5000, wet: 0.2 });
  });

  const powerOff = whenAudible(() => {
    tone({ wave: 0.5, freq: 900, sweep: [[1, 70]], dur: 0.32, hold: 0.05, vol: 0.06, lowpass: 2500 });
    hiss({ type: 'highpass', freq: 4000, dur: 0.05, vol: 0.1, attack: 0.001 });
  });

  // ------------------------------------------------------------- açma, kapatma
  function flushGreeting() {
    if (!greeting || !canPlay()) return;
    if (voiceUrl && !clips.hello?.length) return;
    greeting = false;
    startupJingle();
    speak('hello', { at: 0.6 });
  }

  function unlock() {
    if (!on) return;
    if (!ctx) {
      try {
        ctx = new AudioContext({ latencyHint: 'interactive' });
        buildGraph();
        decodeVoices();
      } catch (error) {
        console.warn('BMO sesi başlatılamadı', error);
        ctx = null;
        return;
      }
    }
    if (ctx.state !== 'running') {
      resumedAt = performance.now();
      ctx.resume().then(flushGreeting).catch(() => {});
    } else {
      flushGreeting();
    }
  }

  const unlockEvents = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
  unlockEvents.forEach((type) => window.addEventListener(type, unlock, true));

  // Dosyalar küçük, baştan inerse ilk tıklamadaki konuşma da yetişir
  if (on) downloadVoices();

  // Bu projeye özel ek (orijinalde defter yok): defterin sesleri.
  //
  // Kâğıt düz bir hışırtı değil: lifler ayrılırken yüzlerce minik çıtırtı
  // çıkıyor. Sürekli süzülmüş gürültü bu yüzden kum gibi duyuluyordu.
  // Burada ses tane tane üretiliyor — her tane birkaç milisaniyelik, dar
  // bantlı, rastgele perdeden bir çıtırtı. Çevirme hızlandıkça taneler
  // sıklaşıyor, ses de doğal olarak gürleşiyor.
  let sonTane = 0;

  function tane(at, oran, yogunluk) {
    hiss({
      at,
      freq: 1600 + Math.random() * 4200 + Math.sin(Math.PI * oran) * 1100,
      q: 3 + Math.random() * 5,
      dur: 0.004 + Math.random() * 0.009,
      vol: 0.012 + yogunluk * 0.022,
      attack: 0.0008,
      pan: (Math.random() - 0.5) * 0.5,
      wet: 0.05,
    });
  }

  /**
   * hiz: sayfanın saniyedeki dönüş oranı (0–1 arası yolun kaçta kaçı).
   * oran: sayfanın ne kadar döndüğü (0 kapalı, 1 tam dönmüş).
   */
  const sayfaAkisi = whenAudible((hiz, oran) => {
    const yogunluk = Math.min(1, hiz * 1.4);
    if (yogunluk < 0.05) return;

    const now = ctx.currentTime;
    const aralik = 0.014 + (1 - yogunluk) * 0.055;
    let t = Math.max(now + 0.005, sonTane);
    let adet = 0;
    // Bir sonraki kaydırma olayına kadar yetecek kadar tane planlanıyor
    while (t < now + 0.1 && adet < 8) {
      tane(t - now, oran, yogunluk);
      t += aralik * (0.55 + Math.random() * 0.9);
      adet += 1;
    }
    sonTane = t;
  });

  function sayfaSustur() {
    sonTane = 0;
  }

  /**
   * Sayfa karşı yaprağın üstüne düştüğünde. Çıtırtı dönerken, tok ses
   * inerken: kâğıdın desteye değdiği an. Kapak ağır olduğu için daha pes
   * ve uzun, sayfa hafif olduğu için tiz ve kısa.
   */
  const sayfaKondu = whenAudible((agir = false) => {
    for (let i = 0; i < (agir ? 5 : 3); i += 1) {
      tane(i * 0.012 * Math.random(), 0.5, agir ? 0.5 : 0.3);
    }
    tone({
      at: 0.012,
      wave: 'sine',
      freq: agir ? 140 : 205,
      sweep: [[1, agir ? 68 : 105]],
      dur: agir ? 0.12 : 0.075,
      vol: agir ? 0.05 : 0.032,
      attack: 0.002,
      wet: 0.06,
    });
  });

  return {
    isOn: () => on,
    sayfaAkisi,
    sayfaSustur,
    sayfaKondu,
    setOn(value) {
      on = value;
      try {
        localStorage.setItem(storageKey, value ? 'on' : 'off');
      } catch {
        // Tercih kaydedilemezse yalnızca bu oturumda geçerli olur
      }
      if (master) master.gain.setTargetAtTime(value ? MASTER_LEVEL : 0, ctx.currentTime, 0.02);
      if (value) {
        unlock();
        flushGreeting();
      }
    },
    // Açılış melodisi ve selamlama. Ses henüz açılmadıysa ilk tıklamayı bekler.
    greet() {
      greeting = true;
      flushGreeting();
    },
    speak,
    voiceLeft,
    talkLevel,
    press,
    release,
    cartHover,
    cartPick,
    cartFly,
    cartSeat,
    cartEject,
    boot,
    typeLetter,
    bootDone,
    zoomIn,
    zoomOut,
    arrive,
    confirm,
    back,
    powerOff,
    dispose() {
      unlockEvents.forEach((type) => window.removeEventListener(type, unlock, true));
      ctx?.close().catch(() => {});
      ctx = null;
      speaking = null;
    },
  };
}
