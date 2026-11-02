# フィジカルノート

筋トレ・食事・体重の記録を見るための画面です。記録そのものはここには置いていません。

- `index.html`：自分用のアプリ（自分のシートの読み取り口につながっています）
- `demo.html`：見本データで動くお試し版
- `start/`：ほかの人向けの配布ページ（記録シートのコピー → 読み取り口の設置 → アプリの発行）
- `start/guide.html`：Muse版の導入ガイド（記録シートの作成からMuseへの指示文、書き込みテストまで）
- `start/features.html`：アプリの使い方（画面ごとの押す場所とできること）。画面画像は `node tools/use-shots.js start/img` で見本データから撮り直せる
- `app/`：配布版のアプリ（Muse専用）。記録シートは `app/template.json`（配布用テンプレートの写し）と同じ形で作り、Museに送る指示文は `app/muse.txt`。接続リンク（`#api=読み取り口のURL&k=合言葉`）で、その人のシートにつながる
- `setup/physical-note.gs`：配布用の読み取り口（Apps Script）。シートを読むだけで、書き込みはしない
- `start/qrcode.js`：QRコード生成（qrcode-generator 1.4.4、MIT License, Copyright (c) 2009 Kazuhiko Arase）
