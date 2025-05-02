/**
 * Configuration options for the web scraper
 */
export interface ScraperConfig {
  searchQuery: string;
  headless: boolean;
  slowMo: number;
  outputDir: string;
  extractOptions: ExtractOptions;
}

/**
 * Options for what content to extract
 */
export interface ExtractOptions {
  organicResults: boolean;
  featuredSnippets: boolean;
  peopleAlsoAsk: boolean;
  relatedSearches: boolean;
  videos: boolean;
  images: boolean;
}

/**
 * Represents an organic search result
 */
export interface OrganicResult {
  position: number;
  title: string | null;
  url: string | null;
  snippet: string | null;
  deepLinks?: DeepLink[];
  // Added for follow-up search capability
  followUpSearched?: boolean;
  followUpResults?: any;
}

/**
 * Represents a deep link in an organic result
 */
export interface DeepLink {
  text: string | null;
  url: string | null;
}

/**
 * Represents a featured snippet
 */
export interface FeaturedSnippet {
  content: string | null;
  source: string | null;
  url?: string | null;
}

/**
 * Represents a video result
 */
export interface VideoResult {
  title: string | null;
  source: string | null;
  duration: string | null;
  url?: string | null;
}

/**
 * Represents an image result
 */
export interface ImageResult {
  src: string | null;
  alt: string | null;
  title: string | null;
  url: string | null;
  dimensions: string | null;
}

/**
 * Represents all extracted search results
 */
export interface SearchResults {
  query: string;
  timestamp: string;
  organicResults?: OrganicResult[];
  featuredSnippets?: FeaturedSnippet[];
  peopleAlsoAsk?: string[];
  relatedSearches?: string[];
  videos?: VideoResult[];
  images?: ImageResult[];
  pageText?: string;
}

/**
 * Output format options
 */
export enum OutputFormat {
  JSON = 'json',
  TEXT = 'text',
  CSV = 'csv',
  HTML = 'html'
}

/**
 * Timing data for performance measurement
 */
export interface TimingData {
  // Main process steps
  steps: {
    // Search scraper steps
    browserInitialization?: number;
    searchExecution?: number;
    totalExtraction?: number;
    saveResults?: number;
    browserCleanup?: number;
    
    // Crawler steps
    pageNavigation?: number;
    selectorWait?: number;
    contentExtraction?: number;
    htmlSave?: number;
    screenshotCapture?: number;
    totalCrawlTime?: number;
    
    // Any other steps can be added here
    [key: string]: number | undefined;
  };
  
  // Individual extraction steps
  extractionSteps: {
    organicResults?: number;
    featuredSnippets?: number;
    peopleAlsoAsk?: number;
    relatedSearches?: number;
    videos?: number;
    images?: number;
    pageText?: number;
    
    // Any other extraction steps can be added here
    [key: string]: number | undefined;
  };
  
  // Format-specific save times
  saveFormats?: Record<string, number>;
}
