import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Configuration options for the web scraper
 */
interface ScraperConfig {
  searchQuery: string;
  headless: boolean;
  slowMo: number;
  outputDir: string;
  extractOptions: {
    organicResults: boolean;
    featuredSnippets: boolean;
    peopleAlsoAsk: boolean;
    relatedSearches: boolean;
    videos: boolean;
    images: boolean;
  };
}

/**
 * Web scraper class for extracting search results
 */
class SearchResultScraper {
  private config: ScraperConfig;
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;

  constructor(config: ScraperConfig) {
    this.config = {
      ...config,
      outputDir: config.outputDir || './output'
    };
  }

  /**
   * Initialize the browser and page
   */
  async initialize(): Promise<void> {
    console.log('Initializing browser...');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Navigate to search engine and perform search
   */
  async performSearch(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log(`Navigating to Bing and searching for "${this.config.searchQuery}"...`);
    
    // Navigate to Bing
    await this.page.goto('https://www.bing.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
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
    await this.page.keyboard.press('Enter');
    
    // Wait for search results to load
    console.log('Waiting for search results to load...');
    await this.page.waitForSelector('#b_results', { timeout: 15000 })
      .catch(() => console.log('Warning: #b_results selector not found, but continuing...'));
    
    // Additional wait to ensure all dynamic content loads
    await sleep(2000);
  }

  /**
   * Find the search input element using multiple possible selectors
   */
  private async findSearchInput(): Promise<puppeteer.ElementHandle | null> {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log('Looking for search input...');
    
    // Try multiple possible selectors for search box
    const selectors = [
      'input[name="q"]',
      '#sb_form_q',
      'input[aria-label="Enter your search term"]',
      'textarea#sb_form_q',
      'input[type="search"]'
    ];
    
    for (const selector of selectors) {
      const element = await this.page.$(selector).catch(() => null);
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
  async extractSearchResults(): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');
    
    console.log('Extracting search results...');
    
    const results: any = {};
    
    // Extract organic search results
    if (this.config.extractOptions.organicResults) {
      results.organicResults = await this.extractOrganicResults();
    }
    
    // Extract featured snippets
    if (this.config.extractOptions.featuredSnippets) {
      results.featuredSnippets = await this.extractFeaturedSnippets();
    }
    
    // Extract "People Also Ask" questions
    if (this.config.extractOptions.peopleAlsoAsk) {
      results.peopleAlsoAsk = await this.extractPeopleAlsoAsk();
    }
    
    // Extract related searches
    if (this.config.extractOptions.relatedSearches) {
      results.relatedSearches = await this.extractRelatedSearches();
    }
    
    // Extract video results
    if (this.config.extractOptions.videos) {
      results.videos = await this.extractVideoResults();
    }
    
    // Extract all page text for comprehensive analysis
    results.pageText = await this.extractAllPageText();
    
    return results;
  }

  /**
   * Extract organic search results
   */
  private async extractOrganicResults(): Promise<any[]> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return this.page.evaluate(() => {
      const results: any[] = [];
      
      // Get all organic result elements
      const resultElements = document.querySelectorAll('li.b_algo');
      
      resultElements.forEach((element, index) => {
        // Extract title
        const titleElement = element.querySelector('h2');
        const title = titleElement ? titleElement.textContent?.trim() : null;
        
        // Extract URL
        const linkElement = element.querySelector('h2 a');
        const url = linkElement ? linkElement.getAttribute('href') : null;
        
        // Extract snippet
        const snippetElement = element.querySelector('.b_caption p');
        const snippet = snippetElement ? snippetElement.textContent?.trim() : null;
        
        // Extract deep links if available
        const deepLinks = Array.from(element.querySelectorAll('.b_deep li a')).map(link => ({
          text: link.textContent?.trim(),
          url: link.getAttribute('href')
        }));
        
        results.push({
          position: index + 1,
          title,
          url,
          snippet,
          deepLinks: deepLinks.length > 0 ? deepLinks : undefined
        });
      });
      
      return results;
    });
  }

  /**
   * Extract featured snippets
   */
  private async extractFeaturedSnippets(): Promise<any[]> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return this.page.evaluate(() => {
      const snippets: any[] = [];
      
      // Get all featured snippet elements
      const snippetElements = document.querySelectorAll('.b_ans');
      
      snippetElements.forEach((element) => {
        // Extract text content
        const textContent = element.textContent?.trim();
        
        // Extract source if available
        const sourceElement = element.querySelector('.b_attribution');
        const source = sourceElement ? sourceElement.textContent?.trim() : null;
        
        snippets.push({
          content: textContent,
          source
        });
      });
      
      return snippets;
    });
  }

  /**
   * Extract "People Also Ask" questions
   */
  private async extractPeopleAlsoAsk(): Promise<string[]> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return this.page.evaluate(() => {
      const questions: string[] = [];
      
      // Get all "People Also Ask" question elements
      const questionElements = document.querySelectorAll('.df_qntext');
      
      questionElements.forEach((element) => {
        const question = element.textContent?.trim();
        if (question) {
          questions.push(question);
        }
      });
      
      return questions;
    });
  }

  /**
   * Extract related searches
   */
  private async extractRelatedSearches(): Promise<string[]> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return this.page.evaluate(() => {
      const relatedSearches: string[] = [];
      
      // Get all related search elements
      const relatedElements = document.querySelectorAll('.b_rs li a');
      
      relatedElements.forEach((element) => {
        const search = element.textContent?.trim();
        if (search) {
          relatedSearches.push(search);
        }
      });
      
      return relatedSearches;
    });
  }

  /**
   * Extract video results
   */
  private async extractVideoResults(): Promise<any[]> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return this.page.evaluate(() => {
      const videos: any[] = [];
      
      // Get all video result elements
      const videoElements = document.querySelectorAll('.mc_vtvc');
      
      videoElements.forEach((element) => {
        // Extract title
        const titleElement = element.querySelector('.mc_vtvc_title');
        const title = titleElement ? titleElement.textContent?.trim() : null;
        
        // Extract source
        const sourceElement = element.querySelector('.mc_vtvc_meta_channel');
        const source = sourceElement ? sourceElement.textContent?.trim() : null;
        
        // Extract duration if available
        const durationElement = element.querySelector('.mc_bc');
        const duration = durationElement ? durationElement.textContent?.trim() : null;
        
        videos.push({
          title,
          source,
          duration
        });
      });
      
      return videos;
    });
  }

  /**
   * Extract all text from the page for comprehensive analysis
   */
  private async extractAllPageText(): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return this.page.evaluate(() => {
      // Get the main content area
      const mainContent = document.querySelector('#b_content');
      return mainContent ? mainContent.textContent?.trim() || '' : '';
    });
  }

  /**
   * Save results to files
   */
  async saveResults(results: any): Promise<void> {
    // Save JSON results
    const jsonPath = path.join(this.config.outputDir, 'search-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`Results saved as JSON to ${jsonPath}`);
    
    // Save text summary
    const textSummary = this.generateTextSummary(results);
    const textPath = path.join(this.config.outputDir, 'search-results.txt');
    fs.writeFileSync(textPath, textSummary);
    console.log(`Results summary saved as text to ${textPath}`);
    
    // Take a screenshot
    if (this.page) {
      const screenshotPath = path.join(this.config.outputDir, 'search-results.png');
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to ${screenshotPath}`);
    }
  }

  /**
   * Generate a human-readable text summary of the results
   */
  private generateTextSummary(results: any): string {
    let summary = `SEARCH RESULTS FOR: "${this.config.searchQuery}"\n`;
    summary += `Extracted on: ${new Date().toLocaleString()}\n\n`;
    
    // Add organic results
    if (results.organicResults && results.organicResults.length > 0) {
      summary += `=== ORGANIC SEARCH RESULTS (${results.organicResults.length}) ===\n\n`;
      
      results.organicResults.forEach((result: any, index: number) => {
        summary += `Result #${index + 1}:\n`;
        summary += `- Title: ${result.title || 'N/A'}\n`;
        summary += `- URL: ${result.url || 'N/A'}\n`;
        summary += `- Snippet: ${result.snippet || 'N/A'}\n`;
        
        if (result.deepLinks && result.deepLinks.length > 0) {
          summary += `- Deep Links:\n`;
          result.deepLinks.forEach((link: any) => {
            summary += `  * ${link.text}: ${link.url}\n`;
          });
        }
        
        summary += '\n';
      });
    }
    
    // Add featured snippets
    if (results.featuredSnippets && results.featuredSnippets.length > 0) {
      summary += `=== FEATURED SNIPPETS (${results.featuredSnippets.length}) ===\n\n`;
      
      results.featuredSnippets.forEach((snippet: any, index: number) => {
        summary += `Snippet #${index + 1}:\n`;
        summary += `${snippet.content}\n`;
        if (snippet.source) {
          summary += `Source: ${snippet.source}\n`;
        }
        summary += '\n';
      });
    }
    
    // Add "People Also Ask" questions
    if (results.peopleAlsoAsk && results.peopleAlsoAsk.length > 0) {
      summary += `=== PEOPLE ALSO ASK (${results.peopleAlsoAsk.length}) ===\n\n`;
      
      results.peopleAlsoAsk.forEach((question: string, index: number) => {
        summary += `${index + 1}. ${question}\n`;
      });
      
      summary += '\n';
    }
    
    // Add related searches
    if (results.relatedSearches && results.relatedSearches.length > 0) {
      summary += `=== RELATED SEARCHES (${results.relatedSearches.length}) ===\n\n`;
      
      results.relatedSearches.forEach((search: string, index: number) => {
        summary += `${index + 1}. ${search}\n`;
      });
      
      summary += '\n';
    }
    
    // Add video results
    if (results.videos && results.videos.length > 0) {
      summary += `=== VIDEO RESULTS (${results.videos.length}) ===\n\n`;
      
      results.videos.forEach((video: any, index: number) => {
        summary += `Video #${index + 1}:\n`;
        summary += `- Title: ${video.title || 'N/A'}\n`;
        summary += `- Source: ${video.source || 'N/A'}\n`;
        if (video.duration) {
          summary += `- Duration: ${video.duration}\n`;
        }
        summary += '\n';
      });
    }
    
    return summary;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('Browser closed');
    }
  }
}

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(): { searchQuery: string } {
  // Get command line arguments (skip first two: node and script name)
  const args = process.argv.slice(2);
  
  // Check if a search query was provided
  let searchQuery = 'puppeteer tutorial'; // Default query
  
  if (args.length > 0) {
    // Join all arguments as the search query (to handle queries with spaces)
    searchQuery = args.join(' ');
  }
  
  return { searchQuery };
}

/**
 * Display usage information
 */
function displayUsage(): void {
  console.log('\nSearch Result Extractor');
  console.log('=====================\n');
  console.log('Usage: npx ts-node test8.ts [search query]');
  console.log('\nExamples:');
  console.log('  npx ts-node test8.ts "puppeteer tutorial"');
  console.log('  npx ts-node test8.ts javascript automation\n');
  console.log('If no query is provided, the default "puppeteer tutorial" will be used.\n');
}

/**
 * Main function to run the scraper
 */
async function main() {
  // Display usage information
  displayUsage();
  
  // Parse command line arguments
  const { searchQuery } = parseCommandLineArgs();
  
  console.log(`Search query: "${searchQuery}"\n`);
  
  // Configure the scraper
  const config: ScraperConfig = {
    searchQuery,
    headless: false,
    slowMo: 50,
    outputDir: `./search-results-${searchQuery.replace(/\s+/g, '-').toLowerCase()}`,
    extractOptions: {
      organicResults: true,
      featuredSnippets: true,
      peopleAlsoAsk: true,
      relatedSearches: true,
      videos: true,
      images: false
    }
  };
  
  const scraper = new SearchResultScraper(config);
  
  try {
    // Initialize browser
    await scraper.initialize();
    
    // Perform search
    await scraper.performSearch();
    
    // Extract results
    const results = await scraper.extractSearchResults();
    
    // Save results
    await scraper.saveResults(results);
    
    console.log('Search result extraction completed successfully!');
  } catch (error) {
    console.error('An error occurred during scraping:', error);
  } finally {
    // Clean up
    await scraper.close();
  }
}

// Run the main function
main().catch(console.error);
