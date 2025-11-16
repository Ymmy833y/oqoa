import { Model } from '../models';
import { ActionType, Action } from './action_types';
import { EffectType, Effect } from '../controllers/effect_types';
import { getGoogleClientId, getGoogleFolderId, getTheme } from '../storages';
import { Theme } from '../types';

export function update(model: Model, action: ActionType): { model: Model; effects: EffectType[] } {
  switch (action.type) {
  case Action.INIT: {
    const storageTheme = getTheme();
    const theme = (storageTheme)
      ? storageTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
    const googleClientId = getGoogleClientId();
    const googleFolderId = getGoogleFolderId();

    return {
      model: { ...model, theme, googleClientId, googleFolderId },
      effects: [
        { kind: Effect.INIT_REPOSITORY, },
        { kind: Effect.UPDATE_THEME, theme },
      ]
    };
  }

  case Action.OPEN_DEFAULT_MODAL:
    return {
      model: { ...model, defailtModalKind: action.kind },
      effects: []
    }

  case Action.DEFAULT_MODAL_SHOWN:
    return {
      model: { ...model, defailtModalKind: null },
      effects: []
    }

  case Action.TOAST_ADD:
    return {
      model: { ...model, toastMessages: [...model.toastMessages, action.toastMessage] },
      effects: [],
    };

  case Action.TOAST_DISMISS_REQUESTED: {
    const toastMessages = model.toastMessages.filter((t) => t.uuid !== action.uuid);
    return {
      model: { ...model, toastMessages },
      effects: [],
    };
  }

  case Action.CHANGE_THEME:
    return {
      model: { ...model, theme: action.theme },
      effects: [{ kind: Effect.UPDATE_THEME, theme: action.theme }]
    }

  case Action.CHANGE_GOOGLE_CLIENT_ID:
    return {
      model: { ...model, googleClientId: action.googleClientId },
      effects: [{ kind: Effect.UPDATE_GOOGLE_CLIENT_ID, googleClientId: action.googleClientId }]
    }

  case Action.CHANGE_GOOGLE_FOLDER_ID:
    return {
      model: { ...model, googleFolderId: action.googleFolderId },
      effects: [{ kind: Effect.UPDATE_GOOGLE_FOLDER_ID, googleFolderId: action.googleFolderId }]
    }

  case Action.IMPORT_GOOGLE_DRIVE_DATA: {
    const googleClientId = model.googleClientId;
    const googleFolderId = model.googleFolderId;
    if (googleClientId && googleFolderId) {
      return {
        model,
        effects: [
          { kind: Effect.IMPORT_GOOGLE_DRIVE, googleClientId, googleFolderId }
        ]
      }
    }
    return { model, effects: [] }
  }

  case Action.UPDATE_QLIST_CONTAINER:
    return {
      model: { ...model, qLists: action.qLists },
      effects: []
    }

  case Action.UPDATE_QUESTION_LIST_CONTAINER:
    return {
      model: {
        ...model,
        questions: action.questions,
        questionSearchForm: {
          ...model.questionSearchForm,
          currentPage: action.currentPage,
          totalSize: action.totalSize,
          pages: action.pages,
        }
      },
      effects: []
    }

  case Action.CHANGE_QUESTION_SEARCH_KEYWORD:
    return {
      model: {
        ...model,
        questionSearchForm: {
          ...model.questionSearchForm,
          keyword: action.keyword,
        }
      },
      effects: []
    }

  case Action.TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE:
    return {
      model: {
        ...model,
        questionSearchForm: {
          ...model.questionSearchForm,
          isCaseSensitive: !model.questionSearchForm.isCaseSensitive,
        }
      },
      effects: []
    }

  case Action.SEARCH_QUESTION:
    return {
      model,
      effects: [{ kind: Effect.SEARCH_QUESTION }]
    }

  case Action.CHANGE_QUESTIONS_PAGE:
    return {
      model: {
        ...model,
        questionSearchForm: {
          ...model.questionSearchForm,
          currentPage: action.page,
        }
      },
      effects: [{ kind: Effect.SEARCH_QUESTION }]
    }

  default:
    return { model, effects: []};
  }
}
