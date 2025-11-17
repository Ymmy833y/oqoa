/* eslint-disable @typescript-eslint/no-explicit-any */
export class Question {
  private id!: number;
  private url!: string;
  private problem!: string;
  private choice!: string[];
  private selectionFormat!: string;
  private answer!: number[];
  private explanation!: string;

  constructor(row: any) {
    this.id = row.id;
    this.url = row.url;
    this.problem = row.problem;
    this.choice = row.choice;
    this.selectionFormat = row.selectionFormat;
    this.answer = row.answer;
    this.explanation = row.explanation;
  }

  setId(id: number): void {
    this.id = id;
  }
  setUrl(url: string): void {
    this.url = url;
  }
  setProblem(problem: string): void {
    this.problem = problem;
  }
  setChoice(choice: string[]): void {
    this.choice = choice;
  }
  setSelectionFormat(selectionFormat: string): void {
    this.selectionFormat = selectionFormat;
  }
  setAnswer(answer: number[]): void {
    this.answer = answer;
  }
  setExplanation(explanation: string): void {
    this.explanation = explanation;
  }

  getId(): number {
    return this.id;
  }
  getUrl(): string {
    return this.url;
  }
  getProblem(): string {
    return this.problem;
  }
  getChoice(): string[] {
    return this.choice;
  }
  getSelectionFormat(): string {
    return this.selectionFormat;
  }
  getAnswer(): number[] {
    return this.answer;
  }
  getExplanation(): string {
    return this.explanation;
  }
}
