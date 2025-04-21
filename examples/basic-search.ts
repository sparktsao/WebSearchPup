import { SearchResultScraper, ScraperConfig, OutputFormat } from '../src';

/**
 * Example of how to use the SearchResultScraper
 */
async function runBasicSearch() {
  // Configure the scraper
  const config: ScraperConfig = {
    searchQuery: 'puppeteer tutorial',
    headless: false, // Set to true for headless mode
    slowMo: 50, // Slow down operations by 50ms for visibility
    outputDir: './search-results-example',
    extractOptions: {
      organicResults: true,
      featuredSnippets: true,
      peopleAlsoAsk: true,
      relatedSearches: true,
      videos: true,
      images: true
    }
  };
  
  console.log(`Starting search for "${config.searchQuery}"...`);
  
  const scraper = new SearchResultScraper(config);
  
  try {
    // Run the scraper
    const results = await scraper.run();
    
    console.log('\nSearch Results Summary:');
    console.log(`- Organic Results: ${results.organicResults?.length || 0}`);
    console.log(`- Featured Snippets: ${results.featuredSnippets?.length || 0}`);
    console.log(`- People Also Ask: ${results.peopleAlsoAsk?.length || 0}`);
    console.log(`- Related Searches: ${results.relatedSearches?.length || 0}`);
    console.log(`- Video Results: ${results.videos?.length || 0}`);
    
    // Display the first organic result
    if (results.organicResults && results.organicResults.length > 0) {
      const firstResult = results.organicResults[0];
      console.log('\nFirst Organic Result:');
      console.log(`- Title: ${firstResult.title}`);
      console.log(`- URL: ${firstResult.url}`);
      console.log(`- Snippet: ${firstResult.snippet}`);
      
      // Perform a follow-up search on the first result
      console.log('\nPerforming follow-up search on the first result...');
      const followUpResults = await scraper.performFollowUpSearch(0);
      
      if (followUpResults) {
        console.log('Follow-up search completed successfully!');
        console.log(`- Title: ${followUpResults.title}`);
        console.log(`- Content Preview: ${followUpResults.content?.substring(0, 100)}...`);
      } else {
        console.log('Follow-up search failed or returned no results.');
      }
    }
    
    console.log(`\nResults saved to ${config.outputDir}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the example
runBasicSearch().catch(console.error);
