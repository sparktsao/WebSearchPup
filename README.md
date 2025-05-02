# WebSearchPup - A Web Search Command Line Tool

A modular web scraper built with TypeScript and Puppeteer for extracting search results from search engines. This tool allows you to perform web searches from the command line and save the results for later analysis or AI processing.
And later you can use LLM/AI tools to digest the outcome.

## Features

- Extract organic search results with titles, URLs, and snippets
- Extract featured snippets
- Extract "People Also Ask" questions
- Extract related searches
- Extract video results
- Save results in multiple formats (JSON, TXT, CSV, HTML)
- Take screenshots of search results pages
- Perform follow-up searches on specific results
- Specify custom output directories
- Generic web crawler for downloading HTML content from any URL
- Performance timing for all operations with detailed summary table

## Installation

```bash
# Clone the repository
git clone https://github.com/sparktsao/WebSearchPup.git
cd WebSearchPup

# Install dependencies
npm install
```

## Usage

### Command Line

```bash
# Run with default search query
npm run search

# Run with a specific search query
npm run search -- "puppeteer tutorial"
npm run search -- javascript automation

# Run with a specific search query and output directory
npm run search -- "puppeteer tutorial" "./custom-output-directory"
```

### As a Module

```typescript
import { SearchResultScraper, ScraperConfig, OutputFormat } from './src';

async function example() {
  const config: ScraperConfig = {
    searchQuery: 'puppeteer tutorial',
    headless: true,  // Browser runs in headless mode by default
    slowMo: 50,
    outputDir: './search-results-puppeteer-tutorial',
    extractOptions: {
      organicResults: true,
      featuredSnippets: true,
      peopleAlsoAsk: true,
      relatedSearches: true,
      videos: true
    }
  };

  const scraper = new SearchResultScraper(config);
  const results = await scraper.run();
  
  console.log(`Found ${results.organicResults?.length || 0} organic results`);
  
  // Perform a follow-up search on the first result
  if (results.organicResults && results.organicResults.length > 0) {
    const followUpResults = await scraper.performFollowUpSearch(0);
    console.log('Follow-up search results:', followUpResults);
  }
}

example().catch(console.error);
```

## Project Structure

```
WebSearchPup/
├── src/
│   ├── config/
│   │   ├── default-config.ts   # Default configuration values
│   │   └── types.ts            # TypeScript type definitions
│   ├── extractors/
│   │   ├── base-extractor.ts   # Base class for all extractors
│   │   ├── organic-results-extractor.ts
│   │   ├── featured-snippets-extractor.ts
│   │   ├── people-also-ask-extractor.ts
│   │   ├── related-searches-extractor.ts
│   │   ├── video-results-extractor.ts
│   │   └── image-results-extractor.ts
│   ├── output/
│   │   ├── result-formatter.ts # Formats results in different formats
│   │   └── result-saver.ts     # Saves results to files
│   ├── scraper/
│   │   ├── browser-manager.ts  # Manages browser initialization and cleanup
│   │   ├── search-result-scraper.ts # Main scraper class
│   │   └── crawler.ts          # Generic web crawler
│   └── index.ts                # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Output Formats

The scraper can save results in the following formats:

- **JSON**: Structured data format
- **TXT**: Plain text format
- **CSV**: Comma-separated values format
- **HTML**: Interactive HTML page with styling

## Configuration Options

You can customize the scraper behavior with the following configuration options:

- `searchQuery`: The search query to use
- `headless`: Whether to run the browser in headless mode (default: true)
- `slowMo`: Slow down operations by the specified amount of milliseconds
- `outputDir`: Directory to save results to
- `extractOptions`: Options for what to extract
  - `organicResults`: Extract organic search results
  - `featuredSnippets`: Extract featured snippets
  - `peopleAlsoAsk`: Extract "People Also Ask" questions
  - `relatedSearches`: Extract related searches
  - `videos`: Extract video results
  - `images`: Extract image results (disabled by default)

## Performance Timing

The scraper includes detailed timing measurements for all operations. At the end of execution, a summary table is displayed showing the time spent on each step and its percentage of the total execution time:

```
=== TIMING SUMMARY ===

| Step                           |       Time |     % |
|--------------------------------|------------|-------|
| Browser Initialization         |      1.61s |    9.3% |
| Search Execution               |     13.13s |   76.0% |
| Total Extraction               |      1.93s |   11.2% |
| Save Results                   |   475.15ms |    2.8% |
| Browser Cleanup                |   120.00ms |    0.7% |
|--------------------------------|------------|-------|
| Extraction Steps:              |            |       |
|--------------------------------|------------|-------|
|   Organic Results              |   367.45ms |    2.1% |
|   Featured Snippets            |   372.74ms |    2.2% |
|   People Also Ask              |   369.05ms |    2.1% |
|   Related Searches             |   378.37ms |    2.2% |
|   Videos                       |   374.26ms |    2.2% |
|   Page Text                    |    61.67ms |    0.4% |
|--------------------------------|------------|-------|
| Save Formats:                 |            |       |
|--------------------------------|------------|-------|
|   JSON                         |   256.68ms |    1.5% |
|   TEXT                         |   218.21ms |    1.3% |
|--------------------------------|------------|-------|
| TOTAL                          |     17.27s |  100.0% |
```

This timing information helps identify performance bottlenecks and optimize the scraping process.

## Generic Web Crawler

The project also includes a generic web crawler that can download HTML content from any URL:

### Command Line Usage

```bash
# Basic usage
npx ts-node src/scraper/crawler.ts <url> <output-folder>

# With screenshot
npx ts-node src/scraper/crawler.ts <url> <output-folder> --screenshot

# Example
npx ts-node src/scraper/crawler.ts https://example.com ./crawl-results --screenshot
```

### As a Module

```typescript
import { Crawler } from './src/scraper/crawler';

async function example() {
  // Create a crawler (headless mode, no slowdown)
  const crawler = new Crawler(true, 0);
  
  try {
    // Crawl a single URL
    const filePath = await crawler.crawl('https://example.com', './crawl-results', {
      takeScreenshot: true,
      timeout: 30000,
      waitForSelector: 'h1', // Optional: wait for a specific element
      filename: 'custom-name' // Optional: specify a custom filename
    });
    
    console.log(`HTML saved to: ${filePath}`);
    
    // Crawl multiple URLs
    const urls = ['https://example.org', 'https://example.net'];
    const results = await crawler.crawlMultiple(urls, './crawl-results', {
      takeScreenshot: true,
      concurrency: 2 // Process 2 URLs at a time
    });
    
    console.log(`Saved ${results.length} files`);
  } finally {
    // Always close the browser when done
    await crawler.close();
  }
}
```

See `examples/basic-crawler.ts` for more detailed examples.

## License

MIT
