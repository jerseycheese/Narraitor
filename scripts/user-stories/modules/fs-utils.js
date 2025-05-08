// File system utilities for user story migration
import fs from 'fs';
import path from 'path';
import { CORE_DIR, UI_DIR, INTEGRATIONS_DIR, DOMAIN_TYPES } from './config.js';

// List available domains from docs/requirements directories
export function listDomains() {
  const domains = getAllDomains();
  
  console.log('\nAvailable domains:');
  domains.forEach(domain => console.log(`- ${domain}`));
  console.log('\nUse --all-domains to process all domains at once');
  process.exit(0);
}

// Get all available domains
export function getAllDomains() {
  let domains = [];
  
  if (fs.existsSync(CORE_DIR)) {
    domains = domains.concat(
      fs.readdirSync(CORE_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''))
    );
  }
  
  if (fs.existsSync(UI_DIR)) {
    domains = domains.concat(
      fs.readdirSync(UI_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''))
    );
  }
  
  if (fs.existsSync(INTEGRATIONS_DIR)) {
    domains = domains.concat(
      fs.readdirSync(INTEGRATIONS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''))
    );
  }
  
  return domains.sort();
}

// Find the domain file location (core, ui, or integrations)
export function findDomainFileLocation(domain) {
  // Check in core directory first
  const corePath = path.join(CORE_DIR, `${domain}.md`);
  if (fs.existsSync(corePath)) {
    return { path: corePath, type: DOMAIN_TYPES.CORE };
  }
  
  // Check in ui directory
  const uiPath = path.join(UI_DIR, `${domain}.md`);
  if (fs.existsSync(uiPath)) {
    return { path: uiPath, type: DOMAIN_TYPES.UI };
  }
  
  // Check in integrations directory
  const integrationsPath = path.join(INTEGRATIONS_DIR, `${domain}.md`);
  if (fs.existsSync(integrationsPath)) {
    return { path: integrationsPath, type: DOMAIN_TYPES.INTEGRATIONS };
  }
  
  return null;
}

// Extract related documentation links
export function buildRelatedDocumentationLink(domain, domainType) {
  return `- [${domain}.md](https://github.com/jerseycheese/narraitor/blob/develop/docs/requirements/${domainType}/${domain}.md) - Source requirements document`;
}

// Find CSV file for a domain
export function findDomainCsvFile(domain) {
  // Try core directory
  const coreCsvPath = path.join(CORE_DIR, `${domain}-user-stories.csv`);
  if (fs.existsSync(coreCsvPath)) {
    return { path: coreCsvPath, type: DOMAIN_TYPES.CORE };
  }
  
  // Try ui directory
  const uiCsvPath = path.join(UI_DIR, `${domain}-user-stories.csv`);
  if (fs.existsSync(uiCsvPath)) {
    return { path: uiCsvPath, type: DOMAIN_TYPES.UI };
  }
  
  // Try integrations directory
  const integrationsCsvPath = path.join(INTEGRATIONS_DIR, `${domain}-user-stories.csv`);
  if (fs.existsSync(integrationsCsvPath)) {
    return { path: integrationsCsvPath, type: DOMAIN_TYPES.INTEGRATIONS };
  }
  
  return null;
}
