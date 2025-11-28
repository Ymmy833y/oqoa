import { PracticeDetailDto } from "../models/dtos";
import { Favorite } from "../models/entities";
import { favoriteRepository } from "../repositories/favorite_repositoriy";

export async function upsertFavorite(
  questionId: number,
  tagId: number,
  checked: boolean,
  dto: PracticeDetailDto | null,
): Promise<PracticeDetailDto | null> {
  const favorite = await favoriteRepository.selectByQuestionIdAndTagId(
    questionId,
    tagId,
  );

  if (checked && !favorite) {
    await favoriteRepository.insert(
      Favorite.fromRequiredArgs(questionId, tagId).generateRow(),
    );
  } else if (!checked && favorite) {
    await favoriteRepository.deleteById(favorite.getId());
  }

  if (dto) {
    const favorites = await favoriteRepository.selectByQuestionId(questionId);
    dto.questionDetailDtos.map((questionDetailDto) => {
      if (questionDetailDto.question.getId() === questionId) {
        questionDetailDto.favorites = favorites;
      }
      return questionDetailDto;
    });
  }
  return dto;
}
