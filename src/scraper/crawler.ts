import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { BrowserManager } from './browser-manager';
import { TimingData } from '../config/types';

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
  
  // Total row
  console.log('|--------------------------------|------------|-------|');
  console.log(createTableRow('TOTAL', totalTime, totalTime));
  console.log('');
}

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
   * @returns Path to the saved HTML file and timing data
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
  ): Promise<{ filePath: string; timingData: TimingData }> {
    const timingData: TimingData = {
      steps: {},
      extractionSteps: {}
    };
    
    const startTime = performance.now();
    console.log(`[TIMER] Start: ${new Date().toISOString()}`);
    
    try {
      // Initialize browser if not already initialized
      console.log('[TIMER] Starting browser initialization');
      const browserStartTime = performance.now();
      if (!this.browserManager.isInitialized()) {
        await this.browserManager.initialize();
      }
      const browserEndTime = performance.now();
      const browserTime = browserEndTime - browserStartTime;
      timingData.steps.browserInitialization = browserTime;
      console.log(`[TIMER] Browser initialization: ${browserTime.toFixed(2)}ms`);
      
      const page = this.browserManager.getPage();
      
      console.log(`Navigating to ${url}...`);
      console.log('[TIMER] Starting page navigation');
      const navigationStartTime = performance.now();
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000
      });
      
      const navigationEndTime = performance.now();
      const navigationTime = navigationEndTime - navigationStartTime;
      timingData.steps.pageNavigation = navigationTime;
      console.log(`[TIMER] Page navigation: ${navigationTime.toFixed(2)}ms`);
      
      // Wait for a specific selector if provided
      if (options.waitForSelector) {
        console.log(`Waiting for selector: ${options.waitForSelector}...`);
        console.log('[TIMER] Starting selector wait');
        const selectorStartTime = performance.now();
        
        await page.waitForSelector(options.waitForSelector, { 
          timeout: options.timeout || 30000 
        }).catch(() => console.log(`Selector ${options.waitForSelector} not found, but continuing...`));
        
        const selectorEndTime = performance.now();
        const selectorTime = selectorEndTime - selectorStartTime;
        timingData.steps.selectorWait = selectorTime;
        console.log(`[TIMER] Selector wait: ${selectorTime.toFixed(2)}ms`);
      }
      
      // Get the HTML content
      console.log('[TIMER] Starting content extraction');
      const contentStartTime = performance.now();
      const htmlContent = await page.content();
      const contentEndTime = performance.now();
      const contentTime = contentEndTime - contentStartTime;
      timingData.steps.contentExtraction = contentTime;
      console.log(`[TIMER] Content extraction: ${contentTime.toFixed(2)}ms`);
      
      // Create the output folder if it doesn't exist
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      // Generate a filename based on the URL if not provided
      const filename = options.filename || this.generateFilenameFromUrl(url);
      
      // Save the HTML content
      console.log('[TIMER] Starting HTML save');
      const saveStartTime = performance.now();
      const htmlFilePath = path.join(outputFolder, `${filename}.html`);
      fs.writeFileSync(htmlFilePath, htmlContent);
      const saveEndTime = performance.now();
      const saveTime = saveEndTime - saveStartTime;
      timingData.steps.htmlSave = saveTime;
      console.log(`[TIMER] HTML save: ${saveTime.toFixed(2)}ms`);
      console.log(`HTML content saved to ${htmlFilePath}`);
      
      // Take a screenshot if requested
      if (options.takeScreenshot) {
        console.log('[TIMER] Starting screenshot capture');
        const screenshotStartTime = performance.now();
        const screenshotPath = path.join(outputFolder, `${filename}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const screenshotEndTime = performance.now();
        const screenshotTime = screenshotEndTime - screenshotStartTime;
        timingData.steps.screenshotCapture = screenshotTime;
        console.log(`[TIMER] Screenshot capture: ${screenshotTime.toFixed(2)}ms`);
        console.log(`Screenshot saved to ${screenshotPath}`);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      console.log(`[TIMER] End: ${new Date().toISOString()}`);
      console.log(`[TIMER] Total time: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
      
      // Display timing summary
      displayTimingSummary(timingData, totalTime);
      
      return { filePath: htmlFilePath, timingData };
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
   * @returns Paths to the saved HTML files and timing data
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
  ): Promise<{ filePaths: string[]; timingData: TimingData }> {
    const startTime = performance.now();
    console.log(`[TIMER] Starting multiple crawl of ${urls.length} URLs`);
    
    const concurrency = options.concurrency || 1;
    const results: { filePath: string; timingData: TimingData }[] = [];
    const timingData: TimingData = {
      steps: { totalCrawlTime: 0 },
      extractionSteps: {}
    };
    
    // Process URLs in batches based on concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      console.log(`[TIMER] Processing batch ${Math.floor(i / concurrency) + 1} of ${Math.ceil(urls.length / concurrency)}`);
      const batchStartTime = performance.now();
      
      const batch = urls.slice(i, i + concurrency);
      const promises = batch.map(url => this.crawl(url, outputFolder, options));
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      const batchEndTime = performance.now();
      const batchTime = batchEndTime - batchStartTime;
      console.log(`[TIMER] Batch processing time: ${batchTime.toFixed(2)}ms`);
      
      timingData.steps.totalCrawlTime = (timingData.steps.totalCrawlTime || 0) + batchTime;
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`[TIMER] Multiple crawl completed in: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
    
    // Display timing summary
    displayTimingSummary(timingData, totalTime);
    
    return { 
      filePaths: results.map(r => r.filePath),
      timingData 
    };
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
    .then(result => {
      console.log(`Crawling completed successfully. Output saved to ${result.filePath}`);
      return crawler.close();
    })
    .catch(error => {
      console.error('Crawling failed:', error);
      crawler.close().catch(console.error);
      process.exit(1);
    });
}
