export function officeHistoryShortcut(event){
 if(!event||event.defaultPrevented||event.altKey||!(event.ctrlKey||event.metaKey))return null;
 const target=event.target;
 if(target?.isContentEditable||target?.closest?.('input,textarea,select,[contenteditable],[role="textbox"]'))return null;
 const key=String(event.key??'').toLowerCase();
 if(key==='z')return event.shiftKey?'redo':'undo';
 if(key==='y'&&!event.shiftKey)return 'redo';
 return null;
}
