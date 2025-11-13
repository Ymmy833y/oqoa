import { ansHistoryDB } from '../db/AnsHistoryDB';
import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { qListDB } from '../db/QListDB';
import { questionDB } from '../db/QuestionDB';
import { practiceManager } from '../managers/practiceManager';
import { AnsHistory } from '../models';
import { defaultModal, ModalSize } from '../utils/modal';
import { formatToYMDHMS, removeTagContent } from '../utils/utils';
import * as viewUtils from '../utils/viewUtils';
import { setPractciceResultContainer, setPracticeContainer } from './practiceService';
import { generateQuestionContent } from './questionService';

export async function generateAnsHistoryContent(): Promise<HTMLElement> {
  const container: HTMLElement = document.createElement('div');
  const ansHistories = await ansHistoryDB.selectAll();

  const sortOptions: viewUtils.SortOption[] = [
    { key: 'id', displayName: 'ID順' },
    { key: 'date', displayName: '回答日時順', default: true, isAscendingDefault: false },
  ];
  const pageSize = 20;
  let key = 'date', isAsc = false, page = 1;
  const totalPages = Math.floor(ansHistories.length / pageSize) + (ansHistories.length % pageSize === 0 ? 0 : 1);

  const sortWrapper = document.createElement('div');
  sortWrapper.className = 'flex justify-end';
  const sortContainer = viewUtils.generateSortOption(sortOptions);
  sortContainer.addEventListener('sortChange', (event: Event) => {
    ({ key, isAsc } = (event as CustomEvent).detail);
    updateItem();
  });
  sortWrapper.appendChild(sortContainer);
  container.appendChild(sortWrapper);

  if (totalPages > 1) {
    const paginationContent = viewUtils.generatePagination(page, totalPages);
    paginationContent.addEventListener('pageChange', (event: Event) => {
      ({ page } =  (event as CustomEvent).detail);
      updateItem();
    });
    container.appendChild(paginationContent);
  }

  const itemListContainer = document.createElement('div');
  itemListContainer.className = 'space-y-2';

  const updateItem = async() => {
    itemListContainer.innerHTML = '';
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const sortedItems = ansHistories.sort((a1, a2) => {
      if (key === 'id') {
        return isAsc ? a1.getQuestionId() - a2.getQuestionId() : a2.getQuestionId() - a1.getQuestionId();
      } else {
        return isAsc
          ? new Date(a1.getAnswerDate()).getTime() - new Date(a2.getAnswerDate()).getTime()
          : new Date(a2.getAnswerDate()).getTime() - new Date(a1.getAnswerDate()).getTime();
      }
    }).slice(startIndex, endIndex);

    for (const ansHistory of sortedItems) {
      const card = await generateAnsHistoryItemContent(ansHistory);
      if (card) {
        itemListContainer.appendChild(card);
      }
    }
    container.appendChild(itemListContainer);
  }

  updateItem();
  return container;
}

async function generateAnsHistoryItemContent(ansHistory: AnsHistory): Promise<HTMLElement | null> {
  const question = questionDB.selectById(ansHistory.getQuestionId());
  if (!question) return null;
  const practiceHistory = await practiceHistoryDB.selectById(ansHistory.getPracticeHistoryId());
  const qList = await qListDB.selectById(practiceHistory.getQListId());

  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 p-4 rounded shadow border dark:border-gray-700';

  // 1行目：問題ID＋問題文＋正誤アイコン
  const line1 = document.createElement('div');
  line1.className = 'flex items-center justify-between cursor-pointer hover:font-bold';

  const textSpan = document.createElement('span');
  textSpan.className = 'flex-1 min-w-0 text-left truncate';
  textSpan.textContent = `#${question.getId()}: ${removeTagContent(question.getProblem())}`;
  line1.appendChild(textSpan);

  const statusLabel = document.createElement('span');
  statusLabel.className = 'ml-2 flex-shrink-0';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'currentColor');
  const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  if (ansHistory.getIsCorrect()) {
    useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#circle');
    statusLabel.classList.add('text-green-600', 'dark:text-green-400');
  } else {
    useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#close');
    statusLabel.classList.add('text-red-600', 'dark:text-red-400');
  }
  svg.appendChild(useElem);
  statusLabel.appendChild(svg);
  line1.appendChild(statusLabel);
  card.appendChild(line1);

  // line1 のクリックイベント（例：詳細画面を表示）
  line1.addEventListener('click', () => {
    defaultModal.setModal(generateQuestionContent(question, ansHistory), ModalSize.XL);
  });

  // 2行目：問題集名の表示
  const line2 = document.createElement('p');
  line2.className = 'mt-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400';
  line2.textContent = `問題集名: ${qList.getName()}`;
  card.appendChild(line2);

  // line2 のクリックイベント（例：問題集詳細表示）
  line2.addEventListener('click', async () => {
    await practiceManager.startPractice(practiceHistory.getId());
    if (practiceHistory.getIsAnswered()) {
      setPractciceResultContainer();
    } else {
      setPracticeContainer();
    }
    viewUtils.hideSideMenuContent();
    viewUtils.scrollToTop();
  });

  // 3行目：作成日時（右寄せ）
  const line3 = document.createElement('div');
  line3.className = 'mt-2 text-right text-xs text-gray-500 dark:text-gray-400';
  line3.textContent = formatToYMDHMS(ansHistory.getAnswerDate());
  card.appendChild(line3);
  return card;
}
