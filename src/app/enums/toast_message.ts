export enum ToastMessageKind {
  SUCCESS = "success",
  ERROR = "error",
}

export interface ToastMessage {
  uuid: string;
  message: string;
  kind: ToastMessageKind;
}
