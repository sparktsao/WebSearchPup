import * as puppeteer from 'puppeteer';
import { BrowserManager } from './browser-manager';
import { ScraperConfig, SearchResults, OutputFormat } from '../config/types';
import { SEARCH_ENGINE_URL, SEARCH_INPUT_SELECTORS, SELECTORS, TIMEOUTS } from '../config/default-config';
import { OrganicResultsExtractor } from '../extractors/organic-results-extractor';
import { FeaturedSnippetsExtractor } from '../extractors/featured-snippets-extractor';
import { PeopleAlsoAskExtractor } from '../extractors/people-also-ask-extractor';
import { RelatedSearchesExtractor } from '../extractors/related-searches-extractor';
import { VideoResultsExtractor } from '../extractors/video-results-extractor';
import { ImageResultsExtractor } from '../extractors/image-results-extractor';
import { ResultSaver } from '../output/result-saver';

/**
 * Utility function to sleep for a specified number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main scraper class for extracting search results
 */
export class SearchResultScraper {
  private config: ScraperConfig;
  private browserManager: BrowserManager;
  private resultSaver: ResultSaver;

  /**
   * Create a new SearchResultScraper
   * 
   * @param config Configuration options
   */
  constructor(config: ScraperConfig) {
    this.config = {
      ...config,
      outputDir: config.outputDir || './output'
    };
    
    this.browserManager = new BrowserManager(config.headless, config.slowMo);
    this.resultSaver = new ResultSaver();
  }

  /**
   * Run the scraper to extract search results
   */
  async run(): Promise<SearchResults> {
    try {
      // Initialize browser
      await this.browserManager.initialize();
      
      // Perform search
      await this.performSearch();
      
      // Extract results
      const results = await this.extractSearchResults();
      
      // Save results
      await this.saveResults(results);
      
      return results;
    } finally {
      // Clean up
      await this.browserManager.close();
    }
  }

  /**
   * Navigate to search engine and perform search
   */
  private async performSearch(): Promise<void> {
    const page = this.browserManager.getPage();
    
    console.log(`Navigating to search engine and searching for "${this.config.searchQuery}"...`);
    
    // Navigate to search engine
    await page.goto(SEARCH_ENGINE_URL, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUTS.navigation
    });
    
    // Wait for page to stabilize
    await sleep(1000);
    
    // Find and use the search input
    const searchInput = await this.findSearchInput();
    if (!searchInput) {
      throw new Error('Could not find search input');
    }
    
    // Type search query and submit
    await searchInput.type(this.config.searchQuery);
    await page.keyboard.press('Enter');
    
    // Wait for search results to load
    console.log('Waiting for search results to load...');
    await page.waitForSelector(SELECTORS.searchResults, { timeout: TIMEOUTS.searchResults })
      .catch(() => console.log('Warning: Search results selector not found, but continuing...'));
    
    // Additional wait to ensure all dynamic content loads
    await sleep(TIMEOUTS.stabilization);
  }

  /**
   * Find the search input element using multiple possible selectors
   */
  private async findSearchInput(): Promise<puppeteer.ElementHandle | null> {
    const page = this.browserManager.getPage();
    
    console.log('Looking for search input...');
    
    for (const selector of SEARCH_INPUT_SELECTORS) {
      const element = await page.$(selector).catch(() => null);
      if (element) {
        console.log(`Found search input with selector: ${selector}`);
        return element;
      }
    }
    
    return null;
  }

  /**
   * Extract all search results data
   */
  private async extractSearchResults(): Promise<SearchResults> {
    console.log('Extracting search results...');
    
    const page = this.browserManager.getPage();
    const results: SearchResults = {
      query: this.config.searchQuery,
      timestamp: new Date().toISOString()
    };
    
    // Extract organic search results
    if (this.config.extractOptions.organicResults) {
      const organicExtractor = new OrganicResultsExtractor(page);
      results.organicResults = await organicExtractor.extract();
    }
    
    // Extract featured snippets
    if (this.config.extractOptions.featuredSnippets) {
      const snippetsExtractor = new FeaturedSnippetsExtractor(page);
      results.featuredSnippets = await snippetsExtractor.extract();
    }
    
    // Extract "People Also Ask" questions
    if (this.config.extractOptions.peopleAlsoAsk) {
      const peopleAlsoAskExtractor = new PeopleAlsoAskExtractor(page);
      results.peopleAlsoAsk = await peopleAlsoAskExtractor.extract();
    }
    
    // Extract related searches
    if (this.config.extractOptions.relatedSearches) {
      const relatedSearchesExtractor = new RelatedSearchesExtractor(page);
      results.relatedSearches = await relatedSearchesExtractor.extract();
    }
    
    // Extract video results
    if (this.config.extractOptions.videos) {
      const videoExtractor = new VideoResultsExtractor(page);
      results.videos = await videoExtractor.extract();
    }
    
    // Extract image results
    if (this.config.extractOptions.images) {
      const imageExtractor = new ImageResultsExtractor(page);
      results.images = await imageExtractor.extract();
    }
    
    // Extract all page text for comprehensive analysis
    let pageText = await this.extractAllPageText();
    results.pageText = pageText.length > 100 ? pageText.slice(0, 100) + '…' : pageText;
    //results.pageText = await this.extractAllPageText();
    
    return results;
  }

  /**
   * Extract all text from the page for comprehensive analysis
   */
  private async extractAllPageText(): Promise<string> {
    const page = this.browserManager.getPage();
    
    return page.evaluate(() => {
      // Get the main content area
      const mainContent = document.querySelector('#b_content');
      return mainContent ? mainContent.textContent?.trim() || '' : '';
    });
  }

  /**
   * Perform a follow-up search on a specific result
   * 
   * @param resultIndex Index of the result to perform a follow-up search on
   * @param depth Maximum depth of follow-up searches
   */
  async performFollowUpSearch(resultIndex: number, depth: number = 1): Promise<any> {
    if (!this.browserManager.isInitialized()) {
      await this.browserManager.initialize();
    }
    
    const page = this.browserManager.getPage();
    
    // Extract organic results if not already done
    if (!this.config.extractOptions.organicResults) {
      const organicExtractor = new OrganicResultsExtractor(page);
      const organicResults = await organicExtractor.extract();
      
      if (resultIndex >= organicResults.length) {
        console.warn(`Result index ${resultIndex} out of range`);
        return null;
      }
      
      return organicExtractor.performFollowUpSearch(organicResults[resultIndex], depth);
    } else {
      // Re-extract results to get the latest state
      const organicExtractor = new OrganicResultsExtractor(page);
      const organicResults = await organicExtractor.extract();
      
      if (resultIndex >= organicResults.length) {
        console.warn(`Result index ${resultIndex} out of range`);
        return null;
      }
      
      return organicExtractor.performFollowUpSearch(organicResults[resultIndex], depth);
    }
  }

  /**
   * Save results to files
   * 
   * @param results Search results to save
   * @param formats Output formats to save
   */
  private async saveResults(
    results: SearchResults,
    formats: OutputFormat[] = [OutputFormat.JSON, OutputFormat.TEXT]
  ): Promise<void> {
    const page = this.browserManager.getPage();
    
    await this.resultSaver.saveResults(
      results,
      this.config.outputDir,
      formats,
      page
    );
  }
}
