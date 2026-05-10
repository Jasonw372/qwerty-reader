let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

// Cache decoded AudioBuffers
const bufferCache = new Map<string, AudioBuffer>();

async function loadBuffer(url: string): Promise<AudioBuffer> {
  const cached = bufferCache.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = await getCtx().decodeAudioData(arrayBuffer);
  bufferCache.set(url, audioBuffer);
  return audioBuffer;
}

function playBuffer(buffer: AudioBuffer, gain = 1.0): void {
  const ac = getCtx();
  const source = ac.createBufferSource();
  const gainNode = ac.createGain();
  source.buffer = buffer;
  gainNode.gain.value = gain;
  source.connect(gainNode);
  gainNode.connect(ac.destination);
  source.start();
}

// Preload all samples on first interaction
const KEYDOWN_VARIANTS = [
  "/sounds/GENERIC_R0.mp3",
  "/sounds/GENERIC_R1.mp3",
  "/sounds/GENERIC_R2.mp3",
  "/sounds/GENERIC_R3.mp3",
  "/sounds/GENERIC_R4.mp3",
];
const SPACE_SOUND = "/sounds/SPACE.mp3";
const KEYUP_SOUND = "/sounds/release/GENERIC.mp3";

let preloaded = false;

async function preload(): Promise<void> {
  if (preloaded) return;
  preloaded = true;
  await Promise.all([...KEYDOWN_VARIANTS, SPACE_SOUND, KEYUP_SOUND].map((url) => loadBuffer(url)));
}

export function playCorrect(isSpace = false): void {
  const url = isSpace
    ? SPACE_SOUND
    : KEYDOWN_VARIANTS[Math.floor(Math.random() * KEYDOWN_VARIANTS.length)];
  loadBuffer(url)
    .then((buf) => playBuffer(buf, 0.35))
    .catch(() => undefined);
}

export function playIncorrect(): void {
  // Same sample, lower pitch via playbackRate for a "wrong" feel
  const url = KEYDOWN_VARIANTS[Math.floor(Math.random() * KEYDOWN_VARIANTS.length)];
  loadBuffer(url)
    .then((buf) => {
      const ac = getCtx();
      const source = ac.createBufferSource();
      const gainNode = ac.createGain();
      source.buffer = buf;
      source.playbackRate.value = 0.75; // lower pitch = heavier thud
      gainNode.gain.value = 0.45;
      source.connect(gainNode);
      gainNode.connect(ac.destination);
      source.start();
    })
    .catch(() => undefined);
}

export function playKeyup(): void {
  loadBuffer(KEYUP_SOUND)
    .then((buf) => playBuffer(buf, 0.25))
    .catch(() => undefined);
}

export function resumeAudio(): void {
  if (ctx?.state === "suspended") {
    void ctx.resume();
  }
  void preload();
}
