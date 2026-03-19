export interface ChallengeDay {
  day: number;
  prompt: string;
  promptEn: string;
}

export interface Challenge {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  duration: 3 | 7 | 14;
  difficulty: "easy" | "medium" | "hard";
  icon: string;
  days: ChallengeDay[];
}

export const CHALLENGES: Challenge[] = [
  {
    id: "serenity",
    title: "Desafio da Serenidade",
    titleEn: "Serenity Challenge",
    description: "Cultive a calma interior diante do caos externo.",
    descriptionEn: "Cultivate inner calm amidst external chaos.",
    duration: 7,
    difficulty: "medium",
    icon: "meditation",
    days: [
      { day: 1, prompt: "Observe algo que lhe frustra hoje. Pergunte-se: \"Isso está sob meu controle?\"", promptEn: "Observe something that frustrates you today. Ask yourself: \"Is this within my control?\"" },
      { day: 2, prompt: "Pratique 5 minutos de silêncio intencional. Observe seus pensamentos sem julgá-los.", promptEn: "Practice 5 minutes of intentional silence. Observe your thoughts without judging them." },
      { day: 3, prompt: "Identifique uma situação que você não pode mudar. Escreva como aceitar isso com serenidade.", promptEn: "Identify a situation you cannot change. Write how to accept it with serenity." },
      { day: 4, prompt: "Quando sentir raiva hoje, pause por 10 segundos antes de reagir.", promptEn: "When you feel anger today, pause for 10 seconds before reacting." },
      { day: 5, prompt: "Escreva 3 coisas sobre as quais você não tem controle e pratique soltá-las.", promptEn: "Write 3 things you have no control over and practice letting them go." },
      { day: 6, prompt: "Observe como você reage ao inesperado. A serenidade é uma escolha?", promptEn: "Observe how you react to the unexpected. Is serenity a choice?" },
      { day: 7, prompt: "Reflita sobre a semana. Em que momentos você manteve a serenidade? O que aprendeu?", promptEn: "Reflect on the week. When did you maintain serenity? What did you learn?" },
    ],
  },
  {
    id: "courage",
    title: "Desafio da Coragem",
    titleEn: "Courage Challenge",
    description: "Enfrente seus medos com sabedoria estóica.",
    descriptionEn: "Face your fears with stoic wisdom.",
    duration: 7,
    difficulty: "medium",
    icon: "fire",
    days: [
      { day: 1, prompt: "Qual é o maior medo que você tem evitado? Escreva-o sem julgamento.", promptEn: "What is the biggest fear you've been avoiding? Write it without judgment." },
      { day: 2, prompt: "Faça algo pequeno que lhe cause desconforto hoje. Registre como se sentiu.", promptEn: "Do something small that causes you discomfort today. Record how you felt." },
      { day: 3, prompt: "Imagine o pior cenário possível de algo que teme. Como você sobreviveria?", promptEn: "Imagine the worst-case scenario of something you fear. How would you survive?" },
      { day: 4, prompt: "Diga algo verdadeiro que normalmente guardaria para si.", promptEn: "Say something true that you would normally keep to yourself." },
      { day: 5, prompt: "Identifique uma área da vida onde você joga seguro demais.", promptEn: "Identify an area of life where you play it too safe." },
      { day: 6, prompt: "Pratique a vulnerabilidade: peça ajuda a alguém hoje.", promptEn: "Practice vulnerability: ask someone for help today." },
      { day: 7, prompt: "Olhando para a semana, como a coragem transformou sua perspectiva?", promptEn: "Looking back at the week, how did courage transform your perspective?" },
    ],
  },
  {
    id: "discipline",
    title: "Desafio da Disciplina",
    titleEn: "Discipline Challenge",
    description: "Fortaleça sua vontade através de práticas diárias.",
    descriptionEn: "Strengthen your will through daily practices.",
    duration: 14,
    difficulty: "hard",
    icon: "sword-cross",
    days: [
      { day: 1, prompt: "Defina uma rotina matinal de 3 passos e comprometa-se com ela.", promptEn: "Define a 3-step morning routine and commit to it." },
      { day: 2, prompt: "Renuncie a um prazer pequeno hoje (café, rede social, etc.). Como se sentiu?", promptEn: "Give up a small pleasure today (coffee, social media, etc.). How did you feel?" },
      { day: 3, prompt: "Complete uma tarefa que tem adiado há mais de uma semana.", promptEn: "Complete a task you've been postponing for over a week." },
      { day: 4, prompt: "Pratique 10 minutos de exercício físico, mesmo que não queira.", promptEn: "Practice 10 minutes of physical exercise, even if you don't want to." },
      { day: 5, prompt: "Diga 'não' a algo que normalmente aceitaria por conveniência.", promptEn: "Say 'no' to something you would normally accept out of convenience." },
      { day: 6, prompt: "Acorde 30 minutos mais cedo. Use esse tempo para reflexão.", promptEn: "Wake up 30 minutes earlier. Use that time for reflection." },
      { day: 7, prompt: "Avalie sua primeira semana. Quais hábitos foram mais difíceis?", promptEn: "Evaluate your first week. Which habits were hardest?" },
      { day: 8, prompt: "Jejue de tecnologia por 2 horas hoje. Observe o que sente.", promptEn: "Fast from technology for 2 hours today. Observe what you feel." },
      { day: 9, prompt: "Faça algo que exija paciência: cozinhar, ler, caminhar devagar.", promptEn: "Do something that requires patience: cook, read, walk slowly." },
      { day: 10, prompt: "Identifique seu maior desperdício de tempo e elimine-o hoje.", promptEn: "Identify your biggest time waste and eliminate it today." },
      { day: 11, prompt: "Pratique a gratidão: escreva 5 coisas pelas quais é grato.", promptEn: "Practice gratitude: write 5 things you're grateful for." },
      { day: 12, prompt: "Mantenha a calma em uma situação que normalmente o irritaria.", promptEn: "Stay calm in a situation that would normally irritate you." },
      { day: 13, prompt: "Revise suas metas. Estão alinhadas com seus valores?", promptEn: "Review your goals. Are they aligned with your values?" },
      { day: 14, prompt: "Reflita sobre 14 dias de disciplina. Como você mudou?", promptEn: "Reflect on 14 days of discipline. How have you changed?" },
    ],
  },
  {
    id: "control",
    title: "Desafio do Controle",
    titleEn: "Control Challenge",
    description: "Aprenda a distinguir o que está e o que não está sob seu controle.",
    descriptionEn: "Learn to distinguish what is and isn't within your control.",
    duration: 3,
    difficulty: "easy",
    icon: "target",
    days: [
      { day: 1, prompt: "Faça duas listas: o que você pode controlar e o que não pode. Seja honesto.", promptEn: "Make two lists: what you can control and what you can't. Be honest." },
      { day: 2, prompt: "Quando algo inesperado acontecer, pergunte: 'Posso mudar isso?' Se não, solte.", promptEn: "When something unexpected happens, ask: 'Can I change this?' If not, let go." },
      { day: 3, prompt: "Reflita: como focar no que está sob seu controle mudou seu dia?", promptEn: "Reflect: how did focusing on what's within your control change your day?" },
    ],
  },
  {
    id: "gratitude",
    title: "Desafio da Gratidão",
    titleEn: "Gratitude Challenge",
    description: "Desenvolva o hábito de reconhecer o que é bom na vida.",
    descriptionEn: "Develop the habit of recognizing what's good in life.",
    duration: 7,
    difficulty: "easy",
    icon: "heart",
    days: [
      { day: 1, prompt: "Escreva 3 coisas simples pelas quais você é grato hoje.", promptEn: "Write 3 simple things you're grateful for today." },
      { day: 2, prompt: "Agradeça a alguém pessoalmente por algo que normalmente passaria despercebido.", promptEn: "Thank someone personally for something that would normally go unnoticed." },
      { day: 3, prompt: "Encontre algo bom em uma situação difícil recente.", promptEn: "Find something good in a recent difficult situation." },
      { day: 4, prompt: "Escreva uma carta de gratidão para alguém importante na sua vida.", promptEn: "Write a gratitude letter to someone important in your life." },
      { day: 5, prompt: "Pratique gratidão pelo seu corpo: o que ele permite que você faça?", promptEn: "Practice gratitude for your body: what does it allow you to do?" },
      { day: 6, prompt: "Observe a natureza ao seu redor. Pelo que você é grato?", promptEn: "Observe nature around you. What are you grateful for?" },
      { day: 7, prompt: "Como a prática da gratidão mudou sua perspectiva esta semana?", promptEn: "How did practicing gratitude change your perspective this week?" },
    ],
  },
  {
    id: "self-mastery",
    title: "Desafio do Autodomínio",
    titleEn: "Self-Mastery Challenge",
    description: "Domine seus impulsos e reações com consciência.",
    descriptionEn: "Master your impulses and reactions with awareness.",
    duration: 14,
    difficulty: "hard",
    icon: "crown",
    days: [
      { day: 1, prompt: "Identifique um impulso recorrente que deseja controlar.", promptEn: "Identify a recurring impulse you want to control." },
      { day: 2, prompt: "Antes de cada refeição, faça uma pausa de 30 segundos e coma com consciência.", promptEn: "Before each meal, pause for 30 seconds and eat mindfully." },
      { day: 3, prompt: "Observe suas reações emocionais hoje sem agir sobre elas.", promptEn: "Observe your emotional reactions today without acting on them." },
      { day: 4, prompt: "Pratique o atraso de gratificação: adie algo prazeroso por 1 hora.", promptEn: "Practice delayed gratification: postpone something pleasurable for 1 hour." },
      { day: 5, prompt: "Escolha responder ao invés de reagir em cada interação hoje.", promptEn: "Choose to respond rather than react in every interaction today." },
      { day: 6, prompt: "Faça algo difícil voluntariamente: banho frio, jejum, silêncio.", promptEn: "Do something difficult voluntarily: cold shower, fasting, silence." },
      { day: 7, prompt: "Avalie sua primeira semana de autodomínio. O que descobriu sobre si?", promptEn: "Evaluate your first week of self-mastery. What did you discover about yourself?" },
      { day: 8, prompt: "Identifique um padrão de pensamento negativo e substitua-o conscientemente.", promptEn: "Identify a negative thought pattern and consciously replace it." },
      { day: 9, prompt: "Pratique escuta ativa: não interrompa ninguém hoje.", promptEn: "Practice active listening: don't interrupt anyone today." },
      { day: 10, prompt: "Questione uma crença limitante que carrega sobre si mesmo.", promptEn: "Question a limiting belief you carry about yourself." },
      { day: 11, prompt: "Faça algo gentil para alguém sem esperar nada em troca.", promptEn: "Do something kind for someone without expecting anything in return." },
      { day: 12, prompt: "Mantenha um diário de emoções: registre cada emoção forte que sentir.", promptEn: "Keep an emotion journal: record every strong emotion you feel." },
      { day: 13, prompt: "Pratique a humildade: reconheça algo que não sabe ou fez errado.", promptEn: "Practice humility: acknowledge something you don't know or did wrong." },
      { day: 14, prompt: "Reflexão final: como o autodomínio transformou sua relação consigo mesmo?", promptEn: "Final reflection: how has self-mastery transformed your relationship with yourself?" },
    ],
  },
];

export const getDifficultyLabel = (difficulty: string, lang: "pt" | "en") => {
  const labels = {
    easy: { pt: "Fácil", en: "Easy" },
    medium: { pt: "Médio", en: "Medium" },
    hard: { pt: "Difícil", en: "Hard" },
  };
  return labels[difficulty as keyof typeof labels]?.[lang] || difficulty;
};

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy": return "bg-primary/15";
    case "medium": return "bg-secondary/30";
    case "hard": return "bg-destructive/15";
    default: return "bg-muted";
  }
};
