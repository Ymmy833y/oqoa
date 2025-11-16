import { Theme } from '../types';
import { el } from '../utils';

interface SettingModalHandlers {
  onThemeChange: (theme: Theme) => void;
  onGoogleClientIdChange: (googleClientId: string) => void;
  onGoogleFolderIdChange: (googleFolderId: string) => void;
  onGoogleDriveImport: () => void;
}

export function generateSettingModalConetnt(
  theme: Theme, clientId: string, folderId: string,
  handlers: SettingModalHandlers,
) {
  const body = el('div', 'app-modal-body');

  // テーマ選択セクション
  const themeSection = el('section', 'app-modal-section');
  const themeTitle = el('h3', 'app-modal-section-title', 'テーマ');
  const themeDesc = el(
    'p',
    'app-modal-section-description',
    'ライト / ダーク から選択できます。'
  );

  const radioGroup = el('div', 'app-modal-radio-group');
  radioGroup.appendChild(createThemeRadio(Theme.LIGHT, 'ライト', Theme.LIGHT === theme));
  radioGroup.appendChild(createThemeRadio(Theme.DARK, 'ダーク', Theme.DARK === theme));

  themeSection.appendChild(themeTitle);
  themeSection.appendChild(themeDesc);
  themeSection.appendChild(radioGroup);

  function createThemeRadio(
    value: Theme,
    labelText: string,
    checked = false,
  ): HTMLLabelElement {
    const label = el('label', 'app-modal-radio') as HTMLLabelElement;

    const input = el('input') as HTMLInputElement;
    input.type = 'radio';
    input.name = 'theme';
    input.value = value;
    if (checked) {
      input.checked = true;
    }

    input.addEventListener('change', () => {
      if (input.checked) {
        handlers.onThemeChange(value);
      }
    });

    const span = el('span', undefined, labelText);

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  // 解答履歴セクション
  const historySection = el('section', 'app-modal-section');
  const historyTitle = el('h3','app-modal-section-title', '解答履歴');
  const historyDesc = el(
    'p','app-modal-section-description',
    'ローカルに保存された解答履歴データの操作を行います。'
  );
  const historyActions = el('div', 'app-modal-actions');

  // データインポートボタン
  const importBtn = el('button', {
    class: 'app-modal-button',
    id: 'historyImportBtn',
  }) as HTMLButtonElement;
  importBtn.type = 'button';
  const importIcon = el('i', {
    class: 'bi bi-file-earmark-arrow-up app-modal-button-icon',
    attr: [{ 'aria-hidden': 'true' }],
  });
  importBtn.appendChild(importIcon);
  importBtn.append('データインポート');

  // データエクスポートボタン
  const exportBtn = el('button', {
    class: 'app-modal-button',
    id: 'historyExportBtn',
  }) as HTMLButtonElement;
  exportBtn.type = 'button';
  const exportIcon = el('i', {
    class: 'bi bi-file-earmark-arrow-down app-modal-button-icon',
    attr: [{ 'aria-hidden': 'true' }],
  });
  exportBtn.appendChild(exportIcon);
  exportBtn.append('データエクスポート');

  // データ削除ボタン
  const deleteBtn = el('button', {
    class: 'app-modal-button app-modal-button-danger',
    id: 'historyDeleteBtn',
  }) as HTMLButtonElement;
  deleteBtn.type = 'button';
  const deleteIcon = el('i', {
    class: 'bi bi-trash app-modal-button-icon',
    attr: [{ 'aria-hidden': 'true' }],
  });
  deleteBtn.appendChild(deleteIcon);
  deleteBtn.append('データ削除');

  historyActions.appendChild(importBtn);
  historyActions.appendChild(exportBtn);
  historyActions.appendChild(deleteBtn);

  historySection.appendChild(historyTitle);
  historySection.appendChild(historyDesc);
  historySection.appendChild(historyActions);

  // Google Drive 連携セクション
  const driveSection = el('section', 'app-modal-section');
  const driveTitle = el(
    'h3', 'app-modal-section-title',
    'Google Drive 連携'
  );
  const driveDesc = el(
    'p', 'app-modal-section-description',
    'Google Drive に保存した問題ファイルをインポートします。'
  );
  const driveFieldGroup = el('div', 'app-modal-field-group');

  // Client ID
  const clientIdField = el('div', 'app-modal-field');
  const clientIdLabel = el('label', {
    class: 'app-modal-field-label',
    text: 'Client ID',
    attr: [{ for: 'driveClientIdInput' }],
  });
  const clientIdInput = el('input', {
    class: 'app-modal-input',
    id: 'driveClientIdInput',
    attr: [
      { type: 'text' },
      { name: 'driveClientId' },
      { value: clientId },
      { placeholder: 'Google API Client ID' },
      { autocomplete: 'off' },
    ],
  }) as HTMLInputElement;
  clientIdInput.addEventListener('input', () => {
    handlers.onGoogleClientIdChange(clientIdInput.value);
  });
  clientIdField.appendChild(clientIdLabel);
  clientIdField.appendChild(clientIdInput);

  // Folder ID
  const folderIdField = el('div', 'app-modal-field');
  const folderIdLabel = el('label', {
    class: 'app-modal-field-label',
    text: 'フォルダID',
    attr: [{ for: 'driveFolderIdInput' }],
  });
  const folderIdInput = el('input', {
    class: 'app-modal-input',
    id: 'driveFolderIdInput',
    attr: [
      { type: 'text' },
      { name: 'driveFolderId' },
      { value: folderId },
      { placeholder: 'Google Drive Folder ID' },
      { autocomplete: 'off' },
    ],
  }) as HTMLInputElement;
  folderIdInput.addEventListener('input', () => {
    handlers.onGoogleFolderIdChange(folderIdInput.value);
  });
  folderIdField.appendChild(folderIdLabel);
  folderIdField.appendChild(folderIdInput);

  driveFieldGroup.appendChild(clientIdField);
  driveFieldGroup.appendChild(folderIdField);

  const driveActions = el('div', 'app-modal-actions');
  const driveImportBtn = el('button', {
    class: 'app-modal-button w-full mt-2',
    id: 'driveImportBtn',
  }) as HTMLButtonElement;
  driveImportBtn.type = 'button';
  const driveIcon = el('i', {
    class: 'bi bi-cloud-arrow-down app-modal-button-icon',
    attr: [{ 'aria-hidden': 'true' }],
  });
  driveImportBtn.appendChild(driveIcon);
  driveImportBtn.append('問題をインポート');
  driveImportBtn.addEventListener('click', () => {
    handlers.onGoogleDriveImport();
  })
  driveActions.appendChild(driveImportBtn);

  driveSection.appendChild(driveTitle);
  driveSection.appendChild(driveDesc);
  driveSection.appendChild(driveFieldGroup);
  driveSection.appendChild(driveActions);

  // body に各セクションを追加
  body.appendChild(themeSection);
  body.appendChild(historySection);
  body.appendChild(driveSection);

  return body;
}
