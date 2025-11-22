import { QuestionDetailDto } from '../models/dtos/question_detail_dto';
import { Question } from '../models/entities';
import { QuestionSearchForm } from '../models/forms';
import { ansHistoryRepository } from '../repositories/ans_history_repository';
import { questionRepository } from '../repositories/question_repositoriy';
import { getPaginationPages, PAGE_ITEM_SIZE } from '../utils';

export function selectQuestionsForSearchForm(form: QuestionSearchForm): {
  questions: Question[], currentPage: number, totalSize: number, pages: number[]
} {
  const questions = (form.keyword === '')
    ? questionRepository.selectAll()
    : questionRepository.selectByWord(form.keyword, form.isCaseSensitive);

  const totalPages = Math.floor(questions.length / PAGE_ITEM_SIZE) + ((questions.length % PAGE_ITEM_SIZE === 0) ? 0 : 1);
  const currentPage = (totalPages <= form.currentPage) ? 0 : form.currentPage;

  const startIndex = currentPage * PAGE_ITEM_SIZE;
  const endIndex = startIndex + PAGE_ITEM_SIZE;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const pages = getPaginationPages(currentPage, totalPages);

  return { questions: currentQuestions, currentPage, totalSize: questions.length, pages };
}

export async function generateQuestionDetailDto(questionId: number, ansHistoryId?: number): Promise<QuestionDetailDto> {
  const question = questionRepository.selectById(questionId);
  if (!question) {
    throw new Error(`Question not found: id=${questionId}`);
  }
  const ansHistory = (ansHistoryId) ? await ansHistoryRepository.selectById(ansHistoryId) : null;
  return { question, ansHistory }
}
