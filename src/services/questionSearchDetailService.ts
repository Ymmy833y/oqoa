import { AnswerStatus, questionSearchManager, RecentCorrectRateCutoff } from '../managers/questionSearchManager';
import { qListDB } from '../db/QListDB';
import { QList } from '../models';

export async function generateQuestionSearchDetailContainer(): Promise<HTMLElement> {
  const container = document.createElement('div');
  container.className = 'space-y-4';

  // 問題集フィルタ（qLists） - 複数選択可能なセレクトボックス
  container.appendChild(await generateQListFillterConainer());

  // お気に入りのフィルター
  container.appendChild(generateFavoriteFilter());

  // 問題集フィルタのヘッダー
  container.appendChild(document.createElement('hr'));

  // 回答数のフィルター
  container.appendChild(generateAnswerCountFilter());

  // 直近に間違えた設問のみ
  container.appendChild(generateAdvancedFilterOptions());

  // 回答日付のフィルター
  container.appendChild(generateAnswerDateFilter());

  // 設問の回答状況のフィルター
  container.appendChild(generateAnswerStatusFilter());

  const hideBtn = document.createElement('a');
  hideBtn.id = 'hideDetailedSearchBtn';
  hideBtn.textContent = '詳細検索を隠す'
  hideBtn.className = 'flex items-center text-blue-500 dark:text-blue-400 underline cursor-pointer mb-2';
  container.appendChild(hideBtn);

  return container;
}

async function generateQListFillterConainer(): Promise<HTMLElement> {
  const container = document.createElement('div');
  const header = document.createElement('div');
  header.className = 'flex justify-between items-center mb-2';
  const qListLabel = document.createElement('label');
  qListLabel.className = 'block text-md font-medium text-gray-700 dark:text-gray-300';
  qListLabel.textContent = '出題範囲とする問題集';
  header.appendChild(qListLabel);
  const checkboxContainer = document.createElement('div');
  checkboxContainer.className = 'flex items-center space-x-4';

  // 全選択チェックボックス
  const selectAllLabel = document.createElement('label');
  selectAllLabel.className = 'inline-flex items-center cursor-pointer';
  const selectAllCheckbox = document.createElement('input');
  selectAllCheckbox.type = 'checkbox';
  selectAllCheckbox.className = 'form-checkbox h-4 w-4 text-blue-600';
  selectAllCheckbox.id = 'selectAllCheckbox';
  selectAllLabel.appendChild(selectAllCheckbox);
  const selectAllText = document.createElement('span');
  selectAllText.className = 'ml-1 text-sm text-gray-700 dark:text-gray-300';
  selectAllText.textContent = '全選択';
  selectAllLabel.appendChild(selectAllText);
  checkboxContainer.appendChild(selectAllLabel);

  // 全解除チェックボックス
  const deselectAllLabel = document.createElement('label');
  deselectAllLabel.className = 'inline-flex items-center cursor-pointer';
  const deselectAllCheckbox = document.createElement('input');
  deselectAllCheckbox.type = 'checkbox';
  deselectAllCheckbox.className = 'form-checkbox h-4 w-4 text-blue-600';
  deselectAllCheckbox.id = 'deselectAllCheckbox';
  deselectAllLabel.appendChild(deselectAllCheckbox);
  const deselectAllText = document.createElement('span');
  deselectAllText.className = 'ml-1 text-sm text-gray-700 dark:text-gray-300';
  deselectAllText.textContent = '全解除';
  deselectAllLabel.appendChild(deselectAllText);
  checkboxContainer.appendChild(deselectAllLabel);
  header.appendChild(checkboxContainer);
  container.appendChild(header);

  // 問題集ボタン群
  const qListSlections = document.createElement('div');
  qListSlections.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1';
  const qLists = await qListDB.selectByStandard();
  const qListElems: { qList: QList, btn: HTMLElement }[] = [];
  qLists.forEach(qList => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = qList.getName();
    btn.className = 'w-full h-full p-2 border rounded transition-colors bg-white dark:bg-gray-800 text-black dark:text-blue-100 flex items-center justify-center text-center break-words';

    btn.addEventListener('click', () => {
      toggleActive(qList, btn);
    });
    toggleActive(qList, btn, questionSearchManager.query.qLists?.some(q => q.getId() === qList.getId()));
    qListElems.push({ qList, btn });
    qListSlections.appendChild(btn);
  });

  // 選択状態のトグル関数（ダークモード対応追加）
  function toggleActive(qList: QList, btn: HTMLElement, setActive?: boolean) {
    const currentActive = questionSearchManager.query.qLists?.some(q => q.getId() === qList.getId()) ?? false;
    const isActive = (setActive !== undefined) ? setActive : !currentActive;
    if (isActive) {
      btn.classList.add('bg-blue-500', 'dark:bg-blue-600', 'text-white');
      btn.classList.remove('bg-white', 'dark:bg-gray-800', 'text-black', 'dark:text-gray-300');
    } else {
      btn.classList.add('bg-white', 'dark:bg-gray-800', 'text-black', 'dark:text-gray-300');
      btn.classList.remove('bg-blue-500', 'dark:bg-blue-600', 'text-white');
    }
    if (isActive) {
      if (!currentActive) questionSearchManager.query.qLists?.push(qList);
    } else {
      questionSearchManager.query.qLists = questionSearchManager.query.qLists?.filter(q => q.getId() !== qList.getId()) ?? [];
    }
  }

  // 全選択・全解除のイベント
  selectAllCheckbox.addEventListener('click', () => {
    if (selectAllCheckbox.checked) {
      qListElems.forEach(({ qList, btn }) => {
        toggleActive(qList, btn, true);
      });
      deselectAllCheckbox.checked = false;
    }
  });
  deselectAllCheckbox.addEventListener('click', () => {
    if (deselectAllCheckbox.checked) {
      qListElems.forEach(({ qList, btn }) => {
        toggleActive(qList, btn, false);
      });
      selectAllCheckbox.checked = false;
    }
  });
  container.appendChild(qListSlections);
  return container;
}

function generateAnswerStatusFilter(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'space-y-2';

  const label = document.createElement('label');
  label.className = 'block text-md font-medium text-gray-700 dark:text-gray-300 mb-2';
  label.textContent = 'フィルター条件';
  container.appendChild(label);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'flex space-x-4';

  const initialValue = questionSearchManager.query.answerStatus || AnswerStatus.INCLUDE;
  const statuses: AnswerStatus[] = [AnswerStatus.INCLUDE, AnswerStatus.EXCLUDES];
  statuses.forEach((status) => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'inline-flex items-center cursor-pointer';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'answerStatus';
    radio.value = status;
    radio.className = 'form-radio text-blue-600 dark:text-blue-400';
    if (status === initialValue) {
      radio.checked = true;
    }
    radio.addEventListener('change', () => {
      questionSearchManager.query.answerStatus = radio.value as AnswerStatus;
    });

    const span = document.createElement('span');
    span.className = 'ml-2 text-sm text-gray-700 dark:text-gray-300';
    span.textContent = status;

    optionLabel.appendChild(radio);
    optionLabel.appendChild(span);
    optionsContainer.appendChild(optionLabel);
  });

  container.appendChild(optionsContainer);
  return container;
}

function generateAnswerCountFilter(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex flex-col space-y-2';

  const rowContainer = document.createElement('div');
  rowContainer.className = 'flex space-x-4';

  const minContainer = document.createElement('div');
  minContainer.className = 'flex-1';
  const minLabel = document.createElement('label');
  minLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  minLabel.textContent = '最小回答数';
  minContainer.appendChild(minLabel);
  const minInput = document.createElement('input');
  minInput.type = 'number';
  minInput.min = '0';
  minInput.step = '1';
  minInput.placeholder = 'x回以上の回答';
  minInput.className = 'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  minInput.value = questionSearchManager.query.answerCountMin?.toString() ?? '';
  minInput.addEventListener('change', () => {
    questionSearchManager.query.answerCountMin = Number(minInput.value);
  });
  minContainer.appendChild(minInput);

  const maxContainer = document.createElement('div');
  maxContainer.className = 'flex-1';
  const maxLabel = document.createElement('label');
  maxLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  maxLabel.textContent = '最大回答数';
  maxContainer.appendChild(maxLabel);
  const maxInput = document.createElement('input');
  maxInput.type = 'number';
  maxInput.min = '0';
  maxInput.step = '1';
  maxInput.value = questionSearchManager.query.answerCountMax?.toString() ?? '';
  maxInput.placeholder = 'x回以下の回答';
  maxInput.className = 'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  maxInput.addEventListener('change', () => {
    questionSearchManager.query.answerCountMax = Number(maxInput.value);
  });
  maxContainer.appendChild(maxInput);

  rowContainer.appendChild(minContainer);
  rowContainer.appendChild(maxContainer);
  container.appendChild(rowContainer);

  return container;
}

function generateAdvancedFilterOptions(): HTMLElement {
  // グリッドレイアウト: mobile: 1列, md: 2列, lg: 3列
  const container = document.createElement('div');
  container.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';

  // 直近誤答閾値
  const recentWrongField = document.createElement('div');
  recentWrongField.className = 'flex flex-col';
  const recentWrongLabel = document.createElement('label');
  recentWrongLabel.className = 'block text-md font-medium text-gray-700 dark:text-gray-300 mb-2';
  recentWrongLabel.setAttribute('for', 'recentWrongThreshold');
  recentWrongLabel.textContent = '直近誤答閾値 (直近?回以内の誤答有無で抽出)';
  recentWrongField.appendChild(recentWrongLabel);
  const recentWrongInput = document.createElement('input');
  recentWrongInput.type = 'number';
  recentWrongInput.id = 'recentWrongThreshold';
  recentWrongInput.className = 'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  recentWrongInput.min = '0';
  recentWrongInput.step = '1';
  recentWrongInput.value = questionSearchManager.query.recentWrongThreshold?.toString() ?? '0';
  recentWrongInput.addEventListener('change', () => {
    questionSearchManager.query.recentWrongThreshold = Number(recentWrongInput.value);
  });
  recentWrongField.appendChild(recentWrongInput);
  container.appendChild(recentWrongField);

  // 直近5回正答率の閾値のフィールド生成
  const correctRateField = document.createElement('div');
  correctRateField.className = 'flex flex-col';
  const correctRateLabel = document.createElement('label');
  correctRateLabel.className = 'block text-md font-medium text-gray-700 dark:text-gray-300 mb-2';
  correctRateLabel.setAttribute('for', 'correctRateThreshold');
  correctRateLabel.textContent = '直近正答率の閾値';
  correctRateField.appendChild(correctRateLabel);
  const correctRateSelect = document.createElement('select');
  correctRateSelect.id = 'correctRateThreshold';
  correctRateSelect.className = 'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  Object.values(RecentCorrectRateCutoff).forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    if (value === questionSearchManager.query.recentCorrectRateCutoff?.toString()) {
      option.selected = true;
    }
    correctRateSelect.appendChild(option);
  });
  correctRateSelect.addEventListener('change', () => {
    questionSearchManager.query.recentCorrectRateCutoff = correctRateSelect.value as RecentCorrectRateCutoff;
  });
  correctRateField.appendChild(correctRateSelect);
  container.appendChild(correctRateField);
  return container;
}

function generateAnswerDateFilter(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex flex-row space-x-4 items-center';

  // 回答開始日
  const startDateDiv = document.createElement('div');
  startDateDiv.className = 'flex-1';
  const startDateLabel = document.createElement('label');
  startDateLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  startDateLabel.textContent = '回答開始日';
  startDateDiv.appendChild(startDateLabel);
  const startDateInput = document.createElement('input');
  startDateInput.type = 'date';
  startDateInput.value = questionSearchManager.query.answerStartDate?.toISOString().split('T')[0] ?? '';
  startDateInput.className = 'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  startDateInput.addEventListener('change', () => {
    const answerStartDate = startDateInput.value ? new Date(startDateInput.value) : undefined;
    questionSearchManager.query.answerStartDate = answerStartDate;
  });
  startDateDiv.appendChild(startDateInput);

  // 回答終了日
  const endDateDiv = document.createElement('div');
  endDateDiv.className = 'flex-1';
  const endDateLabel = document.createElement('label');
  endDateLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  endDateLabel.textContent = '回答終了日';
  endDateDiv.appendChild(endDateLabel);
  const endDateInput = document.createElement('input');
  endDateInput.type = 'date';
  endDateInput.value = questionSearchManager.query.answerEndDate?.toISOString().split('T')[0] ?? '';
  endDateInput.className = 'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  endDateInput.addEventListener('change', () => {
    const answerEndDate = endDateInput.value ? (() => {
      const date = new Date(endDateInput.value);
      date.setHours(23, 59, 59, 999);
      return date;
    })() : undefined;
    questionSearchManager.query.answerEndDate =   answerEndDate;
  });
  endDateDiv.appendChild(endDateInput);

  container.appendChild(startDateDiv);
  container.appendChild(endDateDiv);

  return container;
}

function generateFavoriteFilter(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex items-center space-x-2';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'favoriteCheckbox';
  checkbox.className = 'form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400';
  checkbox.checked = questionSearchManager.query.isFavorite ?? false;
  checkbox.addEventListener('change', () => {
    questionSearchManager.query.isFavorite = checkbox.checked;
  });

  const label = document.createElement('label');
  label.className = 'block text-md font-medium text-gray-700 dark:text-gray-300';
  label.setAttribute('for', 'favoriteCheckbox');
  label.textContent = 'お気に入りの設問のみ';

  container.appendChild(checkbox);
  container.appendChild(label);

  return container;
}
