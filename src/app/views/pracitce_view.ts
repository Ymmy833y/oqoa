import { ModalSize } from "../enums";
import {
  CustomPracticeStartDto,
  PracticeDetailDto,
  PracticeHistoryDto,
} from "../models/dtos";
import { QList } from "../models/entities";
import { el, formatToYMDHMS, Modal } from "../utils";

import {
  generateQuestionContent,
  generateQuestionListRow,
} from "./question_view";

export function generatePracticeStartContent(
  preparePracticeStart: QList | CustomPracticeStartDto,
  handler: (
    preparePracticeStart: QList | CustomPracticeStartDto,
    isShuffleQuestions: boolean,
    isShuffleChoices: boolean,
    questionCount: number,
  ) => void,
): HTMLElement {
  const existQList = preparePracticeStart instanceof QList;
  const isDefault =
    preparePracticeStart instanceof QList &&
    preparePracticeStart.getIsDefault();

  let questionCount = Number.MAX_SAFE_INTEGER;

  const content = el("div", "app-modal-body");

  const infoSection = el("section", "app-modal-section");
  const infoTitle = el("h3", "app-modal-section-title", "演習情報");
  infoSection.appendChild(infoTitle);

  // 問題集名
  const nameField = el("div", "app-modal-field");
  const nameLabel = el("span", "app-modal-field-label", "問題集名");
  nameField.appendChild(nameLabel);
  if (existQList) {
    const nameText = el(
      "p",
      "practice-info-name",
      preparePracticeStart.getName(),
    );
    nameField.appendChild(nameText);
  } else {
    const initName = `${preparePracticeStart.isReview ? "【復習】" : ""}${preparePracticeStart.name} ${formatToYMDHMS(new Date())}`;
    const nameInput = el("input", {
      id: "customPracticeName",
      class: "practice-info-name-input",
      attr: [
        { type: "text" },
        { name: "customPracticeName" },
        { value: initName },
      ],
    }) as HTMLInputElement;
    preparePracticeStart.name = initName;
    nameInput.addEventListener("change", () => {
      preparePracticeStart.name = nameInput.value;
    });
    nameField.appendChild(nameInput);
  }
  infoSection.appendChild(nameField);

  // 問題数・問題集種別（2カラム）
  const infoGrid = el("div", "practice-info-grid");

  // 問題数
  const statDiv = el("div", "practice-info-stat");
  const statLabel = el("span", "font-medium", "問題数：");
  const questionSize = existQList
    ? preparePracticeStart.getQuestions().length
    : preparePracticeStart.questionIds.length;
  const statValue = el("span", undefined, `${questionSize}問`);
  statDiv.appendChild(statLabel);
  statDiv.appendChild(statValue);
  infoGrid.appendChild(statDiv);

  // 問題集種別（標準ラベル）
  const typeDiv = el("div", "practice-info-type");
  const typeLabel = el("span", "font-medium", "問題集種別：");
  const typeBadge = el(
    "span",
    `q-list-card-badge ${isDefault ? "default-badge" : "custom-badge"}`,
    isDefault ? "標準" : "カスタム",
  );
  typeDiv.appendChild(typeLabel);
  typeDiv.appendChild(typeBadge);
  infoGrid.appendChild(typeDiv);

  infoSection.appendChild(infoGrid);
  content.appendChild(infoSection);

  // 出題設定セクション
  const settingSection = el("section", "app-modal-section");
  const settingTitle = el("h3", "app-modal-section-title", "出題設定");
  const settingDesc = el(
    "p",
    "app-modal-section-description",
    "出題順や選択肢の並び順を変更するか選択できます。",
  );

  settingSection.appendChild(settingTitle);
  settingSection.appendChild(settingDesc);

  const settingGroup = el("div", "practice-setting-group");

  // 出題順シャッフル
  const shuffleQuestionsLabel = el("label", "practice-setting-checkbox");
  const shuffleQuestionsInput = el("input", {
    id: "shuffleQuestions",
    class: "practice-setting-checkbox-input",
    attr: [{ type: "checkbox" }],
  });
  const shuffleQuestionsText = el(
    "span",
    undefined,
    "問題の出題順を並び替える",
  );
  shuffleQuestionsLabel.appendChild(shuffleQuestionsInput);
  shuffleQuestionsLabel.appendChild(shuffleQuestionsText);
  settingGroup.appendChild(shuffleQuestionsLabel);

  // 選択肢シャッフル
  const shuffleChoicesLabel = el("label", "practice-setting-checkbox");
  const shuffleChoicesInput = el("input", {
    id: "shuffleChoices",
    class: "practice-setting-checkbox-input",
    attr: [{ type: "checkbox" }],
  });
  const shuffleChoicesText = el(
    "span",
    undefined,
    "選択肢の並び順を並び替える",
  );
  shuffleChoicesLabel.appendChild(shuffleChoicesInput);
  shuffleChoicesLabel.appendChild(shuffleChoicesText);
  settingGroup.appendChild(shuffleChoicesLabel);

  if (!existQList) {
    // 出題数セレクト
    const questionCountField = el("div", "practice-setting-field");
    const questionCountLabel = el("span", "app-modal-field-label", "出題数");
    const questionCountSelect = el("select", {
      id: "practiceQuestionLimit",
      class: "practice-setting-select",
    }) as HTMLSelectElement;

    const questionCountOptions: { value: string; label: string }[] = [
      { value: "5", label: "5問" },
      { value: "10", label: "10問" },
      { value: "20", label: "20問" },
      { value: "30", label: "30問" },
      { value: "40", label: "40問" },
      { value: "50", label: "50問" },
      { value: "60", label: "60問" },
      { value: "65", label: "65問" },
      { value: "100", label: "100問" },
      { value: "130", label: "130問" },
      { value: questionCount.toString(), label: "すべての問題" },
    ];

    questionCountOptions.forEach(({ value, label }) => {
      const option = el("option", {
        attr: [{ value }],
        text: label,
      }) as HTMLOptionElement;

      if (value === questionCount.toString()) {
        option.selected = true; // デフォルトは ALL
      }

      questionCountSelect.appendChild(option);
    });
    questionCountSelect.addEventListener("change", () => {
      questionCount = Number(questionCountSelect.value);
    });

    questionCountField.appendChild(questionCountLabel);
    questionCountField.appendChild(questionCountSelect);
    settingGroup.appendChild(questionCountField);
  }
  settingSection.appendChild(settingGroup);
  content.appendChild(settingSection);

  // 開始ボタン
  const actions = el("div", "app-modal-actions");
  const startButton = el("button", {
    id: "practiceStartButton",
    class: "app-modal-button practice-start-button",
    text: "演習を開始する",
    attr: [{ type: "button" }],
  });
  startButton.addEventListener("click", () => {
    handler(
      preparePracticeStart,
      shuffleQuestionsInput.checked,
      shuffleChoicesInput.checked,
      questionCount,
    );
  });
  actions.appendChild(startButton);
  content.appendChild(actions);

  return content;
}

export function generatePracticeHistoryListRow(
  dto: PracticeHistoryDto,
  handler: () => void,
): HTMLElement {
  const row = el("div", "practice-history-list-row");

  const header = el("div", "practice-history-list-header");
  const title = el("h4", "practice-history-list-title", dto.qList.getName());
  title.addEventListener("click", () => {
    handler();
  });
  header.appendChild(title);

  const detail = el("div", "practice-history-list-detail");
  const badges = el("div", "practice-history-list-badges");
  const isAnswerd = dto.practiceHistory.getIsAnswered();
  const answerd = el(
    "span",
    `practice-history-list-badge ${isAnswerd ? "answered-badge" : "answering-badge"}`,
    isAnswerd ? "回答済み" : "演習途中",
  );
  badges.appendChild(answerd);
  const isDefault = dto.qList.getIsDefault();
  const qListkind = el(
    "span",
    `practice-history-list-badge ${isDefault ? "default-badge" : "custom-badge"}`,
    isDefault ? "標準" : "カスタム",
  );
  badges.appendChild(qListkind);
  detail.appendChild(badges);
  const date = el("span", {
    text: formatToYMDHMS(dto.practiceHistory.getCreateAt()),
  });
  detail.appendChild(date);

  row.appendChild(header);
  row.appendChild(detail);
  return row;
}

interface PracticeContenHandlers {
  onClickPrevBtn: () => void;
  onClickNextBtn: () => void;
  onClickCompleteAnswer: () => void;
  onAnswered: (
    practiceHistoryId: number,
    questionId: number,
    isCorrect: boolean,
    selectChoice: number[],
  ) => void;
  onAnswerCanceled: (practiceHistoryId: number, questionId: number) => void;
  onFavoriteToggled: (
    questionId: number,
    tagId: number,
    checked: boolean,
  ) => void;
}
export function generatePracticeContent(
  practiceDetailDto: PracticeDetailDto,
  handlers: PracticeContenHandlers,
  defaultModal: Modal,
): HTMLElement {
  const questionDetailDto =
    practiceDetailDto.questionDetailDtos[
      practiceDetailDto.currentQuestionIndex
    ];

  const content = el("div", "practice-body");

  const header = el("div", "practice-header");
  const qListTitle = el(
    "h2",
    "practice-title",
    practiceDetailDto.qList.getName(),
  );
  header.appendChild(qListTitle);
  if (
    practiceDetailDto.questionDetailDtos.filter(
      (dto) => dto.ansHistory === null,
    ).length === 0
  ) {
    const headerActions = el("div", "practice-header-actions");
    const submitButton = el("button", {
      class: "practice-submit-button",
      text: "回答を提出",
      attr: [{ type: "button" }],
    });
    submitButton.addEventListener("click", () => {
      handlers.onClickCompleteAnswer();
    });
    headerActions.appendChild(submitButton);
    header.appendChild(headerActions);
  }

  const nav = el("div", "practice-nav-row");
  const prevBtn = el("button", "practice-nav-button", "前の問題");
  const progress = el(
    "div",
    "practice-progress",
    `${practiceDetailDto.currentQuestionIndex + 1} 問目 / ${practiceDetailDto.questionDetailDtos.length} 問中`,
  );
  const nextBtn = el("button", "practice-nav-button", "次の問題");
  nav.append(prevBtn, progress, nextBtn);

  const questionContent = generateQuestionContent(
    questionDetailDto,
    (tagId, checked) =>
      handlers.onFavoriteToggled(
        questionDetailDto.question.getId(),
        tagId,
        checked,
      ),
    practiceDetailDto.practiceHistory.getIsRandomC(),
    practiceDetailDto.practiceHistory.getIsAnswered(),
    {
      onAnswered: (isCorrect, selectChoice) =>
        handlers.onAnswered(
          practiceDetailDto.practiceHistory.getId(),
          questionDetailDto.question.getId(),
          isCorrect,
          selectChoice,
        ),
      onAnswerCanceled: () =>
        handlers.onAnswerCanceled(
          practiceDetailDto.practiceHistory.getId(),
          questionDetailDto.question.getId(),
        ),
    },
    defaultModal,
  );
  content.append(header, nav, questionContent);

  const innerModalElem = el("div", "app-modal-overlay hidden");
  const innerModal = new Modal(innerModalElem);
  content.appendChild(innerModalElem);

  prevBtn.addEventListener("click", () => {
    if (practiceDetailDto.currentQuestionIndex <= 0) {
      const modal = el("div", "answer-modal");
      const modalText = el("p", "answer-modal-text", "前の問題はありません");
      modal.appendChild(modalText);
      innerModal.setModal(modal, undefined, ModalSize.LG);
    } else {
      handlers.onClickPrevBtn();
    }
  });
  nextBtn.addEventListener("click", () => {
    if (
      practiceDetailDto.questionDetailDtos.length <=
      practiceDetailDto.currentQuestionIndex + 1
    ) {
      const modal = el("div", "answer-modal");
      const modalText = el("p", "answer-modal-text", "次の問題はありません");
      modal.appendChild(modalText);
      innerModal.setModal(modal, undefined, ModalSize.LG);
    } else {
      handlers.onClickNextBtn();
    }
  });
  return content;
}

interface PracticeResultContentHandlers {
  onClickRetryBtn: () => void;
  onClickReviewBtn: (questionIds: number[]) => void;
  onClickQuestionResult: (questionId: number) => void;
}
export function generatePracticeResultContent(
  practiceDetailDto: PracticeDetailDto,
  handlers: PracticeResultContentHandlers,
) {
  const correctQuestions = practiceDetailDto.questionDetailDtos.filter(
    (dto) => {
      if (dto.ansHistory && dto.ansHistory.getIsCorrect()) return true;
      return false;
    },
  );
  const totalCount = practiceDetailDto.questionDetailDtos.length;
  const rate =
    totalCount === 0 ? 0 : (correctQuestions.length / totalCount) * 100;
  const rateText = rate.toFixed(2);
  const rateLabel = `${rateText}%`;

  const body = el("div", "practice-body practice-result");

  const header = el("header", "practice-result-header");
  const title = el(
    "h2",
    "practice-result-title",
    practiceDetailDto.qList.getName(),
  );
  header.appendChild(title);

  const main = el("section", "practice-result-main");
  const grid = el("div", "practice-result-grid");

  const chartWrapper = el("div", "practice-result-chart-wrapper");
  const chartCircle = el(
    "div",
    "practice-result-chart-circle",
  ) as HTMLDivElement;
  chartCircle.setAttribute("role", "img");
  chartCircle.setAttribute("aria-label", `正答率 ${rateLabel}`);
  chartWrapper.appendChild(chartCircle);
  const clampedRate = Math.max(0, Math.min(100, rate));
  const deg = clampedRate * 3.6;
  chartCircle.style.setProperty("--practice-result-rate-deg", `${deg}deg`);
  chartWrapper.appendChild(chartCircle);

  const summary = el("div", "practice-result-summary");

  const summaryRow = el("div", "practice-result-summary-row");
  const summaryLabel = el("span", "practice-result-summary-label", "正答率");
  const summaryRate = el("span", "practice-result-summary-rate", rateLabel);
  summaryRow.appendChild(summaryLabel);
  summaryRow.appendChild(summaryRate);

  const count = el("p", "practice-result-summary-count");
  count.append("正答数 ");
  const countStrong = el(
    "span",
    "practice-result-summary-count-strong",
    String(correctQuestions.length),
  );
  const countTotal = el(
    "span",
    "practice-result-summary-count-total",
    `/ ${totalCount}問`,
  );
  count.appendChild(countStrong);
  count.appendChild(countTotal);

  summary.appendChild(summaryRow);
  summary.appendChild(count);

  grid.appendChild(chartWrapper);
  grid.appendChild(summary);
  main.appendChild(grid);

  const actions = el("section", "practice-result-actions");
  const retryBtn = el("button", {
    class: "practice-result-btn-re-practice",
    text: "再演習",
    attr: [{ type: "button" }],
  });
  retryBtn.addEventListener("click", () => {
    handlers.onClickRetryBtn();
  });

  const reviewBtn = el("button", {
    class: "practice-result-btn-review",
    text: "誤答の復習",
    attr: [
      {
        type: "button",
      },
    ],
  });
  reviewBtn.disabled = correctQuestions.length === totalCount;
  reviewBtn.addEventListener("click", () => {
    if (correctQuestions.length !== totalCount) {
      const incorrectQuestions = practiceDetailDto.questionDetailDtos
        .filter((dto) => {
          if (dto.ansHistory && !dto.ansHistory.getIsCorrect()) return true;
          return false;
        })
        .map((dto) => dto.question.getId());
      handlers.onClickReviewBtn(incorrectQuestions);
    }
  });

  actions.appendChild(retryBtn);
  actions.appendChild(reviewBtn);

  const listSection = el("section", "practice-result-list");
  for (const dto of practiceDetailDto.questionDetailDtos) {
    const row = generateQuestionListRow(
      dto.question,
      () => handlers.onClickQuestionResult(dto.question.getId()),
      dto.ansHistory ?? undefined,
    );
    listSection.appendChild(row);
  }

  body.appendChild(header);
  body.appendChild(main);
  body.appendChild(actions);
  body.appendChild(listSection);
  return body;
}
