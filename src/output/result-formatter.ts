import { SearchResults, OutputFormat } from '../config/types';

/**
 * Formats search results into different output formats
 */
export class ResultFormatter {
  /**
   * Format search results based on the specified output format
   * 
   * @param results Search results to format
   * @param format Output format
   */
  format(results: SearchResults, format: OutputFormat): string {
    switch (format) {
      case OutputFormat.JSON:
        return this.formatAsJson(results);
      case OutputFormat.TEXT:
        return this.formatAsText(results);
      case OutputFormat.CSV:
        return this.formatAsCsv(results);
      case OutputFormat.HTML:
        return this.formatAsHtml(results);
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  }

  /**
   * Format search results as JSON
   * 
   * @param results Search results to format
   */
  private formatAsJson(results: SearchResults): string {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Format search results as plain text
   * 
   * @param results Search results to format
   */
  private formatAsText(results: SearchResults): string {
    let text = `SEARCH RESULTS FOR: "${results.query}"\n`;
    text += `Extracted on: ${results.timestamp}\n\n`;
    
    // Add organic results
    if (results.organicResults && results.organicResults.length > 0) {
      text += `=== ORGANIC SEARCH RESULTS (${results.organicResults.length}) ===\n\n`;
      
      results.organicResults.forEach((result, index) => {
        text += `Result #${index + 1}:\n`;
        text += `- Title: ${result.title || 'N/A'}\n`;
        text += `- URL: ${result.url || 'N/A'}\n`;
        text += `- Snippet: ${result.snippet || 'N/A'}\n`;
        
        if (result.deepLinks && result.deepLinks.length > 0) {
          text += `- Deep Links:\n`;
          result.deepLinks.forEach(link => {
            text += `  * ${link.text}: ${link.url}\n`;
          });
        }
        
        text += '\n';
      });
    }
    
    // Add featured snippets
    if (results.featuredSnippets && results.featuredSnippets.length > 0) {
      text += `=== FEATURED SNIPPETS (${results.featuredSnippets.length}) ===\n\n`;
      
      results.featuredSnippets.forEach((snippet, index) => {
        text += `Snippet #${index + 1}:\n`;
        text += `${snippet.content}\n`;
        if (snippet.source) {
          text += `Source: ${snippet.source}\n`;
        }
        text += '\n';
      });
    }
    
    // Add "People Also Ask" questions
    if (results.peopleAlsoAsk && results.peopleAlsoAsk.length > 0) {
      text += `=== PEOPLE ALSO ASK (${results.peopleAlsoAsk.length}) ===\n\n`;
      
      results.peopleAlsoAsk.forEach((question, index) => {
        text += `${index + 1}. ${question}\n`;
      });
      
      text += '\n';
    }
    
    // Add related searches
    if (results.relatedSearches && results.relatedSearches.length > 0) {
      text += `=== RELATED SEARCHES (${results.relatedSearches.length}) ===\n\n`;
      
      results.relatedSearches.forEach((search, index) => {
        text += `${index + 1}. ${search}\n`;
      });
      
      text += '\n';
    }
    
    // Add video results
    if (results.videos && results.videos.length > 0) {
      text += `=== VIDEO RESULTS (${results.videos.length}) ===\n\n`;
      
      results.videos.forEach((video, index) => {
        text += `Video #${index + 1}:\n`;
        text += `- Title: ${video.title || 'N/A'}\n`;
        text += `- Source: ${video.source || 'N/A'}\n`;
        if (video.duration) {
          text += `- Duration: ${video.duration}\n`;
        }
        if (video.url) {
          text += `- URL: ${video.url}\n`;
        }
        text += '\n';
      });
    }
    
    // Add image results
    if (results.images && results.images.length > 0) {
      text += `=== IMAGE RESULTS (${results.images.length}) ===\n\n`;
      
      results.images.forEach((image, index) => {
        text += `Image #${index + 1}:\n`;
        text += `- Title: ${image.title || 'N/A'}\n`;
        text += `- Alt Text: ${image.alt || 'N/A'}\n`;
        if (image.dimensions) {
          text += `- Dimensions: ${image.dimensions}\n`;
        }
        if (image.url) {
          text += `- URL: ${image.url}\n`;
        }
        if (image.src) {
          text += `- Source: ${image.src}\n`;
        }
        text += '\n';
      });
    }
    
    return text;
  }

  /**
   * Format search results as CSV
   * 
   * @param results Search results to format
   */
  private formatAsCsv(results: SearchResults): string {
    let csv = '';
    
    // Add organic results
    if (results.organicResults && results.organicResults.length > 0) {
      csv += 'Type,Position,Title,URL,Snippet\n';
      
      results.organicResults.forEach(result => {
        csv += `Organic,${result.position},"${this.escapeCsvField(result.title || '')}","${this.escapeCsvField(result.url || '')}","${this.escapeCsvField(result.snippet || '')}"\n`;
      });
      
      // Add a blank line between sections
      csv += '\n';
    }
    
    // Add featured snippets
    if (results.featuredSnippets && results.featuredSnippets.length > 0) {
      csv += 'Type,Content,Source,URL\n';
      
      results.featuredSnippets.forEach((snippet, index) => {
        csv += `Featured,${index + 1},"${this.escapeCsvField(snippet.content || '')}","${this.escapeCsvField(snippet.source || '')}","${this.escapeCsvField(snippet.url || '')}"\n`;
      });
      
      // Add a blank line between sections
      csv += '\n';
    }
    
    // Add video results
    if (results.videos && results.videos.length > 0) {
      csv += 'Type,Title,Source,Duration,URL\n';
      
      results.videos.forEach((video, index) => {
        csv += `Video,${index + 1},"${this.escapeCsvField(video.title || '')}","${this.escapeCsvField(video.source || '')}","${this.escapeCsvField(video.duration || '')}","${this.escapeCsvField(video.url || '')}"\n`;
      });
    }
    
    return csv;
  }

  /**
   * Format search results as HTML
   * 
   * @param results Search results to format
   */
  private formatAsHtml(results: SearchResults): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Results for "${results.query}"</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #1a73e8;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    h2 {
      color: #1a73e8;
      margin-top: 30px;
    }
    .result {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 5px;
    }
    .result:hover {
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .title {
      color: #1a0dab;
      font-size: 18px;
      margin: 0 0 5px 0;
    }
    .url {
      color: #006621;
      font-size: 14px;
      margin: 0 0 8px 0;
    }
    .snippet {
      color: #545454;
      font-size: 14px;
    }
    .deep-links {
      margin-top: 10px;
      padding-left: 20px;
    }
    .deep-link {
      font-size: 13px;
      color: #1a0dab;
    }
    .featured {
      background-color: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #1a73e8;
      margin-bottom: 20px;
    }
    .video {
      display: flex;
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #eee;
      border-radius: 5px;
    }
    .video-info {
      margin-left: 15px;
    }
    .video-thumbnail {
      width: 120px;
      height: 90px;
      background-color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
    }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      grid-gap: 15px;
    }
    .image-item {
      border: 1px solid #eee;
      border-radius: 5px;
      padding: 10px;
      transition: transform 0.2s;
    }
    .image-item:hover {
      transform: scale(1.03);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .image-placeholder {
      width: 100%;
      height: 150px;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #70757a;
      margin-bottom: 10px;
    }
    .meta {
      color: #70757a;
      font-size: 13px;
    }
    .questions, .related {
      list-style-type: none;
      padding-left: 0;
    }
    .questions li, .related li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
  </style>
</head>
<body>
  <h1>Search Results for "${this.escapeHtml(results.query)}"</h1>
  <p>Extracted on: ${results.timestamp}</p>
`;

    // Add organic results
    if (results.organicResults && results.organicResults.length > 0) {
      html += `<h2>Organic Search Results (${results.organicResults.length})</h2>`;
      
      results.organicResults.forEach(result => {
        html += `<div class="result">
          <div class="title">${this.escapeHtml(result.title || 'N/A')}</div>
          <div class="url">${this.escapeHtml(result.url || 'N/A')}</div>
          <div class="snippet">${this.escapeHtml(result.snippet || 'N/A')}</div>`;
        
        if (result.deepLinks && result.deepLinks.length > 0) {
          html += `<div class="deep-links">`;
          result.deepLinks.forEach(link => {
            html += `<div class="deep-link">
              <a href="${this.escapeHtml(link.url || '#')}">${this.escapeHtml(link.text || 'Link')}</a>
            </div>`;
          });
          html += `</div>`;
        }
        
        html += `</div>`;
      });
    }
    
    // Add featured snippets
    if (results.featuredSnippets && results.featuredSnippets.length > 0) {
      html += `<h2>Featured Snippets (${results.featuredSnippets.length})</h2>`;
      
      results.featuredSnippets.forEach(snippet => {
        html += `<div class="featured">
          <div>${this.escapeHtml(snippet.content || 'N/A')}</div>
          ${snippet.source ? `<div class="meta">Source: ${this.escapeHtml(snippet.source)}</div>` : ''}
        </div>`;
      });
    }
    
    // Add "People Also Ask" questions
    if (results.peopleAlsoAsk && results.peopleAlsoAsk.length > 0) {
      html += `<h2>People Also Ask (${results.peopleAlsoAsk.length})</h2>
      <ul class="questions">`;
      
      results.peopleAlsoAsk.forEach(question => {
        html += `<li>${this.escapeHtml(question)}</li>`;
      });
      
      html += `</ul>`;
    }
    
    // Add related searches
    if (results.relatedSearches && results.relatedSearches.length > 0) {
      html += `<h2>Related Searches (${results.relatedSearches.length})</h2>
      <ul class="related">`;
      
      results.relatedSearches.forEach(search => {
        html += `<li>${this.escapeHtml(search)}</li>`;
      });
      
      html += `</ul>`;
    }
    
    // Add video results
    if (results.videos && results.videos.length > 0) {
      html += `<h2>Video Results (${results.videos.length})</h2>`;
      
      results.videos.forEach(video => {
        html += `<div class="video">
          <div class="video-thumbnail">▶</div>
          <div class="video-info">
            <div class="title">${this.escapeHtml(video.title || 'N/A')}</div>
            <div class="meta">
              ${video.source ? `${this.escapeHtml(video.source)}` : ''}
              ${video.duration ? ` • ${this.escapeHtml(video.duration)}` : ''}
            </div>
          </div>
        </div>`;
      });
    }
    
    html += `</body>
</html>`;
    
    return html;
  }

  /**
   * Escape HTML special characters
   * 
   * @param str String to escape
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Escape CSV field
   * 
   * @param str String to escape
   */
  private escapeCsvField(str: string): string {
    // If the field contains quotes, double them
    if (str.includes('"')) {
      str = str.replace(/"/g, '""');
    }
    return str;
  }
}
