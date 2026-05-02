// ---- Drive ユーティリティ ----
interface FileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  fileExtension?: string;
  shortcutDetails?: { targetId: string; targetMimeType: string };
}

// 単一ファイルのメタデータ取得
async function getMeta(accessToken: string, fileId: string): Promise<FileMeta> {
  const url =
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
    "?fields=id,name,mimeType,modifiedTime,size,fileExtension,shortcutDetails";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `files.get(meta) failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  return res.json();
}

// フォルダ配下のファイル一覧（ページネーション対応）
export async function listFilesInFolder(
  accessToken: string,
  folderId: string,
): Promise<FileMeta[]> {
  const files: FileMeta[] = [];
  let pageToken: string | undefined;

  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);

  do {
    const url =
      "https://www.googleapis.com/drive/v3/files" +
      `?q=${q}` +
      "&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,fileExtension,shortcutDetails)" +
      "&orderBy=name" +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error("フォルダーが見つかりませんでした。");
    }

    const data: { files?: FileMeta[]; nextPageToken?: string } =
      await res.json();
    if (data.files?.length) files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

// ショートカットなら本体へ解決し、Docs 系は除外して「ダウンロード可能 ID」を返す
async function resolveDownloadableId(
  accessToken: string,
  meta: FileMeta,
): Promise<{ id: string; name: string; mimeType: string } | null> {
  // ショートカット → 本体へ
  if (
    meta.mimeType === "application/vnd.google-apps.shortcut" &&
    meta.shortcutDetails?.targetId
  ) {
    const real = await getMeta(accessToken, meta.shortcutDetails.targetId);
    if (real.mimeType.startsWith("application/vnd.google-apps.")) return null; // Docs 等は alt=media 不可
    return { id: real.id, name: real.name, mimeType: real.mimeType };
  }

  // Docs 系は alt=media 不可なので除外
  if (meta.mimeType.startsWith("application/vnd.google-apps.")) return null;

  return { id: meta.id, name: meta.name, mimeType: meta.mimeType };
}

// バイナリ実体ファイルの JSON を取得（application/json 前提）
export async function fetchFileJson(accessToken: string, fileId: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `files.get (alt=media) failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  return res.json();
}

// ---- エクスポート不要の「実体 JSON」だけを読み込む（厳格版） ----
export async function fetchAllJsonFromFolderStrict(
  accessToken: string,
  folderId: string,
): Promise<
  {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    content: unknown;
  }[]
> {
  const metas = await listFilesInFolder(accessToken, folderId);

  // ダウンロード可能な実体に限定（ショートカット解決＋Docs 系除外）
  const downloadable = (
    await Promise.all(metas.map((m) => resolveDownloadableId(accessToken, m)))
  ).filter((x): x is { id: string; name: string; mimeType: string } => !!x);

  // JSON に限定（Drive UI 上で「種類：不明」でも mimeType が application/json になっていれば OK）
  const jsonFiles = downloadable.filter(
    (x) =>
      x.mimeType === "application/json" ||
      x.mimeType === "application/octet-stream",
  );

  // 中身を並列取得（必要に応じて同時実行数を絞る）
  const results = await Promise.all(
    jsonFiles.map(async (f) => {
      const content = await fetchFileJson(accessToken, f.id);
      // modifiedTime は最初の一覧から拾えるように、名前で対応付け
      const meta = metas.find(
        (m) => m.id === f.id || m.shortcutDetails?.targetId === f.id,
      );
      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        modifiedTime: meta?.modifiedTime,
        content,
      };
    }),
  );

  return results;
}

// ---- 書き込み・検索 API ----

/**
 * フォルダ内で指定した名前のファイルを1件検索する。
 * drive.file スコープでは自アプリが作成したファイルのみ対象になる。
 */
export async function findFileByName(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<{ id: string } | null> {
  const q = encodeURIComponent(
    `name='${fileName}' and '${folderId}' in parents and trashed=false`,
  );
  const url =
    "https://www.googleapis.com/drive/v3/files" +
    `?q=${q}&fields=files(id)&pageSize=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `files.list failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  const data: { files?: { id: string }[] } = await res.json();
  return data.files?.[0] ?? null;
}

/**
 * 指定フォルダに新規 JSON ファイルを作成する（multipart upload）。
 */
export async function createFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: unknown,
): Promise<{ id: string }> {
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
    mimeType: "application/json",
  });
  const body = JSON.stringify(content);

  const boundary = "oqoa_boundary_" + Date.now();
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `files.create failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  return res.json() as Promise<{ id: string }>;
}

/**
 * 既存ファイルの内容を更新する（media upload）。
 */
export async function updateFileContent(
  accessToken: string,
  fileId: string,
  content: unknown,
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `files.update failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
}

/**
 * client_id を使ってアクセストークンを取得
 */
export function requestAccessTokenWithClientId(
  clientId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // google.accounts はグローバル想定
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file",
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (!response || !response.access_token) {
            reject(new Error("アクセストークンの取得に失敗しました。"));
            return;
          }
          resolve(response.access_token);
        },
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}
