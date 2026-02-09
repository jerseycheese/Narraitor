import { Typography } from '@/components/ui/Typography';

const meta = {
  title: '01-Atoms/display/Typography',
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

export default meta;

export const Default = {
  render: () => <Typography />
};

export const Headings = {
  render: () => (
    <div>
      <h2>Heading Hierarchy</h2>
      <div>
        <h1>H1 - Page Title (3xl)</h1>
        <h2>H2 - Section Title (2xl)</h2>
        <h3>H3 - Subsection Title (xl)</h3>
        <h4>H4 - Card Title (lg)</h4>
        <h5>H5 - Label (base)</h5>
        <h6>H6 - Small Label (sm)</h6>
      </div>
    </div>
  )
};

export const BodyText = {
  render: () => (
    <div>
      <h2>Body Text Sizes</h2>
      <div>
        <div>
          <p>Large (lg)</p>
          <p>
            Used for introductory text or emphasis. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>
        <div>
          <p>Base (default)</p>
          <p>
            Standard body text used throughout the application. Lorem ipsum dolor sit amet, 
            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
          </p>
        </div>
        <div>
          <p>Small (sm)</p>
          <p>
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
    <div>
      <h2>Link Styles</h2>
      <div>
        <div>
          <p>Standard Links</p>
          <p>
            Links are styled with <a href="#">blue-700 color</a> by default and 
            transition to <a href="#">blue-700 on hover</a> with an underline.
          </p>
        </div>
        <div>
          <p>Links on Dark Backgrounds</p>
          <p>
            In dark contexts, <a href="#" >links inherit</a> the 
            parent text color for better readability.
          </p>
        </div>
      </div>
    </div>
  )
};

export const Colors = {
  render: () => (
    <div>
      <h2>Color Palette</h2>
      <div>
        <div>
          <h3>Text Colors</h3>
          <div>
            <p>Gray 900 - Primary</p>
            <p>Gray 700 - Secondary</p>
            <p>Gray 600 - Tertiary</p>
            <p>Gray 500 - Muted</p>
            <p>Gray 400 - Disabled</p>
          </div>
        </div>
        <div>
          <h3>Semantic Colors</h3>
          <div>
            <p>Blue 600 - Links/Primary</p>
            <p>Green 600 - Success</p>
            <p>Amber 600 - Warning</p>
            <p>Red 600 - Error</p>
          </div>
        </div>
      </div>
    </div>
  )
};

export const NarraitorLogo = {
  render: () => (
    <div>
      <h2>Narraitor Logo Style</h2>
      <div>
        <div>
          <span>Narr</span>
          <span>ai</span>
          <span>tor</span>
        </div>
        <div>
          <span>Narr</span>
          <span>ai</span>
          <span>tor</span>
        </div>
        <div>
          <span>Narr</span>
          <span>ai</span>
          <span>tor</span>
        </div>
      </div>
    </div>
  )
};
