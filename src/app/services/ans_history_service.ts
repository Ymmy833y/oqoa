import { AnsHistoryDto, PracticeDetailDto } from '../models/dtos';
import { AnsHistory } from '../models/entities';
import { AnsHistorySearchForm } from '../models/forms';
import { ansHistoryRepository } from '../repositories/ans_history_repository';
import { practiceHistoryRepository } from '../repositories/practice_history_repositoriy';
import { qListRepository } from '../repositories/qlist_repositoriy';
import { questionRepository } from '../repositories/question_repositoriy';
import { ToastMessage } from '../types';
import { generateErrorToastMessage, generateSuccessToastMessage, getPaginationPages, PAGE_ITEM_SIZE } from '../utils';

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

export async function selectAnsHistoryDtos(form: AnsHistorySearchForm): Promise<{
  ansHistoryDtos: AnsHistoryDto[], currentPage: number, totalSize: number, pages: number[]
}> {
  const ansHistories = await ansHistoryRepository.selectAllOrderDesc();

  const totalPages = Math.floor(ansHistories.length / PAGE_ITEM_SIZE) + ((ansHistories.length % PAGE_ITEM_SIZE === 0) ? 0 : 1);
  const currentPage = (totalPages <= form.currentPage) ? 0 : form.currentPage;

  const startIndex = currentPage * PAGE_ITEM_SIZE;
  const endIndex = startIndex + PAGE_ITEM_SIZE;
  const currentansHistories = ansHistories.slice(startIndex, endIndex);
  const ansHistoryDtos = (await Promise.all(
    currentansHistories.map(async (ansHistory) =>{
      const practiceHistory = await practiceHistoryRepository.selectById(ansHistory.getPracticeHistoryId());
      const qList = await qListRepository.selectById(practiceHistory.getQListId());
      const question = questionRepository.selectById(ansHistory.getQuestionId());
      if (question) return { ansHistory, qList, question }
    })
  )).filter(dto => dto !== undefined);

  const pages = getPaginationPages(currentPage, totalPages);

  return { ansHistoryDtos, currentPage, totalSize: ansHistories.length, pages };
}
