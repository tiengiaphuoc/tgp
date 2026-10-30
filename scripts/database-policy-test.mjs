// Real PostgreSQL policy checks using a temporary PGlite engine; no production data.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.MOC_PGLITE_PATH||'@electric-sql/pglite');
const db=new PGlite();
const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333';
try{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
 await db.exec(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users(id) values ($1),($2),($3)',[first,second,admin]);
 await db.query("insert into public.customer_profiles(id,name,consented_at) values ($1,'First',now()),($2,'Second',now())",[first,second]);
 await db.query('insert into public.moc_admins(user_id) values($1)',[admin]);
 const asUser=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
 await asUser(first);
 assert.deepEqual((await db.query('select name from public.customer_profiles')).rows,[{name:'First'}]);
 assert.equal((await db.query("update public.customer_profiles set name='Hacked' where id=$1 returning id",[second])).rows.length,0);
 await assert.rejects(db.query("insert into public.customer_profiles(id,name,consented_at) values ($1,'Impersonation',now())",[admin]),e=>e.code==='42501');
 await assert.rejects(db.query('insert into public.moc_admins(user_id) values($1)',[first]),e=>e.code==='42501');
 await assert.rejects(db.query('select * from public.moc_admins'),e=>e.code==='42501');
 assert.equal((await db.query('select public.is_moc_admin() as allowed')).rows[0].allowed,false);
 assert.equal((await db.query('select * from public.customer_notes')).rows.length,0);
 await assert.rejects(db.query("insert into public.customer_notes(customer_id,note) values($1,'Forbidden')",[first]),e=>e.code==='42501');
 await db.query("update public.customer_profiles set name='Own edited' where id=$1",[first]);
 await asUser(admin);assert.equal((await db.query('select public.is_moc_admin() as allowed')).rows[0].allowed,true);assert.equal((await db.query('select * from public.customer_profiles')).rows.length,2);
 await db.query("insert into public.customer_notes(customer_id,note) values($1,'Admin-only note')",[first]);
 await asUser(first);assert.equal((await db.query('select * from public.customer_notes')).rows.length,0);await db.query('delete from public.customer_profiles where id=$1',[first]);
 await asUser(admin);assert.equal((await db.query('select * from public.customer_notes')).rows.length,0,'withdrawal cascades staff notes');assert.equal((await db.query('select * from public.customer_profiles')).rows.length,1);
 await db.exec('reset role; set role anon');await assert.rejects(db.query('select * from public.customer_profiles'),e=>e.code==='42501');
 console.log('DATABASE_POLICY_PASS: actual PostgreSQL RLS limits customers to own profiles; blocks impersonation/admin self-enrollment and customer notes access; only approved admins read all; withdrawal cascades notes; unauthenticated reads denied. Auth schema is a local fixture, not Supabase Auth.');
}finally{await db.close();}
