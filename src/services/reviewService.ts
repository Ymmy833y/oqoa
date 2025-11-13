import { qListDB } from '../db/QListDB';
import { practiceManager } from '../managers/practiceManager';
import { QList } from '../models';
import { defaultModal } from '../utils/modal';
import { formatToYDHM } from '../utils/utils';
import * as viewUtils from '../utils/viewUtils';
import { setPracticeContainer } from './practiceService';

/**
 * 復習開始画面（カード形式）のコンテンツを生成します。
 *
 * @returns 復習開始画面の HTMLElement
 */
export function generateReviewContent(): HTMLElement {
  // カード全体のコンテナ
  const card: HTMLElement = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 p-6 shadow rounded mb-6';

  const qListTitle = `【復習】${practiceManager.qListTitle} - ${formatToYDHM(new Date().toISOString())}`;

  // タイトル（問題集名称）表示
  const titleElem: HTMLElement = document.createElement('h2');
  titleElem.className = 'text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100';
  titleElem.textContent = qListTitle;
  card.appendChild(titleElem);

  // 詳細情報の表示エリア
  const detailContainer: HTMLElement = document.createElement('div');
  detailContainer.className = 'mb-6 space-y-2 border-b dark:border-gray-700 pb-4';

  // 問題数表示
  const countElem: HTMLElement = document.createElement('p');
  countElem.className = 'text-sm text-gray-700 dark:text-gray-300';
  countElem.textContent = `問題数： ${practiceManager.totalQuestion - practiceManager.correctAnswerCount}問`;
  detailContainer.appendChild(countElem);

  // 問題集種別表示（true: 標準問題、false: カスタム問題）
  const typeElem: HTMLElement = document.createElement('p');
  typeElem.className = 'text-sm text-gray-700 dark:text-gray-300';
  typeElem.textContent = '問題集種別： カスタム問題';
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

  // 復習開始ボタン
  const startBtn: HTMLButtonElement = document.createElement('button');
  startBtn.className = 'w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700';
  startBtn.textContent = '復習開始';
  startBtn.addEventListener('click', async () => {
    const shuffleQuestions = (document.getElementById('shuffleQuestionsCheckbox') as HTMLInputElement).checked;
    const shuffleChoices = (document.getElementById('shuffleChoicesCheckbox') as HTMLInputElement).checked;

    const qList = QList.fromCreateNew(qListTitle, practiceManager.incorrectQuestions, false);
    const qListId = await qListDB.insert(qList.generateRow());
    await practiceManager.createAndStartPractice(qListId, shuffleQuestions, shuffleChoices, true);
    defaultModal.hide();
    setPracticeContainer();
    viewUtils.scrollToTop();
  });
  card.appendChild(startBtn);

  return card;
}
