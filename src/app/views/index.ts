import { Model } from '../models';
import { PracticeDetailDto } from '../models/dtos';
import { QList, Question } from '../models/entities';
import { QuestionSearchForm } from '../models/forms';
import { QListSearchForm } from '../models/forms/qlist_search_form';
import { HistoryActiveTab, ModalKind, ModalSize, ToastMessage, ToastMessageKind } from '../enums';
import { el, Modal, renderPagination, scrollToTop } from '../utils';
import { generateAnsHistoryListRow } from './ans_history_view';
import { generatePracticeHistoryListRow, generatePracticeStartContent } from './pracitce_view';
import { generateQListEditContent, generateQListRow } from './qlist_view';
import { generateQuestionContent, generatePracticeContent, generateQuestionListRow, generatePracticeResultContent } from './question_view';
import { generateSettingModalConetnt } from './setting_view';
import { UIEventPayloadMap, UIEvent } from './ui_event_types';

export class View {
  private listeners: Partial<Record<UIEvent, unknown[]>> = {};

  private els: {
    settingBtn: HTMLButtonElement;
    menuBtn: HTMLButtonElement;

    sideMenu: HTMLDivElement;
    defaultModal: HTMLButtonElement;
    toastParent: HTMLDivElement;

    sideMenuCloseBtn: HTMLButtonElement;
    historyForPracticeBtn: HTMLButtonElement;
    historyForQuestionBtn: HTMLButtonElement;
    practiceHistoryList: HTMLDivElement;

    practiceContainer: HTMLDivElement;
    qListsContainer: HTMLDivElement;
    qListPagination: HTMLDivElement;
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
      menuBtn: this.$('#menuBtn'),

      sideMenu: this.$('#sideMenu'),
      defaultModal: this.$('#defaultModal'),
      toastParent: this.$('#toastParent'),

      sideMenuCloseBtn: this.$('#sideMenuCloseBtn'),
      historyForPracticeBtn: this.$('#historyForPracticeBtn'),
      historyForQuestionBtn: this.$('#historyForQuestionBtn'),
      practiceHistoryList: this.$('#practiceHistoryList'),

      practiceContainer: this.$('#practiceContainer'),
      qListsContainer: this.$('#qListsContainer'),
      qListPagination: this.$('#qListPagination'),
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
    this.els.menuBtn.addEventListener('click', () => {
      this.emit(UIEvent.CLICK_MENU_BTN, undefined);
      this.showSideMenuContent();
    });
    this.els.sideMenuCloseBtn.addEventListener('click', () => {
      this.hideSideMenuContent();
    });
    this.els.historyForPracticeBtn.addEventListener('click', () => {
      this.emit(UIEvent.CHANGE_HISTORY_ACTIVE_TAB, { activeTab: HistoryActiveTab.PRACTICE });
      this.toggleHistoryTab(this.els.historyForPracticeBtn, this.els.historyForQuestionBtn);
    });
    this.els.historyForQuestionBtn.addEventListener('click', () => {
      this.emit(UIEvent.CHANGE_HISTORY_ACTIVE_TAB, { activeTab: HistoryActiveTab.QUESTION });
      this.toggleHistoryTab(this.els.historyForQuestionBtn, this.els.historyForPracticeBtn);
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
    this.applyQListsContent(model.qListSearchForm, model.qLists);
    this.applyQuestionsContent(model.questions);

    this.applyQuestionSearchForm(model.questionSearchForm, model.questions.length);

    this.applyHistoryContent(model);
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
    } else if (model.defailtModalKind === ModalKind.PRACTICE_START && model.preparePracticeStart) {
      const content = generatePracticeStartContent(
        model.preparePracticeStart,
        (preparePracticeStart, isShuffleQuestions, isShuffleChoices) => {
          this.emit(UIEvent.CLICK_PRACTICE_START, {
            preparePracticeStart, isShuffleQuestions, isShuffleChoices
          });
          this.defaultModal.hide();
          scrollToTop();
          this.hideSideMenuContent();
        }
      );
      this.defaultModal.setModal(content, '演習開始', ModalSize.XL);
      this.emit(UIEvent.DEFAULT_MODAL_SHOWN, undefined);
    } else if (model.defailtModalKind === ModalKind.QLIST_EDIT && model.editQList) {
      const qList = model.editQList;
      const content = generateQListEditContent(
        qList,
        (name, isDefault) => {
          this.emit(UIEvent.CLICK_EDIT_APPLY, { qList, name, isDefault });
          this.defaultModal.hide();
        }
      );
      this.defaultModal.setModal(content, `問題集「${qList.getName()}」 編集`, ModalSize.XL);
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

  private applyQListsContent(form: QListSearchForm, qLists: QList[]) {
    this.els.qListsContainer.innerHTML = '';
    qLists.forEach(qList => {
      const card = generateQListRow(
        qList,
        {
          onClickSolve: (qListId) => {
            this.emit(UIEvent.CLICK_START_PRACTICE_SET, { qListId });
          },
          onClickEdit: () => {
            this.emit(UIEvent.CLICK_QLIST_EDIT, { qList });
          },
        }
      );
      this.els.qListsContainer.appendChild(card);
    });

    renderPagination(this.els.qListPagination,
      form.currentPage, form.pages, qLists.length, form.totalSize,
      (page) => this.emit(UIEvent.CHANGE_QLIST_PAGE, { page })
    );
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

  private applyHistoryContent(model: Model) {
    const pagination = el('div');

    this.els.practiceHistoryList.innerHTML = ''
    this.els.practiceHistoryList.appendChild(pagination);

    if (model.historyActiveTab === HistoryActiveTab.PRACTICE) {
      const dtos = model.practiceHistoryDtos;
      const form = model.practiceHistorySearchForm;
      dtos.forEach(dto => {
        const card = generatePracticeHistoryListRow(dto,
          () => {
            this.emit(UIEvent.CLICK_EXIST_PRACTICE_START, { practiceHistoryId: dto.practiceHistory.getId() });
            this.hideSideMenuContent();
          }
        );
        this.els.practiceHistoryList.appendChild(card);
      });
      renderPagination(pagination,
        form.currentPage, form.pages, dtos.length, form.totalSize,
        (page) => this.emit(UIEvent.CHANGE_PRACTICE_HISTORY_PAGE, { page })
      );
    } else {
      const dtos = model.ansHistoryDtos;
      const form = model.ansHistorySearchForm;
      dtos.forEach(dto => {
        const card = generateAnsHistoryListRow(dto,
          {
            onClickPractice: () => {
              this.emit(UIEvent.CLICK_EXIST_PRACTICE_START, { practiceHistoryId: dto.ansHistory.getPracticeHistoryId() });
              this.hideSideMenuContent();
            },
            onClickQuestion: () => {
              this.emit(UIEvent.CLICK_QUESTION_LIST_ROW, {
                questionId: dto.question.getId(),
                ansHistoryId: dto.ansHistory.getId(),
              });
            }
          }
        );
        this.els.practiceHistoryList.appendChild(card);
      });
      renderPagination(pagination,
        form.currentPage, form.pages, dtos.length, form.totalSize,
        (page) => this.emit(UIEvent.CHANGE_PRACTICE_HISTORY_PAGE, { page })
      );
    }
  }

  private showSideMenuContent() {
    this.els.sideMenu.classList.remove('translate-x-full');
    this.els.sideMenu.classList.add('translate-x-0');
  }

  private hideSideMenuContent() {
    this.els.sideMenu.classList.add('translate-x-full');
    this.els.sideMenu.classList.remove('translate-x-0');
  }

  private toggleHistoryTab(activeTab: HTMLButtonElement, inactiveTab: HTMLButtonElement) {
    activeTab.classList.remove('side-menu-tab--inactive');
    activeTab.classList.add('side-menu-tab--active');
    inactiveTab.classList.remove('side-menu-tab--active');
    inactiveTab.classList.add('side-menu-tab--inactive');
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
