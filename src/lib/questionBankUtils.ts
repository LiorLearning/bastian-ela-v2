import { sampleMCQData } from '@/data/mcq-questions';
import { 
  cvcSpellingWords, 
  getRandomCVCWord, 
  getRandomCVCWordByDifficulty, 
  convertCVCToSpellingQuestion,
  type CVCSpellingWord 
} from '@/data/cvc-spelling-words';

// Interface for spelling question data
export interface SpellingQuestion {
  id: number;
  topicId: string;
  topicName: string;
  word: string;
  questionText: string;
  correctAnswer: string;
  audio: string;
  explanation: string;
  templateType: string;
}

// Interface for generated story context message
export interface StoryContextMessage {
  message: string;
  spellingQuestion: SpellingQuestion;
  targetWord: string;
  storyPrompt: string;
}

/**
 * Get all spelling questions from the question bank
 */
export const getAllSpellingQuestions = (): SpellingQuestion[] => {
  const spellingQuestions: SpellingQuestion[] = [];
  
  Object.values(sampleMCQData.topics).forEach(topic => {
    topic.questions.forEach(question => {
      if (question.isSpelling === true) {
        // Determine the actual spelling target word
        let spellingTarget = question.audio || question.word;
        
        // If the audio field contains a phonetic concept (multiple words), use the word field instead
        if (spellingTarget && spellingTarget.includes(' ') && spellingTarget.includes('sounds')) {
          spellingTarget = question.word;
        }
        
        spellingQuestions.push({
          id: question.id,
          topicId: question.topicId,
          topicName: question.topicName,
          word: question.word,
          questionText: question.questionText,
          correctAnswer: question.correctAnswer.toString(),
          audio: spellingTarget, // Use the determined spelling target
          explanation: question.explanation,
          templateType: question.templateType
        });
      }
    });
  });
  
  return spellingQuestions;
};

/**
 * Get a random spelling question from the question bank
 */
export const getRandomSpellingQuestion = (): SpellingQuestion | null => {
  const spellingQuestions = getAllSpellingQuestions();
  console.log('🎲 Available spelling questions:', spellingQuestions.length);
  
  if (spellingQuestions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * spellingQuestions.length);
  const selectedQuestion = spellingQuestions[randomIndex];
  
  console.log('🎯 Selected spelling question:', {
    id: selectedQuestion.id,
    word: selectedQuestion.word,
    audio: selectedQuestion.audio,
    questionText: selectedQuestion.questionText
  });
  
  return selectedQuestion;
};

/**
 * Get all CVC spelling questions
 */
export const getAllCVCSpellingQuestions = (): SpellingQuestion[] => {
  return cvcSpellingWords.map(convertCVCToSpellingQuestion);
};

/**
 * Get a random CVC spelling question
 */
export const getRandomCVCSpellingQuestion = (): SpellingQuestion | null => {
  console.log('🎲 Available CVC spelling words:', cvcSpellingWords.length);
  
  if (cvcSpellingWords.length === 0) {
    return null;
  }
  
  const randomCVCWord = getRandomCVCWord();
  const spellingQuestion = convertCVCToSpellingQuestion(randomCVCWord);
  
  console.log('🎯 Selected CVC spelling question:', {
    id: spellingQuestion.id,
    word: spellingQuestion.word,
    audio: spellingQuestion.audio,
    questionText: spellingQuestion.questionText,
    vowel: randomCVCWord.vowel,
    difficulty: randomCVCWord.difficulty,
    category: randomCVCWord.category
  });
  
  return spellingQuestion;
};

/**
 * Get a random CVC spelling question by difficulty level
 */
export const getRandomCVCSpellingQuestionByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): SpellingQuestion | null => {
  console.log(`🎲 Getting CVC spelling question with difficulty: ${difficulty}`);
  
  const randomCVCWord = getRandomCVCWordByDifficulty(difficulty);
  if (!randomCVCWord) {
    console.log(`❌ No CVC words found for difficulty: ${difficulty}`);
    return null;
  }
  
  const spellingQuestion = convertCVCToSpellingQuestion(randomCVCWord);
  
  console.log('🎯 Selected CVC spelling question:', {
    id: spellingQuestion.id,
    word: spellingQuestion.word,
    audio: spellingQuestion.audio,
    questionText: spellingQuestion.questionText,
    vowel: randomCVCWord.vowel,
    difficulty: randomCVCWord.difficulty,
    category: randomCVCWord.category
  });
  
  return spellingQuestion;
};

/**
 * Check if a word follows CVC pattern (Consonant-Vowel-Consonant)
 */
export const isCVCWord = (word: string): boolean => {
  if (word.length !== 3) return false;
  
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const vowels = 'aeiou';
  
  const firstChar = word[0].toLowerCase();
  const secondChar = word[1].toLowerCase();
  const thirdChar = word[2].toLowerCase();
  
  return consonants.includes(firstChar) && 
         vowels.includes(secondChar) && 
         consonants.includes(thirdChar);
};

/**
 * Filter existing spelling questions to only include CVC words
 */
export const getCVCSpellingQuestionsFromBank = (): SpellingQuestion[] => {
  const allSpellingQuestions = getAllSpellingQuestions();
  return allSpellingQuestions.filter(question => isCVCWord(question.audio));
};