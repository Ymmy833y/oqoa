import { Model } from '../models';
import { PracticeDetailDto } from '../models/dtos';
import { QList, Question } from '../models/entities';
import { QuestionSearchForm } from '../models/forms';
import { ModalKind, ModalSize, ToastMessage, ToastMessageKind } from '../types';
import { el, Modal, renderPagination } from '../utils';
import { generatePracticeStartContent } from './pracitce_view';
import { generateQListRow } from './qlist_view';
import { generateQuestionContent, generatePracticeContent, generateQuestionListRow, generatePracticeResultContent } from './question_view';
import { generateSettingModalConetnt } from './setting_view';
import { UIEventPayloadMap, UIEvent } from './ui_event_types';

export class View {
  private listeners: Partial<Record<UIEvent, unknown[]>> = {};

  private els: {
    settingBtn: HTMLButtonElement;

    defaultModal: HTMLButtonElement;
    toastParent: HTMLDivElement;

    practiceContainer: HTMLDivElement;
    qListsContainer: HTMLDivElement;
    questionsContainer: HTMLDivElement;
    questionsPagination: HTMLDivElement;
    questionSearchKeyword: HTMLInputElement;
    questionSearchIsCaseSensitive: HTMLButtonElement;
    questionSearchSubmit: HTMLButtonElement;
  }

  private defaultModal: Modal;

  private TOAST_AUTO_DISMISS = 10000;

  constructor(private doc: Document) {
    this.els = {
      settingBtn: this.$('#settingBtn'),
      defaultModal: this.$('#defaultModal'),
      toastParent: this.$('#toastParent'),
      practiceContainer: this.$('#practiceContainer'),
      qListsContainer: this.$('#qListsContainer'),
      questionsContainer: this.$('#questionsContainer'),
      questionsPagination: this.$('#questionsPagination'),
      questionSearchKeyword: this.$('#questionSearchKeyword'),
      questionSearchIsCaseSensitive: this.$('#questionSearchIsCaseSensitive'),
      questionSearchSubmit: this.$('#questionSearchSubmit'),
    };

    this.defaultModal = new Modal(this.els.defaultModal);

    this.els.settingBtn.addEventListener('click', () => {
      this.emit(UIEvent.CLICK_SETTING_BTN, undefined);
    });
    this.els.questionSearchKeyword.addEventListener('input', () => {
      const keyword = this.els.questionSearchKeyword.value;
      this.emit(UIEvent.CHANGE_QUESTION_SEARCH_KEYWORD, { keyword });
    });
    this.els.questionSearchIsCaseSensitive.addEventListener('click', () => {
      this.emit(UIEvent.TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE, undefined);
    });
    this.els.questionSearchSubmit.addEventListener('click', () => {
      this.emit(UIEvent.CLICK_QUESTION_SEARCH_SUBMIT, undefined);
    });
  }

  on<K extends UIEvent>(type: K, handler: (e: UIEventPayloadMap[K]) => void): void {
    const arr = (this.listeners[type] ??= []) as ((e: UIEventPayloadMap[K]) => void)[];
    arr.push(handler);
  }

  private emit<K extends UIEvent>(type: K, e: UIEventPayloadMap[K]): void {
    const arr = this.listeners[type] as ((x: UIEventPayloadMap[K]) => void)[] | undefined;
    arr?.forEach((h) => h(e));
  }

  render(model: Model): void {
    this.applyToastMessages(model.toastMessages);
    this.applyDefaultModal(model);

    if (model.practiceDetailDto !== null) {
      this.applyPracticeContent(model.practiceDetailDto);
    }
    this.applyQListsContent(model.qLists);
    this.applyQuestionsContent(model.questions);

    this.applyQuestionSearchForm(model.questionSearchForm, model.questions.length);
  }

  private applyToastMessages(toastMessages: ToastMessage[]): void {
    for (const toastMessage of toastMessages) {
      const toastElem = this.generateToastMessage(toastMessage);
      this.els.toastParent.appendChild(toastElem);
      this.emit(UIEvent.TOAST_DISMISS_REQUESTED, { uuid: toastMessage.uuid });
    }
  }

  private generateToastMessage(toastMessage: ToastMessage): HTMLDivElement {
    const toastElem = el('div', `toast toast--${toastMessage.kind.toLocaleLowerCase()}`);
    const toastIcon = (toastMessage.kind === ToastMessageKind.SUCCESS)
      ? el('i', {
        class: 'bi bi-check-circle-fill app-modal-button-icon',
        attr: [{ 'aria-hidden': 'true' }],
      })
      : el('i', {
        class: 'bi bi-exclamation-triangle-fill app-modal-button-icon',
        attr: [{ 'aria-hidden': 'true' }],
      });
    const toastBody = el('div', 'toast-body');
    const desc = el('p', 'toast-desc', toastMessage.message);
    toastBody.appendChild(desc);
    const closeBtn = el('button', `toast-close toast-close--${toastMessage.kind.toLocaleLowerCase()}`);
    const closeIcon = el('i', {
      class: 'bi bi-x-lg app-modal-button-icon',
      attr: [{ 'aria-hidden': 'true' }],
    })
    closeBtn.appendChild(closeIcon);
    toastElem.appendChild(toastIcon);
    toastElem.appendChild(toastBody);
    toastElem.appendChild(closeBtn);

    const timerId = window.setTimeout(() => {
      if (toastElem.isConnected) toastElem.remove();
    }, this.TOAST_AUTO_DISMISS);

    closeBtn.addEventListener('click', () => {
      clearTimeout(timerId);
      if (toastElem.isConnected) toastElem.remove();
    });
    return toastElem;
  }

  private applyDefaultModal(model: Model) {
    if (model.defailtModalKind === ModalKind.SETTING) {
      const content = generateSettingModalConetnt(
        model.theme, model.googleClientId ?? '', model.googleFolderId ?? '',
        {
          onThemeChange: (theme) => {
            this.emit(UIEvent.CHANGE_THEME, { theme });
          },
          onGoogleClientIdChange: (googleClientId) => {
            this.emit(UIEvent.CHANGE_GOOGLE_CLIENT_ID, { googleClientId });
          },
          onGoogleFolderIdChange: (googleFolderId) => {
            this.emit(UIEvent.CHANGE_GOOGLE_FOLDER_ID, { googleFolderId });
          },
          onGoogleDriveImport: () => {
            this.emit(UIEvent.CLICK_GOOGLE_DRIVE_IMPORT_BTN, undefined);
          }
        }
      );
      this.defaultModal.setModal(content, '設定', ModalSize.XL);
      this.emit(UIEvent.DEFAULT_MODAL_SHOWN, undefined);
    } else if (
      model.defailtModalKind === ModalKind.PRACTICE_START
      && model.preparePracticeStart
    ) {
      const content = generatePracticeStartContent(
        model.preparePracticeStart,
        (preparePracticeStart, isShuffleQuestions, isShuffleChoices) => {
          this.emit(UIEvent.CLICK_PRACTICE_START, {
            preparePracticeStart, isShuffleQuestions, isShuffleChoices
          });
          this.defaultModal.hide();
        }
      );
      this.defaultModal.setModal(content, '演習開始', ModalSize.XL);
      this.emit(UIEvent.DEFAULT_MODAL_SHOWN, undefined);
    } else if (model.defailtModalKind === ModalKind.QUESTION_DETAIL && model.questionDetailDto) {
      const ansHistory = model.questionDetailDto.ansHistory ?? undefined;
      const content = generateQuestionContent(
        model.questionDetailDto.question, ansHistory
      );
      this.defaultModal.setModal(content, '', ModalSize.XXL);
      this.emit(UIEvent.DEFAULT_MODAL_SHOWN, undefined);
    }
  }

  private applyPracticeContent(dto: PracticeDetailDto) {
    this.els.practiceContainer.innerHTML = '';

    const content = dto.practiceHistory.getIsAnswered()
      ? generatePracticeResultContent(
        dto,
        {
          onClickRetryBtn: () => {
            this.emit(UIEvent.CLICK_START_PRACTICE_SET, { qListId: dto.qList.getId() });
          },
          onClickReviewBtn: (questionIds) => {
            this.emit(UIEvent.CLICK_RESTART_PRACTICE_SET, { name: dto.qList.getName(), questionIds });
          },
          onClickQuestionResult: (questionId, ansHistoryId) => {
            this.emit(UIEvent.CLICK_QUESTION_LIST_ROW, { questionId, ansHistoryId });
          },
        }
      )
      : generatePracticeContent(
        dto,
        {
          onClickPrevBtn: () => {
            this.emit(UIEvent.CLICK_PRACTICE_PREV, undefined);
          },
          onClickNextBtn: () => {
            this.emit(UIEvent.CLICK_PRACTICE_NEXT, undefined);
          },
          onClickCompleteAnswer: () => {
            this.emit(UIEvent.CLICK_COMPLETE_ANSWER, undefined);
          },
          onAnswered: (practiceHistoryId, questionId, isCorrect, selectChoice) => {
            this.emit(UIEvent.PRACTICE_ANSWERED, { practiceHistoryId, questionId, isCorrect, selectChoice });
          },
          onAnswerCanceled: (practiceHistoryId, questionId) => {
            this.emit(UIEvent.PRACTICE_ANSWER_CANCELED, { practiceHistoryId, questionId });
          },
        },
        this.defaultModal
      );
    this.els.practiceContainer.appendChild(content);
  }

  private applyQListsContent(qLists: QList[]) {
    this.els.qListsContainer.innerHTML = '';
    qLists.forEach(qList => {
      const card = generateQListRow(
        qList,
        {
          onClickSolve: (qListId) => {
            this.emit(UIEvent.CLICK_START_PRACTICE_SET, { qListId });
          },
          onClickEdit: (qListId) => {
            this.emit(UIEvent.CLICK_QLIST_EDIT, { qListId });
          },
        }
      );
      this.els.qListsContainer.appendChild(card);
    });
  }

  private applyQuestionsContent(questions: Question[]) {
    this.els.questionsContainer.innerHTML = '';
    questions.forEach(question => {
      const card = generateQuestionListRow(
        question,
        () => {
          this.emit(UIEvent.CLICK_QUESTION_LIST_ROW, { questionId: question.getId() });
        }
      );
      this.els.questionsContainer.appendChild(card);
    });
  }

  private applyQuestionSearchForm(form: QuestionSearchForm, itemSize: number) {
    this.els.questionSearchKeyword.value = form.keyword;
    this.els.questionSearchIsCaseSensitive.setAttribute('aria-pressed', String(form.isCaseSensitive));
    renderPagination(
      this.els.questionsPagination,
      form.currentPage, form.pages, itemSize, form.totalSize,
      (page) => {
        this.emit(UIEvent.CHANGE_QUESTIONS_PAGE, { page });
      }
    )
  }

  private $<T extends Element>(selector: string): T {
    const el = this.doc.querySelector(selector);
    if (!el) throw new Error(`[PanelView] Missing element: ${selector}`);
    return el as T;
  }
  private $all<T extends Element>(selector: string): NodeListOf<T> {
    return this.doc.querySelectorAll<T>(selector);
  }
}
