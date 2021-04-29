  function containerClick(el, evt) {
    var code = evt.target;
    
    if (code && code.classList.contains("helpchapter")) {
      /*  
      // not needed
        var newClick = new MouseEvent('click', { view: window, bubbles: false, cancelable: true })
        window.setTimeout( function clickHelpChapter() {
          code.dispatchEvent(newClick);
        }, 25);
      */
      return;
    }
    
    if (typeof code !='undefined') {
      var classList = code.classList,
          isAddressConfig = (classList && classList.contains('config_default'));
          
      if (code.tagName == 'code' || code.tagName == 'a' || isAddressConfig) {
        var exists = true,
            element = document.getElementById('ST4Dispatcher');
        if (!element) {
          exists = false;
          element = document.createElement("CodeEventDispatcher");
          element.id = 'ST4Dispatcher';
        }

        switch(code.tagName) {
          case 'code':
            /* this used to use innerHTML unnecessarily */
            element.setAttribute("codeWord", code.innerText); // now, add the payload
            element.setAttribute("class", code.className);    // class="noWrite" = cannot be used in new mail!!
            break;
          case 'span':
            if (isAddressConfig) {
              element.removeAttribute("codeWord");
              element.setAttribute("class", code.className);
            }
            break;
          case 'a':
          default: // probably anchor
            element.setAttribute("href", code.getAttribute('href'));
            break;
        }

        if (!exists)
          document.documentElement.appendChild(element);

        // make a new custom event
        var customEvent = document.createEvent("Events");
        
        switch(code.tagName) {
          case 'code':
            customEvent.initEvent("SmartTemplate4CodeWord", true, false);
            break;
          case 'span':
            if (isAddressConfig)
              customEvent.initEvent("SmartTemplate4CAD", true, false);
            break;
          default:
            customEvent.initEvent("SmartTemplate4Website", true, false);
            break;
        }
          
        element.dispatchEvent(customEvent);
      }
    }
  }
  
  function expandAll(evt) {
    evt.preventDefault();
    event.stopPropagation();
    var allchapters = Array.from(document.getElementsByClassName('chapterBody'));
    allchapters.forEach(function(el) {
      el.classList.remove('collapsed');
    });
  }    
  
  // Accordion:
  var mychapters = Array.from(document.getElementsByClassName('chapterBody'));
  mychapters.forEach(function(el) {
    var hd = el.previousElementSibling,
        xalert = window.alert.bind(window);
    
    /* alert("adding event listener: " + el.tagName + " "  + el.textContent);  */
    hd.addEventListener('click', 
      function(e) { 
        var isCollapsed = el.classList.contains('collapsed');
        if (isCollapsed) {
          // collapse all other chapters
          Array.from(document.getElementsByClassName('chapterBody')).forEach(
            function(x) {
              if (x!=el)
                x.classList.add('collapsed');
            }
          )
          el.classList.remove('collapsed'); // uncollapse chapter below this heading
          window.setTimeout( function() { hd.scrollIntoView(true); }, 150 );
          
        }
        else
          el.classList.add('collapsed');
      }
    );
    el.classList.add('collapsed');
  });
    
  function init() {
    // [mx l10n] 
    var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
    var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
    let extension = ExtensionParent.GlobalManager.getExtension("smarttemplate4@thunderbird.extension");
		Services.scriptloader.loadSubScript(
		  extension.rootURI.resolve("chrome/content/i18n.js"),
		  window,
		  "UTF-8"
		);
	  window.i18n.updateDocument({extension});
  } 
  
window.document.addEventListener('DOMContentLoaded', 
  init, 
  { once: true });
