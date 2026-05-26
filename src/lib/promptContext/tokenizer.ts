import { fromPreTrained } from '@lenml/tokenizer-gemini';

type GeminiTokenizer = ReturnType<typeof fromPreTrained>;

let instance: GeminiTokenizer | null = null;

function getTokenizer(): GeminiTokenizer {
  if (!instance) {
    instance = fromPreTrained();
  }
  return instance;
}

export function countTokens(text: string): number {
  if (!text) return 0;
  return getTokenizer().encode(text, { add_special_tokens: false }).length;
}

export function __resetForTests(): void {
  instance = null;
}
