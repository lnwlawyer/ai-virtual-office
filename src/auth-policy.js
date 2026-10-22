// Pure access policy: default deny until a verified Firebase Auth session is supplied.
export const ACCESS_LEVELS=Object.freeze(['guest','user','admin']);
export function sessionAccess(session,expectedProjectId) {
  if(!session || typeof session!=='object' || !expectedProjectId) return {role:'guest',authenticated:false};
  const {uid,projectId,claims}=session;
  if(typeof uid!=='string'||!uid||uid.length>128||projectId!==expectedProjectId||claims?.email_verified!==true)
    return {role:'guest',authenticated:false};
  // Admin role must be verified by the backend; browser claims alone never authorize writes.
  return {role:'user',authenticated:true};
}
export function canAccessFeature(feature,session,expectedProjectId) {
  const auth=sessionAccess(session,expectedProjectId);
  if(feature==='public-dashboard')return true;
  if(feature==='personal-workspace')return auth.authenticated;
  // AI gateway, document mutations, and admin features need server-side authorization.
  return false;
}
