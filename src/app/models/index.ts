import { ModalKindType, Theme, ToastMessage } from '../types'

export interface Model {
  theme: Theme,
  toastMessages: ToastMessage[],

  googleClientId: string | null,
  googleFolderId: string | null,

  defailtModalKind: ModalKindType | null,
}

export const initialModel: Model = {
  theme: Theme.LIGHT,
  toastMessages: [],

  googleClientId: null,
  googleFolderId: null,

  defailtModalKind: null,
}
