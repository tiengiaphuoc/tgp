// Read-only project preflight: no signups, email sends, RPC writes or customer records.
import {cloudConfig} from '../src/cloud-config.js';
import {validateCloudConfig} from '../src/cloud-client.js';
validateCloudConfig({...cloudConfig,enabled:true});
const report={project:new URL(cloudConfig.url).hostname,appEnabled:cloudConfig.enabled,adminEnabled:cloudConfig.adminEnabled===true,promotionsEnabled:cloudConfig.promotionsEnabled===true,articlesEnabled:cloudConfig.articlesEnabled===true,fullSyncEnabled:cloudConfig.fullSyncEnabled===true,auth:null,tables:[]};
async function get(path){try{const response=await fetch(cloudConfig.url+path,{headers:{apikey:cloudConfig.publishableKey},signal:AbortSignal.timeout(15000),cache:'no-store'});let data;try{data=await response.json();}catch{}return {status:response.status,data};}catch{return {status:0};}}
const auth=await get('/auth/v1/settings');report.auth={http:auth.status,emailEnabled:auth.data?.external?.email??null,confirmEmail:auth.data?.mailer_autoconfirm===false,signupDisabled:auth.data?.disable_signup??null};
for(const table of ['moc_admins','customer_profiles','customer_notes','product_codes','product_entitlements','product_redemptions','product_code_attempts','microscopy_policy','microscopy_requests','microscopy_images','microscopy_credit_audit','promotions','customer_backups','customer_sync_consents','article_publications']){
 const r=await get('/rest/v1/'+table+'?select=*&limit=0');report.tables.push({table,http:r.status,result:r.status===200?'reachable':r.data?.code==='42501'?'private_access_denied':r.data?.code==='PGRST205'?'missing_table':r.status===401?'key_or_permission_error':r.status===0?'network_error':'check_required',code:r.data?.code||null});
}
report.missingTables=report.tables.filter(r=>r.result==='missing_table').map(r=>r.table);
const advanced=new Set(['customer_backups','customer_sync_consents','article_publications']);
report.schemaDetected=report.tables.filter(r=>!advanced.has(r.table)).every(r=>['reachable','private_access_denied'].includes(r.result));
report.fullSyncSchemaDetected=report.tables.filter(r=>advanced.has(r.table)).every(r=>['reachable','private_access_denied'].includes(r.result));
console.log(JSON.stringify(report,null,2));
console.log('::notice title=Supabase preflight::'+JSON.stringify(report));
