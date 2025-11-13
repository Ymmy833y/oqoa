

import { AnsHistory } from './AnsHistory';
import { PracticeHistory } from './PracticeHistory';
import { QList } from './QList';

export const CSV_HEADER = [
  'practiceHistoryId',
  'questionId',
  'isCorrect',
  'selectChoice',
  'answerDate',
  'qListId',
  'isReview',
  'isAnswered',
  'isRandomQ',
  'isRandomC',
  'createAt',
  'questionUuid',
  'name',
  'questions',
  'isUndeliteable'
];

export class CsvRow {
  private practiceHistoryId: number;
  private questionId: number;
  private isCorrect: boolean;
  private selectChoice: number[];
  private answerDate: string;
  private qListId: number;
  private isReview: boolean;
  private isAnswered: boolean;
  private isRandomQ: boolean;
  private isRandomC: boolean;
  private createAt: string;
  private questionUuid: string;
  private name: string;
  private questions: number[];
  private isUndeliteable: boolean;

  constructor(
    practiceHistoryId: number,
    questionId: number,
    isCorrect: boolean,
    selectChoice: number[],
    answerDate: string,
    qListId: number,
    isReview: boolean,
    isAnswered: boolean,
    isRandomQ: boolean,
    isRandomC: boolean,
    createAt: string,
    questionUuid: string,
    name: string,
    questions: number[],
    isUndeliteable: boolean
  ) {
    this.practiceHistoryId = practiceHistoryId;
    this.questionId = questionId;
    this.isCorrect = isCorrect;
    this.selectChoice = selectChoice;
    this.answerDate = answerDate;
    this.qListId = qListId;
    this.isReview = isReview;
    this.isAnswered = isAnswered;
    this.isRandomQ = isRandomQ;
    this.isRandomC = isRandomC;
    this.createAt = createAt;
    this.questionUuid = questionUuid;
    this.name = name;
    this.questions = questions;
    this.isUndeliteable = isUndeliteable;
  }

  static fromTable(qList: QList, practiceHistory: PracticeHistory, ansHistory: AnsHistory) {
    return new CsvRow(
      ansHistory.getPracticeHistoryId(),
      ansHistory.getQuestionId(),
      ansHistory.getIsCorrect(),
      ansHistory.getSelectChoice(),
      ansHistory.getAnswerDate(),
      practiceHistory.getQListId(),
      practiceHistory.getIsReview(),
      practiceHistory.getIsAnswered(),
      practiceHistory.getIsRandomQ(),
      practiceHistory.getIsRandomC(),
      practiceHistory.getCreateAt(),
      qList.getUuid(),
      qList.getName(),
      qList.getQuestions(),
      qList.getIsDefault()
    );
  }

  static fromTableForUndefined(qList: QList, practiceHistory: PracticeHistory) {
    return new CsvRow(
      practiceHistory.getId(),
      0,
      false,
      [],
      '',
      practiceHistory.getQListId(),
      practiceHistory.getIsReview(),
      practiceHistory.getIsAnswered(),
      practiceHistory.getIsRandomQ(),
      practiceHistory.getIsRandomC(),
      practiceHistory.getCreateAt(),
      qList.getUuid(),
      qList.getName(),
      qList.getQuestions(),
      qList.getIsDefault()
    );
  }


  // practiceHistoryId の getter / setter
  public getPracticeHistoryId(): number {
    return this.practiceHistoryId;
  }
  public setPracticeHistoryId(value: number): void {
    this.practiceHistoryId = value;
  }

  // questionId の getter / setter
  public getQuestionId(): number {
    return this.questionId;
  }
  public setQuestionId(value: number): void {
    this.questionId = value;
  }

  // isCorrect の getter / setter
  public getIsCorrect(): boolean {
    return this.isCorrect;
  }
  public setIsCorrect(value: boolean): void {
    this.isCorrect = value;
  }

  // selectChoice の getter / setter
  public getSelectChoice(): number[] {
    return this.selectChoice;
  }
  public setSelectChoice(value: number[]): void {
    this.selectChoice = value;
  }

  // answerDate の getter / setter
  public getAnswerDate(): string {
    return this.answerDate;
  }
  public setAnswerDate(value: string): void {
    this.answerDate = value;
  }

  // qListId の getter / setter
  public getQListId(): number {
    return this.qListId;
  }
  public setQListId(value: number): void {
    this.qListId = value;
  }

  // isReview の getter / setter
  public getIsReview(): boolean {
    return this.isReview;
  }
  public setIsReview(value: boolean): void {
    this.isReview = value;
  }

  // isAnswered の getter / setter
  public getIsAnswered(): boolean {
    return this.isAnswered;
  }
  public setIsAnswered(value: boolean): void {
    this.isAnswered = value;
  }

  // isRandomQ の getter / setter
  public getIsRandomQ(): boolean {
    return this.isRandomQ;
  }
  public setIsRandomQ(value: boolean): void {
    this.isRandomQ = value;
  }

  // isRandomC の getter / setter
  public getIsRandomC(): boolean {
    return this.isRandomC;
  }
  public setIsRandomC(value: boolean): void {
    this.isRandomC = value;
  }

  // createAt の getter / setter
  public getCreateAt(): string {
    return this.createAt;
  }
  public setCreateAt(value: string): void {
    this.createAt = value;
  }

  // questionUuid の getter / setter
  public getQuestionUuid(): string {
    return this.questionUuid;
  }
  public setQuestionUuid(value: string): void {
    this.questionUuid = value;
  }

  // name の getter / setter
  public getName(): string {
    return this.name;
  }
  public setName(value: string): void {
    this.name = value;
  }

  // questions の getter / setter
  public getQuestions(): number[] {
    return this.questions;
  }
  public setQuestions(value: number[]): void {
    this.questions = value;
  }

  // isUndeliteable の getter / setter
  public getIsUndeliteable(): boolean {
    return this.isUndeliteable;
  }
  public setIsUndeliteable(value: boolean): void {
    this.isUndeliteable = value;
  }
}
