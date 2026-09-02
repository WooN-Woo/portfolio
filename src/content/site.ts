/**
 * Sitenin tüm içeriği `site.json` dosyasında duruyor.
 *
 * Değiştirmek için iki yol var:
 *  1. Site açıkken /duzenle sayfasındaki panel (önerilen)
 *  2. site.json dosyasını elle düzenlemek
 *
 * Bu dosya sadece o içeriğe tip veriyor; buraya metin yazılmaz.
 */

import data from "./site.json";

export type Project = {
  slug: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  detail: string[];
  stack: string[];
  /** public/ altındaki ekran görüntüleri. Boşsa görsel bölümü çıkmaz. */
  images?: string[];
  status?: "Yayında" | "Geliştiriliyor" | "Tamamlandı" | "Arşiv" | "";
  links?: { label: string; href: string }[];
};

export type Game = {
  slug: string;
  title: string;
  year: string;
  role: string;
  engine: string;
  tagline: string;
  detail: string[];
  tags: string[];
  /** public/ altındaki kapak görselinin yolu. Boşsa yazıdan bir kapak üretilir. */
  cover?: string;
  /** YouTube bağlantısı. Doluysa kapağın üstünde oynat düğmesi çıkar. */
  video?: string;
  status?: "Yayında" | "Geliştiriliyor" | "Tamamlandı" | "Arşiv" | "";
  links?: { label: string; href: string }[];
};

export type ExperienceItem = {
  period: string;
  title: string;
  org: string;
  description: string;
};

export type SkillGroup = {
  title: string;
  items: string[];
};

export type Profile = {
  name: string;
  role: string;
  location: string;
  email: string;
  github: string;
  githubLabel: string;
  site: string;
  siteLabel: string;
  emailAlt: string;
  phone: string;
  headline: string;
  intro: string;
  now: string;
  metaDescription: string;
};

export type SiteContent = {
  profile: Profile;
  games: Game[];
  projects: Project[];
  experience: ExperienceItem[];
  education: ExperienceItem[];
  skills: SkillGroup[];
};

export const content = data as SiteContent;

export const profile = content.profile;
export const games = content.games;
export const projects = content.projects;
export const experience = content.experience;
export const education = content.education;
export const skills = content.skills;
