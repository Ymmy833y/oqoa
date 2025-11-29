import { ModalSize } from "../enums";

import { el } from "./view_utils";

export class Modal {
  private isShown = false;

  constructor(private modalElem: HTMLElement) {
    if (modalElem !== undefined) {
      this.modalElem = modalElem;
    }
  }

  /**
   * モーダルの初期化
   * @param content モーダル要素に設定する要素（本体部分）
   * @param title タイトル文字列
   * @param size サイズ指定
   * @param isShow 初期表示するかどうか
   * @param fade フェード効果を適用するかどうか
   * @param hideOnOutsideClick 外側クリックで閉じるかどうか
   */
  public setModal(
    content: HTMLElement,
    title?: string,
    size = ModalSize.DEFAULT,
    isShow = true,
    fade = true,
    hideOnOutsideClick = true,
  ): void {
    this.setModalContent(content, title);
    this.setModalFade(fade);
    this.setModalSize(size);

    if (this.isShown) {
      this.hide();
    }
    if (isShow) {
      this.show();
    }

    if (hideOnOutsideClick) {
      this.modalElem.addEventListener(
        "click",
        this.handleOutsideClick.bind(this),
      );
    }
  }

  /**
   * modalElem に中身を設定する
   */
  private setModalContent(content: HTMLElement, title?: string): void {
    const modal = el("div", "app-modal");
    modal.appendChild(this.generateHeader(title));
    modal.appendChild(content);

    this.modalElem.innerHTML = "";
    this.modalElem.appendChild(modal);
  }

  /**
   * 内部のダイアログ部分（最初の子要素）にサイズ用の Tailwind クラスを設定する
   */
  private setModalSize(size: ModalSize): void {
    const dialogElem = this.modalElem.firstElementChild as HTMLElement;
    if (!dialogElem) return;
    // 既存のサイズクラス（max-w-*, w-full など）を削除
    dialogElem.classList.forEach((cls) => {
      if (cls.startsWith("max-w-") || cls === "w-full") {
        dialogElem.classList.remove(cls);
      }
    });
    switch (size) {
      case ModalSize.LG:
        dialogElem.classList.add("w-full", "max-w-lg");
        break;
      case ModalSize.XL:
        dialogElem.classList.add("w-full", "max-w-xl");
        break;
      case ModalSize.XXL:
        dialogElem.classList.add("w-full", "max-w-4xl");
        break;
      case ModalSize.FULL:
        dialogElem.classList.add("w-full");
        break;
      default:
        dialogElem.classList.add("w-full", "max-w-64");
        break;
    }
  }

  /**
   * フェード効果の有無に応じたクラスを modalElem に設定する
   */
  private setModalFade(fade: boolean): void {
    if (fade) {
      this.modalElem?.classList.add("transition-opacity", "duration-300");
    } else {
      this.modalElem?.classList.remove("transition-opacity", "duration-300");
    }
  }

  /**
   * モーダルを表示する。hidden クラスを外し、opacity を 100 にする。
   */
  public show(): void {
    this.modalElem.classList.remove("hidden");
    document.body.classList.add("modal-open");
    // 少し待ってからフェードイン
    setTimeout(() => {
      this.modalElem.classList.remove("opacity-0");
      this.modalElem.classList.add("opacity-100");
    }, 10);
    this.isShown = true;
  }

  /**
   * モーダルを非表示にする。opacity を 0 にしてから hidden クラスを追加する。
   */
  public hide(): void {
    this.modalElem.classList.remove("opacity-100");
    this.modalElem.classList.add("opacity-0");
    setTimeout(() => {
      this.modalElem.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }, 300); // duration-300 に合わせた待ち時間
    this.isShown = false;
  }

  /**
   * モーダルの外側がクリックされたときの処理
   */
  private handleOutsideClick(event: MouseEvent): void {
    if (event.target === this.modalElem) {
      this.hide();
    }
  }

  /**
   * ヘッダー生成（タイトル＋×ボタン）
   */
  private generateHeader(titleText?: string): HTMLElement {
    const header = el("div", "app-modal-header");

    const title = el("h2", "app-modal-title", titleText ?? "");
    header.appendChild(title);

    const button = el("button", "app-modal-close") as HTMLButtonElement;
    button.type = "button";

    const icon = el("i", {
      class: "bi bi-x-lg",
      attr: [{ "aria-hidden": "true" }],
    });

    const srOnly = el("span", {
      class: "sr-only",
      text: "閉じる",
    });

    button.appendChild(icon);
    button.appendChild(srOnly);
    header.appendChild(button);

    button.addEventListener("click", () => {
      this.hide();
    });

    return header;
  }
}

/**
 * Generate generic confirm modal content
 *
 * @param message   Confirmation message; accepts a string or an HTMLElement
 * @param onOk      Callback to execute when the OK button is clicked
 * @param onCancel  Callback to execute when the Cancel button is clicked
 * @returns         An HTMLElement containing the modal content
 */
export const generateConfirmModalContent = (
  message: string | HTMLElement,
  onOk: () => void,
  onCancel?: () => void,
): HTMLElement => {
  const modalContent = document.createElement("div");
  modalContent.className = "text-center p-6";

  // Message
  if (typeof message === "string") {
    const messageEl = document.createElement("p");
    messageEl.className = "mb-6 text-sm sm:text-base";
    messageEl.textContent = message;
    modalContent.appendChild(messageEl);
  } else {
    // If an HTMLElement is provided
    message.classList.add("mb-6");
    modalContent.appendChild(message);
  }

  // Button wrapper
  const buttonWrap = document.createElement("div");
  buttonWrap.className = "flex justify-center gap-4";

  const okButton = document.createElement("button");
  okButton.type = "button";
  okButton.textContent = "OK";
  okButton.className =
    "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors";
  okButton.addEventListener("click", () => {
    onOk();
  });

  if (onCancel) {
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.className =
      "px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors";
    cancelButton.addEventListener("click", () => {
      onCancel();
    });
    buttonWrap.appendChild(cancelButton);
  }

  buttonWrap.appendChild(okButton);
  modalContent.appendChild(buttonWrap);

  return modalContent;
};
