import * as puppeteer from 'puppeteer';

/**
 * Base class for all content extractors
 */
export abstract class BaseExtractor {
  protected page: puppeteer.Page;

  /**
   * Create a new extractor
   * 
   * @param page The Puppeteer page to extract content from
   */
  constructor(page: puppeteer.Page) {
    this.page = page;
  }

  /**
   * Extract content from the page
   */
  abstract extract(): Promise<any>;

  /**
   * Helper method to safely evaluate a function in the browser context
   * 
   * @param fn Function to evaluate in the browser context
   * @param args Arguments to pass to the function
   */
  protected async safeEvaluate<T>(fn: (...args: any[]) => T, ...args: any[]): Promise<T | null> {
    try {
      return await this.page.evaluate(fn, ...args);
    } catch (error) {
      console.error(`Error during page evaluation: ${error}`);
      return null;
    }
  }

  /**
   * Helper method to wait for a selector with a timeout
   * 
   * @param selector CSS selector to wait for
   * @param timeout Timeout in milliseconds
   */
  protected async waitForSelectorSafe(selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.warn(`Selector "${selector}" not found within ${timeout}ms`);
      return false;
    }
  }
}
