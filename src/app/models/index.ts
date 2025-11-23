import { HistoryActiveTab, ModalKindType, Theme, ToastMessage } from '../types'
import { AnsHistoryDto, CustomPracticeStartDto, PracticeDetailDto, PracticeHistoryDto, QuestionDetailDto } from './dtos';
import { QList, Question } from './entities'
import { QuestionSearchForm, PracticeHistorySearchForm, AnsHistorySearchForm } from './forms'
import { QListSearchForm } from './forms/qlist_search_form';

export interface Model {
  theme: Theme,
  toastMessages: ToastMessage[],

  googleClientId: string | null,
  googleFolderId: string | null,

  defailtModalKind: ModalKindType | null,
  preparePracticeStart: QList | CustomPracticeStartDto | null;
  questionDetailDto: QuestionDetailDto | null,

  qLists: QList[],
  qListSearchForm: QListSearchForm,
  questions: Question[],
  questionSearchForm: QuestionSearchForm,

  practiceDetailDto: PracticeDetailDto | null,

  historyActiveTab: HistoryActiveTab,
  practiceHistoryDtos: PracticeHistoryDto[],
  practiceHistorySearchForm: PracticeHistorySearchForm;
  ansHistoryDtos: AnsHistoryDto[],
  ansHistorySearchForm: AnsHistorySearchForm;
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
  qListSearchForm: {
    currentPage: 0,
    totalSize: 0,
    pages: [],
  },
  questions: [],
  questionSearchForm: {
    keyword: '',
    isCaseSensitive: false,
    currentPage: 0,
    totalSize: 0,
    pages: [],
  },

  practiceDetailDto: null,

  historyActiveTab: HistoryActiveTab.PRACTICE,
  practiceHistoryDtos: [],
  practiceHistorySearchForm: {
    currentPage: 0,
    totalSize: 0,
    pages: [],
  },
  ansHistoryDtos: [],
  ansHistorySearchForm: {
    currentPage: 0,
    totalSize: 0,
    pages: [],
  },
}
