import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Printer,
  Award,
  GraduationCap,
  Bookmark,
  Play,
  Square,
  Search,
  Book,
  HelpCircle,
} from 'lucide-react';

export interface LessonItem {
  id: string;
  chapterNumber: number;
  titleArabic: string;
  titleSomali: string;
  category: string;
  descriptionArabic: string;
  descriptionSomali: string;
  lettersOrWords: {
    textArabic: string;
    phoneticSomali: string;
    meaning?: string;
  }[];
}

export const MIFTAAH_BOOK_CHAPTERS: LessonItem[] = [
  {
    id: 'chapter-1',
    chapterNumber: 1,
    titleArabic: 'الفصل الأول: الحروف الهجائية العربية',
    titleSomali: 'Fasalka 1-aad: Xarfaha Carabiga (29 Xaraf & Dhawaaqa)',
    category: 'Mabadi’da Huruufka',
    descriptionArabic:
      'يَتَعَلَّقُ بِالتَّعَرُّفِ عَلَى حُرُوفِ الْهِجَاءِ الْعَرَبِيَّةِ، وَيَهْدِفُ إِلَى تَمْكِينِ الطَّالِبِ مِنْ مَعْرِفَةِ أَسْمَاءِ الْحُرُوفِ وَتَرْتِيبِهَا قَبْلَ الاِنْتِقَالِ إِلَى الْحَرَكَاتِ وَالتَّهَجِّي.',
    descriptionSomali:
      'Waxaa loogu talagalay in ardaygu si sax ah u barto magacyada iyo kala dambaynta 29-ka xaraf ee carabiga ka hor inta uusan u gudbin xarakadka iyo tahajida.',
    lettersOrWords: [
      { textArabic: 'أ', phoneticSomali: 'Alif' },
      { textArabic: 'ب', phoneticSomali: 'Baa' },
      { textArabic: 'ت', phoneticSomali: 'Taa' },
      { textArabic: 'ث', phoneticSomali: 'Thaa' },
      { textArabic: 'ج', phoneticSomali: 'Jiim' },
      { textArabic: 'ح', phoneticSomali: 'Xaa' },
      { textArabic: 'خ', phoneticSomali: 'Khaa' },
      { textArabic: 'د', phoneticSomali: 'Daal' },
      { textArabic: 'ذ', phoneticSomali: 'Dhaal' },
      { textArabic: 'ر', phoneticSomali: 'Raa' },
      { textArabic: 'ز', phoneticSomali: 'Zaay' },
      { textArabic: 'س', phoneticSomali: 'Siin' },
      { textArabic: 'ش', phoneticSomali: 'Shiin' },
      { textArabic: 'ص', phoneticSomali: 'Saad' },
      { textArabic: 'ض', phoneticSomali: 'Daad' },
      { textArabic: 'ط', phoneticSomali: 'Taa (Buuran)' },
      { textArabic: 'ظ', phoneticSomali: 'Dhaa (Buuran)' },
      { textArabic: 'ع', phoneticSomali: 'Cayn' },
      { textArabic: 'غ', phoneticSomali: 'Ghayn' },
      { textArabic: 'ف', phoneticSomali: 'Faa' },
      { textArabic: 'ق', phoneticSomali: 'Qaaf' },
      { textArabic: 'ك', phoneticSomali: 'Kaaf' },
      { textArabic: 'ل', phoneticSomali: 'Laam' },
      { textArabic: 'م', phoneticSomali: 'Miim' },
      { textArabic: 'ن', phoneticSomali: 'Nuun' },
      { textArabic: 'و', phoneticSomali: 'Waaw' },
      { textArabic: 'هـ', phoneticSomali: 'Haa' },
      { textArabic: 'لـأ', phoneticSomali: 'Laam-Alif' },
      { textArabic: 'ء', phoneticSomali: 'Hamzah' },
      { textArabic: 'ي', phoneticSomali: 'Yaa' },
    ],
  },
  {
    id: 'chapter-2',
    chapterNumber: 2,
    titleArabic: 'الفصل الثاني: الحركات الثلاث (الفتحة والكسرة والضمة)',
    titleSomali: 'Fasalka 2-aad: Xarakadka Sadexda ah (Fatha, Kasra, Damma)',
    category: 'Xarakadka',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى الْحَرَكَاتِ الثَّلاَثِ: الْفَتْحَةِ، وَالْكَسْرَةِ، وَالضَّمَّةِ، وَيَهْدِفُ إِلَى إِتْقَانِ نُطْقِ الْحُرُوفِ مَعَ الْحَرَكَاتِ الأَسَاسِيَّةِ.',
    descriptionSomali:
      'Lagu tababarayo dhawaaqa xarfaha marka ay wataan Fatha (َ), Kasra (ِ), iyo Damma (ُ).',
    lettersOrWords: [
      { textArabic: 'أَ إِ أُ', phoneticSomali: 'A - I - U' },
      { textArabic: 'بَ بِ بُ', phoneticSomali: 'Ba - Bi - Bu' },
      { textArabic: 'تَ تِ تُ', phoneticSomali: 'Ta - Ti - Tu' },
      { textArabic: 'ثَ ثِ ثُ', phoneticSomali: 'Tha - Thi - Thu' },
      { textArabic: 'جَ جِ جُ', phoneticSomali: 'Ja - Ji - Ju' },
      { textArabic: 'حَ حِ حُ', phoneticSomali: 'Xa - Xi - Xu' },
      { textArabic: 'خَ خِ خُ', phoneticSomali: 'Kha - Khi - Khu' },
      { textArabic: 'دَ دِ دُ', phoneticSomali: 'Da - Di - Du' },
      { textArabic: 'ذَ ذِ ذُ', phoneticSomali: 'Dha - Dhi - Dhu' },
      { textArabic: 'رَ رِ رُ', phoneticSomali: 'Ra - Ri - Ru' },
      { textArabic: 'زَ زِ زُ', phoneticSomali: 'Za - Zi - Zu' },
      { textArabic: 'سَ سِ سُ', phoneticSomali: 'Sa - Si - Su' },
      { textArabic: 'شَ شِ شُ', phoneticSomali: 'Sha - Shi - Shu' },
      { textArabic: 'صَ صِ صُ', phoneticSomali: 'Sa - Si - Su' },
      { textArabic: 'ضَ ضِ ضُ', phoneticSomali: 'Da - Di - Du' },
      { textArabic: 'طَ طِ طُ', phoneticSomali: 'Ta - Ti - Tu' },
      { textArabic: 'ظَ ظِ ظُ', phoneticSomali: 'Dha - Dhi - Dhu' },
      { textArabic: 'عَ عِ عُ', phoneticSomali: 'Ca - Ci - Cu' },
      { textArabic: 'غَ غِ غُ', phoneticSomali: 'Gha - Ghi - Ghu' },
      { textArabic: 'فَ فِ فُ', phoneticSomali: 'Fa - Fi - Fu' },
      { textArabic: 'قَ قِ قُ', phoneticSomali: 'Qa - Qi - Qu' },
      { textArabic: 'كَ كِ كُ', phoneticSomali: 'Ka - Ki - Ku' },
      { textArabic: 'لَ لِ لُ', phoneticSomali: 'La - Li - Lu' },
      { textArabic: 'مَ مِ مُ', phoneticSomali: 'Ma - Mi - Mu' },
      { textArabic: 'نَ نِ نُ', phoneticSomali: 'Na - Ni - Nu' },
      { textArabic: 'وَ وِ وُ', phoneticSomali: 'Wa - Wi - Wu' },
      { textArabic: 'هـَ هـِ هـُ', phoneticSomali: 'Ha - Hi - Hu' },
      { textArabic: 'يَ يِ يُ', phoneticSomali: 'Ya - Yi - Yu' },
    ],
  },
  {
    id: 'chapter-3',
    chapterNumber: 3,
    titleArabic: 'الفصل الثالث: التنوين (تنوين الفتح، والكسر، والضم)',
    titleSomali: 'Fasalka 3-aad: Tanwiinka (Fathataan, Kasrataan, Dammataan)',
    category: 'Tanwiinka',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى التَّنْوِينِ، وَيَهْدِفُ إِلَى إِتْقَانِ نُطْقِ الْحُرُوفِ الْمُنَوَّنَةِ بِأَنْوَاعِهِ الثَّلاَثَةِ: تَنْوِينِ الْفَتْحِ، وَتَنْوِينِ الْكَسْرِ، وَتَنْوِينِ الضَّمِّ.',
    descriptionSomali:
      'Dhawaaqa Tanwiinka sadexda ah: Tanwiin Fath (ً), Tanwiin Kasr (ٍ), iyo Tanwiin Damm (ٌ).',
    lettersOrWords: [
      { textArabic: 'أً أٍ أٌ', phoneticSomali: 'An - In - Un' },
      { textArabic: 'بً بٍ بٌ', phoneticSomali: 'Ban - Bin - Bun' },
      { textArabic: 'تً تٍ تٌ', phoneticSomali: 'Tan - Tin - Tun' },
      { textArabic: 'ثً ثٍ ثٌ', phoneticSomali: 'Than - Thin - Thun' },
      { textArabic: 'جً جٍ جٌ', phoneticSomali: 'Jan - Jin - Jun' },
      { textArabic: 'حً حٍ حٌ', phoneticSomali: 'Xan - Xin - Xun' },
      { textArabic: 'خً خٍ خٌ', phoneticSomali: 'Khan - Khin - Khun' },
      { textArabic: 'دً دٍ دٌ', phoneticSomali: 'Dan - Din - Dun' },
      { textArabic: 'ذً ذٍ ذٌ', phoneticSomali: 'Dhan - Dhin - Dhun' },
      { textArabic: 'رً رٍ رٌ', phoneticSomali: 'Ran - Rin - Run' },
      { textArabic: 'زً زٍ زٌ', phoneticSomali: 'Zan - Zin - Zun' },
      { textArabic: 'سً سٍ سٌ', phoneticSomali: 'San - Sin - Sun' },
      { textArabic: 'شً شٍ شٌ', phoneticSomali: 'Shan - Shin - Shun' },
      { textArabic: 'صً صٍ صٌ', phoneticSomali: 'San - Sin - Sun' },
      { textArabic: 'ضً ضٍ ضٌ', phoneticSomali: 'Dan - Din - Dun' },
      { textArabic: 'طً طٍ طٌ', phoneticSomali: 'Tan - Tin - Tun' },
      { textArabic: 'ظً ظٍ ظٌ', phoneticSomali: 'Dhan - Dhin - Dhun' },
      { textArabic: 'عً عٍ عٌ', phoneticSomali: 'Can - Cin - Cun' },
      { textArabic: 'غً غٍ غٌ', phoneticSomali: 'Ghan - Ghin - Ghun' },
      { textArabic: 'فً فٍ فٌ', phoneticSomali: 'Fan - Fin - Fun' },
      { textArabic: 'قً قٍ قٌ', phoneticSomali: 'Qan - Qin - Qun' },
      { textArabic: 'كً كٍ كٌ', phoneticSomali: 'Kan - Kin - Kun' },
      { textArabic: 'لً لٍ لٌ', phoneticSomali: 'Lan - Lin - Lun' },
      { textArabic: 'مً مٍ مٌ', phoneticSomali: 'Man - Min - Mun' },
      { textArabic: 'نً نٍ نٌ', phoneticSomali: 'Nan - Nin - Nun' },
      { textArabic: 'وً وٍ وٌ', phoneticSomali: 'Wan - Win - Wun' },
      { textArabic: 'هـً هـٍ هـٌ', phoneticSomali: 'Han - Hin - Hun' },
      { textArabic: 'يً يٍ يٌ', phoneticSomali: 'Yan - Yin - Yun' },
    ],
  },
  {
    id: 'chapter-4',
    chapterNumber: 4,
    titleArabic: 'الفصل الرابع: السكون مع الحركات الثلاث',
    titleSomali: 'Fasalka 4-aad: Sukunta oo la socota Xarakadka Sadexda ah',
    category: 'Sukunta',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى السُّكُونِ، وَيَهْدِفُ إِلَى إِتْقَانِ نُطْقِ الْحُرُوفِ السَّاكِنَةِ مَعَ الْحَرَكَاتِ الثَّلاَثِ: الْفَتْحَةِ، وَالْكَسْرَةِ، وَالضَّمَّةِ.',
    descriptionSomali:
      'Tababarka xarafka Sukunta wata oo lagu xirayo xaraf ka horeeya oo wata Fatha, Kasra ama Damma.',
    lettersOrWords: [
      { textArabic: 'أَبْ إِبْ أُبْ', phoneticSomali: 'Ab - Ib - Ub' },
      { textArabic: 'أَتْ إِتْ أُتْ', phoneticSomali: 'At - It - Ut' },
      { textArabic: 'أَثْ إِثْ أُثْ', phoneticSomali: 'Ath - Ith - Uth' },
      { textArabic: 'أَجْ إِجْ أُجْ', phoneticSomali: 'Aj - Ij - Uj' },
      { textArabic: 'أَحْ إِحْ أُحْ', phoneticSomali: 'Ax - Ix - Ux' },
      { textArabic: 'أَخْ إِخْ أُخْ', phoneticSomali: 'Akh - Ikh - Ukh' },
      { textArabic: 'أَدْ إِدْ أُدْ', phoneticSomali: 'Ad - Id - Ud' },
      { textArabic: 'أَذْ إِذْ أُذْ', phoneticSomali: 'Adh - Idh - Udh' },
      { textArabic: 'أَرْ إِرْ أُرْ', phoneticSomali: 'Ar - Ir - Ur' },
      { textArabic: 'أَزْ إِزْ أُزْ', phoneticSomali: 'Az - Iz - Uz' },
      { textArabic: 'أَسْ إِسْ أُسْ', phoneticSomali: 'As - Is - Us' },
      { textArabic: 'أَشْ إِشْ أُشْ', phoneticSomali: 'Ash - Ish - Ush' },
      { textArabic: 'أَصْ إِصْ أُصْ', phoneticSomali: 'As - Is - Us' },
      { textArabic: 'أَضْ إِضْ أُضْ', phoneticSomali: 'Ad - Id - Ud' },
      { textArabic: 'أَطْ إِطْ أُطْ', phoneticSomali: 'At - It - Ut' },
      { textArabic: 'أَظْ إِظْ أُظْ', phoneticSomali: 'Adh - Idh - Udh' },
      { textArabic: 'أَعْ إِعْ أُعْ', phoneticSomali: 'Ac - Ic - Uc' },
      { textArabic: 'أَغْ إِغْ أُغْ', phoneticSomali: 'Agh - Igh - Ugh' },
      { textArabic: 'أَفْ إِفْ أُفْ', phoneticSomali: 'Af - If - Uf' },
      { textArabic: 'أَقْ إِقْ أُقْ', phoneticSomali: 'Aq - Iq - Uq' },
      { textArabic: 'أَكْ إِكْ أُكْ', phoneticSomali: 'Ak - Ik - Uk' },
      { textArabic: 'أَلْ إِلْ أُلْ', phoneticSomali: 'Al - Il - Ul' },
      { textArabic: 'أَمْ إِمْ أُمُ', phoneticSomali: 'Am - Im - Um' },
      { textArabic: 'أَنْ إِنْ أُنْ', phoneticSomali: 'An - In - Un' },
      { textArabic: 'أَهـْ إِهـْ أُهـْ', phoneticSomali: 'Ah - Ih - Uh' },
      { textArabic: 'أَوْ إِوْ أُؤْ', phoneticSomali: 'Aw - Iw - Uw' },
      { textArabic: 'أَيْ إِيْ أُيْ', phoneticSomali: 'Ay - Iy - Uy' },
    ],
  },
  {
    id: 'chapter-5',
    chapterNumber: 5,
    titleArabic: 'الفصل الخامس: السكون مع حرف اللام',
    titleSomali: 'Fasalka 5-aad: Sukunta oo la socota Xarafka Laamka (الْ)',
    category: 'Laamka & Sukunta',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى السُّكُونِ مَعَ حَرْفِ اللَّامِ، وَيَهْدِفُ إِلَى إِتْقَانِ نُطْقِ الْحُرُوفِ السَّاكِنَةِ وَرَبْطِهَا بِالْحَرَكَاتِ الثَّلاَثِ.',
    descriptionSomali:
      'U diyaarinta ardayga akhriska Laamka saakinka ah (الْ) iyo isku xirka dhawaaqyada.',
    lettersOrWords: [
      { textArabic: 'أَلْ إِلْ أُلْ', phoneticSomali: 'Al - Il - Ul' },
      { textArabic: 'بَلْ بِلْ بُلْ', phoneticSomali: 'Bal - Bil - Bul' },
      { textArabic: 'تَلْ تِلْ تُلْ', phoneticSomali: 'Tal - Til - Tul' },
      { textArabic: 'ثَلْ ثِلْ ثُلْ', phoneticSomali: 'Thal - Thil - Thul' },
      { textArabic: 'جَلْ جِلْ جُلْ', phoneticSomali: 'Jal - Jil - Jul' },
      { textArabic: 'حَلْ حِلْ حُلْ', phoneticSomali: 'Xal - Xil - Xul' },
      { textArabic: 'خَلْ خِلْ خُلْ', phoneticSomali: 'Khal - Khil - Khul' },
      { textArabic: 'دَلْ دِلْ دُلْ', phoneticSomali: 'Dal - Dil - Dul' },
      { textArabic: 'ذَلْ ذِلْ ذُلْ', phoneticSomali: 'Dhal - Dhil - Dhul' },
      { textArabic: 'رَلْ رِلْ رُلْ', phoneticSomali: 'Ral - Ril - Rul' },
      { textArabic: 'زَلْ زِلْ زُلْ', phoneticSomali: 'Zal - Zil - Zul' },
      { textArabic: 'سَلْ سِلْ سُلْ', phoneticSomali: 'Sal - Sil - Sul' },
      { textArabic: 'شَلْ شِلْ شُلْ', phoneticSomali: 'Shal - Shil - Shul' },
      { textArabic: 'صَلْ صِلْ صُلْ', phoneticSomali: 'Sal - Sil - Sul' },
      { textArabic: 'ضَلْ ضِلْ ضُلْ', phoneticSomali: 'Dal - Dil - Dul' },
      { textArabic: 'طَلْ طِلْ طُلْ', phoneticSomali: 'Tal - Til - Tul' },
      { textArabic: 'ظَلْ ظِلْ ظُلْ', phoneticSomali: 'Dhal - Dhil - Dhul' },
      { textArabic: 'عَلْ عِلْ عُلْ', phoneticSomali: 'Cal - Cil - Cul' },
      { textArabic: 'غَلْ غِلْ غُلْ', phoneticSomali: 'Ghal - Ghil - Ghul' },
      { textArabic: 'فَلْ فِلْ فُلْ', phoneticSomali: 'Fal - Fil - Ful' },
      { textArabic: 'قَلْ قِلْ قُلْ', phoneticSomali: 'Qal - Qil - Qul' },
      { textArabic: 'كَلْ كِلْ كُلْ', phoneticSomali: 'Kal - Kil - Kul' },
      { textArabic: 'لَلْ لِلْ لُلْ', phoneticSomali: 'Lal - Lil - Lul' },
      { textArabic: 'مَلْ مِلْ مُلْ', phoneticSomali: 'Mal - Mil - Mul' },
      { textArabic: 'نَلْ نِلْ نُلْ', phoneticSomali: 'Nal - Nil - Nul' },
      { textArabic: 'وَلْ وِلْ وُلْ', phoneticSomali: 'Wal - Wil - Wul' },
      { textArabic: 'هـَلْ هـِلْ هـُلْ', phoneticSomali: 'Hal - Hil - Hul' },
      { textArabic: 'يَلْ يِلْ يُلْ', phoneticSomali: 'Yal - Yil - Yul' },
    ],
  },
  {
    id: 'chapter-6',
    chapterNumber: 6,
    titleArabic: 'الفصل السادس: حرفا اللين (الواو والياء الساكنتان)',
    titleSomali: 'Fasalka 6-aad: Xarfaha Leenka (Waaw & Yaa)',
    category: 'Xarfaha Leenka',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى حَرْفَيِ اللِّينِ: الْوَاوِ وَالْيَاءِ، وَيَهْدِفُ إِلَى إِتْقَانِ نُطْقِ الْمَقَاطِعِ الَّتِي تَحْتَوِي عَلَى حَرْفَيِ اللِّينِ.',
    descriptionSomali:
      'Lagu baranayo xarfaha Leenka (Waaw iyo Yaa saakin ah oo ay ka horeeyso Fatha).',
    lettersOrWords: [
      { textArabic: 'أَوْ', phoneticSomali: 'Aw' },
      { textArabic: 'بَوْ', phoneticSomali: 'Baw' },
      { textArabic: 'تَوْ', phoneticSomali: 'Taw' },
      { textArabic: 'ثَوْ', phoneticSomali: 'Thaw' },
      { textArabic: 'جَوْ', phoneticSomali: 'Jaw' },
      { textArabic: 'حَوْ', phoneticSomali: 'Xaw' },
      { textArabic: 'خَوْ', phoneticSomali: 'Khaw' },
      { textArabic: 'دَوْ', phoneticSomali: 'Daw' },
      { textArabic: 'ذَوْ', phoneticSomali: 'Dhaw' },
      { textArabic: 'رَوْ', phoneticSomali: 'Raw' },
      { textArabic: 'زَوْ', phoneticSomali: 'Zaw' },
      { textArabic: 'سَوْ', phoneticSomali: 'Saw' },
      { textArabic: 'شَوْ', phoneticSomali: 'Shaw' },
      { textArabic: 'صَوْ', phoneticSomali: 'Saw' },
      { textArabic: 'ضَوْ', phoneticSomali: 'Daw' },
      { textArabic: 'طَوْ', phoneticSomali: 'Taw' },
      { textArabic: 'ظَوْ', phoneticSomali: 'Dhaw' },
      { textArabic: 'عَوْ', phoneticSomali: 'Caw' },
      { textArabic: 'غَوْ', phoneticSomali: 'Ghaw' },
      { textArabic: 'فَوْ', phoneticSomali: 'Faw' },
      { textArabic: 'قَوْ', phoneticSomali: 'Qaw' },
      { textArabic: 'كَوْ', phoneticSomali: 'Kaw' },
      { textArabic: 'لَوْ', phoneticSomali: 'Law' },
      { textArabic: 'مَوْ', phoneticSomali: 'Maw' },
      { textArabic: 'نَوْ', phoneticSomali: 'Naw' },
      { textArabic: 'وَوْ', phoneticSomali: 'Waw' },
      { textArabic: 'هـَوْ', phoneticSomali: 'Haw' },
      { textArabic: 'يَوْ', phoneticSomali: 'Yaw' },
    ],
  },
  {
    id: 'chapter-7',
    chapterNumber: 7,
    titleArabic: 'الفصل السابع: المد بالياء',
    titleSomali: 'Fasalka 7-aad: Maddka Yaa-da (المد بالياء)',
    category: 'Maddka',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى الْمَدِّ بِالْيَاءِ، وَيَهْدِفُ إِلَى تَقْوِيَةِ مَهَارَةِ الْقِرَاءَةِ وَإِتْقَانِ نُطْقِ الْمَقَاطِعِ الَّتِي تَحْتَوِي عَلَى الْيَاءِ.',
    descriptionSomali:
      'Sida loo dhawaaqo xarafka la jiidayo ee wata Yaa Madd (Kasra + Yaa saakin ah).',
    lettersOrWords: [
      { textArabic: 'أَيْ', phoneticSomali: 'Ay / Ii' },
      { textArabic: 'بَيْ', phoneticSomali: 'Baii' },
      { textArabic: 'تَيْ', phoneticSomali: 'Taii' },
      { textArabic: 'ثَيْ', phoneticSomali: 'Thaii' },
      { textArabic: 'جَيْ', phoneticSomali: 'Jaii' },
      { textArabic: 'حَيْ', phoneticSomali: 'Xaii' },
      { textArabic: 'خَيْ', phoneticSomali: 'Khaii' },
      { textArabic: 'دَيْ', phoneticSomali: 'Daii' },
      { textArabic: 'ذَيْ', phoneticSomali: 'Dhaii' },
      { textArabic: 'رَيْ', phoneticSomali: 'Raii' },
      { textArabic: 'زَيْ', phoneticSomali: 'Zaii' },
      { textArabic: 'سَيْ', phoneticSomali: 'Saii' },
      { textArabic: 'شَيْ', phoneticSomali: 'Shaii' },
      { textArabic: 'صَيْ', phoneticSomali: 'Saii' },
      { textArabic: 'ضَيْ', phoneticSomali: 'Daii' },
      { textArabic: 'طَيْ', phoneticSomali: 'Taii' },
      { textArabic: 'ظَيْ', phoneticSomali: 'Dhaii' },
      { textArabic: 'عَيْ', phoneticSomali: 'Caii' },
      { textArabic: 'غَيْ', phoneticSomali: 'Ghaii' },
      { textArabic: 'فَيْ', phoneticSomali: 'Faii' },
      { textArabic: 'قَيْ', phoneticSomali: 'Qaii' },
      { textArabic: 'كَيْ', phoneticSomali: 'Kaii' },
      { textArabic: 'لَيْ', phoneticSomali: 'Laii' },
      { textArabic: 'مَيْ', phoneticSomali: 'Maii' },
      { textArabic: 'نَيْ', phoneticSomali: 'Naii' },
      { textArabic: 'وََيْ', phoneticSomali: 'Waii' },
      { textArabic: 'هـَيْ', phoneticSomali: 'Haii' },
      { textArabic: 'يَيْ', phoneticSomali: 'Yaii' },
    ],
  },
  {
    id: 'chapter-8',
    chapterNumber: 8,
    titleArabic: 'الفصل الثامن: المد الطبيعي (الألف والواو والياء)',
    titleSomali: 'Fasalka 8-aad: Maddka Dabiiciga ah (Alif, Waaw, Yaa)',
    category: 'Maddka Dabiiciga ah',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى الْمَدِّ الطَّبِيعِيِّ، وَيَهْدِفُ إِلَى إِتْقَانِ قِرَاءَةِ حُرُوفِ الْمَدِّ: الأَلِفِ، وَالْوَاوِ، وَالْيَاءِ.',
    descriptionSomali:
      'Jiidida 3-da xaraf ee Maddka dabiiciga ah: Alif (ا), Yaa (ي), iyo Waaw (و).',
    lettersOrWords: [
      { textArabic: 'أَا إِي أُو', phoneticSomali: 'Aa - Ii - Uu' },
      { textArabic: 'بَا بِي بُو', phoneticSomali: 'Baa - Bii - Buu' },
      { textArabic: 'تَا تِي تُو', phoneticSomali: 'Taa - Tii - Tuu' },
      { textArabic: 'ثَا ثِي ثُو', phoneticSomali: 'Thaa - Thii - Thuu' },
      { textArabic: 'جَا جِي جُو', phoneticSomali: 'Jaa - Jii - Juu' },
      { textArabic: 'حَا حِي حُو', phoneticSomali: 'Xaa - Xii - Xuu' },
      { textArabic: 'خَا خِي خُو', phoneticSomali: 'Khaa - Khii - Khuu' },
      { textArabic: 'دَا دِي دُو', phoneticSomali: 'Daa - Dii - Duu' },
      { textArabic: 'ذَا ذِي ذُو', phoneticSomali: 'Dhaa - Dhii - Dhuu' },
      { textArabic: 'رَا رِي رُو', phoneticSomali: 'Raa - Rii - Ruu' },
      { textArabic: 'زَا زِي زُو', phoneticSomali: 'Zaa - Zii - Zuu' },
      { textArabic: 'سَا سِي سُو', phoneticSomali: 'Saa - Sii - Suu' },
      { textArabic: 'شَا شِي شُو', phoneticSomali: 'Shaa - Shii - Shuu' },
      { textArabic: 'صَا صِي صُو', phoneticSomali: 'Saa - Sii - Suu' },
      { textArabic: 'ضَا ضِي ضُو', phoneticSomali: 'Daa - Dii - Duu' },
      { textArabic: 'طَا طِي طُو', phoneticSomali: 'Taa - Tii - Tuu' },
      { textArabic: 'ظَا ظِي ظُو', phoneticSomali: 'Dhaa - Dhii - Dhuu' },
      { textArabic: 'عَا عِي عُو', phoneticSomali: 'Caa - Cii - Cuu' },
      { textArabic: 'غَا غِي غُو', phoneticSomali: 'Ghaa - Ghii - Ghuu' },
      { textArabic: 'فَا فِي فُو', phoneticSomali: 'Faa - Fii - Fuu' },
      { textArabic: 'قَا قِي قُو', phoneticSomali: 'Qaa - Qii - Quu' },
      { textArabic: 'كَا كِي كُو', phoneticSomali: 'Kaa - Kii - Kuu' },
      { textArabic: 'لَا لِي لُو', phoneticSomali: 'Laa - Lii - Luu' },
      { textArabic: 'مَا مِي مُو', phoneticSomali: 'Maa - Mii - Muu' },
      { textArabic: 'نَا نِي نُو', phoneticSomali: 'Naa - Nii - Nuu' },
      { textArabic: 'وَا وِي وُو', phoneticSomali: 'Waa - Wii - Wuu' },
      { textArabic: 'هـَا هـِي هـُو', phoneticSomali: 'Haa - Hii - Huu' },
      { textArabic: 'يَا يِي يُو', phoneticSomali: 'Yaa - Yii - Yuu' },
    ],
  },
  {
    id: 'chapter-9',
    chapterNumber: 9,
    titleArabic: 'الفصل التاسع: المد مع النون',
    titleSomali: 'Fasalka 9-aad: Maddka oo la socda Nuunka (أنّ إنّ أنٌ)',
    category: 'Maddka & Nuunka',
    descriptionArabic:
      'يَتَعَلَّقُ بِتَدْرِيبِ الطَّالِبِ عَلَى الْمَدِّ مَعَ النُّونِ، وَيَهْدِفُ إِلَى تَقْوِيَةِ مَهَارَةِ الْقِرَاءَةِ الصَّحِيحَةِ، وَإِتْقَانِ نُطْقِ الْمَقَاطِعِ الْمَمْدُودَةِ.',
    descriptionSomali:
      'Fasalka 9-aad ee lagu soo gaba-gabeeyo buugga: Maddka iyo Isku xirka Nuunka Tanwiinka leh.',
    lettersOrWords: [
      { textArabic: 'أَنَّ إِنَّ أُنَّ', phoneticSomali: 'Anna - Inna - Unna' },
      { textArabic: 'بَانَ بِينَ بُونَ', phoneticSomali: 'Baana - Biina - Buuna' },
      { textArabic: 'تَانَ تِينَ تُونَ', phoneticSomali: 'Taana - Tiina - Tuuna' },
      { textArabic: 'ثَانَ ثِينَ ثُونَ', phoneticSomali: 'Thaana - Thiina - Thuuna' },
      { textArabic: 'جَانَ جِينَ جُونَ', phoneticSomali: 'Jaana - Jiina - Juuna' },
      { textArabic: 'حَانَ حِينَ حُونَ', phoneticSomali: 'Xaana - Xiina - Xuuna' },
      { textArabic: 'خَانَ خِينَ خُونَ', phoneticSomali: 'Khaana - Khiina - Khuuna' },
      { textArabic: 'دَانَ دِينَ دُونَ', phoneticSomali: 'Daana - Diina - Duuna' },
      { textArabic: 'ذَانَ ذِينَ ذُونَ', phoneticSomali: 'Dhaana - Dhiina - Dhuuna' },
      { textArabic: 'رَانَ رِينَ رُونَ', phoneticSomali: 'Raana - Riina - Ruuna' },
      { textArabic: 'زَانَ زِينَ زُونَ', phoneticSomali: 'Zaana - Ziina - Zuuna' },
      { textArabic: 'سَانَ سِينَ سُونَ', phoneticSomali: 'Saana - Siina - Suuna' },
      { textArabic: 'شَانَ شِينَ شُونَ', phoneticSomali: 'Shaana - Shiina - Shuuna' },
      { textArabic: 'صَانَ صِينَ صُونَ', phoneticSomali: 'Saana - Siina - Suuna' },
      { textArabic: 'ضَانَ ضِينَ ضُونَ', phoneticSomali: 'Daana - Diina - Duuna' },
      { textArabic: 'طَانَ طِينَ طُونَ', phoneticSomali: 'Taana - Tiina - Tuuna' },
      { textArabic: 'ظَانَ ظِينَ ظُونَ', phoneticSomali: 'Dhaana - Dhiina - Dhuuna' },
      { textArabic: 'عَانَ عِينَ عُونَ', phoneticSomali: 'Caana - Ciina - Cuuna' },
      { textArabic: 'غَانَ غِينَ غُونَ', phoneticSomali: 'Ghaana - Ghiina - Ghuuna' },
      { textArabic: 'فَانَ فِينَ فُونَ', phoneticSomali: 'Faana - Fiina - Fuuna' },
      { textArabic: 'قَانَ قِينَ قُونَ', phoneticSomali: 'Qaana - Qiina - Quuna' },
      { textArabic: 'كَانَ كِينَ كُونَ', phoneticSomali: 'Kaana - Kiina - Kuuna' },
      { textArabic: 'لاَنَ لِينَ لُونَ', phoneticSomali: 'Laana - Liina - Luuna' },
      { textArabic: 'مَانَ مِينَ مُونَ', phoneticSomali: 'Maana - Miina - Muuna' },
      { textArabic: 'نَانَ نِينَ نُونَ', phoneticSomali: 'Naana - Niina - Nuuna' },
      { textArabic: 'وَانَ وِينَ وُونَ', phoneticSomali: 'Waana - Wiina - Wuuna' },
      { textArabic: 'هـَانَ هـِينَ هـُونَ', phoneticSomali: 'Haana - Hiina - Huuna' },
      { textArabic: 'يَانَ يِينَ يُونَ', phoneticSomali: 'Yaana - Yiina - Yuuna' },
    ],
  },
];

export const MuallimQiraahBook: React.FC = () => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chapter-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [completedChapters, setCompletedChapters] = useState<string[]>(['chapter-1']);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const currentChapter =
    MIFTAAH_BOOK_CHAPTERS.find((c) => c.id === selectedChapterId) || MIFTAAH_BOOK_CHAPTERS[0];

  const playSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Kumbuyuutarkaaga ama moobaylkaaga ma taageerayo Speech Synthesis.');
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8; // slightly slower for Quranic clarity

    utterance.onend = () => {
      setSpeakingText(null);
    };

    utterance.onerror = () => {
      setSpeakingText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingText(null);
  };

  const toggleChapterComplete = (id: string) => {
    if (completedChapters.includes(id)) {
      setCompletedChapters(completedChapters.filter((cId) => cId !== id));
    } else {
      setCompletedChapters([...completedChapters, id]);
    }
  };

  const filteredItems = currentChapter.lettersOrWords.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.textArabic.includes(q) ||
      item.phoneticSomali.toLowerCase().includes(q) ||
      (item.meaning && item.meaning.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Official Book Header Banner */}
      <div className="bg-gradient-to-r from-[#0e7a48] via-[#0b633a] to-[#08472a] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-600/30">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 transform -translate-x-12 translate-y-12 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3">
          {/* Institute Name & Header badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-[#d4af37]/40 px-4 py-1.5 rounded-full text-[11px] font-bold text-[#d4af37] shadow-inner">
            <Award className="w-4 h-4 text-[#d4af37]" />
            <span>مَعْهَدُ تَهْذِيبِ الأَطْفَالِ لِتَحْفِيظِ الْقُرْآنِ الْكَرِيمِ وَالتَّرْبِيَةِ الإِسْلاَمِيَّةِ</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wide font-arabic text-[#d4af37] pt-1">
            مِفْتَاحُ الْقِرَاءَةِ الْقُرْءَانِيَّةِ
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-emerald-100 max-w-2xl mx-auto font-arabic leading-relaxed">
            دَلِيلٌ مُيَسَّرٌ لِتَعَلُّمِ الْحُرُوفِ وَالْحَرَكَاتِ وَالْمَدِّ وَالتَّجْوِيدِ الْمُبْتَدَأ
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-emerald-200">
            <span className="bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700/50 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>إِعْدَادُ وَتَرْتِيبُ الأُسْتَاذِ: يَحْيَى شَيْخ فَاَرِح</span>
            </span>
            <span className="bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700/50 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>9 الفصول (Fasalka 1-aad ilaa 9-aad)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chapter Navigation & Interactive Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: 9 Chapters List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Book className="w-4 h-4 text-[#0e7a48]" />
                <span>Liiska 9-ka Fasallada (Chapters)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0e7a48] border border-emerald-200">
                {completedChapters.length} / 9 Dhameeyay
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {MIFTAAH_BOOK_CHAPTERS.map((chap) => {
                const isSelected = chap.id === selectedChapterId;
                const isDone = completedChapters.includes(chap.id);

                return (
                  <button
                    key={chap.id}
                    onClick={() => {
                      setSelectedChapterId(chap.id);
                      setSearchTerm('');
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#0e7a48] text-white border-[#0e7a48] shadow-md ring-2 ring-emerald-600/30'
                        : 'bg-slate-50/80 hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#d4af37] text-slate-950'
                            : isDone
                            ? 'bg-emerald-100 text-[#0e7a48]'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {chap.chapterNumber}
                      </span>
                      <div className="truncate">
                        <div className={`font-bold text-xs font-arabic truncate ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                          {chap.titleArabic}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {chap.category} ● {chap.lettersOrWords.length} Qaybood
                        </div>
                      </div>
                    </div>

                    {isDone && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#d4af37]' : 'text-[#0e7a48]'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content View: Chapter Details & Practice Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            {/* Header: Title & Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0e7a48] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 mb-1">
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>{currentChapter.category}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 font-arabic">
                  {currentChapter.titleArabic}
                </h2>
                <p className="text-xs font-bold text-[#0e7a48] mt-0.5">
                  {currentChapter.titleSomali}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleChapterComplete(currentChapter.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    completedChapters.includes(currentChapter.id)
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {completedChapters.includes(currentChapter.id)
                      ? 'Dhameeyay ✓'
                      : 'Calaamadee Dhameystir'}
                  </span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Inbooshan ku dabac (Print)"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Objective Box (النص والإيضاح) */}
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#0e7a48] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0e7a48] font-arabic">
                    الهدف والإيضاح من الفصل {currentChapter.chapterNumber}:
                  </h4>
                  <p className="text-xs font-semibold text-slate-800 font-arabic leading-relaxed pt-1">
                    "{currentChapter.descriptionArabic}"
                  </p>
                  <p className="text-[11px] text-slate-600 pt-1">
                    💡 <strong>Sharaxaad:</strong> {currentChapter.descriptionSomali} Riix xaraf/kalama kasta si aad u ngheysato dhawaaqa saxda ah.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Raadi xaraf ama dhawaaq (e.g. Alif, Baa, Ab, Al)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0e7a48] focus:bg-white transition-all"
              />
            </div>

            {/* Interactive Letters & Words Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
              {filteredItems.map((item, idx) => {
                const isSpeaking = speakingText === item.textArabic;

                return (
                  <div
                    key={idx}
                    onClick={() => playSpeech(item.textArabic)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer relative group ${
                      isSpeaking
                        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 scale-105 shadow-md'
                        : 'bg-gradient-to-b from-slate-50 to-white hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                    </div>

                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-arabic my-2 leading-relaxed tracking-wide">
                      {item.textArabic}
                    </div>

                    <div className="text-[11px] font-bold text-[#0e7a48] font-mono">
                      {item.phoneticSomali}
                    </div>

                    {item.meaning && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        "{item.meaning}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Audio All Player & Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const fullText = currentChapter.lettersOrWords
                      .map((i) => i.textArabic)
                      .join(' . ');
                    playSpeech(fullText);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#0e7a48] hover:bg-[#0b633a] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                  <span>Dhageyso Dhammaan (Play All)</span>
                </button>

                {/* Badhanka Istaajinta (Stop Button) */}
                <button
                  onClick={stopSpeech}
                  disabled={!speakingText}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    speakingText
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                  }`}
                  title="Istaaji Dhagaysiga Audio-ga (Stop Audio)"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Istaaji (Stop)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Prev Chapter */}
                {MIFTAAH_BOOK_CHAPTERS.findIndex((c) => c.id === selectedChapterId) > 0 && (
                  <button
                    onClick={() => {
                      const curIdx = MIFTAAH_BOOK_CHAPTERS.findIndex((c) => c.id === selectedChapterId);
                      setSelectedChapterId(MIFTAAH_BOOK_CHAPTERS[curIdx - 1].id);
                      setSearchTerm('');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Fasalkii Hore</span>
                  </button>
                )}

                {/* Next Chapter */}
                {MIFTAAH_BOOK_CHAPTERS.findIndex((c) => c.id === selectedChapterId) <
                  MIFTAAH_BOOK_CHAPTERS.length - 1 && (
                  <button
                    onClick={() => {
                      const curIdx = MIFTAAH_BOOK_CHAPTERS.findIndex((c) => c.id === selectedChapterId);
                      setSelectedChapterId(MIFTAAH_BOOK_CHAPTERS[curIdx + 1].id);
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 bg-[#d4af37] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>Fasalka Xiga</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
