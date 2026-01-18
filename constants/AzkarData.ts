export type Category = 'Morning' | 'Evening';

export interface Zeker {
  id: string;
  category: Category;
  arabic: string;
  translation: string;
  target: number;
}

export const AZKAR_DATA: Zeker[] = [
  // MORNING AZKAR
  {
    id: "1",
    category: "Morning",
    arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
    translation: "Glory is to Allah and to Him is the praise.",
    target: 33
  },
  {
    id: "2",
    category: "Morning",
    arabic: "الْحَمْدُ لِلَّهِ",
    translation: "All praise is due to Allah.",
    target: 33
  },
  {
    id: "3",
    category: "Morning",
    arabic: "اللهُ أَكْبَرُ",
    translation: "Allah is the Greatest.",
    target: 34
  },
  {
    id: "5",
    category: "Morning",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، عَلَيْكَ تَوَكَّلْتُ ، وَأَنْتَ رَبُّ الْعَرْشِ الْعَظِيمِ , مَا شَاءَ اللَّهُ كَانَ ، وَمَا لَمْ يَشَأْ لَمْ يَكُنْ ، وَلا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ , أَعْلَمُ أَنَّ اللَّهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ ، وَأَنَّ اللَّهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا , اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي ، وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا ، إِنَّ رَبِّي عَلَى صِرَاطٍ مُسْتَقِيمٍ",
    translation: "O Allah, You are my Lord, there is no god but You. In You I put my trust, and You are the Lord of the Mighty Throne...",
    target: 1
  },

  // EVENING AZKAR
  {
    id: "4",
    category: "Evening",
    arabic: "أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ",
    translation: "I seek forgiveness from Allah and repent to Him.",
    target: 100
  },
  {
    id: "6",
    category: "Evening",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
    translation: "We have reached the evening and at this very time unto Allah belongs all sovereignty.",
    target: 1
  },
  {
    id: "7",
    category: "Evening",
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
    translation: "O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning...",
    target: 1
  }
];
