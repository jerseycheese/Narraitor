import React from 'react';
import { LogoText, LogoIcon } from '@/components/ui/Logo';

const meta = {
  title: '01-Atoms/display/Logo',
  component: LogoIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Narraitor logo components including full logo with text, text only, and icon only variants.',
      },
    },
  },
};

export default meta;

export const Default = {
  render: () => <LogoIcon />,
};

export const IconOnly = {
  render: () => (
    <div>
      <div>
        <h3>Icon Sizes</h3>
        <div>
          <div>
            <LogoIcon size="small" />
            <p>Small (32px)</p>
          </div>
          <div>
            <LogoIcon size="medium" />
            <p>Medium (64px)</p>
          </div>
          <div>
            <LogoIcon size="large" />
            <p>Large (96px)</p>
          </div>
          <div>
            <LogoIcon size="xl" />
            <p>XL (128px)</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const TextOnly = {
  render: () => (
    <div>
      <div>
        <h3>Text Logo Variations</h3>
        <div>
          <div>
            <p>Small</p>
            <LogoText size="sm" />
          </div>
          <div>
            <p>Medium</p>
            <LogoText size="md" />
          </div>
          <div>
            <p>Large (Default)</p>
            <LogoText size="lg" />
          </div>
          <div>
            <p>Extra Large</p>
            <LogoText size="xl" />
          </div>
          <div>
            <p>2X Large</p>
            <LogoText size="2xl" />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Usage = {
  render: () => (
    <div>
      <div>
        <h3>Usage Examples</h3>

        <div>
          <div>
            <p>Navigation Header</p>
            <div>
              <LogoIcon size="small" />
              <LogoText size="sm" />
              <div>
                <a href="#">Worlds</a>
                <a href="#">Characters</a>
                <a href="#">Play</a>
              </div>
            </div>
          </div>

          <div>
            <p>Hero Section</p>
            <div>
              <LogoIcon size="xl" />
              <LogoText size="xl" />
              <p>Create immersive narrative experiences</p>
            </div>
          </div>

          <div>
            <p>Footer</p>
            <div>
              <LogoIcon size="small" />
              <LogoText size="sm" />
              <p>© 2024 Narraitor. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const OnDarkBackground = {
  render: () => (
    <div>
      <div>
        <h3>Dark Background Usage</h3>
        <div>
          <div>
            <LogoIcon size="medium" />
            <LogoIcon size="small" />
            <LogoText />
          </div>
        </div>
      </div>
    </div>
  ),
};
