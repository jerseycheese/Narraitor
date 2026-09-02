'use client';

import React, { useState, useEffect } from 'react';
import { World, WorldAttribute } from '@/types/world.types';
import { AttributeSuggestion } from '../WorldCreationWizard';
import { generateUniqueId } from '@/lib/utils/generateId';
import { AttributeEditor } from '@/components/world/AttributeEditor/AttributeEditor';
import {
  wizardStyles,
  WizardFormSection,
  WizardFormGroup,
  WizardTextField,
  WizardTextArea,
} from '@/components/shared/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AIGuidanceSource } from '@/lib/constants/worldGuidance';

interface WorldDataWithMeta extends Partial<World> {
  aiSuggestionMeta?: {
    source: AIGuidanceSource;
    generatedAt?: string;
    descriptionSnapshot?: string;
  };
}

interface AttributeReviewStepProps {
  worldData: WorldDataWithMeta;
  suggestions: AttributeSuggestion[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<World>) => void;
  onClearSuggestions?: () => void;
}

export default function AttributeReviewStep({
  worldData,
  suggestions,
  errors,
  onUpdate,
  onClearSuggestions,
}: AttributeReviewStepProps) {
  // Custom attribute management state - initialize from existing world data when editing
  const [customAttributes, setCustomAttributes] = useState<WorldAttribute[]>(
    () => {
      // When editing, identify existing custom attributes (those not in AI suggestions)
      if (worldData.attributes && worldData.attributes.length > 0) {
        const suggestionNames = new Set(suggestions.map((s) => s.name));
        return worldData.attributes.filter(
          (attr) => !suggestionNames.has(attr.name)
        );
      }
      return [];
    }
  );
  const [isCreatingCustomAttribute, setIsCreatingCustomAttribute] =
    useState(false);
  const [editingCustomAttributeId, setEditingCustomAttributeId] = useState<
    string | null
  >(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  /**
   * Helper function to merge accepted AI attributes with custom attributes
   *
   * This centralizes the merge logic to ensure consistency across all handlers
   * and reduces code duplication. Uses stable IDs to prevent unnecessary re-renders.
   *
   * @param acceptedSuggestions - AI-generated attribute suggestions that are accepted
   * @param customAttributesList - Custom attributes to merge (defaults to current state)
   * @returns Combined array of accepted AI attributes and custom attributes
   */
  const mergeAllAttributes = (
    acceptedSuggestions: AttributeSuggestion[],
    customAttributesList = customAttributes
  ): WorldAttribute[] => {
    const acceptedAttributes: WorldAttribute[] = acceptedSuggestions.map(
      (s) => {
        // Use stable ID based on attribute name to prevent unnecessary re-renders
        const existingAttribute = worldData.attributes?.find(
          (attr) => attr.name === s.name
        );
        return {
          id: existingAttribute?.id || generateUniqueId('attribute'),
          worldId: '',
          name: s.name,
          description: s.description,
          baseValue: s.baseValue,
          minValue: s.minValue,
          maxValue: s.maxValue,
          category: s.category,
        };
      }
    );

    return [...acceptedAttributes, ...customAttributesList];
  };
  // Initialize state based on existing selections
  const [localSuggestions, setLocalSuggestions] = useState(() => {
    // If we have existing attributes in worldData, match them to suggestions
    if (worldData.attributes && worldData.attributes.length > 0) {
      return suggestions.map((suggestion) => {
        const existingAttr = worldData.attributes?.find(
          (attr) => attr.name === suggestion.name
        );
        return {
          ...suggestion,
          accepted:
            suggestion.accepted !== undefined ? suggestion.accepted : true, // Use suggestion's accepted value, default to true
          showDetails: suggestions.indexOf(suggestion) === 0, // Show details for the first one
          baseValue:
            existingAttr?.baseValue ??
            Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
        };
      });
    }
    return suggestions.map((suggestion, index) => ({
      ...suggestion,
      baseValue: Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
      accepted: suggestion.accepted !== undefined ? suggestion.accepted : true, // Use suggestion's accepted value, default to true
      showDetails: index === 0, // Show details only for the first one
    }));
  });

  // Update local state only on initial load or when suggestions change
  useEffect(() => {
    // This should only run on initial mount or when suggestions change from parent
    // Not on every worldData update to prevent overriding user toggles
    if (suggestions.length > 0) {
      const newSuggestions = suggestions.map((suggestion) => {
        const existingAttr = worldData.attributes?.find(
          (attr) => attr.name === suggestion.name
        );
        // Use the suggestion's accepted value, defaulting to true if not specified
        const accepted =
          suggestion.accepted !== undefined ? suggestion.accepted : true;
        // For the first attribute, show details by default to give user a clue
        return {
          ...suggestion,
          accepted,
          showDetails: suggestions.indexOf(suggestion) === 0, // Show details for the first one
          baseValue:
            existingAttr?.baseValue ??
            Math.floor((suggestion.minValue + suggestion.maxValue) / 2),
        };
      });

      setLocalSuggestions(newSuggestions);

      // Automatically save the initially selected attributes to parent state
      const acceptedAttributes = newSuggestions
        .filter((s) => s.accepted)
        .map((s) => ({
          id: generateUniqueId('attr'),
          worldId: '',
          name: s.name,
          description: s.description,
          baseValue: s.baseValue,
          minValue: s.minValue,
          maxValue: s.maxValue,
          category: s.category,
        }));

      // Only update if we don't already have attributes or if the count is different
      if (
        !worldData.attributes ||
        worldData.attributes.length !== acceptedAttributes.length
      ) {
        onUpdate({ ...worldData, attributes: acceptedAttributes });
      }
    } else {
      // Clear AI suggestions when they are removed (preserves custom attributes)
      setLocalSuggestions([]);

      // Update worldData to only contain custom attributes (preserving user's manual work)
      // Only update if attributes have actually changed to prevent infinite loop
      const currentAttributeIds = (worldData.attributes || [])
        .map((a) => a.id)
        .sort()
        .join(',');
      const customAttributeIds = customAttributes
        .map((a) => a.id)
        .sort()
        .join(',');

      if (currentAttributeIds !== customAttributeIds) {
        onUpdate({ ...worldData, attributes: customAttributes });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]); // Only depend on suggestions, not worldData.attributes

  const handleToggleAttribute = (index: number) => {
    // Toggle the state in a new array
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = {
      ...updatedSuggestions[index],
      accepted: !updatedSuggestions[index].accepted,
    };

    // Update local state
    setLocalSuggestions(updatedSuggestions);

    // Convert to WorldAttribute objects for the store
    const acceptedSuggestions = updatedSuggestions.filter((s) => s.accepted);
    const allAttributes = mergeAllAttributes(acceptedSuggestions);
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleModifyAttribute = (
    index: number,
    field: keyof AttributeSuggestion,
    value: string | number
  ) => {
    const updatedSuggestions = [...localSuggestions];
    updatedSuggestions[index] = {
      ...updatedSuggestions[index],
      [field]: value,
    };
    setLocalSuggestions(updatedSuggestions);

    // Re-calculate accepted attributes
    const acceptedSuggestions = updatedSuggestions.filter((s) => s.accepted);
    const allAttributes = mergeAllAttributes(acceptedSuggestions);
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const acceptedCount =
    localSuggestions.filter((s) => s.accepted).length + customAttributes.length;

  // Custom attribute handlers
  const handleAddCustomAttribute = () => {
    setIsCreatingCustomAttribute(true);
    setEditingCustomAttributeId(null);
  };

  const handleSaveCustomAttribute = (attribute: WorldAttribute) => {
    let updatedCustomAttributes: WorldAttribute[];

    if (editingCustomAttributeId) {
      // Edit existing custom attribute
      updatedCustomAttributes = customAttributes.map((a) =>
        a.id === editingCustomAttributeId ? attribute : a
      );
    } else {
      // Add new custom attribute
      updatedCustomAttributes = [...customAttributes, attribute];
    }

    setCustomAttributes(updatedCustomAttributes);
    setIsCreatingCustomAttribute(false);
    setEditingCustomAttributeId(null);

    // Recalculate world attributes
    const acceptedSuggestions = localSuggestions.filter((s) => s.accepted);
    const allAttributes = mergeAllAttributes(
      acceptedSuggestions,
      updatedCustomAttributes
    );
    onUpdate({ ...worldData, attributes: allAttributes });
  };

  const handleEditCustomAttribute = (attributeId: string) => {
    setEditingCustomAttributeId(attributeId);
    setIsCreatingCustomAttribute(true);
  };

  const handleDeleteCustomAttribute = (attributeId: string) => {
    const updatedCustomAttributes = customAttributes.filter(
      (a) => a.id !== attributeId
    );
    setCustomAttributes(updatedCustomAttributes);

    // Recalculate world attributes
    const acceptedSuggestions = localSuggestions.filter((s) => s.accepted);
    const allAttributes = mergeAllAttributes(
      acceptedSuggestions,
      updatedCustomAttributes
    );
    onUpdate({ ...worldData, attributes: allAttributes });
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
        description="Keep the attributes that fit your world. At least one, up to 6."
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
            {localSuggestions.length === 0 ? (
              <div className="wizard-empty-state">
                <p>No attribute suggestions available</p>
                <p>
                  You can add attributes to your world later in the world
                  editor.
                </p>
              </div>
            ) : (
              localSuggestions.map((suggestion, index) => (
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
                          const newSuggestions = [...localSuggestions];
                          newSuggestions[index] = {
                            ...newSuggestions[index],
                            showDetails: !newSuggestions[index].showDetails,
                          };
                          setLocalSuggestions(newSuggestions);
                        }}
                      >
                        {suggestion.showDetails ? 'Hide details' : 'Customize'}
                      </Button>
                      <Button
                        type="button"
                        data-testid={`attribute-toggle-${index}`}
                        onClick={() => handleToggleAttribute(index)}
                        variant={suggestion.accepted ? 'default' : 'outline'}
                        size="sm"
                      >
                        {suggestion.accepted ? 'Selected' : 'Excluded'}
                      </Button>
                    </div>
                  </div>

                  {suggestion.showDetails && (
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
                  {acceptedCount}/6 slots used)
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddCustomAttribute}
                size="sm"
                data-testid="add-custom-attribute-button"
                disabled={acceptedCount >= 6}
              >
                + Add Custom Attribute
              </Button>
            </div>

            {customAttributes.length === 0 && !isCreatingCustomAttribute ? (
              <div className="wizard-empty-state">
                <p>No custom attributes yet</p>
                <p>
                  {acceptedCount < 6
                    ? `You have ${6 - acceptedCount} attribute slot${6 - acceptedCount !== 1 ? 's' : ''} available for custom attributes`
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
                  existingAttributes={[
                    ...customAttributes,
                    ...(worldData.attributes || []),
                  ]}
                  maxAttributes={6}
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
              <span>Attributes Selected: {acceptedCount} / 6</span>
              {acceptedCount >= 6 && <span>(Maximum reached)</span>}
            </div>
            <div className="wizard-slot-summary-note">
              {acceptedCount < 6
                ? `${6 - acceptedCount} slot${6 - acceptedCount !== 1 ? 's' : ''} available`
                : 'All slots filled'}
            </div>
          </div>
          <div className="wizard-slot-meter-wrap">
            <div className="wizard-slot-meter">
              {Array.from({ length: 6 }).map((_, i) => (
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

      {/* Clear Suggestions Confirmation Dialog */}
      {showClearConfirmation && (
        <div
          className="wizard-dialog-overlay"
          data-testid="clear-suggestions-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
        >
          <div className="wizard-dialog-panel">
            <h3 id="clear-dialog-title">Clear Suggestions?</h3>
            <p>
              This will remove all attribute suggestions. You can still add
              custom attributes or regenerate suggestions later.
            </p>
            <div className="wizard-dialog-actions">
              <Button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                variant="outline"
                size="sm"
                data-testid="cancel-clear-button"
                autoFocus
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleClearSuggestions}
                variant="destructive"
                size="sm"
                data-testid="confirm-clear-button"
              >
                Clear Suggestions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
