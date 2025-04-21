# Search Result Extractor

A modular web scraper built with TypeScript and Puppeteer for extracting search results from search engines.

## Features

- Extract organic search results with titles, URLs, and snippets
- Extract featured snippets
- Extract "People Also Ask" questions
- Extract related searches
- Extract video results
- Save results in multiple formats (JSON, TXT, CSV, HTML)
- Take screenshots of search results pages
- Perform follow-up searches on specific results

## Installation

```bash
# Clone the repository
git clone https://github.com/sparktsao/WebSearchPup.git
cd search-result-extractor

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
    headless: false,
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
search-result-extractor/
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
│   │   └── video-results-extractor.ts
│   ├── output/
│   │   ├── result-formatter.ts # Formats results in different formats
│   │   └── result-saver.ts     # Saves results to files
│   ├── scraper/
│   │   ├── browser-manager.ts  # Manages browser initialization and cleanup
│   │   └── search-result-scraper.ts # Main scraper class
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
- `headless`: Whether to run the browser in headless mode
- `slowMo`: Slow down operations by the specified amount of milliseconds
- `outputDir`: Directory to save results to
- `extractOptions`: Options for what to extract
  - `organicResults`: Extract organic search results
  - `featuredSnippets`: Extract featured snippets
  - `peopleAlsoAsk`: Extract "People Also Ask" questions
  - `relatedSearches`: Extract related searches
  - `videos`: Extract video results

## License

MIT
