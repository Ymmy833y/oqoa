import { PracticeDetailDto } from '../models/dtos';
import { AnsHistory } from '../models/entities';
import { ansHistoryRepository } from '../repositories/ans_history_repository';
import { ToastMessage } from '../types';
import { generateErrorToastMessage, generateSuccessToastMessage } from '../utils/toast_message';

export async function insertAnsHistory(
  dto: PracticeDetailDto, practiceHistoryId: number, questionId: number, isCorrect: boolean, selectChoice: number[]
): Promise<PracticeDetailDto> {
  const ansHistory = AnsHistory.fromRequiredArgs(
    practiceHistoryId, questionId, isCorrect, selectChoice, new Date().toISOString()
  );
  const ansHistoryId = await ansHistoryRepository.insert(ansHistory.generateRow());
  ansHistory.setId(ansHistoryId);

  dto.ansHistories.push(ansHistory);

  return dto;
}

export async function cancelAnsHistory(
  dto: PracticeDetailDto, practiceHistoryId: number, questionId: number
): Promise<{ practiceDetailDto: PracticeDetailDto, toastMessage: ToastMessage}> {
  const ansHistory = (await ansHistoryRepository.selectByPracticeHistoryId(practiceHistoryId))
    .find(ah => ah.getQuestionId() === questionId);
  if (ansHistory) {
    await ansHistoryRepository.deleteById(ansHistory.getId());
    const ansHistories = dto.ansHistories.filter(ah => ah.getId() !== ansHistory.getId());
    return {
      practiceDetailDto: { ...dto, ansHistories },
      toastMessage: generateSuccessToastMessage('回答を取り消ししました。')
    };
  }

  return {
    practiceDetailDto: dto,
    toastMessage: generateErrorToastMessage('取り消す回答が存在しません。')
  }
}
