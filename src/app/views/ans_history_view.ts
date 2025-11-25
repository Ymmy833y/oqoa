import { AnsHistoryDto } from "../models/dtos";
import { el, formatToYMDHMS, stripHtmlAndEntities } from "../utils";

interface AnsHistoryListRowHandlers {
  onClickPractice: () => void;
  onClickQuestion: () => void;
}
export function generateAnsHistoryListRow(
  dto: AnsHistoryDto,
  handlers: AnsHistoryListRowHandlers,
) {
  const { ansHistory, qList, question } = dto;

  const wrapper = el("div", "ans-history-row") as HTMLDivElement;

  const header = el("div", "ans-history-header");

  const idSpan = el("span", "question-list-row-id", `#${question.getId()}`);

  const textSpan = el(
    "span",
    "question-list-row-text",
    stripHtmlAndEntities(question.getProblem()),
  );
  textSpan.addEventListener("click", () => {
    handlers.onClickQuestion();
  });

  const isCorrect = ansHistory.getIsCorrect();
  const statusSpan = el("span", {
    class: `question-list-row-status ${isCorrect ? "text-correct" : "text-incorrect"}`,
  });
  const icon = el("i", {
    class: isCorrect ? "bi bi-circle" : "bi bi-x-lg",
    attr: [{ "aria-hidden": "true" }],
  });
  statusSpan.appendChild(icon);

  header.appendChild(idSpan);
  header.appendChild(textSpan);
  header.appendChild(statusSpan);

  const qListNameP = el(
    "p",
    "ans-history-q-list-name",
    `問題集名: ${qList.getName()}`,
  );
  qListNameP.addEventListener("click", () => {
    handlers.onClickPractice();
  });

  const dateDiv = el(
    "div",
    "ans-history-date",
    formatToYMDHMS(ansHistory.getAnswerDate()),
  );

  wrapper.appendChild(header);
  wrapper.appendChild(qListNameP);
  wrapper.appendChild(dateDiv);

  return wrapper;
}
