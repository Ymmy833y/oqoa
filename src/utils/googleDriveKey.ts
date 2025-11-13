export const GDriveStorageKeys = {
  clientId: 'gdrive.client_id',
  folderId: 'gdrive.folder_id',
} as const;

export function getStoredClientId(): string | null {
  return localStorage.getItem(GDriveStorageKeys.clientId);
}

export function setStoredClientId(clientId: string) {
  localStorage.setItem(GDriveStorageKeys.clientId, clientId.trim());
}

export function getStoredFolderId(): string | null {
  return localStorage.getItem(GDriveStorageKeys.folderId);
}

export function setStoredFolderId(folderId: string) {
  localStorage.setItem(GDriveStorageKeys.folderId, folderId.trim());
}

/**
 * 複数タブ間での同期（任意）
 * 同一オリジンの別タブで値が書き換わった場合に反映する
 */
export function attachStorageSync(
  clientIdInput: HTMLInputElement,
  folderIdInput: HTMLInputElement,
) {
  window.addEventListener('storage', (e) => {
    if (e.key === GDriveStorageKeys.clientId && typeof e.newValue === 'string') {
      clientIdInput.value = e.newValue;
    }
    if (e.key === GDriveStorageKeys.folderId && typeof e.newValue === 'string') {
      folderIdInput.value = e.newValue;
    }
  });
}