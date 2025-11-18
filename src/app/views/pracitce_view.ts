import { QList } from '../models/entities';
import { el } from '../utils';

export function generatePracticeStartContent(
  qList: QList,
  handler: (qList: QList, isShuffleQuestions: boolean, isShuffleChoices: boolean) => void
): HTMLElement {
  const content = el('div', 'app-modal-body');

  const infoSection = el('section', 'app-modal-section');
  const infoTitle = el('h3', 'app-modal-section-title', '演習情報');
  infoSection.appendChild(infoTitle);

  // 問題集名
  const nameField = el('div', 'app-modal-field');
  const nameLabel = el('span', 'app-modal-field-label', '問題集名');
  const nameText = el('p', 'practice-info-name', qList.getName());
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameText);
  infoSection.appendChild(nameField);

  // 問題数・問題集種別（2カラム）
  const infoGrid = el('div', 'practice-info-grid');

  // 問題数
  const statDiv = el('div', 'practice-info-stat');
  const statLabel = el('span', 'font-medium', '問題数：');
  const statValue = el('span', undefined, `${qList.getQuestions().length}問`);
  statDiv.appendChild(statLabel);
  statDiv.appendChild(statValue);
  infoGrid.appendChild(statDiv);

  // 問題集種別（標準ラベル）
  const typeDiv = el('div', 'practice-info-type');
  const typeLabel = el('span', 'font-medium', '問題集種別：');
  const typeBadge = el('span', 'q-list-card-badge-default', '標準');
  typeDiv.appendChild(typeLabel);
  typeDiv.appendChild(typeBadge);
  infoGrid.appendChild(typeDiv);

  infoSection.appendChild(infoGrid);
  content.appendChild(infoSection);

  // 出題設定セクション
  const settingSection = el('section', 'app-modal-section');
  const settingTitle = el('h3', 'app-modal-section-title', '出題設定');
  const settingDesc = el(
    'p',
    'app-modal-section-description',
    '出題順や選択肢の並び順を変更するか選択できます。'
  );

  settingSection.appendChild(settingTitle);
  settingSection.appendChild(settingDesc);

  const settingGroup = el('div', 'practice-setting-group');

  // 出題順シャッフル
  const shuffleQuestionsLabel = el('label', 'practice-setting-checkbox');
  const shuffleQuestionsInput = el('input', {
    id: 'shuffleQuestions',
    class: 'practice-setting-checkbox-input',
    attr: [{ type: 'checkbox' }],
  });
  const shuffleQuestionsText = el(
    'span',
    undefined,
    '問題の出題順を並び替える'
  );
  shuffleQuestionsLabel.appendChild(shuffleQuestionsInput);
  shuffleQuestionsLabel.appendChild(shuffleQuestionsText);
  settingGroup.appendChild(shuffleQuestionsLabel);

  // 選択肢シャッフル
  const shuffleChoicesLabel = el('label', 'practice-setting-checkbox');
  const shuffleChoicesInput = el('input', {
    id: 'shuffleChoices',
    class: 'practice-setting-checkbox-input',
    attr: [{ type: 'checkbox' }],
  });
  const shuffleChoicesText = el(
    'span',
    undefined,
    '選択肢の並び順を並び替える'
  );
  shuffleChoicesLabel.appendChild(shuffleChoicesInput);
  shuffleChoicesLabel.appendChild(shuffleChoicesText);
  settingGroup.appendChild(shuffleChoicesLabel);

  settingSection.appendChild(settingGroup);
  content.appendChild(settingSection);

  // 開始ボタン
  const actions = el('div', 'app-modal-actions');
  const startButton = el('button', {
    id: 'practiceStartButton',
    class: 'app-modal-button practice-start-button',
    text: '演習を開始する',
    attr: [{ type: 'button' }],
  });
  startButton.addEventListener('click', () => {
    handler(qList, shuffleQuestionsInput.checked, shuffleChoicesInput.checked);
  });
  actions.appendChild(startButton);
  content.appendChild(actions);

  return content;
}
