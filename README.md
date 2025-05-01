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

### Installation

```bash
# Clone the repository
git clone https://github.com/jerseycheese/narraitor.git
cd narraitor

# Install dependencies
npm install

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
```

## Architecture

Narraitor follows a domain-driven design approach with clear separation of concerns:

- **World Configuration**: Define settings, rules, and parameters
- **Character System**: Create and manage characters
- **Narrative Engine**: AI-driven storytelling
- **Journal System**: Track gameplay events
- **State Management**: Persist game state between sessions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
