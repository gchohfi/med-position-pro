import type { CarouselSkill } from "./carousel";

export type Especialidade =
  | "Dermatologia"
  | "Ginecologia e Obstetrícia"
  | "Pediatria"
  | "Cardiologia"
  | "Ortopedia"
  | "Oftalmologia"
  | "Nutrologia"
  | "Endocrinologia"
  | "Cirurgia Plástica"
  | "Psiquiatria"
  | "Medicina Estética"
  | "Outra";

export type Plataforma = "instagram" | "tiktok" | "youtube" | "linkedin";

export interface DoctorProfile {
  nome: string;
  especialidade: Especialidade;
  subespecialidade?: string;
  crm: string;
  cidade: string;
  estado: string;
  plataformas: Plataforma[];
  seguidores_instagram?: number;
  publico_alvo: string;
  tom_de_voz: string;
  diferenciais: string[];
  objetivos: string[];
  concorrentes?: string[];
  referencia_visual?: string;
  bio_instagram?: string;
  skill?: CarouselSkill;
}
