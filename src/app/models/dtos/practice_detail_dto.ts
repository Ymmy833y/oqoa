import { AnsHistory, PracticeHistory, QList, Question } from '../entities'

export interface PracticeDetailDto {
  practiceHistory: PracticeHistory,
  qList: QList,
  questions: Question[],
  ansHistories: AnsHistory[],
  currentQuestionIndex: number,
}
