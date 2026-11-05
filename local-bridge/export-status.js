// Read-only status export for manual paste into the public dashboard.
// Token is supplied only via the environment; never printed or written to disk.
import {validateBridgeStatusSnapshot} from '../src/bridge-status-snapshot.js';
export async function fetchStatusReport({token,port=8765,fetchImpl=fetch}={}){
 if(typeof token!=='string'||token.length<32)throw new Error('LOCAL_BRIDGE_TOKEN must be 32+ characters');
 if(!Number.isInteger(Number(port))||Number(port)<1||Number(port)>65535)throw new Error('Invalid local bridge port');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetchImpl('http://127.0.0.1:'+port+'/v1/status',{headers:{Authorization:'Bearer '+token},signal:controller.signal});
  if(!response.ok)throw new Error('Local bridge returned HTTP '+response.status);
  const body=await response.text();
  if(body.length>50000)throw new Error('Status report too large');
  const checked=validateBridgeStatusSnapshot(JSON.parse(body));
  if(!checked.ok)throw new Error(checked.error);
  return checked.value;
 }finally{clearTimeout(timeout)}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 fetchStatusReport({token:process.env.LOCAL_BRIDGE_TOKEN,port:Number(process.env.LOCAL_BRIDGE_PORT||8765)})
  .then(report=>process.stdout.write(JSON.stringify(report,null,2)+'\n'))
  .catch(()=>{console.error('Unable to retrieve a valid local bridge status report. Check bridge, token and port.');process.exitCode=1});
}
