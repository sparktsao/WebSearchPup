import * as puppeteer from 'puppeteer';
import { BROWSER_CONFIG, DEFAULT_USER_AGENT } from '../config/default-config';

/**
 * Manages browser initialization and cleanup
 */
export class BrowserManager {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;
  private headless: boolean;
  private slowMo: number;

  /**
   * Create a new BrowserManager
   * 
   * @param headless Whether to run the browser in headless mode
   * @param slowMo Slow down operations by the specified amount of milliseconds
   */
  constructor(headless: boolean = false, slowMo: number = 0) {
    this.headless = headless;
    this.slowMo = slowMo;
  }

  /**
   * Initialize the browser and page
   */
  async initialize(): Promise<void> {
    console.log('Initializing browser...');
    
    this.browser = await puppeteer.launch({
      headless: this.headless,
      slowMo: this.slowMo,
      ...BROWSER_CONFIG
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(BROWSER_CONFIG.defaultViewport);
    
    // Set user agent to avoid detection
    await this.page.setUserAgent(DEFAULT_USER_AGENT);
  }

  /**
   * Get the current page
   */
  getPage(): puppeteer.Page {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return this.page;
  }

  /**
   * Get the current browser
   */
  getBrowser(): puppeteer.Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return this.browser;
  }

  /**
   * Check if the browser is initialized
   */
  isInitialized(): boolean {
    return this.browser !== null && this.page !== null;
  }

  /**
   * Close the browser and clean up resources
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
