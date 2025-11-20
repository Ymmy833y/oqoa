import { PracticeDetailDto } from '../models/dtos';
import { PracticeHistory, QList } from '../models/entities';
import { practiceHistoryRepository } from '../repositories/practice_history_repositoriy';
import { questionRepository } from '../repositories/question_repositoriy';
import { isSameNumbers, shuffle } from '../utils';

export async function generatePracticeDetailDto(
  qList: QList, isShuffleQuestions: boolean, isShuffleChoices: boolean
): Promise<PracticeDetailDto> {
  const practiceHistory = PracticeHistory.fromRequiredArgs(
    qList.getId(), false, isShuffleQuestions, isShuffleChoices
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
