import React from 'react';
import { 
  getSpellingConfig, 
  updateSpellingConfig, 
  resetSpellingConfig,
  spellingModeDescriptions,
  cvcDifficultyDescriptions,
  type SpellingConfig,
  type SpellingMode,
  type CVCDifficulty 
} from '@/config/spelling-config';

interface SpellingSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (config: SpellingConfig) => void;
  currentConfig: SpellingConfig;
  spellingStats: { correct: number; total: number };
}

export default function SpellingSettings({ 
  isOpen, 
  onClose, 
  onConfigChange, 
  currentConfig, 
  spellingStats 
}: SpellingSettingsProps) {
  if (!isOpen) return null;

  const handleModeChange = (mode: SpellingMode) => {
    const newConfig = updateSpellingConfig({ mode });
    onConfigChange(newConfig);
  };

  const handleDifficultyChange = (cvcDifficulty: CVCDifficulty) => {
    const newConfig = updateSpellingConfig({ cvcDifficulty });
    onConfigChange(newConfig);
  };

  const handleReset = () => {
    const newConfig = resetSpellingConfig();
    onConfigChange(newConfig);
  };

  const accuracy = spellingStats.total > 0 ? (spellingStats.correct / spellingStats.total * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 max-w-lg w-11/12 max-h-[85vh] overflow-y-auto shadow-2xl relative border-2 border-gray-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white border-none cursor-pointer text-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            📝 Spelling Settings
          </h2>
          <p className="text-sm text-gray-600 font-medium">
            Customize your spelling practice
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 Your Progress</h3>
          <div className="flex justify-between text-sm">
            <span>Correct: <strong>{spellingStats.correct}</strong></span>
            <span>Total: <strong>{spellingStats.total}</strong></span>
            <span>Accuracy: <strong>{accuracy}%</strong></span>
          </div>
        </div>

        {/* Spelling Mode Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 Spelling Mode</h3>
          <div className="space-y-3">
            {Object.entries(spellingModeDescriptions).map(([mode, description]) => (
              <label key={mode} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="spellingMode"
                  value={mode}
                  checked={currentConfig.mode === mode}
                  onChange={() => handleModeChange(mode as SpellingMode)}
                  className="mt-1 w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-800 capitalize">
                    {mode === 'cvc-only' ? 'CVC Words Only' : 
                     mode === 'cvc-mixed' ? 'CVC + Other Words' : 
                     'All Words'}
                  </div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* CVC Difficulty (only show if CVC mode is selected) */}
        {(currentConfig.mode === 'cvc-only' || currentConfig.mode === 'cvc-mixed') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">⭐ CVC Difficulty</h3>
            <div className="space-y-3">
              {Object.entries(cvcDifficultyDescriptions).map(([difficulty, description]) => (
                <label key={difficulty} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="cvcDifficulty"
                    value={difficulty}
                    checked={currentConfig.cvcDifficulty === difficulty}
                    onChange={() => handleDifficultyChange(difficulty as CVCDifficulty)}
                    className="mt-1 w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="font-medium text-gray-800 capitalize">
                      {difficulty === 'progressive' ? '📈 Progressive' : 
                       difficulty === 'easy' ? '🟢 Easy' :
                       difficulty === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                    </div>
                    <div className="text-sm text-gray-600">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleReset}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg"
          >
            🔄 Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
          >
            ✅ Save & Close
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-l-4 border-yellow-500">
          <h4 className="font-semibold text-gray-800 mb-2">💡 What are CVC words?</h4>
          <p className="text-sm text-gray-700">
            CVC words follow the Consonant-Vowel-Consonant pattern (like <strong>cat</strong>, <strong>dog</strong>, <strong>sun</strong>). 
            They're perfect for early spelling practice because they're simple, phonetic, and easy to sound out!
          </p>
        </div>
      </div>
    </div>
  );
}
