import { AnsHistoryDto, CustomPracticeStartDto, PracticeDetailDto, PracticeHistoryDto, QuestionDetailDto } from '../models/dtos';
import {  } from '../models/dtos/question_detail_dto';
import { QList, Question } from '../models/entities';
import { HistoryActiveTab, ModalKindType, Theme, ToastMessage } from '../types';

export enum Action {
  INIT = 'INIT',
  OPEN_DEFAULT_MODAL = 'OPEN_DEFAULT_MODAL',
  SEARCH_HISTORY = 'SEARCH_HISTORY',
  DEFAULT_MODAL_SHOWN = 'DEFAULT_MODAL_SHOWN',
  TOAST_ADD = 'TOAST_ADD',
  TOAST_DISMISS_REQUESTED = 'TOAST_DISMISS_REQUESTED',
  CHANGE_THEME = 'CHANGE_THEME',
  CHANGE_GOOGLE_CLIENT_ID = 'CHANGE_GOOGLE_CLIENT_ID',
  CHANGE_GOOGLE_FOLDER_ID = 'CHANGE_GOOGLE_FOLDER_ID',
  IMPORT_GOOGLE_DRIVE_DATA = 'IMPORT_GOOGLE_DRIVE_DATA',
  UPDATE_QLIST_CONTAINER = 'UPDATE_QLIST_CONTAINER',
  UPDATE_QUESTION_LIST_CONTAINER = 'UPDATE_QUESTION_LIST_CONTAINER',
  CHANGE_QUESTION_SEARCH_KEYWORD = 'CHANGE_QUESTION_SEARCH_KEYWORD',
  TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE = 'TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE',
  SEARCH_QUESTION = 'SEARCH_QUESTION',
  CHANGE_QUESTIONS_PAGE = 'CHANGE_QUESTIONS_PAGE',
  PREPARE_PRACTICE_START = 'PREPARE_PRACTICE_START',
  SHOW_PRACTICE_START = 'SHOW_PRACTICE_START',
  SHOW_CUSTOM_PRACTICE_START = 'SHOW_CUSTOM_PRACTICE_START',
  PREPARE_PRACTICE = 'PREPARE_PRACTICE',
  SHOW_PRACTICE = 'SHOW_PRACTICE',
  PREPARE_QUESTION_DETAIL = 'PREPARE_QUESTION_DETAIL',
  SHOW_QUESTION_DETAIL = 'SHOW_QUESTION_DETAIL',
  PRACTICE_PREV = 'PRACTICE_PREV',
  PRACTICE_NEXT = 'PRACTICE_NEXT',
  COMPLETE_ANSWER = 'COMPLETE_ANSWER',
  PRACTICE_ANSWERED = 'PRACTICE_ANSWERED',
  PRACTICE_ANSWER_CANCELED = 'PRACTICE_ANSWER_CANCELED',
  UPDATE_PRACTICE_HISTORY_LIST_CONTAINER = 'UPDATE_PRACTICE_HISTORY_LIST_CONTAINER',
  UPDATE_ANS_HISTORY_LIST_CONTAINER = 'UPDATE_ANS_HISTORY_LIST_CONTAINER',
  CHANGE_HISTORY_PAGE = 'CHANGE_HISTORY_PAGE',
  PREPARE_EXIST_PRACTICE = 'PREPARE_EXIST_PRACTICE',
}

export type ActionType =
  | { type: Action.INIT; }
  | { type: Action.OPEN_DEFAULT_MODAL; kind: ModalKindType }
  | { type: Action.SEARCH_HISTORY; activeTab?: HistoryActiveTab }
  | { type: Action.DEFAULT_MODAL_SHOWN; }
  | { type: Action.TOAST_ADD; toastMessage: ToastMessage }
  | { type: Action.TOAST_DISMISS_REQUESTED; uuid: string }
  | { type: Action.CHANGE_THEME; theme: Theme }
  | { type: Action.CHANGE_GOOGLE_CLIENT_ID; googleClientId: string }
  | { type: Action.CHANGE_GOOGLE_FOLDER_ID; googleFolderId: string }
  | { type: Action.IMPORT_GOOGLE_DRIVE_DATA; }
  | { type: Action.UPDATE_QLIST_CONTAINER; qLists: QList[] }
  | {
      type: Action.UPDATE_QUESTION_LIST_CONTAINER; currentPage: number,
      questions: Question[], totalSize: number, pages: number[]
    }
  | { type: Action.CHANGE_QUESTION_SEARCH_KEYWORD; keyword: string }
  | { type: Action.TOGGLE_QUESTION_SEARCH_IS_CASE_SENSITIVE; }
  | { type: Action.SEARCH_QUESTION; }
  | { type: Action.CHANGE_QUESTIONS_PAGE; page: number }
  | { type: Action.PREPARE_PRACTICE_START; qListId: number }
  | { type: Action.SHOW_PRACTICE_START; qList: QList }
  | { type: Action.SHOW_CUSTOM_PRACTICE_START; customPracticeStartDto: CustomPracticeStartDto }
  | {
      type: Action.PREPARE_PRACTICE; preparePracticeStart: QList | CustomPracticeStartDto,
      isShuffleQuestions: boolean, isShuffleChoices: boolean
    }
  | { type: Action.SHOW_PRACTICE; practiceDetailDto: PracticeDetailDto }
  | { type: Action.PREPARE_QUESTION_DETAIL; questionId: number; ansHistoryId?: number }
  | { type: Action.SHOW_QUESTION_DETAIL; questionDetailDto: QuestionDetailDto }
  | { type: Action.PRACTICE_PREV; }
  | { type: Action.PRACTICE_NEXT; }
  | { type: Action.COMPLETE_ANSWER; }
  | { type: Action.PRACTICE_ANSWERED; practiceHistoryId: number, questionId: number, isCorrect: boolean, selectChoice: number[] }
  | { type: Action.PRACTICE_ANSWER_CANCELED; practiceHistoryId: number, questionId: number }
  | {
      type: Action.UPDATE_PRACTICE_HISTORY_LIST_CONTAINER; practiceHistoryDtos: PracticeHistoryDto[],
      currentPage: number, totalSize: number, pages: number[]
    }
  | {
      type: Action.UPDATE_ANS_HISTORY_LIST_CONTAINER; ansHistoryDtos: AnsHistoryDto[],
      currentPage: number, totalSize: number, pages: number[]
    }
  | { type: Action.CHANGE_HISTORY_PAGE; page: number }
  | { type: Action.PREPARE_EXIST_PRACTICE; practiceHistoryId: number }
;
