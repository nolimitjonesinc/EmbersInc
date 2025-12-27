/**
 * Warm Engagement Prompts Library
 * Ported from iOS AIPromptService.swift
 *
 * These prompts are designed to gently draw out memories through
 * sensory triggers, emotional connections, and relational anchors.
 */

export interface PromptWithFollowUp {
  question: string
  followUp: string
  example: string
}

/**
 * Connection prompts - sensory and relational triggers
 */
export const connectionPrompts: PromptWithFollowUp[] = [
  {
    question: "You know that feeling when a certain smell instantly takes you back? What scent always brings back memories for you?",
    followUp: "That's fascinating! What moment does it transport you to?",
    example: "For me, the smell of fresh bread always reminds me of Sunday mornings at my grandmother's house..."
  },
  {
    question: "If you could have dinner with any family member from any generation - past or present - who would you choose?",
    followUp: "That's such an interesting choice! What made you pick them specifically?",
    example: "I once heard someone say they'd choose their great-grandfather who was a street musician in New Orleans..."
  },
  {
    question: "What sound from your childhood can you still hear perfectly in your mind?",
    followUp: "Close your eyes and tell me what you see when you hear that sound.",
    example: "The screen door slamming, your mother calling you in for dinner, the ice cream truck..."
  },
  {
    question: "If your childhood home could talk, what story would it tell about your family?",
    followUp: "What room would have the most stories to share?",
    example: "The kitchen that saw every holiday, the basement where adventures happened..."
  },
  {
    question: "What's a song that instantly takes you back to a specific moment in your life?",
    followUp: "Tell me about that moment - where were you? Who were you with?",
    example: "Sometimes just a few notes can transport us decades back..."
  }
]

/**
 * Yearly highlights - milestone and era-based prompts
 */
export const yearlyHighlightPrompts: PromptWithFollowUp[] = [
  {
    question: "What year would you say was your 'main character' year - when everything seemed to be happening?",
    followUp: "What made that year so special?",
    example: "Someone once told me about their 1985 - they graduated, met their spouse, and moved to a new city all within months..."
  },
  {
    question: "If you could relive one summer from your past, which would it be?",
    followUp: "What made that summer so magical?",
    example: "Those endless summer days that seemed to last forever..."
  },
  {
    question: "What decade of your life has been the most transformative?",
    followUp: "How did you become different from who you were before?",
    example: "Whether it's your 20s finding yourself or your 50s finding peace..."
  }
]

/**
 * Emotional connection prompts - deep relational memories
 */
export const emotionalConnectionPrompts: PromptWithFollowUp[] = [
  {
    question: "What's a tiny moment with someone you love that might seem ordinary to others but means the world to you?",
    followUp: "Why do you think that particular moment stuck with you?",
    example: "The way my dad would always pretend to 'find' quarters behind my ear..."
  },
  {
    question: "Who made you feel truly seen and understood when you were growing up?",
    followUp: "Can you tell me about a specific time they showed you that?",
    example: "Sometimes it's a teacher, a grandparent, or an unexpected friend..."
  },
  {
    question: "What's the bravest thing you've ever seen someone in your family do?",
    followUp: "How did witnessing that shape who you became?",
    example: "Acts of courage come in many forms - big and small..."
  },
  {
    question: "Is there something you wish you had asked someone before they were gone?",
    followUp: "What do you think they might have said?",
    example: "We often wish we'd asked more questions when we had the chance..."
  },
  {
    question: "What's a piece of advice you were given that you didn't understand until years later?",
    followUp: "What happened that finally made it click?",
    example: "Wisdom often arrives before we're ready to receive it..."
  }
]

/**
 * Memory prompts organized by category (from iOS MemoryPrompts struct)
 */
export const familyMemberPrompts: PromptWithFollowUp[] = [
  {
    question: "What's that one recipe that instantly reminds you of your grandmother? Can you walk me through how she made it?",
    followUp: "What would she do that made her version special?",
    example: "Like how some grandmothers never measure ingredients - they just know by feel..."
  },
  {
    question: "What's the most valuable lesson your father ever taught you? Was it through words or actions?",
    followUp: "How has that lesson shaped your life since then?",
    example: "Someone once told me about how their dad taught them persistence by fixing their bike together..."
  },
  {
    question: "What family tradition makes you smile every time you think about it?",
    followUp: "Who started that tradition, and how has it evolved over the years?",
    example: "Like those Sunday dinners where everyone had to bring something new to try..."
  },
  {
    question: "Who in your family was the best storyteller? What kind of stories did they tell?",
    followUp: "Is there a particular story of theirs you remember?",
    example: "Every family has that one person who could hold a room spellbound..."
  },
  {
    question: "What did your mother's hands look like? What do you remember them doing?",
    followUp: "What's a specific memory those hands bring back?",
    example: "Hands tell stories - cooking, comforting, creating..."
  }
]

export const timeframePrompts: PromptWithFollowUp[] = [
  {
    question: "If you could spend one more day in your childhood home, which room would you visit first?",
    followUp: "What specific memories come flooding back in that space?",
    example: "The kitchen where mom always had something baking, or maybe that corner where you used to read..."
  },
  {
    question: "What's your most vivid memory from those endless summer days as a kid?",
    followUp: "What made those summers feel so magical?",
    example: "The ice cream truck music, sprinklers on hot days, staying out until the streetlights came on..."
  },
  {
    question: "What did a typical Sunday look like in your family when you were growing up?",
    followUp: "How did those Sundays shape your sense of family?",
    example: "Church, family dinners, lazy afternoons..."
  },
  {
    question: "What was your neighborhood like when you were young?",
    followUp: "Who were the characters that made it memorable?",
    example: "The neighbors, the corner store, the place where everyone gathered..."
  }
]

export const themePrompts: PromptWithFollowUp[] = [
  {
    question: "What's a small family moment that ended up having a big impact on your life?",
    followUp: "When did you realize how significant that moment was?",
    example: "Sometimes it's the quiet moments, like watching your parent help a stranger..."
  },
  {
    question: "What's a skill or hobby that's been passed down through your family?",
    followUp: "Who taught you, and how did they make learning it special?",
    example: "Whether it's cooking, crafting, or fixing things - there's often a story behind these skills..."
  },
  {
    question: "What's the funniest thing that ever happened at a family gathering?",
    followUp: "How does your family still tell that story today?",
    example: "Every family has those legendary moments that get retold every holiday..."
  },
  {
    question: "What was something your family did that you thought was normal until you realized other families didn't do it?",
    followUp: "How did that discovery change how you saw your family?",
    example: "Those quirky traditions that feel universal until you learn otherwise..."
  },
  {
    question: "What's something you inherited - not an object, but a trait or way of being - from someone in your family?",
    followUp: "How do you see that trait showing up in your own life?",
    example: "A laugh, a saying, a way of approaching problems..."
  }
]

/**
 * All prompts combined for random selection
 */
export const allWarmPrompts: PromptWithFollowUp[] = [
  ...connectionPrompts,
  ...yearlyHighlightPrompts,
  ...emotionalConnectionPrompts,
  ...familyMemberPrompts,
  ...timeframePrompts,
  ...themePrompts
]

/**
 * Get a random prompt from all categories
 */
export function getRandomWarmPrompt(): PromptWithFollowUp {
  return allWarmPrompts[Math.floor(Math.random() * allWarmPrompts.length)]
}

/**
 * Get a random prompt from a specific category
 */
export function getPromptByCategory(category: 'connection' | 'yearly' | 'emotional' | 'family' | 'timeframe' | 'theme'): PromptWithFollowUp {
  const categoryMap = {
    connection: connectionPrompts,
    yearly: yearlyHighlightPrompts,
    emotional: emotionalConnectionPrompts,
    family: familyMemberPrompts,
    timeframe: timeframePrompts,
    theme: themePrompts
  }
  const prompts = categoryMap[category]
  return prompts[Math.floor(Math.random() * prompts.length)]
}

/**
 * Get prompts matching user interests
 */
export function getPromptsForInterests(interests: string[]): PromptWithFollowUp[] {
  const matchingPrompts: PromptWithFollowUp[] = []

  if (interests.includes('family') || interests.includes('traditions')) {
    matchingPrompts.push(...familyMemberPrompts)
  }
  if (interests.includes('childhood') || interests.includes('growing-up')) {
    matchingPrompts.push(...timeframePrompts)
  }
  if (interests.includes('pivotal') || interests.includes('achievements')) {
    matchingPrompts.push(...yearlyHighlightPrompts)
  }
  if (interests.includes('wisdom') || interests.includes('lessons')) {
    matchingPrompts.push(...themePrompts)
  }
  if (interests.includes('adventures') || interests.includes('dreams')) {
    matchingPrompts.push(...emotionalConnectionPrompts)
  }

  // If no specific matches, return connection prompts (good for everyone)
  if (matchingPrompts.length === 0) {
    return connectionPrompts
  }

  return matchingPrompts
}
