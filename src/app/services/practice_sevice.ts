import { CustomPracticeStartDto, PracticeDetailDto, PracticeHistoryDto } from '../models/dtos';
import { PracticeHistory, QList, Question } from '../models/entities';
import { PracticeHistorySearchForm } from '../models/forms';
import { ansHistoryRepository } from '../repositories/ans_history_repository';
import { practiceHistoryRepository } from '../repositories/practice_history_repositoriy';
import { qListRepository } from '../repositories/qlist_repositoriy';
import { questionRepository } from '../repositories/question_repositoriy';
import { getPaginationPages, isSameNumbers, PAGE_ITEM_SIZE, shuffle } from '../utils';

export async function generatePracticeDetailDto(
  qList: QList, isShuffleQuestions: boolean, isShuffleChoices: boolean, isReview = false
): Promise<PracticeDetailDto> {
  const practiceHistory = PracticeHistory.fromRequiredArgs(
    qList.getId(), isReview, isShuffleQuestions, isShuffleChoices
  );
  const practiceHistoryId = await practiceHistoryRepository.insert(practiceHistory.generateRow());
  practiceHistory.setId(practiceHistoryId);

  const questions = qList.getQuestions()
    .map(questionId => questionRepository.selectById(questionId))
    .filter(question => question !== undefined);

  if (isShuffleQuestions) {
    shuffle(questions);
  }

  const currentQuestionIndex = (0 < questions.length) ? 0 : -1;

  return { practiceHistory, qList, questions, ansHistories: [], currentQuestionIndex }
}

export async function generatePracticeDetailDtoForCustom(
  dto: CustomPracticeStartDto, isShuffleQuestions: boolean, isShuffleChoices: boolean
): Promise<PracticeDetailDto> {
  const qList = QList.fromCreateNew(dto.name, dto.questionIds, false);
  const qListId = await qListRepository.insert(qList.generateRow());
  qList.setId(qListId);

  return generatePracticeDetailDto(qList, isShuffleQuestions, isShuffleChoices, dto.isReview);
}

export async function generatePracticeDetailDtoForExist(practiceHistoryId: number): Promise<PracticeDetailDto> {
  const practiceHistory = await practiceHistoryRepository.selectById(practiceHistoryId);
  const qList = await qListRepository.selectById(practiceHistory.getQListId());
  const ansHistories = await ansHistoryRepository.selectByPracticeHistoryId(practiceHistoryId);
  const questions = qList.getQuestions()
    .map(questionId => questionRepository.selectById(questionId))
    .filter(question => question !== undefined);

  const answeredQuestionIds = ansHistories.map(ah => ah.getQuestionId());
  const answeredQuestions: Question[] = [];
  const notAnsweredQuestions: Question[] = [];
  questions.forEach(q => {
    if (answeredQuestionIds.includes(q.getId())) {
      answeredQuestions.push(q);
    } else {
      notAnsweredQuestions.push(q);
    }
  });

  if (practiceHistory.getIsRandomQ()) {
    shuffle(notAnsweredQuestions);
  }

  const currentQuestionIndex = notAnsweredQuestions.length !== 0
    ? answeredQuestions.length : answeredQuestions.length - 1;

  return {
    practiceHistory,
    qList,
    questions: [...answeredQuestions, ...notAnsweredQuestions],
    ansHistories,
    currentQuestionIndex
  }
}

export async function doPracticeComplete(dto: PracticeDetailDto) {
  const questionIds = dto.questions.map(q => q.getId());
  const ansHistoryids = dto.ansHistories.map(ah => ah.getQuestionId());
  if (!isSameNumbers(questionIds, ansHistoryids)) {
    throw new Error('全ての問題を解き終えていません');
  }

  dto.practiceHistory.setIsAnswered(true);
  await practiceHistoryRepository.update(dto.practiceHistory.generateRow());

  return dto;
}

export async function selectPracticeHistoryDtos(form: PracticeHistorySearchForm): Promise<{
  practiceHistoryDtos: PracticeHistoryDto[], currentPage: number, totalSize: number, pages: number[]
}> {
  const practiceHistories = await practiceHistoryRepository.selectAllOrderDesc();

  const totalPages = Math.floor(practiceHistories.length / PAGE_ITEM_SIZE) + ((practiceHistories.length % PAGE_ITEM_SIZE === 0) ? 0 : 1);
  const currentPage = (totalPages <= form.currentPage) ? 0 : form.currentPage;

  const startIndex = currentPage * PAGE_ITEM_SIZE;
  const endIndex = startIndex + PAGE_ITEM_SIZE;
  const currentPracticeHistories = practiceHistories.slice(startIndex, endIndex);
  const practiceHistoryDtos = await Promise.all(
    currentPracticeHistories.map(async (practiceHistory) =>{
      const qList = await qListRepository.selectById(practiceHistory.getQListId());
      return { practiceHistory, qList }
    }),
  );

  const pages = getPaginationPages(currentPage, totalPages);

  return { practiceHistoryDtos, currentPage, totalSize: practiceHistories.length, pages };
}
