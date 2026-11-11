let user='gm';
const callbacks=new Set();
const characters=['Erlum','Liora','Mira','Théon','Ysandre'].map((name,i)=>({id:'c'+i,owner_id:'p'+i,name,level:3,class_name:'Guerrier',race:'Humain',inventory:[],remaining_gold:12,notes:'Notes de '+name,abilities:{FOR:14,DEX:14,CON:12,INT:10,SAG:10,CHA:10},hp_current:17,hp_max:20}));
const members=[{user_id:'gm',character_id:null,campaign_id:'campaign'},...characters.map(c=>({user_id:c.owner_id,character_id:c.id,campaign_id:'campaign',allow_gm_outside_session:false}))];
const state={
 campaigns:[{id:'campaign',title:'La Couronne des brumes',owner_id:'gm',status:'active',description:'La compagnie traverse les terres de Salûn.'}],
 campaign_members:members,characters,campaign_messages:[{id:'message',campaign_id:'campaign',author_id:'gm',body:'Bienvenue à la taverne.',created_at:'2026-11-11T00:00:00Z'}],
 profiles:members.map(m=>({id:m.user_id,username:m.user_id==='gm'?'Hugo':characters.find(c=>c.owner_id===m.user_id)?.name})),
 campaign_invites:[],campaign_documents:[],
 game_sessions:[{id:'session',campaign_id:'campaign',status:'active',started_at:'2026-11-10T20:00:00Z'}],
 session_initiative_2014:[{session_id:'session',entries:characters.map((c,i)=>({id:c.id,name:c.name,score:16-i})),round:1,turn_index:0,version:1}],
 campaign_character_state:characters.map(c=>({campaign_id:'campaign',character_id:c.id,hp_current:11,hp_max:20,hp_temporary:2,conditions:['Empoisonné'],version:1})),
 campaign_character_events:[],campaign_combat_rolls_2014:[],campaign_private_notes:[],
 campaign_vaults:[{campaign_id:'campaign',balance_cp:2500,location:'Charrette',version:1}],campaign_vault_items:[{id:'item',campaign_id:'campaign',item:{name:'Torche'},quantity:3}],
 campaign_shops:[{id:'shop',campaign_id:'campaign',name:'La Forge de Salûn',description:'Armes et outils du village.',is_visible:true,version:1},{id:'secret-shop',campaign_id:'campaign',name:'La boutique secrète',is_visible:false,version:1}],
 campaign_shop_stock:[{id:'stock',shop_id:'shop',item:{name:'Dague'},price_cp:200,quantity:4}],
 campaign_trade_events:[],session_summaries:[],
};
exports.state=state;exports.calls=[];exports.setUser=value=>user=value;exports.userId=async()=>user;
exports.getCharacter=async id=>state.characters.find(c=>c.id===id);
exports.emit=table=>{for(const cb of callbacks)if(cb.table===table)cb.fn()};
function query(table){
 const filters=[];let single=false,limit=Infinity,action=null,payload=null;
 const builder={
  select(){return this},eq(key,value){filters.push(row=>row[key]===value);return this},in(key,values){filters.push(row=>values.includes(row[key]));return this},order(){return this},limit(n){limit=n;return this},
  maybeSingle(){single=true;return this},single(){single=true;return this},update(data){action='update';payload=data;return this},
  then(resolve,reject){
   let rows=(state[table]??[]).filter(row=>filters.every(test=>test(row)));
   if(user!=='gm'&&table==='campaign_shops')rows=rows.filter(row=>row.is_visible);
   if(user!=='gm'&&table==='campaign_documents')rows=rows.filter(row=>row.published_at);
   if(table==='campaign_members')rows=rows.map(row=>({...row,campaigns:{title:'Test',status:'active'}}));
   if(action){rows.forEach(row=>Object.assign(row,payload));exports.calls.push([table,action,payload]);}
   rows=rows.slice(0,limit);
   return Promise.resolve({data:single?structuredClone(rows[0]??null):structuredClone(rows),error:null,count:rows.length}).then(resolve,reject);
  }
 };return builder;
}
exports.supabase=()=>({
 auth:{getUser:async()=>({data:{user:{id:user}}})},from:query,
 rpc:async(name,args)=>{exports.calls.push([name,args]);return {data:[],error:null}},
 channel:()=>({owned:[],on(kind,filter,fn){const cb={table:filter.table,fn};callbacks.add(cb);this.owned.push(cb);return this},subscribe(){return this}}),removeChannel(ch){ch.owned.forEach(cb=>callbacks.delete(cb))},
});
