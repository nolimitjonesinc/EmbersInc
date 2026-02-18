/**
 * Local-to-Cloud Story Migration
 *
 * When an anonymous user signs up via the AuthGate,
 * migrate their localStorage stories to Supabase.
 * Called once after successful authentication.
 */

interface LocalStory {
  id: string;
  title: string;
  content: string;
  messages: unknown[];
  created_at: string;
  userName?: string;
}

export async function migrateLocalStories(): Promise<{
  migrated: number;
  failed: number;
}> {
  let migrated = 0;
  let failed = 0;

  try {
    const storiesStr = localStorage.getItem('embers_local_stories');
    if (!storiesStr) return { migrated: 0, failed: 0 };

    const stories: LocalStory[] = JSON.parse(storiesStr);
    if (!Array.isArray(stories) || stories.length === 0) {
      return { migrated: 0, failed: 0 };
    }

    for (const story of stories) {
      try {
        const response = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: story.content,
            messages: story.messages,
            title: story.title,
            generateNarrative: true,
            generateTitle: !story.title || story.title === 'Your Story',
            rawTranscript: story.content,
            conversationMessages: story.messages,
          }),
        });

        if (response.ok) {
          migrated++;
        } else {
          console.warn('[Migration] Failed to migrate story:', story.id, response.status);
          failed++;
        }
      } catch (err) {
        console.warn('[Migration] Error migrating story:', story.id, err);
        failed++;
      }
    }

    // Clear local stories only if at least one migrated
    if (migrated > 0) {
      localStorage.removeItem('embers_local_stories');
    }
  } catch (err) {
    console.warn('[Migration] Could not parse local stories:', err);
  }

  return { migrated, failed };
}
