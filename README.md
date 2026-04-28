# Netflix/TVer/DOWNTOWN+/ABEMA 5 Second Seek

Netflix、TVer、DOWNTOWN+、ABEMA のブラウザ再生画面で、キーボードの左右キーによるシーク秒数を 10 秒ではなく 5 秒にする Chrome Extension です。

## 概要

- Chrome Extension (Manifest V3) の最小構成です。
- `ArrowLeft` で 5 秒戻る、`ArrowRight` で 5 秒進みます。
- 秒数は `content.js` の `SEEK_SECONDS` 定数で変更できます。
- `input`、`textarea`、`contenteditable` など入力系要素にフォーカスがある場合は動作しません。

## 使い方

1. Chrome で `chrome://extensions` を開きます。
2. 右上の「デベロッパー モード」を有効にします。
3. 「パッケージ化されていない拡張機能を読み込む」を押します。
4. このフォルダを選択します。
5. Netflix、TVer、DOWNTOWN+、または ABEMA の動画再生ページを開き、左右キーで 5 秒シークされることを確認します。

拡張を更新した後は、`chrome://extensions` で対象拡張の再読み込みを行ってください。

## 対応サイト

- `https://www.netflix.com/*`
- `https://tver.jp/*`
- `https://www.tver.jp/*`
- `https://downtownplus.com/*`
- `https://www.downtownplus.com/*`
- `https://abema.tv/*`
- `https://www.abema.tv/*`

## 実装メモ

- `video` 要素が存在しない場合は何もしません。
- 複数の `video` 要素がある場合は、表示サイズ、表示状態、再生状態、読み込み状態を元に「実際に再生に使われていそうな video」を優先して選びます。
- `currentTime` 更新時は 0 未満や `duration` 超過にならないよう clamp しています。
- Netflix は `video.currentTime` の直接変更で再生エラーになる場合があるため、ページ本体側で左右キーを捕まえ、プレイヤー API を使ってシークしています。
- DOWNTOWN+ のようにプレイヤーが open shadow DOM 配下にある場合でも `video` 要素を探索できるようにしています。
- サイト側の既定ショートカットで 10 秒シークが残る場合に備え、キャプチャフェーズで `keydown` を拾い、`preventDefault()` と `stopImmediatePropagation()` を使って二重シークを抑止しています。

## 制限事項

- サイト側の実装変更で動かなくなる可能性があります。
- TVer は広告再生中や特殊なプレイヤー状態では期待通り動かない場合があります。
- DOWNTOWN+ はプレイヤー SDK 側の実装が変わると、`video` 要素を検出できなくなる可能性があります。
- ABEMA はプレイヤー側の実装変更や特殊な再生状態では期待通り動かない場合があります。
- Netflix はプレイヤー内部実装の変更で専用ブリッジが効かなくなる可能性があります。
- サイト側が別のイベント処理や独自プレイヤー制御を追加した場合、左右キーの挙動を完全には上書きできないことがあります。
- `SEEK_SECONDS` は現時点では定数です。UI からの変更には未対応です。

## 将来拡張案

- Options 画面を追加してシーク秒数を変更できるようにする
- 対応動画サイトをさらに追加する

## TODO

- 必要に応じてサイトごとのプレイヤー仕様差分に合わせた微調整を追加する
