import React from 'react';
import { Logo, LogoText, LogoIcon } from './Logo.jsx';

export default {
  title: 'Narraitor/Design/Brand/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Narraitor logo components including full logo with text, text only, and icon only variants.'
      }
    }
  }
};

export const Default = {
  render: () => <Logo />
};

export const Sizes = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Logo with Text</h3>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Small</p>
            <Logo size="small" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Medium (Default)</p>
            <Logo size="medium" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Large</p>
            <Logo size="large" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Extra Large</p>
            <Logo size="xl" />
          </div>
        </div>
      </div>
    </div>
  )
};

export const IconOnly = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Icon Sizes</h3>
        <div className="flex items-end gap-6">
          <div className="text-center">
            <LogoIcon size="small" />
            <p className="text-xs text-gray-500 mt-1">Small (32px)</p>
          </div>
          <div className="text-center">
            <LogoIcon size="medium" />
            <p className="text-xs text-gray-500 mt-1">Medium (64px)</p>
          </div>
          <div className="text-center">
            <LogoIcon size="large" />
            <p className="text-xs text-gray-500 mt-1">Large (96px)</p>
          </div>
          <div className="text-center">
            <LogoIcon size="xl" />
            <p className="text-xs text-gray-500 mt-1">XL (128px)</p>
          </div>
        </div>
      </div>
    </div>
  )
};

export const TextOnly = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Text Logo Variations</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Small</p>
            <LogoText size="sm" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Medium</p>
            <LogoText size="md" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Large (Default)</p>
            <LogoText size="lg" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Extra Large</p>
            <LogoText size="xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">2X Large</p>
            <LogoText size="2xl" />
          </div>
        </div>
      </div>
    </div>
  )
};

export const Usage = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Usage Examples</h3>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-3">Navigation Header</p>
            <div className="bg-white p-3 rounded border flex justify-between items-center">
              <Logo size="small" />
              <div className="flex gap-3 text-sm">
                <a href="#" className="hover:text-blue-600">Worlds</a>
                <a href="#" className="hover:text-blue-600">Characters</a>
                <a href="#" className="hover:text-blue-600">Play</a>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-3">Hero Section</p>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded text-center">
              <Logo size="xl" className="justify-center mb-4" />
              <p className="text-gray-600">Create immersive narrative experiences</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-3">Footer</p>
            <div className="bg-gray-900 text-white p-4 rounded">
              <Logo size="small" className="mb-3" />
              <p className="text-gray-400 text-sm">© 2024 Narraitor. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export const OnDarkBackground = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Dark Background Usage</h3>
        <div className="bg-gray-900 p-8 rounded-lg">
          <div className="space-y-6">
            <Logo size="medium" className="text-white" />
            <Logo size="small" className="text-white" />
            <LogoText className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
};