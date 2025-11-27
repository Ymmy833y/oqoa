/* eslint-disable @typescript-eslint/no-explicit-any */
export class AnsHistory {
  private id!: number;
  private practiceHistoryId!: number;
  private questionId!: number;
  private isCorrect!: boolean;
  private selectChoice!: number[];
  private answerDate!: string;

  constructor(
    id: number | undefined,
    practiceHistoryId: number,
    questionId: number,
    isCorrect: boolean,
    selectChoice: number[],
    answerDate: string
  ) {
    if (id) this.id = id;
    this.practiceHistoryId = practiceHistoryId;
    this.questionId = questionId;
    this.isCorrect = isCorrect;
    this.selectChoice = selectChoice;
    this.answerDate = answerDate;
  }

  static fromRow(row: any) {
    return new AnsHistory(
      row.id,
      row.practice_history_id,
      row.question_id,
      row.is_correct,
      row.select_choice,
      row.answer_date
    );
  }

  static fromRequiredArgs(
    practiceHistoryId: number,
    questionId: number,
    isCorrect: boolean,
    selectChoice: number[],
    answerDate: string
  ) {
    return new AnsHistory(
      undefined,
      practiceHistoryId,
      questionId,
      isCorrect,
      selectChoice,
      answerDate
    );
  }

  setId(id: number): void {
    this.id = id;
  }
  setPracticeHistoryId(practiceHistoryId: number): void {
    this.practiceHistoryId = practiceHistoryId;
  }
  setQuestionId(questionId: number): void {
    this.questionId = questionId;
  }
  setIsCorrect(isCorrect: boolean): void {
    this.isCorrect = isCorrect;
  }
  setSelectChoice(selectChoice: number[]): void {
    this.selectChoice = selectChoice;
  }
  setAnswerDate(answerDate: string): void {
    this.answerDate = answerDate;
  }

  getId(): number {
    return this.id;
  }
  getPracticeHistoryId(): number {
    return this.practiceHistoryId;
  }
  getQuestionId(): number {
    return this.questionId;
  }
  getIsCorrect(): boolean {
    return this.isCorrect;
  }
  getSelectChoice(): number[] {
    return this.selectChoice;
  }
  getAnswerDate(): string {
    return this.answerDate;
  }

  generateRow(): any {
    const row: any = {
      practice_history_id: this.practiceHistoryId,
      question_id: this.questionId,
      is_correct: this.isCorrect,
      select_choice: this.selectChoice,
      answer_date: this.answerDate,
    };
    if (this.id !== undefined) {
      row.id = this.id;
    }
    return row;
  }
}
