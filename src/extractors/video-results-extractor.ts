import { BaseExtractor } from './base-extractor';
import { VideoResult } from '../config/types';
import { SELECTORS } from '../config/default-config';

/**
 * Extracts video results from the page
 */
export class VideoResultsExtractor extends BaseExtractor {
  /**
   * Extract video results
   */
  async extract(): Promise<VideoResult[]> {
    console.log('Extracting video results...');
    
    // Wait for video results to be present
    const hasVideos = await this.waitForSelectorSafe(SELECTORS.videos, 5000);
    if (!hasVideos) {
      console.warn('No video results found');
      return [];
    }
    
    // Extract videos
    const videos = await this.safeEvaluate<VideoResult[]>((selector: string) => {
      const videos: VideoResult[] = [];
      
      // Get all video elements
      const videoElements = document.querySelectorAll(selector);
      
      videoElements.forEach((element) => {
        // Extract title
        const titleElement = element.querySelector('.mc_vtvc_title');
        const title = titleElement ? titleElement.textContent?.trim() || null : null;
        
        // Extract source
        const sourceElement = element.querySelector('.mc_vtvc_meta_channel');
        const source = sourceElement ? sourceElement.textContent?.trim() || null : null;
        
        // Extract duration if available
        const durationElement = element.querySelector('.mc_bc');
        const duration = durationElement ? durationElement.textContent?.trim() || null : null;
        
        // Extract URL if available
        const linkElement = element.querySelector('a');
        const url = linkElement ? linkElement.getAttribute('href') || null : null;
        
        videos.push({
          title,
          source,
          duration,
          url
        });
      });
      
      return videos;
    }, SELECTORS.videos) || [];
    
    return videos;
  }
  
  /**
   * Play a video at the specified index
   * 
   * @param videoIndex Index of the video to play
   */
  async playVideo(videoIndex: number): Promise<void> {
    console.log(`Playing video at index ${videoIndex}...`);
    
    try {
      // Find all video elements
      const videoElements = await this.page.$$(SELECTORS.videos);
      
      if (videoIndex >= videoElements.length) {
        console.warn(`Video index ${videoIndex} out of range`);
        return;
      }
      
      // Find the play button or click on the video itself
      const playButton = await videoElements[videoIndex].$('.mc_vtvc_center_play');
      
      if (playButton) {
        await playButton.click();
      } else {
        // If no play button, try clicking the video itself
        await videoElements[videoIndex].click();
      }
      
      // Wait for video player to load
      await this.page.waitForFunction(
        () => document.querySelector('video'),
        { timeout: 10000 }
      ).catch(() => console.warn('Timeout waiting for video player'));
      
      console.log('Video playback started');
    } catch (error) {
      console.error(`Error playing video: ${error}`);
    }
  }
}
