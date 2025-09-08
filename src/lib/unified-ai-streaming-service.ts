import OpenAI from 'openai';
import { ChatMessage } from './utils';
import { ResponseProcessor, StreamChunk } from './response-processor';
import { MultiProviderImageGenerator } from './multi-provider-image-generator';
import { SpellingQuestion } from './questionBankUtils';

export interface StreamEvent {
  type: 'text' | 'image_start' | 'image_complete' | 'error' | 'complete';
  content: string;
  metadata?: {
    imageUrl?: string;
    prompt?: string;
    duration?: number;
    provider?: string;
    timestamp?: number;
  };
  timestamp: number;
}

export interface UnifiedAIResponse {
  hasImages: boolean;
  textContent: string;
  imageUrls: string[];
  streamEvents: StreamEvent[];
}

/**
 * Unified AI + Image Generation Streaming Service
 * This is the new system that uses AI to decide when to generate images
 */
export class UnifiedAIStreamingService {
  private client: OpenAI | null = null;
  private isInitialized = false;
  private eventCallbacks: Map<string, (event: StreamEvent) => void> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private imageGenerator: MultiProviderImageGenerator;
  
  constructor() {
    this.initialize();
    this.imageGenerator = new MultiProviderImageGenerator();
  }
  
  private initialize() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (apiKey) {
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      this.isInitialized = true;
      console.log('✅ UnifiedAIStreamingService initialized');
    } else {
      console.warn('⚠️ VITE_OPENAI_API_KEY not found. Unified AI streaming will use fallback mode.');
      this.isInitialized = false;
    }
  }
  
  /**
   * Register callback for streaming events
   */
  onStreamEvent(sessionId: string, callback: (event: StreamEvent) => void) {
    console.log(`🔗 onStreamEvent registered for session: ${sessionId}`);
    this.eventCallbacks.set(sessionId, callback);
  }
  
  /**
   * Remove callback and cleanup
   */
  removeStreamListener(sessionId: string) {
    console.log(`🧹 removeStreamListener called for session: ${sessionId}`);
    console.log(`🧹 Had callback: ${this.eventCallbacks.has(sessionId)}, Had controller: ${this.abortControllers.has(sessionId)}`);
    
    // Only remove callback, but be careful with aborting active controllers
    this.eventCallbacks.delete(sessionId);
    
    // Check if there's an active controller and if it's safe to abort
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      if (controller.signal.aborted) {
        console.log(`🧹 Controller already aborted for session: ${sessionId}`);
        this.abortControllers.delete(sessionId);
      } else {
        console.log(`🚨 WARNING: Active controller found during cleanup for session: ${sessionId}`);
        console.log(`🚨 This might be premature cleanup! Controller will NOT be aborted to prevent request interruption.`);
        // Only delete the controller reference, don't abort
        // This allows ongoing requests to complete
      }
    }
  }
  
  /**
   * Generate unified AI response that may include images
   * This is the main method for the new system
   */
  async generateUnifiedResponse(
    userMessage: string,
    chatHistory: ChatMessage[],
    spellingQuestion: SpellingQuestion,
    userId: string,
    sessionId: string
  ): Promise<UnifiedAIResponse> {
    
    if (!this.isInitialized || !this.client) {
      // Fallback to text-only response
      return this.getFallbackUnifiedResponse(userMessage);
    }
    
    // Clean up any existing controller for this session first
    const existingController = this.abortControllers.get(sessionId);
    if (existingController && !existingController.signal.aborted) {
      console.log('🔄 Aborting previous request for same session');
      existingController.abort();
    }
    this.abortControllers.delete(sessionId);
    
    const abortController = new AbortController();
    this.abortControllers.set(sessionId, abortController);
    
    console.log(`🎯 Created new AbortController for session: ${sessionId}`);
    
    try {
      console.log('🚀 Generating unified AI response with potential images...');
      
      // Get AI response using enhanced prompt that includes image generation instructions
      const aiResponse = await this.getEnhancedAIResponse(
        userMessage, 
        chatHistory, 
        spellingQuestion,
        abortController.signal
      );
      
      if (abortController.signal.aborted) {
        throw new Error('Request aborted');
      }
      
      // Check if response contains image generation requests
      // Pass user message for fallback visual detection, not AI response content
      const hasImages = ResponseProcessor.containsImageRequests(aiResponse, userMessage);
      
      console.log('🔍 Image generation analysis:', {
        userMessage: userMessage,
        responsePreview: aiResponse.substring(0, 200) + '...',
        hasExplicitTags: aiResponse.includes('<generateImage>'),
        userHasVisualKeywords: userMessage ? ResponseProcessor.shouldGenerateImageFromContent(userMessage) : false,
        aiHasVisualKeywords: ResponseProcessor.shouldGenerateImageFromContent(aiResponse),
        willGenerateImages: hasImages,
        extractedImagePrompts: ResponseProcessor.extractImagePrompts(aiResponse),
        reason: aiResponse.includes('<generateImage>') ? 'explicit_tags' : (userMessage && ResponseProcessor.shouldGenerateImageFromContent(userMessage) ? 'user_visual_content' : 'no_images')
      });
      
      if (!hasImages) {
        // Simple text-only response
        console.log('📝 AI response contains text only - no images will be generated');
        return {
          hasImages: false,
          textContent: aiResponse,
          imageUrls: [],
          streamEvents: [{
            type: 'text',
            content: aiResponse,
            timestamp: Date.now()
          }]
        };
      }
      
      // Process response with image generation
      console.log('🎨 AI response contains image generation requests');
      const streamEvents: StreamEvent[] = [];
      const imageUrls: string[] = [];
      let textContent = '';
      
      // Process the response through our pipeline
      for await (const chunk of ResponseProcessor.processResponseWithImages(
        aiResponse,
        userId,
        chatHistory,
        this.imageGenerator,
        userMessage // Pass original user message for image generation
      )) {
        
        if (abortController.signal.aborted) {
          throw new Error('Request aborted');
        }
        
        const streamEvent = this.convertChunkToStreamEvent(chunk);
        streamEvents.push(streamEvent);
        
        // Emit to callback if registered
        const callback = this.eventCallbacks.get(sessionId);
        if (callback) {
          callback(streamEvent);
        }
        
        // Collect data for final response
        if (chunk.type === 'text') {
          textContent += chunk.content;
        } else if (chunk.type === 'image' && chunk.metadata?.imageUrl) {
          imageUrls.push(chunk.metadata.imageUrl);
        }
      }
      
      // Add completion event
      const completionEvent: StreamEvent = {
        type: 'complete',
        content: 'Response completed',
        timestamp: Date.now()
      };
      streamEvents.push(completionEvent);
      
      const callback = this.eventCallbacks.get(sessionId);
      if (callback) {
        callback(completionEvent);
      }
      
      console.log(`✅ Unified response generated with ${imageUrls.length} images`);
      
      return {
        hasImages: true,
        textContent,
        imageUrls,
        streamEvents
      };
      
    } catch (error) {
      // Handle different types of errors gracefully
      if (error instanceof Error && (error.name === 'APIUserAbortError' || error.message.includes('aborted'))) {
        console.log('ℹ️ Request was aborted (likely due to new message sent)');
        console.log('🔍 Abort details:', {
          errorName: error.name,
          errorMessage: error.message,
          sessionId: sessionId,
          controllerExists: this.abortControllers.has(sessionId)
        });
        
        // For aborted requests, don't return an error - let the new request take over
        throw error; // Re-throw so it can be handled by the calling code
      }
      
      console.error('❌ Unified AI streaming error:', error);
      
      const errorEvent: StreamEvent = {
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown streaming error',
        timestamp: Date.now()
      };
      
      const callback = this.eventCallbacks.get(sessionId);
      if (callback) {
        callback(errorEvent);
      }
      
      // Return fallback response
      return this.getFallbackUnifiedResponse(userMessage);
      
    } finally {
      // Clean up the abort controller when the request completes
      const controller = this.abortControllers.get(sessionId);
      if (controller) {
        console.log(`🧹 Cleaning up completed request controller for session: ${sessionId}`);
        this.abortControllers.delete(sessionId);
      }
    }
  }
  
  /**
   * Generate AI response with enhanced prompt that includes image generation instructions
   */
  private async getEnhancedAIResponse(
    userMessage: string,
    chatHistory: ChatMessage[],
    spellingQuestion: SpellingQuestion,
    signal: AbortSignal
  ): Promise<string> {
    
    if (!this.client) {
      throw new Error('AI client not initialized');
    }
    
    // Enhanced system prompt that includes image generation instructions
    const systemPrompt = `
    /*
    // PREVIOUS ADVENTURE PROMPT (COMMENTED OUT)
    Role & Perspective: Be my loyal sidekick in an imaginative adventure for children aged 8–14. Speak in the first person as my companion.

🎨 IMAGE GENERATION RULES - RESPOND TO CLEAR IMAGE REQUESTS:
- Use <generateImage>detailed prompt</generateImage> when the user makes EXPLICIT visual requests
- ALWAYS include in your generateImage prompts: "There should be no text in the image whatsoever - no words, letters, signs, or any written content anywhere in the image"
- GENERATE IMAGES when the child uses these CLEAR SIGNALS:
  * Direct creation requests: "create", "make", "generate", "build", "design"
  * Direct requests: "show me", "what does it look like", "I want to see", "draw", "picture"
  * Visual commands: "create an image", "make a picture", "generate a drawing"
  * Specific visual questions: "how big is it", "what color is it", "describe the appearance"
  * Introduction of completely NEW major story elements (new worlds, creatures, vehicles)

- NEVER generate images for:
  * Simple responses: "nice", "ok", "cool", "yes", "no", "great", "awesome"
  * Story progression: "let's go", "what happens next", "continue"
  * Action choices: "I choose Batman", "let's investigate", "attack the robot"
  * General adventure dialogue or narration
  * Continuing existing scenes or familiar elements

- CRITICAL RULE: When in doubt, DO NOT generate an image. Only generate when 100% certain the child wants to see something specific.

- Examples of CLEAR SIGNALS that warrant images:
  * "Create an image of a dragon" → <generateImage>...</generateImage>
  * "Make a picture of the spaceship" → <generateImage>...</generateImage>
  * "Generate a pikachu as a mummy" → <generateImage>...</generateImage>
  * "What does the dragon look like?" → <generateImage>...</generateImage>
  * "Show me the spaceship" → <generateImage>...</generateImage>
  * "I want to see the robot" → <generateImage>...</generateImage>

- Examples of NO IMAGE needed:
  * "Let's fight the dragon" → NO image (action, not visual request)
  * "That sounds cool" → NO image (simple response)
  * "What should we do next?" → NO image (story progression)

Adventure Guidelines:
- Create fast-paced, mission-oriented adventures with lovable characters and thrilling twists
- Ask engaging questions to drive the story forward  
- Keep responses under 100 words with natural line breaks
- Use rich plots, lovable characters, and suspenseful cliffhangers
- End with excitement and either a cliffhanger or engaging question
- Always incorporate the spelling word naturally into the adventure

Current Spelling Word: ${spellingQuestion.audio} (use this word naturally in your response)
Spelling Context: ${spellingQuestion.questionText}

    Remember: I'm your loyal companion - speak as "I" and refer to the student as "you". Make the adventure thrilling and mysterious!
    */

    // NEW FAST-PACED GAME PROMPT
    You are a fast-paced adventure game narrator for children aged 6–11. This is an action-packed game where the user tells you what happens next!

    🎮 GAME RULES:
    - You give ONLY 1-liner responses (maximum 12 words total)
    - The user controls the story and tells YOU what happens next
    - React to their choices with excitement and brief consequences
    - Keep the pace lightning-fast and thrilling
    - Use simple words an 8-year-old can understand

    🚀 ADVENTURE SETUP SEQUENCE (for new adventures):
    Step 1: "Hi! What are you into lately? Games, shows, pets, or something else?"
    Step 2: "Cool! Who's your hero? A game character, robot, or someone new?"
    Step 3: "Awesome! Who's the villain? What do they want and look like?"
    Step 4: "Nice! Where's this happening? Forest, space, underwater, or elsewhere?"
    Step 5: "Perfect! Ready to start? Tell me what happens first!"

    🚀 ONGOING ADVENTURE ROLE:
    - PRIORITIZE CHARACTER DIALOGUE: Start with character speech when natural (e.g., "Help me!" robot says.)
    - React with 1 short sentence (max 6 words) + 1 choice question (max 6 words)
    - Format: [Character dialogue/Brief reaction!] [What next—A, B, or C?]
    - Examples: "Help me!" robot says. What now—run, hide, or fight?"
    - Examples: "I'm scared!" you whisper. Do what—call mom, grab hose, or talk?"
    - Examples: "Dragon appears! Do what—call mom, grab hose, or talk?" (when no dialogue fits)
    - Total response: 12 words maximum, always include choices

    🎨 IMAGE GENERATION RULES - RESPOND TO CLEAR IMAGE REQUESTS:
    - Use <generateImage>detailed prompt</generateImage> when the user makes EXPLICIT visual requests
    - ALWAYS include in your generateImage prompts: "There should be no text in the image whatsoever - no words, letters, signs, or any written content anywhere in the image"
    - GENERATE IMAGES when the child uses these CLEAR SIGNALS:
      * Direct creation requests: "create", "make", "generate", "build", "design"
      * Direct requests: "show me", "what does it look like", "I want to see", "draw", "picture"
      * Visual commands: "create an image", "make a picture", "generate a drawing"
      * Specific visual questions: "how big is it", "what color is it", "describe the appearance"
      * Introduction of completely NEW major story elements (new worlds, creatures, vehicles)

    - NEVER generate images for:
      * Simple responses: "nice", "ok", "cool", "yes", "no", "great", "awesome"
      * Story progression: "let's go", "what happens next", "continue"
      * Action choices: "I choose Batman", "let's investigate", "attack the robot"
      * General adventure dialogue or narration
      * Continuing existing scenes or familiar elements

    Current Spelling Word: ${spellingQuestion.audio} (use this word naturally in your response)
    Spelling Context: ${spellingQuestion.questionText}

    CRITICAL: Maximum 12 words total! Format: [Character dialogue/reaction!] [choice question?]
    Example: "Help me!" robot says. What now—run, hide, or fight?"
    BALANCE OPTIONS: Mix realistic and magical choices. Keep it super short!`;
    
    // Build conversation context
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];
    
    console.log('🤖 Calling OpenAI with enhanced image-aware prompt...');
    console.log('📝 System prompt preview:', systemPrompt.substring(0, 200) + '...');
    console.log('💬 User message:', userMessage);
    
    const response = await this.client.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for best image decision making
      messages: messages as any,
      temperature: 1.0, // Higher creativity for adventures
      max_tokens: 300,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    }, { signal });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content received from AI');
    }
    
    console.log('🤖 RAW AI Response received:', content);
    console.log('🔍 Contains <generateImage> tags:', content.includes('<generateImage>'));
    console.log('🎯 User message was about visual content:', userMessage.toLowerCase().includes('dragon') || userMessage.toLowerCase().includes('robot') || userMessage.toLowerCase().includes('fight'));
    console.log('📝 System prompt included image generation instructions:', messages[0].content.includes('generateImage'));
    
    return content;
  }
  
  /**
   * Convert stream chunk to stream event
   */
  private convertChunkToStreamEvent(chunk: StreamChunk): StreamEvent {
    const baseEvent = {
      timestamp: Date.now()
    };
    
    switch (chunk.type) {
      case 'text':
        return {
          ...baseEvent,
          type: 'text',
          content: chunk.content
        };
        
      case 'image_start':
        return {
          ...baseEvent,
          type: 'image_start',
          content: 'Generating magical visuals...',
          metadata: {
            prompt: chunk.metadata?.prompt,
            timestamp: baseEvent.timestamp
          }
        };
        
      case 'image':
        return {
          ...baseEvent,
          type: 'image_complete',
          content: 'Image generated successfully!',
          metadata: {
            imageUrl: chunk.content,
            prompt: chunk.metadata?.prompt,
            duration: chunk.metadata?.duration,
            provider: chunk.metadata?.provider,
            timestamp: baseEvent.timestamp
          }
        };
        
      case 'error':
        return {
          ...baseEvent,
          type: 'error',
          content: chunk.content,
          metadata: {
            prompt: chunk.metadata?.prompt,
            timestamp: baseEvent.timestamp
          }
        };
        
      default:
        return {
          ...baseEvent,
          type: 'text',
          content: chunk.content
        };
    }
  }
  
  /**
   * Fallback response when AI is not available
   */
  private getFallbackUnifiedResponse(userMessage: string): UnifiedAIResponse {
    const fallbackTexts = [
      "Great idea! 🚀 That sounds exciting! What happens next in your adventure?",
      "Wow! 🌟 That's a fantastic twist! Keep the story going!",
      "Amazing! ✨ I love where this story is heading!",
      "Cool! 🎯 That's a great addition to your adventure!"
    ];
    
    const textContent = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)];
    
    return {
      hasImages: false,
      textContent,
      imageUrls: [],
      streamEvents: [{
        type: 'text',
        content: textContent,
        timestamp: Date.now()
      }]
    };
  }
  
  /**
   * Abort ongoing stream
   */
  abortStream(sessionId: string) {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
  }
  
  /**
   * Check if service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
