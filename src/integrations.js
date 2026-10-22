// Safe browser-side integration boundary. No provider secrets or paid requests belong here.
export const EXPECTED_FIREBASE_PROJECT_ID='ai-virtual-office-96157';
export const PROVIDER_IDS=Object.freeze(['openai','gemini','claude']);
export const AUTH_STATES=Object.freeze(['not-configured','signed-out','signed-in']);
export function firebaseAuthConfig(env={}) {
  const fields=['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID'];
  if(!fields.every(key=>typeof env[key]==='string' && env[key].trim())) return null;
  const projectId=env.VITE_FIREBASE_PROJECT_ID;
  const authDomain=env.VITE_FIREBASE_AUTH_DOMAIN;
  if(projectId!==EXPECTED_FIREBASE_PROJECT_ID || authDomain!==projectId+'.firebaseapp.com') return null;
  return {apiKey:env.VITE_FIREBASE_API_KEY,authDomain,projectId,appId:env.VITE_FIREBASE_APP_ID};
}
export function providerStatus(env={}) {
  // Public configuration may identify a gateway, but cannot enable requests without a secure server.
  return PROVIDER_IDS.map(id=>({id,status:'not-connected',requires:'authenticated server-side gateway'}));
}
export function validateGatewayUrl(value) {
  if(typeof value!=='string'||!value) return null;
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && !u.search && !u.hash && u.pathname==='/api/ai' ? u.origin+u.pathname : null;}catch{return null;}
}
