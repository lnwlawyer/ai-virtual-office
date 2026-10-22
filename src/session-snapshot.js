// This snapshot is UI state only; it never proves server-side authorization.
export function toSessionSnapshot(user,projectId) {
  if(!user || typeof user.uid!=='string' || !user.uid ||
     typeof projectId!=='string' || !projectId) return null;
  return {
    uid:user.uid,
    email:typeof user.email==='string'?user.email:null,
    emailVerified:user.emailVerified===true,
    projectId,
    claims:{email_verified:user.emailVerified===true}
  };
}
