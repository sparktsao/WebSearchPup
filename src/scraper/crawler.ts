import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { BrowserManager } from './browser-manager';

/**
 * Simple crawler that downloads HTML content from a URL
 */
export class Crawler {
  private browserManager: BrowserManager;
  private headless: boolean;
  private slowMo: number;

  /**
   * Create a new Crawler
   * 
   * @param headless Whether to run the browser in headless mode
   * @param slowMo Slow down operations by the specified amount of milliseconds
   */
  constructor(headless: boolean = true, slowMo: number = 0) {
    this.headless = headless;
    this.slowMo = slowMo;
    this.browserManager = new BrowserManager(headless, slowMo);
  }

  /**
   * Crawl a URL and save its HTML content to the specified output folder
   * 
   * @param url URL to crawl
   * @param outputFolder Folder to save the output to
   * @param options Additional options for crawling
   * @returns Path to the saved HTML file
   */
  async crawl(
    url: string, 
    outputFolder: string, 
    options: {
      takeScreenshot?: boolean;
      waitForSelector?: string;
      timeout?: number;
      filename?: string;
    } = {}
  ): Promise<string> {
    try {
      // Initialize browser if not already initialized
      if (!this.browserManager.isInitialized()) {
        await this.browserManager.initialize();
      }
      
      const page = this.browserManager.getPage();
      
      console.log(`Navigating to ${url}...`);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000
      });
      
      // Wait for a specific selector if provided
      if (options.waitForSelector) {
        console.log(`Waiting for selector: ${options.waitForSelector}...`);
        await page.waitForSelector(options.waitForSelector, { 
          timeout: options.timeout || 30000 
        }).catch(() => console.log(`Selector ${options.waitForSelector} not found, but continuing...`));
      }
      
      // Get the HTML content
      const htmlContent = await page.content();
      
      // Create the output folder if it doesn't exist
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      // Generate a filename based on the URL if not provided
      const filename = options.filename || this.generateFilenameFromUrl(url);
      
      // Save the HTML content
      const htmlFilePath = path.join(outputFolder, `${filename}.html`);
      fs.writeFileSync(htmlFilePath, htmlContent);
      console.log(`HTML content saved to ${htmlFilePath}`);
      
      // Take a screenshot if requested
      if (options.takeScreenshot) {
        const screenshotPath = path.join(outputFolder, `${filename}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);
      }
      
      return htmlFilePath;
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Crawl multiple URLs and save their HTML content
   * 
   * @param urls URLs to crawl
   * @param outputFolder Folder to save the output to
   * @param options Additional options for crawling
   * @returns Paths to the saved HTML files
   */
  async crawlMultiple(
    urls: string[], 
    outputFolder: string, 
    options: {
      takeScreenshot?: boolean;
      waitForSelector?: string;
      timeout?: number;
      concurrency?: number;
    } = {}
  ): Promise<string[]> {
    const concurrency = options.concurrency || 1;
    const results: string[] = [];
    
    // Process URLs in batches based on concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const promises = batch.map(url => this.crawl(url, outputFolder, options));
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Close the browser
   */
  async close(): Promise<void> {
    await this.browserManager.close();
  }
  
  /**
   * Generate a filename from a URL
   * 
   * @param url URL to generate a filename from
   * @returns A sanitized filename
   */
  private generateFilenameFromUrl(url: string): string {
    // Remove protocol and www
    let filename = url.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    filename = filename.replace(/\/$/, '');
    
    // Replace special characters with underscores
    filename = filename.replace(/[\/\?=&]/g, '_');
    
    // Limit the length
    if (filename.length > 100) {
      filename = filename.substring(0, 100);
    }
    
    return filename;
  }
}

/**
 * Command line interface for the crawler
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npx ts-node src/scraper/crawler.ts <url> <output-folder> [--screenshot]');
    process.exit(1);
  }
  
  const url = args[0];
  const outputFolder = args[1];
  const takeScreenshot = args.includes('--screenshot');
  
  // Create and run the crawler
  const crawler = new Crawler(true, 0);
  
  crawler.crawl(url, outputFolder, { takeScreenshot })
    .then(filePath => {
      console.log(`Crawling completed successfully. Output saved to ${filePath}`);
      return crawler.close();
    })
    .catch(error => {
      console.error('Crawling failed:', error);
      crawler.close().catch(console.error);
      process.exit(1);
    });
}
