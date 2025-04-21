import { BaseExtractor } from './base-extractor';
import { ImageResult } from '../config/types';
import { SELECTORS } from '../config/default-config';

/**
 * Extracts image results from the page
 */
export class ImageResultsExtractor extends BaseExtractor {
  /**
   * Extract image results
   */
  async extract(): Promise<ImageResult[]> {
    console.log('Extracting image results...');
    
    // Wait for image results to be present
    const hasImages = await this.waitForSelectorSafe(SELECTORS.images, 5000);
    if (!hasImages) {
      console.warn('No image results found');
      return [];
    }
    
    // Extract images
    const images = await this.safeEvaluate<ImageResult[]>((selector: string) => {
      const images: ImageResult[] = [];
      
      // Get all image elements
      const imageElements = document.querySelectorAll(selector);
      
      imageElements.forEach((element) => {
        // Extract image source
        const imgElement = element.querySelector('img');
        const src = imgElement ? imgElement.getAttribute('src') || null : null;
        
        // Extract alt text
        const alt = imgElement ? imgElement.getAttribute('alt') || null : null;
        
        // Extract title if available
        const titleElement = element.querySelector('.img_info');
        const title = titleElement ? titleElement.textContent?.trim() || null : null;
        
        // Extract URL if available
        const linkElement = element.querySelector('a');
        const url = linkElement ? linkElement.getAttribute('href') || null : null;
        
        // Extract dimensions if available
        const dimensionsElement = element.querySelector('.img_dimensions');
        const dimensions = dimensionsElement ? dimensionsElement.textContent?.trim() || null : null;
        
        images.push({
          src,
          alt,
          title,
          url,
          dimensions
        });
      });
      
      return images;
    }, SELECTORS.images) || [];
    
    return images;
  }
  
  /**
   * View a full-size image at the specified index
   * 
   * @param imageIndex Index of the image to view
   */
  async viewFullSizeImage(imageIndex: number): Promise<string | null> {
    console.log(`Viewing full-size image at index ${imageIndex}...`);
    
    try {
      // Find all image elements
      const imageElements = await this.page.$$(SELECTORS.images);
      
      if (imageIndex >= imageElements.length) {
        console.warn(`Image index ${imageIndex} out of range`);
        return null;
      }
      
      // Click on the image to view full size
      await imageElements[imageIndex].click();
      
      // Wait for the full-size image to load
      await this.page.waitForSelector('.mimg', { timeout: 5000 })
        .catch(() => console.warn('Timeout waiting for full-size image'));
      
      // Get the full-size image URL
      return this.safeEvaluate<string | null>(() => {
        const fullSizeImg = document.querySelector('.mimg');
        return fullSizeImg ? fullSizeImg.getAttribute('src') : null;
      });
    } catch (error) {
      console.error(`Error viewing full-size image: ${error}`);
      return null;
    }
  }
}
