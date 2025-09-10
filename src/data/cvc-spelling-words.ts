// CVC (Consonant-Vowel-Consonant) Spelling Words
// Curated list of 3-letter words perfect for early spelling practice

export interface CVCSpellingWord {
  id: number;
  word: string;
  vowel: 'a' | 'e' | 'i' | 'o' | 'u';
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
  category: string;
  questionText: string;
  explanation: string;
}

export const cvcSpellingWords: CVCSpellingWord[] = [
  // Short A words (easy)
  {
    id: 1,
    word: 'cat',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'A furry pet that meows',
    category: 'animals',
    questionText: 'Spell the word: A furry pet that says meow',
    explanation: 'Great job! CAT is spelled C-A-T.'
  },
  {
    id: 2,
    word: 'bat',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'A flying animal or sports equipment',
    category: 'animals',
    questionText: 'Spell the word: A flying animal that sleeps upside down',
    explanation: 'Excellent! BAT is spelled B-A-T.'
  },
  {
    id: 3,
    word: 'hat',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'You wear this on your head',
    category: 'clothing',
    questionText: 'Spell the word: Something you wear on your head',
    explanation: 'Perfect! HAT is spelled H-A-T.'
  },
  {
    id: 4,
    word: 'mat',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'You wipe your feet on this',
    category: 'objects',
    questionText: 'Spell the word: You wipe your feet on this at the door',
    explanation: 'Well done! MAT is spelled M-A-T.'
  },
  {
    id: 5,
    word: 'rat',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'A small rodent with a long tail',
    category: 'animals',
    questionText: 'Spell the word: A small animal with a long tail',
    explanation: 'Great work! RAT is spelled R-A-T.'
  },
  {
    id: 6,
    word: 'bag',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'You carry things in this',
    category: 'objects',
    questionText: 'Spell the word: You carry your lunch in this',
    explanation: 'Awesome! BAG is spelled B-A-G.'
  },
  {
    id: 7,
    word: 'can',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'A metal container for food or drinks',
    category: 'objects',
    questionText: 'Spell the word: A metal container for soda',
    explanation: 'Fantastic! CAN is spelled C-A-N.'
  },
  {
    id: 8,
    word: 'man',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'An adult male person',
    category: 'people',
    questionText: 'Spell the word: An adult male person',
    explanation: 'Excellent! MAN is spelled M-A-N.'
  },
  {
    id: 9,
    word: 'pan',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'You cook food in this',
    category: 'objects',
    questionText: 'Spell the word: You cook eggs in this',
    explanation: 'Great job! PAN is spelled P-A-N.'
  },
  {
    id: 10,
    word: 'ran',
    vowel: 'a',
    difficulty: 'easy',
    hint: 'Past tense of run',
    category: 'actions',
    questionText: 'Spell the word: What you did when you moved very fast',
    explanation: 'Perfect! RAN is spelled R-A-N.'
  },

  // Short E words (easy to medium)
  {
    id: 11,
    word: 'bed',
    vowel: 'e',
    difficulty: 'easy',
    hint: 'You sleep in this',
    category: 'furniture',
    questionText: 'Spell the word: Where you sleep at night',
    explanation: 'Well done! BED is spelled B-E-D.'
  },
  {
    id: 12,
    word: 'red',
    vowel: 'e',
    difficulty: 'easy',
    hint: 'The color of fire trucks',
    category: 'colors',
    questionText: 'Spell the word: The color of strawberries',
    explanation: 'Excellent! RED is spelled R-E-D.'
  },
  {
    id: 13,
    word: 'pen',
    vowel: 'e',
    difficulty: 'easy',
    hint: 'You write with this',
    category: 'objects',
    questionText: 'Spell the word: You use this to write',
    explanation: 'Great work! PEN is spelled P-E-N.'
  },
  {
    id: 14,
    word: 'ten',
    vowel: 'e',
    difficulty: 'easy',
    hint: 'The number after nine',
    category: 'numbers',
    questionText: 'Spell the word: The number that comes after nine',
    explanation: 'Fantastic! TEN is spelled T-E-N.'
  },
  {
    id: 15,
    word: 'hen',
    vowel: 'e',
    difficulty: 'easy',
    hint: 'A female chicken',
    category: 'animals',
    questionText: 'Spell the word: A female chicken that lays eggs',
    explanation: 'Perfect! HEN is spelled H-E-N.'
  },
  {
    id: 16,
    word: 'net',
    vowel: 'e',
    difficulty: 'medium',
    hint: 'Used to catch fish or play tennis',
    category: 'objects',
    questionText: 'Spell the word: Fishermen use this to catch fish',
    explanation: 'Awesome! NET is spelled N-E-T.'
  },
  {
    id: 17,
    word: 'wet',
    vowel: 'e',
    difficulty: 'easy',
    hint: 'Not dry, covered with water',
    category: 'descriptions',
    questionText: 'Spell the word: The opposite of dry',
    explanation: 'Great job! WET is spelled W-E-T.'
  },
  {
    id: 18,
    word: 'get',
    vowel: 'e',
    difficulty: 'medium',
    hint: 'To obtain or receive something',
    category: 'actions',
    questionText: 'Spell the word: To receive or obtain something',
    explanation: 'Excellent! GET is spelled G-E-T.'
  },

  // Short I words (medium)
  {
    id: 19,
    word: 'big',
    vowel: 'i',
    difficulty: 'easy',
    hint: 'Large in size',
    category: 'descriptions',
    questionText: 'Spell the word: Very large in size',
    explanation: 'Well done! BIG is spelled B-I-G.'
  },
  {
    id: 20,
    word: 'pig',
    vowel: 'i',
    difficulty: 'easy',
    hint: 'A farm animal that oinks',
    category: 'animals',
    questionText: 'Spell the word: A pink farm animal that says oink',
    explanation: 'Perfect! PIG is spelled P-I-G.'
  },
  {
    id: 21,
    word: 'sit',
    vowel: 'i',
    difficulty: 'easy',
    hint: 'To rest on a chair',
    category: 'actions',
    questionText: 'Spell the word: What you do on a chair',
    explanation: 'Great work! SIT is spelled S-I-T.'
  },
  {
    id: 22,
    word: 'hit',
    vowel: 'i',
    difficulty: 'medium',
    hint: 'To strike something',
    category: 'actions',
    questionText: 'Spell the word: To strike a ball with a bat',
    explanation: 'Excellent! HIT is spelled H-I-T.'
  },
  {
    id: 23,
    word: 'fit',
    vowel: 'i',
    difficulty: 'medium',
    hint: 'The right size or healthy',
    category: 'descriptions',
    questionText: 'Spell the word: When clothes are the right size',
    explanation: 'Fantastic! FIT is spelled F-I-T.'
  },
  {
    id: 24,
    word: 'win',
    vowel: 'i',
    difficulty: 'medium',
    hint: 'To be victorious in a game',
    category: 'actions',
    questionText: 'Spell the word: To be first in a race',
    explanation: 'Awesome! WIN is spelled W-I-N.'
  },
  {
    id: 25,
    word: 'pin',
    vowel: 'i',
    difficulty: 'medium',
    hint: 'A sharp fastener or bowling target',
    category: 'objects',
    questionText: 'Spell the word: A sharp object used to fasten things',
    explanation: 'Great job! PIN is spelled P-I-N.'
  },

  // Short O words (medium)
  {
    id: 26,
    word: 'dog',
    vowel: 'o',
    difficulty: 'easy',
    hint: 'A loyal pet that barks',
    category: 'animals',
    questionText: 'Spell the word: A furry pet that barks and wags its tail',
    explanation: 'Perfect! DOG is spelled D-O-G.'
  },
  {
    id: 27,
    word: 'log',
    vowel: 'o',
    difficulty: 'medium',
    hint: 'A piece of wood from a tree',
    category: 'objects',
    questionText: 'Spell the word: A round piece of wood from a tree',
    explanation: 'Well done! LOG is spelled L-O-G.'
  },
  {
    id: 28,
    word: 'hot',
    vowel: 'o',
    difficulty: 'easy',
    hint: 'Very warm temperature',
    category: 'descriptions',
    questionText: 'Spell the word: The opposite of cold',
    explanation: 'Excellent! HOT is spelled H-O-T.'
  },
  {
    id: 29,
    word: 'pot',
    vowel: 'o',
    difficulty: 'easy',
    hint: 'You cook soup in this',
    category: 'objects',
    questionText: 'Spell the word: A container used for cooking soup',
    explanation: 'Great work! POT is spelled P-O-T.'
  },
  {
    id: 30,
    word: 'top',
    vowel: 'o',
    difficulty: 'medium',
    hint: 'The highest part of something',
    category: 'descriptions',
    questionText: 'Spell the word: The highest part of a mountain',
    explanation: 'Fantastic! TOP is spelled T-O-P.'
  },
  {
    id: 31,
    word: 'box',
    vowel: 'o',
    difficulty: 'medium',
    hint: 'A container with four sides',
    category: 'objects',
    questionText: 'Spell the word: A square container for storing things',
    explanation: 'Awesome! BOX is spelled B-O-X.'
  },
  {
    id: 32,
    word: 'fox',
    vowel: 'o',
    difficulty: 'medium',
    hint: 'A clever wild animal with a bushy tail',
    category: 'animals',
    questionText: 'Spell the word: A clever animal with red fur and a bushy tail',
    explanation: 'Perfect! FOX is spelled F-O-X.'
  },

  // Short U words (medium to hard)
  {
    id: 33,
    word: 'sun',
    vowel: 'u',
    difficulty: 'easy',
    hint: 'The bright star in our sky',
    category: 'nature',
    questionText: 'Spell the word: The bright star that gives us light',
    explanation: 'Excellent! SUN is spelled S-U-N.'
  },
  {
    id: 34,
    word: 'run',
    vowel: 'u',
    difficulty: 'easy',
    hint: 'To move very fast on foot',
    category: 'actions',
    questionText: 'Spell the word: To move faster than walking',
    explanation: 'Great job! RUN is spelled R-U-N.'
  },
  {
    id: 35,
    word: 'fun',
    vowel: 'u',
    difficulty: 'easy',
    hint: 'Something enjoyable and entertaining',
    category: 'descriptions',
    questionText: 'Spell the word: Something that makes you happy and laugh',
    explanation: 'Well done! FUN is spelled F-U-N.'
  },
  {
    id: 36,
    word: 'cup',
    vowel: 'u',
    difficulty: 'easy',
    hint: 'You drink from this',
    category: 'objects',
    questionText: 'Spell the word: A small container for drinking',
    explanation: 'Perfect! CUP is spelled C-U-P.'
  },
  {
    id: 37,
    word: 'bug',
    vowel: 'u',
    difficulty: 'medium',
    hint: 'A small insect',
    category: 'animals',
    questionText: 'Spell the word: A tiny crawling creature',
    explanation: 'Fantastic! BUG is spelled B-U-G.'
  },
  {
    id: 38,
    word: 'hug',
    vowel: 'u',
    difficulty: 'medium',
    hint: 'A warm embrace',
    category: 'actions',
    questionText: 'Spell the word: A warm squeeze with your arms',
    explanation: 'Awesome! HUG is spelled H-U-G.'
  },
  {
    id: 39,
    word: 'mud',
    vowel: 'u',
    difficulty: 'medium',
    hint: 'Wet dirt',
    category: 'nature',
    questionText: 'Spell the word: What you get when you mix dirt and water',
    explanation: 'Great work! MUD is spelled M-U-D.'
  },
  {
    id: 40,
    word: 'bus',
    vowel: 'u',
    difficulty: 'medium',
    hint: 'A large vehicle that carries many people',
    category: 'vehicles',
    questionText: 'Spell the word: A big yellow vehicle that takes kids to school',
    explanation: 'Excellent! BUS is spelled B-U-S.'
  }
];

// Helper functions for filtering and selecting CVC words
export const getCVCWordsByVowel = (vowel: 'a' | 'e' | 'i' | 'o' | 'u'): CVCSpellingWord[] => {
  return cvcSpellingWords.filter(word => word.vowel === vowel);
};

export const getCVCWordsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): CVCSpellingWord[] => {
  return cvcSpellingWords.filter(word => word.difficulty === difficulty);
};

export const getCVCWordsByCategory = (category: string): CVCSpellingWord[] => {
  return cvcSpellingWords.filter(word => word.category === category);
};

export const getRandomCVCWord = (): CVCSpellingWord => {
  const randomIndex = Math.floor(Math.random() * cvcSpellingWords.length);
  return cvcSpellingWords[randomIndex];
};

export const getRandomCVCWordByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): CVCSpellingWord => {
  const filteredWords = getCVCWordsByDifficulty(difficulty);
  const randomIndex = Math.floor(Math.random() * filteredWords.length);
  return filteredWords[randomIndex];
};

// Convert CVC word to SpellingQuestion format for compatibility
export const convertCVCToSpellingQuestion = (cvcWord: CVCSpellingWord) => {
  return {
    id: cvcWord.id,
    topicId: 'CVC-SPELLING',
    topicName: 'CVC_Spelling_Practice',
    word: cvcWord.word,
    questionText: cvcWord.questionText,
    correctAnswer: cvcWord.word,
    audio: cvcWord.word,
    explanation: cvcWord.explanation,
    templateType: 'spelling'
  };
};
