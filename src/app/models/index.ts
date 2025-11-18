import { ModalKindType, Theme, ToastMessage } from '../types'
import { PracticeDetailDto } from './dtos/practice_detail_dto';
import { QuestionDetailDto } from './dtos/question_detail_dto';
import { QList, Question } from './entities'
import { QuestionSearchForm } from './forms'

export interface Model {
  theme: Theme,
  toastMessages: ToastMessage[],

  googleClientId: string | null,
  googleFolderId: string | null,

  defailtModalKind: ModalKindType | null,
  preparePracticeStart: QList | null;
  questionDetailDto: QuestionDetailDto | null,

  qLists: QList[],
  questions: Question[],
  questionSearchForm: QuestionSearchForm,

  practiceDetailDto: PracticeDetailDto | null,
}

export const initialModel: Model = {
  theme: Theme.LIGHT,
  toastMessages: [],

  googleClientId: null,
  googleFolderId: null,

  defailtModalKind: null,
  preparePracticeStart: null,
  questionDetailDto: null,

  qLists: [],
  questions: [],
  questionSearchForm: {
    keyword: '',
    isCaseSensitive: false,
    currentPage: 0,
    totalSize: 0,
    pages: [],
  },

  practiceDetailDto: null,
}
