// Domain processor for user story migration
import { findDomainFileLocation, findDomainCsvFile } from './fs-utils.js';
import { parseUserStoriesFromCSV, parseUserStoriesFromMarkdown } from './parsers.js';
import { filterExistingStories, createIssuesForUserStories } from './github.js';

// Process a single domain
/**
 * Processes user stories for a single domain, parsing them from a CSV or Markdown file,
 * filtering out existing stories, and optionally creating GitHub issues.
 *
 * @param {string} domain - The name of the domain to process.
 * @param {number} [skip=0] - The number of user stories to skip from the beginning.
 * @param {number} [limit] - The maximum number of user stories to process after skipping.
 * @param {boolean} [dryRun=false] - If true, no GitHub issues will be created.
 * @returns {Promise<{created: number, errors: number, skipped: number}>} An object containing the counts of created issues, errors, and skipped stories.
 */
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

/**
 * Converts an array of user story objects into an array of GitHub issue objects,
 * formatting the content according to a predefined template.
 * This function is responsible for taking the parsed data, including the raw
 * strings for list-based fields from CSV (handled by parsers.js), and formatting
 * them into the Markdown body for a GitHub issue.
 * It handles the conversion of arrays/strings into Markdown list format and
 * incorporates specific handling like newline splitting for multi-line fields
 * and comma-separation for related documentation paths.
 *
 * @param {Array<Object>} userStories - An array of user story objects, typically parsed from CSV or Markdown.
 * @param {string} userStories[].title - The title summary for the user story (from CSV).
 * @param {string} userStories[].content - The main content of the user story.
 * @param {string} userStories[].domain - The domain the user story belongs to.
 * @param {string} userStories[].priority - The priority level of the user story (e.g., 'High', 'Medium', 'Low', 'Post-MVP').
 * @param {string} userStories[].complexity - The estimated complexity of the user story (e.g., 'Small', 'Medium', 'Large').
 * @param {string} userStories[].acceptanceCriteriaRaw - The raw acceptance criteria string from the CSV.
 * @param {string} userStories[].technicalRequirements - The raw technical requirements string from the CSV.
 * @param {string} userStories[].implementationConsiderations - The raw implementation considerations string from the CSV.
 * @param {string} userStories[].relatedIssues - The raw related issues/stories string from the CSV.
 * @param {string} userStories[].relatedDocumentation - The raw related documentation string from the CSV (comma-separated paths).
 * @returns {Array<Object>} An array of objects formatted for GitHub issue creation.
 * @returns {string} returns[].title - The title of the GitHub issue.
 * @returns {string} returns[].body - The body content of the GitHub issue in Markdown format.
 * @returns {Array<string>} returns[].labels - An array of labels for the GitHub issue.
 */
