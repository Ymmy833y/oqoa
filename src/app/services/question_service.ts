import { Question } from '../models/entities';
import { QuestionSearchForm } from '../models/forms';
import { questionRepository } from '../repositories/question_repositoriy';
import { getPaginationPages } from '../utils';

const pageItemSize = 25;

export function selectQuestionsForSearchForm(form: QuestionSearchForm): {
  questions: Question[], totalSize: number, pages: number[]
} {
  const questions = (form.keyword === '')
    ? questionRepository.selectAll()
    : questionRepository.selectByWord(form.keyword, form.isCaseSensitive);

  const startIndex = form.currentPage * pageItemSize;
  const endIndex = startIndex + pageItemSize;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const totalPages = Math.floor(questions.length / pageItemSize) + ((questions.length % pageItemSize === 0) ? 0 : 1);
  const pages = getPaginationPages(form.currentPage, totalPages);

  return { questions: currentQuestions, totalSize: questions.length, pages };
}
