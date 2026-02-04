# Chapter Classification Guide

> Rules for classifying stories into the 7 Life Book chapters.
> Helps ensure stories land in the right place for family to find.

---

## The 7 Chapters

| Chapter | Core Theme | Emotional Tone |
|---------|-----------|----------------|
| Who I Am | Identity, values, character | Reflective |
| Where I Come From | Origins, heritage, roots | Nostalgic |
| What I've Loved | Joy, passion, connection | Warm, happy |
| What's Been Hard | Challenges, loss, resilience | Heavy, but hopeful |
| What I've Learned | Wisdom, growth, insight | Thoughtful |
| What I'm Still Figuring Out | Questions, hopes, dreams | Open, uncertain |
| What I Want You to Know | Legacy, messages, advice | Earnest, loving |

---

## Chapter 1: Who I Am

### What Belongs Here
- Stories about personal values and beliefs
- Defining moments that shaped their character
- What they're most proud of about themselves
- How they see themselves vs. how others see them
- Faith, spirituality, philosophy of life
- Career identity and professional journey

### Example Stories
- "I've always been the one people come to for advice..."
- "My faith has been the anchor of my life..."
- "I'm stubborn - always have been - and here's why that's served me..."

### What Does NOT Belong Here
- Childhood memories without identity reflection → **Where I Come From**
- Accomplishments without personal meaning → **What I've Loved**
- Struggles without identity insight → **What's Been Hard**

### Edge Cases
- "My father taught me to be honest" → Could be **Who I Am** (value formation) OR **Where I Come From** (family influence). Classify based on emphasis: if about the VALUE, it's Who I Am. If about FATHER, it's Where I Come From.

---

## Chapter 2: Where I Come From

### What Belongs Here
- Childhood memories and growing up stories
- Family background and heritage
- Hometown and neighborhood descriptions
- Parents, grandparents, siblings
- Cultural traditions and ethnic identity
- Early education and formative years

### Example Stories
- "I grew up in a small town where everyone knew everyone..."
- "My grandmother came to this country with nothing..."
- "Our house was always full of cousins and noise..."

### What Does NOT Belong Here
- Childhood challenges focused on overcoming → **What's Been Hard**
- Childhood joys focused on specific passions → **What I've Loved**
- Lessons from parents → **What I've Learned** (unless about heritage)

### Edge Cases
- "My childhood was hard because we were poor" → If focused on THE HARDSHIP, it's **What's Been Hard**. If focused on WHERE they grew up and how poverty shaped their environment, it's **Where I Come From**.

---

## Chapter 3: What I've Loved

### What Belongs Here
- Joyful memories and peak experiences
- Romantic love stories (meeting spouse, wedding, etc.)
- Passionate hobbies and interests
- Beloved pets and animals
- Treasured friendships
- Children and grandchildren stories
- Favorite places and travels

### Example Stories
- "The day I met my husband changed everything..."
- "I've never loved anything like I loved playing music..."
- "My grandchildren are the light of my life..."

### What Does NOT Belong Here
- Love lost (death of spouse) → **What's Been Hard**
- Why they value love → **Who I Am**
- Teaching children → **What I Want You to Know**

### Edge Cases
- "I loved my mother so much, and when she died..." → Split story. The LOVE part goes here. The LOSS part should be separate in **What's Been Hard**.

---

## Chapter 4: What's Been Hard

### What Belongs Here
- Losses and grief (death of loved ones)
- Major challenges and obstacles overcome
- Health struggles (theirs or family)
- Failures and setbacks
- Difficult relationships
- Traumatic experiences (handled sensitively)
- Regrets and mistakes

### Example Stories
- "Losing my husband was the hardest thing I've ever been through..."
- "I failed at my first business, and it nearly broke me..."
- "My diagnosis changed everything..."

### What Does NOT Belong Here
- Lessons learned from hardship → **What I've Learned**
- Current struggles still being worked on → **What I'm Still Figuring Out**
- Hard childhood (if focused on place/family) → **Where I Come From**

### Edge Cases
- "My divorce was hard, but it taught me..." → If focused on THE DIVORCE and its pain, it's here. If focused on THE LESSON, it's **What I've Learned**.

---

## Chapter 5: What I've Learned

### What Belongs Here
- Wisdom and life lessons
- Insights from experience
- Changed perspectives over time
- Advice they'd give their younger self
- Things they understand now that they didn't before
- Growth and personal development

### Example Stories
- "I used to think money was everything, but I learned..."
- "The biggest lesson I've learned is to never assume..."
- "If I could tell my younger self one thing..."

### What Does NOT Belong Here
- Advice for family → **What I Want You to Know**
- Stories about learning/school → **Where I Come From**
- Current questions → **What I'm Still Figuring Out**

### Edge Cases
- "I want my grandchildren to know that patience is everything" → This is ADVICE for others, so it's **What I Want You to Know**, not just a lesson learned.

---

## Chapter 6: What I'm Still Figuring Out

### What Belongs Here
- Current questions and uncertainties
- Ongoing challenges
- Things they're still working on
- Hopes and dreams for the future
- Areas of continued growth
- Unresolved feelings or relationships

### Example Stories
- "I still wonder what would have happened if..."
- "I'm still trying to understand why..."
- "I hope I can still learn to..."

### What Does NOT Belong Here
- Resolved lessons → **What I've Learned**
- Past struggles (resolved) → **What's Been Hard**
- Messages for family → **What I Want You to Know**

### Edge Cases
- "I've struggled with forgiveness my whole life" → If they're STILL struggling, it's here. If they've resolved it, it's **What's Been Hard** or **What I've Learned**.

---

## Chapter 7: What I Want You to Know

### What Belongs Here
- Direct messages to family/descendants
- Legacy statements
- Advice for future generations
- Things they want remembered about them
- Values they want to pass on
- Final wishes or hopes for family

### Example Stories
- "I want you to know how much you mean to me..."
- "If I could give you one piece of advice, it would be..."
- "I hope you'll always remember..."

### What Does NOT Belong Here
- General wisdom (not directed at family) → **What I've Learned**
- Stories about values (self-focused) → **Who I Am**
- Hope for themselves → **What I'm Still Figuring Out**

### Edge Cases
- "Family is the most important thing" → If stated as THEIR value, it's **Who I Am**. If stated as ADVICE to family, it's here.

---

## Classification Algorithm

1. **Look for direct address** ("I want you to know", "my advice to you") → **What I Want You to Know**
2. **Look for time markers** (childhood, growing up, parents) → **Where I Come From**
3. **Look for emotional tone**:
   - Predominantly joyful → **What I've Loved**
   - Predominantly painful → **What's Been Hard**
4. **Look for uncertainty markers** ("still", "figuring out", "wondering") → **What I'm Still Figuring Out**
5. **Look for reflection markers** ("I learned", "I realized", "I understand now") → **What I've Learned**
6. **Default** (identity-focused, values) → **Who I Am**

---

## Confidence Thresholds

| Confidence | Action |
|------------|--------|
| > 70% | Auto-classify |
| 50-70% | Classify but allow easy re-classification |
| < 50% | Ask user to confirm chapter |

---

## Multi-Chapter Stories

Some stories span multiple chapters. In these cases:
1. Classify based on the PRIMARY emotional weight
2. Add secondary chapter as a tag
3. Consider splitting into multiple stories if user agrees

---

*Document Version: 1.0*
*Created: February 2026*
*Purpose: Accurate story organization in Life Book*
