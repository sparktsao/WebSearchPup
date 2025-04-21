import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { SearchResults, OutputFormat } from '../config/types';
import { ResultFormatter } from './result-formatter';

/**
 * Saves search results to files
 */
export class ResultSaver {
  private formatter: ResultFormatter;
  
  /**
   * Create a new ResultSaver
   */
  constructor() {
    this.formatter = new ResultFormatter();
  }
  
  /**
   * Save search results to files
   * 
   * @param results Search results to save
   * @param outputDir Directory to save results to
   * @param formats Output formats to save
   * @param page Puppeteer page for taking screenshots
   */
  async saveResults(
    results: SearchResults,
    outputDir: string,
    formats: OutputFormat[] = [OutputFormat.JSON, OutputFormat.TEXT],
    page?: puppeteer.Page
  ): Promise<void> {
    // Create output directory if it doesn't exist
    this.ensureDirectoryExists(outputDir);
    
    // Save results in each format
    for (const format of formats) {
      await this.saveInFormat(results, outputDir, format);
    }
    
    // Take a screenshot if page is provided
    if (page) {
      await this.takeScreenshot(page, outputDir);
    }
    
    console.log(`Results saved to ${outputDir}`);
  }
  
  /**
   * Save results in a specific format
   * 
   * @param results Search results to save
   * @param outputDir Directory to save results to
   * @param format Output format
   */
  private async saveInFormat(results: SearchResults, outputDir: string, format: OutputFormat): Promise<void> {
    try {
      // Format the results
      const formattedResults = this.formatter.format(results, format);
      
      // Determine file extension
      const extension = this.getFileExtension(format);
      
      // Create file path
      const filePath = path.join(outputDir, `search-results.${extension}`);
      
      // Write to file
      fs.writeFileSync(filePath, formattedResults);
      
      console.log(`Results saved as ${format.toUpperCase()} to ${filePath}`);
    } catch (error) {
      console.error(`Error saving results in ${format} format: ${error}`);
    }
  }
  
  /**
   * Take a screenshot of the search results page
   * 
   * @param page Puppeteer page
   * @param outputDir Directory to save screenshot to
   */
  private async takeScreenshot(page: puppeteer.Page, outputDir: string): Promise<void> {
    try {
      const screenshotPath = path.join(outputDir, 'search-results.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to ${screenshotPath}`);
    } catch (error) {
      console.error(`Error taking screenshot: ${error}`);
    }
  }
  
  /**
   * Get file extension for output format
   * 
   * @param format Output format
   */
  private getFileExtension(format: OutputFormat): string {
    switch (format) {
      case OutputFormat.JSON:
        return 'json';
      case OutputFormat.TEXT:
        return 'txt';
      case OutputFormat.CSV:
        return 'csv';
      case OutputFormat.HTML:
        return 'html';
      default:
        return 'txt';
    }
  }
  
  /**
   * Ensure directory exists, create if it doesn't
   * 
   * @param dir Directory path
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
