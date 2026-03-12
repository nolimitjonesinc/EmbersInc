/**
 * Curated Family Prompt Library
 *
 * Helps family members ask meaningful questions when they freeze up
 * and don't know what to ask. Every question is designed to trigger
 * a specific story, not a generic answer.
 *
 * Organized by relationship (PromptCategory[]) and themed packs (PromptPack[]).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CuratedPrompt {
  id: string
  text: string
  /** Optional note explaining why this question works well */
  whyItWorks?: string
}

export interface PromptCategory {
  id: string
  label: string
  description: string
  icon: string // emoji
  prompts: CuratedPrompt[]
}

export interface PromptPack {
  id: string
  label: string
  description: string
  icon: string
  badge?: string // e.g. "Popular", "Deep", "Fun"
  prompts: CuratedPrompt[]
}

// ---------------------------------------------------------------------------
// Relationship-based Categories
// ---------------------------------------------------------------------------

// ---- Adult Children (asking parents / grandparents) -----------------------

const storiesYouThinkYouKnow: PromptCategory = {
  id: "children-stories",
  label: "The Stories You Think You Know",
  description: "Questions that reframe familiar family stories",
  icon: "\uD83D\uDD0D",
  prompts: [
    {
      id: "children-stories-1",
      text: "You always talk about moving to [city] \u2014 but what were you leaving behind?",
      whyItWorks: "Shifts the familiar narrative from destination to origin, revealing what was sacrificed.",
    },
    {
      id: "children-stories-2",
      text: "What\u2019s the real story behind how you and [Dad/Mom] met? Not the version you tell at parties.",
      whyItWorks: "Signals you want the unvarnished version, which gives permission to be honest.",
    },
    {
      id: "children-stories-3",
      text: "What\u2019s a family tradition we do that you actually started? How did it begin?",
      whyItWorks: "Traditions feel eternal \u2014 learning one was invented reveals personality and intention.",
    },
    {
      id: "children-stories-4",
      text: "Everyone knows you\u2019re great at [skill]. Who taught you, and what was that like?",
      whyItWorks: "Connects a present-day identity to a specific mentor or moment in the past.",
    },
    {
      id: "children-stories-5",
      text: "What\u2019s a story about our family that I\u2019ve probably heard wrong?",
      whyItWorks: "Invites correction without accusation \u2014 a gentle way to get the real version.",
    },
    {
      id: "children-stories-6",
      text: "What was the hardest decision you ever made for our family?",
      whyItWorks: "Acknowledges invisible sacrifice, which older generations rarely get asked about.",
    },
    {
      id: "children-stories-7",
      text: "Is there a family recipe that has a story nobody talks about?",
      whyItWorks: "Food is a safe entry point into deeper emotional territory.",
    },
    {
      id: "children-stories-8",
      text: "What did your parents think when you told them about [major life decision]?",
      whyItWorks: "Opens a generational layer \u2014 how did their parents react the way you react to me?",
    },
  ],
}

const beforeYouWereYou: PromptCategory = {
  id: "children-before",
  label: "Before You Were You",
  description: "Who were they before kids?",
  icon: "\u23EA",
  prompts: [
    {
      id: "children-before-1",
      text: "What did you dream about becoming before life happened?",
      whyItWorks: "Separates identity from duty \u2014 reveals the person behind the parent.",
    },
    {
      id: "children-before-2",
      text: "What was the wildest thing you did in your twenties?",
      whyItWorks: "Gives explicit permission to share a fun or unexpected side of themselves.",
    },
    {
      id: "children-before-3",
      text: "Who were your closest friends before you had kids? Do you still talk to them?",
      whyItWorks: "Friendships lost to parenthood carry real emotion that rarely gets discussed.",
    },
    {
      id: "children-before-4",
      text: "What did you spend your money on before you had a family?",
      whyItWorks: "Spending habits reveal priorities, passions, and a pre-family identity.",
    },
    {
      id: "children-before-5",
      text: "What\u2019s something you used to do all the time that you gave up when you became a parent?",
      whyItWorks: "Acknowledges sacrifice without making it heavy.",
    },
    {
      id: "children-before-6",
      text: "Tell me about the apartment or house you lived in before I was born.",
      whyItWorks: "Physical spaces anchor vivid, sensory memories.",
    },
    {
      id: "children-before-7",
      text: "What was your first real job? Did you love it or hate it?",
      whyItWorks: "First jobs are full of specific, often funny, formative details.",
    },
    {
      id: "children-before-8",
      text: "What were Saturday nights like before kids?",
      whyItWorks: "Routine questions surface lifestyle details that big questions miss.",
    },
  ],
}

const theHardStuff: PromptCategory = {
  id: "children-hard",
  label: "The Hard Stuff",
  description:
    "These questions touch on deeper experiences. They often lead to the most meaningful stories, but only ask what feels right.",
  icon: "\uD83E\uDE77",
  prompts: [
    {
      id: "children-hard-1",
      text: "What\u2019s something you went through that you think made you stronger?",
      whyItWorks: "Frames hardship through growth, making it easier to approach.",
    },
    {
      id: "children-hard-2",
      text: "Was there a time you felt truly lost? What brought you back?",
      whyItWorks: "The two-part structure lets them choose how deep to go.",
    },
    {
      id: "children-hard-3",
      text: "What\u2019s a mistake you made that turned out to teach you the most?",
      whyItWorks: "Reframes failure as education \u2014 less shame, more story.",
    },
    {
      id: "children-hard-4",
      text: "Is there something you wish you could go back and do differently?",
      whyItWorks: "Open-ended enough to touch any area of life they choose.",
    },
    {
      id: "children-hard-5",
      text: "What was the hardest year of your life, and how did you get through it?",
      whyItWorks: "Pairs difficulty with resilience \u2014 makes the telling feel empowering.",
    },
    {
      id: "children-hard-6",
      text: "Was there someone who let you down when you really needed them?",
      whyItWorks: "Validates that not all relationships are positive, giving permission to share hurt.",
    },
    {
      id: "children-hard-7",
      text: "What\u2019s something you carried alone that you wish you\u2019d had help with?",
      whyItWorks: "Acknowledges invisible burdens, which are often the most emotional stories.",
    },
    {
      id: "children-hard-8",
      text: "Is there anything you wish you\u2019d said to someone but never did?",
      whyItWorks: "Unsaid words carry enormous weight \u2014 this gives them a voice.",
    },
  ],
}

const loveAndRelationships: PromptCategory = {
  id: "children-love",
  label: "Love & Relationships",
  description: "Questions about romance, partnership, and what love taught them",
  icon: "\u2764\uFE0F",
  prompts: [
    {
      id: "children-love-1",
      text: "What\u2019s the moment you knew [partner] was the one?",
      whyItWorks: "Everyone has a version of this story, and they love telling it.",
    },
    {
      id: "children-love-2",
      text: "What was your first heartbreak like?",
      whyItWorks: "First heartbreaks are vivid, formative, and often surprisingly funny in hindsight.",
    },
    {
      id: "children-love-3",
      text: "What\u2019s the best piece of relationship advice nobody gave you?",
      whyItWorks: "Invites hard-won wisdom, not clich\u00E9s.",
    },
    {
      id: "children-love-4",
      text: "What surprised you most about marriage/partnership?",
      whyItWorks: "The gap between expectation and reality is always a rich story.",
    },
    {
      id: "children-love-5",
      text: "Tell me about a time you and [partner] almost didn\u2019t make it.",
      whyItWorks: "Vulnerability about near-misses creates deep, honest conversation.",
    },
    {
      id: "children-love-6",
      text: "What\u2019s the most romantic thing anyone ever did for you?",
      whyItWorks: "Positive and specific \u2014 easy to answer, rich in detail.",
    },
    {
      id: "children-love-7",
      text: "How did your parents\u2019 relationship shape what you looked for in a partner?",
      whyItWorks: "Connects generational patterns in a way that builds understanding.",
    },
    {
      id: "children-love-8",
      text: "What do you know about love now that you wish you\u2019d known at 25?",
      whyItWorks: "Contrasts past and present self \u2014 great for reflective storytelling.",
    },
  ],
}

const workAndPurpose: PromptCategory = {
  id: "children-work",
  label: "Work & Purpose",
  description: "Questions about careers, mentors, and what meaningful work looks like",
  icon: "\uD83D\uDCBC",
  prompts: [
    {
      id: "children-work-1",
      text: "What job taught you the most about yourself?",
      whyItWorks: "Reframes work as self-discovery, not just employment.",
    },
    {
      id: "children-work-2",
      text: "Was there a mentor who changed the direction of your life?",
      whyItWorks: "Mentor stories are full of specific advice, turning points, and gratitude.",
    },
    {
      id: "children-work-3",
      text: "What accomplishment are you most proud of that nobody really knows about?",
      whyItWorks: "Unrecognized achievements carry quiet pride \u2014 people love finally sharing them.",
    },
    {
      id: "children-work-4",
      text: "If you could go back and choose any career, what would you pick?",
      whyItWorks: "Reveals unfulfilled passions and hidden interests.",
    },
    {
      id: "children-work-5",
      text: "What\u2019s the best boss you ever had, and what made them special?",
      whyItWorks: "Boss stories are vivid and character-driven \u2014 natural narrative territory.",
    },
    {
      id: "children-work-6",
      text: "Tell me about a time you stood up for something at work.",
      whyItWorks: "Courage stories reveal values in action.",
    },
    {
      id: "children-work-7",
      text: "What did \u2018success\u2019 mean to you at 30? Has it changed?",
      whyItWorks: "Evolving definitions show personal growth across decades.",
    },
    {
      id: "children-work-8",
      text: "What would you want written on your professional legacy?",
      whyItWorks: "Legacy questions distill a career into what actually mattered.",
    },
  ],
}

const wisdomAndAdvice: PromptCategory = {
  id: "children-wisdom",
  label: "Wisdom & Advice",
  description: "Life lessons distilled from decades of experience",
  icon: "\uD83E\uDDE0",
  prompts: [
    {
      id: "children-wisdom-1",
      text: "What do you know now that you wish someone had told you at my age?",
      whyItWorks: "Directly asks for generational transfer \u2014 feels honoring and practical.",
    },
    {
      id: "children-wisdom-2",
      text: "What\u2019s a rule you live by that most people would find surprising?",
      whyItWorks: "Personal rules are windows into deeply held values.",
    },
    {
      id: "children-wisdom-3",
      text: "If you could guarantee I\u2019d learn one thing from your life, what would it be?",
      whyItWorks: "Forces prioritization \u2014 the single most important lesson.",
    },
    {
      id: "children-wisdom-4",
      text: "What\u2019s the most important thing you\u2019ve learned about people?",
      whyItWorks: "Social wisdom is universal and almost always comes with a story.",
    },
    {
      id: "children-wisdom-5",
      text: "What worry turned out to be completely pointless?",
      whyItWorks: "Retrospective relief is both comforting and often hilarious.",
    },
    {
      id: "children-wisdom-6",
      text: "What\u2019s something everyone stresses about that actually doesn\u2019t matter?",
      whyItWorks: "Permission to let go \u2014 packaged as earned wisdom.",
    },
    {
      id: "children-wisdom-7",
      text: "What\u2019s the bravest thing you\u2019ve ever seen someone do?",
      whyItWorks: "Third-person bravery stories reveal what the teller values most.",
    },
    {
      id: "children-wisdom-8",
      text: "If you could give advice to your 20-year-old self, what would you say?",
      whyItWorks: "Time-travel framing makes abstract wisdom concrete and personal.",
    },
  ],
}

// ---- Grandchildren --------------------------------------------------------

const kidFriendly: PromptCategory = {
  id: "grandkids-kids",
  label: "Kid-Friendly",
  description: "Fun, easy questions for ages 6\u201312",
  icon: "\uD83C\uDF1F",
  prompts: [
    {
      id: "grandkids-kids-1",
      text: "What was your favorite toy when you were my age?",
      whyItWorks: "Concrete and relatable \u2014 kids instantly connect through toys.",
    },
    {
      id: "grandkids-kids-2",
      text: "Did you ever get in trouble at school? What happened?",
      whyItWorks: "Kids love hearing adults got in trouble too \u2014 humanizing and funny.",
    },
    {
      id: "grandkids-kids-3",
      text: "What games did you play outside when you were a kid?",
      whyItWorks: "Outdoor play stories highlight how different childhood used to be.",
    },
    {
      id: "grandkids-kids-4",
      text: "What was your favorite thing to eat when you were little?",
      whyItWorks: "Food memories are sensory and vivid \u2014 easy to recall and fun to share.",
    },
    {
      id: "grandkids-kids-5",
      text: "Did you have a pet? What was it like?",
      whyItWorks: "Pet stories are universally engaging for kids.",
    },
    {
      id: "grandkids-kids-6",
      text: "What was the best birthday present you ever got?",
      whyItWorks: "Specific and exciting \u2014 kids understand birthday magic.",
    },
    {
      id: "grandkids-kids-7",
      text: "What did your house look like when you were growing up?",
      whyItWorks: "Physical description helps kids visualize a world they never saw.",
    },
    {
      id: "grandkids-kids-8",
      text: "What\u2019s the funniest thing that ever happened to you?",
      whyItWorks: "Humor is the easiest bridge between generations.",
    },
    {
      id: "grandkids-kids-9",
      text: "What was school like when you were my age?",
      whyItWorks: "School is shared context \u2014 differences spark curiosity.",
    },
    {
      id: "grandkids-kids-10",
      text: "Did you have a best friend? What did you do together?",
      whyItWorks: "Friendship stories are relatable and rich in detail.",
    },
  ],
}

const teenQuestions: PromptCategory = {
  id: "grandkids-teen",
  label: "Teen Questions",
  description: "For ages 13\u201317 \u2014 a little more real, a little more personal",
  icon: "\uD83C\uDFA7",
  prompts: [
    {
      id: "grandkids-teen-1",
      text: "What were you most afraid of at my age?",
      whyItWorks: "Normalizes fear \u2014 teens need to hear adults were scared too.",
    },
    {
      id: "grandkids-teen-2",
      text: "What\u2019s the bravest thing you ever did as a teenager?",
      whyItWorks: "Bravery stories from teenage years feel directly relevant and inspiring.",
    },
    {
      id: "grandkids-teen-3",
      text: "Did you ever sneak out or break a rule? What happened?",
      whyItWorks: "Rule-breaking stories create trust and show authenticity.",
    },
    {
      id: "grandkids-teen-4",
      text: "What music were you obsessed with when you were my age?",
      whyItWorks: "Music is identity for teens \u2014 past and present.",
    },
    {
      id: "grandkids-teen-5",
      text: "What was the first thing you ever saved up your own money to buy?",
      whyItWorks: "First purchases reveal early values and determination.",
    },
    {
      id: "grandkids-teen-6",
      text: "What did you think your life would look like at this age?",
      whyItWorks: "The gap between teenage expectations and reality is always fascinating.",
    },
    {
      id: "grandkids-teen-7",
      text: "Who was your first crush?",
      whyItWorks: "Universally relatable and almost always leads to a great story.",
    },
    {
      id: "grandkids-teen-8",
      text: "What\u2019s something about being a teenager that hasn\u2019t changed?",
      whyItWorks: "Finding common ground across generations builds real connection.",
    },
    {
      id: "grandkids-teen-9",
      text: "What\u2019s the most embarrassing thing that happened to you in high school?",
      whyItWorks: "Embarrassment stories are bonding gold \u2014 vulnerability through humor.",
    },
    {
      id: "grandkids-teen-10",
      text: "If you could relive one day from when you were my age, which would it be?",
      whyItWorks: "Forces them to pick one peak memory \u2014 always a vivid story.",
    },
  ],
}

const youngAdult: PromptCategory = {
  id: "grandkids-young-adult",
  label: "Young Adult",
  description: "For ages 18\u201325 \u2014 navigating the real world",
  icon: "\uD83C\uDF93",
  prompts: [
    {
      id: "grandkids-young-adult-1",
      text: "How did you figure out what you wanted to do with your life?",
      whyItWorks: "The honest answer is usually 'I didn\u2019t' \u2014 which is exactly what young adults need to hear.",
    },
    {
      id: "grandkids-young-adult-2",
      text: "What\u2019s the biggest mistake you made in your twenties, and what did it teach you?",
      whyItWorks: "Twenties mistakes are formative and reassuring to hear about.",
    },
    {
      id: "grandkids-young-adult-3",
      text: "When did you first feel like an actual adult?",
      whyItWorks: "Most people have a specific, often surprising moment for this.",
    },
    {
      id: "grandkids-young-adult-4",
      text: "What\u2019s something about your generation that you think mine gets wrong?",
      whyItWorks: "Invites honest generational dialogue without being confrontational.",
    },
    {
      id: "grandkids-young-adult-5",
      text: "What was the scariest risk you ever took, and was it worth it?",
      whyItWorks: "Risk stories come with built-in narrative tension.",
    },
    {
      id: "grandkids-young-adult-6",
      text: "How did you handle not knowing what came next?",
      whyItWorks: "Uncertainty is the defining feeling of early adulthood \u2014 this validates it.",
    },
    {
      id: "grandkids-young-adult-7",
      text: "What friendship from your youth do you miss the most?",
      whyItWorks: "Lost friendships carry bittersweet weight that produces rich storytelling.",
    },
    {
      id: "grandkids-young-adult-8",
      text: "What would you do differently if you were starting out today?",
      whyItWorks: "Bridges their experience with your current reality.",
    },
  ],
}

// ---- Friends --------------------------------------------------------------

const storiesBehindThePerson: PromptCategory = {
  id: "friends-stories",
  label: "The Stories Behind the Person",
  description: "Questions that go deeper than small talk with friends",
  icon: "\uD83E\uDEF6",
  prompts: [
    {
      id: "friends-stories-1",
      text: "What\u2019s the origin story of that thing you always say?",
      whyItWorks: "Catchphrases always have a backstory \u2014 this surfaces it.",
    },
    {
      id: "friends-stories-2",
      text: "How did you end up in this town/city/career? Was it planned?",
      whyItWorks: "Most life paths aren\u2019t planned \u2014 the real story is usually better.",
    },
    {
      id: "friends-stories-3",
      text: "What\u2019s something people assume about you that\u2019s completely wrong?",
      whyItWorks: "Correcting assumptions reveals hidden layers.",
    },
    {
      id: "friends-stories-4",
      text: "What\u2019s a skill or hobby you have that most people don\u2019t know about?",
      whyItWorks: "Hidden talents always come with discovery stories.",
    },
    {
      id: "friends-stories-5",
      text: "Tell me about the moment you felt most like yourself.",
      whyItWorks: "Identity-peak moments are deeply personal and rarely asked about.",
    },
    {
      id: "friends-stories-6",
      text: "What\u2019s a story from your life that you think would make a great movie?",
      whyItWorks: "The movie framing encourages dramatic, entertaining storytelling.",
    },
    {
      id: "friends-stories-7",
      text: "Who had the biggest influence on who you became?",
      whyItWorks: "Influence stories reveal values and formative relationships.",
    },
    {
      id: "friends-stories-8",
      text: "What\u2019s the most unexpected thing that ever happened to you?",
      whyItWorks: "Surprise stories have natural narrative energy.",
    },
  ],
}

// ---- Spouses / Partners ---------------------------------------------------

const ourStoryYourVersion: PromptCategory = {
  id: "partner-story",
  label: "Our Story, Your Version",
  description: "See your shared history through their eyes",
  icon: "\uD83D\uDC91",
  prompts: [
    {
      id: "partner-story-1",
      text: "What did you really think the first time you saw me?",
      whyItWorks: "First impressions are always different from what you\u2019d expect.",
    },
    {
      id: "partner-story-2",
      text: "What moment in our relationship scared you the most?",
      whyItWorks: "Fear reveals investment \u2014 they were scared because it mattered.",
    },
    {
      id: "partner-story-3",
      text: "What\u2019s something about me that surprised you after we got together?",
      whyItWorks: "Post-honeymoon discoveries are funny, sweet, and revealing.",
    },
    {
      id: "partner-story-4",
      text: "What\u2019s your favorite ordinary day we\u2019ve had together?",
      whyItWorks: "Ordinary days reveal what they truly value about the relationship.",
    },
    {
      id: "partner-story-5",
      text: "Is there something you\u2019ve never told me about our early days?",
      whyItWorks: "Even long-term partners have untold stories \u2014 this gives permission.",
    },
    {
      id: "partner-story-6",
      text: "What\u2019s the moment you knew this was going to last?",
      whyItWorks: "Commitment moments are deeply romantic and often not the big gestures.",
    },
    {
      id: "partner-story-7",
      text: "What do you think is our greatest achievement as a couple?",
      whyItWorks: "Shared pride strengthens partnership identity.",
    },
    {
      id: "partner-story-8",
      text: "What\u2019s something I do that you hope I never stop doing?",
      whyItWorks: "Specific appreciation is the most powerful form of affirmation.",
    },
  ],
}

// ---------------------------------------------------------------------------
// Relationship groupings
// ---------------------------------------------------------------------------

type RelationshipKey =
  | "adult-children"
  | "grandchildren"
  | "friends"
  | "partner"

const RELATIONSHIP_CATEGORIES: Record<RelationshipKey, PromptCategory[]> = {
  "adult-children": [
    storiesYouThinkYouKnow,
    beforeYouWereYou,
    theHardStuff,
    loveAndRelationships,
    workAndPurpose,
    wisdomAndAdvice,
  ],
  grandchildren: [kidFriendly, teenQuestions, youngAdult],
  friends: [storiesBehindThePerson],
  partner: [ourStoryYourVersion],
}

/** Flat list of every relationship-based category */
export const allRelationshipCategories: PromptCategory[] = Object.values(
  RELATIONSHIP_CATEGORIES
).flat()

// ---------------------------------------------------------------------------
// Themed Packs
// ---------------------------------------------------------------------------

const afraidToAsk: PromptPack = {
  id: "pack-afraid",
  label: "Questions You\u2019re Afraid to Ask",
  description:
    "These might feel scary to ask, but they often lead to the most meaningful conversations.",
  icon: "\uD83D\uDD12",
  badge: "Deep",
  prompts: [
    {
      id: "pack-afraid-1",
      text: "Is there anything you wish you\u2019d apologized for?",
      whyItWorks: "Regret about unspoken apologies carries enormous emotional weight.",
    },
    {
      id: "pack-afraid-2",
      text: "What\u2019s something you\u2019ve never told anyone in the family?",
      whyItWorks: "Direct permission to share a secret \u2014 powerful when the trust is there.",
    },
    {
      id: "pack-afraid-3",
      text: "Was there a time you questioned everything about your life?",
      whyItWorks: "Existential doubt is universal but rarely discussed openly.",
    },
    {
      id: "pack-afraid-4",
      text: "What\u2019s your biggest regret?",
      whyItWorks: "Simple and direct \u2014 sometimes the straightforward question is the brave one.",
    },
    {
      id: "pack-afraid-5",
      text: "Is there someone you\u2019ve lost touch with that you think about?",
      whyItWorks: "Lost connections are a quiet ache most people carry.",
    },
    {
      id: "pack-afraid-6",
      text: "What was the loneliest time in your life?",
      whyItWorks: "Loneliness stories are rarely told but deeply human.",
    },
    {
      id: "pack-afraid-7",
      text: "Did you ever feel trapped? What did you do about it?",
      whyItWorks: "The two parts balance vulnerability with agency.",
    },
    {
      id: "pack-afraid-8",
      text: "What truth about life took you the longest to accept?",
      whyItWorks: "Resistance stories reveal core struggles and eventual peace.",
    },
    {
      id: "pack-afraid-9",
      text: "Is there something you wish our family talked about more openly?",
      whyItWorks: "Meta-question about family communication \u2014 can unlock long-held feelings.",
    },
    {
      id: "pack-afraid-10",
      text: "What are you most afraid of losing?",
      whyItWorks: "Fear of loss reveals what matters most \u2014 simple but profound.",
    },
  ],
}

const legacyQuestions: PromptPack = {
  id: "pack-legacy",
  label: "Legacy Questions",
  description: "The big questions about what matters most.",
  icon: "\uD83C\uDFF0",
  badge: "Essential",
  prompts: [
    {
      id: "pack-legacy-1",
      text: "What do you want your grandchildren to know about you?",
      whyItWorks: "Shifts perspective from present to future \u2014 what do you want to survive?",
    },
    {
      id: "pack-legacy-2",
      text: "What values do you hope our family carries forward?",
      whyItWorks: "Values questions distill a lifetime into principles.",
    },
    {
      id: "pack-legacy-3",
      text: "What\u2019s the most important lesson life taught you?",
      whyItWorks: "Broad but powerful \u2014 the answer reveals their deepest conviction.",
    },
    {
      id: "pack-legacy-4",
      text: "If you could write a letter to be opened in 50 years, what would it say?",
      whyItWorks: "The time-capsule framing inspires thoughtful, lasting words.",
    },
    {
      id: "pack-legacy-5",
      text: "What do you want to be remembered for?",
      whyItWorks: "Direct legacy question \u2014 cuts to the heart of identity.",
    },
    {
      id: "pack-legacy-6",
      text: "What family tradition do you hope never dies?",
      whyItWorks: "Traditions carry values, memories, and identity across generations.",
    },
    {
      id: "pack-legacy-7",
      text: "What\u2019s the best thing about getting older that nobody tells you?",
      whyItWorks: "Counters cultural negativity about aging with earned wisdom.",
    },
    {
      id: "pack-legacy-8",
      text: "What gives your life the most meaning right now?",
      whyItWorks: "Present-tense meaning questions feel immediate and honest.",
    },
    {
      id: "pack-legacy-9",
      text: "If you could pass down one piece of wisdom to every generation after you, what would it be?",
      whyItWorks: "Infinite-audience framing elevates the response to its most essential.",
    },
    {
      id: "pack-legacy-10",
      text: "Looking back at your whole life, what are you most grateful for?",
      whyItWorks: "Gratitude is the perfect closing question \u2014 warm, reflective, and affirming.",
    },
  ],
}

const funAndLight: PromptPack = {
  id: "pack-fun",
  label: "Fun & Light",
  description:
    "Not everything needs to be deep. Sometimes the best stories come from the silliest moments.",
  icon: "\uD83C\uDF89",
  badge: "Fun",
  prompts: [
    {
      id: "pack-fun-1",
      text: "What\u2019s the most ridiculous thing that ever happened to you?",
      whyItWorks: "Open invitation for their best anecdote.",
    },
    {
      id: "pack-fun-2",
      text: "What trend from your era should definitely come back?",
      whyItWorks: "Nostalgia + opinion = animated storytelling.",
    },
    {
      id: "pack-fun-3",
      text: "What did you think the year 2025 would look like?",
      whyItWorks: "Future predictions from the past are always entertaining.",
    },
    {
      id: "pack-fun-4",
      text: "What\u2019s the worst fashion choice you ever made?",
      whyItWorks: "Fashion regrets are universal and always funny.",
    },
    {
      id: "pack-fun-5",
      text: "What\u2019s the most trouble you ever got into with a friend?",
      whyItWorks: "Shared mischief stories are natural buddy-comedy material.",
    },
    {
      id: "pack-fun-6",
      text: "Did you ever win anything? A contest, a bet, a prize?",
      whyItWorks: "Winning stories carry pride and specific details.",
    },
    {
      id: "pack-fun-7",
      text: "What\u2019s the weirdest food you\u2019ve ever eaten?",
      whyItWorks: "Food adventure stories are sensory and often hilarious.",
    },
    {
      id: "pack-fun-8",
      text: "If you could have dinner with anyone from history, who would it be?",
      whyItWorks: "Hypothetical questions reveal values through imagination.",
    },
    {
      id: "pack-fun-9",
      text: "What\u2019s a talent you have that nobody takes seriously?",
      whyItWorks: "Underappreciated skills are a fun, low-stakes topic.",
    },
    {
      id: "pack-fun-10",
      text: "What\u2019s the funniest misunderstanding you\u2019ve ever been part of?",
      whyItWorks: "Misunderstanding stories have natural comedic structure.",
    },
  ],
}

const holidayAndOccasions: PromptPack = {
  id: "pack-holiday",
  label: "Holiday & Occasions",
  description: "Perfect for holidays, birthdays, and special occasions.",
  icon: "\uD83C\uDF84",
  badge: "Seasonal",
  prompts: [
    {
      id: "pack-holiday-1",
      text: "What\u2019s your favorite holiday memory from when you were a child?",
      whyItWorks: "Childhood holiday memories are vivid and emotionally rich.",
    },
    {
      id: "pack-holiday-2",
      text: "What\u2019s the best gift you ever received, and why?",
      whyItWorks: "The 'why' forces the story behind the object.",
    },
    {
      id: "pack-holiday-3",
      text: "Tell me about a birthday that stands out in your memory.",
      whyItWorks: "Birthday standouts are either wonderful or terrible \u2014 both make great stories.",
    },
    {
      id: "pack-holiday-4",
      text: "What\u2019s a holiday tradition your family had that was unique?",
      whyItWorks: "Unique traditions reveal family personality and creativity.",
    },
    {
      id: "pack-holiday-5",
      text: "What was the most memorable Thanksgiving/Christmas/holiday meal?",
      whyItWorks: "Meal memories combine food, family dynamics, and atmosphere.",
    },
    {
      id: "pack-holiday-6",
      text: "Is there a holiday that means more to you now than it did when you were young?",
      whyItWorks: "Evolving meaning shows personal growth and changing priorities.",
    },
    {
      id: "pack-holiday-7",
      text: "What\u2019s the most unexpected thing that ever happened on a holiday?",
      whyItWorks: "Unexpected holiday events are family-legend material.",
    },
    {
      id: "pack-holiday-8",
      text: "What do you wish we\u2019d do more of as a family during the holidays?",
      whyItWorks: "Forward-looking and actionable \u2014 turns stories into new traditions.",
    },
  ],
}

const ALL_PROMPT_PACKS: PromptPack[] = [
  afraidToAsk,
  legacyQuestions,
  funAndLight,
  holidayAndOccasions,
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Get all prompt categories for a specific relationship type */
export function getPromptsForRelationship(
  relationship: string
): PromptCategory[] {
  const key = relationship.toLowerCase() as RelationshipKey
  return RELATIONSHIP_CATEGORIES[key] ?? []
}

/** Get a specific themed pack by ID */
export function getPromptPack(packId: string): PromptPack | undefined {
  return ALL_PROMPT_PACKS.find((pack) => pack.id === packId)
}

/** Get all themed packs */
export function getAllPromptPacks(): PromptPack[] {
  return ALL_PROMPT_PACKS
}

/** Get a random prompt suitable for the given relationship, or from all prompts */
export function getRandomPrompt(relationship?: string): CuratedPrompt {
  let pool: CuratedPrompt[]

  if (relationship) {
    const categories = getPromptsForRelationship(relationship)
    pool = categories.flatMap((cat) => cat.prompts)
  } else {
    pool = [
      ...allRelationshipCategories.flatMap((cat) => cat.prompts),
      ...ALL_PROMPT_PACKS.flatMap((pack) => pack.prompts),
    ]
  }

  // Fallback to all prompts if the relationship key didn't match
  if (pool.length === 0) {
    pool = allRelationshipCategories.flatMap((cat) => cat.prompts)
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

/** Search prompts by keyword (case-insensitive, matches against prompt text) */
export function searchPrompts(query: string): CuratedPrompt[] {
  const lower = query.toLowerCase()

  const all: CuratedPrompt[] = [
    ...allRelationshipCategories.flatMap((cat) => cat.prompts),
    ...ALL_PROMPT_PACKS.flatMap((pack) => pack.prompts),
  ]

  return all.filter((prompt) => prompt.text.toLowerCase().includes(lower))
}
