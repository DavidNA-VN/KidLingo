export type DoodleVocabularyItem = {
  class_key: string;
  english: string;
  vi: string;
  phonetic: string;
};

export const DOODLE_VOCABULARY: DoodleVocabularyItem[] = [
  { class_key: "airplane", english: "airplane", vi: "máy bay", phonetic: "/ˈer.pleɪn/" },
  { class_key: "apple", english: "apple", vi: "quả táo", phonetic: "/ˈæp.əl/" },
  { class_key: "banana", english: "banana", vi: "quả chuối", phonetic: "/bəˈnæn.ə/" },
  { class_key: "car", english: "car", vi: "xe ô tô", phonetic: "/kɑːr/" },
  { class_key: "cat", english: "cat", vi: "con mèo", phonetic: "/kæt/" },
  { class_key: "duck", english: "duck", vi: "con vịt", phonetic: "/dʌk/" },
  { class_key: "fish", english: "fish", vi: "con cá", phonetic: "/fɪʃ/" },
  { class_key: "hand", english: "hand", vi: "bàn tay", phonetic: "/hænd/" },
  { class_key: "house", english: "house", vi: "ngôi nhà", phonetic: "/haʊs/" },
  { class_key: "soccer_ball", english: "soccer ball", vi: "quả bóng đá", phonetic: "/ˈsɑː.kɚ bɔːl/" },
];

export const DOODLE_ALPHABETS = Array.from(new Set(DOODLE_VOCABULARY.map((item) => item.english[0].toUpperCase())));
