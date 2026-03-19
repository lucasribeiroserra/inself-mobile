export interface Virtue {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  maxPoints: number;
}

export const VIRTUES: Virtue[] = [
  { id: "clarity", name: "Clareza", nameEn: "Clarity", description: "Enxergar a realidade com lucidez", descriptionEn: "See reality with lucidity", icon: "diamond", maxPoints: 100 },
  { id: "serenity", name: "Serenidade", nameEn: "Serenity", description: "Manter a calma interior diante do caos", descriptionEn: "Maintain inner calm amidst chaos", icon: "dove", maxPoints: 100 },
  { id: "courage", name: "Coragem", nameEn: "Courage", description: "Enfrentar o desconhecido com firmeza", descriptionEn: "Face the unknown with strength", icon: "fire", maxPoints: 100 },
  { id: "discipline", name: "Disciplina", nameEn: "Discipline", description: "Dominar a vontade com constância", descriptionEn: "Master willpower with consistency", icon: "sword-cross", maxPoints: 100 },
  { id: "self-mastery", name: "Autodomínio", nameEn: "Self-Mastery", description: "Governar impulsos e emoções", descriptionEn: "Govern impulses and emotions", icon: "crown", maxPoints: 100 },
  { id: "wisdom", name: "Sabedoria", nameEn: "Wisdom", description: "Aplicar o conhecimento com discernimento", descriptionEn: "Apply knowledge with discernment", icon: "book-open", maxPoints: 100 },
  { id: "integrity", name: "Integridade", nameEn: "Integrity", description: "Agir de acordo com seus princípios", descriptionEn: "Act according to your principles", icon: "shield", maxPoints: 100 },
  { id: "inself", name: "Inself", nameEn: "Inself", description: "A excelência moral completa", descriptionEn: "Complete moral excellence", icon: "domain", maxPoints: 100 },
];

/** Mapa de desafio → virtude */
export const CHALLENGE_VIRTUE_MAP: Record<string, string> = {
  serenity: "serenity",
  courage: "courage",
  discipline: "discipline",
  control: "clarity",
  gratitude: "wisdom",
  "self-mastery": "self-mastery",
};

/** Ordem de virtudes para pontos das reflexões diárias */
export const REFLECTION_VIRTUES = ["clarity", "serenity", "courage", "discipline", "self-mastery", "wisdom", "integrity", "inself"];

export const getVirtueForReflection = (checkinCount: number): string => {
  return REFLECTION_VIRTUES[(checkinCount - 1) % REFLECTION_VIRTUES.length];
};

export const POINTS_PER_REFLECTION = 2;
export const POINTS_PER_CHALLENGE_DAY = 5;
export const POINTS_PER_CHALLENGE_COMPLETE = 15;
