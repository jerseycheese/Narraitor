// src/lib/ai/providers/middleware/messageNormalizer.ts

import type { ModelCapabilities } from '../capabilities';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Reshape a message list to what a specific model will actually accept.
 *
 * Two real quirks, both of which fail at the API rather than degrading quietly,
 * so both are worth handling before the request goes out:
 *
 * 1. **No system role.** Gemma and the Claude-family models don't take a
 *    `system` message in the list. The system text is prepended to the first
 *    user turn instead — losing the role, but keeping the instruction, which is
 *    the half that matters for a story prompt.
 * 2. **Alternating turns.** Mistral-family models reject consecutive same-role
 *    messages. Adjacent turns of one role are joined into one.
 *
 * Deliberately not handled: reordering, truncation, or dropping turns. Those
 * change what the model is asked, and a change the player can't see is worse
 * than a request that fails loudly.
 */
export function normalizeMessages(
  messages: ChatMessage[],
  capabilities: Pick<ModelCapabilities, 'systemRole' | 'alternatingTurns'>
): ChatMessage[] {
  const nonEmpty = messages.filter((message) => message.content.trim().length > 0);
  const withSystemHandled = capabilities.systemRole ? nonEmpty : injectSystemPrompts(nonEmpty);

  return capabilities.alternatingTurns ? coalesceAdjacentRoles(withSystemHandled) : withSystemHandled;
}

/**
 * Fold every system message into the first user turn, in order, so a model with
 * no system role still receives the instructions.
 *
 * A message list that is all system and no user becomes a single user turn:
 * sending nothing but system text to a model that ignores the role would send
 * an empty conversation.
 */
function injectSystemPrompts(messages: ChatMessage[]): ChatMessage[] {
  const systemText = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');

  const rest = messages.filter((message) => message.role !== 'system');
  if (!systemText) return rest;

  const firstUserIndex = rest.findIndex((message) => message.role === 'user');
  if (firstUserIndex === -1) {
    return [...rest, { role: 'user', content: systemText }];
  }

  return rest.map((message, index) =>
    index === firstUserIndex
      ? { ...message, content: `${systemText}\n\n${message.content}` }
      : message
  );
}

/** Join runs of same-role messages so user and assistant strictly alternate. */
function coalesceAdjacentRoles(messages: ChatMessage[]): ChatMessage[] {
  return messages.reduce<ChatMessage[]>((coalesced, message) => {
    const previous = coalesced[coalesced.length - 1];
    if (previous && previous.role === message.role) {
      coalesced[coalesced.length - 1] = {
        ...previous,
        content: `${previous.content}\n\n${message.content}`,
      };
      return coalesced;
    }
    return [...coalesced, message];
  }, []);
}
