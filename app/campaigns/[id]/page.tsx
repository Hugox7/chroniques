'use client';
import CampaignDamageDefenses2014 from '@/components/campaign-damage-defenses-2014';
import CampaignDocuments from '@/components/campaign-documents';
import CampaignEconomy from '@/components/campaign-economy';
import CampaignChronicle from '@/components/campaign-chronicle';
import CampaignNavigation, { type CampaignView } from '@/components/campaign-navigation';
import CampaignCharacterSheetDrawer from '@/components/campaign-character-sheet-drawer';
import CampaignBottomSheet from '@/components/campaign-bottom-sheet';
import GameSessions from '@/components/game-sessions';
import GMCharacterCorrection from '@/components/gm-character-correction';

import CampaignJournal from "@/components/campaign-journal";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Character } from "@/lib/rules";
import Link from "next/link";
import { BookOpen, MessageCircle, Send, Users } from "lucide-react";

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
  const [managementOpen, setManagementOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{id: string; startedAt: string} | null>(null);
  const [mjView, setMjView] = useState<CampaignView>('session');
  const [economyVisited, setEconomyVisited] = useState(false);
  const [journalView, setJournalView] = useState<'events'|'chronicle'>('events');
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const discussionDialog = useRef<HTMLDialogElement>(null);
  const [sheetCharacterId, setSheetCharacterId] = useState<string|null>(null);
  const [discussionRead, setDiscussionRead] = useState({ key: '', through: '' });
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
          .order("created_at", { ascending: false })
          .limit(100),
        s.from("characters").select("*"),
      ]);

      if (!stillCurrent()) return;
      for (const result of [a, b, c, d]) if (result.error) throw result.error;

      const campaignMessages = (c.data ?? []).slice().reverse();

      setCampaign(a.data);
      setMembers(b.data ?? []);
      setMessages(dedup(campaignMessages));
      setCharacters(d.data ?? []);

      const ids = [
        ...new Set([
          a.data.owner_id,
          ...(b.data ?? []).map((x: Member) => x.user_id),
          ...campaignMessages.map((x: Message) => x.author_id),
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
    setMjView('session');
    setEconomyVisited(false);
    setJournalView('events');
    setDiscussionOpen(false);
    discussionDialog.current?.close();
    setSheetCharacterId(null);
    setActiveSession(null);
    setManagementOpen(false);
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
    if(next==='paused'&&!window.confirm('Mettre la campagne en pause ?'))return;
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
    if(campaign?.status!=='recruiting') {setError("Les invitations sont disponibles uniquement pendant le recrutement.");return;}
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
    if(campaign?.status!=='recruiting') {setError("Les invitations sont disponibles uniquement pendant le recrutement.");return;}
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

  const discussionKey = me && campaign ? `cd-discussion:${me}:${id}` : '';
  const lastMessageAt = messages.at(-1)?.created_at ?? '';
  useEffect(() => {
    if (!discussionKey) return;
    let through = '';
    try { through = localStorage.getItem(discussionKey) ?? ''; } catch {}
    setDiscussionRead({ key: discussionKey, through });
  }, [discussionKey]);
  useEffect(() => {
    if (!discussionKey || !lastMessageAt || !discussionOpen) return;
    setDiscussionRead({ key: discussionKey, through: lastMessageAt });
    try { localStorage.setItem(discussionKey, lastMessageAt); } catch {}
  }, [discussionKey, lastMessageAt, discussionOpen]);

  const unreadMessages = discussionRead.key === discussionKey
    ? messages.filter(message => message.author_id !== me && message.created_at > discussionRead.through).length : 0;
  function showMjView(view: CampaignView) {
    if (view === 'company' || view === 'shops') setEconomyVisited(true);
    if (view === mjView) return;
    setMjView(view);
    window.scrollTo(0, 0);
  }
  function renderDiscussion() {
    if (!campaign) return null;
    return (
            <div className="panel chat">
              <h2>{me === campaign.owner_id ? 'Discussion' : '✉ Discussion de campagne'}</h2>

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
    );
  }

  const myCharacter = characters.find(character => character.owner_id === me && members.some(member => member.user_id === me && member.character_id === character.id));
  const sheetCharacter = characters.find(character => character.id === sheetCharacterId && members.some(member => member.character_id === character.id)
    && (me === campaign?.owner_id || character.id === myCharacter?.id)) ?? null;

  return (
    <>
      {error && <div className="notice error">{error}</div>}

      {campaign && (
        <>
          <div className="page-head mj-page-head">
            <span className="eyebrow">CAMPAGNE PRIVÉE</span>
            <div className="campaign-heading mj-heading">
              <div className="campaign-title-line">
                <h1>{campaign.title}</h1>
                <span className="campaign-status-chip" data-status={campaign.status}>
                  {campaignStatuses.find(status => status.value === campaign.status)?.label || 'Brouillon'}
                </span>
              </div>
              {me === campaign.owner_id && <div className="campaign-management" onKeyDown={event => {
                if (event.key === 'Escape' && managementOpen) {
                  setManagementOpen(false);
                  event.currentTarget.querySelector<HTMLButtonElement>('.campaign-management-toggle')?.focus();
                }
              }}>
                <button className="btn outline campaign-management-toggle" type="button"
                  aria-expanded={managementOpen} aria-controls="campaign-management-actions"
                  aria-label="Actions de campagne" onClick={() => setManagementOpen(open => !open)}>⋯</button>
                <div id="campaign-management-actions" className="campaign-management-panel" data-open={managementOpen}>
                  {!editingCampaign && <button type="button" className="btn outline" onClick={() => {
                    setManagementOpen(false);
                    beginCampaignEdit();
                  }}>Modifier le titre et le synopsis</button>}
                  {campaign.status === 'draft' && <button type="button" className="btn gold" disabled={statusBusy}
                    onClick={() => void changeStatus('recruiting')}>Ouvrir le recrutement</button>}
                  {campaign.status === 'recruiting' && <button type="button" className="btn gold" disabled={statusBusy}
                    onClick={() => void changeStatus('active')}>Lancer la campagne</button>}
                  {campaign.status === 'active' && <button type="button" className="btn outline" disabled={statusBusy}
                    onClick={() => void changeStatus('paused')}>Mettre en pause</button>}
                  {campaign.status === 'paused' && <button type="button" className="btn gold" disabled={statusBusy}
                    onClick={() => void changeStatus('active')}>Reprendre la campagne</button>}
                  {(campaign.status === 'active' || campaign.status === 'paused') && <button type="button" className="btn outline"
                    disabled={statusBusy} onClick={() => void changeStatus('completed')}>Terminer la campagne</button>}
                  <button type="button" className="btn outline campaign-delete" disabled={deletingCampaign}
                    onClick={() => void deleteCampaign()}>{deletingCampaign ? 'Suppression…' : 'Supprimer la campagne'}</button>
                </div>
              </div>}
            </div>
            <p className="campaign-synopsis">{campaign.description || "Aucun synopsis pour le moment."}</p>
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

          </div>

          <div className="campaign-quick-actions">
            {me !== campaign.owner_id && <button className="btn gold campaign-my-sheet" type="button"
              onClick={() => myCharacter ? setSheetCharacterId(myCharacter.id) : showMjView('company')}>
              <BookOpen size={18} aria-hidden="true"/> {myCharacter ? 'Ma fiche' : 'Choisir mon personnage'}
            </button>}
            <button className="btn outline campaign-discussion-button" type="button" aria-haspopup="dialog"
              onClick={() => { discussionDialog.current?.showModal(); setDiscussionOpen(true); }}>
              <MessageCircle size={18} aria-hidden="true"/> Discussion
              {unreadMessages > 0 && <span className="mj-unread" aria-label={`${unreadMessages} messages non lus`}>{unreadMessages}</span>}
            </button>
          </div>
          <CampaignNavigation view={mjView} onChange={showMjView}/>
          {mjView === 'journal' && <div className="campaign-section-heading" id="campaign-view-journal">
            <h2>Journal de la campagne</h2>
            <div className="campaign-subnav" aria-label="Contenu du journal">
              <button className="btn outline" type="button" aria-pressed={journalView === 'events'} onClick={() => setJournalView('events')}>Historique des actions</button>
              <button className="btn outline" type="button" aria-pressed={journalView === 'chronicle'} onClick={() => setJournalView('chronicle')}>Bilans de séance</button>
            </div>
          </div>}
          <div className="mj-workspace" data-view={mjView}>
            <div className="mj-session-view" id="campaign-view-session" hidden={mjView !== 'session'}>
              <GameSessions campaignId={id} isGM={me === campaign.owner_id} me={me} campaignStatus={campaign.status} participants={members}
                gmId={campaign.owner_id} onActiveSessionChange={setActiveSession} characters={characters.filter(character => members.some(member => member.character_id === character.id))}/>
            </div>
            <div className="mj-journal-view" hidden={mjView !== 'session' && !(mjView === 'journal' && journalView === 'events')}>
              <CampaignJournal key={id} campaignId={id} ownerId={campaign.owner_id} me={me}
                members={members} characters={characters} profiles={profiles} compact
                recentLimit={mjView === 'journal' && journalView === 'events' ? undefined : 6} activeSession={activeSession}
                onViewAll={() => { setJournalView('events'); showMjView('journal'); }}/>
            </div>
          </div>
          {mjView === 'journal' && journalView === 'chronicle' && <div className="campaign-journal-content">
            <CampaignChronicle key={'chronicle-' + id} campaignId={id} title={campaign.title} isGM={me === campaign.owner_id}/>
          </div>}
          <div className="campaign-company-area" data-view={mjView}>
          <div className="campaign-company-view" id="campaign-view-company" hidden={mjView !== 'company'}>
          <details className="mj-disclosure mj-mobile-synopsis">
            <summary>Synopsis de la campagne</summary>
            <p>{campaign.description || "Aucun synopsis pour le moment."}</p>
          </details>
          <div>
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
                  {m.character_id && (me === campaign.owner_id || m.user_id === me) && characters.some(c => c.id === m.character_id) &&
                    <button type="button" className="btn outline" onClick={() => setSheetCharacterId(m.character_id)}>Fiche complète de {characters.find(c => c.id === m.character_id)?.name}</button>}
                  {me === campaign.owner_id && (() => {
                    const character = characters.find(c => c.id === m.character_id);
                    return character && <details className="mj-disclosure campaign-member-tools">
                      <summary>Outils MJ · {character.name}</summary>
                      <CampaignDamageDefenses2014 campaignId={id} character={character}/>
                      <GMCharacterCorrection campaignId={id} character={character} enabled={m.allow_gm_outside_session} onSaved={load}/>
                    </details>;
                  })()}
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

                      {characters.filter(c => c.owner_id === me).map((c) => (
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
              {me === campaign.owner_id && campaign.status === "recruiting" && (
                <details className="mj-disclosure campaign-invitations">
                  <summary>Gérer les invitations</summary>
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
                </details>
              )}
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
          </div>
          <div id="campaign-view-shops" className="campaign-economy-space" hidden={mjView !== 'company' && mjView !== 'shops'}>
            {economyVisited && <CampaignEconomy key={id} campaignId={id} me={me} isGM={me === campaign.owner_id} campaignStatus={campaign.status}
              mode={mjView === 'shops' ? 'shops' : 'vault'}
              actorNames={Object.fromEntries([[campaign.owner_id, username(campaign.owner_id)], ...members.map(member => [member.user_id, username(member.user_id)])])}/>}
          </div>
          </div>
          <CampaignDocuments key={'documents-' + id} campaignId={id} isGM={me === campaign.owner_id} profiles={profiles} visible={mjView === 'documents'}/>
          <CampaignBottomSheet side dialogRef={discussionDialog} title="Discussion de campagne" onClose={() => setDiscussionOpen(false)}>
            {renderDiscussion()}
          </CampaignBottomSheet>
          <CampaignCharacterSheetDrawer campaignId={id} character={sheetCharacter} onClose={() => setSheetCharacterId(null)}/>
        </>
      )}
    </>
  );
}
