/* eslint-disable @typescript-eslint/no-explicit-any */
export class PracticeHistory {
  private id!: number;
  private qListId!: number;
  private isReview!: boolean;
  private isAnswered!: boolean;
  private isRandomQ!: boolean;
  private isRandomC!: boolean;
  private createAt!: string;

  constructor(
    id: number | undefined,
    qListId: number,
    isReview: boolean,
    isAnswered: boolean,
    isRandomQ: boolean,
    isRandomC: boolean,
    createAt: string,
  ) {
    if (id) this.id = id;
    this.qListId = qListId;
    this.isReview = isReview;
    this.isAnswered = isAnswered;
    this.isRandomQ = isRandomQ;
    this.isRandomC = isRandomC;
    this.createAt = createAt;
  }

  static fromRow(row: any) {
    return new PracticeHistory(
      row.id,
      row.q_list_id,
      row.is_review,
      row.is_answered,
      row.is_random_q,
      row.is_random_c,
      row.create_at,
    );
  }

  static fromRequiredArgs(
    qListId: number,
    isReview: boolean,
    isRandomQ: boolean,
    isRandomC: boolean,
  ) {
    return new PracticeHistory(
      undefined,
      qListId,
      isReview,
      false,
      isRandomQ,
      isRandomC,
      new Date().toISOString(),
    );
  }

  static fromCsvRow(
    qListId: number,
    isReview: boolean,
    isAnswered: boolean,
    isRandomQ: boolean,
    isRandomC: boolean,
    createAt: string,
  ) {
    return new PracticeHistory(
      undefined,
      qListId,
      isReview,
      isAnswered,
      isRandomQ,
      isRandomC,
      createAt,
    );
  }

  setId(id: number) {
    this.id = id;
  }
  setQListId(qListId: number) {
    this.qListId = qListId;
  }
  setIsAnswered(isAnswered: boolean) {
    this.isAnswered = isAnswered;
  }

  // Getter
  getId(): number {
    return this.id;
  }
  getQListId(): number {
    return this.qListId;
  }
  getIsReview(): boolean {
    return this.isReview;
  }
  getIsAnswered(): boolean {
    return this.isAnswered;
  }
  getIsRandomQ(): boolean {
    return this.isRandomQ;
  }
  getIsRandomC(): boolean {
    return this.isRandomC;
  }
  getCreateAt(): string {
    return this.createAt;
  }

  generateRow(): any {
    const row: any = {
      q_list_id: this.qListId,
      is_review: this.isReview,
      is_answered: this.isAnswered,
      is_random_q: this.isRandomQ,
      is_random_c: this.isRandomC,
      create_at: this.createAt,
    };
    if (this.id !== undefined) {
      row.id = this.id;
    }
    return row;
  }
}
