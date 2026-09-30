export const clone = value => structuredClone(value);
export function cleanServer(value) {
 const u=new URL(value);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Use an HTTPS backend URL.');
 if(u.username||u.password||u.search||u.hash)throw new Error('Backend URL must not contain credentials or query parameters.');
 return u.href.replace(/\/$/,'');
}
export function normalizeAddons(rows) {
 if(!Array.isArray(rows))throw new Error('Invalid addon response.');
 return rows.map((r,i)=>({url:r.url||r.base_url||'',name:r.name||r.display_name||'',enabled:r.enabled!==false&&r.enabled!=='false',sort_order:Number(r.sort_order??r.position??i)})).sort((a,b)=>a.sort_order-b.sort_order).filter(r=>r.url);
}
export function validateAddon(addon) {
 const u=new URL(addon.url);if(!['https:','http:'].includes(u.protocol))throw new Error('Addon URL must use HTTP or HTTPS.');
 return {url:u.href.replace(/\/$/,''),name:String(addon.name||'').trim(),enabled:addon.enabled!==false};
}
export function validatePin(pin){if(!/^\d{4}$/.test(pin))throw new Error('Enter exactly 4 digits.');return pin;}
export function settingsBlob(raw) {
 const row=Array.isArray(raw)?raw[0]:raw;
 if(row==null)return {version:1,features:{}};
 const candidate=row.settings_json??row.settingsJson??row.settings??row.blob??row;
 const blob=typeof candidate==='string'?JSON.parse(candidate):candidate;
 if(!blob||typeof blob!=='object'||Array.isArray(blob)||!blob.features||typeof blob.features!=='object')throw new Error('Unsupported settings response. No settings were changed.');
 return blob;
}
export function makeCopyPlan(source,destination,{addons,settings,mode='merge'}) {
 if(source.accountId===destination.accountId&&source.profileId===destination.profileId)throw new Error('Choose a different destination profile or account.');
 if(!addons&&!settings)throw new Error('Select addons or settings to copy.');
 if(addons&&destination.inherited)throw new Error('Destination inherits master addons. Edit its primary profile or turn inheritance off first.');
 const result={};
 if(addons){const next=mode==='replace'?[]:clone(destination.addons);for(const addon of source.addons){const index=next.findIndex(a=>a.url.replace(/\/$/,'')===addon.url.replace(/\/$/,''));if(index<0)next.push(clone(addon));else next[index]=clone(addon);}result.addons=next.map((a,i)=>({...a,sort_order:i}));}
 if(settings){if(!source.settings||!destination.settings)throw new Error('Load settings for both profiles first.');result.settings={...clone(destination.settings),features:{...clone(destination.settings.features),...clone(source.settings.features)}};}
 return result;
}
export class NuvioClient {
 constructor(server,key,fetcher=globalThis.fetch){this.server=cleanServer(server);this.key=key;this.fetcher=fetcher;this.session=null;this.refreshing=null;}
 async request(path,body,{auth=true,method='POST',refresh=true}={}){
 if(auth&&!this.session)throw new Error('Connect this account first.');
 if(auth&&refresh&&this.session.expiresAt<Date.now()+30000)await this.refresh();
 let response;try{response=await this.fetcher(this.server+path,{method,headers:{'Content-Type':'application/json',apikey:this.key,Authorization:`Bearer ${auth?this.session.accessToken:this.key}`},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000),credentials:'omit',referrerPolicy:'no-referrer'});}catch(e){throw new Error(e.name==='TimeoutError'?'Server request timed out. Refresh before retrying a save.':'Cannot reach Nuvio. Check the backend URL, connection, and server browser-access (CORS) settings.');}
 const text=await response.text();let result;try{result=text?JSON.parse(text):null;}catch{throw new Error('Server returned an invalid response.');}
 if(!response.ok){const err=new Error(result?.message||result?.error_description||result?.error||`Nuvio request failed (${response.status}).`);err.status=response.status;throw err;}return result;
 }
 rpc(name,body,auth=true){return this.request('/rest/v1/rpc/'+name,body,{auth});}
 setSession(raw){const accessToken=raw.access_token||raw.accessToken,refreshToken=raw.refresh_token||raw.refreshToken;if(!accessToken||!refreshToken)throw new Error('Login response did not include a session.');this.session={accessToken,refreshToken,expiresAt:Date.now()+Number(raw.expires_in||raw.expiresIn||3600)*1000};}
 async login(email,password){const r=await this.request('/auth/v1/token?grant_type=password',{email,password},{auth:false});this.setSession(r);return r;}
 async refresh(){if(this.refreshing)return this.refreshing;this.refreshing=(async()=>{const r=await this.request('/auth/v1/token?grant_type=refresh_token',{refresh_token:this.session.refreshToken},{auth:false});this.setSession(r);})().finally(()=>{this.refreshing=null;});return this.refreshing;}
 async startLink(){this.nonce=crypto.randomUUID();const redirect=this.server==='https://api.nuvio.tv'?'https://nuvio.tv/tv-login':this.server+'/tv-login';const rows=await this.rpc('start_tv_login_session',{p_device_nonce:this.nonce,p_redirect_base_url:redirect},false);const r=Array.isArray(rows)?rows[0]:rows;if(!r?.code)throw new Error('Server did not return a link code.');return {...r,redirect};}
 async pollLink(code){const rows=await this.rpc('poll_tv_login_session',{p_code:code,p_device_nonce:this.nonce},false);return Array.isArray(rows)?rows[0]:rows;}
 async exchangeLink(code){const r=await this.request('/functions/v1/tv-logins-exchange',{code,device_nonce:this.nonce},{auth:false});this.setSession(r);return r;}
 async profiles(){const r=await this.rpc('sync_pull_profiles',{});if(!Array.isArray(r))throw new Error('Invalid profiles response.');return r;}
 async saveProfiles(profiles){return this.rpc('sync_push_profiles',{p_client_max_profiles:profiles.length,p_profiles:profiles});}
 async addons(id){return normalizeAddons(await this.rpc('sync_pull_addons',{p_profile_id:Number(id)}));}
 async saveAddons(id,addons){return this.rpc('sync_push_addons',{p_profile_id:Number(id),p_addons:addons.map((a,i)=>({...validateAddon(a),sort_order:i})),p_origin_client_id:'nuvio-account-manager'});}
 async settings(id){return settingsBlob(await this.rpc('sync_pull_profile_settings_blob',{p_profile_id:Number(id),p_platform:'tv'}));}
 async saveSettings(id,blob){return this.rpc('sync_push_profile_settings_blob',{p_profile_id:Number(id),p_settings_json:blob,p_platform:'tv'});}
 async locks(){return this.rpc('sync_pull_profile_locks',{});}
 async pin(id,pin,currentPin){return this.rpc('set_profile_pin',{p_profile_id:Number(id),p_pin:validatePin(pin),...(currentPin?{p_current_pin:validatePin(currentPin)}:{})});}
 async clearPin(id,currentPin){return this.rpc('clear_profile_pin',{p_profile_id:Number(id),p_current_pin:validatePin(currentPin)});}
 async disconnect(){try{if(this.session)await this.request('/auth/v1/logout',{});}finally{this.session=null;}}
}
export async function discover(server,fetcher=globalThis.fetch){const base=cleanServer(server);const r=await fetcher(base+'/.well-known/nuvio',{signal:AbortSignal.timeout(12000),credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw new Error('Discovery unavailable. Enter the public client key in Advanced connection.');const d=await r.json();if(d.service!=='nuvio'||!d.publishable_key)throw new Error('This server did not return Nuvio connection settings.');const backend=cleanServer(d.backend_url||base);if(new URL(base).origin!==new URL(backend).origin)throw new Error('Discovery points to a different server. Enter that backend URL explicitly.');return {server:backend,key:d.publishable_key,emailAuth:d.capabilities?.email_password_auth===true};}
