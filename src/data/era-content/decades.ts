/**
 * Era Content Data
 * Historical context for different decades to enhance storytelling
 */

export interface EraContent {
  decade: number
  name: string
  description: string
  keyEvents: string[]
  popularMusic: string[]
  popularTV: string[]
  prices: { item: string; price: string }[]
  slang: { term: string; meaning: string }[]
  technology: string[]
  fashion: string[]
  prompts: string[]
}

export const ERA_CONTENT: EraContent[] = [
  {
    decade: 1940,
    name: "The 1940s",
    description: "A decade shaped by World War II and the recovery that followed.",
    keyEvents: [
      "World War II (1941-1945)",
      "D-Day Invasion (1944)",
      "Atomic bombs dropped on Japan (1945)",
      "Baby Boom begins (1946)",
      "Jackie Robinson breaks baseball's color barrier (1947)"
    ],
    popularMusic: [
      "In the Mood - Glenn Miller",
      "Boogie Woogie Bugle Boy - Andrews Sisters",
      "White Christmas - Bing Crosby",
      "Chattanooga Choo Choo"
    ],
    popularTV: [
      "Radio was still dominant",
      "First TV broadcasts began",
      "Howdy Doody (1947)"
    ],
    prices: [
      { item: "Gallon of gas", price: "$0.15" },
      { item: "Movie ticket", price: "$0.24" },
      { item: "New house", price: "$6,600" },
      { item: "New car", price: "$850" },
      { item: "Loaf of bread", price: "$0.08" }
    ],
    slang: [
      { term: "Hubba hubba", meaning: "Exclamation of approval" },
      { term: "Gams", meaning: "Legs" },
      { term: "Ducky shincracker", meaning: "A good dancer" },
      { term: "Snap your cap", meaning: "Get angry" }
    ],
    technology: [
      "ENIAC computer",
      "Microwave oven invented",
      "Polaroid camera",
      "First nuclear reactor"
    ],
    fashion: [
      "Victory suits (less fabric due to war)",
      "Shoulder pads",
      "Seamed stockings",
      "Pompadour hairstyles"
    ],
    prompts: [
      "Do you remember where you were when the war ended?",
      "What was rationing like for your family?",
      "Did anyone in your family serve in the military?"
    ]
  },
  {
    decade: 1950,
    name: "The 1950s",
    description: "Post-war prosperity, the rise of suburbs, and the birth of rock and roll.",
    keyEvents: [
      "Korean War (1950-1953)",
      "Rosa Parks and Montgomery Bus Boycott (1955)",
      "Elvis Presley rises to fame",
      "Sputnik launched (1957)",
      "Alaska and Hawaii become states (1959)"
    ],
    popularMusic: [
      "Rock Around the Clock - Bill Haley",
      "Heartbreak Hotel - Elvis Presley",
      "Johnny B. Goode - Chuck Berry",
      "Great Balls of Fire - Jerry Lee Lewis"
    ],
    popularTV: [
      "I Love Lucy",
      "The Ed Sullivan Show",
      "Leave It to Beaver",
      "The Honeymooners",
      "Gunsmoke"
    ],
    prices: [
      { item: "Gallon of gas", price: "$0.27" },
      { item: "Movie ticket", price: "$0.50" },
      { item: "New house", price: "$12,000" },
      { item: "New car", price: "$1,500" },
      { item: "Loaf of bread", price: "$0.14" }
    ],
    slang: [
      { term: "Daddy-O", meaning: "Cool guy" },
      { term: "Cruisin' for a bruisin'", meaning: "Looking for trouble" },
      { term: "Made in the shade", meaning: "Success guaranteed" },
      { term: "Dig it", meaning: "Understand or appreciate" }
    ],
    technology: [
      "Color television",
      "Transistor radios",
      "TV dinners",
      "Credit cards"
    ],
    fashion: [
      "Poodle skirts",
      "Saddle shoes",
      "Leather jackets",
      "Greaser hairstyles",
      "Pearls and cardigans"
    ],
    prompts: [
      "Did you have a TV growing up? What did you watch?",
      "Do you remember when rock and roll first came out?",
      "What was your neighborhood like in the 50s?"
    ]
  },
  {
    decade: 1960,
    name: "The 1960s",
    description: "A decade of change - civil rights, the space race, and cultural revolution.",
    keyEvents: [
      "JFK assassination (1963)",
      "Civil Rights Act (1964)",
      "Moon landing (1969)",
      "Vietnam War escalates",
      "Woodstock (1969)",
      "Martin Luther King Jr. assassinated (1968)"
    ],
    popularMusic: [
      "I Want to Hold Your Hand - The Beatles",
      "Respect - Aretha Franklin",
      "Good Vibrations - Beach Boys",
      "Purple Haze - Jimi Hendrix"
    ],
    popularTV: [
      "The Andy Griffith Show",
      "The Beverly Hillbillies",
      "Star Trek",
      "Bewitched",
      "The Twilight Zone"
    ],
    prices: [
      { item: "Gallon of gas", price: "$0.31" },
      { item: "Movie ticket", price: "$0.85" },
      { item: "New house", price: "$23,000" },
      { item: "New car", price: "$2,600" },
      { item: "Loaf of bread", price: "$0.22" }
    ],
    slang: [
      { term: "Groovy", meaning: "Cool, excellent" },
      { term: "Far out", meaning: "Amazing" },
      { term: "Right on", meaning: "I agree" },
      { term: "Flower power", meaning: "Peace movement" }
    ],
    technology: [
      "Cassette tapes",
      "Touch-tone phones",
      "First ATM",
      "Early computers"
    ],
    fashion: [
      "Mini skirts",
      "Bell bottoms",
      "Go-go boots",
      "Tie-dye",
      "Long hair for men"
    ],
    prompts: [
      "Where were you when man walked on the moon?",
      "Did the 60s feel as revolutionary as people say?",
      "What was your experience during the civil rights movement?"
    ]
  },
  {
    decade: 1970,
    name: "The 1970s",
    description: "Disco, Watergate, and the energy crisis shaped this dynamic decade.",
    keyEvents: [
      "Watergate scandal (1972-1974)",
      "Vietnam War ends (1975)",
      "First Earth Day (1970)",
      "Oil crisis (1973)",
      "Roe v. Wade (1973)"
    ],
    popularMusic: [
      "Stayin' Alive - Bee Gees",
      "Bohemian Rhapsody - Queen",
      "Hotel California - Eagles",
      "Stairway to Heaven - Led Zeppelin"
    ],
    popularTV: [
      "All in the Family",
      "M*A*S*H",
      "Happy Days",
      "Charlie's Angels",
      "Saturday Night Live"
    ],
    prices: [
      { item: "Gallon of gas", price: "$0.59" },
      { item: "Movie ticket", price: "$1.55" },
      { item: "New house", price: "$40,000" },
      { item: "New car", price: "$3,500" },
      { item: "Loaf of bread", price: "$0.28" }
    ],
    slang: [
      { term: "Foxy", meaning: "Attractive" },
      { term: "Boogie", meaning: "Dance" },
      { term: "Keep on truckin'", meaning: "Keep going" },
      { term: "Dynamite", meaning: "Awesome" }
    ],
    technology: [
      "VCRs",
      "Pong video game",
      "Pocket calculators",
      "Personal computers begin"
    ],
    fashion: [
      "Platform shoes",
      "Polyester suits",
      "Afros",
      "Hot pants",
      "Earth tones"
    ],
    prompts: [
      "Did you ever wait in line for gas during the oil crisis?",
      "Did you go to any disco clubs?",
      "What do you remember about Watergate?"
    ]
  },
  {
    decade: 1980,
    name: "The 1980s",
    description: "MTV, the Cold War's end, and the rise of personal computers.",
    keyEvents: [
      "MTV launches (1981)",
      "Space Shuttle Challenger disaster (1986)",
      "Berlin Wall falls (1989)",
      "AIDS epidemic begins",
      "Chernobyl disaster (1986)"
    ],
    popularMusic: [
      "Thriller - Michael Jackson",
      "Like a Virgin - Madonna",
      "Sweet Child O' Mine - Guns N' Roses",
      "Take On Me - a-ha"
    ],
    popularTV: [
      "The Cosby Show",
      "Cheers",
      "Miami Vice",
      "Dynasty",
      "The Golden Girls"
    ],
    prices: [
      { item: "Gallon of gas", price: "$1.19" },
      { item: "Movie ticket", price: "$2.69" },
      { item: "New house", price: "$89,000" },
      { item: "New car", price: "$7,000" },
      { item: "Loaf of bread", price: "$0.50" }
    ],
    slang: [
      { term: "Gnarly", meaning: "Cool or extreme" },
      { term: "Tubular", meaning: "Awesome" },
      { term: "Gag me with a spoon", meaning: "That's disgusting" },
      { term: "Rad", meaning: "Great" }
    ],
    technology: [
      "Personal computers",
      "Walkman",
      "CD players",
      "Video games (Pac-Man, Nintendo)"
    ],
    fashion: [
      "Big hair",
      "Neon colors",
      "Leg warmers",
      "Members Only jackets",
      "Acid-washed jeans"
    ],
    prompts: [
      "Did you ever watch MTV? What was that like?",
      "Do you remember where you were when the Berlin Wall fell?",
      "What was your first computer like?"
    ]
  },
  {
    decade: 1990,
    name: "The 1990s",
    description: "The internet age begins, grunge music, and the end of the millennium approaches.",
    keyEvents: [
      "Gulf War (1991)",
      "Soviet Union dissolves (1991)",
      "World Wide Web goes public",
      "O.J. Simpson trial (1995)",
      "Clinton impeachment (1998)"
    ],
    popularMusic: [
      "Smells Like Teen Spirit - Nirvana",
      "...Baby One More Time - Britney Spears",
      "Wannabe - Spice Girls",
      "Losing My Religion - R.E.M."
    ],
    popularTV: [
      "Friends",
      "Seinfeld",
      "The Fresh Prince of Bel-Air",
      "ER",
      "The X-Files"
    ],
    prices: [
      { item: "Gallon of gas", price: "$1.16" },
      { item: "Movie ticket", price: "$4.23" },
      { item: "New house", price: "$131,000" },
      { item: "New car", price: "$16,000" },
      { item: "Loaf of bread", price: "$0.70" }
    ],
    slang: [
      { term: "All that and a bag of chips", meaning: "Superior" },
      { term: "Da bomb", meaning: "The best" },
      { term: "Talk to the hand", meaning: "I'm not listening" },
      { term: "Phat", meaning: "Cool" }
    ],
    technology: [
      "Internet/World Wide Web",
      "Cell phones",
      "DVDs",
      "Windows 95"
    ],
    fashion: [
      "Flannel shirts",
      "Baggy jeans",
      "Platform sneakers",
      "Butterfly clips",
      "Chokers"
    ],
    prompts: [
      "When did you first use the internet?",
      "How did you feel as the year 2000 approached?",
      "What was Y2K like for you?"
    ]
  },
  {
    decade: 2000,
    name: "The 2000s",
    description: "September 11, the rise of social media, and the smartphone revolution.",
    keyEvents: [
      "September 11 attacks (2001)",
      "Iraq War begins (2003)",
      "Hurricane Katrina (2005)",
      "iPhone launches (2007)",
      "Financial crisis (2008)",
      "Barack Obama elected (2008)"
    ],
    popularMusic: [
      "Crazy in Love - Beyoncé",
      "Hey Ya! - OutKast",
      "Umbrella - Rihanna",
      "Mr. Brightside - The Killers"
    ],
    popularTV: [
      "The Sopranos",
      "Lost",
      "American Idol",
      "The Office",
      "Grey's Anatomy"
    ],
    prices: [
      { item: "Gallon of gas", price: "$1.51" },
      { item: "Movie ticket", price: "$5.66" },
      { item: "New house", price: "$207,000" },
      { item: "New car", price: "$21,000" },
      { item: "Loaf of bread", price: "$1.00" }
    ],
    slang: [
      { term: "BFF", meaning: "Best friends forever" },
      { term: "YOLO", meaning: "You only live once" },
      { term: "Bling", meaning: "Flashy jewelry" },
      { term: "My bad", meaning: "My mistake" }
    ],
    technology: [
      "Smartphones",
      "Social media (Facebook, YouTube)",
      "Flat screen TVs",
      "iPods"
    ],
    fashion: [
      "Low-rise jeans",
      "Ugg boots",
      "Trucker hats",
      "Velour tracksuits",
      "Popped collars"
    ],
    prompts: [
      "Where were you on September 11, 2001?",
      "When did you get your first smartphone?",
      "How has social media changed your life?"
    ]
  },
  {
    decade: 2010,
    name: "The 2010s",
    description: "Social media dominance, streaming entertainment, and global changes.",
    keyEvents: [
      "Osama bin Laden killed (2011)",
      "Marriage equality nationwide (2015)",
      "COVID-19 pandemic begins (2019/2020)",
      "Black Lives Matter movement grows",
      "Me Too movement (2017)"
    ],
    popularMusic: [
      "Happy - Pharrell Williams",
      "Uptown Funk - Bruno Mars",
      "Shape of You - Ed Sheeran",
      "Old Town Road - Lil Nas X"
    ],
    popularTV: [
      "Game of Thrones",
      "Breaking Bad",
      "Stranger Things",
      "The Crown",
      "This Is Us"
    ],
    prices: [
      { item: "Gallon of gas", price: "$2.35" },
      { item: "Movie ticket", price: "$8.65" },
      { item: "New house", price: "$275,000" },
      { item: "New car", price: "$33,000" },
      { item: "Loaf of bread", price: "$1.40" }
    ],
    slang: [
      { term: "Lit", meaning: "Exciting or excellent" },
      { term: "Slay", meaning: "To do something really well" },
      { term: "Ghosting", meaning: "Cutting off contact suddenly" },
      { term: "Binge-watch", meaning: "Watch many episodes at once" }
    ],
    technology: [
      "Streaming services (Netflix, Spotify)",
      "Smart home devices",
      "Electric cars",
      "Tablets"
    ],
    fashion: [
      "Athleisure",
      "High-waisted everything",
      "Minimalist style",
      "Statement sneakers"
    ],
    prompts: [
      "How has technology changed how you connect with family?",
      "What was the COVID pandemic like for your family?",
      "How do you stay in touch with loved ones now?"
    ]
  }
]

export function getEraContent(decade: number): EraContent | undefined {
  return ERA_CONTENT.find(era => era.decade === decade)
}

export function getEraForYear(year: number): EraContent | undefined {
  const decade = Math.floor(year / 10) * 10
  return getEraContent(decade)
}

export function getAllDecades(): number[] {
  return ERA_CONTENT.map(era => era.decade)
}
