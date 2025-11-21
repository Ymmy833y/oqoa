import { QList } from '../models/entities';
import { el, scrollToTop } from '../utils/view_utils';

interface QListRowHandlers {
  onClickSolve: (qListId: number) => void;
  onClickEdit: (qListId: number) => void;
}

export function generateQListRow(qList: QList, handlers: QListRowHandlers): HTMLElement {
  const id = qList.getId();
  const uuid = qList.getUuid();
  const name = qList.getName();
  const questions = qList.getQuestions();
  const isDefault = qList.getIsDefault();
  const questionCount = questions ? questions.length : 0;

  const card = el('article', {
    class: 'q-list-card',
    attr: [
      { 'data-id': String(id) },
      { 'data-uuid': uuid },
    ],
  });

  // header
  const header = el('div', 'q-list-card-header');
  const headerMain = el('div', 'q-list-card-header-main');

  const title = el('h3', 'q-list-card-title', name);

  const subtitle = el('p', 'q-list-card-subtitle', '登録問題数：');
  const countSpan = el('span', 'q-list-card-count', String(questionCount));
  subtitle.appendChild(countSpan);
  subtitle.append(' 問');

  headerMain.appendChild(title);
  headerMain.appendChild(subtitle);
  header.appendChild(headerMain);

  // デフォルトバッジ
  if (isDefault) {
    const badge = el('span', 'q-list-card-badge-default', '標準');
    header.appendChild(badge);
  }

  // meta (UUID)
  const meta = el('div', 'q-list-card-meta', `UUID: ${uuid}`);

  // actions
  const actions = el('div', 'q-list-card-actions');

  const solveButton = el('button', {
    class: 'q-list-card-btn-primary',
    text: 'この問題集を解く',
    attr: [{ type: 'button' }],
  });
  solveButton.addEventListener('click', () => {
    handlers.onClickSolve(qList.getId());
    scrollToTop();
  });

  const editButton = el('button', {
    class: 'q-list-card-btn-secondary',
    text: '編集',
    attr: [{ type: 'button' }],
  });
  editButton.addEventListener('click', () => {
    handlers.onClickEdit(qList.getId());
  });

  actions.appendChild(solveButton);
  actions.appendChild(editButton);

  // card に全部つめる
  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(actions);

  return card;
}
