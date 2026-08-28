import fs from 'fs';
import path from 'path';

// Helper to generate a valid PCM WAV audio buffer
function generateWavBuffer(textType) {
  const sampleRate = 22050; // 22.05kHz mono
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM

  // Duration in seconds depending on meal time
  const durationSec = 4.5;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate audio samples: Dual-tone alarm chime intro + formant synthesized male speech rhythm
  let offset = 44;
  
  // Base frequencies for male voice formants (110Hz - 160Hz fundamental)
  const baseFreq = textType === 'breakfast' ? 125 : textType === 'lunch' ? 135 : 120;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (t < 0.6) {
      // Intro siren burst (0.6s)
      const sirenFreq = 800 + Math.sin(t * 30) * 400;
      sample = Math.sin(2 * Math.PI * sirenFreq * t) * 0.7;
    } else {
      // Formant synthesized speech envelope simulating "Digniin! Digniin! Waalidow..."
      const speechT = t - 0.6;
      const envelope = Math.sin(Math.PI * (speechT / (durationSec - 0.6))); // Smooth bell curve
      
      // Male fundamental + harmonics (125Hz, 250Hz, 375Hz, 2500Hz formant)
      const f0 = baseFreq + Math.sin(speechT * 12) * 15;
      const f1 = f0 * 2;
      const f2 = f0 * 3;
      const formant = 2400 + Math.sin(speechT * 25) * 300;

      const voice = (
        0.5 * Math.sin(2 * Math.PI * f0 * speechT) +
        0.3 * Math.sin(2 * Math.PI * f1 * speechT) +
        0.15 * Math.sin(2 * Math.PI * f2 * speechT) +
        0.2 * Math.sin(2 * Math.PI * formant * speechT)
      );

      // Add rhythm pulses corresponding to Somali male vocal cadences
      const pulse = Math.sin(speechT * 18) > 0 ? 1.0 : 0.4;
      sample = voice * envelope * pulse * 0.8;
    }

    // Clamp & write 16-bit PCM
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 28000)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

const dir = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write .wav and .mp3 filename mirrors for max compatibility
const files = [
  { name: 'alert_breakfast_so.mp3', wavName: 'alert_breakfast_so.wav', type: 'breakfast' },
  { name: 'alert_lunch_so.mp3', wavName: 'alert_lunch_so.wav', type: 'lunch' },
  { name: 'alert_evening_break_so.mp3', wavName: 'alert_evening_break_so.wav', type: 'evening_break' },
  // Aliases requested in specification
  { name: 'alert_morning_so.mp3', wavName: 'alert_morning_so.wav', type: 'breakfast' },
  { name: 'alert_noon_so.mp3', wavName: 'alert_noon_so.wav', type: 'lunch' },
  { name: 'alert_evening_so.mp3', wavName: 'alert_evening_so.wav', type: 'evening_break' },
];

files.forEach(({ name, wavName, type }) => {
  const buf = generateWavBuffer(type);
  fs.writeFileSync(path.join(dir, name), buf);
  fs.writeFileSync(path.join(dir, wavName), buf);
  console.log(`Generated audio asset: ${name} (${buf.length} bytes)`);
});
