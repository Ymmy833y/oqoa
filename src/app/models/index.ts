import { HistoryActiveTab, ModalKindType, Theme, ToastMessage } from "../enums";

import {
  AnsHistoryDto,
  CustomPracticeStartDto,
  PracticeDetailDto,
  PracticeHistoryDto,
  QuestionDetailDto,
} from "./dtos";
import { QList, Question } from "./entities";
import {
  AnsHistorySearchForm,
  PracticeHistorySearchForm,
  QuestionSearchForm,
} from "./forms";
import { QListSearchForm } from "./forms/qlist_search_form";

export interface Model {
  theme: Theme;
  toastMessages: ToastMessage[];

  googleClientId: string | null;
  googleFolderId: string | null;

  defailtModalKind: ModalKindType | null;
  preparePracticeStart: QList | CustomPracticeStartDto | null;
  editQList: QList | null;
  questionDetailDto: QuestionDetailDto | null;

  qLists: QList[];
  qListSearchForm: QListSearchForm;
  questions: Question[];
  questionSearchForm: QuestionSearchForm;

  practiceDetailDto: PracticeDetailDto | null;

  historyActiveTab: HistoryActiveTab;
  practiceHistoryDtos: PracticeHistoryDto[];
  practiceHistorySearchForm: PracticeHistorySearchForm;
  ansHistoryDtos: AnsHistoryDto[];
  ansHistorySearchForm: AnsHistorySearchForm;
}

export const initialModel: Model = {
  theme: Theme.LIGHT,
  toastMessages: [],

  googleClientId: null,
  googleFolderId: null,

  defailtModalKind: null,
  preparePracticeStart: null,
  editQList: null,
  questionDetailDto: null,

  qLists: [],
  qListSearchForm: {
    standardOnly: true,
    currentPage: 0,
    totalSize: 0,
    pages: [],
  },
  questions: [],
  questionSearchForm: {
    isQListName: false,
    keyword: "",
    isCaseSensitive: false,
    correctRate: 0,
    answerDateFrom: null,
    answerDateTo: null,
    unansweredFrom: null,
    unansweredTo: null,
    checkedFavorites: [],
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
};
