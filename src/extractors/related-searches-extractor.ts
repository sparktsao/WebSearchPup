import { BaseExtractor } from './base-extractor';
import { SELECTORS } from '../config/default-config';

/**
 * Extracts related searches from the page
 */
export class RelatedSearchesExtractor extends BaseExtractor {
  /**
   * Extract related searches
   */
  async extract(): Promise<string[]> {
    console.log('Extracting related searches...');
    
    // Wait for related searches to be present
    const hasRelatedSearches = await this.waitForSelectorSafe(SELECTORS.relatedSearches, 5000);
    if (!hasRelatedSearches) {
      console.warn('No related searches found');
      return [];
    }
    
    // Extract related searches
    const relatedSearches = await this.safeEvaluate<string[]>((selector: string) => {
      const relatedSearches: string[] = [];
      
      // Get all related search elements
      const relatedElements = document.querySelectorAll(selector);
      
      relatedElements.forEach((element) => {
        const search = element.textContent?.trim();
        if (search) {
          relatedSearches.push(search);
        }
      });
      
      return relatedSearches;
    }, SELECTORS.relatedSearches) || [];
    
    return relatedSearches;
  }
  
  /**
   * Perform a search for a related search term
   * 
   * @param searchIndex Index of the related search to perform
   */
  async performRelatedSearch(searchIndex: number): Promise<void> {
    console.log(`Performing related search at index ${searchIndex}...`);
    
    try {
      // Find all related search elements
      const relatedElements = await this.page.$$(SELECTORS.relatedSearches);
      
      if (searchIndex >= relatedElements.length) {
        console.warn(`Related search index ${searchIndex} out of range`);
        return;
      }
      
      // Click on the related search
      await relatedElements[searchIndex].click();
      
      // Wait for search results to load
      await this.page.waitForSelector(SELECTORS.searchResults, { timeout: 10000 })
        .catch(() => console.warn('Timeout waiting for search results'));
      
      console.log('Related search completed');
    } catch (error) {
      console.error(`Error performing related search: ${error}`);
    }
  }
}
