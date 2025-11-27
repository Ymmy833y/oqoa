import { ansHistoryDB } from '../db/AnsHistoryDB';
import { favoriteDB } from '../db/FavoriteDB';
import { qListDB } from '../db/QListDB';
import { questionDB } from '../db/QuestionDB';
import { AnsHistory, QList, Question } from '../models';

export enum AnswerStatus {
  INCLUDE = '含む',
  EXCLUDES = '除外',
}

export enum RecentCorrectRateCutoff {
  NONE = '---',
  RATE_25 = '25%',
  RATE_40 = '40%',
  RATE_50 = '50%',
  RATE_70 = '70%',
  RATE_85 = '85%',
}

interface SearchQuery {
  word?: string,
  wordCaseSensitive?: boolean;
  qLists?: QList[],
  answerStatus?: AnswerStatus;
  answerCountMin?: number;
  answerCountMax?: number;
  recentWrongThreshold?: number;
  recentCorrectRateCutoff?: RecentCorrectRateCutoff;
  answerStartDate?: Date;
  answerEndDate?: Date;
  isFavorite?: boolean;
}

function selectReferenceRate(recentCorrectRateCutoff: RecentCorrectRateCutoff)  {
  switch (recentCorrectRateCutoff) {
  case RecentCorrectRateCutoff.RATE_25: return 0.25;
  case RecentCorrectRateCutoff.RATE_40: return 0.40;
  case RecentCorrectRateCutoff.RATE_50: return 0.50;
  case RecentCorrectRateCutoff.RATE_70: return 0.70;
  case RecentCorrectRateCutoff.RATE_85: return 0.85;
  default: return 0;
  }
};

class QuestionSearchManager {
  public questions: Question[];
  private qListSize: number;
  public query: SearchQuery;

  constructor() {
    this.questions = [];
    this.qListSize = 0;
    this.query = {};
  }

  public async initQuery() {
    const qLists = await qListDB.selectByStandard();
    this.qListSize = qLists.length;
    this.query = { qLists };
  }

  async executeSearch() {
    const originQuestions = (this.query.word === undefined || this.query.word === '')
      ? questionDB.selectAll()
      : questionDB.selectByWord(this.query.word, this.query.wordCaseSensitive);

    // qListsの抽出
    const includeSet = new Set(this.includesQuestionIdsForQList);

    let questions = includeSet.size > 0
      ? originQuestions.filter(q => includeSet.has(q.getId()))
      : originQuestions;

    // お気に入りの抽出
    if (this.query.isFavorite) {
      const favorites = await favoriteDB.selectAll();
      questions = questions.filter(q => favorites.some(fav => fav.getQuestionId() === q.getId()));
    }

    // 設問の回答履歴を確認する必要がなければ、即時返却
    if (!this.shouldCheckAnsHistory) {
      this.questions = questions;
      return this.questions;
    }

    const questionAnsHistoryMap = new Map<number, { question: Question, ansHistories: AnsHistory[] }>();
    const questionExcludeMap = new Map<number, { question: Question, ansHistories: AnsHistory[] }>();
    const promises = questions.map(async (question) => {
      if (!questionAnsHistoryMap.has(question.getId())) {
        const ansHistories = await ansHistoryDB.selectByQuestionId(question.getId());
        questionAnsHistoryMap.set(question.getId(), { question, ansHistories });
      }
    });
    await Promise.all(promises);

    // 回答開始日付による抽出
    const answerStartDate = this.query.answerStartDate;
    if (answerStartDate) {
      for (const [questionId, data] of questionAnsHistoryMap) {
        data.ansHistories = data.ansHistories.filter(ansHistory => new Date(ansHistory.getAnswerDate()) >= answerStartDate);
        if (data.ansHistories.length === 0) {
          questionExcludeMap.set(questionId, data);
          questionAnsHistoryMap.delete(questionId);
        }
      }
    }
    // 回答終了日付による抽出
    const answerEndDate = this.query.answerEndDate;
    if (answerEndDate) {
      for (const [questionId, data] of questionAnsHistoryMap) {
        data.ansHistories = data.ansHistories.filter(ansHistory => new Date(ansHistory.getAnswerDate()) <= answerEndDate);
        if (data.ansHistories.length === 0) {
          questionExcludeMap.set(questionId, data);
          questionAnsHistoryMap.delete(questionId);
        }
      }
    }

    // 回答数による抽出
    const answerCountMin = this.query.answerCountMin ?? 0;
    const answerCountMax = this.query.answerCountMax ?? Infinity;
    for (const [questionId, data] of questionAnsHistoryMap) {
      if (data.ansHistories.length < answerCountMin) {
        questionExcludeMap.set(questionId, data);
        questionAnsHistoryMap.delete(questionId);
      }
      if (data.ansHistories.length > answerCountMax) {
        questionExcludeMap.set(questionId, data);
        questionAnsHistoryMap.delete(questionId);
      }
    }

    // 直近不正解による抽出
    const recentWrongThreshold = this.query.recentWrongThreshold ?? 0;
    if (recentWrongThreshold > 0) {
      for (const [questionId, data] of questionAnsHistoryMap) {
        if (data.ansHistories.length === 0) {
          questionExcludeMap.set(questionId, data);
          questionAnsHistoryMap.delete(questionId);
        } else {
          const checkAnsHistories = data.ansHistories.slice(-recentWrongThreshold);
          if (checkAnsHistories.every(ansHistory => ansHistory.getIsCorrect())) {
            questionExcludeMap.set(questionId, data);
            questionAnsHistoryMap.delete(questionId);
          }
        }
      }
    }

    // 直近の正答率による抽出
    const recentCorrectRateCutoff = this.query.recentCorrectRateCutoff ?? RecentCorrectRateCutoff.NONE;
    if (recentCorrectRateCutoff !== RecentCorrectRateCutoff.NONE) {
      const referenceRate = selectReferenceRate(recentCorrectRateCutoff)
      for (const [questionId, data] of questionAnsHistoryMap) {
        if (data.ansHistories.length !== 0) {
          const checkAnsHistories = data.ansHistories;
          const currentCount = checkAnsHistories.filter(ah => ah.getIsCorrect()).length;
          if ((currentCount / checkAnsHistories.length) < referenceRate) {
            questionExcludeMap.set(questionId, data);
            questionAnsHistoryMap.delete(questionId);
          }
        }
      }
    }

    if (this.query.answerStatus === AnswerStatus.EXCLUDES) {
      this.questions = Array.from(questionExcludeMap.values()).map(item => item.question);
      return this.questions;
    }

    this.questions = Array.from(questionAnsHistoryMap.values()).map(item => item.question);
    return this.questions;
  }

  private get includesQuestionIdsForQList() {
    if (
      this.query.qLists === undefined ||
      this.query.qLists.length === 0 ||
      this.query.qLists.length === this.qListSize
    ) {
      return [];
    }
    const includesQuestionIds: number[] = [];
    this.query.qLists.forEach(qList => includesQuestionIds.push(...qList.getQuestions()));
    return includesQuestionIds;
  }

  private get shouldCheckAnsHistory() {
    if (this.query.answerCountMin !== undefined && this.query.answerCountMin > 0) {
      return true;
    }
    if (this.query.answerCountMax !== undefined && this.query.answerCountMax < Infinity) {
      return true;
    }
    if (this.query.recentWrongThreshold && this.query.recentWrongThreshold > 0) {
      return true;
    }
    if (this.query.recentCorrectRateCutoff && this.query.recentCorrectRateCutoff !== RecentCorrectRateCutoff.NONE) {
      return true;
    }
    if (this.query.answerStartDate) {
      return true;
    }
    if (this.query.answerEndDate) {
      return true;
    }
    return false;
  }
}

export const questionSearchManager = new QuestionSearchManager();
