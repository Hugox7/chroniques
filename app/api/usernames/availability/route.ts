import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:NextRequest){
  let body:unknown;
  try {body=await request.json()} catch {return NextResponse.json({error:'Requête invalide.'},{status:400})}
  const username=typeof body==='object'&&body!==null&&'username' in body?(body as {username:unknown}).username:null;
  if(typeof username!=='string'||!/^[A-Za-z0-9_]{3,24}$/.test(username))return NextResponse.json({error:'Pseudonyme invalide.'},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!service)return NextResponse.json({error:'Configuration serveur incomplète.'},{status:503});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.from('profiles').select('id').ilike('username',username).limit(1);
  if(error){console.error('Username availability check failed:',error.message);return NextResponse.json({error:'Vérification indisponible.'},{status:500})}
  return NextResponse.json({available:!data?.length},{headers:{'Cache-Control':'no-store'}});
}
