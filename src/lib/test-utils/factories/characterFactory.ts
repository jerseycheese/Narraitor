/**
 * Character-specific test data factory
 * Provides specialized factories for character-related entities
 */

import type { 
  Character, 
  CharacterAttribute, 
  CharacterSkill, 
  CharacterBackground,
  CharacterStatus,
  Inventory,
  InventoryItem
} from '@/types';
import { generateUniqueId } from '@/lib/utils';

const DEFAULT_TIMESTAMP = '2023-01-01T00:00:00.000Z';

/**
 * Builder pattern factory for Character objects
 */
export class CharacterFactory {
  private character: Partial<Character> = {};

  static create(): CharacterFactory {
    return new CharacterFactory();
  }

  id(id: string): this {
    this.character.id = id;
    return this;
  }

  worldId(worldId: string): this {
    this.character.worldId = worldId;
    return this;
  }

  name(name: string): this {
    this.character.name = name;
    return this;
  }

  description(description: string): this {
    this.character.description = description;
    return this;
  }

  withAttributes(attributes: CharacterAttribute[]): this {
    this.character.attributes = attributes;
    return this;
  }

  withSkills(skills: CharacterSkill[]): this {
    this.character.skills = skills;
    return this;
  }

  withBackground(background: Partial<CharacterBackground>): this {
    this.character.background = {
      history: 'Default history',
      personality: 'Default personality',
      goals: [],
      fears: [],
      relationships: [],
      ...background
    };
    return this;
  }

  withStatus(status: Partial<CharacterStatus>): this {
    this.character.status = {
      health: 100,
      maxHealth: 100,
      conditions: [],
      ...status
    };
    return this;
  }

  withInventory(inventory: Partial<Inventory>): this {
    this.character.inventory = {
      characterId: this.character.id || 'char-test-1',
      items: [],
      capacity: 10,
      categories: [
        { id: 'cat-equipment', name: 'Equipment', description: 'Weapons, armor, and gear', sortOrder: 0 },
        { id: 'cat-consumables', name: 'Consumables', description: 'Potions and single-use items', sortOrder: 1 },
        { id: 'cat-quest', name: 'Quest Items', description: 'Important story items', sortOrder: 2 }
      ],
      ...inventory
    };
    return this;
  }

  warrior(): this {
    return this
      .name('Test Warrior')
      .description('A mighty warrior character')
      .withAttributes([
        CharacterAttributeFactory.create().attributeId('strength').value(18).build(),
        CharacterAttributeFactory.create().attributeId('dexterity').value(14).build(),
        CharacterAttributeFactory.create().attributeId('constitution').value(16).build(),
        CharacterAttributeFactory.create().attributeId('intelligence').value(10).build(),
        CharacterAttributeFactory.create().attributeId('wisdom').value(12).build(),
        CharacterAttributeFactory.create().attributeId('charisma').value(8).build()
      ])
      .withSkills([
        CharacterSkillFactory.create().skillId('athletics').level(15).active().build(),
        CharacterSkillFactory.create().skillId('intimidation').level(12).active().build(),
        CharacterSkillFactory.create().skillId('weapon-combat').level(18).active().build()
      ])
      .withBackground({
        history: 'Trained as a warrior from a young age',
        personality: 'Brave and straightforward',
        goals: ['Protect the innocent', 'Become a legendary warrior'],
        fears: ['Losing those they protect']
      });
  }

  mage(): this {
    return this
      .name('Test Mage')
      .description('A wise and powerful spellcaster')
      .withAttributes([
        CharacterAttributeFactory.create().attributeId('strength').value(8).build(),
        CharacterAttributeFactory.create().attributeId('dexterity').value(12).build(),
        CharacterAttributeFactory.create().attributeId('constitution').value(10).build(),
        CharacterAttributeFactory.create().attributeId('intelligence').value(18).build(),
        CharacterAttributeFactory.create().attributeId('wisdom').value(16).build(),
        CharacterAttributeFactory.create().attributeId('charisma').value(14).build()
      ])
      .withSkills([
        CharacterSkillFactory.create().skillId('arcana').level(18).active().build(),
        CharacterSkillFactory.create().skillId('investigation').level(15).active().build(),
        CharacterSkillFactory.create().skillId('medicine').level(12).active().build()
      ])
      .withBackground({
        history: 'Studied magic at a prestigious academy',
        personality: 'Curious and methodical',
        goals: ['Master the arcane arts', 'Discover ancient knowledge'],
        fears: ['Magical corruption', 'Losing control of power']
      });
  }

  rogue(): this {
    return this
      .name('Test Rogue')
      .description('A stealthy and cunning character')
      .withAttributes([
        CharacterAttributeFactory.create().attributeId('strength').value(10).build(),
        CharacterAttributeFactory.create().attributeId('dexterity').value(18).build(),
        CharacterAttributeFactory.create().attributeId('constitution').value(12).build(),
        CharacterAttributeFactory.create().attributeId('intelligence').value(14).build(),
        CharacterAttributeFactory.create().attributeId('wisdom').value(16).build(),
        CharacterAttributeFactory.create().attributeId('charisma').value(8).build()
      ])
      .withSkills([
        CharacterSkillFactory.create().skillId('stealth').level(18).active().build(),
        CharacterSkillFactory.create().skillId('lockpicking').level(15).active().build(),
        CharacterSkillFactory.create().skillId('perception').level(16).active().build()
      ])
      .withBackground({
        history: 'Grew up on the streets, learned to survive by wit and agility',
        personality: 'Cautious and opportunistic',
        goals: ['Escape their past', 'Build a new life'],
        fears: ['Being caught', 'Returning to poverty']
      });
  }

  injured(): this {
    return this.withStatus({
      health: 25,
      maxHealth: 100,
      conditions: ['wounded', 'exhausted']
    });
  }

  healthy(): this {
    return this.withStatus({
      health: 100,
      maxHealth: 100,
      conditions: []
    });
  }

  withBasicInventory(): this {
    return this.withInventory({
      items: [
        InventoryItemFactory.create().name('Sword').categoryId('cat-equipment').build(),
        InventoryItemFactory.create().name('Health Potion').categoryId('cat-consumables').quantity(3).build(),
        InventoryItemFactory.create().name('Ancient Key').categoryId('cat-quest').build()
      ]
    });
  }

  withEmptyInventory(): this {
    return this.withInventory({
      items: []
    });
  }

  minimal(): this {
    return this
      .name('Minimal Character')
      .description('A minimal character for testing')
      .withAttributes([])
      .withSkills([])
      .withBackground({
        history: 'A simple background',
        personality: 'Basic personality',
        goals: [],
        fears: [],
        relationships: []
      })
      .withEmptyInventory()
      .healthy();
  }

  build(): Character {
    const defaults: Character = {
      id: generateUniqueId('char'),
      worldId: 'world-test-1',
      name: 'Test Character',
      description: 'A test character for unit testing',
      attributes: [],
      skills: [],
      background: {
        history: 'Test history',
        personality: 'Test personality',
        goals: ['Test goal 1', 'Test goal 2'],
        fears: ['Test fear'],
        relationships: [],
      },
      inventory: {
        characterId: this.character.id || 'char-test-1',
        items: [],
        capacity: 10,
        categories: [
          { id: 'cat-equipment', name: 'Equipment', description: 'Weapons, armor, and gear', sortOrder: 0 },
          { id: 'cat-consumables', name: 'Consumables', description: 'Potions and single-use items', sortOrder: 1 },
          { id: 'cat-quest', name: 'Quest Items', description: 'Important story items', sortOrder: 2 }
        ],
      },
      status: {
        health: 100,
        maxHealth: 100,
        conditions: [],
      },
      createdAt: DEFAULT_TIMESTAMP,
      updatedAt: DEFAULT_TIMESTAMP,
    };

    return { ...defaults, ...this.character };
  }
}

/**
 * Builder pattern factory for CharacterAttribute objects
 */
export class CharacterAttributeFactory {
  private attribute: Partial<CharacterAttribute> = {};

  static create(): CharacterAttributeFactory {
    return new CharacterAttributeFactory();
  }

  attributeId(attributeId: string): this {
    this.attribute.attributeId = attributeId;
    return this;
  }

  value(value: number): this {
    this.attribute.value = value;
    return this;
  }

  build(): CharacterAttribute {
    const defaults: CharacterAttribute = {
      attributeId: 'attr-test-1',
      value: 10,
    };

    return { ...defaults, ...this.attribute };
  }
}

/**
 * Builder pattern factory for CharacterSkill objects
 */
export class CharacterSkillFactory {
  private skill: Partial<CharacterSkill> = {};

  static create(): CharacterSkillFactory {
    return new CharacterSkillFactory();
  }

  skillId(skillId: string): this {
    this.skill.skillId = skillId;
    return this;
  }

  level(level: number): this {
    this.skill.level = level;
    return this;
  }

  experience(experience: number): this {
    this.skill.experience = experience;
    return this;
  }

  isActive(active: boolean): this {
    this.skill.isActive = active;
    return this;
  }

  active(): this {
    return this.isActive(true);
  }

  inactive(): this {
    return this.isActive(false);
  }

  build(): CharacterSkill {
    const defaults: CharacterSkill = {
      skillId: 'skill-test-1',
      level: 1,
      experience: 0,
      isActive: false,
    };

    return { ...defaults, ...this.skill };
  }
}

/**
 * Builder pattern factory for InventoryItem objects
 */
export class InventoryItemFactory {
  private item: Partial<InventoryItem> = {};

  static create(): InventoryItemFactory {
    return new InventoryItemFactory();
  }

  id(id: string): this {
    this.item.id = id;
    return this;
  }

  name(name: string): this {
    this.item.name = name;
    return this;
  }

  description(description: string): this {
    this.item.description = description;
    return this;
  }

  categoryId(categoryId: string): this {
    this.item.categoryId = categoryId;
    return this;
  }

  quantity(quantity: number): this {
    this.item.quantity = quantity;
    return this;
  }

  equipment(): this {
    return this.categoryId('cat-equipment');
  }

  consumable(): this {
    return this.categoryId('cat-consumables');
  }

  questItem(): this {
    return this.categoryId('cat-quest');
  }

  weapon(): this {
    return this
      .equipment()
      .name('Weapon')
      .description('A weapon for combat');
  }

  potion(): this {
    return this
      .consumable()
      .name('Potion')
      .description('A magical potion');
  }

  build(): InventoryItem {
    const defaults: InventoryItem = {
      id: generateUniqueId('item'),
      name: 'Test Item',
      description: 'A test item for unit testing',
      categoryId: 'cat-equipment',
      quantity: 1,
    };

    return { ...defaults, ...this.item };
  }
}

/**
 * Collection factory for creating sets of related character objects
 */
export class CharacterCollectionFactory {
  static createPartyOfAdventurers(worldId: string): Record<string, Character> {
    const characters: Record<string, Character> = {};

    const warrior = CharacterFactory.create()
      .id('char-warrior')
      .worldId(worldId)
      .warrior()
      .withBasicInventory()
      .build();

    const mage = CharacterFactory.create()
      .id('char-mage')
      .worldId(worldId)
      .mage()
      .withBasicInventory()
      .build();

    const rogue = CharacterFactory.create()
      .id('char-rogue')
      .worldId(worldId)
      .rogue()
      .withBasicInventory()
      .build();

    characters[warrior.id] = warrior;
    characters[mage.id] = mage;
    characters[rogue.id] = rogue;

    return characters;
  }

  static createCharacterList(worldId: string, count: number): Record<string, Character> {
    const characters: Record<string, Character> = {};
    const archetypes = ['warrior', 'mage', 'rogue'] as const;

    for (let i = 0; i < count; i++) {
      const archetype = archetypes[i % archetypes.length];
      const character = CharacterFactory.create()
        .id(`char-${i + 1}`)
        .worldId(worldId)
        [archetype]()
        .name(`${archetype.charAt(0).toUpperCase() + archetype.slice(1)} ${i + 1}`)
        .build();
      
      characters[character.id] = character;
    }

    return characters;
  }

  static createAttributeSet(characterId: string, attributeIds: string[]): CharacterAttribute[] {
    return attributeIds.map((attributeId, index) => 
      CharacterAttributeFactory.create()
        .attributeId(attributeId)
        .value(10 + index)
        .build()
    );
  }

  static createSkillSet(characterId: string, skillIds: string[]): CharacterSkill[] {
    return skillIds.map((skillId, index) => 
      CharacterSkillFactory.create()
        .skillId(skillId)
        .level(1 + index)
        .experience(0)
        .isActive(index % 2 === 0) // Alternate active/inactive
        .build()
    );
  }

  static createInventoryItems(count: number): InventoryItem[] {
    const items: InventoryItem[] = [];
    const itemTypes = [
      { factory: () => InventoryItemFactory.create().weapon(), name: 'Weapon' },
      { factory: () => InventoryItemFactory.create().potion(), name: 'Potion' },
      { factory: () => InventoryItemFactory.create().questItem(), name: 'Quest Item' }
    ];

    for (let i = 0; i < count; i++) {
      const itemType = itemTypes[i % itemTypes.length];
      const item = itemType.factory()
        .id(`item-${i + 1}`)
        .name(`${itemType.name} ${i + 1}`)
        .build();
      
      items.push(item);
    }

    return items;
  }
}