// Domain processor for user story migration
import { findDomainFileLocation, findDomainCsvFile } from './fs-utils.js';
import { parseUserStoriesFromCSV, parseUserStoriesFromMarkdown } from './parsers.js';
import { filterExistingStories, createIssuesForUserStories } from './github.js';

// Process a single domain
export async function processDomain(domain, skip, limit, dryRun) {
  // First, check if a CSV file exists for this domain
  const csvFile = findDomainCsvFile(domain);
  let userStories = [];
  
  if (csvFile) {
    userStories = parseUserStoriesFromCSV(csvFile, domain);
  } else {
    // If no CSV file exists, check for a markdown file
    const domainLocation = findDomainFileLocation(domain);
    if (!domainLocation) {
      console.error(`Domain file not found for: ${domain}`);
      return { created: 0, errors: 0, skipped: 0 };
    }
    
    console.log(`\nProcessing domain: ${domain}`);
    console.log('Parsing user stories from markdown file...');
    userStories = parseUserStoriesFromMarkdown(domainLocation.path, domainLocation.type);
  }
  
  // Filter out existing stories
  userStories = await filterExistingStories(userStories, domain);
  
  if (skip) {
    console.log(`Skipping first ${skip} user stories.`);
    userStories = userStories.slice(skip);
  }
  if (limit) {
    console.log(`Limiting to first ${limit} user stories.`);
    userStories = userStories.slice(0, limit);
  }
  console.log(`Found ${userStories.length} new user stories to process.`);
  if (userStories.length > 0) {
    console.log('\nExample of the first user story to be created:');
    console.log(`Title: ${userStories[0].title}`);
    console.log(`Labels: ${userStories[0].labels.join(', ')}`);
    console.log(`Body:\n${userStories[0].body.substring(0, 500)}...`);
  }
  if (dryRun) {
    console.log(`\nDRY RUN COMPLETED for domain: ${domain} - No issues were created`);
    return { created: 0, errors: 0, skipped: userStories.length };
  }
  
  return await createIssuesForUserStories(userStories);
}

// Process all domains
export async function processAllDomains(domains, skip, limit, dryRun) {
  console.log('Processing all domains...');
  
  let totalCreated = 0, totalErrors = 0, totalSkipped = 0;
  
  for (const domain of domains) {
    const result = await processDomain(domain, skip, limit, dryRun);
    totalCreated += result.created;
    totalErrors += result.errors;
    totalSkipped += result.skipped;
    
    // Break if limit is reached
    if (limit && totalCreated >= limit) {
      console.log(`Reached limit of ${limit} created issues. Stopping processing.`);
      break;
    }
  }
  
  return { created: totalCreated, errors: totalErrors, skipped: totalSkipped };
}
