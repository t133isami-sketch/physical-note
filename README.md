# PHYSICAL NOTE（フィジカルノート）

筋トレ・食事・体重の記録を見るための画面です。記録そのものはここには置いていません。

- `index.html`：自分用のアプリ（自分のシートの読み取り口につながっています）
- `demo.html`：見本データで動くお試し版
- `start/`：ほかの人向けの配布ページ（ひな形シートのコピー → 読み取り口の設置 → アプリの発行）
- `app/`：配布版のアプリ。接続リンク（`#api=読み取り口のURL&k=合言葉`）で、その人のシートにつながる
- `setup/physical-note.gs`：配布用の読み取り口（Apps Script）。シートを読むだけで、書き込みはしない
- `start/qrcode.js`：QRコード生成（qrcode-generator 1.4.4、MIT License, Copyright (c) 2009 Kazuhiko Arase）
