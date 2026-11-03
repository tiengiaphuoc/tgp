// Admin, public promotions and shared articles are connected. Customer sync remains off until email delivery is configured.
// Never put service_role, sb_secret, passwords or access tokens here.
export const cloudConfig=Object.freeze({
 enabled:false,
 adminEnabled:true,
 promotionsEnabled:true,
 fullSyncEnabled:false,
 articlesEnabled:true,
 url:'https://dfiqlzzxefkkqirnrgty.supabase.co',
 publishableKey:'sb_publishable_9DQvr2lI_QpZW82YdL58fg_T2D3A3xl'
});
