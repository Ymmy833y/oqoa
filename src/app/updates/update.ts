import { Model } from '../models';
import { ActionType, Action } from './action_types';
import { EffectType, Effect } from '../controllers/effect_types';
import { getGoogleClientId, getGoogleFolderId, getTheme } from '../storages';
import { HistoryActiveTab, ModalKind, Theme } from '../types';

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

  case Action.SEARCH_HISTORY: {
    const activeTab = action.activeTab ?? model.historyActiveTab;
    if (activeTab === HistoryActiveTab.PRACTICE) {
      return {
        model: { ...model, historyActiveTab: activeTab },
        effects: [{ kind: Effect.SEARCH_PRACTICE_HISTORY }]
      }
    } else {
      return {
        model: { ...model, historyActiveTab: activeTab },
        effects: [{ kind: Effect.SEARCH_ANS_HISTORY }]
      }
    }
  }

  case Action.DEFAULT_MODAL_SHOWN:
    return {
      model: { ...model, defailtModalKind: null, preparePracticeStart: null },
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
      model: {
        ...model,
        qLists: action.qLists,
        qListSearchForm: {
          ...model.qListSearchForm,
          currentPage: action.currentPage,
          totalSize: action.totalSize,
          pages: action.pages,
        }
      },
      effects: []
    }

  case Action.CHANGE_QLIST_PAGE:
    return {
      model: {
        ...model,
        qListSearchForm: {
          ...model.qListSearchForm,
          currentPage: action.page,
        }
      },
      effects: [{ kind: Effect.SEARCH_QLIST }]
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

  case Action.PREPARE_PRACTICE_START:
    return {
      model,
      effects: [{ kind: Effect.PREPARE_PRACTICE_START, qListId: action.qListId }]
    }

  case Action.SHOW_PRACTICE_START:
    return {
      model: {
        ...model,
        defailtModalKind: ModalKind.PRACTICE_START,
        preparePracticeStart: action.qList,
      },
      effects: []
    }

  case Action.SHOW_CUSTOM_PRACTICE_START:
    return {
      model: {
        ...model,
        defailtModalKind: ModalKind.PRACTICE_START,
        preparePracticeStart: action.customPracticeStartDto,
      },
      effects: []
    }

  case Action.PREPARE_PRACTICE:
    return {
      model,
      effects: [{
        kind: Effect.PREPARE_PRACTICE,
        preparePracticeStart: action.preparePracticeStart,
        isShuffleQuestions: action.isShuffleQuestions,
        isShuffleChoices: action.isShuffleChoices
      }]
    }

  case Action.PREPARE_EXIST_PRACTICE:
    return {
      model,
      effects: [{ kind: Effect.PREPARE_EXIST_PRACTICE, practiceHistoryId: action.practiceHistoryId }]
    }

  case Action.SHOW_PRACTICE:
    return {
      model: { ...model, practiceDetailDto: action.practiceDetailDto },
      effects: []
    }

  case Action.PREPARE_QUESTION_DETAIL:
    return {
      model,
      effects: [{ kind: Effect.PREPARE_QUESTION_DETAIL, questionId: action.questionId, ansHistoryId: action.ansHistoryId }]
    }

  case Action.SHOW_QUESTION_DETAIL:
    return {
      model: {
        ...model,
        defailtModalKind: ModalKind.QUESTION_DETAIL,
        questionDetailDto: action.questionDetailDto
      },
      effects: []
    }

  case Action.PRACTICE_PREV: {
    if (model.practiceDetailDto) {
      return {
        model: {
          ...model,
          practiceDetailDto: {
            ...model.practiceDetailDto,
            currentQuestionIndex: model.practiceDetailDto.currentQuestionIndex - 1
          }
        },
        effects: []
      }
    }
  }

  case Action.PRACTICE_NEXT: {
    if (model.practiceDetailDto) {
      return {
        model: {
          ...model,
          practiceDetailDto: {
            ...model.practiceDetailDto,
            currentQuestionIndex: model.practiceDetailDto.currentQuestionIndex + 1
          }
        },
        effects: []
      }
    }
  }

  case Action.COMPLETE_ANSWER:
    return {
      model: model,
      effects: [{ kind: Effect.COMPLETE_ANSWER }]
    }

  case Action.PRACTICE_ANSWERED:
    return {
      model: model,
      effects: [{
        kind: Effect.PRACTICE_ANSWERED,
        practiceHistoryId: action.practiceHistoryId,
        questionId: action.questionId,
        isCorrect: action.isCorrect,
        selectChoice: action.selectChoice
      }]
    }

  case Action.PRACTICE_ANSWER_CANCELED:
    return {
      model: model,
      effects: [{
        kind: Effect.PRACTICE_ANSWER_CANCELED,
        practiceHistoryId: action.practiceHistoryId,
        questionId: action.questionId
      }]
    }

  case Action.UPDATE_PRACTICE_HISTORY_LIST_CONTAINER:
    return {
      model: {
        ...model,
        practiceHistorySearchForm: {
          ...model.practiceHistorySearchForm,
          currentPage: action.currentPage,
          totalSize: action.totalSize,
          pages: action.pages,
        },
        practiceHistoryDtos: action.practiceHistoryDtos
      },
      effects: []
    }

  case Action.UPDATE_ANS_HISTORY_LIST_CONTAINER:
    return {
      model: {
        ...model,
        ansHistorySearchForm: {
          ...model.ansHistorySearchForm,
          currentPage: action.currentPage,
          totalSize: action.totalSize,
          pages: action.pages,
        },
        ansHistoryDtos: action.ansHistoryDtos
      },
      effects: []
    }

  case Action.CHANGE_HISTORY_PAGE: {
    if (model.historyActiveTab === HistoryActiveTab.PRACTICE) {
      return {
        model: {
          ...model,
          practiceHistorySearchForm: {
            ...model.practiceHistorySearchForm,
            currentPage: action.page
          }
        },
        effects: [{ kind: Effect.SEARCH_PRACTICE_HISTORY }]
      }
    } else {
      return {
        model: {
          ...model,
          ansHistorySearchForm: {
            ...model.ansHistorySearchForm,
            currentPage: action.page
          }
        },
        effects: [{ kind: Effect.SEARCH_ANS_HISTORY }]
      }
    }
  }

  default:
    return { model, effects: []};
  }
}
