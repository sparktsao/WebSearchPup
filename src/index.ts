#!/usr/bin/env node

import { ScraperConfig, OutputFormat } from './config/types';
import { DEFAULT_CONFIG, DEFAULT_SEARCH_QUERY, DEFAULT_OUTPUT_FORMATS } from './config/default-config';
import { SearchResultScraper } from './scraper/search-result-scraper';

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(): { searchQuery: string; outputDir?: string } {
  // Get command line arguments (skip first two: node and script name)
  const args = process.argv.slice(2);
  
  // Initialize variables
  let searchQuery = DEFAULT_SEARCH_QUERY;
  let outputDir: string | undefined;
  
  // Check if arguments were provided
  if (args.length > 0) {
    searchQuery = args[0];
    
    // Check if output directory was provided as second argument
    if (args.length > 1) {
      outputDir = args[1];
    }
  }
  
  return { searchQuery, outputDir };
}

/**
 * Display usage information
 */
function displayUsage(): void {
  console.log('\nSearch Result Extractor');
  console.log('=====================\n');
  console.log('Usage: npx ts-node src/index.ts [search query] [output directory]');
  console.log('\nExamples:');
  console.log(`  npx ts-node src/index.ts "puppeteer tutorial"`);
  console.log('  npx ts-node src/index.ts "javascript automation" "./my-results"');
  console.log(`\nIf no query is provided, the default "${DEFAULT_SEARCH_QUERY}" will be used.`);
  console.log('If no output directory is provided, a directory will be created based on the search query.\n');
}

/**
 * Format milliseconds to a readable string
 * @param ms Milliseconds
 * @returns Formatted string (e.g., "1.23s" or "123ms")
 */
function formatTime(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(2)}ms`;
}

/**
 * Create a table row for the timing summary
 * @param label Row label
 * @param time Time in milliseconds
 * @param total Total time for percentage calculation
 * @returns Formatted table row
 */
function createTableRow(label: string, time: number, total: number): string {
  const percentage = ((time / total) * 100).toFixed(1);
  return `| ${label.padEnd(30)} | ${formatTime(time).padStart(10)} | ${percentage.padStart(6)}% |`;
}

/**
 * Display timing summary as a table
 * @param timingData Timing data object
 * @param totalTime Total execution time
 */
function displayTimingSummary(timingData: any, totalTime: number): void {
  console.log('\n=== TIMING SUMMARY ===\n');
  
  // Table header
  console.log('| Step                           |       Time |     % |');
  console.log('|--------------------------------|------------|-------|');
  
  // Main steps
  if (timingData.steps) {
    for (const [key, value] of Object.entries(timingData.steps)) {
      // Convert camelCase to Title Case with spaces
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(createTableRow(label, value as number, totalTime));
    }
  }
  
  // Separator for extraction steps
  console.log('|--------------------------------|------------|-------|');
  console.log('| Extraction Steps:              |            |       |');
  console.log('|--------------------------------|------------|-------|');
  
  // Extraction steps
  if (timingData.extractionSteps) {
    for (const [key, value] of Object.entries(timingData.extractionSteps)) {
      // Convert camelCase to Title Case with spaces
      const label = `  ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`;
      console.log(createTableRow(label, value as number, totalTime));
    }
  }
  
  // Separator for save formats
  if (timingData.saveFormats && Object.keys(timingData.saveFormats).length > 0) {
    console.log('|--------------------------------|------------|-------|');
    console.log('| Save Formats:                 |            |       |');
    console.log('|--------------------------------|------------|-------|');
    
    // Save formats
    for (const [key, value] of Object.entries(timingData.saveFormats)) {
      const label = `  ${key.toUpperCase()}`;
      console.log(createTableRow(label, value as number, totalTime));
    }
  }
  
  // Total row
  console.log('|--------------------------------|------------|-------|');
  console.log(createTableRow('TOTAL', totalTime, totalTime));
  console.log('');
}

/**
 * Main function to run the scraper
 */
async function main() {
  // Start timing
  const startTime = performance.now();
  console.log(`[TIMER] Start: ${new Date().toISOString()}`);
  
  // Display usage information
  displayUsage();
  
  // Parse command line arguments
  const { searchQuery, outputDir } = parseCommandLineArgs();
  
  console.log(`Search query: "${searchQuery}"\n`);
  if (outputDir) {
    console.log(`Output directory: "${outputDir}"\n`);
  }

  console.log("Current working directory:", process.cwd());
  
  // Configure the scraper
  const config: ScraperConfig = {
    ...DEFAULT_CONFIG,
    searchQuery,
    outputDir: outputDir || `./search-results-${searchQuery.replace(/\s+/g, '-').toLowerCase()}`
  } as ScraperConfig;
  
  const scraper = new SearchResultScraper(config);
  
  try {
    // Run the scraper
    const results = await scraper.run();
    
    console.log('Search result extraction completed successfully!');
    console.log(`Found ${results.organicResults?.length || 0} organic results`);
    console.log(`Found ${results.featuredSnippets?.length || 0} featured snippets`);
    console.log(`Found ${results.peopleAlsoAsk?.length || 0} "People Also Ask" questions`);
    console.log(`Found ${results.relatedSearches?.length || 0} related searches`);
    console.log(`Found ${results.videos?.length || 0} video results`);
    
    // Example of how to perform a follow-up search
    if (results.organicResults && results.organicResults.length > 0) {
      console.log('\nTo perform a follow-up search on the first result, run:');
      console.log('  const followUpResults = await scraper.performFollowUpSearch(0);');
    }
    
    // End timing
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`[TIMER] End: ${new Date().toISOString()}`);
    console.log(`[TIMER] Total time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
    
    // Display timing summary table
    if (results.timingData) {
      displayTimingSummary(results.timingData, totalTime);
    }
  } catch (error) {
    console.error('An error occurred during scraping:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for use as a module
export { SearchResultScraper } from './scraper/search-result-scraper';
export { Crawler } from './scraper/crawler';
export { ScraperConfig, OutputFormat } from './config/types';
export { DEFAULT_CONFIG, DEFAULT_OUTPUT_FORMATS } from './config/default-config';
