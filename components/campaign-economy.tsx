'use client';

import { useState } from 'react';
import useCampaignEconomy from '@/components/use-campaign-economy';
import { copperAmount, goldLabel, shopTemplates, type Shop, type Stock } from '@/lib/campaign-economy';
import { shopCatalog } from '@/lib/equipment-extensions';
import { normalizeInventory2014 } from '@/lib/armor-class-2014';

type Execute = (action: string, data: Record<string, unknown>, confirmation?: string) => Promise<boolean>;

function ShopEditor({ shop, stock, execute }: { shop: Shop; stock: Stock[]; execute: Execute }) {
  const [editing, setEditing] = useState<{ name: string; description: string; version: number }|null>(null);
  const [article, setArticle] = useState<{ id?: string; name: string; price: string; quantity: number; version: number }|null>(null);
  return <div className="economy-shop-management">
    <h3>Préparer la boutique</h3>
    <div className="hp-actions">
      <button className="btn outline" type="button" onClick={() => setEditing({ name: shop.name, description: shop.description, version: shop.version })}>Nom et description</button>
      <button className="btn outline" type="button" onClick={() => void execute('edit_shop', {
        shop_id: shop.id, version: shop.version, name: shop.name, description: shop.description, is_visible: !shop.is_visible,
      }, shop.is_visible ? 'Masquer cette boutique aux joueurs ?' : 'Ouvrir cette boutique aux joueurs ?')}>{shop.is_visible ? 'Masquer aux joueurs' : 'Ouvrir aux joueurs'}</button>
      <button className="btn outline" type="button" onClick={() => setArticle({ name: '', price: '', quantity: 1, version: shop.version })}>+ Article</button>
    </div>
    {editing && <form className="economy-form" onSubmit={async event => {
      event.preventDefault();
      if (await execute('edit_shop', { shop_id: shop.id, version: editing.version, name: editing.name.trim(), description: editing.description, is_visible: shop.is_visible })) setEditing(null);
    }}>
      <label>Nom de la boutique<input className="field" required maxLength={120} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></label>
      <label>Description<textarea className="field" maxLength={1000} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></label>
      <button className="btn outline">Enregistrer la boutique</button>
      <button className="btn outline" type="button" onClick={() => setEditing(null)}>Annuler</button>
    </form>}
    <ul className="economy-list">{stock.map(row => <li key={row.id}><span>{row.item.name} · {goldLabel(row.price_cp)} · Stock {row.quantity}</span>
      <button className="btn outline" type="button" onClick={() => setArticle({ id: row.id, name: row.item.name, price: String(row.price_cp / 100), quantity: row.quantity, version: shop.version })}>Modifier {row.item.name}</button>
    </li>)}</ul>
    {article && <form className="economy-form" onSubmit={async event => {
      event.preventDefault();
      const price = copperAmount(article.price);
      if (price === null) return;
      if (await execute('stock', { shop_id: shop.id, version: article.version, stock_id: article.id, name: article.name.trim(), price_cp: price, quantity: article.quantity })) setArticle(null);
    }}>
      <label>Préremplir depuis le catalogue<select className="field" defaultValue="" onChange={e => {
        const selected = shopCatalog.find(([name]) => name === e.target.value);
        if (selected) setArticle({ ...article, name: selected[0], price: String(selected[1]) });
      }}><option value="">Article personnalisé</option>{shopCatalog.map(([name]) => <option key={name}>{name}</option>)}</select></label>
      <label>Nom de l’article<input className="field" maxLength={200} required value={article.name} onChange={e => setArticle({ ...article, name: e.target.value })}/></label>
      <label>Prix unitaire en po<input className="field" inputMode="decimal" required value={article.price} onChange={e => setArticle({ ...article, price: e.target.value })}/></label>
      <label>Quantité en stock<input className="field" type="number" min={0} max={999999} required value={article.quantity} onChange={e => setArticle({ ...article, quantity: Number(e.target.value) })}/></label>
      <p className="hint">Un stock à zéro rend l’article indisponible.</p>
      <button className="btn outline" disabled={copperAmount(article.price) === null}>Enregistrer l’article</button>
      <button className="btn outline" type="button" onClick={() => setArticle(null)}>Annuler</button>
    </form>}
  </div>;
}

function ShopPurchase({ shop, stock, characterId, execute }: { shop: Shop; stock: Stock[]; characterId?: string; execute: Execute }) {
  const [stockId, setStockId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [funding, setFunding] = useState(characterId ? 'character' : 'vault');
  const [destination, setDestination] = useState(characterId ? 'character' : 'vault');
  const item = stock.find(row => row.id === stockId);
  const cost = item ? item.price_cp * quantity : 0;
  return <form className="economy-form" onSubmit={async event => {
    event.preventDefault();
    if (!item) return;
    if (await execute('purchase', { stock_id: item.id, quantity, funding, destination,
      expected_price_cp: item.price_cp, ...((funding === 'character' || destination === 'character') ? { character_id: characterId } : {}),
    }, `Acheter ${quantity} × ${item.item.name} chez ${shop.name} pour ${goldLabel(cost)} ?\nPaiement depuis ${funding === 'vault' ? 'la caisse commune' : 'ton personnage'}. Livraison dans ${destination === 'vault' ? 'le coffre commun' : 'ton inventaire'}.`)) { setStockId(''); setQuantity(1); }
  }}>
    <label>Article<select className="field" value={stockId} onChange={e => { setStockId(e.target.value); setQuantity(1); }}>
      <option value="">Choisir un article</option>{stock.map(row => <option key={row.id} value={row.id} disabled={row.quantity === 0}>{row.item.name} · {goldLabel(row.price_cp)} · Stock {row.quantity}</option>)}
    </select></label>
    <label>Quantité<input className="field" type="number" min={1} max={item?.quantity ?? 1} required value={quantity} onChange={e => setQuantity(Number(e.target.value))}/></label>
    <label>Payer depuis<select className="field" value={funding} onChange={e => setFunding(e.target.value)}>
      {characterId && <option value="character">Mon personnage</option>}<option value="vault">Caisse commune</option>
    </select></label>
    <label>Livrer dans<select className="field" value={destination} onChange={e => setDestination(e.target.value)}>
      {characterId && <option value="character">Mon inventaire</option>}<option value="vault">Coffre commun</option>
    </select></label>
    <button className="btn gold" disabled={!item || quantity < 1 || !Number.isInteger(quantity) || quantity > item.quantity}>Acheter · {goldLabel(cost)}</button>
  </form>;
}

export default function CampaignEconomy({ campaignId, me, isGM, campaignStatus, actorNames, mode = 'vault' }: {
  campaignId: string; me: string; isGM: boolean; campaignStatus: string; actorNames: Record<string, string>; mode?: 'vault'|'shops';
}) {
  const economy = useCampaignEconomy(campaignId);
  const { vault, items, shops, stock, people, events, ready, busy, error, uncertain, execute } = economy;
  const view = mode;
  const [transfer, setTransfer] = useState<'deposit'|'withdraw'|null>(null);
  const [transferKind, setTransferKind] = useState<'money'|'item'>('money');
  const [shopId, setShopId] = useState<string|null>(null);
  const [shopSection, setShopSection] = useState<'manage'|'buy'>(isGM ? 'manage' : 'buy');
  const [money, setMoney] = useState('');
  const [location, setLocation] = useState<{ value: string; version: number }|null>(null);
  const [depositItemId, setDepositItemId] = useState('');
  const [depositQuantity, setDepositQuantity] = useState(1);
  const [takeItemId, setTakeItemId] = useState('');
  const [takeQuantity, setTakeQuantity] = useState(1);
  const [giftName, setGiftName] = useState('');
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [giftMoney, setGiftMoney] = useState('');
  const [giftRecipient, setGiftRecipient] = useState('');
  const [shopName, setShopName] = useState('');
  const [template, setTemplate] = useState<keyof typeof shopTemplates>('grocery');
  const character = people.find(person => person.owner_id === me);
  const inventory = normalizeInventory2014(character?.inventory).filter(item => item.quantity > 0);
  const amount = copperAmount(money);
  const readOnly = !['active', 'paused', 'recruiting'].includes(campaignStatus);
  const locked = busy || !ready || uncertain;
  const chosenDeposit = inventory.find(item => item.id === depositItemId);
  const chosenTake = items.find(item => item.id === takeItemId);

  return <section className="panel" id="campaign-economy">
    <div className="campaign-section-heading economy-heading">
      <div><h2>{view === 'vault' ? 'Coffre commun' : 'Lieux et commerces'}</h2>
        <p className="hint">{view === 'vault' ? 'L’argent et les objets partagés par la compagnie.' : isGM ? 'Prépare les boutiques, puis ouvre-les aux joueurs.' : 'Les boutiques ouvertes par le MJ pendant l’aventure.'}</p>
      </div>
      <button className="btn outline" type="button" disabled={busy} onClick={() => void economy.load()}>Actualiser</button>
    </div>
    {error && <p className="notice error" role="alert">{error}</p>}
    {uncertain && <button className="btn outline" type="button" disabled={busy} onClick={() => void economy.retry()}>Vérifier la dernière opération</button>}
    {!ready && !error && <p role="status">Chargement des biens de la compagnie…</p>}
    {ready && <>
      <p className="economy-balance"><strong>Caisse commune · {goldLabel(vault.balance_cp)}</strong>{character && <> · {character.name} · {goldLabel(Math.round((character.remaining_gold ?? 0) * 100))} personnels</>}</p>
      {readOnly && <p className="hint">Les biens et boutiques sont en consultation pour ce statut de campagne.</p>}
      <fieldset disabled={locked} className="economy-fieldset">
        {view === 'vault' ? <>
          <p>Emplacement · {vault.location || 'À préciser par le MJ'}</p>
          {isGM && !readOnly && (location ? <form className="hp-actions" onSubmit={async e => {
            e.preventDefault();
            if (await execute('location', { location: location.value, version: location.version })) setLocation(null);
          }}>
            <label>Emplacement du coffre<input className="field" maxLength={200} value={location.value} onChange={e => setLocation({ ...location, value: e.target.value })}/></label>
            <button className="btn outline">Enregistrer l’emplacement</button>
            <button className="btn outline" type="button" onClick={() => setLocation(null)}>Annuler</button>
          </form> : <button className="btn outline" type="button" onClick={() => setLocation({ value: vault.location, version: vault.version })}>Préciser l’emplacement</button>)}
          <p className="hint">Tous les joueurs associés peuvent déposer et retirer des biens. Chaque mouvement est conservé.</p>
          <h3>Objets du coffre</h3>
          {items.length === 0 ? <p>Le coffre est vide.</p> : <ul className="economy-list">{items.map(item => <li key={item.id}><strong>{item.item.name}</strong><span>×{item.quantity}</span></li>)}</ul>}
          {character && !readOnly ? <>
            <div className="hp-actions economy-transfer-actions">
              <button className="btn gold" type="button" aria-expanded={transfer === 'deposit'} onClick={() => setTransfer(transfer === 'deposit' ? null : 'deposit')}>Déposer</button>
              <button className="btn outline" type="button" aria-expanded={transfer === 'withdraw'} onClick={() => setTransfer(transfer === 'withdraw' ? null : 'withdraw')}>Retirer</button>
            </div>
            {transfer && <div className="economy-transfer">
              <h3>{transfer === 'deposit' ? 'Déposer dans le coffre' : 'Retirer pour ' + character.name}</h3>
              <div className="campaign-subnav" aria-label="Type de transfert">
                <button className="btn outline" type="button" aria-pressed={transferKind === 'money'} onClick={() => setTransferKind('money')}>Argent</button>
                <button className="btn outline" type="button" aria-pressed={transferKind === 'item'} onClick={() => setTransferKind('item')}>Objet</button>
                <button className="btn outline" type="button" onClick={() => setTransfer(null)}>Fermer le transfert</button>
              </div>
            {transferKind === 'money' && <div className="hp-actions">
              <label>Montant en po<input className="field" inputMode="decimal" value={money} onChange={e => setMoney(e.target.value)}/></label>
              {transfer === 'deposit' && <button className="btn gold" type="button" disabled={!amount} onClick={async () => {
                if (await execute('deposit_money', { character_id: character.id, amount_cp: amount }, `Déposer ${goldLabel(amount!)} dans la caisse commune ?`)) setMoney('');
              }}>Déposer l’argent</button>}
              {transfer === 'withdraw' && <button className="btn gold" type="button" disabled={!amount} onClick={async () => {
                if (await execute('withdraw_money', { character_id: character.id, amount_cp: amount }, `Retirer ${goldLabel(amount!)} de la caisse commune pour ${character.name} ?`)) setMoney('');
              }}>Retirer l’argent</button>}
            </div>}
            {transferKind === 'item' && transfer === 'deposit' && <form className="economy-form" onSubmit={async e => {
              e.preventDefault();
              if (await execute('deposit_item', { character_id: character.id, item_id: depositItemId, quantity: depositQuantity },
                `Déposer ${depositQuantity} × ${chosenDeposit?.name} dans le coffre ?`)) { setDepositItemId(''); setDepositQuantity(1); }
            }}>
              <label>Objet de mon inventaire<select className="field" value={depositItemId} onChange={e => { setDepositItemId(e.target.value); setDepositQuantity(1); }}>
                <option value="">Choisir un objet</option>{inventory.map(item => <option key={item.id} value={item.id}>{item.name} · ×{item.quantity}</option>)}
              </select></label>
              <label>Quantité à déposer<input className="field" type="number" required min={1} max={chosenDeposit?.quantity ?? 1} value={depositQuantity} onChange={e => setDepositQuantity(Number(e.target.value))}/></label>
              <button className="btn outline" disabled={!chosenDeposit}>Déposer l’objet</button>
            </form>}
          {transferKind === 'item' && transfer === 'withdraw' && (items.length === 0 ? <p>Le coffre ne contient aucun objet à retirer.</p> : <form className="economy-form" onSubmit={async e => {
            e.preventDefault();
            if (await execute('withdraw_item', { character_id: character.id, item_id: takeItemId, quantity: takeQuantity },
              `Prendre ${takeQuantity} × ${chosenTake?.item.name} pour ${character.name} ?`)) { setTakeItemId(''); setTakeQuantity(1); }
          }}>
            <label>Objet du coffre<select className="field" value={takeItemId} onChange={e => { setTakeItemId(e.target.value); setTakeQuantity(1); }}>
              <option value="">Choisir un objet</option>{items.map(item => <option key={item.id} value={item.id}>{item.item.name} · ×{item.quantity}</option>)}
            </select></label>
            <label>Quantité à prendre<input className="field" type="number" min={1} max={chosenTake?.quantity ?? 1} value={takeQuantity} required onChange={e => setTakeQuantity(Number(e.target.value))}/></label>
            <button className="btn gold" disabled={!chosenTake}>Prendre l’objet</button>
          </form>)}
            </div>}
          </> : !readOnly && <p className="hint">{isGM ? 'Le MJ peut attribuer du butin ci-dessous.' : 'Associe ton personnage dans Compagnie pour déposer ou retirer des biens.'}</p>}
          {isGM && !readOnly && <details className="mj-disclosure"><summary>Attribuer du butin · MJ</summary>
            <form className="economy-form" onSubmit={async e => {
              e.preventDefault();
              const amount = copperAmount(giftMoney);
              if (amount && await execute('grant_money', { amount_cp: amount, ...(giftRecipient ? { character_id: giftRecipient } : {}) },
                `Attribuer ${goldLabel(amount)} à ${people.find(person => person.id === giftRecipient)?.name ?? 'la caisse commune'} ?`)) setGiftMoney('');
            }}>
              <label>Destinataire<select className="field" value={giftRecipient} onChange={e => setGiftRecipient(e.target.value)}>
                <option value="">Caisse commune</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select></label>
              <label>Butin en po<input className="field" inputMode="decimal" required value={giftMoney} onChange={e => setGiftMoney(e.target.value)}/></label>
              <button className="btn outline" disabled={!copperAmount(giftMoney)}>Attribuer l’argent</button>
            </form>
            <form className="economy-form" onSubmit={async e => {
              e.preventDefault();
              if (await execute('grant_item', { name: giftName.trim(), quantity: giftQuantity },
                `Ajouter ${giftQuantity} × ${giftName} au coffre commun ?`)) setGiftName('');
            }}>
              <label>Objet de butin<input className="field" maxLength={200} required value={giftName} onChange={e => setGiftName(e.target.value)}/></label>
              <label>Quantité de butin<input className="field" type="number" min={1} max={999999} required value={giftQuantity} onChange={e => setGiftQuantity(Number(e.target.value))}/></label>
              <button className="btn outline" disabled={!giftName.trim()}>Ajouter au coffre</button>
            </form>
          </details>}
        </> : <>
          {isGM && !readOnly && !shopId && <details className="mj-disclosure"><summary>+ Créer une boutique</summary>
            <form className="economy-form" onSubmit={async e => {
              e.preventDefault();
              const spec = shopTemplates[template];
              if (await execute('create_shop', { name: shopName.trim(), items: spec.items.map(([name, price]) => ({ name, price_cp: Math.round(price * 100), quantity: spec.quantity })) })) setShopName('');
            }}>
              <label>Nom de la nouvelle boutique<input className="field" required maxLength={120} value={shopName} onChange={e => setShopName(e.target.value)}/></label>
              <label>Modèle<select className="field" value={template} onChange={e => setTemplate(e.target.value as keyof typeof shopTemplates)}>
                {Object.entries(shopTemplates).map(([key, spec]) => <option key={key} value={key}>{spec.label}</option>)}
              </select></label>
              <p className="hint">Prix du catalogue de départ. Ajuste le stock, puis ouvre la boutique aux joueurs.</p>
              <button className="btn gold" disabled={!shopName.trim()}>Créer la boutique</button>
            </form>
          </details>}
          {shops.length === 0 && <p>{isGM ? 'Crée une boutique pour préparer les commerces de la campagne.' : 'Le MJ n’a pas encore ouvert de boutique.'}</p>}
          {!shops.some(shop => shop.id === shopId) ? <div className="economy-shop-grid">
            {shops.map(shop => <button type="button" key={shop.id} className="economy-shop-card" onClick={() => { setShopId(shop.id); setShopSection(isGM ? 'manage' : 'buy'); }}>
              <strong>{shop.name}</strong>
              {isGM && <span className="economy-visibility" data-visible={shop.is_visible}>{shop.is_visible ? 'Ouverte aux joueurs' : 'Préparation privée'}</span>}
              {shop.description && <span>{shop.description}</span>}
              <small>{stock.filter(row => row.shop_id === shop.id && row.quantity > 0).length} article(s) disponible(s)</small>
              <span className="economy-shop-enter">{isGM ? 'Préparer la boutique →' : 'Voir les articles →'}</span>
            </button>)}
          </div> : shops.filter(shop => shop.id === shopId).map(shop => <article key={shop.id} className="economy-shop">
            <button type="button" className="btn outline" onClick={() => setShopId(null)}>← Toutes les boutiques</button>
            <h3 className="economy-shop-title">{shop.name}</h3>
            {shop.description && <p>{shop.description}</p>}
            {isGM && <>
              <p className="economy-visibility" data-visible={shop.is_visible}>{shop.is_visible ? 'Ouverte aux joueurs' : 'Préparation privée · invisible aux joueurs'}</p>
              <div className="campaign-subnav" aria-label="Vue de la boutique">
                <button className="btn outline" type="button" aria-pressed={shopSection === 'manage'} onClick={() => setShopSection('manage')}>Préparation MJ</button>
                <button className="btn outline" type="button" aria-pressed={shopSection === 'buy'} onClick={() => setShopSection('buy')}>Achats</button>
              </div>
            </>}
            {isGM && shopSection === 'manage' ? <fieldset disabled={readOnly} className="economy-fieldset"><ShopEditor shop={shop} stock={stock.filter(row => row.shop_id === shop.id)} execute={execute}/></fieldset> : <>
              <ul className="economy-list">{stock.filter(row => row.shop_id === shop.id).map(row => <li key={row.id}>
                <span><strong>{row.item.name}</strong><small>{row.quantity > 0 ? row.quantity + ' en stock' : 'Épuisé'}</small></span><span>{goldLabel(row.price_cp)}</span>
              </li>)}</ul>
              {stock.filter(row => row.shop_id === shop.id).length === 0 ? <p>Aucun article pour le moment.</p> : <details className="mj-disclosure">
                <summary>Faire un achat</summary>
                <fieldset disabled={readOnly} className="economy-fieldset"><ShopPurchase key={shop.id + (character?.id ?? '')} shop={shop} stock={stock.filter(row => row.shop_id === shop.id)} characterId={character?.id} execute={execute}/></fieldset>
              </details>}
            </>}
          </article>)}
        </>}
      </fieldset>
      <details className="mj-disclosure"><summary>Derniers mouvements</summary>
        <ul className="economy-list">{events.map(event => <li key={event.request_id}>
          <div>{event.summary}<small className="hint">{new Date(event.created_at).toLocaleString('fr-FR')} · Par {actorNames[event.actor_id] ?? 'Membre de la compagnie'}</small></div>
        </li>)}</ul>{events.length === 0 && <p>Aucun mouvement pour le moment.</p>}
      </details>
    </>}
  </section>;
}
