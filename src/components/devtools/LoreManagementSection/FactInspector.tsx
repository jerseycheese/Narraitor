/**
 * FactInspector Component
 * Detailed view and editing of individual facts
 */

import React from 'react';
import { useLoreStore } from '@/state/loreStore';
import { FactEditor } from './FactEditor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fact Inspector</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">ID:</span> 
                  <span className="font-mono text-sm ml-2">{fact.id}</span>
                </div>
                <div>
                  <span className="font-semibold">World ID:</span> 
                  <span className="font-mono text-sm ml-2">{fact.worldId}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold">Key:</span> 
                <span className="font-mono ml-2">{fact.key}</span>
              </div>

              <div>
                <span className="font-semibold">Value:</span> 
                <div className="mt-1 p-2 bg-gray-50 rounded">{fact.value}</div>
              </div>

              <div>
                <span className="font-semibold">Category:</span> 
                <span className="ml-2 capitalize">{fact.category}</span>
              </div>

              <div>
                <span className="font-semibold">Source:</span> 
                <span className="ml-2 capitalize">{fact.source}</span>
              </div>

              {fact.sessionId && (
                <div>
                  <span className="font-semibold">Session ID:</span> 
                  <span className="font-mono text-sm ml-2">{fact.sessionId}</span>
                </div>
              )}

              {fact.metadata && (
                <div>
                  <span className="font-semibold">Metadata:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded space-y-1">
                    {fact.metadata.description && (
                      <div>
                        <span className="text-sm font-medium">Description:</span> {fact.metadata.description}
                      </div>
                    )}
                    {fact.metadata.importance && (
                      <div>
                        <span className="text-sm font-medium">Importance:</span> {fact.metadata.importance}
                      </div>
                    )}
                    {fact.metadata.type && (
                      <div>
                        <span className="text-sm font-medium">Type:</span> {fact.metadata.type}
                      </div>
                    )}
                    {fact.metadata.tags && fact.metadata.tags.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fact.metadata.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {fact.metadata.relatedEntities && fact.metadata.relatedEntities.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Related Entities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fact.metadata.relatedEntities.map((entity, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span> 
                  <span className="ml-2">{new Date(fact.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium">Updated:</span> 
                  <span className="ml-2">{new Date(fact.updatedAt).toLocaleString()}</span>
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
          <TabsContent value="history" className="space-y-4">
            {history.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Showing {history.length} version(s) of this fact
                </div>
                {history.map((version, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">Version {history.length - index}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(version.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div>
                        <span className="text-sm font-medium">Value:</span> {version.value}
                      </div>
                      {version.metadata?.description && (
                        <div>
                          <span className="text-sm font-medium">Description:</span> {version.metadata.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No history available for this fact
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};