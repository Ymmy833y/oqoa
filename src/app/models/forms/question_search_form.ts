export type SearchMode = "phrase" | "and" | "or";

export interface QuestionSearchForm {
  isQListName: boolean;
  keyword: string;
  searchMode: SearchMode;
  isCaseSensitive: boolean;
  correctRate: number;
  answerDateFrom: Date | null;
  answerDateTo: Date | null;
  unansweredFrom: Date | null;
  unansweredTo: Date | null;
  checkedFavorites: number[];

  currentPage: number;
  totalSize: number;
  pages: number[];
}
