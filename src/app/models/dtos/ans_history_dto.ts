import { AnsHistory, QList, Question } from '../entities';

export interface AnsHistoryDto {
  ansHistory: AnsHistory,
  qList: QList,
  question: Question,
}
