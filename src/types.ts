export interface Work {
  id: string;
  title: string;
  year: number;
  location: string;
  date: string;
  emotion: string; // e.g. "그리움", "외로움", "청춘", "여름"
  preface: string; // preface essay
  images: string[]; // array of image URLs
  closing: string; // closing short sentence
  featured: boolean;
}

export interface Journal {
  id: string;
  title: string;
  content: string; // detail journal texts
  date: string;
  images: string[];
}

export interface AboutInfo {
  birthYear: string;
  birthPlace: string;
  profession: string;
  biography: string;
  equipments: string[];
}

export interface ContactInfo {
  instagram: string; // @macolorisblue
  email: string;
}

export type ActiveTab = 'HOME' | 'WORKS' | 'ARCHIVE' | 'EMOTIONS' | 'JOURNAL' | 'ABOUT' | 'ADMIN' | string;

export interface CustomTab {
  id: string;
  name: string;
  content: string;
  visible: boolean;
  image?: string;
}
