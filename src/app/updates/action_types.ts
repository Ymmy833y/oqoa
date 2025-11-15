import { ModalKindType, Theme, ToastMessage } from '../types';

export enum Action {
  INIT = 'INIT',
  OPEN_DEFAULT_MODAL = 'OPEN_DEFAULT_MODAL',
  DEFAULT_MODAL_SHOWN = 'DEFAULT_MODAL_SHOWN',
  TOAST_ADD = 'TOAST_ADD',
  TOAST_DISMISS_REQUESTED = 'TOAST_DISMISS_REQUESTED',
  CHANGE_THEME = 'CHANGE_THEME',
  CHANGE_GOOGLE_CLIENT_ID = 'CHANGE_GOOGLE_CLIENT_ID',
  CHANGE_GOOGLE_FOLDER_ID = 'CHANGE_GOOGLE_FOLDER_ID',
  IMPORT_GOOGLE_DRIVE_DATA = 'IMPORT_GOOGLE_DRIVE_DATA',
}

export type ActionType =
  | { type: Action.INIT; }
  | { type: Action.OPEN_DEFAULT_MODAL; kind: ModalKindType }
  | { type: Action.DEFAULT_MODAL_SHOWN; }
  | { type: Action.TOAST_ADD; toastMessage: ToastMessage }
  | { type: Action.TOAST_DISMISS_REQUESTED; uuid: string }
  | { type: Action.CHANGE_THEME; theme: Theme }
  | { type: Action.CHANGE_GOOGLE_CLIENT_ID; googleClientId: string }
  | { type: Action.CHANGE_GOOGLE_FOLDER_ID; googleFolderId: string }
  | { type: Action.IMPORT_GOOGLE_DRIVE_DATA; }
;
