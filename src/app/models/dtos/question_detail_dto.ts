import { AnsHistory, Favorite, Question } from "../entities";

export interface QuestionDetailDto {
  question: Question;
  ansHistory: AnsHistory | null;
  ansHistories: AnsHistory[];
  favorites: Favorite[];
}
