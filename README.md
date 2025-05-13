# Narraitor

A world-agnostic narrative-driven RPG framework using AI to deliver dynamic storytelling experiences adaptable to any fictional world.

## Project Overview

Narraitor is a Next.js-based web application providing an AI-driven narrative experience for tabletop RPGs across any fictional world. The application uses modern AI models to deliver dynamic storytelling while adapting to the specific themes, tone, and mechanics of the selected world.

## Features

- World configuration system for defining settings, rules, and parameters
- Character creation and management system with attributes and skills
- AI-driven narrative engine for dynamic storytelling
- Journal system for tracking gameplay events
- State persistence between sessions using IndexedDB
- Basic visual theming based on world settings
- Template worlds (Western, Sitcom, Adventure)

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
# Edit .env.local and add your NEXT_PUBLIC_GEMINI_API_KEY

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

## Architecture

Narraitor follows a domain-driven design approach with clear separation of concerns:

- **World Configuration**: Define settings, rules, and parameters
- **Character System**: Create and manage characters
- **Narrative Engine**: AI-driven storytelling with template system
- **Journal System**: Track gameplay events
- **State Management**: Persist game state between sessions
- **AI Service Integration**: Google Gemini integration for dynamic content generation

## AI Service Integration

Narraitor uses Google Gemini AI for dynamic narrative generation. Configure the service by setting environment variables:

```bash
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=your-api-key
```

The AI service integrates with the template system to generate contextual narratives based on world and character data. See the [AI Service API documentation](docs/technical-guides/ai-service-api.md) for implementation details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
