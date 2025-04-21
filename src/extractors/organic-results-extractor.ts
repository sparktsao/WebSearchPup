import { BaseExtractor } from './base-extractor';
import { OrganicResult, DeepLink } from '../config/types';
import { SELECTORS } from '../config/default-config';

/**
 * Extracts organic search results from the page
 */
export class OrganicResultsExtractor extends BaseExtractor {
  /**
   * Extract organic search results
   */
  async extract(): Promise<OrganicResult[]> {
    console.log('Extracting organic search results...');
    
    // Wait for organic results to be present
    const hasResults = await this.waitForSelectorSafe(SELECTORS.organicResults, 10000);
    if (!hasResults) {
      console.warn('No organic results found');
      return [];
    }
    
    // Extract results
    const results = await this.safeEvaluate<OrganicResult[]>((selector: string) => {
      const results: OrganicResult[] = [];
      
      // Get all organic result elements
      const resultElements = document.querySelectorAll(selector);
      
      resultElements.forEach((element, index) => {
        // Extract title
        const titleElement = element.querySelector('h2');
        const title = titleElement ? titleElement.textContent?.trim() || null : null;
        
        // Extract URL
        const linkElement = element.querySelector('h2 a');
        const url = linkElement ? linkElement.getAttribute('href') || null : null;
        
        // Extract snippet
        const snippetElement = element.querySelector('.b_caption p');
        const snippet = snippetElement ? snippetElement.textContent?.trim() || null : null;
        
        // Extract deep links if available
        const deepLinks: Array<{text: string | null, url: string | null}> = [];
        const deepLinkElements = element.querySelectorAll('.b_deep li a');
        
        deepLinkElements.forEach((link: Element) => {
          deepLinks.push({
            text: link.textContent?.trim() || null,
            url: link.getAttribute('href') || null
          });
        });
        
        results.push({
          position: index + 1,
          title,
          url,
          snippet,
          deepLinks: deepLinks.length > 0 ? deepLinks : undefined,
          followUpSearched: false
        });
      });
      
      return results;
    }, SELECTORS.organicResults) || [];
    
    return results;
  }

  /**
   * Perform a follow-up search on a specific result
   * 
   * @param result The result to perform a follow-up search on
   * @param depth Maximum depth of follow-up searches
   */
  async performFollowUpSearch(result: OrganicResult, depth: number = 1): Promise<any> {
    if (!result.url || result.followUpSearched || depth <= 0) {
      return null;
    }
    
    console.log(`Performing follow-up search on: ${result.url}`);
    
    try {
      // Navigate to the result URL
      await this.page.goto(result.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract page title
      const title = await this.page.title();
      
      // Extract page content
      const content = await this.safeEvaluate<string>(() => {
        const mainContent = document.querySelector('main') || document.querySelector('body');
        return mainContent ? mainContent.textContent?.trim() || '' : '';
      });
      
      // Mark as searched
      result.followUpSearched = true;
      
      // Store follow-up results
      result.followUpResults = {
        title,
        content: content ? content.substring(0, 1000) + '...' : null,
        url: result.url
      };
      
      return result.followUpResults;
    } catch (error) {
      console.error(`Error during follow-up search: ${error}`);
      return null;
    }
  }
}
