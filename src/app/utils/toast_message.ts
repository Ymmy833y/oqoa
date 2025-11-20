import { ToastMessage, ToastMessageKind } from '../types';

export function generateSuccessToastMessage(message: string): ToastMessage {
  return {
    uuid: crypto.randomUUID(),
    kind: ToastMessageKind.SUCCESS,
    message: message,
  };
}

export function generateErrorToastMessage(message: Error | string): ToastMessage {
  return {
    uuid: crypto.randomUUID(),
    kind: ToastMessageKind.ERROR,
    message: typeof message === 'string' ? message : message.message,
  };
}
