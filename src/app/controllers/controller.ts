import { View } from '../views';
import { update } from '../updates/update';
import { ActionType, Action } from '../updates/action_types';
import { UIEvent } from '../views/ui_event_types';
import { initialModel, Model } from '../models';
import { ModalKind, Theme } from '../types';
import { Effect, EffectType } from './effect_types';
import { setGoogleClientId, setGoogleFolderId, setTheme } from '../storages';
import * as indexeddbService from '../services/indexeddb_service';
import * as importGoogleDriveService from '../services/import_google_drive_service';
import * as questionService from '../services/question_service';
import { qListRepository } from '../repositories/qlist_repositoriy';

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
          })

        const qLists = await qListRepository.selectByStandard();
        this.dispatch({ type: Action.UPDATE_QLIST_CONTAINER, qLists });
        const questions = questionService.selectQuestionsForSearchForm(this.model.questionSearchForm);
        this.dispatch({ type: Action.UPDATE_QUESTION_LIST_CONTAINER, questions });
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

        const qLists = await qListRepository.selectByStandard();
        this.dispatch({ type: Action.UPDATE_QLIST_CONTAINER, qLists });
        const questions = questionService.selectQuestionsForSearchForm(this.model.questionSearchForm);
        this.dispatch({ type: Action.UPDATE_QUESTION_LIST_CONTAINER, questions });
        break;
      }

      case Effect.SEARCH_QUESTION: {
        const questions = questionService.selectQuestionsForSearchForm(this.model.questionSearchForm);
        this.dispatch({ type: Action.UPDATE_QUESTION_LIST_CONTAINER, questions });
        break;
      }
      }
    }
  }
}
