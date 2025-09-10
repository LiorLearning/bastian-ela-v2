import React, { useState, useEffect, useMemo } from 'react';
import { useCoins } from '@/pages/coinSystem';
import { ttsService } from '@/lib/tts-service';
import { useTTSSpeaking } from '@/hooks/use-tts-speaking';
import { usePetData } from '@/lib/pet-data-service';

type Props = {};

type ActionStatus = 'happy' | 'sad' | 'neutral';

interface ActionButton {
  id: string;
  icon: string;
  status: ActionStatus;
  label: string;
}

export function PetPage({}: Props): JSX.Element {
  // Use shared coin system
  const { coins, spendCoins, hasEnoughCoins, setCoins } = useCoins();
  
  // Use shared pet data system
  const { careLevel, ownedPets, audioEnabled, setCareLevel, addOwnedPet, setAudioEnabled, isPetOwned, getCoinsSpentForCurrentStage, getPetCoinsSpent, addPetCoinsSpent } = usePetData();
  
  // State for which pet is currently being displayed
  const [currentPet, setCurrentPet] = useState('link'); // Default to link
  
  // Local state for UI interactions
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [previousCoins, setPreviousCoins] = useState(coins);
  const [previousCoinsSpentForStage, setPreviousCoinsSpentForStage] = useState(0);
  const [showPetShop, setShowPetShop] = useState(false);
  const [lastSpokenMessage, setLastSpokenMessage] = useState('');
  
  // Streak system for chihuahua evolution unlocks - based on consecutive calendar days (US timezone)
  const [currentStreak, setCurrentStreak] = useState(() => {
    try {
      const streakData = localStorage.getItem('pet_feeding_streak_data');
      if (streakData) {
        const parsed = JSON.parse(streakData);
        return Math.max(0, parsed.streak || 0);
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Get current date in US timezone (Eastern Time)
  const getCurrentUSDate = () => {
    const now = new Date();
    const usDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    return usDate.toDateString(); // Returns format like "Mon Jan 01 2024"
  };

  // Load and validate streak data
  const getStreakData = () => {
    try {
      const stored = localStorage.getItem('pet_feeding_streak_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse streak data:', error);
    }
    return { streak: 0, lastFeedDate: null, feedDates: [] };
  };

  // Save streak data to localStorage
  const saveStreakData = (streakData: { streak: number; lastFeedDate: string; feedDates: string[] }) => {
    try {
      localStorage.setItem('pet_feeding_streak_data', JSON.stringify(streakData));
      setCurrentStreak(streakData.streak);
    } catch (error) {
      console.warn('Failed to save streak data:', error);
    }
  };

  // Update streak based on feeding date
  const updateStreak = () => {
    const currentDate = getCurrentUSDate();
    const streakData = getStreakData();
    
    // If already fed today, don't update streak
    if (streakData.lastFeedDate === currentDate) {
      return streakData.streak;
    }

    let newStreak = streakData.streak;
    const feedDates = [...(streakData.feedDates || [])];

    // Add today's date to feed dates
    if (!feedDates.includes(currentDate)) {
      feedDates.push(currentDate);
    }

    // Check if this continues a streak
    if (streakData.lastFeedDate) {
      const lastDate = new Date(streakData.lastFeedDate);
      const today = new Date(currentDate);
      const daysDifference = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 1) {
        // Consecutive day - increment streak
        newStreak = streakData.streak + 1;
      } else if (daysDifference > 1) {
        // Gap in feeding - reset streak to 1
        newStreak = 1;
      }
      // If daysDifference === 0, it means same day (already handled above)
    } else {
      // First time feeding
      newStreak = 1;
    }

    const newStreakData = {
      streak: newStreak,
      lastFeedDate: currentDate,
      feedDates: feedDates.slice(-30) // Keep last 30 days for performance
    };

    saveStreakData(newStreakData);
    return newStreak;
  };

  // Initialize streak and previous coins spent on component mount
  useEffect(() => {
    const streakData = getStreakData();
    if (streakData.lastFeedDate) {
      const currentDate = getCurrentUSDate();
      const lastDate = new Date(streakData.lastFeedDate);
      const today = new Date(currentDate);
      const daysDifference = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If more than 1 day has passed since last feeding, reset streak
      if (daysDifference > 1) {
        const resetStreakData = {
          streak: 0,
          lastFeedDate: streakData.lastFeedDate,
          feedDates: streakData.feedDates || []
        };
        saveStreakData(resetStreakData);
      }
    }
    
    // Initialize previous coins spent for current stage
    setPreviousCoinsSpentForStage(getCoinsSpentForCurrentStage(currentStreak));
  }, []);
  
  // TTS message ID for tracking speaking state
  const petMessageId = 'pet-message';
  const isSpeaking = useTTSSpeaking(petMessageId);
  
  // Pet action states
  const [actionStates, setActionStates] = useState<ActionButton[]>([
    { id: 'water', icon: '🍪', status: 'sad', label: 'Food' },
    { id: 'more', icon: '🐾', status: 'neutral', label: 'More' }
  ]);

  const handleActionClick = (actionId: string) => {
    // Don't deduct coins for "More" action - always open pet shop
    if (actionId === 'more') {
      // Stop any current audio when opening pet shop
      ttsService.stop();
      setShowPetShop(true);
      return;
    }

    // Check if player has enough coins for feeding actions
    if (!hasEnoughCoins(10)) {
      alert("Not enough coins! You need 10 coins to perform this action.");
      return;
    }

    // Play feeding sound
    playFeedingSound();

    // Deduct coins and increase care level
    spendCoins(10);
    setCareLevel(Math.min(careLevel + 1, 6), currentStreak); // Max 6 actions, pass current streak
    
    // Track coins spent on current pet
    addPetCoinsSpent(currentPet, 10);
    
    // Update streak based on calendar days
    const newStreak = updateStreak();

    // Trigger heart animation
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);

    // Update action status to happy
    setActionStates(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, status: 'happy' }
        : action
    ));
  };

  const getStatusEmoji = (status: ActionStatus) => {
    switch (status) {
      // case 'happy': return '😊';
      // case 'sad': return '😢';
      case 'neutral': return '';
      default: return '';
    }
  };

  // Sound effect functions
  const playFeedingSound = () => {
    try {
      // Create a pleasant "nom nom" eating sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a short, pleasant eating sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant "crunch" sound frequencies
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.type = 'triangle';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const playEvolutionSound = () => {
    try {
      // Create a magical "sparkle" evolution sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create multiple tones for a magical effect
      const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + index * 0.1 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.8);
        
        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + index * 0.1 + 0.8);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Get Link images based on coins spent
  const getLinkImage = (coinsSpent: number) => {
    if (coinsSpent >= 50) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_222731_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else if (coinsSpent >= 30) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_221432_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else if (coinsSpent >= 10) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_221400_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_221353_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    }
  };

  // COMMENTED OUT - Old Chihuahua (Robber) images
  /*
  const getChihuahuaImage = (coinsSpent: number) => {
    if (coinsSpent >= 50) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250903_183026_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else if (coinsSpent >= 30) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250903_181808_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else if (coinsSpent >= 10) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250903_181415_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250903_180656_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    }
  };
  */

  // COMMENTED OUT - Old Frog images
  /*
  const getFrogImage = (coinsSpent: number) => {
    if (coinsSpent >= 50) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_170305_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else if (coinsSpent >= 30) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_170258_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else if (coinsSpent >= 10) {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_170245_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    } else {
      return "https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250908_170229_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN";
    }
  };
  */

  const getPetImage = () => {
    // Check if Link is being displayed - this is the default unlocked teammate
    if (currentPet === 'link') {
      // For Link, use pet-specific coin tracking
      const linkCoinsSpent = getPetCoinsSpent('link');
      return getLinkImage(linkCoinsSpent);
    }
    
    // COMMENTED OUT - Old pet logic
    /*
    // Check if Chihuahua (Robber) is being displayed - this is the default unlocked pet
    if (currentPet === 'chihuahua') {
      // For Chihuahua, use pet-specific coin tracking
      const chihuahuaCoinsSpent = getPetCoinsSpent('chihuahua');
      return getChihuahuaImage(chihuahuaCoinsSpent);
    }
    
    // Check if Frog is owned and being displayed
    if (currentPet === 'frog' && isPetOwned('frog')) {
      // For Frog, use pet-specific coin tracking
      const frogCoinsSpent = getPetCoinsSpent('frog');
      return getFrogImage(frogCoinsSpent);
    }
    */
    
    // Default fallback to link image if no other teammate is selected
    return getLinkImage(getPetCoinsSpent('link'));
  };

  const handlePetPurchase = (petType: string, cost: number) => {
    if (!hasEnoughCoins(cost)) {
      alert(`Not enough coins! You need ${cost} coins to buy this pet.`);
      return;
    }

    if (isPetOwned(petType)) {
      alert("You already own this pet!");
      return;
    }

    // Deduct coins and add pet to owned pets
    spendCoins(cost);
    addOwnedPet(petType);
    
    // Switch to the newly purchased pet
    setCurrentPet(petType);
    
    // Play purchase sound (reuse evolution sound for now)
    playEvolutionSound();
    
    // Special message for new teammates about arrival time
    if (petType === 'donkey-kong') {
      alert(`🎉 Congratulations! You recruited Donkey Kong! 🚚 Your new teammate will arrive at your base within 24 hours!`);
    } else if (petType === 'mario') {
      alert(`🎉 Congratulations! You recruited Mario! 🚚 Your new teammate will arrive at your base within 24 hours!`);
    } else {
      alert(`🎉 Congratulations! You recruited ${petType}!`);
    }

    // COMMENTED OUT - Old pet purchase messages
    /*
    if (petType === 'frog') {
      alert(`🎉 Congratulations! You bought a Frog! 🚚 Your new pet will arrive in your pet park within 24 hours!`);
    } else {
      alert(`🎉 Congratulations! You bought a ${petType}!`);
    }
    */
  };

  const availablePets = [
    { id: 'donkey-kong', emoji: '🦍', name: 'Donkey Kong', cost: 60 },
    { id: 'mario', emoji: '👨‍🔧', name: 'Mario', cost: 80, locked: true } // Coming soon - locked for now
  ];

  // COMMENTED OUT - Old available pets
  /*
  const availablePets = [
    { id: 'frog', emoji: '🐸', name: 'Frog', cost: 60 },
    { id: 'hen', emoji: '🐔', name: 'Hen', cost: 80, locked: true } // Coming soon - locked for now
  ];
  */

  // ElevenLabs Text-to-Speech function using the proper TTS service
  const speakText = async (text: string) => {
    if (!audioEnabled || text === lastSpokenMessage) return;
    
    try {
      // Stop any currently playing audio
      ttsService.stop();
      
      setLastSpokenMessage(text);
      
      // Use the TTS service with a child-friendly voice and appropriate settings
      await ttsService.speak(text, {
        stability: 0.7,
        similarity_boost: 0.8,
        speed: 0.9, // Slightly slower for better comprehension
        messageId: petMessageId,
        voice: 'cgSgspJ2msm6clMCkdW9' // Jessica voice - warm and friendly for children
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  const getPetThought = () => {
    // Helper function to randomly select from an array of thoughts
    const getRandomThought = (thoughts: string[]) => {
      return thoughts[Math.floor(Math.random() * thoughts.length)];
    };
    
    // COMMENTED OUT - Old frog pet thoughts
    /*
    // Different thoughts for different pets
    if (currentPet === 'frog' && isPetOwned('frog')) {
      const frogCoinsSpent = getPetCoinsSpent('frog');
      
      if (frogCoinsSpent === 0) {
        const hungryThoughts = [
          "Ribbit ribbit! 🐸 I'm your new Frog! My lily pad belly is empty... can you feed me some flies?",
          "Hey there, Bastian! 🌿 Frog here! I'm hopping from hunger... got any treats?",
          "Ribbit! It's me, your amphibian friend! 🐸 My tummy is croaking for some food!",
          "Hi Bastian! Your Frog needs some yummy flies! 🪰 My pond appetite is huge!",
          "Ribbit ribbit! 🐸 I'm starving! Can you help your frog friend with some treats?",
          "Bastian! 🌿 Your Frog is so hungry... flies would make me leap with joy!"
        ];
        return getRandomThought(hungryThoughts);
      } else if (frogCoinsSpent < 30) {
        const satisfiedThoughts = [
          "Ribbit ribbit! 🌿 More flies will make this frog hop with joy!",
          "Ribbit ribbit! Those flies were amazing! 🐸 But I could eat more!",
          "Yum yum! 🪰 These treats are perfect for a growing frog like me!",
          "Ribbit! Those flies hit the spot! 🐸 But my pond appetite is still growing!",
          "Thank you, Bastian! 🥰 Those flies were perfect, but I'm still a little peckish!",
          "Delicious! 🌿 I'm hopping so fast! More flies would make me leap with happiness!"
        ];
        return getRandomThought(satisfiedThoughts);
      } else if (frogCoinsSpent < 50) {
        const growingThoughts = [
          "Ribbit ribbit! I'm growing stronger! 🐸 Keep feeding me - I'm getting bigger and more athletic!",
          "Look at me leap! 💪 I can feel myself getting stronger with each fly!",
          "Amazing! I'm growing so fast! 🌿 More flies will help me become the ultimate frog!",
          "Bastian, I feel so energetic! ⚡ These flies are making me bigger and more agile!",
          "Ribbit ribbit! I'm transforming! 🦋 Keep the flies coming - I'm almost ready for the next stage!",
          "Incredible! My legs are growing! 🐸 More flies will help me reach my full potential!"
        ];
        return getRandomThought(growingThoughts);
      } else {
        const happyThoughts = [
          "Ribbit ribbit! 🥳 I feel amazing, Bastian! Now... could you get me some frog friends to play with!",
          "Ribbit ribbit! I'm so strong now! 💪 Maybe it's time to find some playmates to hop with?",
          "I feel fantastic! 🌟 All those flies worked! Now I'm ready for some pond adventures with friends!",
          "Amazing! I'm at my best! ✨ Bastian, can you help me find some buddies to leap around with?",
          "Hooray! I'm fully grown! 🎉 Can you help me find some frog friends to play with?",
          "Perfect! I feel incredible! 🚀 Maybe it's time to find some playmates for swamp adventures?"
        ];
        return getRandomThought(happyThoughts);
      }
    }
    */

    // Link is the default unlocked teammate - always available
    if (currentPet === 'link') {
      const linkCoinsSpent = getPetCoinsSpent('link');
      
      if (linkCoinsSpent === 0) {
        const hungryThoughts = [
          "Hey there, Bastian... 🗡️ I'm Link, and my belly feels so empty... could you spare some treats?",
          "Hi Bastian... ⚔️ It's me, Link, your teammate... I'm feeling so hungry... do you have any snacks?",
          "Hyah... It's me, your loyal companion Link... 🛡️ My tummy is growling for food, and it's making me sad.",
          "Hi Bastian... Link needs some treats... 🍖 My Hylian appetite is huge, and it's making me feel down.",
          "Hey Bastian... 🗡️ I'm starving... Can you help your teammate with some treats? I'm feeling so low.",
          "Bastian... ⚔️ I'm so hungry... treats would bring a little happiness to my day."
        ];
        return getRandomThought(hungryThoughts);
      } else if (linkCoinsSpent < 30) {
        const satisfiedThoughts = [
          "Awesome! 🗡️ More treats will make this hero dance with joy!",
          "Hyah hyah! Those treats were amazing! ⚔️ But Link could eat more!",
          "Yum yum! 🍖 These treats are perfect for a growing hero like me!",
          "Nice! Those treats hit the spot! 🛡️ But my heroic appetite is still growing!",
          "Thank you, Bastian! 🥰 Those treats were perfect, but I'm still a little peckish!",
          "Delicious! 🗡️ I'm so energetic! More treats would make me bounce with happiness!"
        ];
        return getRandomThought(satisfiedThoughts);
      } else if (linkCoinsSpent < 50) {
        const growingThoughts = [
          "Awesome! I'm growing stronger! ⚔️ Keep feeding me - I'm getting bigger and braver!",
          "Look at me go! 💪 I can feel myself getting stronger with each treat!",
          "Amazing! I'm growing so fast! 🗡️ More treats will help me become the ultimate hero!",
          "Bastian, I feel so energetic! ⚡ These treats are making me bigger and more confident!",
          "Wow! I'm transforming! 🦋 Keep the treats coming - I'm almost ready for the next stage!",
          "Incredible! My strength is growing! 🛡️ More treats will help me reach my full potential!"
        ];
        return getRandomThought(growingThoughts);
      } else {
        const happyThoughts = [
          "Amazing! 🥳 I feel incredible, Bastian! Now... could you get me some teammates to adventure with!",
          "Hyah hyah! I'm so strong now! 💪 Maybe it's time to find some companions to quest with?",
          "I feel fantastic! 🗡️ All those treats worked! Now I'm ready for some adventures with friends!",
          "Awesome! I'm at my best! ✨ Bastian, can you help me find some buddies to explore with?",
          "Hooray! I'm fully grown! 🎉 Can you help me find some teammates to adventure with?",
          "Perfect! I feel incredible! 🚀 Maybe it's time to find some companions for epic quests?"
        ];
        return getRandomThought(happyThoughts);
      }
    }

    // COMMENTED OUT - Old Chihuahua (Robber) thoughts
    /*
    if (currentPet === 'chihuahua') {
      const chihuahuaCoinsSpent = getPetCoinsSpent('chihuahua');
      
      if (chihuahuaCoinsSpent === 0) {
        const hungryThoughts = [
          "Yip yip! 🐕 I'm Robber the Chihuahua! My tiny belly is empty... can you feed me some treats?",
          "Hey there, Bastian! 🌟 Robber here! I'm shaking from hunger... got any snacks?",
          "Woof! It's me, your fierce little Robber! 🐕 My tummy is growling for some food!",
          "Hi Bastian! Robber needs some yummy treats! 🍖 My small but mighty appetite is huge!",
          "Yip yip! 🐕 I'm starving! Can you help your tiny warrior with some treats?",
          "Bastian! 🌟 Your Chihuahua Robber is so hungry... treats would make me wag my tail!"
        ];
        return getRandomThought(hungryThoughts);
      } else if (chihuahuaCoinsSpent < 30) {
        const satisfiedThoughts = [
          "Yip yip! 🌟 More treats will make this Chihuahua dance with joy!",
          "Woof woof! Those treats were amazing! 🐕 But Robber could eat more!",
          "Yum yum! 🍖 These treats are perfect for a growing Chihuahua like me!",
          "Yip! Those treats hit the spot! 🐕 But my fierce appetite is still growing!",
          "Thank you, Bastian! 🥰 Those treats were perfect, but I'm still a little peckish!",
          "Delicious! 🌟 My tail is wagging so fast! More treats would make me bounce with happiness!"
        ];
        return getRandomThought(satisfiedThoughts);
      } else if (chihuahuaCoinsSpent < 50) {
        const growingThoughts = [
          "Yip yip! I'm growing stronger! 🐕 Keep feeding me - I'm getting bigger and braver!",
          "Look at me strut! 💪 I can feel myself getting stronger with each treat!",
          "Amazing! I'm growing so fast! 🌟 More treats will help me become the ultimate Chihuahua!",
          "Bastian, I feel so energetic! ⚡ These treats are making me bigger and more confident!",
          "Yip yip! I'm transforming! 🦋 Keep the treats coming - I'm almost ready for the next stage!",
          "Incredible! My courage is growing! 🐕 More treats will help me reach my full potential!"
        ];
        return getRandomThought(growingThoughts);
      } else {
        const happyThoughts = [
          "Yip yip! 🥳 I feel amazing, Bastian! Now... could you get me some Chihuahua friends to play with!",
          "Woof woof! I'm so strong now! 💪 Maybe it's time to find some playmates to run with?",
          "I feel fantastic! 🌟 All those treats worked! Now I'm ready for some adventures with friends!",
          "Amazing! I'm at my best! ✨ Bastian, can you help me find some buddies to explore with?",
          "Hooray! I'm fully grown! 🎉 Can you help me find some Chihuahua friends to play with?",
          "Perfect! I feel incredible! 🚀 Maybe it's time to find some playmates for park adventures?"
        ];
        return getRandomThought(happyThoughts);
      }
    }
    */
    
    // Default fallback - should not reach here as link is always available
    return "Hey there, Bastian! 🗡️ I'm Link! Something seems wrong... can you help me?";
  };

  // Get coins spent for current pet
  const getCurrentPetCoinsSpent = () => {
    return getPetCoinsSpent(currentPet);
  };

  // Get current pet coins spent value
  const currentPetCoinsSpent = getCurrentPetCoinsSpent();

  // Memoize the pet thought so it only changes when the actual state changes
  const currentPetThought = useMemo(() => {
    return getPetThought();
  }, [currentPet, getCoinsSpentForCurrentStage(currentStreak), getPetCoinsSpent(currentPet)]);

  // Handle audio playback when message changes
  useEffect(() => {
    // Stop any currently playing audio when pet state changes
    ttsService.stop();
    
    // Only speak when:
    // 1. Not in pet shop
    // 2. Audio is enabled
    // 3. Message has changed
    if (!showPetShop && audioEnabled && currentPetThought !== lastSpokenMessage) {
      const timer = setTimeout(() => {
        speakText(currentPetThought);
      }, 500); // Small delay for smooth UX
      
      return () => clearTimeout(timer);
    }
  }, [currentPetThought, showPetShop, audioEnabled, lastSpokenMessage]);

  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: `url('https://tutor.mathkraft.org/_next/image?url=%2Fapi%2Fproxy%3Furl%3Dhttps%253A%252F%252Fdubeus2fv4wzz.cloudfront.net%252Fimages%252F20250903_181706_image.png&w=3840&q=75&dpl=dpl_2uGXzhZZsLneniBZtsxr7PEabQXN')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      fontFamily: 'Quicksand, system-ui, sans-serif'
    }}>
      {/* Glass overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>

      {/* Top UI - Coins and Streak */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
        {/* Coins */}
        <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 shadow-lg">
          <div className="flex items-center gap-2 text-white font-bold text-lg drop-shadow-md">
            <span className="text-xl">🪙</span>
            <span>{coins}</span>
          </div>
        </div>
        
        {/* Streak */}
        <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 border border-white/30 shadow-lg">
          <div className="flex items-center gap-2 text-white font-bold text-lg drop-shadow-md">
            <span className="text-xl">🔥</span>
            <span>{currentStreak}</span>
          </div>
        </div>
      </div>

      {/* Testing Buttons - Development Only */}
      <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-2">
        <button
          onClick={() => setCoins(100)}
          className="bg-transparent hover:bg-white/5 px-2 py-1 rounded text-transparent hover:text-white/20 text-xs transition-all duration-300 opacity-5 hover:opacity-30"
          title="Testing: Refill coins to 100"
        >
          🔄
        </button>
      </div>

      {/* Testing Button - Increase Streak (Development Only) */}
      <div className="absolute bottom-5 right-5 z-20">
        <button
          onClick={() => {
            const newStreak = currentStreak + 1;
            const streakData = getStreakData();
            const newStreakData = {
              ...streakData,
              streak: newStreak,
              lastFeedDate: getCurrentUSDate()
            };
            saveStreakData(newStreakData);
          }}
          className="bg-transparent hover:bg-white/5 px-2 py-1 rounded text-transparent hover:text-white/20 text-xs transition-all duration-300 opacity-5 hover:opacity-30"
          title="Testing: Increase streak by 1"
        >
          🔥
        </button>
      </div>

      {/* Top UI - Heart only */}
      <div className="absolute top-5 right-10 z-20">
        {/* Heart that fills with blood */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center relative bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg">
          <div style={{
            position: 'relative',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Heart outline */}
            <div style={{
              position: 'absolute',
              fontSize: 84,
              color: '#E5E7EB'
            }}>
              🤍
            </div>
            {/* Filled heart (blood) */}
            <div style={{
              position: 'absolute',
              fontSize: 84,
              color: '#DC2626',
              clipPath: `inset(${Math.max(0, 100 - (currentPetCoinsSpent * 1.8 + 5))}% 0 0 0)`,
              transition: 'clip-path 500ms ease'
            }}>
              ❤️
            </div>
          </div>
        </div>

        {/* Animated hearts moving from pet to main heart */}
        {showHeartAnimation && (
          <>
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              fontSize: 20,
              color: '#DC2626',
              animation: 'heartFlyFromPet1 1200ms ease-out forwards',
              pointerEvents: 'none',
              zIndex: 30
            }}>
              ❤️
            </div>
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              fontSize: 16,
              color: '#DC2626',
              animation: 'heartFlyFromPet2 1200ms ease-out forwards',
              animationDelay: '150ms',
              pointerEvents: 'none',
              zIndex: 30
            }}>
              ❤️
            </div>
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              fontSize: 18,
              color: '#DC2626',
              animation: 'heartFlyFromPet3 1200ms ease-out forwards',
              animationDelay: '300ms',
              pointerEvents: 'none',
              zIndex: 30
            }}>
              ❤️
            </div>
          </>
        )}
      </div>

      {/* Main pet area - moved down slightly */}
      <div className="flex-1 flex flex-col items-center justify-center relative pb-20 px-4 z-10 mt-16">
        {/* Pet Thought Bubble - Only show when pet shop is closed, moved down */}
        {!showPetShop && (
          <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-5 mb-8 border-3 border-blue-400 shadow-xl max-w-md w-full mx-4 backdrop-blur-sm bg-white/90">
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-blue-400"></div>
            
            {/* Thought bubble dots */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '0.3s'}}></div>
              <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: '0.6s'}}></div>
            </div>

            <div className="text-sm text-slate-800 font-medium leading-relaxed text-center">
              {currentPetThought}
            </div>
          </div>
        )}

        {/* Pet (Custom Image) */}
        <div className="relative drop-shadow-2xl">
          <img 
            src={getPetImage()}
            alt="Pet"
            className="w-80 h-80 object-contain rounded-2xl transition-all duration-700 ease-out hover:scale-105"
            style={{
              animation: careLevel * 10 >= 30 && careLevel * 10 < 50 ? 'petGrow 800ms ease-out' : 
                        careLevel * 10 >= 50 ? 'petEvolve 800ms ease-out' : 'none'
            }}
          />
        </div>
        
        {/* Food bowl */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-20 text-5xl drop-shadow-lg">
          🥣
        </div>
      </div>

      {/* Link Evolution Display - Right Side */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-4">
        {/* Young Link - Always available */}
        <div className="flex flex-col items-center">
          <div className="relative p-3 rounded-2xl border-2 transition-all duration-300 bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-lg">
            <div className="text-5xl transition-all duration-300 grayscale-0">
              🗡️
            </div>
            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          </div>
          <div className="text-xs font-semibold text-center mt-2 text-white drop-shadow-md">
            1 Day 🔥
          </div>
        </div>

        {/* Hero Link - Unlocks at 2 consecutive days */}
        <div className="flex flex-col items-center">
          <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
            currentStreak >= 2 
              ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 shadow-lg' 
              : 'bg-gray-100 border-gray-300 opacity-60'
          }`}>
            <div className={`text-6xl transition-all duration-300 ${
              currentStreak >= 2 ? 'grayscale-0' : 'grayscale'
            }`}>
              ⚔️
            </div>
            {currentStreak >= 2 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-center mt-2 text-white drop-shadow-md">
            {currentStreak >= 2 ? 'Hero Link' : '2 Days 🔥'}
          </div>
        </div>

        {/* Master Link - Unlocks at 3 consecutive days */}
        <div className="flex flex-col items-center">
          <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
            currentStreak >= 3 
              ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-lg' 
              : 'bg-gray-100 border-gray-300 opacity-60'
          }`}>
            <div className={`text-7xl transition-all duration-300 ${
              currentStreak >= 3 ? 'grayscale-0' : 'grayscale'
            }`}>
              🛡️
            </div>
            {currentStreak >= 3 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-center mt-2 text-white drop-shadow-md">
            {currentStreak >= 3 ? 'Master Link' : '3 Days 🔥'}
          </div>
        </div>

      </div>

      {/* COMMENTED OUT - Old Chihuahua Evolution Display */}
      {/*
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-4">
        <div className="flex flex-col items-center">
          <div className="relative p-3 rounded-2xl border-2 transition-all duration-300 bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-lg">
            <div className="text-5xl transition-all duration-300 grayscale-0">
              🐶
            </div>
            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          </div>
          <div className="text-xs font-semibold text-center mt-2 text-white drop-shadow-md">
            1 Day 🔥
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
            currentStreak >= 2 
              ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 shadow-lg' 
              : 'bg-gray-100 border-gray-300 opacity-60'
          }`}>
            <div className={`text-6xl transition-all duration-300 ${
              currentStreak >= 2 ? 'grayscale-0' : 'grayscale'
            }`}>
              🐕
            </div>
            {currentStreak >= 2 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-center mt-2 text-white drop-shadow-md">
            {currentStreak >= 2 ? 'Medium Chihuahua' : '2 Days 🔥'}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
            currentStreak >= 3 
              ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-lg' 
              : 'bg-gray-100 border-gray-300 opacity-60'
          }`}>
            <div className={`text-7xl transition-all duration-300 ${
              currentStreak >= 3 ? 'grayscale-0' : 'grayscale'
            }`}>
              🐺
            </div>
            {currentStreak >= 3 && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <div className="text-xs font-semibold text-center mt-2 text-white drop-shadow-md">
            {currentStreak >= 3 ? 'Large Chihuahua' : '3 Days 🔥'}
          </div>
        </div>
      </div>
      */}

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex gap-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl">
        {actionStates.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id)}
            className="flex flex-col items-center gap-1 p-3 bg-transparent border-none cursor-pointer rounded-xl min-w-16 transition-all duration-200 hover:bg-white/20 hover:-translate-y-1 active:scale-95"
          >
            {/* Status emoji */}
            {getStatusEmoji(action.status) && (
              <div className="absolute -top-2 -right-2 text-lg bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                {getStatusEmoji(action.status)}
              </div>
            )}
            
            {/* Action icon */}
            <div className="text-4xl drop-shadow-lg">
              {action.icon}
            </div>
            
            {/* Action label - small text below */}
            <div className="text-xs font-semibold text-white drop-shadow-md">
              {action.label}
            </div>
            
            {/* Coin cost for Food action */}
            {action.id === 'water' && (
              <div className="text-xs font-semibold text-yellow-300 drop-shadow-md">
                🪙 10
              </div>
            )}
          </button>
        ))}
        </div>
      </div>

      {/* Audio Toggle Button */}
      <button
        onClick={() => {
          setAudioEnabled(!audioEnabled);
          if (isSpeaking) {
            ttsService.stop();
          }
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full border-2 border-white/30 text-2xl flex items-center justify-center shadow-xl z-40 transition-all duration-200 hover:scale-110 active:scale-95 ${
          audioEnabled 
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' 
            : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
        }`}
      >
        {audioEnabled ? '🔊' : '🔇'}
      </button>

      {/* Teammate Switcher - Only show if user owns multiple teammates */}
      {ownedPets.length > 1 && (
        <div className="fixed top-24 left-6 z-20 flex flex-col gap-2">
          <div className="text-xs font-semibold text-white drop-shadow-md mb-1">
            Your Team:
          </div>
          {ownedPets.map((petId) => {
            const petEmoji = petId === 'link' ? '🗡️' : petId === 'donkey-kong' ? '🦍' : petId === 'mario' ? '👨‍🔧' : '🤺';
            const isActive = currentPet === petId;
            
            return (
              <button
                key={petId}
                onClick={() => setCurrentPet(petId)}
                className={`w-12 h-12 rounded-xl border-2 text-2xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-white text-white' 
                    : 'bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30'
                }`}
                title={`Switch to ${petId === 'link' ? 'Link' : petId === 'donkey-kong' ? 'Donkey Kong' : petId === 'mario' ? 'Mario' : petId}`}
              >
                {petEmoji}
              </button>
            );
          })}

          {/* COMMENTED OUT - Old pet switcher logic */}
          {/*
          {ownedPets.map((petId) => {
            const petEmoji = petId === 'chihuahua' ? '🐕' : petId === 'frog' ? '🐸' : '🐾';
            const isActive = currentPet === petId;
            
            return (
              <button
                key={petId}
                onClick={() => setCurrentPet(petId)}
                className={`w-12 h-12 rounded-xl border-2 text-2xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-white text-white' 
                    : 'bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30'
                }`}
                title={`Switch to ${petId === 'chihuahua' ? 'Robber (Chihuahua)' : petId === 'frog' ? 'Frog' : petId}`}
              >
                {petEmoji}
              </button>
            );
          })}
          */}
        </div>
      )}

      {/* Pet Shop Overlay */}
      {showPetShop && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 max-w-md w-11/12 max-h-[85vh] overflow-y-auto shadow-2xl relative border-2 border-gray-200">
            {/* Close button */}
            <button
              onClick={() => setShowPetShop(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white border-none cursor-pointer text-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              ×
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                🏪 Teammate Shop
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Recruit new teammates!
              </p>
              <p className="text-xs text-blue-600 font-medium mt-2">
                ✨ All teammates evolve as you feed them cookies! ✨
              </p>
            </div>



            {/* Available Pets */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 16
            }}>
              {availablePets.map((pet) => {
                const isOwned = isPetOwned(pet.id);
                const canAfford = hasEnoughCoins(pet.cost);
                const isLocked = pet.locked || false;
                
                return (
                  <div
                    key={pet.id}
                    style={{
                      background: isOwned 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : isLocked
                        ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                        : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      borderRadius: 16,
                      padding: '16px',
                      textAlign: 'center',
                      position: 'relative',
                      cursor: isOwned ? 'default' : isLocked ? 'not-allowed' : canAfford ? 'pointer' : 'not-allowed',
                      transition: 'all 200ms ease',
                      border: '2px solid rgba(255,255,255,0.2)',
                      opacity: isOwned ? 1 : isLocked ? 0.5 : canAfford ? 0.9 : 0.6
                    }}
                    onClick={() => {
                      if (isLocked) {
                        alert('🔒 This pet is coming soon! Stay tuned for future updates!');
                      } else if (!isOwned && canAfford) {
                        handlePetPurchase(pet.id, pet.cost);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isOwned && !isLocked && canAfford) {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOwned && !isLocked && canAfford) {
                        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Lock overlay for all unowned pets */}
                    {!isOwned && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 40,
                        height: 40,
                        background: isLocked ? 'rgba(220, 38, 38, 0.9)' : canAfford ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        {isLocked ? '🔒' : canAfford ? '💰' : '🔒'}
                      </div>
                    )}

                    {/* Pet emoji */}
                    <div style={{
                      fontSize: 48,
                      marginBottom: 8,
                      filter: isOwned ? 'none' : isLocked ? 'grayscale(100%) opacity(0.5)' : !canAfford ? 'grayscale(100%) opacity(0.7)' : 'grayscale(50%) opacity(0.9)'
                    }}>
                      {pet.emoji}
                    </div>

                    {/* Pet name */}
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: 'white',
                      margin: 0,
                      marginBottom: 6,
                      fontFamily: 'Quicksand, system-ui, sans-serif'
                    }}>
                      {pet.name}
                    </h3>

                    {/* Status/Price */}
                    <div style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 500
                    }}>
                      {isOwned ? '✅ Owned' : isLocked ? '🔒 Coming Soon' : canAfford ? `🪙 ${pet.cost} coins` : `🔒 Need ${pet.cost} coins`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current coins display */}
            <div className="text-center p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white font-semibold text-base shadow-lg">
              💰 Your coins: {coins}
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes petGrow {
            0% {
              opacity: 0.7;
              transform: scale(0.95);
            }
            50% {
              opacity: 0.9;
              transform: scale(1.05);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes petEvolve {
            0% {
              opacity: 0.6;
              transform: scale(0.9) rotate(-2deg);
            }
            25% {
              opacity: 0.8;
              transform: scale(1.1) rotate(1deg);
            }
            50% {
              opacity: 0.9;
              transform: scale(0.98) rotate(-0.5deg);
            }
            75% {
              opacity: 0.95;
              transform: scale(1.02) rotate(0.5deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }
          
          @keyframes heartbeat {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          
          @keyframes heartFlyFromPet1 {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translate(200px, -150px) scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: translate(350px, -280px) scale(0.3);
              opacity: 0;
            }
          }
          
          @keyframes heartFlyFromPet2 {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translate(180px, -120px) scale(0.7);
              opacity: 0.9;
            }
            100% {
              transform: translate(330px, -300px) scale(0.2);
              opacity: 0;
            }
          }
          
          @keyframes heartFlyFromPet3 {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translate(220px, -180px) scale(0.9);
              opacity: 0.7;
            }
            100% {
              transform: translate(370px, -260px) scale(0.4);
              opacity: 0;
            }
          }
          
          @keyframes thoughtBubble {
            0%, 100% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.2);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
