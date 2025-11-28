import { Question } from "../models/entities";

class QuestionRepository {
  private questions: Question[] = [];

  public bulkInsert(questions: Question[]): void {
    try {
      const existingIds = new Set(this.questions.map((q) => q.getId()));
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
      console.info(
        `bulkInsert: inserted=${inserted}, skipped=${skipped}, total=${this.questions.length}`,
      );
    } catch (error) {
      console.error("Error in bulkInsert:", error);
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
