// 「アプリの使い方」（start/features.html）の画面画像を、見本データ（app/?demo）で撮り直す。
// 使い方：リポジトリの一番上で `python3 -m http.server 8123` を動かしてから
//   node tools/use-shots.js start/img
// 画像（start/img/use-*.jpg）と、番号の印の位置（marks.json、画像に対する%）が出る。
// 画面の形が変わって印の位置がずれたら、marks.json の値を features.html の .mk の left/top に写す。
const {chromium}=require('playwright');
const fs=require('fs');
const OUT=process.argv[2], BASE='http://localhost:8123/app/';
const W=390,H=844;
(async()=>{
  const b=await chromium.launch();
  const marks={};
  async function page(url){
    const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:'light'});
    await p.goto(BASE+url);await p.waitForTimeout(2000);
    await p.addStyleTag({content:'.demo-bar{display:none!important}*{transition:none!important;animation:none!important}'});
    await p.evaluate(()=>{['gemOpen','gemLink','sheetLink'].forEach(id=>document.getElementById(id).hidden=false);});
    await p.waitForTimeout(300);return p;
  }
  // 印の位置：要素の中心（または左上寄り）を画像に対する%で出す
  async function shoot(p,name,sels){
    const pts=[];
    for(const [sel,at] of sels){
      const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height];},sel);
      if(!r){console.error('no element',name,sel);continue;}
      // R/L：要素の右端・左端の内側、OL：左の外、TL/TR：角
      const [x,y,w,h]=r;let px=x+w/2,py=y+h/2;
      if(at==='R')px=x+w-18;if(at==='L')px=x+18;if(at==='OL')px=x-16;if(at==='OR')px=x+w+16;
      if(at==='TL'){px=x+2;py=y+2;}if(at==='TR'){px=x+w-2;py=y+2;}
      pts.push([+(px/W*100).toFixed(1),+(py/H*100).toFixed(1)]);
    }
    marks[name]=pts;
    await p.screenshot({path:OUT+'/'+name+'.jpg',type:'jpeg',quality:82});
  }
  let p=await page('');
  await p.evaluate(()=>{document.getElementById('gBox').hidden=false;});
  await shoot(p,'use-start',[['#gBtn','R'],['#keyIn','R']]);await p.close();

  p=await page('?demo');
  await shoot(p,'use-day',[['#prevDay','TR'],['#week button.sel','TR'],['#openCal','TL'],['#goToday','TR'],['.kc svg','TL'],['#pfc .rest','OL'],['.links','OL']]);
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(400);
  await shoot(p,'use-day2',[['.wt','TL'],['#train','R'],['#toList','OL'],['.nav button[data-v="day"] svg','TR']]);
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(300);
  await p.click('#openCal');await p.waitForTimeout(700);
  await shoot(p,'use-cal',[['#calMonths','TL'],['.legend','R'],['#calToday','TL']]);
  await p.close();

  p=await page('?demo');
  await p.click('.nav button[data-v="list"]');await p.waitForTimeout(500);
  await p.click('#tabs button[data-t="日別まとめ"]');await p.waitForTimeout(400);
  await shoot(p,'use-list',[['#lPrev','TL'],['#tabs button','TL'],['#sortBtn','OL'],['#listBody .tag.p','OR']]);
  await p.click('.nav button[data-v="graph"]');await p.waitForTimeout(700);
  await shoot(p,'use-graph',[['#gPrev','TL'],['#chartW','TR'],['#chartK','TR']]);
  await p.close();

  p=await page('?demo');
  await p.click('#gemLink');await p.waitForTimeout(700);
  await p.evaluate(()=>{const t=document.getElementById('gemText');t.value=t.value.split(location.origin+'/').join('https://t133isami-sketch.github.io/physical-note/').replace(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[^\s/]*\/?(edit)?/g,'https://docs.google.com/spreadsheets/d/（あなたの記録シート）/edit');document.getElementById('gemErr').textContent='';});
  await shoot(p,'use-gem',[['#gemCopy','R']]);
  await p.close();

  p=await page('?demo');
  await p.evaluate(()=>{
    const y=new Date().getFullYear();
    document.getElementById('mngPanel').hidden=false;
    document.getElementById('mngYears').innerHTML=`<button type="button" class="on">${y}年（今年）</button><button type="button">${y-1}年</button>`;
    document.getElementById('rollText').textContent=`${y-1}年の記録が120件、今年のファイルに残っています。「Physical Note（${y-1}年）」に移すと、今年のファイルが軽くなります。移した記録は、上の「見る年」からいつでも見られます。`;
    const rb=document.getElementById('rollBtn');rb.textContent=`${y-1}年の記録を移す`;rb.hidden=false;
  });
  await p.waitForTimeout(300);
  await shoot(p,'use-mng',[['#mngOpen','R'],['#mngYears button','TR'],['#rollBtn','R']]);
  await p.evaluate(()=>{const c=document.querySelector('#mngPanel .keyc');c.scrollTop=c.scrollHeight;document.getElementById('mngPanel').scrollTop=99999;
    document.getElementById('rsBox').hidden=false;document.getElementById('rsBtn').hidden=true;document.getElementById('rsIn').value='リセット';document.getElementById('rsGo').disabled=false;});
  await p.waitForTimeout(300);
  await shoot(p,'use-mng2',[['label.ck','R'],['#rsIn','R'],['#rsGo','R']]);
  await p.close();
  fs.writeFileSync(OUT+'/marks.json',JSON.stringify(marks));
  console.log(JSON.stringify(marks));
  await b.close();
})();
