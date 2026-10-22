import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'firebase/auth';
import {firebaseAuthConfig} from './integrations.js';

// No login starts unless this app's browser config is explicitly provided.
export function createGoogleAuthClient(env) {
  const config=firebaseAuthConfig(env);
  if(!config) return null;
  const app=getApps().length ? getApps().find(a=>a.name==='ai-virtual-office') || initializeApp(config,'ai-virtual-office') : initializeApp(config,'ai-virtual-office');
  if(app.options.projectId!==config.projectId)throw new Error('Firebase project mismatch');
  const auth=getAuth(app);
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  return {
    subscribe(callback) {return onAuthStateChanged(auth,user=>callback(user ? {uid:user.uid,email:user.email,emailVerified:user.emailVerified,projectId:config.projectId}:null));},
    signIn() {return signInWithPopup(auth,provider);},
    signOut() {return signOut(auth);}
  };
}
