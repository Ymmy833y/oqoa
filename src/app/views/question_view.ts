
import { Question } from '../models/entities';
import { el } from '../utils/view_utils';

export function generateQuestionListRow(question: Question): HTMLButtonElement {
  const id = question.getId();
  const problem = question.getProblem();

  const row = el('button', {
    class: 'question-list-row',
    attr: [
      { type: 'button' },
      { 'data-id': String(id) },
    ],
  }) as HTMLButtonElement;

  const idSpan = el(
    'span',
    'question-list-row-id',
    `#${id}`,
  );

  const textSpan = el(
    'span',
    'question-list-row-text',
    problem,
  );

  row.appendChild(idSpan);
  row.appendChild(textSpan);

  return row;
}
