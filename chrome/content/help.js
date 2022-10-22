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
          isAddressConfig = ((classList && classList.contains('config_default')) || (code.parentElement && code.parentElement.classList.contains('config_default')));
          
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
          case 'span': case 'lbl':
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
          case 'span': case 'lbl':
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
    evt.stopPropagation();
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
  
  // [issue 215] search box for variables tab
  function findSearchString(search, repeat) {
    let caseSensitive = false, 
        backwards = false, 
        wraparound = true, 
        wholeword = false,
        frames = false,
        dlg = false;
    let sel = window.getSelection();
    let chapters = Array.from(document.getElementsByClassName('chapterBody'));
    let c;
    if (sel && sel.focusNode) {
      let here = sel.focusNode.parentNode;
      c = here;
      if (here.tagName=="h1") {
        // find next chapter.
        while(c && !c.classList.contains("chapterBody")) {
          c = c.nextElementSibling;
        }
      }
      else {
        while(c && ((!c.classList) || (c.classList && !c.classList.contains("chapterBody")))) {
          c = c.parentNode;
          if (c.id == "#helpContents") { 
            // top level!
            c = chapters[0];
            break;
          }
        }
      }
    }
    else {
       //  search from top
      c = chapters[0];
    }
    // get next chapter
    if (c) {
      let found=false;
      let foundInChapter=false;
      for (let i in chapters ) {
        let currentChapter = chapters[i];
        if (c==currentChapter || found) {
          found = true;
          // find next chapter which contains the search string and expand it.
          if (c.classList.contains("collapsed") && c.textContent.includes(search)) {
            // open next chapter with match
            c.classList.remove("collapsed");
            break;
          } else {
            c = currentChapter;
            // if we are already on a search result in a uncollapsed chapter
            // check if there are still matches further down in current expanded chapter:
            if (sel && c.classList && c.classList.contains("chapterBody") && !c.classList.contains("collapsed")) {
              if (sel.toString() == search) {
                console.log("Check after selection in expanded chapter:", sel);
                let listItem = sel.focusNode ? sel.focusNode.parentNode : null;
                while (listItem && (listItem.nodeType==3 || (listItem.tagName != "li" && listItem.tagName!="aside" && listItem.tagName!="code"))) {
                  listItem = listItem.parentNode;
                  if (listItem.tagName == "div" && listItem.classList.contains("chapterBody")) {
                    break;
                  }
                }
                if (listItem) {
                  // check following siblings
                  let sib = listItem.nextSibling;
                  while(sib) {
                    if (sib.textContent.includes(search)) {
                      foundInChapter = true;
                      break;
                    }
                    sib = sib.nextElementSibling;
                  }
                }
              }
            }
          }
        }
        if (foundInChapter) break;
      }
    }
      
    let isFound = window.find(search,
                caseSensitive, 
                backwards, 
                wraparound, 
                wholeword,
                frames,
                dlg);
    
  }    
    
    
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
    let note1 = document.getElementById("clipboardNotes");
    if (note1) {
      note1.innerHTML = note1.textContent.replace("{file}", "<code>%file()%</code>").replace("{toclip}", "<i>toclipboard</i>");
    }
    let searchBox = document.getElementById("search");
    if (searchBox) {
      searchBox.addEventListener("keypress", (event) => {
        let target = event.target;
        switch (event.code) {
          case "Enter": // search next
            let search = target.value;
            event.preventDefault();
            event.stopPropagation();
            findSearchString(search);
            break;
          case "Escape":
            event.preventDefault();
            event.stopPropagation();
            target.blur();
            document.getElementById("searchHelpContent").classList.add("hidden");
            break;
        }
      });
    }
    let container = document.getElementById("helpContents");
    if (container) {
      container.addEventListener("keypress", (event) => {
        switch (event.code) {
          case "F3":
            event.preventDefault();
            event.stopPropagation();
            let search = document.getElementById("search");
            if (search.value) {
              findSearchString(search.value,true);
              document.getElementById("searchHelpContent").classList.add("hidden");
            }
            else {
              search.focus();
            }
            break;
        }
      });
    }
    let helpSearch = document.getElementById("fq-variables-search-help");
    if (helpSearch) {
      // helpSearch.innerHTML = " ";
      helpSearch.textContent = " ";
      // QuickFolders.Interface.quickMoveHelp(this);
      helpSearch.addEventListener("click", (event) => {
        // show / hide tooltip
        console.log("clicked on help");
        let searchHelp = document.getElementById("searchHelpContent");
        if (searchHelp.classList.contains("hidden")) {
          searchHelp.classList.remove("hidden");
        } else {
          searchHelp.classList.add("hidden");
        }
      });
    }
    let helpContent = document.getElementById("searchHelpContent");
    if (helpContent) {
      helpContent.innerHTML = helpContent.textContent
        .replaceAll("{{", "<span class='key'>")
        .replaceAll("}}", "</span>")
    }
    
  } 
  
window.document.addEventListener('DOMContentLoaded', 
  init, 
  { once: true });
