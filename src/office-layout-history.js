export const MAX_OFFICE_HISTORY=20;
export function initialHistory(layout){return {past:[],present:layout,future:[]};}
export function commitHistory(history,layout){
 if(JSON.stringify(history.present)===JSON.stringify(layout))return history;
 return {past:[...history.past,history.present].slice(-MAX_OFFICE_HISTORY),present:layout,future:[]};
}
export function undoHistory(history){
 if(!history.past.length)return history;
 return {past:history.past.slice(0,-1),present:history.past.at(-1),future:[history.present,...history.future].slice(0,MAX_OFFICE_HISTORY)};
}
export function redoHistory(history){
 if(!history.future.length)return history;
 return {past:[...history.past,history.present].slice(-MAX_OFFICE_HISTORY),present:history.future[0],future:history.future.slice(1)};
}
export function resetHistory(layout){return initialHistory(layout);}
