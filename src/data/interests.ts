/**
 * Interest Categories
 * Ported from iOS OnboardingFlow.swift
 *
 * These categories help personalize the storytelling experience
 * by focusing on what matters most to the user.
 */

export interface InterestSubcategory {
  id: string
  label: string
}

export interface InterestItem {
  id: string
  title: string
  description: string
  subcategories: InterestSubcategory[]
  icon: string // emoji
  color: string // tailwind color
}

export interface InterestCategory {
  id: string
  title: string
  description: string
  items: InterestItem[]
}

export const interestCategories: InterestCategory[] = [
  {
    id: 'defining-moments',
    title: 'Defining Moments',
    description: 'The experiences that shaped who you are',
    items: [
      {
        id: 'pivotal',
        title: 'Pivotal Decisions',
        description: 'Choices that changed everything',
        icon: '🔀',
        color: 'amber',
        subcategories: [
          { id: 'road-not-taken', label: 'The Road Not Taken' },
          { id: 'leap-of-faith', label: 'Leap of Faith Moments' },
          { id: 'life-changing-encounters', label: 'Life-Changing Encounters' },
          { id: 'turning-points', label: 'Turning Point Stories' },
          { id: 'unexpected-detours', label: 'Unexpected Detours' }
        ]
      },
      {
        id: 'achievements',
        title: 'Personal Victories',
        description: 'Triumphs big and small',
        icon: '🏆',
        color: 'yellow',
        subcategories: [
          { id: 'against-all-odds', label: 'Against All Odds' },
          { id: 'hidden-strengths', label: 'Hidden Strengths' },
          { id: 'proud-accomplishments', label: 'Proud Accomplishments' },
          { id: 'learning-from-failure', label: 'Learning from Failure' },
          { id: 'sweet-success', label: 'Sweet Success' }
        ]
      }
    ]
  },
  {
    id: 'living-legacy',
    title: 'Living Legacy',
    description: 'Wisdom and traditions worth passing on',
    items: [
      {
        id: 'wisdom',
        title: 'Gathered Wisdom',
        description: 'Life lessons worth sharing',
        icon: '💡',
        color: 'blue',
        subcategories: [
          { id: 'hard-earned-insights', label: 'Hard-Earned Insights' },
          { id: 'family-philosophies', label: 'Family Philosophies' },
          { id: 'valuable-mistakes', label: 'Valuable Mistakes' },
          { id: 'guiding-principles', label: 'Guiding Principles' },
          { id: 'words-to-remember', label: 'Words to Remember' }
        ]
      },
      {
        id: 'traditions',
        title: 'Family Traditions',
        description: 'Stories that bind generations',
        icon: '🎄',
        color: 'green',
        subcategories: [
          { id: 'holiday-rituals', label: 'Holiday Rituals' },
          { id: 'special-celebrations', label: 'Special Celebrations' },
          { id: 'passed-down-recipes', label: 'Passed-Down Recipes' },
          { id: 'family-sayings', label: 'Family Sayings' },
          { id: 'meaningful-customs', label: 'Meaningful Customs' }
        ]
      }
    ]
  },
  {
    id: 'untold-stories',
    title: 'Untold Stories',
    description: 'Tales waiting to be shared',
    items: [
      {
        id: 'adventures',
        title: 'Hidden Adventures',
        description: 'Tales waiting to be shared',
        icon: '🗺️',
        color: 'purple',
        subcategories: [
          { id: 'secret-journeys', label: 'Secret Journeys' },
          { id: 'unexpected-discoveries', label: 'Unexpected Discoveries' },
          { id: 'memorable-characters', label: 'Memorable Characters' },
          { id: 'chance-encounters', label: 'Chance Encounters' },
          { id: 'magical-moments', label: 'Magical Moments' }
        ]
      },
      {
        id: 'dreams',
        title: 'Dreams & Aspirations',
        description: 'Hope for tomorrow',
        icon: '✨',
        color: 'pink',
        subcategories: [
          { id: 'future-visions', label: 'Future Visions' },
          { id: 'personal-dreams', label: 'Personal Dreams' },
          { id: 'family-hopes', label: 'Family Hopes' },
          { id: 'legacy-wishes', label: 'Legacy Wishes' },
          { id: 'tomorrows-stories', label: "Tomorrow's Stories" }
        ]
      }
    ]
  }
]

/**
 * Get all interest items flattened
 */
export function getAllInterestItems(): InterestItem[] {
  return interestCategories.flatMap(cat => cat.items)
}

/**
 * Get interest item by ID
 */
export function getInterestById(id: string): InterestItem | undefined {
  return getAllInterestItems().find(item => item.id === id)
}

/**
 * Get category by interest ID
 */
export function getCategoryForInterest(interestId: string): InterestCategory | undefined {
  return interestCategories.find(cat => cat.items.some(item => item.id === interestId))
}
