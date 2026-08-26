// src/components/Narrative/ChoiceOutcomeCallout.tsx

import React from 'react';
import { EntityID } from '@/types/common.types';
import { clsx } from 'clsx';
import { Consequence, DecisionOutcome } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useNPCStore } from '@/state/npcStore';
import { useWorldStore } from '@/state/worldStore';
import { resolveSkillData } from '@/lib/utils/gameDataResolver';
import { formatDecisionText } from '@/lib/narrative/formatDecisionText';

interface ChoiceOutcomeCalloutProps {
  decisionId: EntityID;
  decisionText: string;
  decisionOutcome?: DecisionOutcome;
  className?: string;
}

interface ConsequenceChip {
  key: string;
  kind: 'relationship' | 'alignment';
  direction: 'positive' | 'negative';
  label: string;
}

const parseTrustDelta = (value: Consequence['value']): number | undefined => {
  if (value && typeof value === 'object' && 'trustDelta' in value) {
    const delta = (value as { trustDelta?: unknown }).trustDelta;
    if (typeof delta === 'number' && Number.isFinite(delta) && delta !== 0) {
      return delta;
    }
  }
  return undefined;
};

/**
 * Maps the selected option's structured consequences to display chips.
 * Relationship chips need a resolvable NPC name; alignment chips render by
 * shift direction. Anything unresolvable is skipped rather than guessed.
 */
const buildConsequenceChips = (
  consequences: Consequence[],
  getNpcName: (id: EntityID) => string | undefined
): ConsequenceChip[] => {
  const chips: ConsequenceChip[] = [];

  consequences.forEach((consequence, index) => {
    if (consequence.type === 'relationship') {
      const delta = parseTrustDelta(consequence.value);
      const npcName = getNpcName(consequence.targetId);
      if (delta === undefined || !npcName) return;

      chips.push({
        key: `relationship-${consequence.targetId}-${index}`,
        kind: 'relationship',
        direction: delta > 0 ? 'positive' : 'negative',
        label: `${npcName} ${delta > 0 ? '+' : '−'}${Math.abs(delta)} trust`,
      });
      return;
    }

    if (consequence.type === 'alignment') {
      const value = typeof consequence.value === 'number' ? consequence.value : 0;
      if (value === 0) return;

      const magnitude = Math.abs(value);
      chips.push({
        key: `alignment-${index}`,
        kind: 'alignment',
        direction: value > 0 ? 'positive' : 'negative',
        label: `${value > 0 ? 'Order' : 'Chaos'} +${magnitude}`,
      });
    }
  });

  return chips;
};

/**
 * Displays a badge indicating that a narrative segment resulted from a player decision
 * (Issue #971 - Show decision consequences in narrative UI)
 */
const outcomeLabels: Record<DecisionOutcome, string> = {
  success: 'Success',
  failure: 'Failure',
  mixed: 'Mixed',
  'critical-success': 'Critical success',
  'critical-failure': 'Critical failure',
};

const buildOutcomeDecisionText = (
  decisionText: string,
  decisionOutcome?: DecisionOutcome
) => {
  if (!decisionOutcome) return decisionText;
  if (decisionOutcome === 'success' || decisionOutcome === 'critical-success') {
    return decisionText;
  }

  const trimmed = decisionText.trim();
  if (!trimmed) return decisionText;
  if (/^you\s+attempt\s+to\s+/i.test(trimmed)) {
    return trimmed;
  }
  if (/^you\s+choose\s+to\s+/i.test(trimmed)) {
    return trimmed.replace(/^you\s+choose\s+to\s+/i, 'You attempt to ');
  }
  if (/^you\s+/i.test(trimmed)) {
    return trimmed.replace(/^you\s+/i, 'You attempt to ');
  }

  const firstChar = trimmed.charAt(0);
  const normalized =
    firstChar && /[A-Z]/.test(firstChar)
      ? `${firstChar.toLowerCase()}${trimmed.slice(1)}`
      : trimmed;

  return `You attempt to ${normalized}`;
};

export const ChoiceOutcomeCallout: React.FC<ChoiceOutcomeCalloutProps> = ({
  decisionId,
  decisionText,
  decisionOutcome,
  className,
}) => {
  const decision = useNarrativeStore((state) => state.decisions[decisionId]);
  const getNpcById = useNPCStore((state) => state.getById);

  const selectedOption = decision?.options?.find(
    (option) => option.id === decision.selectedOptionId
  );

  // Snapshot — world skills don't change during a session, so no subscription needed.
  const worldSkills = Object.values(
    useWorldStore.getState()?.worlds ?? {}
  ).flatMap((w) => w.skills ?? []);

  const skillReq = selectedOption?.requirements?.find(
    (r) => r.type === 'skill'
  );
  const resolvedSkill = skillReq
    ? resolveSkillData(skillReq.targetId, worldSkills)
    : undefined;

  // A typed action is a first-person sentence, so it takes neither prefix -
  // "You attempt to I walk over..." is the same person shift. Rendering it from
  // the option rather than the stored text also repairs sessions saved before
  // addSegment stopped mangling it. The outcome label carries the failure.
  const displayDecisionText = selectedOption?.isCustomInput
    ? formatDecisionText(selectedOption)
    : buildOutcomeDecisionText(decisionText, decisionOutcome);

  const baseOutcomeLabel = decisionOutcome
    ? outcomeLabels[decisionOutcome]
    : 'Decision Logged';
  // Fold the skill name into the gutter label so the player knows which check
  // produced this outcome without needing the toast that was deleted.
  const outcomeLabel =
    decisionOutcome && resolvedSkill
      ? `${baseOutcomeLabel} · ${resolvedSkill.name}`
      : baseOutcomeLabel;

  const chips = buildConsequenceChips(
    selectedOption?.consequences ?? [],
    (id) => getNpcById(id)?.name
  );

  return (
    <div
      className={clsx(
        'choice-outcome-callout',
        className
      )}
      data-decision-id={decisionId}
      data-outcome={decisionOutcome || 'decision'}
    >
      <div className="choice-outcome-label">{outcomeLabel}</div>
      <p className="choice-outcome-text">{displayDecisionText}</p>
      {chips.length > 0 && (
        <ul className="choice-outcome-consequences">
          {chips.map((chip) => (
            <li
              key={chip.key}
              className="choice-outcome-chip"
              data-kind={chip.kind}
              data-direction={chip.direction}
            >
              {chip.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
