/**
 * FactInspector Component
 * Detailed view and editing of individual facts
 */

import React from 'react';
import { useLoreStore } from '@/state/loreStore';
import { FactEditor } from './FactEditor';
import { Button } from '@/components/ui/button';
import { SimpleModal } from '@/components/shared/SimpleModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EntityID } from '@/types/common.types';

interface FactInspectorProps {
  factId: EntityID;
  onClose: () => void;
  onUpdate?: () => void;
}

export const FactInspector: React.FC<FactInspectorProps> = ({
  factId,
  onClose,
  onUpdate
}) => {
  const { facts, getFactHistory } = useLoreStore();
  
  const fact = facts[factId];
  const history = getFactHistory(factId) || { factId, versions: [] };

  if (!fact) {
    return null;
  }

  const handleSave = () => {
    onUpdate?.();
  };

  return (
    <SimpleModal 
      isOpen={true} 
      onClose={onClose}
      title="Fact Inspector"
      size="xl"
      
    >
      <div >
        Inspect and edit lore fact details, history, and relationships.
      </div>

        <Tabs defaultValue="details" >
          <TabsList >
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" >
            <div >
              <div >
                <div>
                  <span >ID:</span> 
                  <span >{fact.id}</span>
                </div>
                <div>
                  <span >World ID:</span> 
                  <span >{fact.worldId}</span>
                </div>
              </div>

              <div>
                <span >Key:</span> 
                <span >{fact.key}</span>
              </div>

              <div>
                <span >Value:</span> 
                <div >{fact.value}</div>
              </div>

              <div>
                <span >Category:</span> 
                <span >{fact.category}</span>
              </div>

              <div>
                <span >Source:</span> 
                <span >{fact.source}</span>
              </div>

              {fact.sessionId && (
                <div>
                  <span >Session ID:</span> 
                  <span >{fact.sessionId}</span>
                </div>
              )}

              {fact.metadata && (
                <div>
                  <span >Metadata:</span>
                  <div >
                    {fact.metadata.description && (
                      <div>
                        <span >Description:</span> {fact.metadata.description}
                      </div>
                    )}
                    {fact.metadata.importance && (
                      <div>
                        <span >Importance:</span> {fact.metadata.importance}
                      </div>
                    )}
                    {fact.metadata.type && (
                      <div>
                        <span >Type:</span> {fact.metadata.type}
                      </div>
                    )}
                    {fact.metadata.tags && fact.metadata.tags.length > 0 && (
                      <div>
                        <span >Tags:</span>
                        <div >
                          {fact.metadata.tags.map((tag, index) => (
                            <span key={index} >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {fact.metadata.relatedEntities && fact.metadata.relatedEntities.length > 0 && (
                      <div>
                        <span >Related Entities:</span>
                        <div >
                          {fact.metadata.relatedEntities.map((entity, index) => (
                            <span key={index} >
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div >
                <div>
                  <span >Created:</span> 
                  <span >{new Date(fact.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span >Updated:</span> 
                  <span >{new Date(fact.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <FactEditor
              worldId={fact.worldId}
              fact={fact}
              onSave={handleSave}
              onCancel={() => {}}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" >
            {history.length > 0 ? (
              <div >
                <div >
                  Showing {history.length} version(s) of this fact
                </div>
                {history.map((version, index) => (
                  <div key={index} >
                    <div >
                      <span >Version {history.length - index}</span>
                      <span >
                        {new Date(version.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div >
                      <div>
                        <span >Value:</span> {version.value}
                      </div>
                      {version.metadata?.description && (
                        <div>
                          <span >Description:</span> {version.metadata.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div >
                No history available for this fact
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div >
          <Button variant="" onClick={onClose}>
            Close
          </Button>
        </div>
    </SimpleModal>
  );
};
