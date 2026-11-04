// 웹 utils/bandLabels.ts 와 동일한 라벨
export const BAND_REGION_LABELS: Record<string, string> = {
  SEOUL: "서울",
  GYEONGGI: "경기",
  INCHEON: "인천",
  BUSAN: "부산",
  DAEGU: "대구",
  GWANGJU: "광주",
  DAEJEON: "대전",
  ULSAN: "울산",
  SEJONG: "세종",
  CHUNGBUK: "충북",
  CHUNGNAM: "충남",
  JEONBUK: "전북",
  JEONNAM: "전남",
  GYEONGBUK: "경북",
  GYEONGNAM: "경남",
  GANGWON: "강원",
  JEJU: "제주",
};

export const BAND_GENRE_LABELS: Record<string, string> = {
  INDIE: "인디",
  POP: "팝",
  POP_ROCK: "팝록",
  JAZZ: "재즈",
  BLUES: "블루스",
  ALTERNATIVE_ROCK: "얼터너티브록",
  PSYCHEDELIC_ROCK: "사이키델릭록",
  ELECTRONIC_ROCK: "일렉트로닉록",
  FOLK_ROCK: "포크록",
  PUNK_ROCK: "펑크록",
  HARD_ROCK: "하드록",
  METAL: "메탈",
  ETC: "etc.",
};

export const BAND_PART_LABELS: Record<string, string> = {
  VOCAL: "보컬",
  GUITAR: "기타",
  BASS: "베이스",
  KEYBOARD: "키보드",
  DRUM: "드럼",
  ETC: "etc",
};

export const getGenreLabel = (genre: string) =>
  BAND_GENRE_LABELS[genre] ?? genre;

export const getRegionLabel = (region: string) =>
  BAND_REGION_LABELS[region] ?? region;

export const getPartLabel = (part: string) => BAND_PART_LABELS[part] ?? part;
