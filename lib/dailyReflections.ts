export type ReflectionCategory =
  | "anxiety"
  | "stress"
  | "self-love"
  | "discipline"
  | "purpose"
  | "relationships"
  | "resilience"
  | "mental-clarity";

export type AppLanguage = "pt" | "en";

export type VirtueId =
  | "clarity"
  | "serenity"
  | "courage"
  | "discipline"
  | "self-mastery"
  | "wisdom"
  | "integrity"
  | "inself";

export interface DailyReflection {
  quote: string;
  author: string;
  category: ReflectionCategory;
  virtue: VirtueId;
  message: string;
  steps: {
    identifique: string;
    aceite: string;
    aja: string;
  };
}

export const CATEGORY_LABELS: Record<ReflectionCategory, string> = {
  anxiety: "Ansiedade",
  stress: "Estresse",
  "self-love": "Amor Próprio",
  discipline: "Disciplina",
  purpose: "Propósito",
  relationships: "Relacionamentos",
  resilience: "Resiliência",
  "mental-clarity": "Clareza Mental",
};

export const CATEGORY_LABELS_EN: Record<ReflectionCategory, string> = {
  anxiety: "Anxiety",
  stress: "Stress",
  "self-love": "Self-Love",
  discipline: "Discipline",
  purpose: "Purpose",
  relationships: "Relationships",
  resilience: "Resilience",
  "mental-clarity": "Mental Clarity",
};

export function getCategoryLabel(category: ReflectionCategory, language: AppLanguage = "pt"): string {
  return language === "en" ? CATEGORY_LABELS_EN[category] : CATEGORY_LABELS[category];
}

export const CATEGORY_ICONS: Record<ReflectionCategory, string> = {
  anxiety: "wave",
  stress: "yoga",
  "self-love": "heart",
  discipline: "sword-cross",
  purpose: "compass",
  relationships: "handshake",
  resilience: "fire",
  "mental-clarity": "diamond",
};

const REFLECTIONS: Array<{
  category: ReflectionCategory;
  virtue: VirtueId;
  pt: Omit<DailyReflection, "category" | "virtue">;
  en: Omit<DailyReflection, "category" | "virtue">;
}> = [
  {
    category: "anxiety",
    virtue: "serenity",
    pt: {
      quote: "Você tem poder sobre sua mente — não sobre os eventos externos.",
      author: "Marcus Aurelius",
      message: "Você não precisa controlar o dia inteiro. Apenas controle a próxima decisão.",
      steps: {
        identifique: "O que está causando ansiedade em você neste momento?",
        aceite: "Quais dessas preocupações estão fora do seu controle?",
        aja: "Que ação concreta você pode tomar agora sobre o que está ao seu alcance?",
      },
    },
    en: {
      quote: "You have power over your mind — not over external events.",
      author: "Marcus Aurelius",
      message: "You don’t need to control the whole day. Just control your next decision.",
      steps: {
        identifique: "What is causing anxiety in you right now?",
        aceite: "Which worries are outside your control?",
        aja: "What concrete action can you take now within your reach?",
      },
    },
  },
  {
    category: "stress",
    virtue: "courage",
    pt: {
      quote: "Não é o que acontece com você, mas como você reage que importa.",
      author: "Epictetus",
      message: "A adversidade não é sua inimiga. Sua reação é o que define o caminho.",
      steps: {
        identifique: "Qual situação está gerando mais estresse na sua vida agora?",
        aceite: "Você pode mudar a situação, ou apenas sua resposta a ela?",
        aja: "Qual será sua resposta consciente a partir de agora?",
      },
    },
    en: {
      quote: "It’s not what happens to you, but how you respond that matters.",
      author: "Epictetus",
      message: "Adversity is not your enemy. Your reaction defines the path.",
      steps: {
        identifique: "What situation is creating the most stress in your life right now?",
        aceite: "Can you change the situation, or only your response to it?",
        aja: "What conscious response will you choose from now on?",
      },
    },
  },
  {
    category: "self-love",
    virtue: "wisdom",
    pt: {
      quote: "A felicidade da sua vida depende da qualidade dos seus pensamentos.",
      author: "Marcus Aurelius",
      message: "Seus pensamentos moldam sua realidade. Escolha-os com cuidado.",
      steps: {
        identifique: "Que pensamento autocrítico está ocupando sua mente hoje?",
        aceite: "Você falaria isso para alguém que ama? Por que fala para si?",
        aja: "Como você pode reformular esse pensamento com mais compaixão?",
      },
    },
    en: {
      quote: "The happiness of your life depends on the quality of your thoughts.",
      author: "Marcus Aurelius",
      message: "Your thoughts shape your reality. Choose them carefully.",
      steps: {
        identifique: "What self-critical thought is taking up your mind today?",
        aceite: "Would you say this to someone you love? Why do you say it to yourself?",
        aja: "How can you reframe this thought with more compassion?",
      },
    },
  },
  {
    category: "discipline",
    virtue: "integrity",
    pt: {
      quote: "Primeiro diga a si mesmo o que você seria; e então faça o que tem que fazer.",
      author: "Epictetus",
      message: "A disciplina começa com clareza sobre quem você quer ser.",
      steps: {
        identifique: "Que hábito ou comportamento está impedindo seu crescimento?",
        aceite: "Você está disposto a abrir mão do conforto por algo maior?",
        aja: "Qual pequeno ato disciplinado você praticará hoje?",
      },
    },
    en: {
      quote: "First tell yourself what you would be; and then do what you have to do.",
      author: "Epictetus",
      message: "Discipline begins with clarity about who you want to be.",
      steps: {
        identifique: "Which habit or behavior is blocking your growth?",
        aceite: "Are you willing to give up comfort for something greater?",
        aja: "What small disciplined action will you practice today?",
      },
    },
  },
  {
    category: "purpose",
    virtue: "integrity",
    pt: {
      quote: "A virtude é o único bem verdadeiro.",
      author: "Zenão de Cítio",
      message: "Viva de acordo com seus princípios, não com as expectativas dos outros.",
      steps: {
        identifique: "Você está vivendo pelos seus valores ou pelos de outra pessoa?",
        aceite: "O que levou você a se afastar do seu propósito?",
        aja: "Que decisão alinhada aos seus valores você pode tomar hoje?",
      },
    },
    en: {
      quote: "Virtue is the only true good.",
      author: "Zeno of Citium",
      message: "Live by your principles, not other people’s expectations.",
      steps: {
        identifique: "Are you living by your values or someone else’s?",
        aceite: "What led you away from your purpose?",
        aja: "What decision aligned with your values can you make today?",
      },
    },
  },
  {
    category: "relationships",
    virtue: "serenity",
    pt: {
      quote: "Trate as pessoas como se elas fossem o que deveriam ser e você as ajudará a se tornarem o que são capazes de ser.",
      author: "Goethe",
      message: "Os relacionamentos florescem quando paramos de tentar mudar o outro.",
      steps: {
        identifique: "Que conflito interpessoal está pesando em você?",
        aceite: "Você está tentando controlar o comportamento de outra pessoa?",
        aja: "Que atitude de empatia ou escuta você pode praticar hoje?",
      },
    },
    en: {
      quote: "Treat people as if they were what they ought to be — and you help them become what they are capable of being.",
      author: "Johann Wolfgang von Goethe",
      message: "Relationships thrive when we stop trying to change the other person.",
      steps: {
        identifique: "What interpersonal conflict is weighing on you?",
        aceite: "Are you trying to control someone else’s behavior?",
        aja: "What act of empathy or listening can you practice today?",
      },
    },
  },
  {
    category: "resilience",
    virtue: "courage",
    pt: {
      quote: "O impedimento à ação avança a ação. O que está no caminho torna-se o caminho.",
      author: "Marcus Aurelius",
      message: "Os obstáculos não estão bloqueando seu caminho. Eles são o caminho.",
      steps: {
        identifique: "Qual obstáculo parece intransponível agora?",
        aceite: "Como esse obstáculo pode se tornar uma oportunidade de crescimento?",
        aja: "Que ação concreta você pode tomar para transformar esse obstáculo?",
      },
    },
    en: {
      quote: "The obstacle advances the action. What stands in the way becomes the way.",
      author: "Marcus Aurelius",
      message: "Obstacles aren’t blocking your path. They are the path.",
      steps: {
        identifique: "Which obstacle feels insurmountable right now?",
        aceite: "How could this obstacle become a growth opportunity?",
        aja: "What concrete action can you take to transform this obstacle?",
      },
    },
  },
  {
    category: "mental-clarity",
    virtue: "discipline",
    pt: {
      quote: "A vida não examinada não vale a pena ser vivida.",
      author: "Sócrates",
      message: "Reserve um momento para pensar antes de agir. A clareza precede a ação.",
      steps: {
        identifique: "Que área da sua vida está no piloto automático?",
        aceite: "Você está agindo por hábito ou por escolha consciente?",
        aja: "Que reflexão profunda você fará antes de agir hoje?",
      },
    },
    en: {
      quote: "The unexamined life is not worth living.",
      author: "Socrates",
      message: "Take a moment to think before acting. Clarity comes before action.",
      steps: {
        identifique: "Which area of your life is on autopilot?",
        aceite: "Are you acting out of habit or conscious choice?",
        aja: "What deep reflection will you make before you act today?",
      },
    },
  },
];

export const getDailyReflectionByCategoryVirtue = (
  category: ReflectionCategory,
  virtue: VirtueId,
  language: AppLanguage = "pt"
): DailyReflection => {
  const found = REFLECTIONS.find((r) => r.category === category && r.virtue === virtue) ?? REFLECTIONS.find((r) => r.category === category);
  if (!found) {
    // Fallback: first reflection in catalog
    const fallback = REFLECTIONS[0];
    const lang = language === "en" ? fallback.en : fallback.pt;
    return { category: fallback.category, virtue: fallback.virtue, ...lang };
  }
  const lang = language === "en" ? found.en : found.pt;
  return { category: found.category, virtue: found.virtue, ...lang };
};

export const getDailyReflection = (
  preferredCategories?: ReflectionCategory[],
  language: AppLanguage = "pt"
): DailyReflection => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (preferredCategories && preferredCategories.length > 0) {
    const preferred = REFLECTIONS.filter((r) => preferredCategories.includes(r.category));
    if (preferred.length > 0) {
      const picked = preferred[dayOfYear % preferred.length];
      const lang = language === "en" ? picked.en : picked.pt;
      return { category: picked.category, virtue: picked.virtue, ...lang };
    }
  }

  const picked = REFLECTIONS[dayOfYear % REFLECTIONS.length];
  const lang = language === "en" ? picked.en : picked.pt;
  return { category: picked.category, virtue: picked.virtue, ...lang };
};

export const ALL_CATEGORIES: ReflectionCategory[] = [
  "anxiety",
  "stress",
  "self-love",
  "discipline",
  "purpose",
  "relationships",
  "resilience",
  "mental-clarity",
];
