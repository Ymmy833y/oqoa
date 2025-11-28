import { QList } from "../models/entities";
import { QListSearchForm } from "../models/forms/qlist_search_form";
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
