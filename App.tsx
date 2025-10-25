
import React, { useState, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { createWavBlob, decodeBase64 } from './utils/audioUtils';
import { VOICE_OPTIONS } from './constants';
import type { VoiceOption } from './types';

const MAX_CHUNK_LENGTH = 2000;

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSpeech = useCallback(async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      // 1. Chunk the text
      const chunks: string[] = [];
      let remainingText = text.trim();
      while (remainingText.length > 0) {
        if (remainingText.length <= MAX_CHUNK_LENGTH) {
          chunks.push(remainingText);
          break;
        }
        let chunkEnd = remainingText.lastIndexOf(' ', MAX_CHUNK_LENGTH);
        if (chunkEnd === -1) {
          chunkEnd = MAX_CHUNK_LENGTH;
        }
        chunks.push(remainingText.substring(0, chunkEnd));
        remainingText = remainingText.substring(chunkEnd).trim();
      }

      // 2. Process each chunk
      const audioChunks: Uint8Array[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setLoadingMessage(`در حال تولید قطعه ${i + 1} از ${chunks.length}...`);
        const base64Audio = await generateSpeech(chunks[i], selectedVoice);
        audioChunks.push(decodeBase64(base64Audio));
      }

      // 3. Combine audio chunks into a single WAV blob
      const audioBlob = createWavBlob(audioChunks);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

    } catch (err) {
      console.error('Error generating speech:', err);
      setError('خطایی در تولید صدا رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [text, selectedVoice, isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            تبدیل متن به گفتار
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            متن خود را وارد کنید، صدایی را انتخاب کنید و به Gemini اجازه دهید آن را زنده کند.
          </p>
        </header>

        <div className="flex flex-col gap-6 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="متن خود را اینجا وارد کنید..."
            className="w-full h-80 min-h-[300px] p-4 bg-gray-900 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-y"
            disabled={isLoading}
          />

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full sm:w-1/2 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isLoading}
            >
              {VOICE_OPTIONS.map((voice: VoiceOption) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateSpeech}
              disabled={isLoading || !text.trim()}
              className="w-full sm:w-1/2 p-3 text-lg font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? loadingMessage : 'تبدیل به گفتار'}
            </button>
          </div>
        </div>

        {error && <div className="p-4 text-center bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

        {audioUrl && (
          <div className="flex flex-col gap-4 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg">
            <audio controls src={audioUrl} className="w-full">
              Your browser does not support the audio element.
            </audio>
            <a
              href={audioUrl}
              download="gemini-speech.wav"
              className="text-center w-full p-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-300"
            >
              دانلود فایل صوتی
            </a>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-500">
        <p>ساخته شده با React, Tailwind CSS و Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
   