'use client';

import React, { useState, useEffect } from 'react';
import { WorldAttribute } from '@/types/world.types';
import {
  AttributeSuggestion,
  WorldCreationData,
  WIZARD_MAX_ATTRIBUTES,
  adoptLegacyEntries,
} from '../WizardState';
import { generateUniqueId } from '@/lib/utils/generateId';
import { AttributeEditor } from '@/components/world/AttributeEditor/AttributeEditor';
import { ConfirmationDialog } from '@/components/ConfirmationDialog/ConfirmationDialog';
import {
  wizardStyles,
  WizardFormSection,
  WizardFormGroup,
  WizardTextField,
  WizardTextArea,
} from '@/components/shared/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AttributeReviewStepProps {
  worldData: WorldCreationData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<WorldCreationData>) => void;
  onClearSuggestions?: () => void;
}

const toWorldAttribute = (s: AttributeSuggestion): WorldAttribute => ({
  id: s.id ?? generateUniqueId('attribute'),
  worldId: '',
  name: s.name,
  description: s.description,
  baseValue: s.baseValue,
  minValue: s.minValue,
  maxValue: s.maxValue,
  category: s.category,
});

/**
 * Review step for suggested attributes. All review state lives in worldData:
 * each suggestion keeps its id and accepted flag in `aiSuggestions`, accepted
 * suggestions are saved to `attributes` under that same id, and any other
 * attribute is a custom one. That lets the step unmount (Back/Next) and come
 * back without losing selections, edits, custom entries or ids.
 */
export default function AttributeReviewStep({
  worldData,
  errors,
  onUpdate,
  onClearSuggestions,
}: AttributeReviewStepProps) {
  const suggestions = worldData.aiSuggestions?.attributes ?? [];
  const maxAttributes = worldData.settings?.maxAttributes ?? WIZARD_MAX_ATTRIBUTES;
  const suggestionIds = new Set(suggestions.map((s) => s.id));
  const customAttributes = (worldData.attributes ?? []).filter(
    (a) => !suggestionIds.has(a.id)
  );
  const acceptedCount =
    suggestions.filter((s) => s.accepted).length + customAttributes.length;

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]));
  const [isCreatingCustomAttribute, setIsCreatingCustomAttribute] =
    useState(false);
  const [editingCustomAttributeId, setEditingCustomAttributeId] = useState<
    string | null
  >(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const commit = (
    nextSuggestions: AttributeSuggestion[],
    nextCustom: WorldAttribute[] = customAttributes
  ) => {
    onUpdate({
      ...(worldData.aiSuggestions && {
        aiSuggestions: { ...worldData.aiSuggestions, attributes: nextSuggestions },
      }),
      attributes: [
        ...nextSuggestions.filter((s) => s.accepted).map(toWorldAttribute),
        ...nextCustom,
      ],
    });
  };

  // First visit after suggestions arrive: give each one a stable id and
  // accept as many as the world limit allows. Later visits find the ids
  // already in worldData and leave everything as the player left it.
  useEffect(() => {
    if (suggestions.length === 0 || suggestions.every((s) => s.id)) return;
    // A draft saved before suggestions carried ids still has the saved
    // entries; adopt them by name so they aren't mistaken for custom ones.
    const { adopted, remaining } = adoptLegacyEntries(suggestions, customAttributes);
    let openSlots = maxAttributes - remaining.length - adopted.size;
    commit(
      suggestions.map((s) => {
        const match = adopted.get(s);
        if (match) return { ...s, id: match.id, baseValue: match.baseValue, accepted: true };
        // Analyzer output can omit `accepted`; treat that as accepted.
        const accepted = (s.accepted ?? true) && openSlots > 0;
        if (accepted) openSlots -= 1;
        return { ...s, id: s.id ?? generateUniqueId('attribute'), accepted };
      }),
      remaining
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]);

  const handleToggleAttribute = (index: number) => {
    const target = suggestions[index];
    if (!target.accepted && acceptedCount >= maxAttributes) return;
    commit(
      suggestions.map((s, i) => (i === index ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const handleModifyAttribute = (
    index: number,
    field: keyof AttributeSuggestion,
    value: string | number
  ) => {
    commit(suggestions.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const toggleDetails = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Custom attribute handlers
  const handleAddCustomAttribute = () => {
    setIsCreatingCustomAttribute(true);
    setEditingCustomAttributeId(null);
  };

  const handleSaveCustomAttribute = (attribute: WorldAttribute) => {
    const updatedCustomAttributes = editingCustomAttributeId
      ? customAttributes.map((a) => (a.id === editingCustomAttributeId ? attribute : a))
      : [...customAttributes, attribute];

    setIsCreatingCustomAttribute(false);
    setEditingCustomAttributeId(null);
    commit(suggestions, updatedCustomAttributes);
  };

  const handleEditCustomAttribute = (attributeId: string) => {
    setEditingCustomAttributeId(attributeId);
    setIsCreatingCustomAttribute(true);
  };

  const handleDeleteCustomAttribute = (attributeId: string) => {
    commit(
      suggestions,
      customAttributes.filter((a) => a.id !== attributeId)
    );
  };

  const handleCancelCustomAttribute = () => {
    setIsCreatingCustomAttribute(false);
    setEditingCustomAttributeId(null);
  };

  const handleClearSuggestions = () => {
    if (onClearSuggestions) {
      onClearSuggestions();
      setShowClearConfirmation(false);
    }
  };

  const showClearButton =
    worldData.aiSuggestionMeta?.source === 'ai' && suggestions.length > 0;

  return (
    <div data-testid="attribute-review-step">
      <WizardFormSection
        title="Review Attributes"
        description={`Keep the attributes that fit your world. At least one, up to ${maxAttributes}.`}
        dataTutorial="attribute-editor"
      >
        {showClearButton && (
          <div>
            <Button
              type="button"
              onClick={() => setShowClearConfirmation(true)}
              variant="outline"
              size="sm"
              data-testid="clear-ai-suggestions-button"
            >
              Clear Suggestions
            </Button>
          </div>
        )}

        <div className="wizard-review-list">
          <div className="wizard-review-suggestions">
            {suggestions.length === 0 ? (
              <div className="wizard-empty-state">
                <p>No attribute suggestions available</p>
                <p>
                  You can add attributes to your world later in the world
                  editor.
                </p>
              </div>
            ) : (
              suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`${wizardStyles.card.base} wizard-review-card`}
                  data-testid={`attribute-card-${index}`}
                  {...(index === 0
                    ? { 'data-tutorial': 'attribute-suggestions' }
                    : {})}
                >
                  <div className="wizard-review-card-head">
                    <div className="wizard-review-card-meta">
                      <span>{suggestion.name}</span>
                      {suggestion.category && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{suggestion.category}</span>
                        </>
                      )}
                    </div>

                    <div className="wizard-review-card-tools">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDetails(index);
                        }}
                      >
                        {expanded.has(index) ? 'Hide details' : 'Customize'}
                      </Button>
                      <Button
                        type="button"
                        data-testid={`attribute-toggle-${index}`}
                        onClick={() => handleToggleAttribute(index)}
                        variant="outline"
                        size="sm"
                        aria-pressed={suggestion.accepted}
                        disabled={!suggestion.accepted && acceptedCount >= maxAttributes}
                      >
                        {suggestion.accepted ? 'Selected' : 'Excluded'}
                      </Button>
                    </div>
                  </div>

                  {expanded.has(index) && (
                    <div
                      key={`attribute-expanded-${index}`}
                      className="wizard-review-card-detail"
                      onClick={(e) => e.stopPropagation()} // Prevent toggling when interacting with inputs
                    >
                      <WizardFormGroup label="Name">
                        <WizardTextField
                          value={suggestion.name}
                          onChange={(value) =>
                            handleModifyAttribute(index, 'name', value)
                          }
                          testId={`attribute-name-input-${index}`}
                        />
                      </WizardFormGroup>

                      <WizardFormGroup label="Description">
                        <WizardTextArea
                          value={suggestion.description}
                          onChange={(value) =>
                            handleModifyAttribute(index, 'description', value)
                          }
                          rows={2}
                          testId={`attribute-description-textarea-${index}`}
                        />
                      </WizardFormGroup>

                      {/* Starting value (min/max fixed to 1–10 for MVP). A
                          number stepper matches the custom-attribute editor's
                          Min/Max fields and reads cleaner than a 1–10 slider. */}
                      <WizardFormGroup label="Starting Value (1–10)">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step={1}
                          value={suggestion.baseValue}
                          className="wizard-attribute-value-input"
                          data-testid={`attribute-base-value-input-${index}`}
                          aria-label={`Starting value for ${suggestion.name}`}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (Number.isNaN(next)) return;
                            handleModifyAttribute(
                              index,
                              'baseValue',
                              Math.min(10, Math.max(1, next))
                            );
                          }}
                        />
                      </WizardFormGroup>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Custom Attributes Section */}
          <div className="wizard-review-custom" data-tutorial="attribute-custom">
            <div className="wizard-review-custom-head">
              <div className="wizard-review-custom-heading">
                <h3 className="wizard-subheading">Custom Attributes</h3>
                <p>
                  Create your own unique attributes for this world (
                  {acceptedCount}/{maxAttributes} slots used)
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddCustomAttribute}
                variant="outline"
                size="sm"
                data-testid="add-custom-attribute-button"
                disabled={acceptedCount >= maxAttributes}
              >
                + Add Custom Attribute
              </Button>
            </div>

            {customAttributes.length === 0 && !isCreatingCustomAttribute ? (
              <div className="wizard-empty-state">
                <p>No custom attributes yet</p>
                <p>
                  {acceptedCount < maxAttributes
                    ? `You have ${maxAttributes - acceptedCount} attribute slot${maxAttributes - acceptedCount !== 1 ? 's' : ''} available for custom attributes`
                    : 'Remove some suggested attributes to add custom ones'}
                </p>
              </div>
            ) : (
              <div className="wizard-review-custom-list">
                {customAttributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className={`${wizardStyles.card.base} wizard-review-card`}
                    data-testid={`custom-attribute-card-${attribute.id}`}
                  >
                    <div className="wizard-review-card-head">
                      <div className="wizard-review-card-meta">
                        <span>{attribute.name}</span>
                        <span>Custom</span>
                        {attribute.category && (
                          <span>{attribute.category}</span>
                        )}
                      </div>
                      <div className="wizard-review-card-tools">
                        <Button
                          type="button"
                          onClick={() =>
                            handleEditCustomAttribute(attribute.id)
                          }
                          variant="link"
                          size="sm"
                          data-testid={`edit-custom-attribute-${attribute.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            handleDeleteCustomAttribute(attribute.id)
                          }
                          variant="destructive"
                          size="sm"
                          data-testid={`delete-custom-attribute-${attribute.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="wizard-review-card-detail">{attribute.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Attribute Editor */}
            {isCreatingCustomAttribute && (
              <div className="wizard-custom-editor" data-testid="custom-attribute-editor">
                <AttributeEditor
                  worldId={worldData.id || ''}
                  mode={editingCustomAttributeId ? 'edit' : 'create'}
                  attributeId={editingCustomAttributeId || undefined}
                  existingAttributes={worldData.attributes ?? []}
                  maxAttributes={maxAttributes}
                  onSave={handleSaveCustomAttribute}
                  onDelete={
                    editingCustomAttributeId
                      ? handleDeleteCustomAttribute
                      : undefined
                  }
                  onCancel={handleCancelCustomAttribute}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className="wizard-slot-summary"
          data-testid="attribute-count-summary"
          data-tutorial="attribute-summary"
        >
          <div className="wizard-slot-summary-text">
            <div className="wizard-slot-summary-count">
              <span>Attributes Selected: {acceptedCount} / {maxAttributes}</span>
              {acceptedCount >= maxAttributes && <span>(Maximum reached)</span>}
            </div>
            <div className="wizard-slot-summary-note">
              {acceptedCount < maxAttributes
                ? `${maxAttributes - acceptedCount} slot${maxAttributes - acceptedCount !== 1 ? 's' : ''} available`
                : 'All slots filled'}
            </div>
          </div>
          <div className="wizard-slot-meter-wrap">
            <div className="wizard-slot-meter">
              {Array.from({ length: maxAttributes }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i < acceptedCount
                      ? 'wizard-slot-cell wizard-slot-cell-filled'
                      : 'wizard-slot-cell'
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </WizardFormSection>

      {errors.attributes && (
        <div className={wizardStyles.form.error}>{errors.attributes}</div>
      )}

      <ConfirmationDialog
        isOpen={showClearConfirmation}
        onClose={() => setShowClearConfirmation(false)}
        onConfirm={handleClearSuggestions}
        title="Clear Suggestions?"
        message="This removes every suggested attribute and skill, on both review steps. Custom attributes and skills you added stay. You can generate new suggestions from the description step."
        variant="destructive"
        confirmText="Clear Suggestions"
        cancelText="Cancel"
      />
    </div>
  );
}
