import { ModalSize } from "../enums";
import { QList } from "../models/entities";
import { Modal } from "../utils";
import { el } from "../utils/view_utils";

interface QListRowHandlers {
  onClickSolve: (qListId: number) => void;
  onClickEdit: () => void;
}
export function generateQListRow(
  qList: QList,
  handlers: QListRowHandlers,
): HTMLElement {
  const id = qList.getId();
  const uuid = qList.getUuid();
  const name = qList.getName();
  const questions = qList.getQuestions();
  const isDefault = qList.getIsDefault();
  const questionCount = questions ? questions.length : 0;

  const card = el("article", {
    class: "q-list-card",
    attr: [{ "data-id": String(id) }, { "data-uuid": uuid }],
  });

  // header
  const header = el("div", "q-list-card-header");
  const headerMain = el("div", "q-list-card-header-main");

  const title = el("h3", "q-list-card-title", name);

  const subtitle = el("p", "q-list-card-subtitle", "登録問題数：");
  const countSpan = el("span", "q-list-card-count", String(questionCount));
  subtitle.appendChild(countSpan);
  subtitle.append(" 問");

  headerMain.appendChild(title);
  headerMain.appendChild(subtitle);
  header.appendChild(headerMain);
  const badge = el(
    "span",
    `q-list-card-badge ${isDefault ? "default-badge" : "custom-badge"}`,
    isDefault ? "標準" : "カスタム",
  );
  header.appendChild(badge);

  // meta (UUID)
  const meta = el("div", "q-list-card-meta", `UUID: ${uuid}`);

  // actions
  const actions = el("div", "q-list-card-actions");

  const solveButton = el("button", {
    class: "q-list-card-btn-primary",
    text: "この問題集を解く",
    attr: [{ type: "button" }],
  });
  solveButton.addEventListener("click", () => {
    handlers.onClickSolve(qList.getId());
  });

  const editButton = el("button", {
    class: "q-list-card-btn-secondary",
    text: "編集",
    attr: [{ type: "button" }],
  });
  editButton.addEventListener("click", () => {
    handlers.onClickEdit();
  });

  actions.appendChild(solveButton);
  actions.appendChild(editButton);

  // card に全部つめる
  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(actions);

  return card;
}

export function generateQListEditContent(
  qList: QList,
  handler: (name: string, isDefault: boolean, isDelete: boolean) => void,
): HTMLElement {
  const title = qList.getName();
  const isDefault = qList.getIsDefault();

  const body = el("div", "app-modal-body");

  const section = el("section", "app-modal-section");

  const sectionTitle = el("h3", "app-modal-section-title", "問題集の編集");
  section.appendChild(sectionTitle);

  const nameField = el("div", "app-modal-field");
  const nameLabel = el("span", "app-modal-field-label", "タイトル");
  const nameInput = el("input", {
    id: "qListEditName",
    class: "practice-info-name-input",
    attr: [{ type: "text" }, { name: "qListName" }, { value: title }],
  }) as HTMLInputElement;
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);

  const typeField = el("div", "app-modal-field");
  const typeLabel = el("span", "app-modal-field-label", "問題集種別");
  const typeRadioGroup = el("div", "app-modal-radio-group");

  const defaultLabel = el("label", "app-modal-radio") as HTMLLabelElement;
  const defaultInput = el("input", {
    attr: [{ type: "radio" }, { name: "qListType" }, { value: "default" }],
  }) as HTMLInputElement;
  defaultInput.checked = isDefault;
  const defaultText = el("span", undefined, "標準");
  defaultLabel.appendChild(defaultInput);
  defaultLabel.appendChild(defaultText);

  const customLabel = el("label", "app-modal-radio") as HTMLLabelElement;
  const customInput = el("input", {
    attr: [{ type: "radio" }, { name: "qListType" }, { value: "custom" }],
  }) as HTMLInputElement;
  customInput.checked = !isDefault;
  const customText = el("span", undefined, "カスタム");
  customLabel.appendChild(customInput);
  customLabel.appendChild(customText);

  typeRadioGroup.appendChild(defaultLabel);
  typeRadioGroup.appendChild(customLabel);
  typeField.appendChild(typeLabel);
  typeField.appendChild(typeRadioGroup);

  const actions = el("div", "app-modal-actions");
  const editButton = el("button", {
    id: "qListEditButton",
    class: "app-modal-button qlist-edit-button",
    text: "編集",
    attr: [{ type: "button" }],
  });

  editButton.addEventListener("click", () => {
    const nextIsDefault = defaultInput.checked;
    handler(nameInput.value, nextIsDefault, false);
  });

  // 内包モーダル
  const innerModalElem = el("div", "app-modal-overlay hidden");
  body.appendChild(innerModalElem);
  const innerModal = new Modal(innerModalElem);

  const removeButton = el("button", {
    id: "qListEditButton",
    class: "app-modal-button qlist-remove-button",
    text: "削除",
    attr: [{ type: "button" }],
  });

  removeButton.addEventListener("click", () => {
    const nextIsDefault = defaultInput.checked;
    const modal = createQListRemoveConfirmModal(
      () => handler(nameInput.value, nextIsDefault, true),
      () => innerModal.hide(),
    );
    innerModal.setModal(modal, "問題集を削除", ModalSize.LG);
  });

  actions.appendChild(editButton);
  actions.appendChild(removeButton);

  section.appendChild(nameField);
  section.appendChild(typeField);
  section.appendChild(actions);

  body.appendChild(section);
  return body;
}

function createQListRemoveConfirmModal(
  onConfirm: () => void,
  onCancel: () => void,
): HTMLElement {
  // 本文
  const modal = el("div", "app-modal-body");
  const section = el("div", "app-modal-section");
  const text = el(
    "p",
    "app-modal-section-description",
    "この問題集を削除すると、関連する演習履歴もすべて削除されます。" +
      "削除した内容は元に戻せません。本当に削除してもよろしいですか？",
  );
  section.appendChild(text);
  modal.appendChild(section);

  // ボタン行
  const actions = el("div", "app-modal-actions");

  const deleteButton = el("button", {
    class: "app-modal-button app-modal-button-danger",
    text: "削除",
    attr: [{ type: "button" }],
  });
  deleteButton.addEventListener("click", () => {
    onConfirm();
  });

  const cancelButton = el("button", {
    class: "app-modal-button",
    text: "キャンセル",
    attr: [{ type: "button" }],
  });
  cancelButton.addEventListener("click", () => {
    onCancel();
  });

  actions.appendChild(deleteButton);
  actions.appendChild(cancelButton);

  modal.appendChild(actions);

  return modal;
}
