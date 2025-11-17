import { AnsHistory, PracticeHistory, QList, Question } from "../entities"

export type PracticeDetailDto = {
  practiceHistory: PracticeHistory,
  qList: QList,
  questions: Question[],
  ansHistories: AnsHistory[],
  currentQuestionIndex: number,
}
