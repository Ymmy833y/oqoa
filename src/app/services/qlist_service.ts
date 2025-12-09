import { QList } from "../models/entities";
import { QListSearchForm } from "../models/forms/qlist_search_form";
import { ansHistoryRepository } from "../repositories/ans_history_repository";
import { practiceHistoryRepository } from "../repositories/practice_history_repositoriy";
import { qListRepository } from "../repositories/qlist_repositoriy";
import { getPaginationPages } from "../utils";

const PAGE_ITEM_SIZE = 12;

export async function selectQListsForSearchForm(
  form: QListSearchForm,
): Promise<{
  qLists: QList[];
  currentPage: number;
  totalSize: number;
  pages: number[];
}> {
  const qLists = form.standardOnly
    ? await qListRepository.selectByStandard()
    : await qListRepository.selectAll();

  const totalPages =
    Math.floor(qLists.length / PAGE_ITEM_SIZE) +
    (qLists.length % PAGE_ITEM_SIZE === 0 ? 0 : 1);
  const currentPage = totalPages <= form.currentPage ? 0 : form.currentPage;

  const startIndex = currentPage * PAGE_ITEM_SIZE;
  const endIndex = startIndex + PAGE_ITEM_SIZE;
  const currentQLists = qLists.slice(startIndex, endIndex);

  const pages = getPaginationPages(currentPage, totalPages);

  return {
    qLists: currentQLists,
    currentPage,
    totalSize: qLists.length,
    pages,
  };
}

export async function updateQList(
  qList: QList,
  name: string,
  isDefault: boolean,
) {
  qList.setName(name);
  qList.setIsDefault(isDefault);
  await qListRepository.update(qList.generateRow());
}

export async function removeQList(qList: QList) {
  const practiceHistories = await practiceHistoryRepository.selectByQListId(
    qList.getId(),
  );
  await Promise.all(
    practiceHistories.map(async (p) => {
      await ansHistoryRepository.deleteByPracticeHistoryId(p.getId());
      await practiceHistoryRepository.deleteById(p.getId());
    }),
  );
  await qListRepository.deleteById(qList.getId());
}
