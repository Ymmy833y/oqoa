import { ModalKindType, Theme, ToastMessage } from '../types'
import { QList, Question } from './entities'
import { QuestionSearchForm } from './forms'

export interface Model {
  theme: Theme,
  toastMessages: ToastMessage[],

  googleClientId: string | null,
  googleFolderId: string | null,

  defailtModalKind: ModalKindType | null,

  qLists: QList[],
  questions: Question[],
  questionSearchForm: QuestionSearchForm,
}

export const initialModel: Model = {
  theme: Theme.LIGHT,
  toastMessages: [],

  googleClientId: null,
  googleFolderId: null,

  defailtModalKind: null,

  qLists: [],
  questions: [],
  questionSearchForm: {
    keyword: '',
    isCaseSensitive: false,
    currentPage: 0,
    totalSize: 0,
    pages: [],
  }
}
