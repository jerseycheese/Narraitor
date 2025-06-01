import { WorldContext, CharacterContext, AttributeDefinition, SkillDefinition, CharacterAttribute, CharacterSkill, InventoryItem } from './types';

/**
 * Builds formatted context strings from world and character data for use in AI prompts.
 * Formats data into structured markdown sections that are easily readable by AI systems.
 */
export class ContextBuilder {
  /**
   * Builds world context including genre, attributes, and skills
   * @param world - World configuration data
   * @returns Formatted world context string in markdown format
   */
  buildWorldContext(world: WorldContext): string {
    const sections: string[] = [];
    
    const hasInfo = world.name || world.genre || world.description;
    if (hasInfo) {
      const info = this.buildWorldInfo(world);
      if (info) sections.push(info);
    }
    
    if (world.attributes && world.attributes.length > 0) {
      sections.push(this.buildAttributes(world.attributes));
    }
    
    if (world.skills && world.skills.length > 0) {
      sections.push(this.buildSkills(world.skills));
    }
    
    // Return empty string if no sections, but ensure it's truthy for test
    return sections.length > 0 ? sections.join('\n\n') : '';
  }
  
  /**
   * Builds character context including name, level, attributes, skills, and inventory
   * @param character - Character data
   * @returns Formatted character context string in markdown format
   */
  buildCharacterContext(character: CharacterContext): string {
    const sections: string[] = [];
    
    if (character.name || character.level || character.description) {
      sections.push(this.buildCharacterInfo(character));
    }
    
    if (character.attributes && character.attributes.length > 0) {
      sections.push(this.buildCharacterAttributes(character.attributes));
    }
    
    if (character.skills && character.skills.length > 0) {
      sections.push(this.buildCharacterSkills(character.skills));
    }
    
    if (character.inventory && character.inventory.length > 0) {
      sections.push(this.buildInventory(character.inventory));
    }
    
    return sections.join('\n\n');
  }
  
  /**
   * Builds combined context with both world and character sections
   * @param world - World configuration data
   * @param character - Character data
   * @returns Combined context string with world and character sections
   */
  buildCombinedContext(world: WorldContext, character: CharacterContext): string {
    const sections: string[] = [];
    
    sections.push('=== WORLD CONTEXT ===');
    sections.push(this.buildWorldContext(world));
    
    sections.push('');
    
    sections.push('=== CHARACTER CONTEXT ===');
    sections.push(this.buildCharacterContext(character));
    
    return sections.join('\n');
  }
  
  /**
   * Builds world information section with name, genre, and description
   * @param world - World configuration data
   * @returns Formatted world info section
   * @private
   */
  private buildWorldInfo(world: WorldContext): string {
    const info: string[] = [];
    
    if (world.name) {
      info.push(`# World: ${world.name}`);
    }
    
    if (world.genre) {
      info.push(`Genre: ${world.genre}`);
    }
    
    if (world.description) {
      info.push(world.description);
    }
    
    return info.join('\n');
  }
  
  /**
   * Builds attributes section for world configuration
   * @param attributes - Array of attribute definitions
   * @returns Formatted attributes list
   * @private
   */
  private buildAttributes(attributes: AttributeDefinition[]): string {
    const lines: string[] = ['## Attributes:'];
    
    for (const attr of attributes) {
      lines.push(`- ${attr.name}${attr.description ? ': ' + attr.description : ''}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Builds skills section for world configuration
   * @param skills - Array of skill definitions
   * @returns Formatted skills list
   * @private
   */
  private buildSkills(skills: SkillDefinition[]): string {
    const lines: string[] = ['## Skills:'];
    
    for (const skill of skills) {
      lines.push(`- ${skill.name}${skill.description ? ': ' + skill.description : ''}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Builds character information section with name, level, and description
   * @param character - Character data
   * @returns Formatted character info section
   * @private
   */
  private buildCharacterInfo(character: CharacterContext): string {
    const info: string[] = [];
    
    if (character.name) {
      info.push(`# Character: ${character.name}`);
    }
    
    if (character.level !== undefined) {
      info.push(`Level: ${character.level}`);
    }
    
    if (character.description) {
      info.push(character.description);
    }
    
    return info.join('\n');
  }
  
  /**
   * Builds character attributes section with current values
   * @param attributes - Array of character attributes
   * @returns Formatted character attributes list
   * @private
   */
  private buildCharacterAttributes(attributes: CharacterAttribute[]): string {
    const lines: string[] = ['## Attributes:'];
    
    for (const attr of attributes) {
      lines.push(`- ${attr.name}: ${attr.value}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Builds character skills section with current values
   * @param skills - Array of character skills
   * @returns Formatted character skills list
   * @private
   */
  private buildCharacterSkills(skills: CharacterSkill[]): string {
    const lines: string[] = ['## Skills:'];
    
    for (const skill of skills) {
      lines.push(`- ${skill.name}: ${skill.value}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Builds inventory section with equipped status and quantities
   * @param inventory - Array of inventory items
   * @returns Formatted inventory list
   * @private
   */
  private buildInventory(inventory: InventoryItem[]): string {
    const lines: string[] = ['## Key Items:'];
    
    for (const item of inventory) {
      let itemText = `- ${item.name}`;
      
      if (item.equipped) {
        itemText += ' (equipped)';
      } else if (item.quantity && item.quantity > 1) {
        itemText += ` x${item.quantity}`;
      }
      
      lines.push(itemText);
    }
    
    return lines.join('\n');
  }
}
