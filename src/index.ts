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
 * Main function to run the scraper
 */
async function main() {
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
