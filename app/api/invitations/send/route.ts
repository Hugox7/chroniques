import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { campaignInvitationEmail } from '@/lib/email/templates';

export const runtime = 'nodejs';
const json = (body:object,status=200) => NextResponse.json(body,{status});
export async function POST(request:NextRequest) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resend=process.env.RESEND_API_KEY;
  const from=process.env.EMAIL_FROM;
  if(!url||!anon||!service||!resend||!from) return json({error:'Configuration e-mail incomplète sur le serveur.'},503);
  const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) return json({error:'Authentification requise.'},401);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await userClient.auth.getUser(token);
  if(authError||!user) return json({error:'Session invalide.'},401);
  let payload:{campaignId?:string;email?:string;companionId?:string};
  try {payload=await request.json()} catch {return json({error:'Requête invalide.'},400)}
  const campaignId=payload.campaignId;
  if(!campaignId||!/^[0-9a-f-]{36}$/i.test(campaignId))return json({error:'Campagne invalide.'},400);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:campaign,error:campaignError}=await admin.from('campaigns').select('id,title,owner_id').eq('id',campaignId).single();
  if(campaignError||!campaign||campaign.owner_id!==user.id)return json({error:'Accès refusé.'},403);
  const {data:profile}=await admin.from('profiles').select('username').eq('id',user.id).maybeSingle();
  let recipient='';
  if(payload.companionId) {
    if(!/^[0-9a-f-]{36}$/i.test(payload.companionId))return json({error:'Joueur invalide.'},400);
    // RPC en contexte utilisateur : vérifie côté base que les deux joueurs ont partagé une campagne.
    const {data:inviteId,error:inviteError}=await userClient.rpc('invite_recent_companion',{p_campaign_id:campaignId,p_user_id:payload.companionId});
    if(inviteError)return json({error:inviteError.message},400);
    const {data:invite}=await admin.from('campaign_invites').select('email').eq('id',inviteId).eq('campaign_id',campaignId).single();
    if(!invite)return json({error:'Invitation introuvable.'},500);
    recipient=invite.email;
  } else {
    recipient=(payload.email||'').trim().toLowerCase();
    if(recipient.length>320||!/^\S+@\S+\.\S+$/.test(recipient))return json({error:'Adresse e-mail invalide.'},400);
    const {error:inviteError}=await userClient.rpc('create_campaign_invite',{p_campaign_id:campaignId,p_email:recipient});
    if(inviteError)return json({error:inviteError.message},400);
  }
  const origin=process.env.NEXT_PUBLIC_APP_URL||request.nextUrl.origin;
  const email=campaignInvitationEmail({inviter:profile?.username||'Un maître du jeu',campaign:campaign.title,url:`${origin.replace(/\/$/,'')}/dashboard`});
  try {
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[recipient],subject:email.subject,html:email.html})});
    if(!response.ok) {console.error('Resend error',response.status,await response.text());return json({created:true,sent:false,error:'Invitation créée, mais e-mail non envoyé. Vérifiez Resend.'},502)}
    return json({created:true,sent:true});
  } catch(e) {console.error('Resend unavailable',e);return json({created:true,sent:false,error:'Invitation créée, mais service e-mail indisponible.'},502)}
}
