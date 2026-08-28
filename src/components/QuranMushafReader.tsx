import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  Bookmark,
  Check,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  Award,
  BookMarked,
  Info,
} from 'lucide-react';
import { QURAN_SURAHS, SurahMeta } from '../data/quranSurahsData';

export const QuranMushafReader: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<number | 'all'>('all');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta>(QURAN_SURAHS[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [bookmarkedSurahs, setBookmarkedSurahs] = useState<number[]>([1, 36, 67, 112]);

  // Filter surahs
  const filteredSurahs = QURAN_SURAHS.filter((s) => {
    const matchesSearch =
      s.nameArabic.includes(searchTerm) ||
      s.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nameSomali.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.number.toString() === searchTerm.trim();

    const matchesJuz = selectedJuz === 'all' || s.juz === selectedJuz;

    return matchesSearch && matchesJuz;
  });

  const toggleBookmark = (surahNum: number) => {
    if (bookmarkedSurahs.includes(surahNum)) {
      setBookmarkedSurahs(bookmarkedSurahs.filter((id) => id !== surahNum));
    } else {
      setBookmarkedSurahs([...bookmarkedSurahs, surahNum]);
    }
  };

  const handlePlayAudio = (surahNumber: number) => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    // High quality recitation audio from Mishary Rashid Alafasy
    const formattedSurahNum = String(surahNumber).padStart(3, '0');
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahNumber}.mp3`;
    
    const newAudio = new Audio(audioUrl);
    newAudio.play().then(() => {
      setIsPlayingAudio(true);
    }).catch((err) => {
      console.log('Audio playback fallback:', err);
    });

    newAudio.onended = () => {
      setIsPlayingAudio(false);
    };

    setAudioElement(newAudio);
  };

  const handleStopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setIsPlayingAudio(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl border border-amber-400/30 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-[#d4af37] text-slate-950 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mus'haf-ka Rasmiga Ah • 114 Suraaduh</span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>📖 Qur'aanka Kariimka Ah (Full Mus'haf Reader & Audio)</span>
            </h2>
            <p className="text-xs text-amber-100 font-medium">
              Eeg 114-ka Suraadood ee Qur'aanka, Dhagayso Recitation-ka Mishari Alafasy, Akhriso Micnaha iyo Tafsiirka Af-Somali.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlayAudio(selectedSurah.number)}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                isPlayingAudio
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-[#0e7a48] hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Jooji Suraadaha ({selectedSurah.nameEnglish})</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-[#d4af37]" />
                  <span>Dhagayso Surah {selectedSurah.nameEnglish}</span>
                </>
              )}
            </button>

            {/* Dedicated Stop Button */}
            <button
              onClick={handleStopAudio}
              disabled={!isPlayingAudio}
              className={`px-3.5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isPlayingAudio
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-white/10 text-slate-400 border border-white/20'
              }`}
              title="Istaaji Dhagaysiga Audio-ga (Stop Audio)"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Istaaji</span>
            </button>
          </div>
        </div>

        {/* Search & Juz Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Raadi Suraad (tusaale: Yasin, Al-Baqarah, 36, Camma...)"
              className="w-full pl-9 pr-4 py-2.5 bg-emerald-950/60 border border-emerald-700/50 rounded-2xl text-xs font-bold text-white placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Juz Dropdown */}
          <div className="relative">
            <Layers className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
            <select
              value={selectedJuz}
              onChange={(e) => setSelectedJuz(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full pl-9 pr-4 py-2.5 bg-emerald-950/60 border border-emerald-700/50 rounded-2xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Dhamaan 30-ka Juz</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j} className="bg-slate-900">
                  Juz {j} (Juz-ka {j}-aad)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Surah List (Left) & Reading View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Surah Selection List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 max-h-[650px] overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 border-b border-slate-100 pb-2">
            <span>Suraadaha ({filteredSurahs.length})</span>
            <span>Juz & Verses</span>
          </div>

          <div className="space-y-1.5">
            {filteredSurahs.map((surah) => {
              const isSelected = selectedSurah.number === surah.number;
              const isBookmarked = bookmarkedSurahs.includes(surah.number);

              return (
                <div
                  key={surah.number}
                  onClick={() => setSelectedSurah(surah)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-800 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl font-mono text-xs font-extrabold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#d4af37] text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {surah.number}
                    </div>

                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{surah.nameEnglish}</span>
                        {isBookmarked && <span className="text-amber-400 text-[10px]">★</span>}
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                        {surah.nameSomali}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-serif text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-800'}`}>
                      {surah.nameArabic}
                    </div>
                    <div className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {surah.versesCount} Aayadood
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Surah Reading & View (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Surah Header Card */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 rounded-2xl text-white text-center space-y-2 relative overflow-hidden border border-amber-400/30">
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(selectedSurah.number)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Calaamadayso Surah-ni"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarkedSurahs.includes(selectedSurah.number)
                        ? 'fill-amber-400 text-amber-400'
                        : ''
                    }`}
                  />
                </button>
              </div>

              <div className="text-3xl font-serif font-black text-amber-300 pt-1">
                سُورَةُ {selectedSurah.nameArabic}
              </div>

              <h3 className="text-lg font-extrabold text-white">
                {selectedSurah.nameEnglish} ({selectedSurah.nameSomali})
              </h3>

              <div className="flex items-center justify-center gap-4 text-xs text-amber-100 font-semibold pt-1">
                <span className="bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50">
                  {selectedSurah.revelationType === 'Makki' ? '🏛️ Makkiyah' : '🕌 Madaniyah'}
                </span>
                <span>•</span>
                <span>{selectedSurah.versesCount} Aayadoo</span>
                <span>•</span>
                <span className="bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50">
                  Juz {selectedSurah.juz}
                </span>
              </div>
            </div>

            {/* Bismillah Banner */}
            {selectedSurah.number !== 9 && selectedSurah.number !== 1 && (
              <div className="text-center py-4 text-2xl font-serif font-bold text-emerald-900 bg-slate-50 rounded-2xl border border-slate-200">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}

            {/* Sample Verses Showcase Reader */}
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>📖 Aayadda 1 - {selectedSurah.nameEnglish}</span>
                  <button
                    onClick={() => handlePlayAudio(selectedSurah.number)}
                    className="flex items-center gap-1 text-[#0e7a48] hover:underline cursor-pointer font-extrabold"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Dhagayso Audio-ga</span>
                  </button>
                </div>

                {/* Sample Arabic Text */}
                <div className="text-right text-2xl font-serif leading-loose text-slate-900 p-3 bg-white rounded-xl border border-slate-200 dir-rtl font-extrabold">
                  {selectedSurah.number === 1 && 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'}
                  {selectedSurah.number === 2 && 'الم ۝ ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ ۝ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلاةَ وَمِمَّا رَزَقْنَاهُمْ يُنِقُونَ'}
                  {selectedSurah.number === 36 && 'يس ۝ وَالْقُرْآنِ الْحَكِيمِ ۝ إِنَّكَ لَمِنَ الْمُرْسَلِينَ ۝ عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ ۝ تَنزِيلَ الْعَزِيزِ الرَّحِيمِ'}
                  {selectedSurah.number === 67 && 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ۝ الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا'}
                  {selectedSurah.number === 112 && 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'}
                  {![1, 2, 36, 67, 112].includes(selectedSurah.number) && (
                    `سُورَةُ ${selectedSurah.nameArabic} - Aayadaha Qur'aanka Kareemka ah halkaan ka akhriso.`
                  )}
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0e7a48]">Micnaha iyo Tafsiirka Af-Somali:</div>
                  <p className="italic text-slate-600">
                    "{selectedSurah.meaningSomali} - Waa Surad ka mid ah 114-ka Suraadood ee Qur'aanka Kareemka ah."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Surah Navigation Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
            <button
              disabled={selectedSurah.number <= 1}
              onClick={() => {
                const prev = QURAN_SURAHS.find((s) => s.number === selectedSurah.number - 1);
                if (prev) setSelectedSurah(prev);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Surah-dii Hore</span>
            </button>

            <span className="text-[#0e7a48] font-extrabold">
              Surah {selectedSurah.number} / 114
            </span>

            <button
              disabled={selectedSurah.number >= 114}
              onClick={() => {
                const next = QURAN_SURAHS.find((s) => s.number === selectedSurah.number + 1);
                if (next) setSelectedSurah(next);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
            >
              <span>Surah-da Xigta</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
