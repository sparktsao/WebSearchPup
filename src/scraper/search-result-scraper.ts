import * as puppeteer from 'puppeteer';
import { BrowserManager } from './browser-manager';
import { ScraperConfig, SearchResults, OutputFormat, TimingData } from '../config/types';
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
  async run(): Promise<SearchResults & { timingData?: TimingData }> {
    const timingData: TimingData = {
      steps: {},
      extractionSteps: {}
    };
    
    try {
      // Initialize browser
      console.log('[TIMER] Starting browser initialization');
      const browserStartTime = performance.now();
      await this.browserManager.initialize();
      const browserEndTime = performance.now();
      const browserTime = browserEndTime - browserStartTime;
      timingData.steps.browserInitialization = browserTime;
      console.log(`[TIMER] Browser initialization: ${browserTime.toFixed(2)}ms`);
      
      // Perform search
      console.log('[TIMER] Starting search');
      const searchStartTime = performance.now();
      await this.performSearch();
      const searchEndTime = performance.now();
      const searchTime = searchEndTime - searchStartTime;
      timingData.steps.searchExecution = searchTime;
      console.log(`[TIMER] Search execution: ${searchTime.toFixed(2)}ms`);
      
      // Extract results
      console.log('[TIMER] Starting extraction');
      const extractionStartTime = performance.now();
      const results = await this.extractSearchResults(timingData);
      const extractionEndTime = performance.now();
      const extractionTime = extractionEndTime - extractionStartTime;
      timingData.steps.totalExtraction = extractionTime;
      console.log(`[TIMER] Total extraction: ${extractionTime.toFixed(2)}ms`);
      
      // Save results
      console.log('[TIMER] Starting save');
      const saveStartTime = performance.now();
      const saveFormats = await this.saveResults(results);
      const saveEndTime = performance.now();
      const saveTime = saveEndTime - saveStartTime;
      timingData.steps.saveResults = saveTime;
      
      // Add format-specific save times
      if (saveFormats) {
        timingData.saveFormats = saveFormats;
      }
      
      console.log(`[TIMER] Save results: ${saveTime.toFixed(2)}ms`);
      
      // Add timing data to results
      return { ...results, timingData };
    } finally {
      // Clean up
      console.log('[TIMER] Starting browser cleanup');
      const cleanupStartTime = performance.now();
      await this.browserManager.close();
      const cleanupEndTime = performance.now();
      const cleanupTime = cleanupEndTime - cleanupStartTime;
      timingData.steps.browserCleanup = cleanupTime;
      console.log(`[TIMER] Browser cleanup: ${cleanupTime.toFixed(2)}ms`);
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
  private async extractSearchResults(timingData: TimingData): Promise<SearchResults> {
    console.log('Extracting search results...');
    
    const page = this.browserManager.getPage();
    const results: SearchResults = {
      query: this.config.searchQuery,
      timestamp: new Date().toISOString()
    };
    
    // Extract organic search results
    if (this.config.extractOptions.organicResults) {
      console.log('[TIMER] Starting organic results extraction');
      const organicStartTime = performance.now();
      const organicExtractor = new OrganicResultsExtractor(page);
      results.organicResults = await organicExtractor.extract();
      const organicEndTime = performance.now();
      const organicTime = organicEndTime - organicStartTime;
      timingData.extractionSteps.organicResults = organicTime;
      console.log(`[TIMER] Organic results extraction: ${organicTime.toFixed(2)}ms`);
    }
    
    // Extract featured snippets
    if (this.config.extractOptions.featuredSnippets) {
      console.log('[TIMER] Starting featured snippets extraction');
      const snippetsStartTime = performance.now();
      const snippetsExtractor = new FeaturedSnippetsExtractor(page);
      results.featuredSnippets = await snippetsExtractor.extract();
      const snippetsEndTime = performance.now();
      const snippetsTime = snippetsEndTime - snippetsStartTime;
      timingData.extractionSteps.featuredSnippets = snippetsTime;
      console.log(`[TIMER] Featured snippets extraction: ${snippetsTime.toFixed(2)}ms`);
    }
    
    // Extract "People Also Ask" questions
    if (this.config.extractOptions.peopleAlsoAsk) {
      console.log('[TIMER] Starting people also ask extraction');
      const paaStartTime = performance.now();
      const peopleAlsoAskExtractor = new PeopleAlsoAskExtractor(page);
      results.peopleAlsoAsk = await peopleAlsoAskExtractor.extract();
      const paaEndTime = performance.now();
      const paaTime = paaEndTime - paaStartTime;
      timingData.extractionSteps.peopleAlsoAsk = paaTime;
      console.log(`[TIMER] People also ask extraction: ${paaTime.toFixed(2)}ms`);
    }
    
    // Extract related searches
    if (this.config.extractOptions.relatedSearches) {
      console.log('[TIMER] Starting related searches extraction');
      const relatedStartTime = performance.now();
      const relatedSearchesExtractor = new RelatedSearchesExtractor(page);
      results.relatedSearches = await relatedSearchesExtractor.extract();
      const relatedEndTime = performance.now();
      const relatedTime = relatedEndTime - relatedStartTime;
      timingData.extractionSteps.relatedSearches = relatedTime;
      console.log(`[TIMER] Related searches extraction: ${relatedTime.toFixed(2)}ms`);
    }
    
    // Extract video results
    if (this.config.extractOptions.videos) {
      console.log('[TIMER] Starting video results extraction');
      const videoStartTime = performance.now();
      const videoExtractor = new VideoResultsExtractor(page);
      results.videos = await videoExtractor.extract();
      const videoEndTime = performance.now();
      const videoTime = videoEndTime - videoStartTime;
      timingData.extractionSteps.videos = videoTime;
      console.log(`[TIMER] Video results extraction: ${videoTime.toFixed(2)}ms`);
    }
    
    // Extract image results
    if (this.config.extractOptions.images) {
      console.log('[TIMER] Starting image results extraction');
      const imageStartTime = performance.now();
      const imageExtractor = new ImageResultsExtractor(page);
      results.images = await imageExtractor.extract();
      const imageEndTime = performance.now();
      const imageTime = imageEndTime - imageStartTime;
      timingData.extractionSteps.images = imageTime;
      console.log(`[TIMER] Image results extraction: ${imageTime.toFixed(2)}ms`);
    }
    
    // Extract all page text for comprehensive analysis
    console.log('[TIMER] Starting page text extraction');
    const pageTextStartTime = performance.now();
    let pageText = await this.extractAllPageText();
    results.pageText = pageText.length > 100 ? pageText.slice(0, 100) + '…' : pageText;
    const pageTextEndTime = performance.now();
    const pageTextTime = pageTextEndTime - pageTextStartTime;
    timingData.extractionSteps.pageText = pageTextTime;
    console.log(`[TIMER] Page text extraction: ${pageTextTime.toFixed(2)}ms`);
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
   * @returns Object with timing data for each format
   */
  private async saveResults(
    results: SearchResults,
    formats: OutputFormat[] = [OutputFormat.JSON, OutputFormat.TEXT]
  ): Promise<Record<string, number>> {
    const page = this.browserManager.getPage();
    const formatTimings: Record<string, number> = {};
    
    // Track individual format saving times
    for (const format of formats) {
      console.log(`[TIMER] Starting save in ${format} format`);
      const formatStartTime = performance.now();
      
      await this.resultSaver.saveResults(
        results,
        this.config.outputDir,
        [format],
        page
      );
      
      const formatEndTime = performance.now();
      const formatTime = formatEndTime - formatStartTime;
      formatTimings[format] = formatTime;
      console.log(`[TIMER] Save in ${format} format: ${formatTime.toFixed(2)}ms`);
    }
    
    return formatTimings;
  }
}
