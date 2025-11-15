/* eslint-disable @typescript-eslint/no-explicit-any */

import { Question } from '../models/entities';

class QuestionRepository {
  private questions: Question[] = [];
  private dataLoaded = false;

  /**
   * JSONデータの配列を受け取り、各 JSON 内の "questions" 配列から
   * Question インスタンスを生成して統合します。
   */
  public async loadDataFromObjects(jsonDataArray: any[]): Promise<void> {
    if (this.dataLoaded) {
      throw new Error('Question data has already been loaded');
    }
    try {
      this.questions = jsonDataArray.flatMap((jsonData: any) =>
        jsonData.questions.map((row: any) => new Question(row))
      );
      this.dataLoaded = true;
      console.log(
        `Loaded ${this.questions.length} questions from ${jsonDataArray.length} JSON files.`
      );
    } catch (error) {
      console.error('Error loading questions:', error);
      throw error;
    }
  }

  public async bulkInsert(questions: Question[]): Promise<void> {
    try {
      const existingIds = new Set(this.questions.map(q => q.getId()));
      let inserted = 0;
      let skipped = 0;

      for (const q of questions) {
        const id = q.getId();
        if (existingIds.has(id)) {
          skipped++;
          continue;
        }
        this.questions.push(q);
        existingIds.add(id);
        inserted++;
      }
      this.questions.sort((a, b) => a.getId() - b.getId());
      console.log(
        `bulkInsert: inserted=${inserted}, skipped=${skipped}, total=${this.questions.length}`
      );
    } catch (error) {
      console.error('Error in bulkInsert:', error);
      throw error;
    }
  }

  public selectAll(): Question[] {
    return this.questions;
  }

  public selectById(id: number): Question | undefined {
    return this.questions.find((q) => q.getId() === id);
  }

  public selectByWord(word: string, caseSensitive = false): Question[] {
    return this.questions.filter((q) => {
      if (caseSensitive) {
        return (
          q.getId().toString().includes(word) ||
          q.getProblem().includes(word) ||
          q.getChoice().join().includes(word) ||
          q.getExplanation().includes(word)
        );
      }
      return (
        q.getId().toString().includes(word.toLowerCase()) ||
        q.getProblem().toLowerCase().includes(word.toLowerCase()) ||
        q.getChoice().join().toLowerCase().includes(word.toLowerCase()) ||
        q.getExplanation().toLowerCase().includes(word.toLowerCase())
      );
    });
  }
}

export const questionRepository = new QuestionRepository();
