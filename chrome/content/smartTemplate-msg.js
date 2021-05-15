

window.document.addEventListener('DOMContentLoaded', 
  SmartTemplate4.Message.l10n.bind(SmartTemplate4.Message) , 
  { once: true });
  
window.addEventListener('load', 
  SmartTemplate4.Message.loadMessage.bind(SmartTemplate4.Message) , 
  { once: true });
  
window.addEventListener('unload', 
  function () { SmartTemplate4.Message.unloadMessage(window); },
  { once: true });
  
window.addEventListener("close", 
  (e) => {
     e.preventDefault();
    // could be needed as well 
    //e.stopPropagation();
  }
);  
  
  