'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ErrorBlock } from '@/components/shared';
import { World } from '@/types/world.types';
import { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';
import type { GeneratedCharacterData } from '@/lib/generators/characterGenerator';
import { characterApi } from '@/lib/api/characterApi';

type CardKey = 'description' | 'background' | 'attributes' | 'skills';

interface CharacterSuggestionsProps {
  world: World;
  concept: string;
  characterData: CharacterCreationData;
  onAdopt: (updates: Partial<CharacterCreationData>) => void;
}

const clamp = (value: number, min: number, max: number) => {
  // Non-finite inputs (e.g. NaN from a transient "-" or cleared number field)
  // would otherwise leak through Math.min/max and corrupt wizard state.
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

/**
 * Character development suggestions for the creation wizard.
 * Generates world-aligned description, background, attributes, and skills from
 * the user's concept, each with adopt / edit / dismiss controls.
 */
export const CharacterSuggestions: React.FC<CharacterSuggestionsProps> = ({
  world,
  concept,
  characterData,
  onAdopt,
}) => {
  const [suggestion, setSuggestion] = useState<GeneratedCharacterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<CardKey>>(new Set());
  const [editingCard, setEditingCard] = useState<CardKey | null>(null);

  // Editable working copies (initialized when a card enters edit mode)
  const [editDescription, setEditDescription] = useState('');
  const [editBackground, setEditBackground] = useState({
    history: '',
    personality: '',
    motivation: '',
    physicalDescription: '',
  });
  const [editAttributes, setEditAttributes] = useState<Record<string, number>>({});
  const [editSkills, setEditSkills] = useState<Record<string, number>>({});

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: GeneratedCharacterData = await characterApi.generateCharacter({
        world,
        concept,
        characterType: 'original',
        existingNames: [],
      });
      setSuggestion(data);
      setDismissed(new Set());
      setEditingCard(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate suggestions. Try again, or fill this in yourself.");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = (key: CardKey) => {
    setDismissed((prev) => new Set(prev).add(key));
    if (editingCard === key) setEditingCard(null);
  };

  // --- Adopt handlers -------------------------------------------------------

  const adoptDescription = (value: string) => {
    onAdopt({ description: value });
    dismiss('description');
  };

  const adoptBackground = (value: {
    history: string;
    personality: string;
    motivation: string;
    physicalDescription: string;
  }) => {
    onAdopt({
      background: {
        ...characterData.background,
        history: value.history,
        personality: value.personality,
        motivation: value.motivation,
        physicalDescription:
          value.physicalDescription || characterData.background.physicalDescription,
      },
    });
    dismiss('background');
  };

  const adoptAttributes = (values: Record<string, number>) => {
    const merged = characterData.attributes.map((attr) => {
      const next = values[attr.attributeId];
      // Skip non-finite edits (cleared input, lone "-", etc.) so we never
      // write NaN into wizard state — the existing value stays put.
      if (next === undefined || !Number.isFinite(next)) return attr;
      return { ...attr, value: clamp(next, attr.minValue, attr.maxValue) };
    });
    onAdopt({ attributes: merged });
    dismiss('attributes');
  };

  const adoptSkills = (values: Record<string, number>) => {
    const merged = characterData.skills.map((skill) => {
      const next = values[skill.skillId];
      if (next === undefined || !Number.isFinite(next)) return skill;
      return { ...skill, level: clamp(next, skill.minLevel, skill.maxLevel), isSelected: true };
    });
    onAdopt({ skills: merged });
    dismiss('skills');
  };

  // --- Derived suggestion views --------------------------------------------

  const attributeSuggestions = suggestion
    ? suggestion.attributes
        .map((a) => {
          const worldAttr = world.attributes.find((wa) => wa.id === a.id);
          return worldAttr
            ? {
                id: a.id,
                name: worldAttr.name,
                value: clamp(a.value, worldAttr.minValue, worldAttr.maxValue),
                minValue: worldAttr.minValue,
                maxValue: worldAttr.maxValue,
              }
            : null;
        })
        .filter((a): a is NonNullable<typeof a> => a !== null)
    : [];

  const skillSuggestions = suggestion
    ? suggestion.skills
        .map((s) => {
          const worldSkill = world.skills.find((ws) => ws.id === s.id);
          const wizardSkill = characterData.skills.find((cs) => cs.skillId === s.id);
          const minLevel = wizardSkill?.minLevel ?? worldSkill?.minValue ?? 0;
          const maxLevel = wizardSkill?.maxLevel ?? worldSkill?.maxValue ?? 10;
          return worldSkill
            ? {
                id: s.id,
                name: worldSkill.name,
                level: clamp(s.level, minLevel, maxLevel),
                minLevel,
                maxLevel,
              }
            : null;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
    : [];

  // --- Edit-mode initializers ----------------------------------------------

  const startEdit = (key: CardKey) => {
    if (!suggestion) return;
    if (key === 'description') {
      setEditDescription(suggestion.background.description);
    } else if (key === 'background') {
      setEditBackground({
        history: suggestion.background.description,
        personality: suggestion.background.personality,
        motivation: suggestion.background.motivation,
        physicalDescription: suggestion.background.physicalDescription || '',
      });
    } else if (key === 'attributes') {
      setEditAttributes(
        Object.fromEntries(attributeSuggestions.map((a) => [a.id, a.value]))
      );
    } else if (key === 'skills') {
      setEditSkills(Object.fromEntries(skillSuggestions.map((s) => [s.id, s.level])));
    }
    setEditingCard(key);
  };

  const isVisible = (key: CardKey) => suggestion && !dismissed.has(key);

  return (
    <section
      className="character-suggestions"
      role="region"
      aria-label="Character suggestions"
      aria-busy={loading}
    >
      <div className="character-suggestions-intro">
        <p className="character-suggestions-lead">
          Stuck for ideas? Generate world-aligned character details from your concept.
          You can adopt, edit, or dismiss each suggestion.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={handleGenerate}
          disabled={loading}
          className="character-suggestions-generate"
        >
          {loading ? 'Generating suggestions...' : 'Suggest character details'}
        </Button>
      </div>

      {loading && (
        <p className="character-suggestions-status" role="status">
          Generating world-aligned suggestions...
        </p>
      )}

      {error && (
        <div role="alert" className="character-suggestions-error">
          <ErrorBlock errors={[error]} />
        </div>
      )}

      {suggestion && (
        <div className="character-suggestions-list">
          {/* Description */}
          {isVisible('description') && (
            <SuggestionCard
              cardKey="description"
              title="Description"
              editing={editingCard === 'description'}
              onAdopt={() =>
                adoptDescription(
                  editingCard === 'description'
                    ? editDescription
                    : suggestion.background.description
                )
              }
              onEdit={() => startEdit('description')}
              onCancel={() => setEditingCard(null)}
              onDismiss={() => dismiss('description')}
            >
              {editingCard === 'description' ? (
                <>
                  <Label htmlFor="suggestion-description">Description</Label>
                  <Textarea
                    id="suggestion-description"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </>
              ) : (
                <p className="character-suggestion-text">
                  {suggestion.background.description}
                </p>
              )}
            </SuggestionCard>
          )}

          {/* Background */}
          {isVisible('background') && (
            <SuggestionCard
              cardKey="background"
              title="Background"
              editing={editingCard === 'background'}
              onAdopt={() =>
                adoptBackground(
                  editingCard === 'background'
                    ? editBackground
                    : {
                        history: suggestion.background.description,
                        personality: suggestion.background.personality,
                        motivation: suggestion.background.motivation,
                        physicalDescription:
                          suggestion.background.physicalDescription || '',
                      }
                )
              }
              onEdit={() => startEdit('background')}
              onCancel={() => setEditingCard(null)}
              onDismiss={() => dismiss('background')}
            >
              {editingCard === 'background' ? (
                <div className="character-suggestion-fields">
                  <Label htmlFor="suggestion-history">History</Label>
                  <Textarea
                    id="suggestion-history"
                    rows={3}
                    value={editBackground.history}
                    onChange={(e) =>
                      setEditBackground((p) => ({ ...p, history: e.target.value }))
                    }
                  />
                  <Label htmlFor="suggestion-personality">Personality</Label>
                  <Textarea
                    id="suggestion-personality"
                    rows={2}
                    value={editBackground.personality}
                    onChange={(e) =>
                      setEditBackground((p) => ({ ...p, personality: e.target.value }))
                    }
                  />
                  <Label htmlFor="suggestion-motivation">Motivation</Label>
                  <Textarea
                    id="suggestion-motivation"
                    rows={2}
                    value={editBackground.motivation}
                    onChange={(e) =>
                      setEditBackground((p) => ({ ...p, motivation: e.target.value }))
                    }
                  />
                </div>
              ) : (
                <dl className="character-suggestion-defs">
                  <dt>Personality</dt>
                  <dd>{suggestion.background.personality}</dd>
                  <dt>Motivation</dt>
                  <dd>{suggestion.background.motivation}</dd>
                  {suggestion.background.fears?.length > 0 && (
                    <>
                      <dt>Story hooks</dt>
                      <dd>{suggestion.background.fears.join(', ')}</dd>
                    </>
                  )}
                </dl>
              )}
            </SuggestionCard>
          )}

          {/* Attributes */}
          {isVisible('attributes') && attributeSuggestions.length > 0 && (
            <SuggestionCard
              cardKey="attributes"
              title="Attributes"
              editing={editingCard === 'attributes'}
              onAdopt={() =>
                adoptAttributes(
                  editingCard === 'attributes'
                    ? editAttributes
                    : Object.fromEntries(attributeSuggestions.map((a) => [a.id, a.value]))
                )
              }
              onEdit={() => startEdit('attributes')}
              onCancel={() => setEditingCard(null)}
              onDismiss={() => dismiss('attributes')}
            >
              <ul className="character-suggestion-stats">
                {attributeSuggestions.map((attr) => (
                  <li key={attr.id} className="character-suggestion-stat">
                    <span className="character-suggestion-stat-name">{attr.name}</span>
                    {editingCard === 'attributes' ? (
                      <Input
                        type="number"
                        aria-label={`${attr.name} value`}
                        min={attr.minValue}
                        max={attr.maxValue}
                        value={editAttributes[attr.id] ?? attr.value}
                        onChange={(e) =>
                          setEditAttributes((p) => ({
                            ...p,
                            [attr.id]: Number(e.target.value),
                          }))
                        }
                        className="character-suggestion-stat-input"
                      />
                    ) : (
                      <span className="character-suggestion-stat-value">{attr.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </SuggestionCard>
          )}

          {/* Skills */}
          {isVisible('skills') && skillSuggestions.length > 0 && (
            <SuggestionCard
              cardKey="skills"
              title="Skills"
              editing={editingCard === 'skills'}
              onAdopt={() =>
                adoptSkills(
                  editingCard === 'skills'
                    ? editSkills
                    : Object.fromEntries(skillSuggestions.map((s) => [s.id, s.level]))
                )
              }
              onEdit={() => startEdit('skills')}
              onCancel={() => setEditingCard(null)}
              onDismiss={() => dismiss('skills')}
            >
              <ul className="character-suggestion-stats">
                {skillSuggestions.map((skill) => (
                  <li key={skill.id} className="character-suggestion-stat">
                    <span className="character-suggestion-stat-name">{skill.name}</span>
                    {editingCard === 'skills' ? (
                      <Input
                        type="number"
                        aria-label={`${skill.name} level`}
                        min={skill.minLevel}
                        max={skill.maxLevel}
                        value={editSkills[skill.id] ?? skill.level}
                        onChange={(e) =>
                          setEditSkills((p) => ({
                            ...p,
                            [skill.id]: Number(e.target.value),
                          }))
                        }
                        className="character-suggestion-stat-input"
                      />
                    ) : (
                      <span className="character-suggestion-stat-value">{skill.level}</span>
                    )}
                  </li>
                ))}
              </ul>
            </SuggestionCard>
          )}
        </div>
      )}
    </section>
  );
};

interface SuggestionCardProps {
  cardKey: CardKey;
  title: string;
  editing: boolean;
  onAdopt: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDismiss: () => void;
  children: React.ReactNode;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  cardKey,
  title,
  editing,
  onAdopt,
  onEdit,
  onCancel,
  onDismiss,
  children,
}) => (
  <article
    className="character-suggestion-card"
    data-suggestion={cardKey}
    aria-label={`${title} suggestion`}
  >
    <h4 className="character-suggestion-card-title">{title}</h4>
    <div className="character-suggestion-card-body">{children}</div>
    <div className="character-suggestion-card-actions">
      <Button
        type="button"
        variant="success"
        size="sm"
        onClick={onAdopt}
        aria-label={`Adopt ${title} suggestion`}
      >
        Adopt
      </Button>
      {editing ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          aria-label={`Cancel editing ${title} suggestion`}
        >
          Cancel
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          aria-label={`Edit ${title} suggestion`}
        >
          Edit
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        aria-label={`Dismiss ${title} suggestion`}
      >
        Dismiss
      </Button>
    </div>
  </article>
);
