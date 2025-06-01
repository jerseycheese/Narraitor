# Post-MVP Systems

## Overview
This document tracks systems that have been implemented but deprioritized to post-MVP to focus on the core narrative experience.

## Deprioritized Systems

### Inventory System
**Status**: Implementation complete, UI deferred  
**Priority**: Post-MVP  
**Reason**: To focus on core narrative experience  
**Date**: May 2025  

**Description**: Full inventory management system with item tracking, categories, equipment, and AI-driven categorization. The system is fully functional and tested but UI components will not be exposed until post-MVP.

**GitHub Issues**: #164, #168, #169, #238, #239, #241, #242, #243, #244, #246, #247

### Journal System  
**Status**: Implementation complete, UI deferred  
**Priority**: Post-MVP  
**Reason**: To focus on core narrative experience  
**Date**: May 2025  

**Description**: Comprehensive journal system for recording narrative events, player decisions, and game history. The system is fully functional and tested but UI components will not be exposed until post-MVP.

**GitHub Issues**: #169, #208, #270, #277

## Integration Notes
- Both systems remain integrated with state management
- The narrative engine can still reference inventory and journal data for context
- All stores remain functional and tested
- No UI components will be rendered in MVP

## Re-activation Plan
To re-activate these systems post-MVP:
1. Remove POST-MVP headers from store files
2. Enable UI components in game session
3. Update navigation to include system access
4. Update documentation to reflect active status
5. Close related GitHub issues
