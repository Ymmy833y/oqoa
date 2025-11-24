import { PracticeHistory, QList } from '../entities'
import { QuestionDetailDto } from './question_detail_dto'

export interface PracticeDetailDto {
  practiceHistory: PracticeHistory,
  qList: QList,
  questionDetailDtos: QuestionDetailDto[],
  currentQuestionIndex: number,
}
