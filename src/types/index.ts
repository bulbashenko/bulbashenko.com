export type Lang = "en" | "ru" | "sk";

export interface SkillCategory {
  cat: string;
  items: string[];
}

export interface ProfileData {
  id: number;
  name: string;
  birthday?: string | null;
  location?: string | null;
  titleEn?: string | null;
  titleRu?: string | null;
  titleSk?: string | null;
  bioEn?: string | null;
  bioRu?: string | null;
  bioSk?: string | null;
  photo?: string | null;
  email?: string | null;
  github?: string | null;
  telegram?: string | null;
  linkedin?: string | null;
  skills: SkillCategory[];
}

export interface PostData {
  id: string;
  title: string;
  titleRu?: string | null;
  titleSk?: string | null;
  content: string;
  contentRu?: string | null;
  contentSk?: string | null;
  date: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  id: string;
  name: string;
  nameRu?: string | null;
  nameSk?: string | null;
  desc?: string | null;
  descRu?: string | null;
  descSk?: string | null;
  stack: string[];
  github?: string | null;
  url?: string | null;
  order: number;
}

export interface GalleryImageData {
  id: string;
  src: string;
  caption?: string | null;
  order: number;
}

export interface CVEntryData {
  id: string;
  type: "experience" | "education" | "certification";
  role?: string | null;
  company?: string | null;
  degree?: string | null;
  institution?: string | null;
  name?: string | null;
  issuer?: string | null;
  start?: string | null;
  end?: string | null;
  desc?: string | null;
  date?: string | null;
  order: number;
}

export interface SiteData {
  profile: ProfileData;
  posts: PostData[];
  projects: ProjectData[];
  gallery: GalleryImageData[];
  cvEntries: CVEntryData[];
}
