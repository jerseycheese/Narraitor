// src/types/@google/genai.d.ts

declare module '@google/genai' {
  export interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  }

  export interface SafetySetting {
    category: string;
    threshold: string;
  }

  export interface GenerateContentResponse {
    text: string;
    result?: {
      finishReason: string;
    };
  }

  export interface GenerateContentConfig {
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
  }

  export interface ModelInterface {
    generateContent(params: {
      model: string;
      contents: string;
      config?: GenerateContentConfig;
    }): Promise<GenerateContentResponse>;
  }

  export interface ModelsInterface {
    generateContent(params: {
      model: string;
      contents: string;
      config?: GenerateContentConfig;
    }): Promise<GenerateContentResponse>;
  }

  export class GoogleGenAI {
    constructor(config: { apiKey: string });
    models: ModelsInterface;
  }
}
