
import { AnsHistory, Question } from '../models/entities';
import { Modal } from '../utils';
import { el } from '../utils/view_utils';

export function generateQuestionContent(
  question: Question,
  ansHistory?: AnsHistory
): HTMLElement {
  const inputType = question.getSelectionFormat() === 'radio' ? 'radio' : 'checkbox';

  // ルートカード
  const card = el('div', 'question-card');

  // ヘッダー（問題タイトル＋設問ID）
  const header = el('header', 'question-header');
  const title = el('span', 'question-title', '問題');

  const idWrapper = el('div', 'question-id');
  const idLabel = el('span', { text: '設問ID：' });
  const idValue = el('span', {
    id: 'questionId',
    class: 'question-id-value blur',
    text: `#${question.getId()}`,
  });
  idWrapper.appendChild(idLabel);
  idWrapper.appendChild(idValue);
  // クリックで設問IDのぼかし解除／再付与
  idWrapper.addEventListener('click', () => {
    toggleQuestionIdBlur();
  });

  header.appendChild(title);
  header.appendChild(idWrapper);

  card.appendChild(header);

  // 問題文
  const problemWrapper = el('div');
  const problemText = el('p', {
    id: 'questionText',
    class: 'question-text',
  });
  problemText.toggleAttribute('data-auto-tailwind', true);
  problemText.innerHTML = question.getProblem();
  problemWrapper.appendChild(problemText);
  card.appendChild(problemWrapper);

  // 選択肢
  const choiceLabelElems: HTMLElement[] = []; // 選択肢シャッフルの為に一旦配列に保持
  const choicesWrapper = el('div', {
    id: 'choices',
    class: 'question-choices',
  });
  const choices = question.getChoice();
  choices.forEach((choiceText, index) => {
    const choiceLabel = el('label', 'question-choice');
    const input = el('input', {
      class: 'question-choice-input',
      attr: [
        {
          type: inputType,
          name: 'choice',
          value: String(index),
        },
      ],
    });

    const textSpan = el('span');
    textSpan.toggleAttribute('data-auto-tailwind', true);
    textSpan.innerHTML = choiceText;

    choiceLabel.appendChild(input);
    choiceLabel.appendChild(textSpan);
    choiceLabel.addEventListener('change', () => {
      checkAnswer();
    });
    choiceLabelElems.push(choiceLabel);
  });
  choiceLabelElems.forEach(label => choicesWrapper.appendChild(label));
  card.appendChild(choicesWrapper);

  // 正解を表示するボタン
  const answerButtonWrapper = el('div', 'question-answer-button-wrapper');
  const answerButton = el('button', {
    id: 'revealAnswerBtn',
    class: 'question-answer-button',
    text: '正解を表示',
    attr: [{ type: 'button' }],
  });
  answerButtonWrapper.appendChild(answerButton);
  answerButtonWrapper.addEventListener('click', () => {
    showAnswerBlock();
  });
  card.appendChild(answerButtonWrapper);

  // 正解＋解説ブロック
  const answerBlock = el('div', {
    id: 'answerBlock',
    class: 'question-answer-block hidden',
  });

  // 正解
  const correctChoices = question.getAnswer().map(idx => question.getChoice()[idx]);
  const answerWrapper = el('div');
  const answerLabel = el('span', 'question-answer-label', '正解');

  const answerText = el('p', 'question-answer-text');
  correctChoices.forEach(choice => {
    const choiceSpan = el('span', 'question-answer-choice');
    choiceSpan.toggleAttribute('data-auto-tailwind', true);
    choiceSpan.innerHTML = choice;
    answerText.appendChild(choiceSpan);
  });

  answerWrapper.appendChild(answerLabel);
  answerWrapper.appendChild(answerText);

  // 解説
  const explainWrapper = el('div');
  const explainLabel = el('span', 'question-explain-label', '解説');
  const explainText = el('p', 'question-explain-text');
  explainText.toggleAttribute('data-auto-tailwind', true);
  explainText.innerHTML = question.getExplanation();

  explainWrapper.appendChild(explainLabel);
  explainWrapper.appendChild(explainText);

  answerBlock.appendChild(answerWrapper);
  answerBlock.appendChild(explainWrapper);

  card.appendChild(answerBlock);

  // 内包モーダル
  const innerModalElem = el('div', 'app-modal-overlay hidden');
  const innerModal = new Modal(innerModalElem);
  card.appendChild(innerModalElem);

  function checkAnswer() {
    const checkedList: number[] = [];
    choiceLabelElems.forEach(choice => {
      const input = choice.getElementsByTagName('input')[0];
      if (input.checked) {
        checkedList.push(Number(input.value));
      }
    });
    const sortedAnswers = [...question.getAnswer()].sort((a, b) => a - b);
    const sortedSelects = [...checkedList].sort((a, b) => a - b);
    const isCorrect = sortedAnswers.every((v, i) => v === sortedSelects[i]);

    const modal = el('div', 'answer-modal');
    const modalText = el('p',
      `answer-modal-text answer-modal-text-${isCorrect ? 'correct ' : 'incorrect'}`,
      `${isCorrect ? '正解' : '不正解'}`
    );
    modal.appendChild(modalText);
    innerModal.setModal(modal);

    if (isCorrect) {
      showAnswerBlock();
      toggleQuestionIdBlur();
    }
  }

  function toggleQuestionIdBlur(isAdd?: boolean) {
    if (isAdd === undefined) {
      idValue.classList.toggle('blur');
    } else if (isAdd) {
      idValue.classList.add('blur');
    } else {
      idValue.classList.remove('blur');
    }
  }
  function showAnswerBlock() {
    choiceLabelElems.forEach(choice => {
      const input = choice.getElementsByTagName('input')[0];
      if (question.getAnswer().includes(Number(input.value))) {
        choice.classList.add('question-answer-choice')
      }
    });
    answerBlock.classList.remove('hidden');
  }
  return card;
}

export function generateQuestionListRow(
  question: Question,
  handler: (questionId: number) => void
): HTMLButtonElement {
  const id = question.getId();
  const problem = question.getProblem();

  const row = el('button', {
    class: 'question-list-row',
    attr: [
      { type: 'button' },
      { 'data-id': String(id) },
    ],
  }) as HTMLButtonElement;
  row.addEventListener('click', () => {
    handler(id);
  });

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
