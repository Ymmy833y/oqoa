import { QuestionDetailDto } from "../models/dtos/question_detail_dto";
import { AnsHistory, Favorite, Question } from "../models/entities";
import { QuestionSearchForm } from "../models/forms";
import { ansHistoryRepository } from "../repositories/ans_history_repository";
import { favoriteRepository } from "../repositories/favorite_repositoriy";
import { qListRepository } from "../repositories/qlist_repositoriy";
import { questionRepository } from "../repositories/question_repositoriy";
import { getPaginationPages, isWithinRange, PAGE_ITEM_SIZE } from "../utils";

export async function selectQuestionsForSearchForm(
  form: QuestionSearchForm,
  pageItemSize = PAGE_ITEM_SIZE,
): Promise<{
  questions: Question[];
  currentPage: number;
  totalSize: number;
  pages: number[];
}> {
  const questions = form.isQListName
    ? await doSelectQuestionsForQList(form.keyword, form.isCaseSensitive)
    : await doSelectQuestionsForSearchForm(form);

  const totalPages =
    Math.floor(questions.length / pageItemSize) +
    (questions.length % pageItemSize === 0 ? 0 : 1);
  const currentPage = totalPages <= form.currentPage ? 0 : form.currentPage;

  const startIndex = currentPage * pageItemSize;
  const endIndex = startIndex + pageItemSize;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const pages = getPaginationPages(currentPage, totalPages);

  return {
    questions: currentQuestions,
    currentPage,
    totalSize: questions.length,
    pages,
  };
}

async function doSelectQuestionsForQList(
  keyword: string,
  isCaseSensitive: boolean,
): Promise<Question[]> {
  const qLists = await qListRepository.selectByWord(keyword, isCaseSensitive);
  return qLists.flatMap((qList) =>
    qList
      .getQuestions()
      .map((questionId) => questionRepository.selectById(questionId))
      .filter((q): q is Question => q != null),
  );
}

async function doSelectQuestionsForSearchForm(
  form: QuestionSearchForm,
): Promise<Question[]> {
  validateQuestionSearchForm(form);

  const {
    correctRate,
    answerDateFrom,
    answerDateTo,
    unansweredFrom,
    unansweredTo,
    checkedFavorites,
  } = form;

  const questions =
    form.keyword === ""
      ? questionRepository.selectAll()
      : questionRepository.selectByWord(form.keyword, form.isCaseSensitive);

  if (
    correctRate === 0 &&
    answerDateFrom === null &&
    answerDateTo === null &&
    unansweredFrom === null &&
    answerDateTo === null &&
    checkedFavorites.length === 0
  ) {
    return questions;
  }

  const hasAnswerPeriod = !!(answerDateFrom || answerDateTo);
  const hasUnansweredPeriod = !!(unansweredFrom || unansweredTo);
  const hasCorrectRate = correctRate > 0;

  let questionAnsHistories: {
    question: Question;
    ansHistories: AnsHistory[];
    favorites: Favorite[];
  }[] = await Promise.all(
    questions.map(async (question) => {
      const ansHistories = await ansHistoryRepository.selectByQuestionId(
        question.getId(),
      );
      const favorites = await favoriteRepository.selectByQuestionId(
        question.getId(),
      );
      return { question, ansHistories, favorites };
    }),
  );

  // 解答期間で絞り込む
  if (hasAnswerPeriod) {
    questionAnsHistories = questionAnsHistories
      .map(({ question, ansHistories, favorites }) => {
        const filteredHistories = ansHistories.filter((h) =>
          isWithinRange(h.getAnswerDate(), answerDateFrom, answerDateTo),
        );
        return { question, ansHistories: filteredHistories, favorites };
      })
      .filter(({ ansHistories }) => ansHistories.length > 0);
  }

  // 未解答期間で絞り込む
  if (hasUnansweredPeriod) {
    questionAnsHistories = questionAnsHistories.filter(({ ansHistories }) => {
      const hasAnsweredInPeriod = ansHistories.some((h) =>
        isWithinRange(h.getAnswerDate(), unansweredFrom, unansweredTo),
      );
      return !hasAnsweredInPeriod;
    });
  }

  // 正答率で絞り込む
  if (hasCorrectRate) {
    questionAnsHistories = questionAnsHistories.filter(({ ansHistories }) => {
      const rate = calcCorrectRate(ansHistories);
      return rate <= correctRate;
    });
  }

  // お気に入りで絞り込む
  if (checkedFavorites.length !== 0) {
    questionAnsHistories = questionAnsHistories.filter(({ favorites }) => {
      return checkedFavorites.some((tagId) =>
        favorites.map((f) => f.getTagId()).includes(tagId),
      );
    });
  }

  return questionAnsHistories.map((qa) => qa.question);
}

function validateQuestionSearchForm(form: QuestionSearchForm) {
  const errors = [];
  const hasAnswerDateRange =
    form.answerDateFrom !== null || form.answerDateTo !== null;
  const hasUnansweredRange =
    form.unansweredFrom !== null || form.unansweredTo !== null;

  if (hasAnswerDateRange && hasUnansweredRange) {
    errors.push("解答期間と未解答期間は同時に指定できません。");
  }
  if (hasUnansweredRange && form.correctRate !== 0) {
    errors.push(
      "未解答期間を指定する場合、正答率は 指定なし でなければなりません。",
    );
  }

  if (errors.length !== 0) {
    throw new Error(errors.join("<br>"));
  }
}

function calcCorrectRate(ansHistories: AnsHistory[]): number {
  if (ansHistories.length === 0) return 100;

  const correctCount = ansHistories.filter((h) => h.getIsCorrect()).length;
  return (correctCount / ansHistories.length) * 100;
}

export async function selectQuestionDetailDto(
  questionId: number,
  practiceHistoryId?: number,
): Promise<QuestionDetailDto> {
  const question = questionRepository.selectById(questionId);
  if (!question) {
    throw new Error(`Question not found: id=${questionId}`);
  }
  const ansHistories =
    await ansHistoryRepository.selectByQuestionId(questionId);
  const ansHistory =
    ansHistories.find(
      (ah) => ah.getPracticeHistoryId() === practiceHistoryId,
    ) ?? null;
  const favorites = await favoriteRepository.selectByQuestionId(questionId);
  return { question, ansHistory, ansHistories, favorites };
}
