# OQOA CodeX Agent ガイド

## 前提
- **回答は常に日本語で記載すること**
- 新しい機能の実装や既存の修正をする際は、ここで示す技術選定・設計方針・モジュール構成・規約を前提にすること。
- 不確かな点がある場合は、リポジトリのファイルを探索し、ユーザーに確認をすること。
- 大きい変更を加える場合は、まず何をするのか実行計画を立てた上で、ユーザーに内容の確認と提案をすること。
  - この時、ユーザーから計画の修正を求められた場合は計画を修正して、再提案すること。

## プロジェクト概要
OQOA（One Question One Answer）は一問一答の静的 Web アプリケーションです。
Google Drive 内の設問（問題集）データを Google Auth を用いて取得し、IndexedDB を用いて解答履歴や問題集の情報を保持しています。
Web アプリケーションは、GitHub Pages にてデプロイされます。

## 主な機能
- 問題集の演習：一問一答形式の設問が束ねられた問題集を演習する
- 問題集一覧（検索）：演習する問題集を検索する
- 設問一覧（検索）：検索条件（単語の部分一致、正答率、解答期間など）を指定して設問を横断検索する
- カスタム問題集の作成：設問一覧の検索結果をもとにユーザー独自のカスタム問題集を作成する
- 演習履歴：問題集毎および設問毎の演習履歴を表示する
- Google Drive連携：Google Drive の設問（問題集）をインポートする

## 技術スタック
- TypeScript 5.x
- npm
- Parcel
- Tailwind CSS
- ESLint
- Vitest

## ディレクトリ構成
```
oqoa/
├── src/
│   ├── app/
│   │   ├── api/              # Google Auth
│   │   ├── controllers/      # コントローラ
│   │   ├── enums/            # Enum
│   │   ├── models/           # モデル、dto、form、entity
│   │   ├── repositories/     # リポジトリ層（解答履歴、お気に入り、演習履歴、問題集、設問）
│   │   ├── services/         # サービス層
│   │   ├── storages/         # localStorage への保持
│   │   ├── updates/          # アップデート層
│   │   ├── utils/            # ユーティリティ
│   │   ├── views/            # ビュー層
│   │   └── app.ts            # アプリケーションのエントリーポイント
│   └── resources/
│       ├── static/           # 画像等
│       ├── styles/           # Tailwind CSS
│       └── index.html        # ページ
├── .parcelrc
├── .postcssrc.json
├── eslint.config.mjs
├── eslint
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

Agent が参照するファイルは上記のファイルおよびディレクトリ内とします。（node_modules 等未記載は参照外、src 配下は参照）

## アーキテクチャ設計
ベースは MVU アーキテクチャ構成としています。そこに、レイヤード（Controller/Service/Repository）を足した構成です。

### 設計指針
- UIEvent → Action → Update → Model の一方向フローを維持する。
- Update は副作用を持たず、Model 更新と Effect の列挙のみを返す。
- 副作用は Controller の Effect 実行で集約し、Service → Repository/Storage の順に処理する。
- View は描画に専念し、DOM 操作は View 内に閉じ込める。
- Repository は永続化専用、ビジネスロジックは Service に置く。
- DTO は画面向け集約、Entity と Form は用途を分けて扱う。
- 設問はメモリ内リポジトリで保持し、必要に応じて localStorage を併用する。

## アンチパターン
- Update 内で fetch/IndexedDB/localStorage/DOM などの副作用を実行する。
- View から Service/Repository を直接呼び出す。
- UIEvent/Action/Effect の追加時に対応関係を揃えず、処理経路が欠落する。
- Model を破壊的に変更し、Update の戻り値で整合を取らない。
- インポート後に questionRepository と localStorage の整合を取らない。

## セットアップ
### アプリケーションの起動
```shell
npm run start
```

### アプリケーションのビルド
```shell
npm run build
```

### アプリケーションの静的解析
```shell
npm run lint
```

## コーディング規約
### 静的解析
ESLint を活用します。具体的なルールは、[eslint.config.mjs](eslint.config.mjs) を確認すること。

### TSDoc
全ての Class および関数には、TSDoc を記載すること。また、TSDoc は以下項目についてのみ明記し簡潔であること。
- 関数の概要
- @param（あれば）
- @returns（あれば）
- @throws（あれば）

### 実装ルール
- TypeScript の strict モード前提で型を明確にする。不要な any は避ける。
- Action/Effect/UIEvent を追加する場合は、ActionType/EffectType/Controller の対応を必ず揃える。
- Update は pure に保ち、Model はスプレッド構文で新しいオブジェクトとして返す。
- View の DOM 生成は `el` ヘルパーを優先し、innerHTML の使用は最小限に留める。
- エラーは `generateErrorToastMessage` を使ってユーザーに通知する。
- 定数（ページサイズなど）は utils の定義を優先し、マジックナンバーを避ける。
- 既存ファイル名や import パスを不用意に変更しない（タイポを含むため）。

## まとめ
- MVU + レイヤード構成を守り、単方向の状態遷移を維持する。
- 副作用は Controller/Service に集約し、View/Update には持ち込まない。
- TSDoc/ESLint を遵守し、既存の命名・構成に合わせて変更する。
