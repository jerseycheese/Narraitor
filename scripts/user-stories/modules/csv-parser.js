// csv-parser.js - CSV parsing functionality extracted from parsers.js
import fs from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Parses a CSV file and returns an array of row objects using csv-parse.
 * It maps specific columns from the CSV to a standardized object structure.
 * Handles new columns like Technical Requirements, Implementation Considerations,
 * Related Issues/Stories, and Related Documentation. Priority and Complexity
 * are sourced directly from the CSV.
 *
 * @param {string} csvPath - The path to the CSV file.
 * @returns {Array<Object>} An array of objects, where each object represents a row
 *   from the CSV with mapped keys. Returns an empty array if the file is not found
 *   or parsing fails.
 * @returns {string} returns[].titleSummary - The user story title summary.
 * @returns {string} returns[].userStory - The main user story content.
 * @returns {string} returns[].priority - The priority from the CSV.
 * @returns {string} returns[].complexity - The estimated complexity from the CSV.
 * @returns {string} returns[].acceptanceCriteriaRaw - The raw acceptance criteria string from the CSV.
 * @returns {string} returns[].gitHubIssueLink - The GitHub issue link from the CSV.
 * @returns {string} returns[].relatedIssues - The related issues/stories from the CSV.
 * @returns {string} returns[].technicalRequirements - The technical requirements from the CSV.
 * @returns {string} returns[].implementationConsiderations - The implementation considerations from the CSV.
 * @returns {string} returns[].relatedDocumentation - The related documentation paths from the CSV.
 */
export function parseCsvRows(csvPath) {
  try {
    console.log(`Reading CSV file: ${csvPath}`);
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found: ${csvPath}`);
      return [];
    }
    const content = fs.readFileSync(csvPath, 'utf8');

    // Use csv-parse/sync for robust parsing
    const records = parse(content, {
      columns: true,          // Treat the first line as column headers
      skip_empty_lines: true, // Skip lines that are empty
      trim: true,             // Trim whitespace from values
      relax_column_count: true // Allow varying numbers of columns per row
    });

    // Log header structure to diagnose comma issues
    if (records.length > 0) {
      console.log('CSV Headers detected:', Object.keys(records[0]));
    }

    // Basic validation/mapping to expected keys for consistency downstream
    return records.map(row => {
        // Get the complete row keys to handle headers with commas
        const rowKeys = Object.keys(row);

        // Find the keys by prefix matching to handle comma-containing headers
        const getTitleSummary = () => {
            const key = rowKeys.find(k => k.startsWith('User Story Title Summary'));
            return key ? row[key] : '';
        };
        
        const getPlainLanguageSummary = () => {
            const key = rowKeys.find(k => k.startsWith('Plain Language Summary'));
            return key ? row[key] : '';
        };
        
        const getUserStory = () => {
            // First try to find exact "User Story" column (not title summary)
            let key = rowKeys.find(k => k === 'User Story');
            if (!key) {
                // If not found, find "User Story" that isn't the title summary
                key = rowKeys.find(k => k.startsWith('User Story') && !k.includes('Title'));
            }
            return key ? row[key] : '';
        };
        
        const getPriority = () => {
            const key = rowKeys.find(k => k.startsWith('Priority'));
            return key ? row[key] : '';
        };
        
        const getComplexity = () => {
            const key = rowKeys.find(k => k.startsWith('Estimated Complexity'));
            return key ? row[key] : '';
        };
        
        const getAcceptanceCriteria = () => {
            const key = rowKeys.find(k => k.startsWith('Acceptance Criteria'));
            return key ? row[key] : '';
        };
        
        const getGitHubIssueLink = () => {
            const key = rowKeys.find(k => k.startsWith('GitHub Issue Link'));
            return key ? row[key] : '';
        };
        
        const getTechnicalRequirements = () => {
            const key = rowKeys.find(k => k.startsWith('Technical Requirements'));
            return key ? row[key] : '';
        };
        
        const getImplementationConsiderations = () => {
            const key = rowKeys.find(k => k.startsWith('Implementation Considerations'));
            return key ? row[key] : '';
        };
        
        const getRelatedDocumentation = () => {
            const key = rowKeys.find(k => k.startsWith('Related Documentation'));
            return key ? row[key] : '';
        };
        
        const getRelatedIssues = () => {
            const key = rowKeys.find(k => k.startsWith('Related Issues/Stories'));
            return key ? row[key] : '';
        };
        
        const gitHubLinkFromCsv = getGitHubIssueLink();

        return {
            titleSummary: getTitleSummary(),
            userStory: getUserStory(),
            priority: getPriority(),
            complexity: getComplexity(),
            acceptanceCriteriaRaw: getAcceptanceCriteria(),
            gitHubIssueLink: gitHubLinkFromCsv,
            relatedIssues: getRelatedIssues(),
            technicalRequirements: getTechnicalRequirements(),
            implementationConsiderations: getImplementationConsiderations(),
            relatedDocumentation: getRelatedDocumentation(),
            plainLanguageSummary: getPlainLanguageSummary(),
        };
    }).map(row => {
        // Post-process specific fields to ensure literal '\n' is preserved for markdown formatting
        if (row.technicalRequirements) {
            row.technicalRequirements = row.technicalRequirements.replace(/\\n/g, '\\\\n');
        }
        if (row.implementationConsiderations) {
            row.implementationConsiderations = row.implementationConsiderations.replace(/\\n/g, '\\\\n');
        }
        return row;
    });

  } catch (error) {
    console.error(`Error parsing CSV file ${csvPath}: ${error.message}`);
    return [];
  }
}
