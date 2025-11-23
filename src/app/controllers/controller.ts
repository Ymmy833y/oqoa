import { View } from '../views';
import { update } from '../updates/update';
import { ActionType, Action } from '../updates/action_types';
import { UIEvent } from '../views/ui_event_types';
import { initialModel, Model } from '../models';
import { ModalKind, Theme, ToastMessageKind } from '../enums';
import { Effect, EffectType } from './effect_types';
import { getLastImportedData, getLastUsedQuestions, setGoogleClientId, setGoogleFolderId, setLastUsedQuestions, setTheme } from '../storages';

import * as ansHistoryService from '../services/ans_history_service';
import * as importGoogleDriveService from '../services/import_google_drive_service';
import * as indexeddbService from '../services/indexeddb_service';
import * as practiceSevice from '../services/practice_sevice';
import * as qListService from '../services/qlist_service';
import * as questionService from '../services/question_service';
import { qListRepository } from '../repositories/qlist_repositoriy';
import { questionRepository } from '../repositories/question_repositoriy';
import { generateErrorToastMessage } from '../utils';
import { QList } from '../models/entities';

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

export class Controller {
  private model: Model = structuredClone(initialModel);

  constructor(private view: View) {}

  async start(): Promise<void> {
    this.registerViewHandlers();
    this.dispatch({ type: Action.INIT });
  }

  private registerViewHandlers() {
    this.view.on(UIEvent.CLICK_SETTING_BTN, () =>
      this.dispatch({ type: Action.OPEN_DEFAULT_MODAL, kind: ModalKind.SETTING }),
    );
    this.view.on(UIEvent.CLICK_MENU_BTN, () =>
      this.dispatch({ type: Action.SEARCH_HISTORY }),
    );
    this.view.on(UIEvent.DEFAULT_MODAL_SHOWN , () =>
      this.dispatch({ type: Action.DEFAULT_MODAL_SHOWN }),
    );
    this.view.on(UIEvent.TOAST_DISMISS_REQUESTED , ({ uuid }) =>
      this.dispatch({ type: Action.TOAST_DISMISS_REQUESTED, uuid }),
    );
    this.view.on(UIEvent.CHANGE_THEME, ({ theme }) =>
      this.dispatch({ type: Action.CHANGE_THEME, theme }),
    );
    this.view.on(UIEvent.CHANGE_GOOGLE_CLIENT_ID, ({ googleClientId }) =>
      this.dispatch({ type: Action.CHANGE_GOOGLE_CLIENT_ID, googleClientId }),
    );
    this.view.on(UIEvent.CHANGE_GOOGLE_FOLDER_ID, ({ googleFolderId }) =>
      this.dispatch({ type: Action.CHANGE_GOOGLE_FOLDER_ID, googleFolderId }),
    );
    this.view.on(UIEvent.CLICK_GOOGLE_DRIVE_IMPORT_BTN, () =>
      this.dispatch({ type: Action.IMPORT_GOOGLE_DRIVE_DATA }),
    );
    this.view.on(UIEvent.CHANGE_QUESTION_SEARCH_KEYWORD, ({ keyword }) =>
      this.dispatch({ type: Action.CHANGE_QUESTION_SEARCH_KEYWORD, keyword }),
    );
    this.view.on(UIEvent.TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE, () =>
      this.dispatch({ type: Action.TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE }),
    );
    this.view.on(UIEvent.CLICK_QUESTION_SEARCH_SUBMIT, () =>
      this.dispatch({ type: Action.SEARCH_QUESTION }),
    );
    this.view.on(UIEvent.CHANGE_QLIST_PAGE, ({ page }) =>
      this.dispatch({ type: Action.CHANGE_QLIST_PAGE, page }),
    );
    this.view.on(UIEvent.CHANGE_QUESTIONS_PAGE, ({ page }) =>
      this.dispatch({ type: Action.CHANGE_QUESTIONS_PAGE, page }),
    );
    this.view.on(UIEvent.CLICK_START_PRACTICE_SET, ({ qListId }) =>
      this.dispatch({ type: Action.PREPARE_PRACTICE_START, qListId }),
    );
    this.view.on(UIEvent.CLICK_QLIST_EDIT, ({ qList }) =>
      this.dispatch({ type: Action.SHOW_QLIST_EDIT, qList }),
    );
    this.view.on(UIEvent.CLICK_EDIT_APPLY, ({ qList, name, isDefault }) =>
      this.dispatch({ type: Action.UPDATE_QLIST, qList, name, isDefault }),
    );
    this.view.on(UIEvent.CLICK_RESTART_PRACTICE_SET, ({ name, questionIds }) => {
      this.dispatch({
        type: Action.SHOW_CUSTOM_PRACTICE_START,
        customPracticeStartDto: { name, questionIds, isReview: true },
      });
    });
    this.view.on(UIEvent.CLICK_PRACTICE_START, ({ preparePracticeStart, isShuffleQuestions, isShuffleChoices }) =>
      this.dispatch({ type: Action.PREPARE_PRACTICE, preparePracticeStart, isShuffleQuestions, isShuffleChoices }),
    );
    this.view.on(UIEvent.CLICK_QUESTION_LIST_ROW, ({ questionId, ansHistoryId }) =>
      this.dispatch({ type: Action.PREPARE_QUESTION_DETAIL, questionId, ansHistoryId }),
    );
    this.view.on(UIEvent.CLICK_PRACTICE_PREV, () =>
      this.dispatch({ type: Action.PRACTICE_PREV }),
    );
    this.view.on(UIEvent.CLICK_PRACTICE_NEXT, () =>
      this.dispatch({ type: Action.PRACTICE_NEXT }),
    );
    this.view.on(UIEvent.CLICK_COMPLETE_ANSWER, () =>
      this.dispatch({ type: Action.COMPLETE_ANSWER }),
    );
    this.view.on(UIEvent.PRACTICE_ANSWERED, ({ practiceHistoryId, questionId, isCorrect, selectChoice }) =>
      this.dispatch({ type: Action.PRACTICE_ANSWERED, practiceHistoryId, questionId, isCorrect, selectChoice }),
    );
    this.view.on(UIEvent.PRACTICE_ANSWER_CANCELED, ({ practiceHistoryId, questionId }) =>
      this.dispatch({ type: Action.PRACTICE_ANSWER_CANCELED, practiceHistoryId, questionId }),
    );
    this.view.on(UIEvent.CHANGE_PRACTICE_HISTORY_PAGE, ({ page }) =>
      this.dispatch({ type: Action.CHANGE_HISTORY_PAGE, page }),
    );
    this.view.on(UIEvent.CLICK_EXIST_PRACTICE_START, ({ practiceHistoryId }) =>
      this.dispatch({ type: Action.PREPARE_EXIST_PRACTICE, practiceHistoryId }),
    );
    this.view.on(UIEvent.CHANGE_HISTORY_ACTIVE_TAB, ({ activeTab }) =>
      this.dispatch({ type: Action.SEARCH_HISTORY, activeTab }),
    );
  }

  private dispatch(action: ActionType): void {
    const { model, effects } = update(this.model, action);
    this.model = model;
    this.view.render(this.model);
    void this.execEffects(effects).catch(console.error);
  }

  private async execEffects(effects: EffectType[]): Promise<void> {
    for (const fx of effects) {
      switch(fx.kind) {
      case Effect.INIT_REPOSITORY: {
        await indexeddbService.initDatabase()
          .then(() => {
            console.info('App is starting...');
          })
          .catch((error) => {
            console.error('indexeddb connection error:', error);
            this.dispatch({
              type: Action.TOAST_ADD,
              toastMessage: generateErrorToastMessage('Indexeddbへの接続に失敗しました'),
            })
          })

        const importDate = getLastImportedData();
        if (importDate && (importDate.getTime() + THREE_DAYS) < Date.now()) {
          setLastUsedQuestions([]);
        }
        const lastUsedQuestions = getLastUsedQuestions();
        if (lastUsedQuestions && lastUsedQuestions.length > 0) {
          questionRepository.bulkInsert(lastUsedQuestions);
        }

        const qListData = await qListService.selectQListsForSearchForm(this.model.qListSearchForm);
        this.dispatch({
          type: Action.UPDATE_QLIST_CONTAINER, qLists: qListData.qLists,
          currentPage: qListData.currentPage, totalSize: qListData.totalSize, pages: qListData.pages
        });
        const questionData = questionService.selectQuestionsForSearchForm(this.model.questionSearchForm);
        this.dispatch({
          type: Action.UPDATE_QUESTION_LIST_CONTAINER, questions: questionData.questions,
          currentPage: qListData.currentPage, totalSize: questionData.totalSize, pages: questionData.pages
        });
        break;
      }

      case Effect.UPDATE_THEME: {
        setTheme(fx.theme);
        if (fx.theme === Theme.DARK) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        break;
      }

      case Effect.UPDATE_GOOGLE_CLIENT_ID: {
        setGoogleClientId(fx.googleClientId);
        break;
      }

      case Effect.UPDATE_GOOGLE_FOLDER_ID: {
        setGoogleFolderId(fx.googleFolderId);
        break;
      }

      case Effect.IMPORT_GOOGLE_DRIVE: {
        const toastMessage = await importGoogleDriveService.importProbelmForGoogleDrive(fx.googleClientId, fx.googleFolderId);
        this.dispatch({ type: Action.TOAST_ADD, toastMessage })

        if (toastMessage.kind === ToastMessageKind.SUCCESS) {
          const qListData = await qListService.selectQListsForSearchForm(this.model.qListSearchForm);
          this.dispatch({
            type: Action.UPDATE_QLIST_CONTAINER, qLists: qListData.qLists,
            currentPage: qListData.currentPage, totalSize: qListData.totalSize, pages: qListData.pages
          });
          const questionData = questionService.selectQuestionsForSearchForm(this.model.questionSearchForm);
          this.dispatch({
            type: Action.UPDATE_QUESTION_LIST_CONTAINER, questions: questionData.questions,
            currentPage: qListData.currentPage, totalSize: questionData.totalSize, pages: questionData.pages
          });
        }
        break;
      }

      case Effect.SEARCH_QLIST: {
        const { qLists, currentPage, totalSize, pages } = await qListService.selectQListsForSearchForm(this.model.qListSearchForm);
        this.dispatch({ type: Action.UPDATE_QLIST_CONTAINER, qLists, currentPage, totalSize, pages });
        break;
      }

      case Effect.SEARCH_QUESTION: {
        const { questions, currentPage, totalSize, pages } = questionService.selectQuestionsForSearchForm(this.model.questionSearchForm);
        this.dispatch({ type: Action.UPDATE_QUESTION_LIST_CONTAINER, questions, currentPage, totalSize, pages });
        break;
      }

      case Effect.PREPARE_PRACTICE_START: {
        const qList = await qListRepository.selectById(fx.qListId);
        this.dispatch({ type: Action.SHOW_PRACTICE_START, qList });
        break;
      }

      case Effect.UPDATE_QLIST: {
        const qList = fx.qList;
        qList.setName(fx.name);
        qList.setIsDefault(fx.isDefault);
        await qListRepository.update(qList.generateRow());
        const qListData = await qListService.selectQListsForSearchForm(this.model.qListSearchForm);
        this.dispatch({
          type: Action.UPDATE_QLIST_CONTAINER, qLists: qListData.qLists,
          currentPage: qListData.currentPage, totalSize: qListData.totalSize, pages: qListData.pages
        });
        break;
      }

      case Effect.PREPARE_PRACTICE: {
        const practiceDetailDto = (fx.preparePracticeStart instanceof QList)
          ? await practiceSevice.generatePracticeDetailDto(
            fx.preparePracticeStart, fx.isShuffleQuestions, fx.isShuffleChoices
          )
          : await practiceSevice.generatePracticeDetailDtoForCustom(
            fx.preparePracticeStart, fx.isShuffleQuestions, fx.isShuffleChoices
          );
        this.dispatch({ type: Action.SHOW_PRACTICE, practiceDetailDto });
        break;
      }

      case Effect.PREPARE_EXIST_PRACTICE: {
        const practiceDetailDto = await practiceSevice.generatePracticeDetailDtoForExist(
          fx.practiceHistoryId
        );
        this.dispatch({ type: Action.SHOW_PRACTICE, practiceDetailDto });
        break;
      }

      case Effect.PREPARE_QUESTION_DETAIL: {
        try {
          const questionDetailDto = await questionService.generateQuestionDetailDto(
            fx.questionId, fx.ansHistoryId
          );
          this.dispatch({ type: Action.SHOW_QUESTION_DETAIL, questionDetailDto });
        } catch (e) {
          const error = e as Error;
          this.dispatch({ type: Action.TOAST_ADD, toastMessage: generateErrorToastMessage(error) })
        }
        break;
      }

      case Effect.COMPLETE_ANSWER: {
        if (this.model.practiceDetailDto === null) {
          break;
        }
        try {
          const practiceDetailDto = await practiceSevice.doPracticeComplete(this.model.practiceDetailDto);
          this.dispatch({ type: Action.SHOW_PRACTICE, practiceDetailDto });
        } catch (e) {
          const error = e as Error;
          this.dispatch({ type: Action.TOAST_ADD, toastMessage: generateErrorToastMessage(error) })
        }
        break;
      }

      case Effect.PRACTICE_ANSWERED: {
        if (this.model.practiceDetailDto === null) {
          break;
        }
        const practiceDetailDto = await ansHistoryService.insertAnsHistory(
          this.model.practiceDetailDto, fx.practiceHistoryId, fx.questionId, fx.isCorrect, fx.selectChoice
        );
        this.dispatch({ type: Action.SHOW_PRACTICE, practiceDetailDto });
        break;
      }

      case Effect.PRACTICE_ANSWER_CANCELED: {
        if (this.model.practiceDetailDto === null) {
          break;
        }
        const { practiceDetailDto, toastMessage } = await ansHistoryService.cancelAnsHistory(
          this.model.practiceDetailDto, fx.practiceHistoryId, fx.questionId
        );
        this.dispatch({ type: Action.SHOW_PRACTICE, practiceDetailDto });
        this.dispatch({ type: Action.TOAST_ADD, toastMessage });
        break;
      }

      case Effect.SEARCH_PRACTICE_HISTORY: {
        const { practiceHistoryDtos, currentPage, totalSize, pages } = await practiceSevice.selectPracticeHistoryDtos(
          this.model.practiceHistorySearchForm
        );
        this.dispatch({ type: Action.UPDATE_PRACTICE_HISTORY_LIST_CONTAINER, practiceHistoryDtos, currentPage, totalSize, pages });
        break;
      }

      case Effect.SEARCH_ANS_HISTORY: {
        const { ansHistoryDtos, currentPage, totalSize, pages } = await ansHistoryService.selectAnsHistoryDtos(
          this.model.ansHistorySearchForm
        );
        this.dispatch({ type: Action.UPDATE_ANS_HISTORY_LIST_CONTAINER, ansHistoryDtos, currentPage, totalSize, pages });
        break;
      }
      }
    }
  }
}
