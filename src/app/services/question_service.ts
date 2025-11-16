import { QuestionSearchForm } from '../models/forms';
import { questionRepository } from '../repositories/question_repositoriy';

const pageSize = 25;

export function selectQuestionsForSearchForm(form: QuestionSearchForm) {
  const questions = (form.keyword === '')
    ? questionRepository.selectAll()
    : questionRepository.selectByWord(form.keyword, form.isCaseSensitive);

  // const totalPages = Math.floor(questions.length / pageSize) + (questions.length % pageSize === 0 ? 0 : 1);

  const startIndex = (form.currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentQuestions = questions.slice(startIndex, endIndex);

  return currentQuestions;
}
