/*  eslint-disable @typescript-eslint/no-non-null-assertion */

import { ansHistoryDB } from '../db/AnsHistoryDB';
import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { qListDB } from '../db/QListDB';
import { questionDB } from '../db/QuestionDB';
import { AnsHistory, PracticeHistory, QList, Question } from '../models';
import { shuffle } from '../utils/utils';

interface QuestionDetail {
  question: Question,
  ansHistory?: AnsHistory,
}

interface QuestionResultDetail {
  question: Question,
  ansHistory: AnsHistory,
}

class PracticeManager {
  private practiceHistory!: PracticeHistory;
  public qList!: QList;
  private questionDetails!: QuestionDetail[];
  private currentIndex!: number;

  public get createAt() {
    return this.practiceHistory.getCreateAt();
  }

  public get qListTitle() {
    return this.qList.getName();
  }

  public get practiceHistoryId() {
    if (!this.practiceHistory) {
      return undefined;
    }
    return this.practiceHistory.getId();
  }

  public get isRandomC() {
    return this.practiceHistory.getIsRandomC();
  }

  public get currentQuestionDetail(): QuestionDetail {
    return this.questionDetails[this.currentIndex];
  }

  public get currentQuestionNumber() {
    return this.currentIndex + 1;
  }

  public get totalQuestion() {
    return this.questionDetails.length;
  }

  public get isAllQuestionsSolved() {
    return this.questionDetails.every(detail => detail.ansHistory !== undefined);
  }

  public get correctAnswerCount() {
    return this.questionDetails.filter(detail=> detail.ansHistory && detail.ansHistory.getIsCorrect()).length;
  }

  public get incorrectQuestions() {
    return this.questionDetails
      .filter(detail => detail.ansHistory && !detail.ansHistory.getIsCorrect()) //
      .map(detail => detail.question.getId());
  }

  public async createAndStartPractice(qListId: number, isRandomQ: boolean, isRandomC: boolean, isReview = false) {
    const practiceHistory = PracticeHistory.fromRequiredArgs(qListId, isReview, isRandomQ, isRandomC);
    const practiceHistoryId = await practiceHistoryDB.insert(practiceHistory.generateRow());
    practiceHistory.setId(practiceHistoryId);

    this.practiceHistory = practiceHistory;
    this.qList = await qListDB.selectById(this.practiceHistory.getQListId());
    const questions = this.qList.getQuestions()
      .map(questionId => questionDB.selectById(questionId)) //
      .filter(optionalQuestion => optionalQuestion !== undefined);
    if (this.practiceHistory.getIsRandomQ()) {
      shuffle(questions);
    }
    this.questionDetails = questions.map(question => ({ question }));
    this.currentIndex = 0;
  }

  public async startPractice(practiceId: number) {
    this.practiceHistory = await practiceHistoryDB.selectById(practiceId);
    this.qList = await qListDB.selectById(this.practiceHistory.getQListId());
    const ansHistories = await ansHistoryDB.selectByPracticeHistoryId(this.practiceHistory.getId());
    const unansweredQuestions = this.qList.getQuestions() //
      .map(questionId => questionDB.selectById(questionId))
      .filter(question => question !== undefined) //
      .filter(question => !ansHistories.some(ansHistory => ansHistory.getQuestionId() === question.getId()));
    if (this.practiceHistory.getIsRandomQ()) {
      shuffle(unansweredQuestions);
    }

    const questionDetails: QuestionDetail[] = ansHistories.map(ansHistory => {
      const question = questionDB.selectById(ansHistory.getQuestionId())!;
      return { question, ansHistory }
    });
    const unansweredQuestionDetails: QuestionDetail[] = unansweredQuestions.map(question => ({ question }));
    this.questionDetails = questionDetails.concat(unansweredQuestionDetails);
    this.currentIndex = this.isAllQuestionsSolved ? ansHistories.length - 1 : ansHistories.length;
  }

  public getNextQuestionDetail(): QuestionDetail | null {
    const newIdx = this.currentIndex + 1;
    if (newIdx >= this.questionDetails.length) {
      return null;
    }
    this.currentIndex = newIdx;
    return this.currentQuestionDetail;
  }

  public getPrevQuestionDetail(): QuestionDetail | null {
    const newIdx = this.currentIndex - 1;
    if (newIdx < 0) {
      return null;
    }
    this.currentIndex = newIdx;
    return this.currentQuestionDetail;
  }

  public async entryAnsHistory(isCorrect: boolean, selectChoice: number[]): Promise<number> {
    const currentQuestionDetail = this.questionDetails[this.currentIndex];
    const ansHistory = AnsHistory.fromRequiredArgs(
      this.practiceHistory.getId(),
      currentQuestionDetail.question.getId(),
      isCorrect,
      selectChoice,
      new Date().toISOString()
    );
    const ansHistoryId = await ansHistoryDB.insert(ansHistory.generateRow());
    ansHistory.setId(ansHistoryId);

    currentQuestionDetail.ansHistory = ansHistory;
    this.questionDetails[this.currentIndex] = currentQuestionDetail;
    return ansHistoryId;
  }

  public async cancelAnsHistory(ansHistoryId: number) {
    if (ansHistoryId !== 0 && this.currentQuestionDetail.ansHistory?.getId() === ansHistoryId) {
      await ansHistoryDB.deleteById(ansHistoryId);
      this.currentQuestionDetail.ansHistory = undefined;
    }
  }

  public generateQuestionResultDetails(): QuestionResultDetail[] {
    return this.questionDetails
      .filter(detail => detail.ansHistory)
      .map(detail => ({
        question: detail.question,
        ansHistory: detail.ansHistory!
      }));
  }

  public async markAsAnswered() {
    this.practiceHistory.setIsAnswered(true);
    await practiceHistoryDB.update(this.practiceHistory.generateRow());
  }
}

export const practiceManager = new PracticeManager();

// 関連DOM
const practiceContainer = document.getElementById('practiceContainer')!;
const qListTitle = document.getElementById('qListTitle')!;
const currentQuestionNumberText = document.getElementById('currentQuestionNumber')!;
const totalQuestionsText = document.getElementById('totalQuestions')!;
const practiceQuestionContainer = document.getElementById('practiceQuestionContainer')!;
const practciceResultContainer = document.getElementById('practciceResultContainer')!;

export const practiceRelatedContent = {
  practiceContainer,
  qListTitle,
  currentQuestionNumberText,
  totalQuestionsText,
  practiceQuestionContainer,
  practciceResultContainer
};
