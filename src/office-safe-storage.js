export function getOfficeStorage(win=typeof window==='undefined'?null:window){
 try{
  const storage=win?.localStorage;
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function')return null;
  return storage;
 }catch{return null;}
}
