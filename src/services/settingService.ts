import { renderQListView, renderQuestionListPage } from '..';
import { importProbelmForGoogleDrive } from '../api/googleDrive';
import { attachStorageSync, GDriveStorageKeys, getStoredClientId, getStoredFolderId, setStoredClientId, setStoredFolderId } from '../utils/googleDriveKey';
import { Modal, ModalSize } from '../utils/modal';
import { getCurrentTheme, setCurrentTheme, Theme } from '../utils/theme';
import { exportCsv } from './csvExportService';
import { importCsv } from './csvImportService';
import { deleteAllDBs } from './initDatabase';

export function generateSettingConetnt() {
  const container = document.createElement('div');
  container.className =
    'bg-white dark:bg-gray-800 p-6 shadow rounded mb-4 space-y-6 w-full max-w-4xl mx-auto';

  const header = document.createElement('p');
  header.className =
    'text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 border-b-4 dark:border-gray-700';
  header.textContent = '設定';
  container.appendChild(header);

  const themeSection = document.createElement('div');
  themeSection.className = 'space-y-2';
  const themeLabel = document.createElement('label');
  themeLabel.className =
    'block text-md font-medium text-gray-700 dark:text-gray-300';
  themeLabel.textContent = 'テーマ設定';
  themeSection.appendChild(themeLabel);
  const themeOptionsContainer = document.createElement('div');
  themeOptionsContainer.className = 'flex space-x-4';
  const themes: { value: Theme, label: string }[] = [
    { value: Theme.LIGHT, label: 'ライト' },
    { value: Theme.DARK, label: 'ダーク' }
  ];

  themes.forEach(theme => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'inline-flex items-center cursor-pointer';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'theme';
    radio.value = theme.value;
    radio.className = 'form-radio text-blue-600';
    if (theme.value === getCurrentTheme()) {
      radio.checked = true;
    }
    radio.addEventListener('click', () => {
      if (radio.checked) {
        setCurrentTheme(theme.value);
      }
    });
    optionLabel.appendChild(radio);

    const span = document.createElement('span');
    span.className = 'ml-2 text-sm text-gray-700 dark:text-gray-300';
    span.textContent = theme.label;
    optionLabel.appendChild(span);

    themeOptionsContainer.appendChild(optionLabel);
  });

  themeSection.appendChild(themeOptionsContainer);
  container.appendChild(themeSection);

  const dbSection = document.createElement('div');
  dbSection.className = 'space-y-4';
  const dbLabel = document.createElement('label');
  dbLabel.className =
    'block text-md font-medium text-gray-700 dark:text-gray-300';
  dbLabel.textContent = '解答履歴';
  dbSection.appendChild(dbLabel);

  // inner modal
  const innerModalElem = document.createElement('div');
  innerModalElem.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 hidden';
  container.appendChild(innerModalElem);
  const innerModal = new Modal(innerModalElem);

  // データ削除ボタン
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className =
    'w-full px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 focus:outline-none';
  deleteBtn.textContent = 'データ削除';
  deleteBtn.addEventListener('click', () => {
    const modalCard = document.createElement('div');
    modalCard.className =
      'bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-sm w-full';
    const message = document.createElement('p');
    message.className =
      'text-lg font-medium text-gray-800 dark:text-gray-100 mb-4';
    message.textContent = 'IndexedDB のデータを削除します。よろしいですか？';
    modalCard.appendChild(message);

    // ボタン群のコンテナ
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex justify-end space-x-4';
    const deleteButton = document.createElement('button');
    deleteButton.className =
      'px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded hover:bg-red-600 dark:hover:bg-red-700 focus:outline-none';
    deleteButton.textContent = '削除';
    deleteButton.addEventListener('click', async () => {
      deleteButton.disabled = true;
      await deleteAllDBs().then(() => {
        alert('DBを削除しました。');
      }).catch(error => {
        console.log(error);
      });
      deleteButton.disabled = false;
      innerModal.hide();
    });

    buttonsContainer.appendChild(deleteButton);
    modalCard.appendChild(buttonsContainer);
    innerModal.setModal(modalCard, ModalSize.DEFAULT);
  });
  dbSection.appendChild(deleteBtn);

  // データエクスポートボタン
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className =
    'w-full px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 focus:outline-none';
  exportBtn.textContent = 'データエクスポート';
  exportBtn.addEventListener('click', async() => {
    await exportCsv();
  });
  dbSection.appendChild(exportBtn);

  // データアップロードボタン
  // const exportForGoogleDriveBtn = document.createElement('button');
  // exportForGoogleDriveBtn.type = 'button';
  // exportForGoogleDriveBtn.className =
  //   'w-full px-4 py-2 bg-lime-500 dark:bg-lime-600 text-white rounded hover:bg-lime-600 dark:hover:bg-lime-700 focus:outline-none';
  // exportForGoogleDriveBtn.textContent = 'GoogleDriveへデータアップロード';
  // exportForGoogleDriveBtn.addEventListener('click', async() => {
  //   await exportCsvForGoogleDrive();
  // });
  // dbSection.appendChild(exportForGoogleDriveBtn);

  // データインポートボタン
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className =
    'w-full px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 focus:outline-none';
  importBtn.textContent = 'データインポート';
  importBtn.addEventListener('click', async() => {
    innerModal.setModal(generateImportContent(), ModalSize.LG);
  });
  dbSection.appendChild(importBtn);
  container.appendChild(dbSection);

  container.appendChild(generateDataImportContent());
  return container;
}

function generateImportContent() {
  // コンテナ要素（ダークモード対応）
  const container = document.createElement('div');
  container.className = 'p-6 rounded shadow-lg w-full bg-white dark:bg-gray-800 space-y-4';

  // ヘッダー追加（ダークモード対応）
  const header = document.createElement('h1');
  header.textContent = 'CSV インポート';
  header.className = 'text-2xl font-bold text-gray-900 dark:text-gray-100';
  container.appendChild(header);

  const successMessage = document.createElement('div');
  successMessage.className = 'rounded hidden p-2 font-bold text-green-700 dark:text-green-200 border-2 border-green-800 dark:border-green-200'
  successMessage.innerHTML = '正常にインポートが完了しました。<br>ページを再読み込みしてください。';
  container.appendChild(successMessage);
  const errorMessage = document.createElement('div');
  errorMessage.className = 'rounded hidden p-2 font-bold text-red-700 dark:text-red-200 border-2 border-red-800 dark:border-red-200'
  container.appendChild(errorMessage);

  // ファイル選択用 input 要素（ダークモード対応）
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'csvFileInput';
  fileInput.className = 'block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none';

  // インポート実行ボタン
  const importButton = document.createElement('button');
  importButton.textContent = 'インポート実行';
  importButton.id = 'importButton';
  importButton.className = 'w-full bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded';
  importButton.disabled = true;

  // GoogleDriveからインポートボタン
  // const importForGoogleDriveButton = document.createElement('button');
  // importForGoogleDriveButton.textContent = 'GoogleDriveからインポート';
  // importForGoogleDriveButton.id = 'importButton';
  // importForGoogleDriveButton.className = 'w-full bg-cyan-500 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-800 text-white font-bold py-2 px-4 rounded';

  // ファイルが選択された際にCSVファイルかどうかをチェックし、ボタンを活性化
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      // ファイル名の拡張子が「.csv」かチェック（大文字小文字を区別しない）
      if (file.name.toLowerCase().endsWith('.csv')) {
        importButton.disabled = false;
      } else {
        importButton.disabled = true;
      }
    } else {
      importButton.disabled = true;
    }
  });
  importButton.addEventListener('click', async () => {
    if (!fileInput.files || fileInput.files.length === 0) {
      console.error('CSVファイルが選択されていません');
      return;
    }
    const file: File = fileInput.files[0];
    try {
      await importCsv(file);
      successMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
    } catch (error) {
      console.error(error);
      successMessage.classList.add('hidden');
      errorMessage.classList.remove('hidden');
      errorMessage.textContent = error instanceof Error ? error.message : String(error);
    }
  });
  // importForGoogleDriveButton.addEventListener('click', async () => {
  //   try {
  //     await importCsvForGoogleDrive();
  //     successMessage.classList.remove('hidden');
  //     errorMessage.classList.add('hidden');
  //   } catch (error) {
  //     console.error(error);
  //     successMessage.classList.add('hidden');
  //     errorMessage.classList.remove('hidden');
  //     errorMessage.textContent = error instanceof Error ? error.message : String(error);
  //   }
  // });

  // コンテナに要素を追加
  container.appendChild(fileInput);
  container.appendChild(importButton);
  // container.appendChild(importForGoogleDriveButton);

  return container;
}

export function generateDataImportContent() {
  const dataImportSection = document.createElement('div');
  dataImportSection.className = 'space-y-4';

  const dataImportLabel = document.createElement('label');
  dataImportLabel.className =
    'block text-md font-medium text-gray-700 dark:text-gray-300';
  dataImportLabel.textContent = 'Google Drive の問題データインポート';
  dataImportSection.appendChild(dataImportLabel);

  // client_id 用フィールド
  const clientIdWrapper = document.createElement('div');
  clientIdWrapper.className = 'space-y-1';

  const clientIdLabel = document.createElement('label');
  clientIdLabel.className =
    'block text-sm font-medium text-gray-700 dark:text-gray-300';
  clientIdLabel.htmlFor = 'client_id';
  clientIdLabel.textContent = 'client_id';
  clientIdWrapper.appendChild(clientIdLabel);

  const clientIdInput = document.createElement('input');
  clientIdInput.type = 'text';
  clientIdInput.id = 'client_id';
  clientIdInput.name = 'client_id';
  clientIdInput.autocomplete = 'off';
  clientIdInput.placeholder = 'xxxx-xxxxx.apps.googleusercontent.com';
  clientIdInput.className =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 ' +
    'shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
    'focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 ' +
    'dark:text-gray-100';
  clientIdWrapper.appendChild(clientIdInput);
  dataImportSection.appendChild(clientIdWrapper);

  // folderId 用フィールド
  const folderIdWrapper = document.createElement('div');
  folderIdWrapper.className = 'space-y-1';

  const folderIdLabel = document.createElement('label');
  folderIdLabel.className =
    'block text-sm font-medium text-gray-700 dark:text-gray-300';
  folderIdLabel.htmlFor = 'folderId';
  folderIdLabel.textContent = 'folderId';
  folderIdWrapper.appendChild(folderIdLabel);

  const folderIdInput = document.createElement('input');
  folderIdInput.type = 'text';
  folderIdInput.id = 'folderId';
  folderIdInput.name = 'folderId';
  folderIdInput.autocomplete = 'off';
  folderIdInput.placeholder = 'Google Drive のフォルダID';
  folderIdInput.className =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 ' +
    'shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
    'focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 ' +
    'dark:text-gray-100';
  folderIdWrapper.appendChild(folderIdInput);
  dataImportSection.appendChild(folderIdWrapper);

  // 既存保存値の反映
  const storedClientId = getStoredClientId();
  if (storedClientId) clientIdInput.value = storedClientId;

  const storedFolderId = getStoredFolderId();
  if (storedFolderId) folderIdInput.value = storedFolderId;

  // 入力→localStorageへ保存
  bindPersist(clientIdInput, setStoredClientId);
  bindPersist(folderIdInput, setStoredFolderId);

  // （任意）他タブ同期したい場合は呼ぶ
  attachStorageSync(clientIdInput, folderIdInput);

  const importBtnWrapper = document.createElement('div');
  importBtnWrapper.className = 'mt-2 flex justify-center';

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.id = 'importProblemsBtn';
  importBtn.className =
    'w-full inline-flex items-center justify-center rounded-md ' +
    'border border-gray-300 px-4 py-2 text-sm font-medium ' +
    'bg-indigo-600 text-white hover:bg-indigo-700 ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
    'dark:border-gray-600';
  importBtn.textContent = '問題をインポート';

  // クリック時の処理が必要ならここに追記
  importBtn.addEventListener('click', async () => {
    try {
      importBtn.disabled = true;

      const clientId = localStorage.getItem(GDriveStorageKeys.clientId) ?? '';
      const folderId = localStorage.getItem(GDriveStorageKeys.folderId) ?? '';
      if (!clientId) throw new Error('client_id が未設定です。');
      if (!folderId) throw new Error('folderId が未設定です。');
      await importProbelmForGoogleDrive(clientId, folderId);
      renderQListView();
      renderQuestionListPage();
      alert('問題のインポートが完了しました。')
      importBtn.disabled = false;
    } catch (e) {
      console.error(e);
      alert((e as Error).message || 'インポート中にエラーが発生しました。');
      importBtn.disabled = false;
    }
  });

  importBtnWrapper.appendChild(importBtn);
  dataImportSection.appendChild(importBtnWrapper);

  return dataImportSection;
}

/**
 * 入力要素に対して、input/blurでlocalStorageへ保存するバインドを行う
 */
function bindPersist(input: HTMLInputElement, setFn: (v: string) => void) {
  let t: number | undefined;
  input.addEventListener('input', () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => setFn(input.value), 300);
  });
  input.addEventListener('blur', () => setFn(input.value));
}
