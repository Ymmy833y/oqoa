import { HistoryActiveTab, Theme } from "../enums";
import { CustomPracticeStartDto } from "../models/dtos";
import { QList } from "../models/entities";

export enum UIEvent {
  CLICK_SETTING_BTN = "CLICK_SETTING_BTN",
  CLICK_MENU_BTN = "CLICK_MENU_BTN",
  DEFAULT_MODAL_SHOWN = "DEFAULT_MODAL_SHOWN",
  TOAST_DISMISS_REQUESTED = "TOAST_DISMISS_REQUESTED",
  CHANGE_THEME = "CHANGE_THEME",
  CHANGE_GOOGLE_CLIENT_ID = "CHANGE_GOOGLE_CLIENT_ID",
  CHANGE_GOOGLE_FOLDER_ID = "CHANGE_GOOGLE_FOLDER_ID",
  CLICK_GOOGLE_DRIVE_IMPORT_BTN = "CLICK_GOOGLE_DRIVE_IMPORT_BTN",
  CLICK_REMOVE_QUESTION_BTN = "CLICK_REMOVE_QUESTION_BTN",
  CLICK_QUESTION_SEARCH_SUBMIT = "CLICK_QUESTION_SEARCH_SUBMIT",
  CHANGE_QUESTIONS_PAGE = "CHANGE_QUESTIONS_PAGE",
  CHANGE_QLIST_PAGE = "CHANGE_QLIST_PAGE",
  CLICK_START_PRACTICE_SET = "CLICK_START_PRACTICE_SET",
  CLICK_RESTART_PRACTICE_SET = "CLICK_RESTART_PRACTICE_SET",
  CLICK_QLIST_EDIT = "CLICK_QLIST_EDIT",
  CLICK_PRACTICE_START = "CLICK_PRACTICE_START",
  CLICK_EDIT_APPLY = "CLICK_EDIT_APPLY",
  CLICK_QUESTION_LIST_ROW = "CLICK_QUESTION_LIST_ROW",
  CLICK_PRACTICE_PREV = "CLICK_PRACTICE_PREV",
  CLICK_PRACTICE_NEXT = "CLICK_PRACTICE_NEXT",
  CLICK_COMPLETE_ANSWER = "CLICK_COMPLETE_ANSWER",
  PRACTICE_ANSWERED = "PRACTICE_ANSWERED",
  PRACTICE_ANSWER_CANCELED = "PRACTICE_ANSWER_CANCELED",
  CHANGE_PRACTICE_HISTORY_PAGE = "CHANGE_PRACTICE_HISTORY_PAGE",
  CLICK_EXIST_PRACTICE_START = "CLICK_EXIST_PRACTICE_START",
  CHANGE_HISTORY_ACTIVE_TAB = "CHANGE_HISTORY_ACTIVE_TAB",
  TOGGLE_QLISTS_STANDARD_CHECK = "TOGGLE_QLISTS_STANDARD_CHECK",
  CLICK_CUSTOM_PRACTICE_START = "CLICK_CUSTOM_PRACTICE_START",
  CLICK_QUESTION_FAVORITE = "CLICK_QUESTION_FAVORITE",
}

export interface UIEventPayloadMap {
  [UIEvent.CLICK_SETTING_BTN]: undefined;
  [UIEvent.CLICK_MENU_BTN]: undefined;
  [UIEvent.DEFAULT_MODAL_SHOWN]: undefined;
  [UIEvent.TOAST_DISMISS_REQUESTED]: { uuid: string };
  [UIEvent.CHANGE_THEME]: { theme: Theme };
  [UIEvent.CHANGE_GOOGLE_CLIENT_ID]: { googleClientId: string };
  [UIEvent.CHANGE_GOOGLE_FOLDER_ID]: { googleFolderId: string };
  [UIEvent.CLICK_GOOGLE_DRIVE_IMPORT_BTN]: undefined;
  [UIEvent.CLICK_REMOVE_QUESTION_BTN]: undefined;
  [UIEvent.CLICK_QUESTION_SEARCH_SUBMIT]: {
    isQListName: boolean;
    keyword: string;
    isCaseSensitive: boolean;
    correctRate: number;
    answerDateFrom: Date | null;
    answerDateTo: Date | null;
    unansweredFrom: Date | null;
    unansweredTo: Date | null;
    checkedFavorites: number[];
  };
  [UIEvent.CHANGE_QUESTIONS_PAGE]: { page: number };
  [UIEvent.CHANGE_QLIST_PAGE]: { page: number };
  [UIEvent.CLICK_START_PRACTICE_SET]: { qListId: number };
  [UIEvent.CLICK_RESTART_PRACTICE_SET]: { name: string; questionIds: number[] };
  [UIEvent.CLICK_QLIST_EDIT]: { qList: QList };
  [UIEvent.CLICK_PRACTICE_START]: {
    preparePracticeStart: QList | CustomPracticeStartDto;
    isShuffleQuestions: boolean;
    isShuffleChoices: boolean;
    questionCount: number;
  };
  [UIEvent.CLICK_EDIT_APPLY]: {
    qList: QList;
    name: string;
    isDefault: boolean;
    isDelete: boolean;
  };
  [UIEvent.CLICK_QUESTION_LIST_ROW]: {
    questionId: number;
    practiceHistoryId?: number;
  };
  [UIEvent.CLICK_PRACTICE_PREV]: undefined;
  [UIEvent.CLICK_PRACTICE_NEXT]: undefined;
  [UIEvent.CLICK_COMPLETE_ANSWER]: undefined;
  [UIEvent.PRACTICE_ANSWERED]: {
    practiceHistoryId: number;
    questionId: number;
    isCorrect: boolean;
    selectChoice: number[];
  };
  [UIEvent.PRACTICE_ANSWER_CANCELED]: {
    practiceHistoryId: number;
    questionId: number;
  };
  [UIEvent.CHANGE_PRACTICE_HISTORY_PAGE]: { page: number };
  [UIEvent.CLICK_EXIST_PRACTICE_START]: { practiceHistoryId: number };
  [UIEvent.CHANGE_HISTORY_ACTIVE_TAB]: { activeTab: HistoryActiveTab };
  [UIEvent.TOGGLE_QLISTS_STANDARD_CHECK]: { standardOnly: boolean };
  [UIEvent.CLICK_CUSTOM_PRACTICE_START]: undefined;
  [UIEvent.CLICK_QUESTION_FAVORITE]: {
    questionId: number;
    tagId: number;
    checked: boolean;
  };
}
