/* eslint-disable @typescript-eslint/no-explicit-any */
export class Favorite {
  private id!: number;
  private questionId!: number;
  private tagId!: number;

  constructor(id: number | undefined, questionId: number, tagId: number) {
    if (id) this.id = id;
    this.questionId = questionId;
    this.tagId = tagId;
  }

  static fromRow(row: any) {
    return new Favorite(row.id, row.question_id, row.tag_id);
  }

  static fromRequiredArgs(questionId: number, tagId: number) {
    return new Favorite(undefined, questionId, tagId);
  }

  generateRow(): any {
    const row: any = {
      question_id: this.questionId,
      tag_id: this.tagId,
    };
    if (this.id !== undefined) {
      row.id = this.id;
    }
    return row;
  }

  setId(id: number): void {
    this.id = id;
  }
  setQuestionId(questionId: number): void {
    this.questionId = questionId;
  }
  setTagId(tagId: number): void {
    this.tagId = tagId;
  }
  getId(): number {
    return this.id;
  }
  getQuestionId(): number {
    return this.questionId;
  }
  getTagId(): number {
    return this.tagId;
  }
}
