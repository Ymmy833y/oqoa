export interface QuestionSearchForm {
  keyword: string;
  isCaseSensitive: boolean;
  currentPage: number;
  totalSize: number,
  pages: number[];
}
