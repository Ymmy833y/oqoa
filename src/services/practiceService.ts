import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { qListDB } from '../db/QListDB';
import { practiceRelatedContent, practiceManager } from '../managers/practiceManager';
import { AnsHistory, PracticeHistory, QList, Question } from '../models';
import { defaultModal, generateConfirmModalContent, ModalSize } from '../utils/modal';
import { formatToYMDHMS } from '../utils/utils';
import * as viewUtils from '../utils/viewUtils';
import { generateQuestionContent, generateQuestionListContent } from './questionService';
import { generateEditQListNameContent } from './qListService';
import { generateReviewContent } from './reviewService';
import { ansHistoryDB } from '../db/AnsHistoryDB';

/**
 * 指定された QList インスタンスをもとに、演習開始画面（カード形式）のコンテンツを生成します。
 *
 * @param qList 問題集の詳細情報を保持する QList インスタンス
 * @returns 演習開始画面の HTMLElement
 */
export function generatePracticeStartContent(qList: QList): HTMLElement {
  // カード全体のコンテナ
  const card: HTMLElement = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 p-6 shadow rounded mb-6';

  // タイトル（問題集名称）表示
  const titleElem: HTMLElement = document.createElement('h2');
  titleElem.className = 'text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100';
  titleElem.textContent = qList.getName();
  card.appendChild(titleElem);

  // 詳細情報の表示エリア
  const detailContainer: HTMLElement = document.createElement('div');
  detailContainer.className = 'mb-6 space-y-2 border-b dark:border-gray-700 pb-4';

  // 問題数表示
  const countElem: HTMLElement = document.createElement('p');
  countElem.className = 'text-sm text-gray-700 dark:text-gray-300';
  countElem.textContent = `問題数： ${qList.getQuestions().length}問`;
  detailContainer.appendChild(countElem);

  // 問題集種別表示（true: 標準問題、false: カスタム問題）
  const typeElem: HTMLElement = document.createElement('p');
  typeElem.className = 'text-sm text-gray-700 dark:text-gray-300';
  typeElem.textContent = `問題集種別： ${qList.getIsDefault() ? '標準問題' : 'カスタム問題'}`;
  detailContainer.appendChild(typeElem);

  card.appendChild(detailContainer);

  // オプション群をまとめるコンテナ
  const optionsContainer: HTMLElement = document.createElement('div');
  optionsContainer.className = 'space-y-4 mb-6';

  // 問題の出題順の並び替えオプション
  const shuffleQuestionsOption = viewUtils.createOption('shuffleQuestionsCheckbox', '問題の出題順を並び替えるか');
  optionsContainer.appendChild(shuffleQuestionsOption);

  // 選択肢の並び替えオプション
  const shuffleChoicesOption = viewUtils.createOption('shuffleChoicesCheckbox', '選択肢を並び替えるか');
  optionsContainer.appendChild(shuffleChoicesOption);

  card.appendChild(optionsContainer);

  // 演習開始ボタン
  const startBtn: HTMLButtonElement = document.createElement('button');
  startBtn.className = 'w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700';
  startBtn.textContent = '演習開始';
  startBtn.addEventListener('click', async () => {
    const shuffleQuestions = (document.getElementById('shuffleQuestionsCheckbox') as HTMLInputElement).checked;
    const shuffleChoices = (document.getElementById('shuffleChoicesCheckbox') as HTMLInputElement).checked;

    await practiceManager.createAndStartPractice(qList.getId(), shuffleQuestions, shuffleChoices, false);
    defaultModal.hide();
    setPracticeContainer();
    viewUtils.scrollToTop();
  });
  card.appendChild(startBtn);

  return card;
}

export function setPracticeContainer() {
  practiceRelatedContent.qListTitle.textContent = practiceManager.qListTitle;
  practiceRelatedContent.totalQuestionsText.textContent = `${practiceManager.totalQuestion}`;
  const { question, ansHistory } = practiceManager.currentQuestionDetail;
  setPracticeQuestionContainer(generateExerciseQuestionContent(question, ansHistory));
  hidePractciceResultContainer();
  showPracticeContainer();
}

function setPracticeQuestionContainer(questionContainer: HTMLElement) {
  practiceRelatedContent.currentQuestionNumberText.textContent = `${practiceManager.currentQuestionNumber}`;
  practiceRelatedContent.practiceQuestionContainer.replaceChildren();
  practiceRelatedContent.practiceQuestionContainer.appendChild(questionContainer);
}

export function setNextQuestion() {
  const optionalPracticeItem = practiceManager.getNextQuestionDetail();
  if (optionalPracticeItem !== null) {
    const { question, ansHistory } = optionalPracticeItem;
    setPracticeQuestionContainer(generateExerciseQuestionContent(question, ansHistory));
    return;
  }

  if (practiceManager.isAllQuestionsSolved) {
    practiceManager.markAsAnswered();
    setPractciceResultContainer();
    return;
  }
  const modalElem = document.createElement('div');
  modalElem.className = 'shadow rounded py-12 px-4 text-center text-2xl';
  modalElem.textContent = 'この問題が最後の問題です';
  defaultModal.setModal(modalElem);
}

export function setPrevQuestion() {
  const optionalPracticeItem = practiceManager.getPrevQuestionDetail();
  if (optionalPracticeItem !== null) {
    const { question, ansHistory } = optionalPracticeItem;
    setPracticeQuestionContainer(generateExerciseQuestionContent(question, ansHistory));
    return;
  }
  const modalElem = document.createElement('div');
  modalElem.className = 'shadow rounded py-12 px-4 text-center text-2xl';
  modalElem.textContent = 'この問題が最初の問題です';
  defaultModal.setModal(modalElem);
}

export function hidePracticeContainer() {
  practiceRelatedContent.practiceContainer.classList.add('hidden');
}

export function showPracticeContainer() {
  practiceRelatedContent.practiceContainer.classList.remove('hidden');
}

function generateExerciseQuestionContent(question: Question, ansHistory?: AnsHistory): HTMLElement {
  return generateQuestionContent(question, ansHistory, practiceManager.isRandomC, practiceManager.entryAnsHistory.bind(practiceManager));
}

/**
 * 演習終了後の結果表示画面を生成する関数
 */
export function generatePractciceResultContainer() {
  const container: HTMLElement = document.createElement('div');
  container.className = 'space-y-6';

  // 問題集名（タイトル）
  const titleElem: HTMLElement = document.createElement('h2');
  titleElem.className = 'text-3xl font-bold text-center text-gray-900 dark:text-gray-100';
  titleElem.textContent = practiceManager.qListTitle;
  container.appendChild(generateEditQListNameContent(practiceManager.qList));

  // 結果サマリ（円グラフとテキストを左右に分割）
  const resultSummaryContainer: HTMLElement = document.createElement('div');
  resultSummaryContainer.className = 'flex items-center mb-6';

  // 正解数と合計問題数
  const correctCount = practiceManager.correctAnswerCount;
  const total = practiceManager.totalQuestion;
  const percentage = total > 0 ? correctCount / total : 0;
  const rate = Math.round(percentage * 100);

  // 左側のコンテナ：円グラフ
  const svgContainer: HTMLElement = document.createElement('div');
  svgContainer.className = 'w-1/3 flex justify-center';
  const pieChart = viewUtils.createPieChart(percentage, 100);
  svgContainer.appendChild(pieChart);

  // 右側のテキスト表示コンテナ
  const textContainer: HTMLElement = document.createElement('div');
  textContainer.className = 'w-2/3';

  // テキスト表示（正解数、正答率）－ 背景色、パディング、角丸、影、中央揃え
  const summaryText: HTMLElement = document.createElement('div');
  summaryText.className = 'rounded-lg shadow text-center p-6 space-y-4 w-full bg-white dark:bg-gray-800';
  summaryText.innerHTML = `
    <p class="text-xl text-gray-800 dark:text-gray-200">
      正答率<span class="font-bold text-4xl text-blue-600 dark:text-blue-400 ml-2">${rate}%</span>
    </p>
    <p class="text-lg text-gray-900 dark:text-gray-100 mb-2">
      正解数<span class="font-bold text-green-600 dark:text-green-400 text-xl ml-2">${correctCount}</span> / 
      <span class="font-bold text-gray-700 dark:text-gray-300 text-xl">${total}</span> 問
    </p>
  `;
  textContainer.appendChild(summaryText);

  // 両者を resultSummaryContainer に追加
  resultSummaryContainer.appendChild(svgContainer);
  resultSummaryContainer.appendChild(textContainer);
  container.appendChild(resultSummaryContainer);

  // ボタン群（中央揃え）
  const buttonsContainer: HTMLElement = document.createElement('div');
  buttonsContainer.className = 'flex justify-center space-x-6';
  // 再試ボタン
  const retryBtn: HTMLButtonElement = document.createElement('button');
  retryBtn.textContent = '再試';
  retryBtn.className = 'px-6 py-2 bg-yellow-500 dark:bg-yellow-600 text-white rounded hover:bg-yellow-600 dark:hover:bg-yellow-700';
  retryBtn.addEventListener('click', () => {
    defaultModal.setModal(generatePracticeStartContent(practiceManager.qList), ModalSize.XL);
  });
  buttonsContainer.appendChild(retryBtn);
  // 復習ボタン
  const reviewBtn: HTMLButtonElement = document.createElement('button');
  reviewBtn.textContent = '復習';
  reviewBtn.className = `px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded ${correctCount === total ? 'disabled:cursor-not-allowed' : 'hover:bg-blue-600 dark:hover:bg-blue-700'}`;
  reviewBtn.addEventListener('click', () => {
    defaultModal.setModal(generateReviewContent(), ModalSize.XL);
  });
  if (correctCount === total) {
    reviewBtn.disabled = true;
  }
  buttonsContainer.appendChild(reviewBtn);
  container.appendChild(buttonsContainer);

  // 出題された全ての問題のリスト
  const detailSection: HTMLElement = document.createElement('div');
  detailSection.className = 'mt-6';
  const detailContent = generateQuestionListContent(practiceManager.generateQuestionResultDetails());
  detailSection.appendChild(detailContent);
  container.appendChild(detailSection);

  return container;
}

export function setPractciceResultContainer() {
  practiceRelatedContent.practciceResultContainer.replaceChildren();
  practiceRelatedContent.practciceResultContainer.appendChild(generatePractciceResultContainer());
  hidePracticeContainer();
  showPractciceResultContainer();
}

function hidePractciceResultContainer() {
  practiceRelatedContent.practciceResultContainer.classList.add('hidden');
}

function showPractciceResultContainer() {
  practiceRelatedContent.practciceResultContainer.classList.remove('hidden');
}

export async function generatePracticeHistoryContent(): Promise<HTMLElement> {
  const container = document.createElement('div');
  const practiceHistories = await practiceHistoryDB.selectAllOrderDesc();

  const pageSize = 10;
  let page = 1;
  const totalPages = Math.floor(practiceHistories.length / pageSize) + (practiceHistories.length % pageSize === 0 ? 0 : 1);
  if (totalPages > 1) {
    const paginationContent = viewUtils.generatePagination(page, totalPages);
    paginationContent.addEventListener('pageChange', (event: Event) => {
      ({ page } =  (event as CustomEvent).detail);
      updateItem();
    });
    container.appendChild(paginationContent);
  }
  const itemListContainer: HTMLElement = document.createElement('div');
  itemListContainer.className = 'space-y-2';

  async function updateItem() {
    itemListContainer.innerHTML = '';

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const sortedItems = practiceHistories.slice(startIndex, endIndex);
    for (const practiceHistory of sortedItems) {
      const card = await generatePracticeHistoryItemContent(practiceHistory);
      if (card) {
        itemListContainer.appendChild(card);
      }
    }
    container.appendChild(itemListContainer);
  }
  updateItem();
  return container;
}

async function generatePracticeHistoryItemContent(practiceHistory: PracticeHistory): Promise<HTMLElement> {
  const container = document.createElement('div');
  container.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700';
  const qList = await qListDB.selectById(practiceHistory.getQListId());

  const headerRow = document.createElement('div');
  headerRow.className = 'flex items-center justify-between mb-2';
  // 問題集名の表示（タイトル）
  const titleElem = document.createElement('h3');
  titleElem.className = 'text-xl font-bold mb-2 text-gray-900 dark:text-gray-100 cursor-pointer';
  titleElem.textContent = qList.getName();
  headerRow.appendChild(titleElem);

  // 削除ボタン
  const deleteButton = document.createElement('span');
  deleteButton.className = 'px-2 py-1 rounded text-xs font-semibold cursor-pointer bg-red-500 text-white dark:bg-red-600';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'currentColor');
  const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#trash');
  svg.appendChild(useElem);
  deleteButton.appendChild(svg);
  deleteButton.addEventListener('click', async () => {
    const modalContent = (practiceManager.practiceHistoryId === practiceHistory.getId())
      ? generateConfirmModalContent(
        '現在の演習中の問題集は削除できません',
        () => { defaultModal.hide() }
      )
      : generateConfirmModalContent(
        'この問題集を削除しますか？',
        async () => {
          await practiceHistoryDB.deleteById(practiceHistory.getId());
          await ansHistoryDB.deleteByPracticeHistoryId(practiceHistory.getId());
          defaultModal.hide();
          viewUtils.hideSideMenuContent();
          viewUtils.scrollToTop();
        },
        () => { defaultModal.hide() }
      );
    defaultModal.setModal(modalContent, ModalSize.DEFAULT);
  });
  headerRow.appendChild(deleteButton);
  container.appendChild(headerRow);

  // ステータス行（回答済みフラグと作成日時）
  const infoRow = document.createElement('div');
  infoRow.className = 'flex items-center justify-between text-sm text-gray-700 dark:text-gray-300';

  // ラベルコンテナ
  const labelContainer = document.createElement('div');
  labelContainer.className = 'flex items-center space-x-2';

  // ステータスラベル：回答済みの場合は「回答済み」、未回答の場合は「演習中」
  const statusLabel = document.createElement('span');
  statusLabel.className = 'px-2 py-1 rounded text-xs font-semibold';
  if (practiceHistory.getIsAnswered()) {
    statusLabel.textContent = '回答済み';
    statusLabel.classList.add('bg-green-500', 'text-white', 'dark:bg-green-600');
  } else {
    statusLabel.textContent = '演習中';
    statusLabel.classList.add('bg-yellow-500', 'text-white', 'dark:bg-yellow-600');
  }
  labelContainer.appendChild(statusLabel);

  // isDefaultラベル
  const defaultLabel = document.createElement('span');
  defaultLabel.className = 'px-2 py-1 rounded text-xs font-semibold cursor-pointer';
  if (qList.getIsDefault()) {
    defaultLabel.textContent = '標準問題';
    defaultLabel.classList.add('bg-blue-500', 'text-white', 'dark:bg-blue-600');
    defaultLabel.addEventListener('click', async () => {
      if (qList.getUuid() === undefined) {
        const modalContent = generateConfirmModalContent(
          'この問題集を標準問題に切り替えることはできません。',
          () => { defaultModal.hide(); }
        );
        defaultModal.setModal(modalContent, ModalSize.DEFAULT);
      } else {
        const modalContent = generateChangeIsDefaultModalContent(qList, true);
        defaultModal.setModal(modalContent, ModalSize.DEFAULT);
      }
    });
  } else {
    defaultLabel.textContent = 'カスタム問題';
    defaultLabel.classList.add('bg-purple-500', 'text-white', 'dark:bg-purple-600');
    defaultLabel.addEventListener('click', async () => {
      const modalContent = generateChangeIsDefaultModalContent(qList, false);
      defaultModal.setModal(modalContent, ModalSize.DEFAULT);
    });
  }
  labelContainer.appendChild(defaultLabel);
  infoRow.appendChild(labelContainer);

  // 作成日時表示（右側に配置）
  const dateElem = document.createElement('span');
  dateElem.textContent = formatToYMDHMS(practiceHistory.getCreateAt());
  infoRow.appendChild(dateElem);
  container.appendChild(infoRow);

  titleElem.addEventListener('click', async () => {
    await practiceManager.startPractice(practiceHistory.getId());
    if (practiceHistory.getIsAnswered()) {
      setPractciceResultContainer();
    } else {
      setPracticeContainer();
    }
    viewUtils.hideSideMenuContent();
    viewUtils.scrollToTop();
  });
  return container;
}

function generateChangeIsDefaultModalContent(qList: QList, isDefault: boolean): HTMLElement {
  return generateConfirmModalContent(
    isDefault ? 'この問題集をカスタム問題に切り替えますか？' : 'この問題集を標準問題に切り替えますか？',
    async () => {
      qList.setIsDefault(!isDefault);
      await qListDB.update(qList.generateRow());
      defaultModal.hide();
      viewUtils.hideSideMenuContent();
      viewUtils.scrollToTop();
    },
    () => { defaultModal.hide() }
  );
}
