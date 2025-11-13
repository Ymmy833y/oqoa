import { AnsHistory, Question } from '../models';

import * as viewUtils from '../utils/viewUtils';
import { defaultModal, Modal, ModalSize } from '../utils/modal';
import { copyToClipboard, formatToYDHM, formatToYMDHMS, removeTagContent, shuffle } from '../utils/utils';
import { questionSearchManager } from '../managers/questionSearchManager';
import { practiceManager } from '../managers/practiceManager';
import { favoriteDB } from '../db/FavoriteDB';
import { Favorite } from '../models/Favorite';
import { ansHistoryDB } from '../db/AnsHistoryDB';
import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { setPractciceResultContainer, setPracticeContainer } from './practiceService';

/**
 * 指定されたページ番号に基づいて、設問一覧のコンテンツを生成します。
 *
 * @param currentPage ページ番号（1始まり）
 * @param query 検索文字
 * @returns 設問一覧のコンテナ HTMLElement
 */
export async function generateQuestionSearchContent(currentPage: number): Promise<HTMLElement> {
  const pageSize = 30;
  const questions: Question[] = await questionSearchManager.executeSearch();

  const totalPages = Math.floor(questions.length / pageSize) + (questions.length % pageSize === 0 ? 0 : 1);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const container: HTMLElement = document.createElement('div');
  container.className = 'flex flex-col';

  if (questions.length === 0) {
    const message: HTMLElement = document.createElement('div');
    message.className = 'text-gray-500 dark:text-gray-400 italic text-center my-4';
    message.textContent = '表示する設問がありません。';
    container.appendChild(message);
    return container;
  }

  const paginationContent: HTMLElement = viewUtils.generatePagination(currentPage, totalPages);
  paginationContent.id = 'paginationContentForQuestions';
  container.appendChild(paginationContent);

  const countElement: HTMLElement = document.createElement('div');
  countElement.className = 'mb-2 text-sm text-right text-gray-600 dark:text-gray-300';
  countElement.textContent = `全 ${questions.length} 件`;
  container.appendChild(countElement);

  const questionListContent = generateQuestionListContent(currentQuestions.map(question => ({ question })));
  container.appendChild(questionListContent);
  return container;
}

export function generateQuestionListContent(questionDetails: { question: Question, ansHistory?: AnsHistory }[]) {
  const container = document.createElement('div');
  questionDetails.forEach(({ question, ansHistory }) => {
    const button: HTMLButtonElement = document.createElement('button');
    button.className = 'w-full flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded shadow cursor-pointer';

    // 左側：問題文テキスト（truncateかつ左寄せ）
    const textSpan = document.createElement('span');
    textSpan.className = 'flex-1 min-w-0 text-left truncate';
    textSpan.textContent = `#${question.getId()}: ${removeTagContent(question.getProblem())}`;
    button.appendChild(textSpan);

    // 右側：ansHistoryが存在する場合のみ、正誤アイコンを表示
    if (ansHistory) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'ml-2 flex-shrink-0';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('fill', 'currentColor');
      const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      if (ansHistory.getIsCorrect()) {
        useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#circle');
        iconSpan.classList.add('text-green-600', 'dark:text-green-400');
      } else {
        useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#close');
        iconSpan.classList.add('text-red-600', 'dark:text-red-400');
      }
      svg.appendChild(useElem);
      iconSpan.appendChild(svg);
      button.appendChild(iconSpan);
    }

    button.addEventListener('click', () => {
      defaultModal.setModal(generateQuestionContent(question, ansHistory), ModalSize.XL);
    });
    container.appendChild(button);
  });

  return container;
}

/**
 * 指定された Question インスタンスをもとに、設問カード（HTMLElement）を生成します。
 *
 * @param question Question インスタンス
 * @param ansHistory (オプション) 回答履歴のデータ。存在する場合は、初回回答済みとして初期表示に反映します。
 * @param onFirstAnswerCallback (オプション) 初回回答時に呼び出すコールバック。
 *   (isCorrect, selectedChoices: number[]) => Promise<number>
 * @returns 設問カードの HTMLElement
 */
export function generateQuestionContent(
  question: Question,
  ansHistory?: AnsHistory,
  isRandomC = false,
  onFirstAnswerCallback?: (isCorrect: boolean, selectedChoices: number[]) => Promise<number>
): HTMLElement {
  let ansHistoryId = 0;
  // カード全体のコンテナ
  const card: HTMLElement = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 p-4 shadow rounded mb-4 whitespace-normal break-all';

  // ヘッダー部分（左側に正誤ラベル、右側に問題文タイトル）
  const headerContainer: HTMLElement = document.createElement('div');
  headerContainer.className = 'flex items-center justify-between mb-2';
  const headerWrap = document.createElement('div');
  headerWrap.className = 'flex items-center';

  // 問題見出し
  const problemHeaderElem: HTMLElement = document.createElement('p');
  problemHeaderElem.className = 'text-lg font-medium text-gray-900 dark:text-gray-100';
  problemHeaderElem.textContent = '問題';
  headerWrap.appendChild(problemHeaderElem);

  // 正誤ラベル（ansHistoryがある場合のみ）
  if (ansHistory) {
    const resultLabel: HTMLElement = document.createElement('span');
    resultLabel.className = 'ml-2 text-sm font-semibold rounded-full px-3 py-1 border';
    if (ansHistory.getIsCorrect()) {
      resultLabel.textContent = '正解';
      resultLabel.classList.add(
        'bg-green-100',
        'text-green-700',
        'border-green-300',
        'dark:bg-green-200',
        'dark:text-green-800',
        'dark:border-green-400'
      );
    } else {
      resultLabel.textContent = '不正解';
      resultLabel.classList.add(
        'bg-red-100',
        'text-red-700',
        'border-red-300',
        'dark:bg-red-200',
        'dark:text-red-800',
        'dark:border-red-400'
      );
    }
    headerWrap.appendChild(resultLabel);
  }
  headerContainer.appendChild(headerWrap);

  // 設問IDの表示
  const questionIdElem: HTMLElement = document.createElement('div');
  questionIdElem.className =
    'flex items-center justify-end gap-1 text-right text-xs text-gray-500 dark:text-gray-400 cursor-pointer';
  const labelElem = document.createElement('span');
  labelElem.textContent = '設問ID:';
  const questionIdTextElem = document.createElement('span');
  questionIdTextElem.textContent = String(question.getId());
  questionIdTextElem.className =
    `ml-1 inline-block select-none transition duration-150 ease-in-out filter ${ansHistory ?? 'blur'}`;
  questionIdTextElem.addEventListener('click', () => {
    const textToCopy = questionIdTextElem.textContent ?? '';
    toggleQuestionIdBlur(false);
    void copyToClipboard(textToCopy);
  });
  questionIdElem.append(labelElem, questionIdTextElem);
  const toggleQuestionIdBlur = (isBlur?: boolean) => {
    if (isBlur === undefined) {
      questionIdTextElem.classList.toggle('blur');
      return;
    }
    if (isBlur) {
      questionIdTextElem.classList.add('blur');
    } else {
      questionIdTextElem.classList.remove('blur');
    }
  }
  labelElem.addEventListener('click', () => toggleQuestionIdBlur());

  headerContainer.appendChild(questionIdElem);
  card.appendChild(headerContainer);

  // 問題文の表示
  const problemElem: HTMLElement = document.createElement('div');
  problemElem.className = 'mb-6 text-md text-gray-800 dark:text-gray-300';
  problemElem.toggleAttribute('data-auto-tailwind', true);
  problemElem.innerHTML = question.getProblem();
  card.appendChild(problemElem);

  // 回答日付表示
  if (ansHistory) {
    const answerDateElem: HTMLElement = document.createElement('div');
    answerDateElem.className = 'text-right text-xs text-gray-500 dark:text-gray-400 mb-6';
    answerDateElem.textContent = `回答日時: ${formatToYMDHMS(ansHistory.getAnswerDate())}`;
    card.appendChild(answerDateElem);
  }

  // 選択肢をまとめるコンテナ
  const choicesContainer: HTMLElement = document.createElement('div');
  choicesContainer.className = 'mb-6 space-y-3';

  // 入力タイプの決定（"radio" か "checkbox"）
  const inputType = question.getSelectionFormat() === 'radio' ? 'radio' : 'checkbox';
  const selectedChoices: number[] = ansHistory ? ansHistory.getSelectChoice() : [];

  // 選択肢リストを生成
  const choiceLabelElems: HTMLElement[] = [];
  question.getChoice().forEach((choiceText, index) => {
    const label: HTMLElement = document.createElement('label');
    label.className = 'flex items-center space-x-2 cursor-pointer min-w-0';
    label.dataset.index = index.toString();

    const input: HTMLInputElement = document.createElement('input');
    input.type = inputType;
    if (inputType === 'radio') {
      input.name = `question-${question.getId()}`;
    }
    input.dataset.index = index.toString();
    if (selectedChoices.includes(index)) {
      input.checked = true;
    }

    const span: HTMLElement = document.createElement('span');
    span.className = 'text-gray-800 dark:text-gray-200 flex-1 min-w-0';
    span.toggleAttribute('data-auto-tailwind', true);
    span.innerHTML = choiceText;

    label.appendChild(input);
    label.appendChild(span);
    choiceLabelElems.push(label);

    // 変更イベント（演習モードの場合のみ、初回回答時に AnsHistory 登録を実施）
    input.addEventListener('change', async () => {
      await checkAnswer(choicesContainer, question, onFirstAnswerCallback);
    });
  });
  if (isRandomC) shuffle(choiceLabelElems);
  choiceLabelElems.forEach(labelElem => {
    choicesContainer.appendChild(labelElem);
  });
  card.appendChild(choicesContainer);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'flex justify-between items-center';
  // 「正解を表示する」ボタン（左側）
  const showAnswerBtn = document.createElement('button');
  showAnswerBtn.className = 'px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700';
  showAnswerBtn.textContent = '正解を表示する';
  buttonContainer.appendChild(showAnswerBtn);
  // 「回答を取り消す」ボタン（右側・初期状態では非表示）
  const cancelAnswerBtn = document.createElement('button');
  cancelAnswerBtn.className = 'hidden px-4 py-2 bg-fuchsia-500 dark:bg-fuchsia-600 text-white rounded hover:bg-fuchsia-600 dark:hover:bg-fuchsia-700';
  cancelAnswerBtn.textContent = '回答を取り消す';
  buttonContainer.appendChild(cancelAnswerBtn);
  card.appendChild(buttonContainer);

  // 正解と解説を表示するコンテナ（初期状態は非表示）
  const answerContainer: HTMLElement = document.createElement('div');
  answerContainer.className = 'mt-4 hidden';
  const hrElem = document.createElement('hr');
  hrElem.className = 'border-t border-gray-200 dark:border-gray-700 my-6';
  answerContainer.appendChild(hrElem);

  // 正解の選択肢表示
  const correctChoices = question.getAnswer().map(idx => question.getChoice()[idx]);
  const answerHeaderElem: HTMLElement = document.createElement('p');
  answerHeaderElem.className = 'mb-2 text-lg font-medium text-green-600 dark:text-green-400';
  answerHeaderElem.textContent = '正解';
  answerContainer.appendChild(answerHeaderElem);

  const answerTextElem: HTMLElement = document.createElement('div');
  answerTextElem.className = 'p-2 rounded border border-green-500 dark:border-green-400 space-y-3';
  correctChoices.forEach(correctChoice => {
    const elem = document.createElement('p');
    elem.className = 'text-green-600 dark:text-green-400 font-semibold';
    elem.toggleAttribute('data-auto-tailwind', true);
    elem.innerHTML = correctChoice;
    answerTextElem.appendChild(elem);
  });
  answerContainer.appendChild(answerTextElem);

  // 解説表示
  const explanationElem: HTMLElement = document.createElement('div');
  explanationElem.className = 'mt-6 text-gray-700 dark:text-gray-300';
  explanationElem.toggleAttribute('data-auto-tailwind', true);
  explanationElem.innerHTML = question.getExplanation();
  answerContainer.appendChild(explanationElem);

  // Container for 設問IDとお気に入りアイコンの表示
  const idAndFavoriteContainer = document.createElement('div');
  idAndFavoriteContainer.className = 'mt-6 flex justify-between items-center text-xs text-gray-700 dark:text-gray-300';

  // お気に入りアイコン
  const favoriteIcon: HTMLElement = document.createElement('button');
  favoriteIcon.setAttribute('type', 'button');
  favoriteIcon.id = 'favoriteBtn';
  favoriteIcon.className = 'w-8 h-8 flex items-center justify-center border border-gray-500 text-gray-500 dark:border-gray-400 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer';
  const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgIcon.classList.add('w-5', 'h-5');
  svgIcon.setAttribute('fill', 'currentColor');
  const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#star');
  svgIcon.appendChild(useElem);
  favoriteIcon.appendChild(svgIcon);
  idAndFavoriteContainer.appendChild(favoriteIcon);
  favoriteDB.selectByQuestionId(question.getId()).then(favorites => {
    if (favorites.length > 0) {
      favoriteIcon.querySelector('svg')?.classList.add('text-yellow-500');
    } else {
      favoriteIcon.querySelector('svg')?.classList.remove('text-yellow-500');
    }
  });
  favoriteIcon.addEventListener('click', async () => {
    const favorites = await favoriteDB.selectByQuestionId(question.getId());
    if (favorites.length > 0) {
      await favoriteDB.deleteById(favorites[0].getId());
      favoriteIcon.querySelector('svg')?.classList.remove('text-yellow-500');
    } else {
      const newFavorite = Favorite.fromRequiredArgs(question.getId(), 1);
      await favoriteDB.insert(newFavorite.generateRow());
      favoriteIcon.querySelector('svg')?.classList.add('text-yellow-500');
    }
  });
  answerContainer.appendChild(idAndFavoriteContainer);
  card.appendChild(answerContainer);

  // 解答履歴の表示
  const historyContainer: HTMLElement = document.createElement('div');
  historyContainer.className = 'mt-4';
  const historyHeader: HTMLElement = document.createElement('h3');
  historyHeader.className = 'text-lg font-medium text-gray-900 dark:text-gray-100';
  historyHeader.textContent = '解答履歴';
  historyContainer.appendChild(historyHeader);
  const toggleButton: HTMLButtonElement = document.createElement('button');
  toggleButton.className = 'text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2';
  toggleButton.textContent = '履歴を表示';
  historyHeader.appendChild(toggleButton);
  const historyListContainer: HTMLElement = document.createElement('div');
  historyListContainer.className = 'flex items-center gap-2 my-2';
  historyListContainer.style.display = 'none'; // 初期状態では非表示
  ansHistoryDB.selectByQuestionId(question.getId()).then(ansHistories => {
    ansHistories.sort((a1, a2) => a1.getId() - a2.getId()).slice(-5).forEach(ansHistory => {
      // 各履歴アイテム用コンテナ
      const historyItem = document.createElement('div');
      historyItem.className = 'flex flex-col items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700';

      // 正否アイコン
      const statusElem = document.createElement('span');
      statusElem.className = 'my-1';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('fill', 'currentColor');

      const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      if (ansHistory.getIsCorrect()) {
        useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#circle');
        statusElem.classList.add('text-green-600', 'dark:text-green-400');
      } else {
        useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#close');
        statusElem.classList.add('text-red-600', 'dark:text-red-400');
      }

      // 回答日時
      const dateElem = document.createElement('span');
      dateElem.className = 'text-xs text-center text-gray-500 dark:text-gray-400';
      dateElem.textContent = formatToYDHM(ansHistory.getAnswerDate());

      svg.appendChild(useElem);
      statusElem.appendChild(svg);

      historyItem.addEventListener('click', async () => {
        const practiceHistory = await practiceHistoryDB.selectById(ansHistory.getPracticeHistoryId());
        await practiceManager.startPractice(practiceHistory.getId());
        if (practiceHistory.getIsAnswered()) {
          setPractciceResultContainer();
        } else {
          setPracticeContainer();
        }
        defaultModal.hide();
        viewUtils.hideSideMenuContent();
        viewUtils.scrollToTop();
      });

      // 各履歴アイテムに追加
      historyItem.appendChild(statusElem);
      historyItem.appendChild(dateElem);

      // 全体の履歴コンテナに追加
      historyListContainer.appendChild(historyItem);
    });
  });
  historyContainer.appendChild(historyListContainer);
  toggleButton.addEventListener('click', () => {
    if (historyListContainer.style.display === 'none' || historyListContainer.style.display === '') {
      historyListContainer.style.display = 'flex';
      toggleButton.textContent = '履歴を非表示';
    } else {
      historyListContainer.style.display = 'none';
      toggleButton.textContent = '履歴を表示';
    }
  });
  card.appendChild(historyContainer);

  // 内包モーダル
  const innerModalElem = document.createElement('div');
  innerModalElem.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 hidden';
  card.appendChild(innerModalElem);
  const innerModal = new Modal(innerModalElem);

  // ボタン押下時の処理で正解・解説表示
  showAnswerBtn.addEventListener('click', () => {
    showAnswerContainer();
  });
  cancelAnswerBtn.addEventListener('click', async () => {
    await practiceManager.cancelAnsHistory(ansHistoryId);
    cancelAnswerBtn.disabled = true;
    ansHistoryId = 0;
    const modal = document.createElement('div');
    modal.className = 'shadow rounded py-12 px-24 text-center text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400';
    modal.textContent = '回答を取り消ししました。'
    innerModal.setModal(modal, ModalSize.LG);
  });

  async function checkAnswer(
    choicesContainer: HTMLElement,
    question: Question,
    onFirstAnswerCallback?: (isCorrect: boolean, selectChoices: number[]) => Promise<number>
  ) {
    const choices = choicesContainer.querySelectorAll('input');
    const checkedList: number[] = [];
    choices.forEach(choice => {
      if ((choice as HTMLInputElement).checked) {
        checkedList.push(Number((choice as HTMLInputElement).dataset.index));
      }
    });
    if (checkedList.length !== question.getAnswer().length) {
      return;
    }
    const sortedAnswers = [...question.getAnswer()].sort((a, b) => a - b);
    const sortedSelects = [...checkedList].sort((a, b) => a - b);
    const isCorrect = sortedAnswers.every((v, i) => v === sortedSelects[i]);

    if (ansHistory === undefined && ansHistoryId === 0 && onFirstAnswerCallback) {
      ansHistoryId = await onFirstAnswerCallback(isCorrect, checkedList);
      cancelAnswerBtn.classList.remove('hidden');
      cancelAnswerBtn.disabled = false;
    }

    const modalElem = document.createElement('div');
    modalElem.className = `shadow rounded py-12 px-24 text-center text-2xl font-bold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`;
    modalElem.textContent = isCorrect ? '正解' : '不正解';
    innerModal.setModal(modalElem);

    setTimeout(() => {
      innerModal.hide();
    }, 800);

    if (isCorrect) {
      showAnswerContainer();
      toggleQuestionIdBlur();
    }
  }

  if (ansHistory && ansHistory.getIsCorrect()) {
    showAnswerContainer();
  }

  function showAnswerContainer() {
    choiceLabelElems.forEach(labelElem => {
      if (question.getAnswer().includes(Number((labelElem as HTMLInputElement).dataset.index))) {
        const span = labelElem.querySelector('span');
        span?.classList.add('text-green-600', 'dark:text-green-400');
      }
    });
    answerContainer.classList.remove('hidden');
  };

  return card;
}
