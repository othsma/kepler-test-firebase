import{y as m,z as y,C as T,A as R,E as X,F as ve,B as F,D as Ae,G as Ee,H as _e,I as j,J as Ne,K as v,r as A,d as E,L as Ce,M as Oe}from"./vendor-firebase-_xt56fuP.js";import{n as _}from"./index-Bl_N4zjX.js";const Z="@firebase/installations",K="0.6.9";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ee=1e4,te=`w:${K}`,ne="FIS_v2",Pe="https://firebaseinstallations.googleapis.com/v1",De=60*60*1e3,Me="installations",Re="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fe={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},g=new X(Me,Re,Fe);function oe(e){return e instanceof ve&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ie({projectId:e}){return`${Pe}/projects/${e}/installations`}function re(e){return{token:e.token,requestStatus:2,expiresIn:Ke(e.expiresIn),creationTime:Date.now()}}async function se(e,t){const o=(await t.json()).error;return g.create("request-failed",{requestName:e,serverCode:o.code,serverMessage:o.message,serverStatus:o.status})}function ae({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function je(e,{refreshToken:t}){const n=ae(e);return n.append("Authorization",qe(t)),n}async function ce(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Ke(e){return Number(e.replace("s","000"))}function qe(e){return`${ne} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Le({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const o=ie(e),i=ae(e),r=t.getImmediate({optional:!0});if(r){const u=await r.getHeartbeatsHeader();u&&i.append("x-firebase-client",u)}const s={fid:n,authVersion:ne,appId:e.appId,sdkVersion:te},c={method:"POST",headers:i,body:JSON.stringify(s)},f=await ce(()=>fetch(o,c));if(f.ok){const u=await f.json();return{fid:u.fid||n,registrationStatus:2,refreshToken:u.refreshToken,authToken:re(u.authToken)}}else throw await se("Create Installation",f)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ue(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $e(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xe=/^[cdef][\w-]{21}$/,M="";function Ve(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Be(e);return xe.test(n)?n:M}catch{return M}}function Be(e){return $e(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const de=new Map;function fe(e,t){const n=I(e);pe(n,t),He(n,t)}function pe(e,t){const n=de.get(e);if(n)for(const o of n)o(t)}function He(e,t){const n=We();n&&n.postMessage({key:e,fid:t}),Ue()}let l=null;function We(){return!l&&"BroadcastChannel"in self&&(l=new BroadcastChannel("[Firebase] FID Change"),l.onmessage=e=>{pe(e.data.key,e.data.fid)}),l}function Ue(){de.size===0&&l&&(l.close(),l=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ge="firebase-installations-database",ze=1,h="firebase-installations-store";let N=null;function q(){return N||(N=F(Ge,ze,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(h)}}})),N}async function k(e,t){const n=I(e),i=(await q()).transaction(h,"readwrite"),r=i.objectStore(h),s=await r.get(n);return await r.put(t,n),await i.done,(!s||s.fid!==t.fid)&&fe(e,t.fid),t}async function le(e){const t=I(e),o=(await q()).transaction(h,"readwrite");await o.objectStore(h).delete(t),await o.done}async function S(e,t){const n=I(e),i=(await q()).transaction(h,"readwrite"),r=i.objectStore(h),s=await r.get(n),c=t(s);return c===void 0?await r.delete(n):await r.put(c,n),await i.done,c&&(!s||s.fid!==c.fid)&&fe(e,c.fid),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function L(e){let t;const n=await S(e.appConfig,o=>{const i=Je(o),r=Ye(e,i);return t=r.registrationPromise,r.installationEntry});return n.fid===M?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Je(e){const t=e||{fid:Ve(),registrationStatus:0};return ge(t)}function Ye(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(g.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},o=Qe(e,n);return{installationEntry:n,registrationPromise:o}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Xe(e)}:{installationEntry:t}}async function Qe(e,t){try{const n=await Le(e,t);return k(e.appConfig,n)}catch(n){throw oe(n)&&n.customData.serverCode===409?await le(e.appConfig):await k(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Xe(e){let t=await H(e.appConfig);for(;t.registrationStatus===1;)await ue(100),t=await H(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:o}=await L(e);return o||n}return t}function H(e){return S(e,t=>{if(!t)throw g.create("installation-not-found");return ge(t)})}function ge(e){return Ze(e)?{fid:e.fid,registrationStatus:0}:e}function Ze(e){return e.registrationStatus===1&&e.registrationTime+ee<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function et({appConfig:e,heartbeatServiceProvider:t},n){const o=tt(e,n),i=je(e,n),r=t.getImmediate({optional:!0});if(r){const u=await r.getHeartbeatsHeader();u&&i.append("x-firebase-client",u)}const s={installation:{sdkVersion:te,appId:e.appId}},c={method:"POST",headers:i,body:JSON.stringify(s)},f=await ce(()=>fetch(o,c));if(f.ok){const u=await f.json();return re(u)}else throw await se("Generate Auth Token",f)}function tt(e,{fid:t}){return`${ie(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $(e,t=!1){let n;const o=await S(e.appConfig,r=>{if(!he(r))throw g.create("not-registered");const s=r.authToken;if(!t&&it(s))return r;if(s.requestStatus===1)return n=nt(e,t),r;{if(!navigator.onLine)throw g.create("app-offline");const c=st(r);return n=ot(e,c),c}});return n?await n:o.authToken}async function nt(e,t){let n=await W(e.appConfig);for(;n.authToken.requestStatus===1;)await ue(100),n=await W(e.appConfig);const o=n.authToken;return o.requestStatus===0?$(e,t):o}function W(e){return S(e,t=>{if(!he(t))throw g.create("not-registered");const n=t.authToken;return at(n)?Object.assign(Object.assign({},t),{authToken:{requestStatus:0}}):t})}async function ot(e,t){try{const n=await et(e,t),o=Object.assign(Object.assign({},t),{authToken:n});return await k(e.appConfig,o),n}catch(n){if(oe(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await le(e.appConfig);else{const o=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await k(e.appConfig,o)}throw n}}function he(e){return e!==void 0&&e.registrationStatus===2}function it(e){return e.requestStatus===2&&!rt(e)}function rt(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+De}function st(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}function at(e){return e.requestStatus===1&&e.requestTime+ee<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ct(e){const t=e,{installationEntry:n,registrationPromise:o}=await L(t);return o?o.catch(console.error):$(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ut(e,t=!1){const n=e;return await dt(n),(await $(n,t)).token}async function dt(e){const{registrationPromise:t}=await L(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ft(e){if(!e||!e.options)throw C("App Configuration");if(!e.name)throw C("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw C(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function C(e){return g.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const we="installations",pt="installations-internal",lt=e=>{const t=e.getProvider("app").getImmediate(),n=ft(t),o=R(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:o,_delete:()=>Promise.resolve()}},gt=e=>{const t=e.getProvider("app").getImmediate(),n=R(t,we).getImmediate();return{getId:()=>ct(n),getToken:i=>ut(n,i)}};function ht(){y(new T(we,lt,"PUBLIC")),y(new T(pt,gt,"PRIVATE"))}ht();m(Z,K);m(Z,K,"esm2017");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wt="/firebase-messaging-sw.js",bt="/firebase-cloud-messaging-push-scope",be="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",mt="https://fcmregistrations.googleapis.com/v1",me="google.c.a.c_id",yt="google.c.a.c_l",Tt="google.c.a.ts",kt="google.c.a.e";var U;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(U||(U={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var w;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(w||(w={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function p(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function It(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),o=atob(n),i=new Uint8Array(o.length);for(let r=0;r<o.length;++r)i[r]=o.charCodeAt(r);return i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const O="fcm_token_details_db",St=5,G="fcm_token_object_Store";async function vt(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(r=>r.name).includes(O))return null;let t=null;return(await F(O,St,{upgrade:async(o,i,r,s)=>{var c;if(i<2||!o.objectStoreNames.contains(G))return;const f=s.objectStore(G),u=await f.index("fcmSenderId").get(e);if(await f.clear(),!!u){if(i===2){const a=u;if(!a.auth||!a.p256dh||!a.endpoint)return;t={token:a.fcmToken,createTime:(c=a.createTime)!==null&&c!==void 0?c:Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:p(a.vapidKey)}}}else if(i===3){const a=u;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:p(a.auth),p256dh:p(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:p(a.vapidKey)}}}else if(i===4){const a=u;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:p(a.auth),p256dh:p(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:p(a.vapidKey)}}}}}})).close(),await v(O),await v("fcm_vapid_details_db"),await v("undefined"),At(t)?t:null}function At(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Et="firebase-messaging-database",_t=1,b="firebase-messaging-store";let P=null;function ye(){return P||(P=F(Et,_t,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(b)}}})),P}async function Nt(e){const t=Te(e),o=await(await ye()).transaction(b).objectStore(b).get(t);if(o)return o;{const i=await vt(e.appConfig.senderId);if(i)return await x(e,i),i}}async function x(e,t){const n=Te(e),i=(await ye()).transaction(b,"readwrite");return await i.objectStore(b).put(t,n),await i.done,t}function Te({appConfig:e}){return e.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ct={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},d=new X("messaging","Messaging",Ct);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ot(e,t){const n=await B(e),o=ke(t),i={method:"POST",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(V(e.appConfig),i)).json()}catch(s){throw d.create("token-subscribe-failed",{errorInfo:s==null?void 0:s.toString()})}if(r.error){const s=r.error.message;throw d.create("token-subscribe-failed",{errorInfo:s})}if(!r.token)throw d.create("token-subscribe-no-token");return r.token}async function Pt(e,t){const n=await B(e),o=ke(t.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(`${V(e.appConfig)}/${t.token}`,i)).json()}catch(s){throw d.create("token-update-failed",{errorInfo:s==null?void 0:s.toString()})}if(r.error){const s=r.error.message;throw d.create("token-update-failed",{errorInfo:s})}if(!r.token)throw d.create("token-update-no-token");return r.token}async function Dt(e,t){const o={method:"DELETE",headers:await B(e)};try{const r=await(await fetch(`${V(e.appConfig)}/${t}`,o)).json();if(r.error){const s=r.error.message;throw d.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw d.create("token-unsubscribe-failed",{errorInfo:i==null?void 0:i.toString()})}}function V({projectId:e}){return`${mt}/projects/${e}/registrations`}async function B({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function ke({p256dh:e,auth:t,endpoint:n,vapidKey:o}){const i={web:{endpoint:n,auth:t,p256dh:e}};return o!==be&&(i.web.applicationPubKey=o),i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mt=7*24*60*60*1e3;async function Rt(e){const t=await jt(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:p(t.getKey("auth")),p256dh:p(t.getKey("p256dh"))},o=await Nt(e.firebaseDependencies);if(o){if(Kt(o.subscriptionOptions,n))return Date.now()>=o.createTime+Mt?Ft(e,{token:o.token,createTime:Date.now(),subscriptionOptions:n}):o.token;try{await Dt(e.firebaseDependencies,o.token)}catch(i){console.warn(i)}return z(e.firebaseDependencies,n)}else return z(e.firebaseDependencies,n)}async function Ft(e,t){try{const n=await Pt(e.firebaseDependencies,t),o=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await x(e.firebaseDependencies,o),n}catch(n){throw n}}async function z(e,t){const o={token:await Ot(e,t),createTime:Date.now(),subscriptionOptions:t};return await x(e,o),o.token}async function jt(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:It(t)})}function Kt(e,t){const n=t.vapidKey===e.vapidKey,o=t.endpoint===e.endpoint,i=t.auth===e.auth,r=t.p256dh===e.p256dh;return n&&o&&i&&r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function J(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return qt(t,e),Lt(t,e),$t(t,e),t}function qt(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const o=t.notification.body;o&&(e.notification.body=o);const i=t.notification.image;i&&(e.notification.image=i);const r=t.notification.icon;r&&(e.notification.icon=r)}function Lt(e,t){t.data&&(e.data=t.data)}function $t(e,t){var n,o,i,r,s;if(!t.fcmOptions&&!(!((n=t.notification)===null||n===void 0)&&n.click_action))return;e.fcmOptions={};const c=(i=(o=t.fcmOptions)===null||o===void 0?void 0:o.link)!==null&&i!==void 0?i:(r=t.notification)===null||r===void 0?void 0:r.click_action;c&&(e.fcmOptions.link=c);const f=(s=t.fcmOptions)===null||s===void 0?void 0:s.analytics_label;f&&(e.fcmOptions.analyticsLabel=f)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xt(e){return typeof e=="object"&&!!e&&me in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vt(e){if(!e||!e.options)throw D("App Configuration Object");if(!e.name)throw D("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const o of t)if(!n[o])throw D(o);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function D(e){return d.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{constructor(t,n,o){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const i=Vt(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:o}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ht(e){try{e.swRegistration=await navigator.serviceWorker.register(wt,{scope:bt}),e.swRegistration.update().catch(()=>{})}catch(t){throw d.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Wt(e,t){if(!t&&!e.swRegistration&&await Ht(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw d.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ut(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=be)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ie(e,t){if(!navigator)throw d.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw d.create("permission-blocked");return await Ut(e,t==null?void 0:t.vapidKey),await Wt(e,t==null?void 0:t.serviceWorkerRegistration),Rt(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Gt(e,t,n){const o=zt(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(o,{message_id:n[me],message_name:n[yt],message_time:n[Tt],message_device_time:Math.floor(Date.now()/1e3)})}function zt(e){switch(e){case w.NOTIFICATION_CLICKED:return"notification_open";case w.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Jt(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===w.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(J(n)):e.onMessageHandler.next(J(n)));const o=n.data;xt(o)&&o[kt]==="1"&&await Gt(e,n.messageType,o)}const Y="@firebase/messaging",Q="0.12.12";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yt=e=>{const t=new Bt(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>Jt(t,n)),t},Qt=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:o=>Ie(t,o)}};function Xt(){y(new T("messaging",Yt,"PUBLIC")),y(new T("messaging-internal",Qt,"PRIVATE")),m(Y,Q),m(Y,Q,"esm2017")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Se(){try{await Ae()}catch{return!1}return typeof window<"u"&&Ee()&&_e()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zt(e,t){if(!navigator)throw d.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function en(e=Ne()){return Se().then(t=>{if(!t)throw d.create("unsupported-browser")},t=>{throw d.create("indexed-db-unsupported")}),R(j(e),"messaging").getImmediate()}async function tn(e,t){return e=j(e),Ie(e,t)}function nn(e,t){return e=j(e),Zt(e,t)}Xt();class on{constructor(){this.messaging=null,this.isSupported=!1,this.initialize()}async initialize(){try{this.isSupported=await Se(),this.isSupported&&(this.messaging=en(),this.setupMessageListener())}catch(t){console.error("Failed to initialize push notifications:",t)}}setupMessageListener(){this.messaging&&nn(this.messaging,t=>{var n,o,i;if(console.log("Received foreground message:",t),Notification.permission==="granted"){const r=new Notification(((n=t.notification)==null?void 0:n.title)||"Notification",{body:(o=t.notification)==null?void 0:o.body,icon:"/omegalogo.png",badge:"/omegalogo.png",data:t.data,tag:((i=t.data)==null?void 0:i.tag)||"repair-notification"});setTimeout(()=>{r.close()},5e3),r.onclick=()=>{var s;r.close(),window.focus(),window.location.href=((s=t.data)==null?void 0:s.url)||"/customer"}}})}async requestPermission(){if(!this.isSupported)throw new Error("Push notifications are not supported in this browser");try{return await Notification.requestPermission()}catch(t){return console.error("Error requesting notification permission:",t),"denied"}}async subscribeToPush(t){if(!this.isSupported||!this.messaging)return console.warn("Push notifications not supported"),!1;try{console.log("subscribeToPush: Starting subscription process"),console.log("subscribeToPush: Current permission status:",Notification.permission);const n=await this.requestPermission();if(console.log("subscribeToPush: Permission result:",n),n!=="granted")return console.log("subscribeToPush: Notification permission denied or not granted"),!1;const o=await tn(this.messaging,{vapidKey:"BEKAzNQQC9EL3Hv821Gzvzr-QTpNoSlhl3n1E06EtnHgreAsoMlmgXLVqvjZsASV1RyM-70lz_HvRihQJfLyzDk"});return o?(await A(E(_,"customer_profiles",t),{fcmTokens:Ce(o),"notificationPreferences.pushEnabled":!0,lastPushTokenUpdate:new Date}),console.log("Push notification subscription successful"),!0):(console.error("Failed to get FCM token"),!1)}catch(n){return console.error("Error subscribing to push notifications:",n),!1}}async unsubscribeFromPush(t,n){try{return n?await A(E(_,"customer_profiles",t),{fcmTokens:Oe(n),"notificationPreferences.pushEnabled":!1}):await A(E(_,"customer_profiles",t),{fcmTokens:[],"notificationPreferences.pushEnabled":!1}),!0}catch(o){return console.error("Error unsubscribing from push notifications:",o),!1}}get isPushSupported(){return this.isSupported}}const an=new on;export{an as p};
