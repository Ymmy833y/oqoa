export interface QuestionSearchForm {
  keyword: string;
  isCaseSensitive: boolean;
  correctRate: number;
  answerDateFrom: Date | null;
  answerDateTo: Date | null;
  unansweredFrom: Date | null;
  unansweredTo: Date | null;

  currentPage: number;
  totalSize: number;
  pages: number[];
}
