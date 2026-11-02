// Enable only after configuring Email OTP/SMTP and running all SQL setup files (including microscopy.sql).
// Public client configuration only. Never put service_role or sb_secret keys here.
export const cloudConfig=Object.freeze({enabled:false,url:'',publishableKey:''});
