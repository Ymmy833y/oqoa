import {
  FavoriteTag,
  FavoriteTagMeta,
  FavoriteTagMetaMap,
  ModalSize,
} from "../enums";
import { QuestionDetailDto } from "../models/dtos";
import { AnsHistory, Question } from "../models/entities";
import { formatToYDHM, Modal, shuffle, stripHtmlAndEntities } from "../utils";
import { el } from "../utils/view_utils";

interface QuestionContentOptionHandlers {
  onAnswered: (isCorrect: boolean, selectChoice: number[]) => void;
  onAnswerCanceled: () => void;
}
export function generateQuestionContent(
  dto: QuestionDetailDto,
  onFavoriteToggled: (tagId: number, checked: boolean) => void,
  isRandomC = false,
  isAnswered = true,
  optionHandlers?: QuestionContentOptionHandlers,
  modal?: Modal,
): HTMLElement {
  let isFirstAnswer = !dto.ansHistory;
  const inputType =
    dto.question.getSelectionFormat() === "radio" ? "radio" : "checkbox";

  // ルートカード
  const card = el("div", "question-card");

  // ヘッダー（問題タイトル＋設問ID）
  const header = el("header", "question-header");
  const leftWrapper = el("div", "question-header-left");
  const title = el("span", "question-title", "問題");
  leftWrapper.appendChild(title);
  if (dto.ansHistory) {
    const label = el(
      "span",
      `question-result-label question-result-label-${dto.ansHistory.getIsCorrect() ? "correct" : "incorrect"}`,
      `${dto.ansHistory.getIsCorrect() ? "正解" : "不正解"}`,
    );
    leftWrapper.appendChild(label);
  }

  const idWrapper = el("div", "question-id");
  const idLabel = el("span", { text: "設問ID：" });
  const idValue = el("span", {
    id: "questionId",
    class: "question-id-value blur",
    text: `#${dto.question.getId()}`,
  });
  idWrapper.appendChild(idLabel);
  idWrapper.appendChild(idValue);
  // クリックで設問IDのぼかし解除／再付与
  idWrapper.addEventListener("click", () => {
    toggleQuestionIdBlur();
  });

  header.appendChild(leftWrapper);
  header.appendChild(idWrapper);

  card.appendChild(header);

  // 問題文
  const problemWrapper = el("div");
  const problemText = el("p", {
    id: "questionText",
    class: "question-text",
  });
  problemText.toggleAttribute("data-auto-tailwind", true);
  problemText.innerHTML = dto.question.getProblem();
  problemWrapper.appendChild(problemText);
  card.appendChild(problemWrapper);

  // 選択肢
  const choiceLabelElems: HTMLElement[] = []; // 選択肢シャッフルの為に一旦配列に保持
  const choicesWrapper = el("div", {
    id: "choices",
    class: "question-choices",
  });
  const choices = dto.question.getChoice();
  const selectedChoices = dto.ansHistory
    ? dto.ansHistory.getSelectChoice()
    : [];
  choices.forEach((choiceText, index) => {
    const choiceLabel = el("label", "question-choice");
    const input = el("input", {
      class: "question-choice-input",
      attr: [
        {
          type: inputType,
          name: "choice",
          value: String(index),
        },
      ],
    });
    input.checked = selectedChoices.includes(index);

    const textSpan = el("span", "w-full");
    textSpan.toggleAttribute("data-auto-tailwind", true);
    textSpan.innerHTML = choiceText;

    choiceLabel.appendChild(input);
    choiceLabel.appendChild(textSpan);
    choiceLabel.addEventListener("change", () => {
      checkAnswer();
    });
    choiceLabelElems.push(choiceLabel);
  });
  if (isRandomC || isAnswered) {
    shuffle(choiceLabelElems);
  }
  choiceLabelElems.forEach((label) => choicesWrapper.appendChild(label));
  card.appendChild(choicesWrapper);

  // 正解を表示するボタン
  const answerButtonWrapper = el("div", "question-answer-button-wrapper");
  const answerButton = el("button", {
    class: "question-answer-button",
    text: "正解を表示",
    attr: [{ type: "button" }],
  });
  answerButtonWrapper.appendChild(answerButton);
  answerButton.addEventListener("click", () => {
    showAnswerBlock();
  });
  if (dto.ansHistory && !isAnswered) {
    const answerCancelButton = el("button", {
      class: "question-answer-cancel-button",
      text: "回答を取り消す",
      attr: [{ type: "button" }],
    });
    answerButtonWrapper.appendChild(answerCancelButton);
    answerCancelButton.addEventListener("click", () => {
      optionHandlers?.onAnswerCanceled();
    });
  }
  card.appendChild(answerButtonWrapper);

  // 正解＋解説ブロック
  const answerBlock = el("div", {
    id: "answerBlock",
    class: "question-answer-block hidden",
  });

  // 正解
  const correctChoices = dto.question
    .getAnswer()
    .map((idx) => dto.question.getChoice()[idx]);
  const answerWrapper = el("div");
  const answerLabel = el("span", "question-answer-label", "正解");

  const answerText = el("p", "question-answer-text");
  correctChoices.forEach((choice) => {
    const choiceSpan = el("p", "question-answer-choice");
    choiceSpan.toggleAttribute("data-auto-tailwind", true);
    choiceSpan.innerHTML = choice;
    answerText.appendChild(choiceSpan);
  });

  answerWrapper.appendChild(answerLabel);
  answerWrapper.appendChild(answerText);

  // 解説
  const explainWrapper = el("div");
  const explainLabel = el("span", "question-explain-label", "解説");
  const explainText = el("p", "question-explain-text");
  explainText.toggleAttribute("data-auto-tailwind", true);
  explainText.innerHTML = dto.question.getExplanation();

  explainWrapper.appendChild(explainLabel);
  explainWrapper.appendChild(explainText);

  answerBlock.appendChild(answerWrapper);
  answerBlock.appendChild(explainWrapper);

  // 解答履歴（直近5件まで表示）
  if (dto.ansHistories && dto.ansHistories.length > 0) {
    const historySection = el("div", "question-answer-history");

    const historyLabel = el(
      "span",
      "question-answer-history-label",
      "解答履歴",
    );
    historySection.appendChild(historyLabel);

    // 横並びのコンテナ
    const historyList = el("div", {
      class: "question-answer-history-list",
    });

    // 直近5件に絞る（answerDate の新しい順）
    const histories = dto.ansHistories
      .slice()
      .sort(
        (a, b) =>
          new Date(b.getAnswerDate()).getTime() -
          new Date(a.getAnswerDate()).getTime(),
      )
      .slice(0, 5);

    histories.forEach((history) => {
      const isCorrect = history.getIsCorrect();
      const answerDate = history.getAnswerDate();

      const item = el("div", {
        class: "question-answer-history-item",
      });

      const iconWrapper = el("span", {
        class: `question-answer-history-icon ${
          isCorrect ? "text-correct" : "text-incorrect"
        }`,
      });

      const icon = el("i", {
        class: isCorrect ? "bi bi-circle" : "bi bi-x-lg",
        attr: [{ "aria-hidden": "true" }],
      });

      iconWrapper.appendChild(icon);

      const dateSpan = el("span", {
        class: "question-answer-history-date",
        text: formatToYDHM(answerDate),
      });

      item.appendChild(iconWrapper);
      item.appendChild(dateSpan);

      historyList.appendChild(item);
    });

    historySection.appendChild(historyList);
    answerBlock.appendChild(historySection);
  }

  card.appendChild(answerBlock);

  // お気に入りセクション
  const favoriteSection = el("div", "question-favorite");
  const favoriteLabel = el("span", "question-favorite-label", "お気に入り");
  favoriteSection.appendChild(favoriteLabel);

  const favoriteList = el("div", "question-favorite-list");

  (Object.entries(FavoriteTagMetaMap) as [string, FavoriteTagMeta][]).forEach(
    ([tagIdStr, meta]) => {
      const tagId = Number(tagIdStr) as FavoriteTag;
      const pressed =
        dto.favorites.filter((f) => f.getTagId() === tagId).length !== 0;

      const btn = el("button", {
        class: "question-favorite-btn",
        attr: [
          { type: "button" },
          { "data-favorite-key": meta.key },
          { "aria-pressed": String(pressed) },
        ],
      }) as HTMLButtonElement;
      btn.classList.toggle("question-favorite-btn--active", pressed);

      const icon = el("i", {
        class: `question-favorite-btn-icon bi ${meta.className}`,
        attr: [{ "aria-hidden": "true" }],
      });

      btn.appendChild(icon);

      btn.addEventListener("click", () => {
        const isActive = btn.getAttribute("aria-pressed") === "true";
        const next = !isActive;
        btn.setAttribute("aria-pressed", String(next));
        btn.classList.toggle("question-favorite-btn--active", next);
        onFavoriteToggled(tagId, next);
      });

      favoriteList.appendChild(btn);
    },
  );

  favoriteSection.appendChild(favoriteList);
  card.appendChild(favoriteSection);

  // 内包モーダル
  const innerModalElem = el("div", "app-modal-overlay hidden");
  card.appendChild(innerModalElem);
  const innerModal = modal ? modal : new Modal(innerModalElem);

  function checkAnswer() {
    const checkedList: number[] = [];
    choiceLabelElems.forEach((choice) => {
      const input = choice.getElementsByTagName("input")[0];
      if (input.checked) {
        checkedList.push(Number(input.value));
      }
    });
    if (checkedList.length !== dto.question.getAnswer().length) {
      return;
    }

    const sortedAnswers = [...dto.question.getAnswer()].sort((a, b) => a - b);
    const sortedSelects = [...checkedList].sort((a, b) => a - b);
    const isCorrect = sortedAnswers.every((v, i) => v === sortedSelects[i]);

    const modal = el("div", "answer-modal");
    const modalText = el(
      "p",
      `answer-modal-text text-${isCorrect ? "correct " : "incorrect"}`,
      `${isCorrect ? "正解" : "不正解"}`,
    );
    modal.appendChild(modalText);
    innerModal.setModal(modal, undefined, ModalSize.DEFAULT);

    if (isCorrect) {
      showAnswerBlock();
      toggleQuestionIdBlur();
    }

    if (optionHandlers && isFirstAnswer) {
      optionHandlers.onAnswered(isCorrect, sortedSelects);
      isFirstAnswer = false;
    }
  }

  if (dto.ansHistory && dto.ansHistory.getIsCorrect()) {
    showAnswerBlock();
    toggleQuestionIdBlur();
  }

  function toggleQuestionIdBlur(isAdd?: boolean) {
    if (isAdd === undefined) {
      idValue.classList.toggle("blur");
    } else if (isAdd) {
      idValue.classList.add("blur");
    } else {
      idValue.classList.remove("blur");
    }
  }
  function showAnswerBlock() {
    choiceLabelElems.forEach((choice) => {
      const input = choice.getElementsByTagName("input")[0];
      if (dto.question.getAnswer().includes(Number(input.value))) {
        const text = choice.getElementsByTagName("span")[0];
        text.classList.add("question-answer-choice");
        choice.classList.add("question-answer-choice-label");
      }
    });
    answerBlock.classList.remove("hidden");
  }
  return card;
}

export function generateQuestionListRow(
  question: Question,
  handler: () => void,
  ansHistory?: AnsHistory,
): HTMLButtonElement {
  const id = question.getId();
  const problem = stripHtmlAndEntities(question.getProblem());

  const row = el("button", {
    class: "question-list-row",
    attr: [{ type: "button" }, { "data-id": String(id) }],
  }) as HTMLButtonElement;
  row.addEventListener("click", () => {
    handler();
  });

  const idSpan = el("span", "question-list-row-id", `#${id}`);

  const textSpan = el("span", "question-list-row-text", problem);

  row.appendChild(idSpan);
  row.appendChild(textSpan);

  if (ansHistory) {
    const isCorrect = ansHistory.getIsCorrect();
    const statusSpan = el("span", {
      class: `question-list-row-status ${isCorrect ? "text-correct" : "text-incorrect"}`,
    });
    const icon = el("i", {
      class: isCorrect ? "bi bi-circle" : "bi bi-x-lg",
      attr: [{ "aria-hidden": "true" }],
    });

    statusSpan.appendChild(icon);
    statusSpan.setAttribute("aria-label", isCorrect ? "正解" : "不正解");
    row.appendChild(statusSpan);
  }

  return row;
}
