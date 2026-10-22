import {initializeApp,getApps} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'firebase/auth';
import {firebaseAuthConfig} from './integrations.js';
import {toSessionSnapshot} from './session-snapshot.js';

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
    subscribe(callback) {return onAuthStateChanged(auth,user=>callback(toSessionSnapshot(user,config.projectId)));},
    signIn() {return signInWithPopup(auth,provider);},
    signOut() {return signOut(auth);}
  };
}
