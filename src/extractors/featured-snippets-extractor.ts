import { BaseExtractor } from './base-extractor';
import { FeaturedSnippet } from '../config/types';
import { SELECTORS } from '../config/default-config';

/**
 * Extracts featured snippets from the page
 */
export class FeaturedSnippetsExtractor extends BaseExtractor {
  /**
   * Extract featured snippets
   */
  async extract(): Promise<FeaturedSnippet[]> {
    console.log('Extracting featured snippets...');
    
    // Wait for featured snippets to be present
    const hasSnippets = await this.waitForSelectorSafe(SELECTORS.featuredSnippets, 5000);
    if (!hasSnippets) {
      console.warn('No featured snippets found');
      return [];
    }
    
    // Extract snippets
    const snippets = await this.safeEvaluate<FeaturedSnippet[]>((selector: string) => {
      const snippets: FeaturedSnippet[] = [];
      
      // Get all featured snippet elements
      const snippetElements = document.querySelectorAll(selector);
      
      snippetElements.forEach((element) => {
        // Extract text content
        let textContent = element.textContent?.trim() || null;
        
        // Extract source if available
        const sourceElement = element.querySelector('.b_attribution');
        const source = sourceElement ? sourceElement.textContent?.trim() || null : null;
        
        // Extract URL if available
        const linkElement = element.querySelector('a');
        const url = linkElement ? linkElement.getAttribute('href') || null : null;
        
        // Truncate to 100 characters
        if (textContent && textContent.length > 100) {
          textContent = textContent.slice(0, 100) + '…';
        }

        snippets.push({
          content: textContent,
          source,
          url
        });
      });
      
      return snippets;
    }, SELECTORS.featuredSnippets) || [];
    
    return snippets;
  }
}
