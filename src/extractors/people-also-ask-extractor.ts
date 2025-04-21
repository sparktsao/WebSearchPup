import { BaseExtractor } from './base-extractor';
import { SELECTORS } from '../config/default-config';

/**
 * Extracts "People Also Ask" questions from the page
 */
export class PeopleAlsoAskExtractor extends BaseExtractor {
  /**
   * Extract "People Also Ask" questions
   */
  async extract(): Promise<string[]> {
    console.log('Extracting "People Also Ask" questions...');
    
    // Wait for questions to be present
    const hasQuestions = await this.waitForSelectorSafe(SELECTORS.peopleAlsoAsk, 5000);
    if (!hasQuestions) {
      console.warn('No "People Also Ask" questions found');
      return [];
    }
    
    // Extract questions
    const questions = await this.safeEvaluate<string[]>((selector: string) => {
      const questions: string[] = [];
      
      // Get all question elements
      const questionElements = document.querySelectorAll(selector);
      
      questionElements.forEach((element) => {
        const question = element.textContent?.trim();
        if (question) {
          questions.push(question);
        }
      });
      
      return questions;
    }, SELECTORS.peopleAlsoAsk) || [];
    
    return questions;
  }
  
  /**
   * Expand a "People Also Ask" question to see its answer
   * 
   * @param questionIndex Index of the question to expand
   */
  async expandQuestion(questionIndex: number): Promise<string | null> {
    console.log(`Expanding question at index ${questionIndex}...`);
    
    try {
      // Find all question elements
      const questionElements = await this.page.$$(SELECTORS.peopleAlsoAsk);
      
      if (questionIndex >= questionElements.length) {
        console.warn(`Question index ${questionIndex} out of range`);
        return null;
      }
      
      // Click on the question to expand it
      await questionElements[questionIndex].click();
      
      // Wait for the answer to appear
      await this.page.waitForFunction(
        (index, selector) => {
          const questions = document.querySelectorAll(selector);
          const question = questions[index];
          if (!question) return false;
          
          // Check if the answer container is visible
          const answerContainer = question.parentElement?.querySelector('.b_hide');
          return answerContainer && !answerContainer.classList.contains('b_hide');
        },
        { timeout: 5000 },
        questionIndex,
        SELECTORS.peopleAlsoAsk
      ).catch(() => console.warn('Timeout waiting for answer to appear'));
      
      // Extract the answer
      return this.safeEvaluate<string | null>((index, selector) => {
        const questions = document.querySelectorAll(selector);
        const question = questions[index];
        if (!question) return null;
        
        // Find the answer container
        const answerContainer = question.parentElement?.querySelector('.b_ans');
        return answerContainer ? answerContainer.textContent?.trim() || null : null;
      }, questionIndex, SELECTORS.peopleAlsoAsk);
    } catch (error) {
      console.error(`Error expanding question: ${error}`);
      return null;
    }
  }
}
