import { CustomPracticeStartDto } from '../models/dtos';
import { QList } from '../models/entities';
import { Theme } from '../enums';

export enum Effect {
  INIT_REPOSITORY = 'INIT_REPOSITORY',
  UPDATE_THEME = 'UPDATE_THEME',
  UPDATE_GOOGLE_CLIENT_ID = 'UPDATE_GOOGLE_CLIENT_ID',
  UPDATE_GOOGLE_FOLDER_ID = 'UPDATE_GOOGLE_FOLDER_ID',
  IMPORT_GOOGLE_DRIVE = 'IMPORT_GOOGLE_DRIVE',
  SEARCH_QLIST = 'SEARCH_QLIST',
  SEARCH_QUESTION = 'SEARCH_QUESTION',
  PREPARE_PRACTICE_START = 'PREPARE_PRACTICE_START',
  UPDATE_QLIST = 'UPDATE_QLIST',
  PREPARE_PRACTICE = 'PREPARE_PRACTICE',
  PREPARE_EXIST_PRACTICE = 'PREPARE_EXIST_PRACTICE',
  PREPARE_QUESTION_DETAIL = 'PREPARE_QUESTION_DETAIL',
  COMPLETE_ANSWER = 'COMPLETE_ANSWER',
  PRACTICE_ANSWERED = 'PRACTICE_ANSWERED',
  PRACTICE_ANSWER_CANCELED = 'PRACTICE_ANSWER_CANCELED',
  SEARCH_PRACTICE_HISTORY = 'SEARCH_PRACTICE_HISTORY',
  SEARCH_ANS_HISTORY = 'SEARCH_ANS_HISTORY',
}

export type EffectType =
  | { kind: Effect.INIT_REPOSITORY; }
  | { kind: Effect.UPDATE_THEME; theme: Theme }
  | { kind: Effect.UPDATE_GOOGLE_CLIENT_ID; googleClientId: string }
  | { kind: Effect.UPDATE_GOOGLE_FOLDER_ID; googleFolderId: string }
  | { kind: Effect.IMPORT_GOOGLE_DRIVE; googleClientId: string; googleFolderId: string }
  | { kind: Effect.SEARCH_QLIST }
  | { kind: Effect.SEARCH_QUESTION }
  | { kind: Effect.PREPARE_PRACTICE_START; qListId: number }
  | { kind: Effect.UPDATE_QLIST; qList: QList, name: string, isDefault: boolean }
  | {
      kind: Effect.PREPARE_PRACTICE; preparePracticeStart: QList | CustomPracticeStartDto;
      isShuffleQuestions: boolean, isShuffleChoices: boolean
    }
  | { kind: Effect.PREPARE_EXIST_PRACTICE; practiceHistoryId: number }
  | { kind: Effect.PREPARE_QUESTION_DETAIL; questionId: number; ansHistoryId?: number }
  | { kind: Effect.COMPLETE_ANSWER }
  | { kind: Effect.PRACTICE_ANSWERED; practiceHistoryId: number, questionId: number, isCorrect: boolean, selectChoice: number[] }
  | { kind: Effect.PRACTICE_ANSWER_CANCELED; practiceHistoryId: number, questionId: number }
  | { kind: Effect.SEARCH_PRACTICE_HISTORY; }
  | { kind: Effect.SEARCH_ANS_HISTORY; }
;
