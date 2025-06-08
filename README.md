# Narraitor

A world-agnostic narrative-driven RPG framework using AI to deliver dynamic storytelling experiences adaptable to any fictional world.

## Project Overview

Narraitor is a Next.js-based web application providing an AI-driven narrative experience for tabletop RPGs across any fictional world. The application uses modern AI models to deliver dynamic storytelling while adapting to the specific themes, tone, and mechanics of the selected world.

## Features

- **World Configuration**: Flexible system for defining settings, rules, and parameters for any fictional universe
- **AI-Assisted World Creation**: Wizard with intelligent attribute and skill suggestions based on genre and theme
- **Character Management**: Comprehensive creation and management system with attributes, skills, and background
- **Dynamic AI Narrative Engine**: Advanced storytelling with context-aware generation and decision weight analysis
- **Decision Weight System**: Visual prominence indicators for important narrative choices (Minor/Major/Critical)
- **Choice Alignment System**: Lawful/Neutral/Chaotic choice categorization with visual indicators
- **Smart Context Summaries**: AI-generated decision context that explains stakes rather than retelling story
- **Ending Generation**: AI-powered story conclusions with multiple ending types and visual feedback
- **Journal System**: Comprehensive tracking of gameplay events, decisions, and narrative progression
- **State Persistence**: Reliable session management using IndexedDB for seamless gameplay continuation
- **Visual Theming**: Dynamic styling and presentation based on world settings and narrative context
- **Template Worlds**: Pre-configured worlds (Western, Sitcom, Adventure) for quick start gameplay
- **Accessibility**: Screen reader support, keyboard navigation, and semantic HTML structure

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm
- Google Gemini API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/jerseycheese/narraitor.git
cd narraitor

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY (server-side only for security)

# Start the development server
npm run dev
```

## Development

This project follows a component-first development approach using Storybook and Test-Driven Development.

```bash
# Run Storybook
npm run storybook

# Run tests
npm run test

# Run specific test suites
npm run test:prompt-templates
```

### Development Test Harnesses

The application includes test harnesses for interactive component testing:

- `/dev` - Development test harness index
- `/dev/world-creation-wizard` - World Creation Wizard test harness
- `/dev/test` - Basic test component
- `/dev/controls` - Developer controls interface
- `/dev/mocks` - Mock services testing

## Project Structure

The project uses Next.js App Router (Next.js 15+) with the following structure:

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── error.tsx           # Error boundary
│   ├── loading.tsx         # Loading state
│   └── dev/                # Development test harnesses
├── components/             # Shared UI components
├── lib/                    # Utility functions and services
├── state/                  # State management (Zustand stores)
├── types/                  # TypeScript type definitions
└── utils/                  # Helper functions
```

## Architecture

Narraitor follows a domain-driven design approach with clear separation of concerns:

- **World Configuration**: Define settings, rules, and parameters
  - Multi-step wizard for creating worlds
  - AI-assisted attribute and skill generation
  - Default attributes and skills for quick setup
- **Character System**: Create and manage characters
- **Narrative Engine**: AI-driven storytelling with template system
- **Journal System**: Track gameplay events
- **State Management**: Persist game state between sessions using Zustand
- **AI Service Integration**: Google Gemini integration for dynamic content generation

### App Router Migration

The application has been migrated from Next.js Pages Router to App Router, leveraging:
- React Server Components for improved performance
- Nested layouts for better code organization
- Built-in error boundaries and loading states
- Metadata API for SEO optimization

## AI Service Integration

Narraitor uses Google Gemini AI for dynamic narrative generation through secure server-side API routes. Configure the service by setting environment variables:

```bash
# .env.local
GEMINI_API_KEY=your-api-key  # Server-side only for security
```

### Security Features

- **Server-side API keys**: API keys are never exposed to the browser
- **Rate limiting**: 50 requests per hour per IP to prevent abuse
- **Secure proxy**: All AI requests route through Next.js API endpoints
- **Request validation**: Input sanitization and error handling

All AI requests are processed through secure API routes (`/api/narrative/generate`, `/api/narrative/choices`) instead of direct client-side calls. See the [AI Service API documentation](docs/technical-guides/ai-service-api.md) for implementation details.

### Portrait Generation

Narraitor includes an AI-powered portrait generation system for creating character images. For comprehensive documentation, see:

- [Portrait Generation Documentation](docs/features/portrait-generation/) - Complete guide to the portrait system
- [API Reference](docs/features/portrait-generation/api.md) - Endpoint documentation and OpenAPI spec
- [Integration Guide](docs/features/portrait-generation/integration-guide.md) - How to use portraits in your components
- [Troubleshooting](docs/features/portrait-generation/troubleshooting.md) - Common issues and solutions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
