# フィジカルノート

筋トレ・食事・体重の記録を見るための画面です。記録そのものはここには置いていません。

- `index.html`：自分用のアプリ（自分のシートの読み取り口につながっています）
- `demo.html`：見本データで動くお試し版
- `start/`：ほかの人向けの配布ページ（記録シートのコピー → 読み取り口の設置 → アプリの発行）
- `start/guide.html`：Gemini Skills の導入ガイド（設定から読み取り・書き込みテストまで）。記録原本のIDは中の `SHEET_ID` に1か所だけ書き、操作画面の画像は `SHOTS` に登録すると表示される
- `app/`：配布版のアプリ。接続リンク（`#api=読み取り口のURL&k=合言葉`）で、その人のシートにつながる
- `setup/physical-note.gs`：配布用の読み取り口（Apps Script）。シートを読むだけで、書き込みはしない
- `start/qrcode.js`：QRコード生成（qrcode-generator 1.4.4、MIT License, Copyright (c) 2009 Kazuhiko Arase）
