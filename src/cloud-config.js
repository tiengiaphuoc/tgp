// Admin, public promotions and shared articles are connected. Customer sync is enabled after owner SQL setup and reported SMTP configuration; real email delivery still needs an owner test.
// Never put service_role, sb_secret, passwords or access tokens here.
export const cloudConfig=Object.freeze({
 enabled:true,
 adminEnabled:true,
 promotionsEnabled:true,
 fullSyncEnabled:true,
 articlesEnabled:true,
 url:'https://dfiqlzzxefkkqirnrgty.supabase.co',
 publishableKey:'sb_publishable_9DQvr2lI_QpZW82YdL58fg_T2D3A3xl'
});
