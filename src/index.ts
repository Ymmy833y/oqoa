import { initDatabaseAndMigrate } from './services/initDatabase';

import * as ansHistoryService from './services/ansHistoryService';
import * as practiceService from './services/practiceService';
import * as qListService from './services/qListService';
import * as questionService from './services/questionService';
import * as questionSearchDetailService from './services/questionSearchDetailService';
import * as settingService from './services/settingService';

import { questionSearchManager } from './managers/questionSearchManager';

import { defaultModal, ModalSize } from './utils/modal';
import * as viewUtils from './utils/viewUtils';
import { initShortcut } from './utils/shortcut';
import { initGoogleDriveApi } from './api/googleDrive';

export async function renderQListView(): Promise<void> {
  const qListContent: HTMLElement = await qListService.generateQListContent();
  const container = document.getElementById('qListContainer');
  if (container) {
    container.innerHTML = '';
    container.appendChild(qListContent);
  }
}

export async function renderQuestionListPage(currentPage = 1): Promise<void> {
  const qListContent: HTMLElement = await questionService.generateQuestionSearchContent(currentPage);
  const paginationEl = qListContent.querySelector('#paginationContentForQuestions');
  if (paginationEl) {
    paginationEl.addEventListener('pageChange', (e: Event) => {
      const customEvent = e as CustomEvent<{ page: number }>;
      const newPage = customEvent.detail.page;
      renderQuestionListPage(newPage);
    });
  }
  const container = document.getElementById('questionContainer');
  if (container) {
    container.innerHTML = '';
    container.appendChild(qListContent);
  }
}

async function renderQuestonDetailedSearchContainer(): Promise<void> {
  const searchDetailContainer = document.getElementById('searchDetailContainer');
  const toggleLabel = document.getElementById('toggleSearchDetailLabel');
  const toggleIcon = document.getElementById('toggleSearchDetailIcon');
  if (!searchDetailContainer || !toggleLabel || !toggleIcon) return;

  if (searchDetailContainer.classList.contains('hidden')) {
    searchDetailContainer.replaceChildren();
    const container = await questionSearchDetailService.generateQuestionSearchDetailContainer();
    searchDetailContainer.appendChild(container);
    searchDetailContainer.classList.remove('hidden');
    toggleLabel.textContent = '詳細検索を隠す';
    toggleIcon.classList.add('rotate-180');
    container.querySelector('#hideDetailedSearchBtn')?.addEventListener('click', () => {
      renderQuestonDetailedSearchContainer();
    });
  } else {
    document.getElementById('questionListContainer')?.scrollIntoView({ behavior: 'smooth' });
    searchDetailContainer.classList.add('hidden');
    toggleLabel.textContent = '詳細検索を表示';
    toggleIcon.classList.remove('rotate-180');
  }
}

async function renderPracticeHistoryForQList() {
  const practiceHistoryList = document.getElementById('practiceHistoryList');
  const practiceHistoryForQListBtn = document.getElementById('practiceHistoryForQListBtn');
  const practiceHistoryForQuestionBtn = document.getElementById('practiceHistoryForQuestionBtn');
  if (practiceHistoryList && practiceHistoryForQListBtn && practiceHistoryForQuestionBtn) {
    practiceHistoryList.innerHTML = '';
    const practiceHistoryContent = await practiceService.generatePracticeHistoryContent();
    practiceHistoryList.appendChild(practiceHistoryContent);
    togglePracticeHistoryTabBtn(practiceHistoryForQListBtn, practiceHistoryForQuestionBtn);
  }
  viewUtils.showSideMenuContent();
}

async function renderPracticeHistoryForQuestion() {
  const practiceHistoryList = document.getElementById('practiceHistoryList');
  const practiceHistoryForQListBtn = document.getElementById('practiceHistoryForQListBtn');
  const practiceHistoryForQuestionBtn = document.getElementById('practiceHistoryForQuestionBtn');
  if (practiceHistoryList && practiceHistoryForQListBtn && practiceHistoryForQuestionBtn) {
    practiceHistoryList.innerHTML = '';
    const practiceHistoryContent = await ansHistoryService.generateAnsHistoryContent();
    practiceHistoryList.appendChild(practiceHistoryContent);
    togglePracticeHistoryTabBtn(practiceHistoryForQuestionBtn, practiceHistoryForQListBtn);
  }
  viewUtils.showSideMenuContent();
}

function togglePracticeHistoryTabBtn(activeBtn: HTMLElement, inactiveBtn: HTMLElement) {
  const activeClasses = [
    'text-blue-600', 'dark:text-blue-400',
    'border-b-2', 'border-blue-600', 'dark:border-blue-400'
  ];
  const inactiveClasses = [
    'text-gray-600', 'dark:text-gray-300',
    'hover:text-blue-600', 'dark:hover:text-blue-400'
  ];
  activeBtn.classList.remove(...inactiveClasses);
  activeBtn.classList.add(...activeClasses);
  inactiveBtn.classList.remove(...activeClasses);
  inactiveBtn.classList.add(...inactiveClasses);
}

function renderSettingModal() {
  defaultModal.setModal(settingService.generateSettingConetnt(), ModalSize.XXL);
}

function renderCustomQListModal() {
  defaultModal.setModal(qListService.generateCustomQListContent(), ModalSize.XL);
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const sideMenuCloseBtn = document.getElementById('sideMenuCloseBtn');
  const practiceHistoryForQListBtn = document.getElementById('practiceHistoryForQListBtn');
  const practiceHistoryForQuestionBtn = document.getElementById('practiceHistoryForQuestionBtn');
  menuBtn?.addEventListener('click', async () => {
    await renderPracticeHistoryForQList();
  });
  practiceHistoryForQListBtn?.addEventListener('click', async () => {
    await renderPracticeHistoryForQList();
  });
  practiceHistoryForQuestionBtn?.addEventListener('click', async () => {
    await renderPracticeHistoryForQuestion();
  });
  sideMenuCloseBtn?.addEventListener('click', () => {
    viewUtils.hideSideMenuContent();
  });
  const settingBtn = document.getElementById('settingBtn') as HTMLElement;
  settingBtn.addEventListener('click', () => {
    renderSettingModal();
  });

  const defaultModalParent = document.getElementById('defaultModal');
  if (defaultModalParent) {
    defaultModal.initModal(defaultModalParent);
  }

  const toggleDetailedSearchBtn = document.getElementById('toggleDetailedSearchBtn');
  toggleDetailedSearchBtn?.addEventListener('click', async () => {
    await renderQuestonDetailedSearchContainer();
  });
  const questionSearchInput = document.getElementById('questionSearchInput') as HTMLInputElement;
  questionSearchInput.addEventListener('change', () => {
    questionSearchManager.query.word = questionSearchInput.value.trim();
  });
  questionSearchInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      renderQuestionListPage();
    }
  });
  const questionCaseSensitiveCheckbox = document.getElementById('questionCaseSensitiveCheckbox') as HTMLInputElement;
  questionCaseSensitiveCheckbox.addEventListener('change', () => {
    questionSearchManager.query.wordCaseSensitive = questionCaseSensitiveCheckbox.checked;
  });
  const questionSearchBtn = document.getElementById('questionSearchBtn');
  questionSearchBtn?.addEventListener('click', () => {
    renderQuestionListPage();
  });
  const createCustomQListBtn = document.getElementById('createCustomQListBtn') as HTMLElement;
  createCustomQListBtn.addEventListener('click', () => {
    renderCustomQListModal();
  });

  const prevQuestionBtn = document.getElementById('prevQuestionBtn');
  prevQuestionBtn?.addEventListener('click', () => {
    practiceService.setPrevQuestion();
  });
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');
  nextQuestionBtn?.addEventListener('click', () => {
    practiceService.setNextQuestion();
  });

  initDatabaseAndMigrate()
    .then(() => {
      console.log('App is starting...');
      renderQListView();
      renderQuestionListPage();
      questionSearchManager.initQuery();
    })
    .catch((err) => {
      console.error('Failed to initialize database and migrate:', err);
    });
  initGoogleDriveApi()
    .then(async () => {
      console.log('Google Drive API initialized successfully.');
      renderQListView();
      renderQuestionListPage();
    })
    .catch((err) => {
      console.error('Failed to initialize Google Drive API:', err);
    });
  initShortcut();
});
