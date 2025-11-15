import { Model } from '../models';
import { ModalKind, ModalSize, ToastMessage, ToastMessageKind } from '../types';
import { Modal } from './modal';
import { generateSettingModalConetnt } from './setting_view';
import { UIEventPayloadMap, UIEvent } from './ui_event_types';
import { el } from './utils';

export class View {
  private listeners: Partial<Record<UIEvent, unknown[]>> = {};

  private els: {
    settingBtn: HTMLButtonElement;
    defaultModal: HTMLButtonElement;
    toastParent: HTMLDivElement;
  }

  private defaultModal: Modal;

  TOAST_AUTO_DISMISS = 30000;

  constructor(private doc: Document) {
    this.els = {
      settingBtn: this.$('#settingBtn'),
      defaultModal: this.$('#defaultModal'),
      toastParent: this.$('#toastParent'),
    };

    this.defaultModal = new Modal(this.els.defaultModal);

    this.els.settingBtn.addEventListener('click', () => {
      this.emit(UIEvent.CLICK_SETTING_BTN, undefined);
    })
  }

  on<K extends UIEvent>(type: K, handler: (e: UIEventPayloadMap[K]) => void): void {
    const arr = (this.listeners[type] ??= []) as ((e: UIEventPayloadMap[K]) => void)[];
    arr.push(handler);
  }

  private emit<K extends UIEvent>(type: K, e: UIEventPayloadMap[K]): void {
    const arr = this.listeners[type] as ((x: UIEventPayloadMap[K]) => void)[] | undefined;
    arr?.forEach((h) => h(e));
  }

  render(model: Model): void {
    this.applyToastMessages(model.toastMessages);
    this.applyDefaultModal(model);
  }

  private applyToastMessages(toastMessages: ToastMessage[]): void {
    for (const toastMessage of toastMessages) {
      const toastElem = this.generateToastMessage(toastMessage);
      this.els.toastParent.appendChild(toastElem);
      this.emit(UIEvent.TOAST_DISMISS_REQUESTED, { uuid: toastMessage.uuid });
    }
  }

  private generateToastMessage(toastMessage: ToastMessage): HTMLDivElement {
    const toastElem = el('div', `toast toast--${toastMessage.kind.toLocaleLowerCase()}`);
    const toastIcon = (toastMessage.kind === ToastMessageKind.SUCCESS)
      ? el('i', {
        class: 'bi bi-check-circle-fill app-modal-button-icon',
        attr: [{ 'aria-hidden': 'true' }],
      })
      : el('i', {
        class: 'bi bi-exclamation-triangle-fill app-modal-button-icon',
        attr: [{ 'aria-hidden': 'true' }],
      });
    const toastBody = el('div', 'toast-body');
    const desc = el('p', 'toast-desc', toastMessage.message);
    toastBody.appendChild(desc);
    const closeBtn = el('button', `toast-close toast-close--${toastMessage.kind.toLocaleLowerCase()}`);
    const closeIcon = el('i', {
      class: 'bi bi-x-lg app-modal-button-icon',
      attr: [{ 'aria-hidden': 'true' }],
    })
    closeBtn.appendChild(closeIcon);
    toastElem.appendChild(toastIcon);
    toastElem.appendChild(toastBody);
    toastElem.appendChild(closeBtn);

    const timerId = window.setTimeout(() => {
      if (toastElem.isConnected) toastElem.remove();
    }, this.TOAST_AUTO_DISMISS);

    closeBtn.addEventListener('click', () => {
      clearTimeout(timerId);
      if (toastElem.isConnected) toastElem.remove();
    });
    return toastElem;
  }
  
  private applyDefaultModal(model: Model) {
    if (model.defailtModalKind === ModalKind.SETTING) {
      const content = generateSettingModalConetnt(
        model.theme, model.googleClientId ?? "", model.googleFolderId ?? "",
        {
          onThemeChange: (theme) => {
            this.emit(UIEvent.CHANGE_THEME, { theme });
          },
          onGoogleClientIdChange: (googleClientId) => {
            this.emit(UIEvent.CHANGE_GOOGLE_CLIENT_ID, { googleClientId });
          },
          onGoogleFolderIdChange: (googleFolderId) => {
            this.emit(UIEvent.CHANGE_GOOGLE_FOLDER_ID, { googleFolderId });
          },
          onGoogleDriveImport: () => {
            this.emit(UIEvent.CLICK_GOOGLE_DRIVE_IMPORT_BTN, undefined);
          }
        }
      );
      this.defaultModal.setModal(content, '設定', ModalSize.XL);
      this.emit(UIEvent.DEFAULT_MODAL_SHOWN, undefined);
    }
  }

  private $<T extends Element>(selector: string): T {
    const el = this.doc.querySelector(selector);
    if (!el) throw new Error(`[PanelView] Missing element: ${selector}`);
    return el as T;
  }
  private $all<T extends Element>(selector: string): NodeListOf<T> {
    return this.doc.querySelectorAll<T>(selector);
  }
}
