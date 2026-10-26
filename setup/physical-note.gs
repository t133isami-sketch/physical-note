/**
 * フィジカルノート｜読み取り口（配布用）
 *
 * このスプレッドシートの記録を、フィジカルノートのアプリへ返すだけのスクリプトです。
 * シートへの書き込みはしません。合言葉が合うときだけ記録を返します。
 *
 * 使い方
 *  1. スプレッドシートの「拡張機能 → Apps Script」を開き、最初からある中身をすべて消してこのコードを貼り付けて保存
 *  2. 「デプロイ → 新しいデプロイ → 種類：ウェブアプリ」
 *     次のユーザーとして実行：自分 ／ アクセスできるユーザー：全員 →「デプロイ」（初回は権限の許可が出ます）
 *  3. スプレッドシートを開き直し、メニュー「フィジカルノート → アプリとつなぐ」
 *     合言葉が自動で作られ、アプリの接続リンクが表示されます
 *
 * @OnlyCurrentDoc
 */

const PN_SITE = 'https://t133isami-sketch.github.io/physical-note/';
const PN_KEY_PROP = 'PN_KEY';

/** ?k=合言葉&ym=yyyy-MM で、その月の記録を JSON で返す */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const key = PropertiesService.getScriptProperties().getProperty(PN_KEY_PROP);
  let out;
  if (!key || !p.k || p.k !== key) out = { error: 'unauthorized' };
  else if (!/^\d{4}-\d{2}$/.test(p.ym || '')) out = { error: 'bad_request' };
  else {
    try { out = pn_month_(p.ym); } catch (err) { out = { error: String((err && err.message) || err) }; }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('フィジカルノート')
    .addItem('アプリとつなぐ', 'pn_connect')
    .addItem('合言葉を作り直す', 'pn_resetKey')
    .addToUi();
}

/** 合言葉を（なければ作って）表示し、アプリの接続リンクを出す */
function pn_connect() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty(PN_KEY_PROP);
  if (!key) { key = pn_newKey_(); props.setProperty(PN_KEY_PROP, key); }
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (_) {}
  if (!/\/exec$/.test(url)) url = '';
  const link = url ? PN_SITE + 'app/#api=' + encodeURIComponent(url) + '&k=' + encodeURIComponent(key) : '';
  const issue = PN_SITE + 'start/#issue' + (url ? '&api=' + encodeURIComponent(url) : '') + '&k=' + encodeURIComponent(key);
  const h = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html =
    '<div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,\'Hiragino Sans\',sans-serif;color:#1d1d1f">' +
    '<p style="margin:0 0 6px;color:#6e6e73">あなたの合言葉</p>' +
    '<p style="margin:0 0 14px;font:600 20px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.04em">' + h(key) + '</p>' +
    (url
      ? '<p style="margin:0 0 14px">下のボタンから発行ページを開くと、スマホで読み取れるQRコードと接続リンクが出ます。</p>'
      : '<p style="margin:0 0 14px">ウェブアプリのURLを読み取れませんでした。発行ページで、デプロイしたときのURL（/exec で終わるもの）とこの合言葉を貼り付けてください。</p>') +
    '<p style="margin:0 0 10px"><a href="' + h(issue) + '" target="_blank" style="display:inline-block;background:#0071e3;color:#fff;border-radius:980px;padding:10px 20px;text-decoration:none;font-weight:600">発行ページを開く</a></p>' +
    (link ? '<p style="margin:0;color:#6e6e73;font-size:12px;word-break:break-all">接続リンク：' + h(link) + '</p>' : '') +
    '<p style="margin:12px 0 0;color:#6e6e73;font-size:12px">合言葉とリンクは、ほかの人に教えないでください。</p></div>';
  try {
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(420).setHeight(url ? 300 : 280), 'アプリとつなぐ');
  } catch (_) { // エディタから実行したとき
    console.log('合言葉：' + key + '\n発行ページ：' + issue + (link ? '\n接続リンク：' + link : ''));
  }
}

/** 合言葉を新しくする（以前のリンクは使えなくなる） */
function pn_resetKey() {
  PropertiesService.getScriptProperties().deleteProperty(PN_KEY_PROP);
  pn_connect();
}

function pn_newKey_() {
  const words = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Date.now());
  let s = '';
  for (let i = 0; i < 16; i++) s += words[(bytes[i] & 255) % words.length];
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16);
}

/** 指定月（yyyy-MM）の表示に必要なデータをまとめて返す */
function pn_month_(ym) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Tokyo';
  const key = v => pn_dateKey_(v, tz);
  const num = v => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v);
  // 有効の列は、FALSE と書いた行だけ除く（空欄は有効）
  const valid = v => !(v === false || String(v).trim().toUpperCase() === 'FALSE');
  const inYm = d => d && d.slice(0, 7) === ym;
  const year = ym.slice(0, 4);

  const st = pn_rows_(ss, '設定', 3).map(r => r[1]);
  const settings = { kcal: num(st[0]), p: num(st[1]), f: num(st[2]), c: num(st[3]), weight: num(st[4]) };

  const meals = [], weights = [], training = [], body = [];
  const allMeals = [], allWeights = [], allTraining = [], doneDays = {};

  pn_rows_(ss, '食事', 12).forEach((r, i) => {
    const d = key(r[1]);
    if (!d || !valid(r[11]) || d.slice(0, 4) !== year) return;
    const m = {
      id: String(r[0] || '食事' + (i + 2)), date: d, time: pn_time_(r[2], tz), kind: String(r[3] || ''), content: String(r[4] || ''),
      kcal: num(r[5]), p: num(r[6]), f: num(r[7]), c: num(r[8]), status: String(r[10] || ''),
    };
    allMeals.push(m);
    if (inYm(d)) meals.push(m);
  });

  pn_rows_(ss, '体重', 6).forEach(r => {
    const d = key(r[1]);
    if (!d || !valid(r[5]) || num(r[3]) == null || d.slice(0, 4) !== year) return;
    const w = { date: d, when: String(r[2] || '朝'), kg: num(r[3]), note: String(r[4] || '') };
    allWeights.push(w);
    if (inYm(d)) weights.push(w);
  });

  pn_rows_(ss, 'トレーニング', 14).forEach(r => {
    const d = key(r[1]);
    if (!d || !valid(r[8]) || d.slice(0, 4) !== year) return;
    const t = {
      date: d, kind: String(r[2] || 'トレーニング'), part: String(r[3] || ''), minutes: num(r[4]),
      memo: String(r[7] || ''), sets: num(r[12]), detail: String(r[13] || ''),
    };
    allTraining.push(t);
    if (inYm(d)) training.push(t);
  });

  pn_rows_(ss, '月曜体組成', 14).forEach(r => {
    const d = key(r[1]) || key(r[2]);
    if (!inYm(d) || !valid(r[13])) return;
    body.push({
      monday: d, measured: key(r[2]), weight: num(r[3]), fat: num(r[4]), muscle: num(r[5]),
      skeletal: num(r[6]), visceral: num(r[7]), bmr: num(r[8]), water: num(r[9]), waist: num(r[10]),
      status: String(r[12] || ''),
    });
  });

  pn_rows_(ss, '日次確認', 2).forEach(r => {
    const d = key(r[0]);
    if (d && (r[1] === true || String(r[1]).trim().toUpperCase() === 'TRUE' || String(r[1]).trim() === '完了')) doneDays[d] = true;
  });

  // 日ごとのまとめ（以前は「日別集計」タブの式で出していたものを、ここで計算する）
  const days = [];
  const n = new Date(Date.UTC(+year, +ym.slice(5, 7), 0)).getUTCDate();
  for (let i = 1; i <= n; i++) {
    const d = ym + '-' + ('0' + i).slice(-2);
    const ms = allMeals.filter(m => m.date === d);
    const total = f => (ms.length && ms.every(m => m[f] != null && m[f] >= 0)) ? ms.reduce((a, m) => a + m[f], 0) : null;
    const avg = when => {
      const v = allWeights.filter(w => w.date === d && w.when === when).map(w => w.kg);
      return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null;
    };
    const ts = allTraining.filter(t => t.date === d);
    const tsum = f => (ts.length && ts.every(t => t[f] != null)) ? ts.reduce((a, t) => a + t[f], 0) : null;
    days.push({
      date: d, am: avg('朝'), pm: avg('夜'), kcal: total('kcal'), p: total('p'), f: total('f'), c: total('c'),
      meals: ms.length, done: !!doneDays[d],
      training: ts.map(t => t.kind === 'オフ' ? 'オフ' : (t.part || '部位未記入')).join(' / '),
      minutes: tsum('minutes'), sets: tsum('sets'),
    });
  }

  // レシピは名前ごとに最新の版だけ。1食の値が空なら、全量÷食数で出す
  const latest = {};
  pn_rows_(ss, 'レシピ', 18).forEach(r => {
    if (!r[1] || !valid(r[17])) return;
    const id = String(r[0] || r[1]), ver = num(r[2]) || 1, servings = num(r[3]);
    const per = (one, all) => num(one) != null ? num(one) : (num(all) != null && servings > 0 ? num(all) / servings : null);
    if (!latest[id] || latest[id].ver < ver) {
      latest[id] = { id, name: String(r[1]), ver, servings,
        kcal: per(r[10], r[6]), p: per(r[11], r[7]), f: per(r[12], r[8]), c: per(r[13], r[9]), status: String(r[14] || '') };
    }
  });

  return {
    ym, today: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), settings,
    meals, weights, training, body, days, recipes: Object.keys(latest).map(k => latest[k]),
  };
}

/** 見出し（1行目）を除いた、記録の入っている行を左から width 列ぶん読む */
function pn_rows_(ss, name, width) {
  const sh = ss.getSheetByName(name);
  const last = sh ? sh.getLastRow() : 0;
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, Math.min(width, sh.getMaxColumns())).getValues()
    .filter(r => r.some(v => v !== '' && v !== null));
}

function pn_dateKey_(v, tz) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  const m = String(v || '').match(/(\d{4})[-\/年.](\d{1,2})[-\/月.](\d{1,2})/);
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
}

function pn_time_(v, tz) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, tz, 'HH:mm');
  return String(v || '');
}
