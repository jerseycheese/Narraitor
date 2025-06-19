import React from 'react';
import { Typography } from './Typography.jsx';

export default {
  title: 'Narraitor/Design/Typography/Text Styles',
  component: Typography,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive typography guide showing all text styles, sizes, colors, and patterns used throughout the Narraitor application.'
      }
    }
  }
};

export const Default = {
  render: () => <Typography />
};

export const Headings = {
  render: () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Heading Hierarchy</h2>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">H1 - Page Title (3xl)</h1>
        <h2 className="text-2xl font-bold">H2 - Section Title (2xl)</h2>
        <h3 className="text-xl font-bold">H3 - Subsection Title (xl)</h3>
        <h4 className="text-lg font-semibold">H4 - Card Title (lg)</h4>
        <h5 className="text-base font-semibold">H5 - Label (base)</h5>
        <h6 className="text-sm font-semibold">H6 - Small Label (sm)</h6>
      </div>
    </div>
  )
};

export const BodyText = {
  render: () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Body Text Sizes</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-2">Large (lg)</p>
          <p className="text-lg max-w-2xl">
            Used for introductory text or emphasis. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Base (default)</p>
          <p className="text-base max-w-2xl">
            Standard body text used throughout the application. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Small (sm)</p>
          <p className="text-sm max-w-2xl">
            Used for secondary information and help text. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>
      </div>
    </div>
  )
};

export const Links = {
  render: () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Link Styles</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-2">Standard Links</p>
          <p className="text-base">
            Links are styled with <a href="#">blue-600 color</a> by default and 
            transition to <a href="#">blue-700 on hover</a> with an underline.
          </p>
        </div>
        <div className="bg-gray-900 text-white p-4 rounded">
          <p className="text-sm text-gray-400 mb-2">Links on Dark Backgrounds</p>
          <p>
            In dark contexts, <a href="#" className="hover:text-gray-300">links inherit</a> the 
            parent text color for better readability.
          </p>
        </div>
      </div>
    </div>
  )
};

export const Colors = {
  render: () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Color Palette</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-3">Text Colors</h3>
          <div className="space-y-2">
            <p className="text-gray-900">Gray 900 - Primary</p>
            <p className="text-gray-700">Gray 700 - Secondary</p>
            <p className="text-gray-600">Gray 600 - Tertiary</p>
            <p className="text-gray-500">Gray 500 - Muted</p>
            <p className="text-gray-400">Gray 400 - Disabled</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Semantic Colors</h3>
          <div className="space-y-2">
            <p className="text-blue-600">Blue 600 - Links/Primary</p>
            <p className="text-green-600">Green 600 - Success</p>
            <p className="text-amber-600">Amber 600 - Warning</p>
            <p className="text-red-600">Red 600 - Error</p>
          </div>
        </div>
      </div>
    </div>
  )
};

export const NarraitorLogo = {
  render: () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Narraitor Logo Style</h2>
      <div className="space-y-4">
        <div className="text-4xl">
          <span className="font-light">Narr</span>
          <span className="font-bold">ai</span>
          <span className="font-light">tor</span>
        </div>
        <div className="text-2xl">
          <span className="font-light">Narr</span>
          <span className="font-bold">ai</span>
          <span className="font-light">tor</span>
        </div>
        <div className="text-xl">
          <span className="font-light">Narr</span>
          <span className="font-bold">ai</span>
          <span className="font-light">tor</span>
        </div>
      </div>
    </div>
  )
};
