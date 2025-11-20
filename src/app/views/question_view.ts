
import { PracticeDetailDto } from '../models/dtos';
import { AnsHistory, Question } from '../models/entities';
import { ModalSize } from '../types';
import { Modal } from '../utils';
import { el } from '../utils/view_utils';

interface PracticeContenHandlers {
  onClickPrevBtn: () => void;
  onClickNextBtn: () => void;
  onClickCompleteAnswer: () => void;
  onAnswered: (
    practiceHistoryId: number, questionId: number,
    isCorrect: boolean, selectChoice: number[]
  ) => void;
  onAnswerCanceled: (practiceHistoryId: number, questionId: number) => void;
}

export function generatePracticeContent(
  dto: PracticeDetailDto,
  handlers: PracticeContenHandlers,
  defaultModal: Modal,
): HTMLElement {
  const question = dto.questions[dto.currentQuestionIndex];
  const ansHistory = dto.ansHistories
    .find(ansHistory => ansHistory.getQuestionId() === question.getId());

  const content = el('div', 'practice-body');

  const header = el('div', 'practice-header');
  const qListTitle = el('h2', 'practice-title', dto.qList.getName());
  header.appendChild(qListTitle);
  if (dto.questions.length === dto.ansHistories.length) {
    const headerActions = el('div', 'practice-header-actions');
    const submitButton = el('button', {
      class: 'practice-submit-button',
      text: '回答を提出',
      attr: [
        { type: 'button' },
      ],
    });
    submitButton.addEventListener('click', () => {
      handlers.onClickCompleteAnswer();
    });
    headerActions.appendChild(submitButton);
    header.appendChild(headerActions);
  }

  const nav = el('div', 'practice-nav-row');
  const prevBtn = el('button', 'practice-nav-button', '前の問題');
  const progress = el('div', 'practice-progress',
    `${dto.currentQuestionIndex + 1} 問目 / ${dto.questions.length} 問中`
  );
  const nextBtn = el('button', 'practice-nav-button', '次の問題');
  nav.append(prevBtn, progress, nextBtn);

  const questionContent = generateQuestionContent(
    question, ansHistory, dto.practiceHistory.getIsAnswered(),
    {
      onAnswered: (isCorrect, selectChoice) => handlers.onAnswered(
        dto.practiceHistory.getId(), question.getId(), isCorrect, selectChoice
      ),
      onAnswerCanceled: () => handlers.onAnswerCanceled(
        dto.practiceHistory.getId(), question.getId()
      )
    },
    defaultModal
  );
  content.append(header, nav, questionContent);

  const innerModalElem = el('div', 'app-modal-overlay hidden');
  const innerModal = new Modal(innerModalElem);
  content.appendChild(innerModalElem);

  prevBtn.addEventListener('click', () => {
    if (dto.currentQuestionIndex <= 0) {
      const modal = el('div', 'answer-modal');
      const modalText = el('p', 'answer-modal-text', '前の問題はありません');
      modal.appendChild(modalText);
      innerModal.setModal(modal, undefined, ModalSize.LG);
    } else {
      handlers.onClickPrevBtn();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (dto.questions.length <= dto.currentQuestionIndex + 1) {
      const modal = el('div', 'answer-modal');
      const modalText = el('p', 'answer-modal-text', '次の問題はありません');
      modal.appendChild(modalText);
      innerModal.setModal(modal, undefined, ModalSize.LG);
    } else {
      handlers.onClickNextBtn();
    }
  });
  return content;
}

export function generatePracticeResultContent(dto: PracticeDetailDto) {
  const correctCount = dto.ansHistories.filter(ah => ah.getIsCorrect()).length;
  const totalCount = dto.ansHistories.length;
  const rate = totalCount === 0 ? 0 : (correctCount / totalCount) * 100;
  const rateText = rate.toFixed(2);
  const rateLabel = `${rateText}%`;

  const body = el('div', 'practice-body practice-result');

  const header = el('header', 'practice-result-header');
  const title = el('h2', 'practice-result-title', dto.qList.getName());
  header.appendChild(title);

  const main = el('section', 'practice-result-main');
  const grid = el('div', 'practice-result-grid');

  const chartWrapper = el('div', 'practice-result-chart-wrapper');
  const chartCircle = el('div', 'practice-result-chart-circle') as HTMLDivElement;
  chartCircle.setAttribute('role', 'img');
  chartCircle.setAttribute('aria-label', `正答率 ${rateLabel}`);
  chartWrapper.appendChild(chartCircle);
  const clampedRate = Math.max(0, Math.min(100, rate));
  const deg = clampedRate * 3.6;
  chartCircle.style.setProperty('--practice-result-rate-deg', `${deg}deg`);
  chartWrapper.appendChild(chartCircle);

  const summary = el('div', 'practice-result-summary');

  const summaryRow = el('div', 'practice-result-summary-row');
  const summaryLabel = el(
    'span',
    'practice-result-summary-label',
    '正答率',
  );
  const summaryRate = el(
    'span',
    'practice-result-summary-rate',
    rateLabel,
  );
  summaryRow.appendChild(summaryLabel);
  summaryRow.appendChild(summaryRate);

  const count = el('p', 'practice-result-summary-count');
  count.append('正答数 ');
  const countStrong = el(
    'span',
    'practice-result-summary-count-strong',
    String(correctCount),
  );
  const countTotal = el(
    'span',
    'practice-result-summary-count-total',
    `/ ${totalCount}問`,
  );
  count.appendChild(countStrong);
  count.appendChild(countTotal);

  summary.appendChild(summaryRow);
  summary.appendChild(count);

  grid.appendChild(chartWrapper);
  grid.appendChild(summary);
  main.appendChild(grid);

  const actions = el('section', 'practice-result-actions');
  const retryBtn = el('button', 'practice-result-btn-re-practice', '再演習') as HTMLButtonElement;
  retryBtn.type = 'button';

  const reviewBtn = el(
    'button',
    'practice-result-btn-review',
    '誤答の復習',
  ) as HTMLButtonElement;
  reviewBtn.type = 'button';

  actions.appendChild(retryBtn);
  actions.appendChild(reviewBtn);

  const listSection = el('section', 'practice-result-list');
  for(const question of dto.questions) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
    const row = generateQuestionListRow(question, (_) => {});
    listSection.appendChild(row);
  }

  body.appendChild(header);
  body.appendChild(main);
  body.appendChild(actions);
  body.appendChild(listSection);
  return body;
}

interface QuestionContentHandlers {
  onAnswered: (isCorrect: boolean, selectChoice: number[]) => void;
  onAnswerCanceled: () => void;
}
export function generateQuestionContent(
  question: Question,
  ansHistory?: AnsHistory,
  isAnswered = true,
  handlers?: QuestionContentHandlers,
  modal?: Modal,
): HTMLElement {
  let isFirstAnswer = !ansHistory;
  const inputType = question.getSelectionFormat() === 'radio' ? 'radio' : 'checkbox';

  // ルートカード
  const card = el('div', 'question-card');

  // ヘッダー（問題タイトル＋設問ID）
  const header = el('header', 'question-header');
  const leftWrapper = el('div', 'question-header-left');
  const title = el('span', 'question-title', '問題');
  leftWrapper.appendChild(title);
  if (ansHistory) {
    const label = el('span',
      `question-result-label question-result-label-${ansHistory.getIsCorrect() ? 'correct' : 'incorrect'}`,
      `${ansHistory.getIsCorrect() ? '正解' : '不正解'}`
    );
    leftWrapper.appendChild(label);
  }

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

  header.appendChild(leftWrapper);
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
  const selectedChoices = ansHistory ? ansHistory.getSelectChoice() : [];
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
    input.checked = selectedChoices.includes(index);

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
    class: 'question-answer-button',
    text: '正解を表示',
    attr: [{ type: 'button' }],
  });
  answerButtonWrapper.appendChild(answerButton);
  answerButton.addEventListener('click', () => {
    showAnswerBlock();
  });
  if (ansHistory && !isAnswered) {
    const answerCancelButton = el('button', {
      class: 'question-answer-cancel-button',
      text: '回答を取り消す',
      attr: [{ type: 'button' }],
    });
    answerButtonWrapper.appendChild(answerCancelButton);
    answerCancelButton.addEventListener('click', () => {
      handlers?.onAnswerCanceled();
    });
  }
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
    const choiceSpan = el('p', 'question-answer-choice');
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
  card.appendChild(innerModalElem);
  const innerModal = modal ? modal : new Modal(innerModalElem);

  function checkAnswer() {
    const checkedList: number[] = [];
    choiceLabelElems.forEach(choice => {
      const input = choice.getElementsByTagName('input')[0];
      if (input.checked) {
        checkedList.push(Number(input.value));
      }
    });
    if (checkedList.length !== question.getAnswer().length) {
      return;
    }

    const sortedAnswers = [...question.getAnswer()].sort((a, b) => a - b);
    const sortedSelects = [...checkedList].sort((a, b) => a - b);
    const isCorrect = sortedAnswers.every((v, i) => v === sortedSelects[i]);

    const modal = el('div', 'answer-modal');
    const modalText = el('p',
      `answer-modal-text answer-modal-text-${isCorrect ? 'correct ' : 'incorrect'}`,
      `${isCorrect ? '正解' : '不正解'}`
    );
    modal.appendChild(modalText);
    innerModal.setModal(modal, undefined, ModalSize.DEFAULT);

    if (isCorrect) {
      showAnswerBlock();
      toggleQuestionIdBlur();
    }

    if (handlers && isFirstAnswer) {
      handlers.onAnswered(isCorrect, sortedSelects);
      isFirstAnswer = false;
    }
  }

  if (ansHistory && ansHistory.getIsCorrect()) {
    showAnswerBlock();
    toggleQuestionIdBlur();
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
