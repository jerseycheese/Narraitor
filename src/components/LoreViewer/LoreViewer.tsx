/**
 * LoreViewer Component - Display and manage lore facts for a world
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLoreStore } from '../../state/loreStore';
import type { LoreFact, LoreCategory, LoreSource, LoreSearchOptions } from '../../types';
import { LoadingState } from '../ui/LoadingState';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface LoreViewerProps {
  worldId: string;
  className?: string;
}

interface LoreFactFormData {
  title: string;
  content: string;
  category: LoreCategory;
  tags: string[];
  isCanonical: boolean;
}

const CATEGORIES: LoreCategory[] = ['characters', 'locations', 'events', 'rules', 'items', 'organizations'];
const SOURCES: LoreSource[] = ['narrative', 'manual', 'ai_generated', 'imported'];

export const LoreViewer: React.FC<LoreViewerProps> = ({ worldId, className = '' }) => {
  const {
    getFactsByWorld,
    searchFacts,
    createFact,
    updateFact,
    deleteFact,
    loading,
    error,
  } = useLoreStore();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LoreCategory | ''>('');
  const [selectedSource, setSelectedSource] = useState<LoreSource | ''>('');
  const [canonicalOnly, setCanonicalOnly] = useState(false);

  // State for fact management
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFact, setEditingFact] = useState<LoreFact | null>(null);
  const [factToDelete, setFactToDelete] = useState<LoreFact | null>(null);

  // Form state
  const [formData, setFormData] = useState<LoreFactFormData>({
    title: '',
    content: '',
    category: 'characters',
    tags: [],
    isCanonical: true,
  });

  // Get filtered facts
  const filteredFacts = useMemo(() => {
    const searchOptions: LoreSearchOptions = {
      worldId,
    };

    if (searchTerm) searchOptions.searchTerm = searchTerm;
    if (selectedCategory) searchOptions.category = selectedCategory;
    if (selectedSource) searchOptions.source = selectedSource;
    if (canonicalOnly) searchOptions.isCanonical = true;

    return searchFacts(searchOptions);
  }, [searchFacts, worldId, searchTerm, selectedCategory, selectedSource, canonicalOnly]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'characters',
      tags: [],
      isCanonical: true,
    });
    setEditingFact(null);
    setShowCreateDialog(false);
  };

  // Handle create fact
  const handleCreateFact = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    createFact({
      ...formData,
      source: 'manual',
      relatedFacts: [],
      worldId,
    });

    resetForm();
  };

  // Handle update fact
  const handleUpdateFact = () => {
    if (!editingFact || !formData.title.trim() || !formData.content.trim()) return;

    updateFact(editingFact.id, formData);
    resetForm();
  };

  // Handle delete fact
  const handleDeleteFact = (fact: LoreFact) => {
    setFactToDelete(fact);
  };

  const confirmDeleteFact = () => {
    if (factToDelete) {
      deleteFact(factToDelete.id);
      setFactToDelete(null);
    }
  };

  // Handle edit fact
  const handleEditFact = (fact: LoreFact) => {
    setFormData({
      title: fact.title,
      content: fact.content,
      category: fact.category,
      tags: fact.tags,
      isCanonical: fact.isCanonical,
    });
    setEditingFact(fact);
    setShowCreateDialog(true);
  };

  // Handle tag input
  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  // Category badge styling
  const getCategoryColor = (category: LoreCategory) => {
    const colors = {
      characters: 'bg-blue-100 text-blue-800',
      locations: 'bg-green-100 text-green-800',
      events: 'bg-purple-100 text-purple-800',
      rules: 'bg-orange-100 text-orange-800',
      items: 'bg-yellow-100 text-yellow-800',
      organizations: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Source badge styling
  const getSourceColor = (source: LoreSource) => {
    const colors = {
      narrative: 'bg-indigo-100 text-indigo-800',
      manual: 'bg-gray-100 text-gray-800',
      ai_generated: 'bg-cyan-100 text-cyan-800',
      imported: 'bg-pink-100 text-pink-800',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingState message="Loading lore facts..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Lore Facts</h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          aria-label="Add fact"
        >
          Add Fact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search facts..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search facts"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as LoreCategory | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            id="source"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as LoreSource | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            {SOURCES.map(source => (
              <option key={source} value={source}>
                {source.replace('_', ' ').charAt(0).toUpperCase() + source.replace('_', ' ').slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="canonical"
            type="checkbox"
            checked={canonicalOnly}
            onChange={(e) => setCanonicalOnly(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-label="Canonical only"
          />
          <label htmlFor="canonical" className="ml-2 text-sm text-gray-700">
            Canonical only
          </label>
        </div>
      </div>

      {/* Facts List */}
      {filteredFacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No lore facts found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your search criteria or add some facts to get started
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="facts-list"
        >
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Fact Header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {fact.title}
                </h3>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEditFact(fact)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteFact(fact)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Fact Content */}
              <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                {fact.content}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(fact.category)}`}>
                  {fact.category}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(fact.source)}`}>
                  {fact.source}
                </span>
                {fact.isCanonical && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    canonical
                  </span>
                )}
              </div>

              {/* Tags */}
              {fact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {fact.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingFact ? 'Edit Fact' : 'Create New Fact'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="fact-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="fact-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Title"
                />
              </div>

              <div>
                <label htmlFor="fact-content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  id="fact-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Content"
                />
              </div>

              <div>
                <label htmlFor="fact-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="fact-category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as LoreCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Category"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fact-tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  id="fact-tags"
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="hero, important, plotline"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="fact-canonical"
                  type="checkbox"
                  checked={formData.isCanonical}
                  onChange={(e) => setFormData(prev => ({ ...prev, isCanonical: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="fact-canonical" className="ml-2 text-sm text-gray-700">
                  Canonical (confirmed/official)
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={editingFact ? handleUpdateFact : handleCreateFact}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Save"
              >
                {editingFact ? 'Update' : 'Save'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {factToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Delete Fact</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{factToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteFact}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                aria-label="Confirm"
              >
                Delete
              </button>
              <button
                onClick={() => setFactToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};