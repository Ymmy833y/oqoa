import { QuestionDetailDto } from '../models/dtos/question_detail_dto';
import { Question } from '../models/entities';
import { QuestionSearchForm } from '../models/forms';
import { questionRepository } from '../repositories/question_repositoriy';
import { getPaginationPages } from '../utils';

const pageItemSize = 25;

export function selectQuestionsForSearchForm(form: QuestionSearchForm): {
  questions: Question[], currentPage: number, totalSize: number, pages: number[]
} {
  const questions = (form.keyword === '')
    ? questionRepository.selectAll()
    : questionRepository.selectByWord(form.keyword, form.isCaseSensitive);

  const totalPages = Math.floor(questions.length / pageItemSize) + ((questions.length % pageItemSize === 0) ? 0 : 1);
  const currentPage = (totalPages <= form.currentPage) ? 0 : form.currentPage;

  const startIndex = currentPage * pageItemSize;
  const endIndex = startIndex + pageItemSize;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const pages = getPaginationPages(currentPage, totalPages);

  return { questions: currentQuestions, currentPage, totalSize: questions.length, pages };
}

export function selectQuestionDetailDto(questionId: number): QuestionDetailDto {
  const question = questionRepository.selectById(questionId);
  if (!question) {
    throw new Error(`Question not found: id=${questionId}`);
  }
  return {
    question,
    ansHistory: null,
  }
}
