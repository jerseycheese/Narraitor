'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useFocusTrap, useEscapeKey } from '@/hooks/useKeyboardShortcuts';
import { globalShortcutManager } from '@/lib/accessibility/keyboardNavigation';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * KeyboardShortcutsHelp - Displays comprehensive keyboard shortcuts documentation
 * 
 * Shows all available keyboard shortcuts organized by category with search and
 * filtering capabilities. Includes platform-specific shortcuts and progressive
 * disclosure for different skill levels.
 * 
 * Features:
 * - Categorized shortcut display (Navigation, Actions, Modals, Game)
 * - Search and filter functionality
 * - Platform detection (Mac vs Windows/Linux)
 * - Skill level filtering (Beginner, Intermediate, Advanced)
 * - Practice mode for learning shortcuts
 * - Focus management and accessibility
 * 
 * @param isOpen - Whether the help dialog is visible
 * @param onClose - Function to close the dialog
 * @param className - Additional CSS classes
 */
export function KeyboardShortcutsHelp({ isOpen, onClose, className = '' }: KeyboardShortcutsHelpProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'navigation' | 'action' | 'modal' | 'game'>('all');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>('beginner');
  const [practiceMode, setPracticeMode] = useState(false);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use focus trap for modal behavior
  useFocusTrap(isOpen, dialogRef, {
    initialFocus: searchInputRef
  });

  // Handle escape key to close
  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  // Get platform-specific modifier key text
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  const modifierKey = isMac ? '⌘' : 'Ctrl';
  const altKey = isMac ? '⌥' : 'Alt';

  // Get all registered shortcuts
  const allShortcuts = globalShortcutManager.getShortcuts();

  // Filter shortcuts based on search and category
  const filteredShortcuts = allShortcuts.filter(shortcut => {
    const matchesSearch = searchTerm === '' || 
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.shortcutKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    
    // Skill level filtering (simplified - would need more metadata in real app)
    const matchesSkillLevel = skillLevel === 'all' || 
      (skillLevel === 'beginner' && ['navigation', 'modal'].includes(shortcut.category)) ||
      (skillLevel === 'intermediate' && ['action', 'navigation'].includes(shortcut.category)) ||
      (skillLevel === 'advanced');

    return matchesSearch && matchesCategory && matchesSkillLevel;
  });


  // Format shortcut key for display
  const formatShortcutKey = (shortcutKey: string): string => {
    return shortcutKey
      .replace('Ctrl', modifierKey)
      .replace('Alt', altKey)
      .replace('Meta', isMac ? '⌘' : 'Win')
      .replace('Shift', '⇧')
      .replace(/\+/g, ' + ');
  };

  // Category display names
  const categoryNames = {
    navigation: 'Navigation',
    action: 'Actions',
    modal: 'Modals & Dialogs',
    game: 'Game Controls'
  };

  // Built-in shortcuts that are always available
  const builtInShortcuts = [
    {
      shortcutKey: 'Tab',
      description: 'Navigate to next focusable element',
      category: 'navigation' as const
    },
    {
      shortcutKey: 'Shift+Tab',
      description: 'Navigate to previous focusable element',
      category: 'navigation' as const
    },
    {
      shortcutKey: 'Escape',
      description: 'Close modals, cancel actions, or go back',
      category: 'modal' as const
    },
    {
      shortcutKey: 'Enter',
      description: 'Activate buttons and links',
      category: 'action' as const
    },
    {
      shortcutKey: 'Space',
      description: 'Activate buttons and checkboxes',
      category: 'action' as const
    },
    {
      shortcutKey: 'Arrow Keys',
      description: 'Navigate within lists and grids',
      category: 'navigation' as const
    },
    {
      shortcutKey: `${altKey}+W`,
      description: 'Navigate to Worlds page',
      category: 'navigation' as const
    },
    {
      shortcutKey: `${altKey}+C`,
      description: 'Navigate to Characters page',
      category: 'navigation' as const
    },
    {
      shortcutKey: `${altKey}+S`,
      description: 'Navigate to Settings page',
      category: 'navigation' as const
    },
    {
      shortcutKey: `${altKey}+H`,
      description: 'Open this help dialog',
      category: 'navigation' as const
    }
  ];

  // Combine built-in and dynamic shortcuts
  const allDisplayShortcuts = [...builtInShortcuts, ...filteredShortcuts];
  const finalGroupedShortcuts = allDisplayShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, typeof allDisplayShortcuts>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={dialogRef}
        className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col ${className}`}
        role="dialog"
        aria-labelledby="shortcuts-help-title"
        aria-describedby="shortcuts-help-description"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="shortcuts-help-title" className="text-2xl font-bold text-gray-900">
                Keyboard Shortcuts
              </h2>
              <p id="shortcuts-help-description" className="text-sm text-gray-600 mt-1">
                Navigate Narraitor efficiently with keyboard shortcuts
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Close shortcuts help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-4 space-y-4">
            {/* Search */}
            <div>
              <label htmlFor="shortcut-search" className="block text-sm font-medium text-gray-700 mb-1">
                Search shortcuts
              </label>
              <input
                ref={searchInputRef}
                id="shortcut-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by description or key combination..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as typeof selectedCategory)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="navigation">Navigation</option>
                  <option value="action">Actions</option>
                  <option value="modal">Modals</option>
                  <option value="game">Game Controls</option>
                </select>
              </div>

              {/* Skill Level Filter */}
              <div>
                <label htmlFor="skill-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Level
                </label>
                <select
                  id="skill-filter"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as typeof skillLevel)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all">All Levels</option>
                </select>
              </div>

              {/* Practice Mode Toggle */}
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Practice Mode</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {practiceMode ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⌨️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Practice Mode</h3>
              <p className="text-gray-600 mb-4">
                Practice mode is coming soon! This will let you interactively learn keyboard shortcuts.
              </p>
              <Button onClick={() => setPracticeMode(false)} variant="outline">
                Back to Reference
              </Button>
            </div>
          ) : Object.keys(finalGroupedShortcuts).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No shortcuts found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(finalGroupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    {categoryNames[category as keyof typeof categoryNames] || category}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({shortcuts.length} shortcut{shortcuts.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {shortcuts.map((shortcut, index) => (
                      <div 
                        key={`${shortcut.shortcutKey}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-gray-700 flex-1">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono text-gray-800 shadow-sm ml-4 whitespace-nowrap">
                          {formatShortcutKey(shortcut.shortcutKey)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Platform-specific note */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Platform Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You&apos;re using {isMac ? 'macOS' : 'Windows/Linux'}. 
                      Shortcuts are displayed with platform-specific modifier keys.
                      {!isMac && ' Use Ctrl instead of ⌘, and Alt instead of ⌥.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Escape</kbd> to close
            </span>
            <span>
              {filteredShortcuts.length} of {allShortcuts.length + builtInShortcuts.length} shortcuts shown
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}