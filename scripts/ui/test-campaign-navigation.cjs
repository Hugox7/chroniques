const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { registerHooks } = require('node:module');
const { JSDOM } = require('jsdom');
const { within, fireEvent } = require('@testing-library/dom');
const ts = require('typescript');
const root = resolve(__dirname,'../..');
for(const ext of ['.ts','.tsx']){
  require.extensions[ext]=(module, filename)=>{
    module._compile(ts.transpileModule(readFileSync(filename,'utf8'),{
      compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022},
      fileName:filename
    }).outputText,filename);
  };
}
registerHooks({
  resolve(specifier,context,next){const mocks={'@/lib/supabase':'navigation-db.cjs','@/lib/store':'navigation-db.cjs','next/navigation':'navigation-router.cjs','@/components/ai-character-portrait':'navigation-portrait.cjs'};
    return next(mocks[specifier]?resolve(__dirname,mocks[specifier]):specifier.startsWith('@/')?resolve(root,specifier.slice(2)):specifier,context);}
});
const dom = new JSDOM('<main></main>',{url:'http://localhost/'});
global.window=dom.window;
global.self=global;
global.document=dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT=true;
Object.defineProperty(crypto,'getRandomValues',{value:array=>array.fill(19)});
const {act, createElement} = require('react');
const {createRoot} = require('react-dom/client');



const Page=require(resolve(root,'app/campaigns/[id]/page.tsx')).default;
const Layout=require(resolve(root,'app/campaigns/[id]/layout.tsx')).default;
const db=require('./navigation-db.cjs');
const mount=document.querySelector('main');
const renderer=createRoot(mount);
const ui=within(mount);
window.scrollTo=()=>{};
global.confirm=window.confirm=()=>true;
const dialogPrototype=dom.window.HTMLDialogElement.prototype;
dialogPrototype.showModal=function(){this.setAttribute('open','')};
dialogPrototype.close=function(){if(!this.open)return;this.removeAttribute('open');this.dispatchEvent(new dom.window.Event('close'))};
const click=async name=>await act(async()=>fireEvent.click(ui.getByRole('button',{name,exact:true})));

(async()=>{
 for(const role of ['gm','p0']){
  db.setUser(role);
  await act(async()=>renderer.render(createElement(Layout,{key:role},createElement(Page))));
  const nav=within(ui.getByRole('navigation',{name:'Navigation de la campagne'}));
  assert.deepEqual(nav.getAllByRole('button').map(b=>b.textContent),['Séance','Compagnie','Lieux et commerces','Journal','Documents']);
  assert.equal(nav.queryByRole('button',{name:'Discussion'}),null);
  assert.equal(ui.queryByRole('button',{name:'Coffre et boutiques'}),null);
  assert.equal(ui.queryByRole('heading',{name:'Coffre commun'}),null);
  assert.equal(ui.queryByRole('button',{name:'Ma fiche'})!==null,role==='p0');
  assert.equal(ui.queryByRole('button',{name:'Terminer la séance'})!==null,role==='gm');
  assert.ok(ui.getByText(/Round 1/));
  await click(/^Discussion/);
  assert.ok(ui.getByRole('dialog',{name:'Discussion de campagne'}));
  assert.equal(nav.getByRole('button',{name:'Séance'}).getAttribute('aria-pressed'),'true');
  assert.ok(ui.getByText('Bienvenue à la taverne.'));
  await act(async()=>fireEvent.click(within(ui.getByRole('dialog',{name:'Discussion de campagne'})).getByRole('button',{name:'Fermer'})));
  await click('Compagnie');
  assert.ok(ui.getByRole('heading',{name:'Coffre commun'}));
  assert.equal(ui.queryByLabelText('Montant en po'),null);
  assert.equal(ui.queryByRole('heading',{name:'Lieux et commerces'}),null);
  assert.equal(Boolean(ui.queryByText('Outils MJ · Erlum')),role==='gm');
  if(role==='p0'){
   await click('Ma fiche');
   const dialog=ui.getByRole('dialog',{name:'Fiche complète · Erlum'});
   await within(dialog).findByRole('heading',{name:'Erlum'});
   assert.match(dialog.textContent,/11 \/ 20/);
   assert.match(dialog.textContent,/Empoisonné/);
   assert.equal(within(dialog).queryByRole('button',{name:'Supprimer'}),null);
   await act(async()=>fireEvent.click(within(dialog).getByRole('button',{name:'Fermer'})));
   assert.equal(dialog.open,false);
   await click('Déposer');
   assert.ok(ui.getByLabelText('Montant en po'));
   assert.equal(ui.queryByRole('button',{name:'Retirer l’argent'}),null);
   await click('Fermer le transfert');
   assert.equal(ui.queryByLabelText('Montant en po'),null);
   assert.equal(ui.queryByRole('button',{name:'Fiche complète de Liora'}),null);
  }else{
   await click('Fiche complète de Liora');
   const dialog=ui.getByRole('dialog',{name:'Fiche complète · Liora'});
   await within(dialog).findByText('Fiche en lecture seule.');
   await act(async()=>fireEvent.click(within(dialog).getByRole('button',{name:'Fermer'})));
  }
  await click('Lieux et commerces');
  assert.ok(ui.getByRole('heading',{name:'Lieux et commerces'}));
  assert.equal(ui.queryByRole('heading',{name:'Coffre commun'}),null);
  assert.equal(ui.queryByRole('button',{name:'Terminer la séance'}),null);
  assert.equal(Boolean(ui.queryByText('La boutique secrète')),role==='gm');
  assert.equal(ui.queryByLabelText('Article'),null);
  await act(async()=>fireEvent.click(ui.getByRole('button',{name:/La Forge de Salûn/})));
  if(role==='gm'){
   assert.ok(ui.getByRole('heading',{name:'Préparer la boutique'}));
   assert.equal(ui.queryByLabelText('Payer depuis'),null);
   await click('Achats');
  }else assert.equal(ui.queryByText('Préparation MJ'),null);
  const buy=ui.getByText('Faire un achat');
  await act(async()=>fireEvent.click(buy));
  assert.ok(ui.getByLabelText('Payer depuis'));
  await click('Journal');
  assert.ok(ui.getByLabelText('Filtrer le journal'));
  assert.equal(ui.queryByRole('heading',{name:/Chronique de/}),null);
  await click('Bilans de séance');
  assert.ok(ui.getByRole('heading',{name:'Chronique de La Couronne des brumes'}));
  assert.equal(ui.queryByLabelText('Filtrer le journal'),null);
  await click('Historique des actions');
  assert.ok(ui.getByLabelText('Filtrer le journal'));
  if(role==='p0')assert.equal(ui.queryByRole('button',{name:'Annuler',exact:true}),null);
  await click('Documents');
  assert.ok(ui.getByRole('heading',{name:'Documents et découvertes'}));
  assert.equal(Boolean(ui.queryByRole('button',{name:'Créer un document'})),role==='gm');
  // Revealing a document still opens its preview while the player is on another tab.
  if(role==='p0'){
   await click('Séance');
   db.state.campaign_documents.push({id:'doc',campaign_id:'campaign',author_id:'gm',kind:'written',template:'parchment',title:'La lettre révélée',subtitle:'',body:'Retrouvez le pont.',signature:'',published_at:'2026-11-11T01:00:00Z'});
   await act(async()=>db.emit('campaign_documents'));
   assert.ok(ui.getByRole('dialog',{name:'La lettre révélée'}));
   await click('Fermer');
   await click('Ma fiche');
   assert.ok(ui.getByRole('dialog',{name:'Fiche complète · Erlum'}));
  }
 }
 db.state.campaigns[0].status='completed';
 await act(async()=>renderer.render(createElement(Layout,{key:'completed'},createElement(Page))));
 await click('Lieux et commerces');
 const shopCard=ui.getByRole('button',{name:/La Forge de Salûn/});
 assert.equal(shopCard.closest('fieldset').disabled,false);
 await act(async()=>fireEvent.click(shopCard));
 assert.ok(ui.getByText('Dague'));
 await act(async()=>fireEvent.click(ui.getByText('Faire un achat')));
 assert.equal(ui.getByLabelText('Article').closest('fieldset').disabled,true);
 await click('← Toutes les boutiques');
 db.state.campaigns[0].status='active';
 db.setUser('p1');
 db.state.campaign_members.find(m=>m.user_id==='p1').character_id=null;
 await act(async()=>renderer.render(createElement(Layout,{key:'unassigned'},createElement(Page))));
 assert.equal(ui.queryByRole('button',{name:'Ma fiche'}),null);
 await click('Choisir mon personnage');
 assert.ok(ui.getByRole('heading',{name:'La compagnie'}));
 assert.equal(mount.querySelector('.mj-workspace').dataset.view,'company');
 act(()=>renderer.unmount());
 console.log('Navigation MJ/joueur, Ma fiche sur plusieurs onglets, ressources de séance, droits, coffre replié, boutiques distinctes, bilans et révélation des documents validés.');
})().catch(error=>{console.error(error.stack);process.exitCode=1});
