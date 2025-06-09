/**
 * World-specific test data factory
 * 
 * Provides specialized factories for creating World, WorldAttribute, and WorldSkill
 * test objects with realistic data patterns. Uses the Builder pattern for flexible
 * object construction and includes preset configurations for common test scenarios.
 * 
 * @module WorldFactory
 * @version 1.0.0
 * @since MVP
 */

import type { 
  World, 
  WorldAttribute, 
  WorldSkill, 
  WorldSettings
} from '@/types';
import { generateUniqueId } from '@/lib/utils';

const DEFAULT_TIMESTAMP = '2023-01-01T00:00:00.000Z';

/**
 * Builder pattern factory for World objects
 * 
 * Provides a fluent interface for constructing World test data with
 * various configurations and preset scenarios.
 * 
 * @example
 * ```typescript
 * const world = WorldFactory.create()
 *   .name('Test World')
 *   .theme('Fantasy')
 *   .withStandardAttributes()
 *   .build();
 * ```
 */
export class WorldFactory {
  private world: Partial<World> = {};

  /**
   * Create a new WorldFactory instance
   * 
   * @returns A new WorldFactory for building World objects
   */
  static create(): WorldFactory {
    return new WorldFactory();
  }

  id(id: string): this {
    this.world.id = id;
    return this;
  }

  name(name: string): this {
    this.world.name = name;
    return this;
  }

  theme(theme: string): this {
    this.world.theme = theme;
    return this;
  }

  description(description: string): this {
    this.world.description = description;
    return this;
  }

  withAttributes(attributes: WorldAttribute[]): this {
    this.world.attributes = attributes;
    return this;
  }

  withSkills(skills: WorldSkill[]): this {
    this.world.skills = skills;
    return this;
  }

  withSettings(settings: Partial<WorldSettings>): this {
    this.world.settings = {
      maxAttributes: 10,
      maxSkills: 20,
      attributePointPool: 30,
      skillPointPool: 40,
      ...settings
    };
    return this;
  }

  /**
   * Configure world with fantasy theme and appropriate attributes/skills
   * 
   * @returns This factory instance for method chaining
   */
  fantasy(): this {
    return this
      .theme('Fantasy')
      .withAttributes([
        AttributeFactory.create().name('Strength').category('Physical').build(),
        AttributeFactory.create().name('Intelligence').category('Mental').build(),
        AttributeFactory.create().name('Charisma').category('Social').build()
      ])
      .withSkills([
        SkillFactory.create().name('Athletics').category('Physical').build(),
        SkillFactory.create().name('Arcana').category('Knowledge').build(),
        SkillFactory.create().name('Persuasion').category('Social').build()
      ]);
  }

  sciFi(): this {
    return this
      .theme('Sci-Fi')
      .withAttributes([
        AttributeFactory.create().name('Tech').category('Technical').build(),
        AttributeFactory.create().name('Logic').category('Mental').build(),
        AttributeFactory.create().name('Reaction').category('Physical').build()
      ])
      .withSkills([
        SkillFactory.create().name('Engineering').category('Technical').build(),
        SkillFactory.create().name('Computer Use').category('Technical').build(),
        SkillFactory.create().name('Pilot').category('Physical').build()
      ]);
  }

  horror(): this {
    return this
      .theme('Horror')
      .withAttributes([
        AttributeFactory.create().name('Sanity').category('Mental').build(),
        AttributeFactory.create().name('Willpower').category('Mental').build(),
        AttributeFactory.create().name('Perception').category('Mental').build()
      ])
      .withSkills([
        SkillFactory.create().name('Investigation').category('Mental').build(),
        SkillFactory.create().name('Occult').category('Knowledge').build(),
        SkillFactory.create().name('Psychology').category('Social').build()
      ]);
  }

  /**
   * Add a standard set of RPG attributes to the world
   * 
   * @returns This factory instance for method chaining
   */
  withStandardAttributes(): this {
    return this.withAttributes([
      AttributeFactory.create().name('Strength').category('Physical').range(1, 20).build(),
      AttributeFactory.create().name('Dexterity').category('Physical').range(1, 20).build(),
      AttributeFactory.create().name('Intelligence').category('Mental').range(1, 20).build(),
      AttributeFactory.create().name('Wisdom').category('Mental').range(1, 20).build(),
      AttributeFactory.create().name('Charisma').category('Social').range(1, 20).build(),
      AttributeFactory.create().name('Constitution').category('Physical').range(1, 20).build()
    ]);
  }

  /**
   * Configure world with minimal complexity for simple tests
   * 
   * @returns This factory instance for method chaining
   */
  minimal(): this {
    return this
      .name('Minimal World')
      .theme('Fantasy')
      .description('A minimal world for testing')
      .withAttributes([])
      .withSkills([])
      .withSettings({
        maxAttributes: 3,
        maxSkills: 5,
        attributePointPool: 15,
        skillPointPool: 10
      });
  }

  /**
   * Configure world with high complexity for comprehensive tests
   * 
   * @returns This factory instance for method chaining
   */
  complex(): this {
    return this
      .name('Complex World')
      .theme('Fantasy')
      .description('A complex world with many attributes and skills')
      .withStandardAttributes()
      .withSkills([
        SkillFactory.create().name('Athletics').difficulty('easy').build(),
        SkillFactory.create().name('Acrobatics').difficulty('medium').build(),
        SkillFactory.create().name('Stealth').difficulty('medium').build(),
        SkillFactory.create().name('Investigation').difficulty('hard').build(),
        SkillFactory.create().name('Arcana').difficulty('hard').build()
      ])
      .withSettings({
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 27,
        skillPointPool: 30
      });
  }

  /**
   * Build the final World object with all configured properties
   * 
   * @returns A complete World object ready for testing
   */
  build(): World {
    const defaults: World = {
      id: generateUniqueId('world'),
      name: 'Test World',
      description: 'A test world for unit testing',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 20,
        attributePointPool: 30,
        skillPointPool: 40,
      },
      createdAt: DEFAULT_TIMESTAMP,
      updatedAt: DEFAULT_TIMESTAMP,
    };

    return { ...defaults, ...this.world };
  }
}

/**
 * Builder pattern factory for WorldAttribute objects
 * 
 * Creates WorldAttribute test objects with various configurations.
 * Supports common attribute patterns and realistic value ranges.
 * 
 * @example
 * ```typescript
 * const attribute = AttributeFactory.create()
 *   .name('Strength')
 *   .physical()
 *   .range(1, 20)
 *   .build();
 * ```
 */
export class AttributeFactory {
  private attribute: Partial<WorldAttribute> = {};

  static create(): AttributeFactory {
    return new AttributeFactory();
  }

  id(id: string): this {
    this.attribute.id = id;
    return this;
  }

  worldId(worldId: string): this {
    this.attribute.worldId = worldId;
    return this;
  }

  name(name: string): this {
    this.attribute.name = name;
    return this;
  }

  description(description: string): this {
    this.attribute.description = description;
    return this;
  }

  category(category: string): this {
    this.attribute.category = category;
    return this;
  }

  baseValue(value: number): this {
    this.attribute.baseValue = value;
    return this;
  }

  range(min: number, max: number): this {
    this.attribute.minValue = min;
    this.attribute.maxValue = max;
    return this;
  }

  physical(): this {
    return this.category('Physical');
  }

  mental(): this {
    return this.category('Mental');
  }

  social(): this {
    return this.category('Social');
  }

  build(): WorldAttribute {
    const defaults: WorldAttribute = {
      id: generateUniqueId('attr'),
      worldId: 'world-test-1',
      name: 'Test Attribute',
      description: 'A test attribute',
      baseValue: 10,
      minValue: 1,
      maxValue: 20,
      category: 'General',
    };

    return { ...defaults, ...this.attribute };
  }
}

/**
 * Builder pattern factory for WorldSkill objects
 */
export class SkillFactory {
  private skill: Partial<WorldSkill> = {};

  static create(): SkillFactory {
    return new SkillFactory();
  }

  id(id: string): this {
    this.skill.id = id;
    return this;
  }

  worldId(worldId: string): this {
    this.skill.worldId = worldId;
    return this;
  }

  name(name: string): this {
    this.skill.name = name;
    return this;
  }

  description(description: string): this {
    this.skill.description = description;
    return this;
  }

  category(category: string): this {
    this.skill.category = category;
    return this;
  }

  linkedToAttribute(attributeId: string): this {
    this.skill.linkedAttributeId = attributeId;
    return this;
  }

  difficulty(difficulty: 'easy' | 'medium' | 'hard'): this {
    this.skill.difficulty = difficulty;
    return this;
  }

  baseValue(value: number): this {
    this.skill.baseValue = value;
    return this;
  }

  range(min: number, max: number): this {
    this.skill.minValue = min;
    this.skill.maxValue = max;
    return this;
  }

  physical(): this {
    return this.category('Physical');
  }

  mental(): this {
    return this.category('Mental');
  }

  social(): this {
    return this.category('Social');
  }

  technical(): this {
    return this.category('Technical');
  }

  knowledge(): this {
    return this.category('Knowledge');
  }

  build(): WorldSkill {
    const defaults: WorldSkill = {
      id: generateUniqueId('skill'),
      worldId: 'world-test-1',
      name: 'Test Skill',
      description: 'A test skill',
      linkedAttributeId: 'attr-1',
      difficulty: 'medium',
      baseValue: 5,
      minValue: 1,
      maxValue: 10,
      category: 'General',
    };

    return { ...defaults, ...this.skill };
  }
}

/**
 * Collection factory for creating sets of related world objects
 * 
 * Provides convenience methods for creating complete sets of world data
 * including worlds with their attributes and skills configured appropriately.
 * 
 * @example
 * ```typescript
 * const fantasyWorld = WorldCollectionFactory.createFantasyWorld();
 * const worldList = WorldCollectionFactory.createWorldList(5, 'Fantasy');
 * const attributes = WorldCollectionFactory.createAttributeSet('world-1', 'standard');
 * ```
 */
export class WorldCollectionFactory {
  static createFantasyWorld(): World {
    return WorldFactory.create().fantasy().build();
  }

  static createSciFiWorld(): World {
    return WorldFactory.create().sciFi().build();
  }

  static createHorrorWorld(): World {
    return WorldFactory.create().horror().build();
  }

  static createMinimalWorld(): World {
    return WorldFactory.create().minimal().build();
  }

  static createComplexWorld(): World {
    return WorldFactory.create().complex().build();
  }

  /**
   * Create a list of worlds for testing scenarios requiring multiple worlds
   * 
   * @param count - Number of worlds to create
   * @param theme - Optional theme to use for all worlds (otherwise cycles through themes)
   * @returns Record mapping world IDs to World objects
   */
  static createWorldList(count: number, theme?: string): Record<string, World> {
    const worlds: Record<string, World> = {};
    const themes: string[] = ['Fantasy', 'Sci-Fi', 'Horror', 'Modern', 'Historical'];

    for (let i = 0; i < count; i++) {
      const worldTheme = theme || themes[i % themes.length];
      const world = WorldFactory.create()
        .id(`world-${i + 1}`)
        .name(`${worldTheme} World ${i + 1}`)
        .theme(worldTheme)
        .description(`A ${worldTheme.toLowerCase()} world for testing`)
        .build();
      
      worlds[world.id] = world;
    }

    return worlds;
  }

  /**
   * Create a thematically appropriate set of attributes for a world
   * 
   * @param worldId - The ID of the world these attributes belong to
   * @param theme - The attribute naming theme to use
   * @returns Array of WorldAttribute objects
   */
  static createAttributeSet(worldId: string, theme: 'standard' | 'fantasy' | 'scifi' = 'standard'): WorldAttribute[] {
    const baseAttributes = {
      standard: ['Strength', 'Dexterity', 'Intelligence', 'Wisdom', 'Constitution', 'Charisma'],
      fantasy: ['Might', 'Agility', 'Intellect', 'Spirit', 'Vigor', 'Presence'],
      scifi: ['Body', 'Coordination', 'Logic', 'Intuition', 'Will', 'Edge']
    };

    return baseAttributes[theme].map((name, index) => 
      AttributeFactory.create()
        .worldId(worldId)
        .name(name)
        .baseValue(10 + index)
        .range(1, 20)
        .build()
    );
  }

  /**
   * Create a thematically appropriate set of skills for a world
   * 
   * @param worldId - The ID of the world these skills belong to
   * @param attributeIds - Array of attribute IDs to link skills to
   * @param theme - The skill theme to use
   * @returns Array of WorldSkill objects
   */
  static createSkillSet(worldId: string, attributeIds: string[], theme: 'fantasy' | 'scifi' | 'modern' = 'fantasy'): WorldSkill[] {
    const skillSets = {
      fantasy: [
        { name: 'Athletics', category: 'Physical', difficulty: 'easy' as const },
        { name: 'Arcane Lore', category: 'Knowledge', difficulty: 'hard' as const },
        { name: 'Stealth', category: 'Physical', difficulty: 'medium' as const },
        { name: 'Persuasion', category: 'Social', difficulty: 'medium' as const },
        { name: 'Investigation', category: 'Mental', difficulty: 'medium' as const }
      ],
      scifi: [
        { name: 'Engineering', category: 'Technical', difficulty: 'hard' as const },
        { name: 'Computer Use', category: 'Technical', difficulty: 'medium' as const },
        { name: 'Pilot', category: 'Physical', difficulty: 'hard' as const },
        { name: 'Research', category: 'Mental', difficulty: 'medium' as const },
        { name: 'Negotiate', category: 'Social', difficulty: 'medium' as const }
      ],
      modern: [
        { name: 'Drive', category: 'Physical', difficulty: 'easy' as const },
        { name: 'Computer', category: 'Technical', difficulty: 'medium' as const },
        { name: 'Research', category: 'Mental', difficulty: 'easy' as const },
        { name: 'Fast Talk', category: 'Social', difficulty: 'medium' as const },
        { name: 'Notice', category: 'Mental', difficulty: 'easy' as const }
      ]
    };

    return skillSets[theme].map((skillData, index) => 
      SkillFactory.create()
        .worldId(worldId)
        .name(skillData.name)
        .category(skillData.category)
        .difficulty(skillData.difficulty)
        .linkedToAttribute(attributeIds[index % attributeIds.length])
        .build()
    );
  }
}