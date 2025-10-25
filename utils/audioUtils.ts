
/**
 * Decodes a Base64 string into a Uint8Array.
 * @param base64 The Base64 encoded string.
 * @returns A Uint8Array containing the decoded binary data.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a WAV file Blob from an array of raw PCM audio chunks.
 * The Gemini TTS API returns raw PCM data at 24000 Hz sample rate.
 * @param audioChunks An array of Uint8Arrays, each representing a chunk of raw PCM audio.
 * @returns A Blob representing a complete WAV audio file.
 */
export function createWavBlob(audioChunks: Uint8Array[]): Blob {
  // Concatenate all audio chunks into a single Uint8Array
  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const pcmData = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of audioChunks) {
    pcmData.set(chunk, offset);
    offset += chunk.length;
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const fileSize = 44 + dataSize; // 44 bytes for the header

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true); // file-size - 8
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);

  return new Blob([wavBytes], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
   