import { qListDB } from '../db/QListDB';
import { questionSearchManager } from '../managers/questionSearchManager';
import { QList } from '../models';
import { defaultModal, ModalSize } from '../utils/modal';
import { generatePracticeStartContent, setPracticeContainer } from './practiceService';
import * as viewUtils from '../utils/viewUtils';
import * as utils from '../utils/utils';
import { practiceManager } from '../managers/practiceManager';

/**
 * 問題集一覧のコンテンツを生成します。
 * 返り値は、DOM操作で差し込むための親要素となる HTMLElement です。
 */
export async function generateQListContent(): Promise<HTMLElement> {
  const qLists: QList[] = await qListDB.selectByStandard();

  const container: HTMLElement = document.createElement('div');
  container.id = 'qListBtnList';
  container.className = 'grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  qLists.forEach((qList: QList) => {
    const button: HTMLButtonElement = document.createElement('button');
    button.textContent = qList.getName() || 'Unnamed';
    if (qList.getId() !== undefined) {
      button.dataset.id = qList.getId().toString();
    }
    button.className = 'w-full text-left px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 rounded shadow cursor-pointer';
    button.addEventListener('click', () => {
      defaultModal.setModal(generatePracticeStartContent(qList), ModalSize.XL);
    });
    container.appendChild(button);
  });
  return container;
}

/**
 * カスタム問題集作成画面（カード形式）のコンテンツを生成します。
 *
 * @returns カスタム問題集作成画面の HTMLElement
 */
export function generateCustomQListContent(): HTMLElement {
  const questions = [...questionSearchManager.questions];
  // カード全体のコンテナ
  const container: HTMLElement = document.createElement('div');
  container.className = 'bg-white dark:bg-gray-800 p-6 shadow rounded mb-6';

  // ヘッダーセクションの作成
  const header = document.createElement('div');
  header.className = 'mb-4';
  const titleElem = document.createElement('h2');
  titleElem.className = 'text-2xl font-bold text-gray-900 dark:text-gray-100';
  titleElem.textContent = 'カスタム問題集の作成';
  header.appendChild(titleElem);
  const subtitleElem = document.createElement('p');
  subtitleElem.className = 'mt-1 text-sm text-gray-600 dark:text-gray-300';
  subtitleElem.textContent = '設問一覧にて表示されている設問から問題集を作成します。';
  header.appendChild(subtitleElem);
  container.appendChild(header);

  // タイトル入力欄
  const titleField = document.createElement('div');
  titleField.className = 'mb-4';
  const titleLabel = document.createElement('label');
  titleLabel.className = 'block text-md font-medium text-gray-700 dark:text-gray-300 mb-2';
  titleLabel.setAttribute('for', 'customQListTitle');
  titleLabel.textContent = '問題集タイトル';
  titleField.appendChild(titleLabel);
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.id = 'customQListTitle';
  titleInput.className =
    'w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  titleInput.value = `カスタム問題集 ${utils.formatToYDHM(new Date().toISOString())}`;
  titleField.appendChild(titleInput);
  container.appendChild(titleField);

  // 出題する問題数の選択
  const questionCountField = document.createElement('div');
  questionCountField.className = 'mb-6';
  const questionCountLabel = document.createElement('label');
  questionCountLabel.className = 'block text-md font-medium text-gray-700 dark:text-gray-300 mb-2';
  questionCountLabel.setAttribute('for', 'customQuestionCount');
  questionCountLabel.textContent = '出題する問題数';
  questionCountField.appendChild(questionCountLabel);
  const selectContainer = document.createElement('div');
  selectContainer.className = 'flex items-center';
  const questionCountSelect = document.createElement('select');
  questionCountSelect.id = 'customQuestionCount';
  questionCountSelect.className =
    'flex-grow p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  [5, 10, 20, 30, 40, 50, 65, 100, 9999].forEach(count => {
    const option = document.createElement('option');
    option.value = count.toString();
    option.textContent = `${count}問`;
    questionCountSelect.appendChild(option);
  });
  questionCountSelect.value = '50';
  selectContainer.appendChild(questionCountSelect);
  const maxCountSpan = document.createElement('span');
  maxCountSpan.className = 'ml-2 text-sm text-gray-600 dark:text-gray-300';
  maxCountSpan.textContent = ` / ${questions.length}`;
  selectContainer.appendChild(maxCountSpan);
  questionCountField.appendChild(selectContainer);
  container.appendChild(questionCountField);

  // オプション群：出題順、選択肢の並び替え
  const optionsContainer: HTMLElement = document.createElement('div');
  optionsContainer.className = 'space-y-4 mb-6';
  const shuffleQuestionsOption = viewUtils.createOption('shuffleQuestionsCheckbox', '問題の出題順を並び替えるか');
  optionsContainer.appendChild(shuffleQuestionsOption);
  const shuffleChoicesOption = viewUtils.createOption('shuffleChoicesCheckbox', '選択肢を並び替えるか');
  optionsContainer.appendChild(shuffleChoicesOption);
  container.appendChild(optionsContainer);

  // 演習開始ボタン
  const startBtn: HTMLButtonElement = document.createElement('button');
  startBtn.className = 'w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700';
  startBtn.textContent = '演習開始';
  if (questions.length === 0) {
    startBtn.disabled = true;
    startBtn.classList.add('disabled:cursor-not-allowed');
    const alert = document.createElement('div');
    alert.className = 'mb-2';
    alert.innerHTML = `
      <div class="border border-red-400 dark:border-red-500 rounded bg-red-100 dark:bg-red-800 px-4 py-3 text-red-700 dark:text-red-100">
        <p>出題する設問がないため、問題集を作成できません。</p>
      </div>`;
    container.appendChild(alert);
  }
  startBtn.addEventListener('click', async () => {
    const shuffleQuestions = (document.getElementById('shuffleQuestionsCheckbox') as HTMLInputElement).checked;
    const shuffleChoices = (document.getElementById('shuffleChoicesCheckbox') as HTMLInputElement).checked;
    const title = titleInput.value.trim() || 'カスタム問題集';
    const selectedCount = parseInt(questionCountSelect.value, 10);
    if (shuffleQuestions) {
      utils.shuffle(questions);
    }
    const questionIds = questions.slice(0, selectedCount).map(q => q.getId());
    const qList = QList.fromCreateNew(title, questionIds, false);
    const qListId = await qListDB.insert(qList.generateRow());
    await practiceManager.createAndStartPractice(qListId, shuffleQuestions, shuffleChoices, true);
    defaultModal.hide();
    setPracticeContainer();
    viewUtils.scrollToTop();
  });
  container.appendChild(startBtn);

  return container;
}

/**
 * カスタム問題集のタイトルを編集するコンテンツを生成します。
 * @param qList　カスタム問題集の情報
 * @return カスタム問題集のタイトル編集画面の HTMLElement
 */
export function generateEditQListNameContent(qList: QList): HTMLElement {
  const container: HTMLElement = document.createElement('div');

  const titleElem: HTMLElement = document.createElement('h2');
  if (!qList.getIsDefault()) {
    titleElem.style.cursor = 'pointer';
  }
  titleElem.className = 'text-3xl font-bold text-center text-gray-900 dark:text-gray-100';
  titleElem.textContent = qList.getName();
  container.appendChild(titleElem);

  const titleInput: HTMLInputElement = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = qList.getName();
  titleInput.style.display = 'none';
  titleInput.className = 'mt-2 w-full p-2 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  container.appendChild(titleInput);

  // タイトルをクリックすると編集可能にする
  titleElem.addEventListener('click', () => {
    if (qList.getIsDefault()) return; // デフォルト問題集は編集不可
    titleElem.style.display = 'none';
    titleInput.style.display = 'block';
    titleInput.focus();
  });

  titleInput.addEventListener('blur', () => {
    const newTitle = titleInput.value.trim();
    if (newTitle) {
      titleElem.textContent = newTitle;
      qList.setName(newTitle);
      qListDB.update(qList.generateRow());
    }
    titleElem.textContent = newTitle;
    titleElem.style.display = 'block';
    titleInput.style.display = 'none';
  });

  return container;
}
