// ============================================================================
// Embers Family Prompt Library
// ============================================================================
// A comprehensive collection of conversation prompts organized by relationship
// type and themed packs. Each prompt is designed to elicit specific, story-rich
// responses from elderly users during AI-guided conversation sessions.
//
// Usage: Import categories or packs, then pass selected prompts to the Ember
// AI host to weave into the next conversation session.
// ============================================================================

export interface Prompt {
  id: string;
  text: string;
  /** Optional note explaining why this question is effective */
  insight?: string;
}

export interface PromptCategory {
  id: string;
  title: string;
  description: string;
  prompts: Prompt[];
}

export interface PromptSection {
  id: string;
  relationshipType: string;
  label: string;
  description: string;
  categories: PromptCategory[];
}

export interface ThemedPack {
  id: string;
  title: string;
  description: string;
  /** Optional note shown to the family member before they browse */
  preface?: string;
  prompts: Prompt[];
}

// ============================================================================
// RELATIONSHIP-BASED SECTIONS
// ============================================================================

export const relationshipSections: PromptSection[] = [
  // --------------------------------------------------------------------------
  // ADULT CHILDREN (asking parents / grandparents)
  // --------------------------------------------------------------------------
  {
    id: "adult-children",
    relationshipType: "adult-child",
    label: "For Adult Children",
    description:
      "Questions for sons and daughters to ask their parents or grandparents. These go deeper than the stories you've already heard.",
    categories: [
      {
        id: "stories-you-think-you-know",
        title: "The Stories You Think You Know",
        description:
          "You've heard the family classics a hundred times. These questions crack them open from a new angle.",
        prompts: [
          {
            id: "ac-styk-1",
            text: "You always talk about moving to [place] — but what were you leaving behind?",
            insight:
              "Reframing a familiar story around loss instead of arrival often reveals emotions the teller has never voiced. People rehearse the adventure version; the goodbye version is where the real story lives.",
          },
          {
            id: "ac-styk-2",
            text: "You've told me about meeting [parent/spouse] — but what was your life like the week before you met them? What were you hoping for?",
          },
          {
            id: "ac-styk-3",
            text: "The story about [family event] always ends at the same place. What happened in the days after? How did life feel different?",
            insight:
              "Family stories get polished into set pieces with tidy endings. Asking about the aftermath reopens the narrative and often surfaces the real meaning of the event.",
          },
          {
            id: "ac-styk-4",
            text: "Everyone says [family member] was [trait — 'the funny one,' 'the tough one']. What's a moment that doesn't fit that label?",
          },
          {
            id: "ac-styk-5",
            text: "You grew up hearing stories about [grandparent/ancestor]. Which one turned out to be exaggerated — and which one turned out to be even wilder than you thought?",
          },
          {
            id: "ac-styk-6",
            text: "There's a photo of you at [event/age]. I know the basics — but what were you actually thinking or feeling that day?",
          },
          {
            id: "ac-styk-7",
            text: "The family always laughs about [funny story]. Was it actually funny at the time, or did it become funny later?",
          },
          {
            id: "ac-styk-8",
            text: "I know you lived through [historical event]. But I don't know what an ordinary Tuesday looked like for you during that time. Can you walk me through one?",
            insight:
              "Big history gets taught in headlines. Personal history lives in the mundane details — what they ate, who they talked to, what the weather was like. Those details make a memory feel real.",
          },
          {
            id: "ac-styk-9",
            text: "Is there a version of a family story that you've never corrected, even though you remember it differently?",
          },
          {
            id: "ac-styk-10",
            text: "What's a story your parents told about themselves that you only understood once you were older?",
          },
        ],
      },
      {
        id: "before-you-were-you",
        title: "Before You Were You",
        description:
          "Who were they before parenthood? The dreams, the wild years, the roads not taken.",
        prompts: [
          {
            id: "ac-bywy-1",
            text: "Before you had kids, what did you think your life was going to look like?",
            insight:
              "This question is powerful because it doesn't assume regret. It simply opens space for them to talk about a version of themselves their children have never met.",
          },
          {
            id: "ac-bywy-2",
            text: "What was the most alive you ever felt in your twenties?",
          },
          {
            id: "ac-bywy-3",
            text: "Was there a talent or passion you quietly let go of when adult life took over? Do you ever miss it?",
          },
          {
            id: "ac-bywy-4",
            text: "Who was your closest friend before I was born? What made you two click?",
          },
          {
            id: "ac-bywy-5",
            text: "What was the wildest or most spontaneous thing you ever did — the kind of thing you'd ground me for?",
          },
          {
            id: "ac-bywy-6",
            text: "What did you spend your money on before you had a family to support?",
          },
          {
            id: "ac-bywy-7",
            text: "Was there a place you used to go that felt like it was yours — a bar, a park, a friend's kitchen?",
          },
          {
            id: "ac-bywy-8",
            text: "What kind of music made you feel something when you were young? Is there a song that still takes you back?",
          },
          {
            id: "ac-bywy-9",
            text: "If you could go back and spend one more evening with your younger self, where would you find them?",
          },
          {
            id: "ac-bywy-10",
            text: "What's something you were really good at that your kids never got to see?",
            insight:
              "Parents are often only known in their parent role. This question invites them to show a skill, a strength, or a side of themselves that got filed away.",
          },
        ],
      },
      {
        id: "the-hard-stuff",
        title: "The Hard Stuff",
        description:
          "Questions about loss, failure, fear, and regret — phrased with enough warmth that they feel safe to answer.",
        prompts: [
          {
            id: "ac-ths-1",
            text: "What's the hardest decision you ever had to make where you still aren't sure you got it right?",
          },
          {
            id: "ac-ths-2",
            text: "Was there a time you felt truly alone — like nobody understood what you were going through?",
            insight:
              "Loneliness is one of the most universal human experiences, but one of the least discussed across generations. This question gives permission to be vulnerable without demanding it.",
          },
          {
            id: "ac-ths-3",
            text: "Did you ever have to forgive someone for something that felt unforgivable? How did you get there?",
          },
          {
            id: "ac-ths-4",
            text: "What's a loss that changed the way you see the world — not just made you sad, but actually shifted something inside you?",
          },
          {
            id: "ac-ths-5",
            text: "Was there a time when the family was struggling financially and you were scared? What got you through?",
          },
          {
            id: "ac-ths-6",
            text: "Is there something you wish you'd said to someone who's no longer here?",
          },
          {
            id: "ac-ths-7",
            text: "What's the closest you ever came to giving up on something important — and what pulled you back?",
          },
          {
            id: "ac-ths-8",
            text: "Did you ever have to pretend to be okay for the sake of your family? What was really going on?",
            insight:
              "Parents — especially from older generations — often carried enormous weight in silence. This question honors that sacrifice while gently opening the door to release it.",
          },
          {
            id: "ac-ths-9",
            text: "What's something about aging that nobody warned you about?",
          },
          {
            id: "ac-ths-10",
            text: "Was there a moment when you realized your own parents were just people, doing their best? What happened?",
          },
          {
            id: "ac-ths-11",
            text: "Is there a part of our family history that you think is important for me to know, even if it's not easy to talk about?",
          },
        ],
      },
      {
        id: "love-and-relationships",
        title: "Love & Relationships",
        description:
          "First loves, lasting partnerships, and everything they've learned about the heart.",
        prompts: [
          {
            id: "ac-lar-1",
            text: "Who was your first crush, and what made them so magnetic to you?",
          },
          {
            id: "ac-lar-2",
            text: "When you met [spouse/partner], was it instant or did it sneak up on you?",
          },
          {
            id: "ac-lar-3",
            text: "What's the closest you and [spouse/partner] ever came to not making it — and what held you together?",
            insight:
              "Most couples have a near-miss story they've never told their kids. This question normalizes that marriage is work, and their answer often contains the deepest wisdom about love.",
          },
          {
            id: "ac-lar-4",
            text: "What did you learn about love from watching your own parents?",
          },
          {
            id: "ac-lar-5",
            text: "What's the most romantic thing anyone ever did for you — the thing that still makes you smile?",
          },
          {
            id: "ac-lar-6",
            text: "Was there someone you loved who got away? Not in a regretful way — just a 'what if' that crosses your mind?",
          },
          {
            id: "ac-lar-7",
            text: "What do you know about love now that you wish you'd understood at 25?",
          },
          {
            id: "ac-lar-8",
            text: "What's the most important thing you and [spouse/partner] disagree on — and how have you managed it all these years?",
          },
          {
            id: "ac-lar-9",
            text: "If you could relive one day with [spouse/partner], which day would you pick?",
          },
          {
            id: "ac-lar-10",
            text: "What's the kindest thing anyone has ever done for you?",
            insight:
              "Simple and open-ended, but it almost always surfaces a deeply personal story. People remember kindness in vivid detail.",
          },
        ],
      },
      {
        id: "work-and-purpose",
        title: "Work & Purpose",
        description:
          "Career stories, pride, and the things they'd do differently.",
        prompts: [
          {
            id: "ac-wap-1",
            text: "What was your very first job, and what did it teach you about the world?",
          },
          {
            id: "ac-wap-2",
            text: "Was there a boss, teacher, or mentor who changed the direction of your life? What did they do?",
          },
          {
            id: "ac-wap-3",
            text: "What's the proudest you've ever been of something you built, created, or accomplished at work?",
          },
          {
            id: "ac-wap-4",
            text: "Did you ever feel like you were in the wrong career? What kept you going — or what made you switch?",
            insight:
              "Many people from older generations stayed in jobs out of obligation, not passion. This question opens the door to talk about duty, sacrifice, and what 'purpose' actually meant to them.",
          },
          {
            id: "ac-wap-5",
            text: "What's a skill you developed at work that you ended up using everywhere in life?",
          },
          {
            id: "ac-wap-6",
            text: "Were you ever fired, laid off, or passed over for something you deserved? How did you handle it?",
          },
          {
            id: "ac-wap-7",
            text: "If money and responsibility hadn't been factors, what would you have done with your working years?",
          },
          {
            id: "ac-wap-8",
            text: "What did retirement feel like — or what do you think it will feel like? Was it relief, loss, or something else?",
          },
          {
            id: "ac-wap-9",
            text: "What's a challenge you faced at work that taught you something you still carry today?",
          },
          {
            id: "ac-wap-10",
            text: "Did you ever take a big risk — quit a job, start something, move for an opportunity? How did it turn out?",
          },
        ],
      },
      {
        id: "wisdom-and-advice",
        title: "Wisdom & Advice",
        description:
          "The things they wish they'd known, the advice they want to pass on.",
        prompts: [
          {
            id: "ac-waa-1",
            text: "What's a piece of advice someone gave you that you ignored — and later realized they were right?",
          },
          {
            id: "ac-waa-2",
            text: "If you could go back and tell your 30-year-old self one thing, what would it be?",
          },
          {
            id: "ac-waa-3",
            text: "What's a rule you lived by that served you well? And is there one that held you back?",
            insight:
              "This dual question lets them share wisdom and regret in the same breath. The 'held you back' half often reveals beliefs they've quietly outgrown — and that's where the real wisdom is.",
          },
          {
            id: "ac-waa-4",
            text: "What's the most important thing you've learned about people?",
          },
          {
            id: "ac-waa-5",
            text: "What do you think our family does well — and what do you wish we'd do more of?",
          },
          {
            id: "ac-waa-6",
            text: "What's a mistake you made that turned out to be one of the best things that ever happened to you?",
          },
          {
            id: "ac-waa-7",
            text: "What's something the younger generation doesn't understand yet — something that only time can teach?",
          },
          {
            id: "ac-waa-8",
            text: "If you could protect me from one thing in life, what would it be — and do you think protection is even the right approach?",
          },
          {
            id: "ac-waa-9",
            text: "What does a good life look like to you? Has your answer changed over the years?",
            insight:
              "This is a legacy question disguised as a simple one. Their answer reveals their deepest values — and hearing how the answer has evolved shows the wisdom of a whole lifetime.",
          },
          {
            id: "ac-waa-10",
            text: "Is there a lesson you tried to teach me when I was younger that you're not sure landed? Tell me now — I'm ready.",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // GRANDCHILDREN (asking grandparents)
  // --------------------------------------------------------------------------
  {
    id: "grandchildren",
    relationshipType: "grandchild",
    label: "For Grandchildren",
    description:
      "Age-appropriate questions for grandchildren to send to their grandparents. Sorted by age range so the tone always fits.",
    categories: [
      {
        id: "kid-friendly",
        title: "Kid-Friendly (Ages 6-12)",
        description:
          "Simple, fun, and curiosity-driven. Perfect for young grandchildren who want to know what life was like 'in the old days.'",
        prompts: [
          {
            id: "gc-kf-1",
            text: "What was your favorite toy when you were my age? How did you play with it?",
          },
          {
            id: "gc-kf-2",
            text: "Did you ever get in trouble at school? What happened?",
            insight:
              "Kids love hearing that adults were once rule-breakers too. This question builds connection through shared mischief and makes grandparents more relatable.",
          },
          {
            id: "gc-kf-3",
            text: "What did you eat for lunch when you were a kid? Was the food different back then?",
          },
          {
            id: "gc-kf-4",
            text: "Did you have a pet? What was its name and what was it like?",
          },
          {
            id: "gc-kf-5",
            text: "What was your favorite thing to do on a snow day (or a hot summer day)?",
          },
          {
            id: "gc-kf-6",
            text: "What was the best birthday present you ever got as a kid?",
          },
          {
            id: "gc-kf-7",
            text: "Did you have a best friend growing up? What did you two do together?",
            insight:
              "Friendship stories are naturally vivid and emotional. Kids can immediately relate, and grandparents light up recalling their childhood companions.",
          },
          {
            id: "gc-kf-8",
            text: "What was your house like when you were little? Did you share a room?",
          },
          {
            id: "gc-kf-9",
            text: "What was the scariest thing that ever happened to you as a kid — and how did it turn out?",
          },
          {
            id: "gc-kf-10",
            text: "If you could have any superpower, what would you pick and why?",
          },
          {
            id: "gc-kf-11",
            text: "What games did kids play at recess when you were in school?",
          },
          {
            id: "gc-kf-12",
            text: "What did you want to be when you grew up — and did it come true?",
          },
        ],
      },
      {
        id: "teen-questions",
        title: "Teen Questions (Ages 13-17)",
        description:
          "Deeper and more personal, but still in a voice that feels natural for a teenager. Real questions, not homework assignments.",
        prompts: [
          {
            id: "gc-tq-1",
            text: "What were you most afraid of when you were my age? Did you ever get over it?",
          },
          {
            id: "gc-tq-2",
            text: "What's the bravest thing you ever did?",
          },
          {
            id: "gc-tq-3",
            text: "Did you ever feel like you didn't fit in? What did you do about it?",
            insight:
              "Teens wrestling with identity and belonging are often shocked to learn their grandparents felt the same way. This creates deep empathy across generations.",
          },
          {
            id: "gc-tq-4",
            text: "What was dating like when you were a teenager? What were the rules?",
          },
          {
            id: "gc-tq-5",
            text: "What's the most embarrassing thing that ever happened to you?",
          },
          {
            id: "gc-tq-6",
            text: "Was there a moment when you realized you were becoming an adult — like something shifted?",
          },
          {
            id: "gc-tq-7",
            text: "What's the best piece of advice anyone ever gave you?",
          },
          {
            id: "gc-tq-8",
            text: "Did your parents understand you? Was there something you wish they'd known?",
          },
          {
            id: "gc-tq-9",
            text: "What's a song, movie, or book from your teenage years that you still love?",
          },
          {
            id: "gc-tq-10",
            text: "If you could go back to high school for one day, what would you do?",
            insight:
              "This question is playful enough to be fun but revealing enough to surface real nostalgia and even unfinished emotional business.",
          },
          {
            id: "gc-tq-11",
            text: "What's something about your generation that people get wrong?",
          },
          {
            id: "gc-tq-12",
            text: "What did you and your friends argue about back then?",
          },
        ],
      },
      {
        id: "young-adult",
        title: "Young Adult (Ages 18-25)",
        description:
          "Peer-level questions from young adults who are starting to realize their grandparents have navigated the same uncertainties they're facing now.",
        prompts: [
          {
            id: "gc-ya-1",
            text: "How did you figure out what you wanted to do with your life — or did you just fall into it?",
          },
          {
            id: "gc-ya-2",
            text: "What's the biggest mistake you made in your twenties, and would you change it if you could?",
            insight:
              "Young adults are terrified of making irreversible mistakes. Hearing that their grandparents survived theirs — and maybe even benefited — is genuinely comforting.",
          },
          {
            id: "gc-ya-3",
            text: "What did you think love was supposed to feel like at my age — and how did reality compare?",
          },
          {
            id: "gc-ya-4",
            text: "Were your parents supportive of your choices, or did you have to forge your own path?",
          },
          {
            id: "gc-ya-5",
            text: "What's something you believed strongly in your twenties that you've completely changed your mind about?",
          },
          {
            id: "gc-ya-6",
            text: "Was there a friend, partner, or mentor who shaped who you became — someone I might not know about?",
          },
          {
            id: "gc-ya-7",
            text: "How did you handle being broke? Was there a time when money was genuinely scary?",
          },
          {
            id: "gc-ya-8",
            text: "What does success mean to you? Has your definition changed?",
          },
          {
            id: "gc-ya-9",
            text: "Looking at the world today, what gives you hope — and what worries you?",
          },
          {
            id: "gc-ya-10",
            text: "Is there something about your life that you've never told anyone in our family?",
          },
          {
            id: "gc-ya-11",
            text: "What's a moment in your life when everything felt uncertain — and how did you decide what to do?",
            insight:
              "Uncertainty is the defining experience of the 18-25 age range. Hearing a grandparent describe navigating the same fog makes them feel less alone and more capable.",
          },
          {
            id: "gc-ya-12",
            text: "If you were my age right now, in this world, what would you do differently?",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // FRIENDS (asking friends)
  // --------------------------------------------------------------------------
  {
    id: "friends",
    relationshipType: "friend",
    label: "For Friends",
    description:
      "Questions from friends who want to capture the stories behind the person they know — and the ones they don't.",
    categories: [
      {
        id: "stories-behind-the-person",
        title: "The Stories Behind the Person",
        description:
          "Every quirk, habit, and saying has an origin story. These questions find it.",
        prompts: [
          {
            id: "fr-sbp-1",
            text: "You always say [phrase/expression] — where did you pick that up?",
          },
          {
            id: "fr-sbp-2",
            text: "What's the origin story of [their hobby, habit, or interest]? How did you get into it?",
            insight:
              "People rarely get asked HOW they became who they are. The origin story of a passion is almost always more interesting than the passion itself.",
          },
          {
            id: "fr-sbp-3",
            text: "What's a part of your life that most people in your current world don't know about?",
          },
          {
            id: "fr-sbp-4",
            text: "What's the most 'you' thing you've ever done — the story that perfectly captures who you are?",
          },
          {
            id: "fr-sbp-5",
            text: "Who were you before I knew you? What phase of life were you in?",
          },
          {
            id: "fr-sbp-6",
            text: "What's a strong opinion you hold that surprises people?",
          },
          {
            id: "fr-sbp-7",
            text: "Is there a place that shaped who you are — a city, a neighborhood, a building?",
          },
          {
            id: "fr-sbp-8",
            text: "What's the most unexpected turn your life has taken?",
            insight:
              "This question respects the reality that most lives don't follow a plan. The unexpected turns are usually the most formative — and the most fun to tell.",
          },
          {
            id: "fr-sbp-9",
            text: "What's a tradition or ritual you've kept your whole life — something you do that most people wouldn't notice?",
          },
          {
            id: "fr-sbp-10",
            text: "Who in your life would you say knows you best — and what do they see that others miss?",
          },
        ],
      },
      {
        id: "shared-history",
        title: "Shared History",
        description:
          "Prompts designed to unlock joint memories and capture how a friendship has shaped both people.",
        prompts: [
          {
            id: "fr-sh-1",
            text: "What's your favorite memory of the two of us — the one you'd tell someone to explain our friendship?",
          },
          {
            id: "fr-sh-2",
            text: "Do you remember the first time we met? What was your first impression of me?",
          },
          {
            id: "fr-sh-3",
            text: "What's something I did that you've never told me meant a lot to you?",
            insight:
              "This is a gift question — it often surfaces moments the asker has completely forgotten but that were deeply meaningful to the other person. Powerful for both sides.",
          },
          {
            id: "fr-sh-4",
            text: "Is there a time I helped you through something and didn't even know it?",
          },
          {
            id: "fr-sh-5",
            text: "What's a trip, night, or experience we shared that you still think about?",
          },
          {
            id: "fr-sh-6",
            text: "How do you think we've changed each other over the years?",
          },
          {
            id: "fr-sh-7",
            text: "Was there ever a rough patch in our friendship? How did we get past it?",
          },
          {
            id: "fr-sh-8",
            text: "What do you think makes our friendship work? Why have we lasted?",
          },
          {
            id: "fr-sh-9",
            text: "If you had to describe me to someone who's never met me, what would you say?",
          },
          {
            id: "fr-sh-10",
            text: "What's a conversation we had that stuck with you — one you still think about?",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // SPOUSES / PARTNERS
  // --------------------------------------------------------------------------
  {
    id: "spouses-partners",
    relationshipType: "spouse",
    label: "For Spouses & Partners",
    description:
      "Questions between partners — exploring the life before 'us' and the stories each person carries about their shared history.",
    categories: [
      {
        id: "life-before-us",
        title: "The Life Before Us",
        description:
          "Even after decades together, there are corners of each other's past that remain unexplored.",
        prompts: [
          {
            id: "sp-lbu-1",
            text: "What were you like as a teenager — and would teenage you be surprised by who you've become?",
          },
          {
            id: "sp-lbu-2",
            text: "Before we met, what was your idea of what your life partner would be like? How close was I to that picture?",
            insight:
              "This question is charming and disarming. The answer is almost always surprising — and the gap between expectation and reality is where the real love story lives.",
          },
          {
            id: "sp-lbu-3",
            text: "What's a friendship from before we met that shaped who you are — one I maybe don't know enough about?",
          },
          {
            id: "sp-lbu-4",
            text: "What's a dream you had before we got together that you quietly set aside?",
          },
          {
            id: "sp-lbu-5",
            text: "What was your family dynamic like growing up — and how do you think it shaped how you show up in our relationship?",
          },
          {
            id: "sp-lbu-6",
            text: "What's the most formative experience you had before age 25?",
          },
          {
            id: "sp-lbu-7",
            text: "Was there a heartbreak before me that taught you something important?",
          },
          {
            id: "sp-lbu-8",
            text: "What's something about your childhood home that you still miss?",
          },
          {
            id: "sp-lbu-9",
            text: "Who was the person you were closest to before me — and what did that relationship teach you?",
          },
          {
            id: "sp-lbu-10",
            text: "Is there a version of your younger self that you wish I could have met?",
            insight:
              "Deeply tender. This invites them to share a self-portrait from before the relationship — and often surfaces pride, nostalgia, or a longing to be seen more fully.",
          },
        ],
      },
      {
        id: "our-story-your-version",
        title: "Our Story, Your Version",
        description:
          "You lived the same life together — but you each remember it differently. That's what makes this beautiful.",
        prompts: [
          {
            id: "sp-osyv-1",
            text: "Tell me about the day we met — from your perspective. What do you remember that I might not?",
          },
          {
            id: "sp-osyv-2",
            text: "When did you first know — or at least suspect — that I was the one?",
          },
          {
            id: "sp-osyv-3",
            text: "What's your favorite ordinary day we've had together — not a vacation or holiday, just a regular day that felt perfect?",
            insight:
              "Grand moments are easy to recall. The ordinary perfect days reveal what someone truly values about a shared life — comfort, presence, the small rituals of love.",
          },
          {
            id: "sp-osyv-4",
            text: "What's a hard season in our life together that you think made us stronger?",
          },
          {
            id: "sp-osyv-5",
            text: "Is there a moment in our life together that you think about more than I'd expect?",
          },
          {
            id: "sp-osyv-6",
            text: "What's something I do that you've never told me you love?",
          },
          {
            id: "sp-osyv-7",
            text: "What's a fight or disagreement that taught you something important about us?",
          },
          {
            id: "sp-osyv-8",
            text: "What do you think we do better than most couples?",
          },
          {
            id: "sp-osyv-9",
            text: "If you could relive one year of our life together, which would you pick?",
          },
          {
            id: "sp-osyv-10",
            text: "What do you hope people say about us when they describe our relationship?",
          },
        ],
      },
    ],
  },
];

// ============================================================================
// THEMED PACKS
// ============================================================================

export const themedPacks: ThemedPack[] = [
  // --------------------------------------------------------------------------
  // 1. THE QUESTIONS YOU'RE AFRAID TO ASK
  // --------------------------------------------------------------------------
  {
    id: "afraid-to-ask",
    title: "The Questions You're Afraid to Ask",
    description:
      "The ones everyone wants to know but feels awkward bringing up. These are the questions that lead to the most meaningful conversations — if you have the courage to ask them.",
    preface:
      "These questions might feel scary to send. That's normal. But here's the truth: most people — especially near the end of their lives — are waiting for someone to ask. They want to talk about these things. They just need permission. Ember will weave your question into the conversation gently, so your loved one never feels put on the spot.",
    prompts: [
      {
        id: "ata-1",
        text: "Is there anything you wish you'd apologized for — something that still weighs on you?",
      },
      {
        id: "ata-2",
        text: "Is there a secret you've kept from the family — not to hurt anyone, but because it never felt like the right time?",
        insight:
          "Frame this carefully. It's not about scandals — it's about the things people carry alone. Many elderly people have stories they've held for decades that they'd love to finally set down.",
      },
      {
        id: "ata-3",
        text: "Were there times in your marriage when you weren't sure it would last? What kept you?",
      },
      {
        id: "ata-4",
        text: "What's your biggest regret — the one that visits you at 3 AM?",
      },
      {
        id: "ata-5",
        text: "Is there someone you lost touch with that you still think about? What happened?",
      },
      {
        id: "ata-6",
        text: "Did you ever question your faith — or find it? What brought that on?",
        insight:
          "Spiritual questions can be deeply personal, but for many elderly people, faith (or the loss of it) is one of the most important threads in their life story. Ask with genuine curiosity, not judgment.",
      },
      {
        id: "ata-7",
        text: "Was there a time you felt like a failure as a parent? What would you tell yourself now?",
      },
      {
        id: "ata-8",
        text: "Are you afraid of dying? What do you think happens?",
      },
      {
        id: "ata-9",
        text: "Is there something about our family that you think everyone knows but nobody talks about?",
      },
      {
        id: "ata-10",
        text: "If you could have a completely honest conversation with any family member — living or dead — who would it be and what would you say?",
        insight:
          "This question is indirect enough to feel safe, but it often surfaces real unresolved relationships. The answer reveals both who matters most and what's been left unsaid.",
      },
      {
        id: "ata-11",
        text: "Do you feel like people really know you — the real you, not just the version you show?",
      },
      {
        id: "ata-12",
        text: "Is there something you need to hear from me — or from anyone in the family — that nobody's said yet?",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 2. PHOTO PROMPTS
  // --------------------------------------------------------------------------
  {
    id: "photo-prompts",
    title: "Photo Prompts",
    description:
      "Designed to pair with uploaded photos. Send a photo along with one of these questions to unlock the story behind the image.",
    preface:
      "Upload a family photo when you send one of these prompts. Ember will describe the photo to your loved one and use your question to guide the conversation. Old photos are some of the most powerful memory triggers — a single image can unlock an hour of stories.",
    prompts: [
      {
        id: "pp-1",
        text: "Who are the people in this photo? Tell me about each of them — what were they like?",
      },
      {
        id: "pp-2",
        text: "Where was this taken? What was happening in your life at that time?",
      },
      {
        id: "pp-3",
        text: "What happened right before this photo was taken — and what happened after?",
        insight:
          "Photos freeze a single moment. The before and after is where the real story lives. This question turns a snapshot into a narrative.",
      },
      {
        id: "pp-4",
        text: "Look at the expression on your face in this photo. What were you feeling?",
      },
      {
        id: "pp-5",
        text: "Is there anyone in this photo who's no longer with us? Tell me about them.",
      },
      {
        id: "pp-6",
        text: "What do you notice in the background? Does anything there trigger a memory?",
        insight:
          "Backgrounds contain details the photographer never intended to capture — furniture, signs, weather, clothing. These mundane details are often the strongest memory triggers.",
      },
      {
        id: "pp-7",
        text: "How old were you here? What was life like at that age?",
      },
      {
        id: "pp-8",
        text: "Who took this photo? Why was this moment worth capturing?",
      },
      {
        id: "pp-9",
        text: "Is there a story about this day that the photo doesn't show?",
      },
      {
        id: "pp-10",
        text: "If you could step back into this photo for one hour, what would you do?",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. HOLIDAY & OCCASION PACKS
  // --------------------------------------------------------------------------
  {
    id: "holiday-occasions",
    title: "Holiday & Occasion Packs",
    description:
      "Seasonal and milestone prompts that feel timely and personal. Perfect for holidays, birthdays, and anniversaries.",
    prompts: [
      // Mother's Day / Father's Day
      {
        id: "ho-1",
        text: "What was the moment you first felt like a parent — not just someone with a baby, but a real parent?",
      },
      {
        id: "ho-2",
        text: "What's something I did as a child that made you think, 'Okay, maybe I'm doing this right'?",
        insight:
          "Parents carry so much doubt. This question gives them a chance to recall a moment of confirmation — and those moments are almost always beautiful stories.",
      },
      {
        id: "ho-3",
        text: "What did your own mother (or father) teach you about being a parent — even if they never said it out loud?",
      },
      {
        id: "ho-4",
        text: "What surprised you most about parenthood — the thing nobody warned you about?",
      },
      // Birthday Milestones
      {
        id: "ho-5",
        text: "Now that you're [age], what decade of your life was the best — and which was the hardest?",
      },
      {
        id: "ho-6",
        text: "What did you think life would be like at this age? How does reality compare?",
      },
      {
        id: "ho-7",
        text: "What's the best birthday you've ever had — the one you'd relive if you could?",
      },
      {
        id: "ho-8",
        text: "At your age, what are you most grateful for that you might not have expected?",
      },
      // Anniversary
      {
        id: "ho-9",
        text: "After [number] years together, what's the one thing about your partner that still surprises you?",
      },
      {
        id: "ho-10",
        text: "What's the secret to staying together this long — the real answer, not the polite one?",
        insight:
          "The polite answer is 'communication and compromise.' The real answer is usually funnier, stranger, and more honest. This phrasing gives permission to skip the cliche.",
      },
      // Thanksgiving / Christmas / Holidays
      {
        id: "ho-11",
        text: "What's your favorite holiday memory from childhood? What made it magical?",
      },
      {
        id: "ho-12",
        text: "Is there a holiday tradition from your childhood that got lost along the way? Do you miss it?",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 4. LEGACY QUESTIONS
  // --------------------------------------------------------------------------
  {
    id: "legacy",
    title: "Legacy Questions",
    description:
      "The big ones. These questions capture the essence of a person — their values, their hopes, their final messages to the people they love.",
    preface:
      "These are the questions that matter most when the recording stops. They might feel weighty, but they're also the ones people are most glad they asked. Don't wait for the 'perfect' time. There isn't one.",
    prompts: [
      {
        id: "lq-1",
        text: "What do you want your grandchildren to know about you — not the facts, but the real you?",
      },
      {
        id: "lq-2",
        text: "What values do you hope our family carries forward, long after you're gone?",
      },
      {
        id: "lq-3",
        text: "What's the most important lesson life has taught you?",
      },
      {
        id: "lq-4",
        text: "If you could write a letter to someone who hasn't been born yet — a future grandchild or great-grandchild — what would you tell them?",
        insight:
          "Writing to an unknown future person removes all the baggage of existing relationships. People become surprisingly honest and poetic when they're speaking to someone they'll never meet.",
      },
      {
        id: "lq-5",
        text: "What do you think your life has meant? Not in a grand way — just, what mark do you think you've left?",
      },
      {
        id: "lq-6",
        text: "Is there a family story or tradition that you're worried will be forgotten? Tell me so I can carry it.",
      },
      {
        id: "lq-7",
        text: "What do you want to be remembered for — and is it different from what you think you'll actually be remembered for?",
        insight:
          "The gap between desired legacy and perceived legacy is where vulnerability lives. This question often surfaces both pride and quiet insecurity — and both are worth capturing.",
      },
      {
        id: "lq-8",
        text: "If you could have one more conversation with someone who's passed away, who would it be and what would you say?",
      },
      {
        id: "lq-9",
        text: "What's something you've built, grown, or nurtured that you're proud of — something that will outlast you?",
      },
      {
        id: "lq-10",
        text: "What does love look like to you? Not the word — the actual feeling and the actions behind it.",
      },
      {
        id: "lq-11",
        text: "Is there anything you want to say to our family that you haven't found the right moment for?",
      },
      {
        id: "lq-12",
        text: "If this is one of the last stories you tell, what do you want it to be about?",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 5. FUN & LIGHT
  // --------------------------------------------------------------------------
  {
    id: "fun-and-light",
    title: "Fun & Light",
    description:
      "Not everything needs to be deep. These prompts are playful, surprising, and designed to make your loved one laugh or light up.",
    prompts: [
      {
        id: "fl-1",
        text: "What's the most ridiculous thing that ever happened to you — the story you can't tell without laughing?",
      },
      {
        id: "fl-2",
        text: "What's a trend or fashion from your era that absolutely should come back?",
      },
      {
        id: "fl-3",
        text: "When you were young, what did you think the future (like, now) would look like? Flying cars? Robot butlers?",
        insight:
          "This question is light but surprisingly rich. It reveals what they hoped for, what they feared, and how they made sense of change — all wrapped in a fun conversation.",
      },
      {
        id: "fl-4",
        text: "What's the worst meal you've ever had — the one that's now a legendary bad experience?",
      },
      {
        id: "fl-5",
        text: "If you could have dinner with any person from history, who would you pick and what would you ask them?",
      },
      {
        id: "fl-6",
        text: "What's a piece of technology that blew your mind when it first came out?",
      },
      {
        id: "fl-7",
        text: "What's the funniest misunderstanding you've ever been part of?",
      },
      {
        id: "fl-8",
        text: "Did you ever win anything — a contest, a bet, a raffle? What's the story?",
      },
      {
        id: "fl-9",
        text: "What's the most useless skill you have — something you're weirdly good at that doesn't matter at all?",
        insight:
          "Useless skills are delightful. Card tricks, bird calls, remembering every phone number from 1970 — these stories are pure joy and often reveal hidden playfulness.",
      },
      {
        id: "fl-10",
        text: "What celebrity or famous person did you have a crush on?",
      },
      {
        id: "fl-11",
        text: "What's the longest you've ever been lost — geographically or otherwise?",
      },
      {
        id: "fl-12",
        text: "If you could go back and attend any event in history — just as a spectator — what would you want to witness?",
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get all prompts across the entire library as a flat list */
export function getAllPrompts(): Prompt[] {
  const fromSections = relationshipSections.flatMap((section) =>
    section.categories.flatMap((category) => category.prompts)
  );
  const fromPacks = themedPacks.flatMap((pack) => pack.prompts);
  return [...fromSections, ...fromPacks];
}

/** Get a section by relationship type */
export function getSectionByRelationship(
  relationshipType: string
): PromptSection | undefined {
  return relationshipSections.find(
    (s) => s.relationshipType === relationshipType
  );
}

/** Get a themed pack by ID */
export function getPackById(packId: string): ThemedPack | undefined {
  return themedPacks.find((p) => p.id === packId);
}

/** Get a single prompt by ID from anywhere in the library */
export function getPromptById(promptId: string): Prompt | undefined {
  return getAllPrompts().find((p) => p.id === promptId);
}

/** Get only prompts that have insight notes (useful for featured/highlighted prompts) */
export function getPromptsWithInsights(): Prompt[] {
  return getAllPrompts().filter((p) => p.insight);
}

/** Get a random selection of prompts from a given section or pack */
export function getRandomPrompts(
  prompts: Prompt[],
  count: number
): Prompt[] {
  const shuffled = [...prompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
