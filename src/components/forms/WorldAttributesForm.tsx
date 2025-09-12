import React, { useState, useCallback, useMemo } from 'react';
import { WorldAttribute, WorldSkill } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { AttributeEditor } from '@/components/world/AttributeEditor';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';


/**
 * Props for the WorldAttributesForm component
 */
interface WorldAttributesFormProps {
  /** Array of world attributes to display and manage */
  attributes: WorldAttribute[];
  /** Optional array of skills that may be linked to attributes */
  skills?: WorldSkill[];
  /** ID of the world these attributes belong to */
  worldId: string;
  /** Maximum number of attributes allowed for this world */
  maxAttributes: number;
  /** Callback fired when attributes are modified */
  onChange: (attributes: WorldAttribute[]) => void;
}

/**
 * WorldAttributesForm - Component for managing world attributes with CRUD operations
 * 
 * Features:
 * - Add, edit, and delete world attributes
 * - Enforces maxAttributes limit with user feedback
 * - Modal-based attribute editor
 * - Dependency warning for linked skills
 * - Accessible UI with proper ARIA labels
 * 
 * @param props - Component props
 * @returns JSX element representing the attributes management form
 */
const WorldAttributesForm: React.FC<WorldAttributesFormProps> = ({ 
  attributes, 
  skills = [],
  worldId, 
  maxAttributes,
  onChange 
}) => {
  // Component state
  const [editingAttribute, setEditingAttribute] = useState<EntityID | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<WorldAttribute | null>(null);
  
  // Computed values
  const isLimitReached = useMemo(() => 
    attributes.length >= maxAttributes, 
    [attributes.length, maxAttributes]
  );
  
  // Event handlers
  /**
   * Handles creating a new attribute and closing the modal
   */
  const handleCreateAttribute = useCallback((newAttribute: WorldAttribute) => {
    onChange([...attributes, { ...newAttribute, worldId }]);
    setShowCreateModal(false);
  }, [attributes, worldId, onChange]);
  
  /**
   * Handles updating an existing attribute and closing the editor
   */
  const handleSaveAttribute = useCallback((updatedAttribute: WorldAttribute) => {
    const index = attributes.findIndex(attr => attr.id === updatedAttribute.id);
    if (index !== -1) {
      const updatedAttributes = [...attributes];
      updatedAttributes[index] = { ...updatedAttribute, worldId };
      onChange(updatedAttributes);
    }
    setEditingAttribute(null);
  }, [attributes, worldId, onChange]);
  
  /**
   * Handles deleting an attribute by ID
   */
  const handleDeleteAttribute = useCallback((attributeId: EntityID) => {
    const updatedAttributes = attributes.filter(attr => attr.id !== attributeId);
    onChange(updatedAttributes);
    setEditingAttribute(null);
  }, [attributes, onChange]);
  
  /**
   * Initiates delete process by showing confirmation dialog
   */
  const handleDeleteClick = useCallback((attribute: WorldAttribute) => {
    setAttributeToDelete(attribute);
    setShowDeleteDialog(true);
  }, []);
  
  /**
   * Gets skills that are linked to a specific attribute
   */
  const getLinkedSkills = useCallback((attributeId: EntityID): WorldSkill[] => {
    return skills.filter(skill => skill.attributeIds?.includes(attributeId));
  }, [skills]);
  
  /**
   * Confirms deletion and cleans up dialog state
   */
  const handleDeleteConfirm = useCallback(() => {
    if (attributeToDelete) {
      handleDeleteAttribute(attributeToDelete.id);
    }
    setShowDeleteDialog(false);
    setAttributeToDelete(null);
  }, [attributeToDelete, handleDeleteAttribute]);
  
  /**
   * Generates the description text for the delete confirmation dialog
   */
  const deleteDescription = useMemo(() => {
    if (!attributeToDelete) {
      return "Are you sure you want to delete this attribute? This action cannot be undone.";
    }
    
    const linkedSkills = getLinkedSkills(attributeToDelete.id);
    if (linkedSkills.length === 0) {
      return "Are you sure you want to delete this attribute? This action cannot be undone.";
    }
    
    const skillNames = linkedSkills.map(s => s.name).join(', ');
    const skillText = linkedSkills.length > 1 ? 's' : '';
    return `WARNING: This attribute is linked to ${linkedSkills.length} skill${skillText}: ${skillNames}. Deleting this attribute will affect these skills. This action cannot be undone.`;
  }, [attributeToDelete, getLinkedSkills]);
  
  return (
    <section className="p-4 bg-background rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Attributes</h3>
        <div className="flex flex-col items-end">
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={isLimitReached}
            variant="default"
            size="sm"
            aria-label={
              isLimitReached 
                ? `Cannot add more attributes. Maximum of ${maxAttributes} reached.` 
                : 'Add new attribute'
            }
          >
            Add Attribute
          </Button>
          {isLimitReached && (
            <p className="text-xs text-muted-foreground mt-1">
              Maximum {maxAttributes} attributes reached
            </p>
          )}
        </div>
      </div>
      
      {attributes.length === 0 ? (
        <p className="text-muted-foreground italic">No attributes defined yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attributes.map((attribute, index) => (
            <div key={`${attribute.id ?? attribute.name ?? index}`} className="bg-muted rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-lg">{attribute.name}</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingAttribute(attribute.id)}
                    variant="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(attribute)}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{attribute.description}</p>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Range:</span> {attribute.minValue} - {attribute.maxValue}
                  </div>
                  {attribute.category && (
                    <div>
                      <span className="font-medium">Category:</span> {attribute.category}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AttributeEditor
            worldId={worldId as EntityID}
            mode="create"
            onSave={handleCreateAttribute}
            onCancel={() => setShowCreateModal(false)}
            existingAttributes={attributes}
            existingSkills={skills}
            maxAttributes={maxAttributes}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={!!editingAttribute} onOpenChange={(open) => !open && setEditingAttribute(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingAttribute && (
            <AttributeEditor
              worldId={worldId as EntityID}
              mode="edit"
              attributeId={editingAttribute}
              onSave={handleSaveAttribute}
              onDelete={handleDeleteAttribute}
              onCancel={() => setEditingAttribute(null)}
              existingAttributes={attributes}
              existingSkills={skills}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setAttributeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Attribute"
        description={deleteDescription}
        itemName={attributeToDelete?.name || 'this attribute'}
        confirmButtonText="Delete Attribute"
        cancelButtonText="Cancel"
      />
    </section>
  );
};

// Set display name for debugging
WorldAttributesForm.displayName = 'WorldAttributesForm';

export default WorldAttributesForm;
