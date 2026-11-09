"use client";
import GameSessions from '@/components/game-sessions';
import GMCharacterCorrection from '@/components/gm-character-correction';

import CampaignCharacterControl from "@/components/campaign-character-control";
import CampaignJournal from "@/components/campaign-journal";
import Shell from "@/components/shell";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Character } from "@/lib/rules";
import Link from "next/link";
import { ArrowLeft, Send, Users } from "lucide-react";

type CampaignStatus = 'draft' | 'recruiting' | 'active' | 'paused' | 'completed';
const campaignStatuses: {value:CampaignStatus;label:string}[] = [
  {value:'draft',label:'Brouillon'},
  {value:'recruiting',label:'Recrutement'},
  {value:'active',label:'En cours'},
  {value:'paused',label:'En pause'},
  {value:'completed',label:'Terminée'},
];
const nextStatuses: Record<CampaignStatus,CampaignStatus[]> = {
  draft:['recruiting'], recruiting:['active'], active:['paused','completed'],
  paused:['active','completed'], completed:[]
};
type CampaignInvite = {id:string;email:string;created_at:string;accepted_at:string|null;declined_at:string|null;revoked_at:string|null;expires_at:string|null};

type Campaign = {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  status: CampaignStatus;
};

type Member = {
  user_id: string;
  character_id: string | null;
  allow_gm_outside_session: boolean;
};

type Message = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string;
};

type Companion = {
  user_id: string;
  username: string;
  shared_campaigns: number;
  last_played_at: string;
};

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deletingCampaign,setDeletingCampaign] = useState(false);
  const loadGeneration = useRef(0);
  const currentCampaignId = useRef(id);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [consentBusy,setConsentBusy] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [me, setMe] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState("");
  const [campaignInvites, setCampaignInvites] = useState<CampaignInvite[]>([]);
  const [statusBusy, setStatusBusy] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [inviteActionBusy, setInviteActionBusy] = useState<string|null>(null);

  async function load() {
    const generation = ++loadGeneration.current;
    const requestedCampaignId = id;
    const stillCurrent = () => generation === loadGeneration.current && currentCampaignId.current === requestedCampaignId;
    try {
      const s = supabase();
      const {
        data: { user },
      } = await s.auth.getUser();

      if (!stillCurrent()) return;
      setMe(user?.id || "");

      if (!user) {
        throw new Error("Connectez-vous pour accéder à la campagne.");
      }

      const [a, b, c, d] = await Promise.all([
        s.from("campaigns").select("*").eq("id", id).single(),
        s
          .from("campaign_members")
          .select("user_id,character_id,allow_gm_outside_session")
          .eq("campaign_id", id),
        s
          .from("campaign_messages")
          .select("*")
          .eq("campaign_id", id)
          .order("created_at", { ascending: true })
          .limit(100),
        s.from("characters").select("*"),
      ]);

      if (!stillCurrent()) return;
      for (const result of [a, b, c, d]) if (result.error) throw result.error;

      setCampaign(a.data);
      setMembers(b.data ?? []);
      setMessages(dedup(c.data ?? []));
      setCharacters(d.data ?? []);

      const ids = [
        ...new Set([
          a.data.owner_id,
          ...(b.data ?? []).map((x: Member) => x.user_id),
          ...(c.data ?? []).map((x: Message) => x.author_id),
        ]),
      ];

      const { data: profileRows, error: profileError } = await s
        .from("profiles")
        .select("id,username")
        .in("id", ids);

      if (!stillCurrent()) return;
      if (profileError) throw profileError;

      setProfiles(profileRows ?? []);

      if (a.data.owner_id === user.id) {
        const recent = await s.rpc("recent_companions");

        if (!stillCurrent()) return;
        if (recent.error) throw recent.error;

        setCompanions(recent.data ?? []);
        const {data:invitationRows,error:invitationError}=await s.from('campaign_invites')
          .select('id,email,created_at,accepted_at,declined_at,revoked_at,expires_at')
          .eq('campaign_id',id).order('created_at',{ascending:false});
        if (!stillCurrent()) return;
        if(invitationError)throw invitationError;
        setCampaignInvites(invitationRows??[]);
      }
    } catch (e) {
      if (stillCurrent()) setError(e instanceof Error ? e.message : "Impossible de charger la campagne.");
    }
  }

  async function changeGmConsent(allow: boolean) {
    setConsentBusy(true);
    setError("");
    try {
      const {error: saveError} = await supabase().from("campaign_members")
        .update({allow_gm_outside_session: allow})
        .eq("campaign_id",id).eq("user_id",me);
      if(saveError) throw saveError;
      setMembers(prev=>prev.map(m=>m.user_id===me?{...m,allow_gm_outside_session:allow}:m));
    } catch(e) {setError((e as Error).message)}
    finally {setConsentBusy(false)}
  }

  function username(userId: string) {
    return profiles.find((p) => p.id === userId)?.username || "Aventurier";
  }

  function dedup(m: Message[]) {
    return [...new Map(m.map((x) => [x.id, x])).values()];
  }

  useEffect(() => {
    currentCampaignId.current = id;
    loadGeneration.current++;
    setCampaign(null);
    setMembers([]);
    setCharacters([]);
    setMessages([]);
    setProfiles([]);
    setCompanions([]);
    setCampaignInvites([]);
    setMe("");
    setError("");
    void load();

    const s = supabase();

    const channel = s
      .channel(`campaign-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_messages",
          filter: `campaign_id=eq.${id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_members",
          filter: `campaign_id=eq.${id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {event: "*", schema: "public", table: "characters"},
        () => load(),
      )
      .subscribe();

    return () => {
      loadGeneration.current++;
      s.removeChannel(channel);
    };
  }, [id]);

  function beginCampaignEdit() {
    if (!campaign) return;
    setDraftTitle(campaign.title);
    setDraftDescription(campaign.description);
    setEditingCampaign(true);
  }
  async function saveCampaignDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign || campaign.owner_id !== me) return;
    const title = draftTitle.trim();
    if (!title || title.length > 100) { setError("Le titre doit contenir entre 1 et 100 caractères."); return; }
    setSavingCampaign(true); setError("");
    const {error:saveError} = await supabase().from('campaigns')
      .update({title, description:draftDescription.trim()})
      .eq('id', id).eq('owner_id', me);
    setSavingCampaign(false);
    if (saveError) setError(saveError.message);
    else {setEditingCampaign(false); await load();}
  }
  async function changeStatus(next:CampaignStatus){
    if(!campaign || campaign.owner_id!==me || next===campaign.status)return;
    if(!nextStatuses[campaign.status].includes(next)) {setError('Cette transition de statut est interdite.');return;}
    const notReady=members.filter(m=>m.user_id!==campaign.owner_id&&!m.character_id).length;
    const waiting=campaignInvites.filter(i=>!i.accepted_at&&!i.declined_at&&!i.revoked_at&&(!i.expires_at||new Date(i.expires_at)>new Date())).length;
    if(next==='active' && (notReady>0||waiting>0) && !window.confirm(
      `${notReady} joueur(s) sans personnage et ${waiting} invitation(s) en attente. Lancer quand même la campagne ?`))return;
    if(next==='completed'&&!window.confirm('Terminer définitivement cette campagne ? Elle restera consultable, mais ne pourra plus être rouverte.'))return;
    setStatusBusy(true);setError('');
    const {error}=await supabase().from('campaigns').update({status:next}).eq('id',id).eq('owner_id',me);
    setStatusBusy(false);
    if(error)setError(error.message);else await load();
  }
  async function revokeInvite(inviteId:string){
    setInviteActionBusy(inviteId);setError('');
    const {error}=await supabase().rpc('revoke_campaign_invite',{p_invite_id:inviteId});
    setInviteActionBusy(null);
    if(error)setError(error.message);else await load();
  }
  function inviteStatus(i:CampaignInvite){
    if(i.accepted_at)return 'Acceptée';
    if(i.revoked_at)return 'Annulée';
    if(i.declined_at)return 'Refusée';
    if(i.expires_at&&new Date(i.expires_at)<=new Date())return 'Expirée';
    return 'En attente';
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign || campaign.status === "draft") {setError("La messagerie est indisponible tant que la campagne est en brouillon.");return;}

    if (!body.trim()) return;

    const messageText = body.trim();
    setBody("");

    const { error } = await supabase().from("campaign_messages").insert({
      campaign_id: id,
      author_id: me,
      body: messageText,
    });

    if (error) {
      setError(error.message);
      setBody(messageText);
    } else {
      load();
    }
  }

  async function deleteCampaign() {
    if (!campaign || me !== campaign.owner_id || deletingCampaign) return;
    const typed = window.prompt(`Suppression DÉFINITIVE de « ${campaign.title} » : les invitations, messages, séances et sauvegardes de cette campagne seront perdus. Les personnages seront conservés.\n\nSaisis exactement le nom de la campagne pour confirmer :`);
    if (typed !== campaign.title) return;
    setDeletingCampaign(true);setError("");
    const {error:deleteError} = await supabase().rpc("delete_campaign_permanently",{p_campaign:id,p_confirm_title:typed});
    if (deleteError) {setError(deleteError.message);setDeletingCampaign(false);return;}
    router.push("/dashboard");
  }

  async function addInvite(e: React.FormEvent) {
    e.preventDefault();
    if(campaign?.status==='draft') {setError("Ouvrez le recrutement avant d’inviter des joueurs.");return;}
    setError("");
    setInviteNotice("");

    try {
      const {
        data: { session },
      } = await supabase().auth.getSession();

      if (!session) throw new Error("Reconnectez-vous.");

      const r = await fetch("/api/invitations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          campaignId: id,
          email: invite.trim(),
        }),
      });

      const result = await r.json();

      if (!r.ok) {
        throw new Error(result.error || "Erreur invitation");
      }

      setInvite("");
      setInviteNotice("Invitation créée et e-mail envoyé.");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function inviteCompanion(userId: string) {
    if(campaign?.status==='draft') {setError("Ouvrez le recrutement avant d’inviter des joueurs.");return;}
    setInvitingId(userId);
    setError("");
    setInviteNotice("");

    try {
      const {
        data: { session },
      } = await supabase().auth.getSession();

      if (!session) throw new Error("Reconnectez-vous.");

      const r = await fetch("/api/invitations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          campaignId: id,
          companionId: userId,
        }),
      });

      const result = await r.json();

      if (!r.ok) {
        throw new Error(result.error || "Erreur invitation");
      }

      setInviteNotice("Invitation créée et e-mail envoyé.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setInvitingId(null);
    }
  }

  async function assign(character_id: string) {
    const { error } = await supabase()
      .from("campaign_members")
      .update({
        character_id: character_id || null,
      })
      .eq("campaign_id", id)
      .eq("user_id", me);

    if (error) {
      setError(error.message);
    } else {
      load();
    }
  }

  return (
    <Shell>
      <Link href="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Mes campagnes
      </Link>

      {error && <div className="notice error">{error}</div>}

      {campaign && (
        <>
          <div className="page-head">
            <span className="eyebrow">CAMPAGNE PRIVÉE</span>
            <h1>{campaign.title}</h1>
            <p>{campaign.description || "Aucun synopsis pour le moment."}</p>
            {me===campaign.owner_id && !editingCampaign && <button type="button" className="btn outline" onClick={beginCampaignEdit}>Modifier le titre et le synopsis</button>}
            {me===campaign.owner_id && editingCampaign && <form className="panel" onSubmit={saveCampaignDetails} style={{marginTop:12}}>
              <h3>Préparer la campagne</h3>
              <label className="field-label" htmlFor="edit-campaign-title">Titre</label>
              <input id="edit-campaign-title" className="field" required maxLength={100} value={draftTitle} onChange={e=>setDraftTitle(e.target.value)}/>
              <label className="field-label" htmlFor="edit-campaign-description">Synopsis</label>
              <textarea id="edit-campaign-description" className="field" rows={7} value={draftDescription} onChange={e=>setDraftDescription(e.target.value)}/>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button className="btn" type="submit" disabled={savingCampaign}>{savingCampaign?'Enregistrement…':'Enregistrer'}</button>
                <button className="btn outline" type="button" disabled={savingCampaign} onClick={()=>setEditingCampaign(false)}>Annuler</button>
              </div>
            </form>}
            <p className="hint">Statut : <strong>{campaignStatuses.find(s=>s.value===campaign.status)?.label||'Brouillon'}</strong></p>
            {me===campaign.owner_id&&<div className="panel" style={{marginTop:16}}>
              <span className="field-label">ÉTAT DE LA CAMPAGNE</span>
              <p><strong>{campaignStatuses.find(s=>s.value===campaign.status)?.label}</strong></p>
              {campaign.status==='draft'&&<><p className="hint">Préparez votre aventure avant d'accueillir les joueurs.</p><button type="button" className="btn gold" disabled={statusBusy} onClick={()=>void changeStatus('recruiting')}>Ouvrir le recrutement</button></>}
              {campaign.status==='recruiting'&&<><p className="hint">Les joueurs peuvent rejoindre la compagnie. Le lancement de la campagne est définitif.</p><button type="button" className="btn gold" disabled={statusBusy} onClick={()=>void changeStatus('active')}>Lancer la campagne</button></>}
              {campaign.status==='active'&&<div className="campaign-status-actions"><button type="button" className="btn outline" disabled={statusBusy} onClick={()=>void changeStatus('paused')}>Mettre en pause</button><button type="button" className="btn outline" disabled={statusBusy} onClick={()=>void changeStatus('completed')}>Terminer la campagne</button></div>}
              {campaign.status==='paused'&&<div className="campaign-status-actions"><button type="button" className="btn gold" disabled={statusBusy} onClick={()=>void changeStatus('active')}>Reprendre la campagne</button><button type="button" className="btn outline" disabled={statusBusy} onClick={()=>void changeStatus('completed')}>Terminer la campagne</button></div>}
              {campaign.status==='completed'&&<p className="hint">Campagne terminée : ce statut est définitif.</p>}
              <div className="campaign-danger-zone"><p className="hint">Zone de danger · cette action ne peut pas être annulée.</p>
              <button type="button" className="btn outline" style={{marginTop:16}} disabled={deletingCampaign} onClick={()=>void deleteCampaign()}>{deletingCampaign?"Suppression…":"Supprimer définitivement cette campagne"}</button></div>
            </div>}
          </div>

          <div className="campaign-layout">
            <div className="panel" id="campaign-company" style={{scrollMarginTop:24}}>
              <h2>
                <Users size={20} /> La compagnie
              </h2>

              <p className="muted">{members.filter(m=>m.user_id!==campaign.owner_id).length} aventurier(s) inscrit(s)</p>

              <div className="campaign-member-list">{members.map((m) => (
                <div className="member campaign-member" key={m.user_id}>
                  <span>
                    <strong>{username(m.user_id)}</strong>
                    {m.user_id === campaign.owner_id ? " · ♛ MJ" : ""}
                    {m.user_id === me ? " · Vous" : ""}
                  </span>

                  {m.user_id === campaign.owner_id
                    ? <span className="campaign-member-role">Maître du jeu</span>
                    : m.character_id
                      ? <span className="campaign-member-character">{characters.find(c=>c.id===m.character_id)?.name||'Personnage associé'}</span>
                      : <span className="campaign-member-chip">Aucun personnage sélectionné</span>}

                </div>
              ))}</div>

              {members.some((m) => m.user_id === me) &&
                me !== campaign.owner_id && (
                  <>
                    <label className="field-label">
                      MON PERSONNAGE POUR CETTE CAMPAGNE
                    </label>

                    <select
                      className="field"
                      value={
                        members.find((m) => m.user_id === me)?.character_id ||
                        ""
                      }
                      onChange={(e) => assign(e.target.value)}
                    >
                      <option value="">Aucun personnage sélectionné</option>

                      {characters.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <p className="hint">
                      Tu peux rejoindre la discussion avant de choisir un
                      personnage.
                    </p>

                    <Link className="text-link" href="/characters/new">
                      Créer un nouveau personnage
                    </Link>
                  </>
                )}

              {me === campaign.owner_id && campaign.status === "draft" && <p className="hint">Invitations indisponibles en brouillon. Passez au statut Recrutement pour constituer votre compagnie.</p>}
              {me === campaign.owner_id && campaign.status !== "draft" && (
                <>
                  <div className="recent-companions" style={{marginBottom:20}}>
                    <h3>Suivi de la compagnie</h3>
                    <p className="hint">{campaignInvites.filter(i=>inviteStatus(i)==='En attente').length} invitation(s) en attente · {members.filter(m=>m.user_id!==campaign.owner_id).length} joueur(s) inscrit(s) · {members.filter(m=>m.user_id!==campaign.owner_id&&m.character_id).length} personnage(s) associé(s)</p>
                    {campaignInvites.length===0?<p className="hint">Aucune invitation envoyée.</p>:campaignInvites.map(i=><div className="companion-row" key={i.id}>
                      <span><strong>{i.email}</strong><small>{inviteStatus(i)}</small></span>
                      {inviteStatus(i)==='En attente'&&<button type="button" className="btn outline" disabled={inviteActionBusy!==null} onClick={()=>revokeInvite(i.id)}>{inviteActionBusy===i.id?'Patientez…':'Annuler'}</button>}
                    </div>)}
                  </div>
                  <form onSubmit={addInvite}>
                    <label className="field-label">INVITER PAR EMAIL</label>

                    <input
                      className="field"
                      type="email"
                      required
                      placeholder="joueur@exemple.fr"
                      value={invite}
                      onChange={(e) => setInvite(e.target.value)}
                    />

                    <button className="btn outline" style={{ marginTop: 12 }}>
                      Créer l'invitation
                    </button>

                    <p className="hint">Le joueur reçoit un e-mail et peut accepter ou refuser depuis son tableau de bord. Les invitations sont valables 30 jours.</p>
                  </form>

                  <div className="recent-companions">
                    <h3>Compagnons récents</h3>

                    <p className="hint">
                      Joueurs avec lesquels tu as déjà partagé une campagne.
                      Aucun ajout d'ami nécessaire.
                    </p>

                    {companions.filter(
                      (p) => !members.some((m) => m.user_id === p.user_id),
                    ).length === 0 ? (
                      <p className="hint">
                        Aucun ancien compagnon à inviter pour le moment.
                      </p>
                    ) : (
                      companions
                        .filter(
                          (p) => !members.some((m) => m.user_id === p.user_id),
                        )
                        .map((p) => (
                          <div className="companion-row" key={p.user_id}>
                            <span>
                              <strong>{p.username}</strong>
                              <small>
                                {p.shared_campaigns} campagne(s) en commun
                              </small>
                            </span>

                            <button
                              type="button"
                              className="btn outline"
                              disabled={invitingId !== null}
                              onClick={() => inviteCompanion(p.user_id)}
                            >
                              {invitingId === p.user_id ? "Envoi…" : "Inviter"}
                            </button>
                          </div>
                        ))
                    )}

                    {inviteNotice && (
                      <div className="notice" role="status">
                        {inviteNotice}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="panel chat">
              <h2>✉ Discussion de campagne</h2>

              {campaign.status === "draft" && <p className="hint">Messagerie indisponible tant que la campagne est en brouillon.</p>}
              {campaign.status !== "draft" && <div className="messages">
                {messages.length === 0 && (
                  <p className="muted">
                    Le silence règne encore dans la taverne…
                  </p>
                )}

                {messages.map((m) => (
                  <div
                    className={`message ${m.author_id === me ? "own" : ""}`}
                    key={m.id}
                  >
                    <small>
                      {username(m.author_id)}
                      {m.author_id === campaign.owner_id ? " · MJ" : ""}
                      {" · "}
                      {new Date(m.created_at).toLocaleString("fr-FR")}
                    </small>

                    <p>{m.body}</p>
                  </div>
                ))}
              </div>}

              {campaign.status !== "draft" && <form className="message-form" onSubmit={send}>
                <input
                  className="field"
                  maxLength={2000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Écrire à votre compagnie…"
                />

                <button className="btn gold" aria-label="Envoyer">
                  <Send size={17} />
                </button>
              </form>}
            </div>
          </div>

          {me!==campaign.owner_id && members.some(m=>m.user_id===me && m.character_id) && (
            <section className="panel" style={{marginTop:16}}>
              <h2>Autorisations de mon personnage</h2>
              <label style={{display:'flex',gap:10,alignItems:'center'}}>
                <input type="checkbox" disabled={consentBusy}
                  checked={members.find(m=>m.user_id===me)?.allow_gm_outside_session??false}
                  onChange={e=>void changeGmConsent(e.target.checked)}/>
                Autoriser le MJ à modifier mes ressources hors séance
              </label>
              <p className="hint">Désactivé par défaut et révocable à tout moment. Les modifications sont consignées dans le journal.</p>
            </section>
          )}
          <GameSessions campaignId={id} isGM={me === campaign.owner_id} campaignStatus={campaign.status} participants={members} gmId={campaign.owner_id} />
          <div className="campaign-sheets" id="campaign-sheets" style={{scrollMarginTop:24}}>
            <h2>Fiches collaboratives</h2>

            <p className="hint">
              Le joueur et le maître du jeu peuvent modifier les ressources de
              la campagne. Chaque action est historisée.
            </p>

            {members
              .filter((m) => m.character_id)
              .map((m) => {
                const character = characters.find(
                  (c) => c.id === m.character_id,
                );

                return character ? (
                  <CampaignCharacterControl
                    key={character.id}
                    campaignId={id}
                    character={character}
                    me={me}
                    canEdit={me === campaign.owner_id || m.user_id === me}
                  />
                ) : null;
              })}
          </div>

          {me===campaign.owner_id&&members.filter(m=>m.character_id).map(m=>{
            const ch=characters.find(c=>c.id===m.character_id);
            return ch?<GMCharacterCorrection key={ch.id} campaignId={id} character={ch}
              enabled={m.allow_gm_outside_session} onSaved={load}/>:null;
          })}
          <div id="campaign-journal" style={{scrollMarginTop:24}}><CampaignJournal
            campaignId={id}
            ownerId={campaign.owner_id}
            me={me}
            members={members}
            characters={characters}
            profiles={profiles}
          /></div>
        </>
      )}
    </Shell>
  );
}
