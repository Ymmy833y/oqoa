import { AnsHistory, Question } from '../entities';

export interface QuestionDetailDto {
  question: Question,
  ansHistory: AnsHistory | null,
}
