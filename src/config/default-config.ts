import { ScraperConfig, OutputFormat } from './types';

/**
 * Default configuration for the scraper
 */
export const DEFAULT_CONFIG: Partial<ScraperConfig> = {
  headless: true,
  slowMo: 50,
  extractOptions: {
    organicResults: true,
    featuredSnippets: true,
    peopleAlsoAsk: true,
    relatedSearches: true,
    videos: true,
    images: false
  }
};

/**
 * Default search query if none is provided
 */
export const DEFAULT_SEARCH_QUERY = 'puppeteer tutorial';

/**
 * Default output formats to generate
 */
export const DEFAULT_OUTPUT_FORMATS = [
  OutputFormat.JSON,
  OutputFormat.TEXT
];

/**
 * Default browser settings
 */
export const BROWSER_CONFIG = {
  defaultViewport: { width: 1280, height: 800 },
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
};

/**
 * Default user agent to use
 */
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

/**
 * Search engine URL
 */
export const SEARCH_ENGINE_URL = 'https://www.bing.com/';

/**
 * Selectors for finding search input
 */
export const SEARCH_INPUT_SELECTORS = [
  'input[name="q"]',
  '#sb_form_q',
  'input[aria-label="Enter your search term"]',
  'textarea#sb_form_q',
  'input[type="search"]'
];

/**
 * Selectors for extracting different types of content
 */
export const SELECTORS = {
  searchResults: '#b_results',
  organicResults: 'li.b_algo',
  featuredSnippets: '.b_ans',
  peopleAlsoAsk: '.df_qntext',
  relatedSearches: '.b_rs li a',
  videos: '.mc_vtvc',
  images: '.imgpt',
  mainContent: '#b_content'
};

/**
 * Timeouts for various operations (in milliseconds)
 */
export const TIMEOUTS = {
  navigation: 30000,
  searchResults: 15000,
  stabilization: 2000
};
