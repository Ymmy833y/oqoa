/* eslint-disable @typescript-eslint/no-explicit-any */
export class QList {
  private id!: number;
  private uuid!: string;
  private name!: string;
  private questions!: number[];
  private isDefault!: boolean;

  constructor(id: number | undefined, uuid: string, name: string, questions: number[], isDefault: boolean) {
    if (id) this.id = id;
    this.uuid = uuid;
    this.name = name;
    this.questions = questions;
    this.isDefault = isDefault;
  }

  static fromRow(row: any) {
    return new QList(
      row.id,
      row.uuid,
      row.name,
      row.questions,
      row.is_default
    );
  }

  static fromRequiredArgs(uuid: string, name: string, questions: number[], isDefault: boolean) {
    return new QList(undefined, uuid, name, questions, isDefault);
  }

  static fromCreateNew(name: string, questions: number[], isDefault: boolean) {
    return new QList(undefined, crypto.randomUUID(), name, questions, isDefault);
  }

  setId(id: number): void { this.id = id; }
  setUuid(uuid: string): void { this.uuid = uuid; }
  setName(name: string): void { this.name = name; }
  setQuestions(questions: number[]): void { this.questions = questions; }
  setIsDefault(isDefault: boolean): void { this.isDefault = isDefault; }

  getId(): number { return this.id; }
  getUuid(): string { return this.uuid; }
  getName(): string { return this.name; }
  getQuestions(): number[] { return this.questions; }
  getIsDefault(): boolean { return this.isDefault; }

  generateRow(): any {
    const row: any = {
      uuid: this.uuid,
      name: this.name,
      questions: this.questions,
      is_default: this.isDefault,
    };
    if (this.id !== undefined) {
      row.id = this.id;
    }
    return row;
  }

  getIndexOfQuestionId(questionId: number): number {
    return this.questions ? this.questions.indexOf(questionId) : -1;
  }
}
