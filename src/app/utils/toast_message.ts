import { ToastMessage, ToastMessageKind } from '../types';

export function generateErrorToastMessage(message: Error | string): ToastMessage {
  return {
    uuid: crypto.randomUUID(),
    kind: ToastMessageKind.ERROR,
    message: typeof message === 'string' ? message : message.message,
  };
}
