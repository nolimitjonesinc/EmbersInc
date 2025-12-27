import { Chapter, ChapterType } from '@/types';

export const chapters: Chapter[] = [
  {
    id: 'who-i-am',
    title: 'Who I Am',
    description: 'Personal identity, values, and what makes you uniquely you',
    icon: '', // No longer using emojis
    color: '#E86D48',
    gradient: 'from-orange-500/20 via-amber-500/10',
    prompts: [
      'What are three words your closest friends would use to describe you?',
      'What values do you hold most dear, and where did they come from?',
      'What makes you laugh until you cry?',
      'If you could be remembered for one thing, what would it be?',
      'What brings you the most peace?',
    ],
  },
  {
    id: 'where-i-come-from',
    title: 'Where I Come From',
    description: 'Your roots, heritage, and family background',
    icon: '',
    color: '#8B5E3C',
    gradient: 'from-amber-700/20 via-stone-600/10',
    prompts: [
      'What did your childhood home smell like?',
      'What family tradition do you cherish most?',
      'Tell me about a meal that takes you back to your childhood.',
      'What stories did your grandparents tell you?',
      'What was your neighborhood like growing up?',
    ],
  },
  {
    id: 'what-ive-loved',
    title: "What I've Loved",
    description: 'Joyful memories and meaningful experiences',
    icon: '',
    color: '#D64545',
    gradient: 'from-rose-500/20 via-red-400/10',
    prompts: [
      'What moment made you realize you were in love?',
      'What hobby or passion has brought you the most joy?',
      'Describe a perfect day from your past.',
      'What friendship has meant the most to you?',
      'What place feels most like home to your heart?',
    ],
  },
  {
    id: 'whats-been-hard',
    title: "What's Been Hard",
    description: 'Challenges faced and lessons in resilience',
    icon: '',
    color: '#5D6D7E',
    gradient: 'from-slate-500/20 via-gray-500/10',
    prompts: [
      'What challenge taught you the most about yourself?',
      'How did you get through the hardest time in your life?',
      'What loss changed you?',
      'When did you have to be brave even when you were scared?',
      'What would you tell someone going through what you went through?',
    ],
  },
  {
    id: 'what-ive-learned',
    title: "What I've Learned",
    description: 'Wisdom gathered from life experiences',
    icon: '',
    color: '#5DADE2',
    gradient: 'from-sky-500/20 via-blue-400/10',
    prompts: [
      'What advice would you give your younger self?',
      'What did you learn from your biggest mistake?',
      'What wisdom from your parents or grandparents still guides you?',
      'What has life taught you about happiness?',
      'What do you know now that you wish you knew at 20?',
    ],
  },
  {
    id: 'what-im-still-figuring-out',
    title: "What I'm Still Figuring Out",
    description: 'Ongoing questions and current explorations',
    icon: '',
    color: '#9B59B6',
    gradient: 'from-purple-500/20 via-violet-400/10',
    prompts: [
      'What questions do you still wrestle with?',
      'What dreams haven\'t you pursued yet?',
      'What are you still learning about yourself?',
      'What do you want to do before it\'s too late?',
      'What part of life still surprises you?',
    ],
  },
  {
    id: 'what-i-want-you-to-know',
    title: 'What I Want You to Know',
    description: 'Messages to pass on to loved ones',
    icon: '',
    color: '#F5A623',
    gradient: 'from-amber-500/20 via-yellow-400/10',
    prompts: [
      'What do you most want your grandchildren to know about you?',
      'What family stories must be passed down?',
      'What do you want to say to someone you love?',
      'What matters most in life?',
      'What legacy do you hope to leave?',
    ],
  },
];

export function getChapter(id: ChapterType): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function getRandomPrompt(chapterId?: ChapterType): string {
  if (chapterId) {
    const chapter = getChapter(chapterId);
    if (chapter) {
      return chapter.prompts[Math.floor(Math.random() * chapter.prompts.length)];
    }
  }
  // Random prompt from any chapter
  const allPrompts = chapters.flatMap((c) => c.prompts);
  return allPrompts[Math.floor(Math.random() * allPrompts.length)];
}

export function getStarterPrompts(): string[] {
  return [
    "What's one of your earliest memories that still feels vivid to you?",
    "What's a holiday tradition that makes you smile when you remember it?",
    "Who had the biggest influence on who you became?",
    "What moment in your life are you most proud of?",
    "What did your grandmother's kitchen smell like?",
  ];
}
