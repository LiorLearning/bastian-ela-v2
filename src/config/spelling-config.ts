// Spelling Configuration System
// Allows switching between different spelling question modes

export type SpellingMode = 'all' | 'cvc-only' | 'cvc-mixed';
export type CVCDifficulty = 'easy' | 'medium' | 'hard' | 'progressive';

export interface SpellingConfig {
  mode: SpellingMode;
  cvcDifficulty: CVCDifficulty;
  enableDifficultyProgression: boolean;
  preferAdventureThemes: boolean;
}

// Default configuration
export const defaultSpellingConfig: SpellingConfig = {
  mode: 'cvc-only', // Default to CVC-only mode
  cvcDifficulty: 'progressive', // Start easy and get harder
  enableDifficultyProgression: true,
  preferAdventureThemes: true
};

// Local storage key for persisting config
const SPELLING_CONFIG_KEY = 'callee-spelling-config';

/**
 * Get current spelling configuration from localStorage or use defaults
 */
export const getSpellingConfig = (): SpellingConfig => {
  try {
    const stored = localStorage.getItem(SPELLING_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return { ...defaultSpellingConfig, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load spelling config:', error);
  }
  return defaultSpellingConfig;
};

/**
 * Save spelling configuration to localStorage
 */
export const saveSpellingConfig = (config: SpellingConfig): void => {
  try {
    localStorage.setItem(SPELLING_CONFIG_KEY, JSON.stringify(config));
    console.log('📝 Spelling config saved:', config);
  } catch (error) {
    console.warn('Failed to save spelling config:', error);
  }
};

/**
 * Update specific spelling configuration property
 */
export const updateSpellingConfig = (updates: Partial<SpellingConfig>): SpellingConfig => {
  const currentConfig = getSpellingConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveSpellingConfig(newConfig);
  return newConfig;
};

/**
 * Reset spelling configuration to defaults
 */
export const resetSpellingConfig = (): SpellingConfig => {
  saveSpellingConfig(defaultSpellingConfig);
  return defaultSpellingConfig;
};

/**
 * Get difficulty level based on user progress (for progressive mode)
 */
export const getProgressiveDifficulty = (correctAnswers: number, totalQuestions: number): CVCDifficulty => {
  if (totalQuestions < 5) return 'easy';
  
  const accuracy = correctAnswers / totalQuestions;
  
  if (accuracy >= 0.8 && totalQuestions >= 10) return 'hard';
  if (accuracy >= 0.6 && totalQuestions >= 5) return 'medium';
  return 'easy';
};

/**
 * Configuration descriptions for UI
 */
export const spellingModeDescriptions = {
  'all': 'Use all spelling words from the question bank',
  'cvc-only': 'Use only CVC (Consonant-Vowel-Consonant) words like cat, dog, sun',
  'cvc-mixed': 'Mix CVC words with other spelling words'
};

export const cvcDifficultyDescriptions = {
  'easy': 'Simple CVC words (cat, dog, sun)',
  'medium': 'Moderate CVC words (box, net, win)',
  'hard': 'Challenging CVC words (fox, mud, fit)',
  'progressive': 'Start easy and increase difficulty based on performance'
};
