export enum FavoriteTag {
  TRIANGLE = 1,
  STAR = 2,
  HEART = 3,
}

export type FavoriteTagMeta = {
  key: string;
  className: string;
};

export const FavoriteTagMetaMap = {
  [FavoriteTag.TRIANGLE]: { key: "triangle", className: "bi-triangle-fill" },
  [FavoriteTag.STAR]: { key: "star", className: "bi-star-fill" },
  [FavoriteTag.HEART]: { key: "heart", className: "bi-heart-fill" },
} as const satisfies Record<number, FavoriteTagMeta>;
