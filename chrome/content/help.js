
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
    if (isDebugLegacyOption()) {
      console.log("Expanding all chapters...");
      debugger;
    }
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
        else {
          el.classList.add('collapsed');
          let sel=window.getSelection();
          if (sel && el.contains(sel.focusNode)) {
            sel.removeAllRanges();
          }
        }
      }
    );
    el.classList.add('collapsed');
  });
  
  function isDebugLegacyOption() {
    let isDebug = Services.prefs.getBoolPref("extensions.smartTemplate4.debug.variables.search"); 
    return isDebug;
  }
  
  // [issue 215] search box for variables tab
  function findSearchString(text, repeat, backwards=false) {
    let caseSensitive = false, 
        wraparound = true, 
        wholeword = false,
        frames = false,
        dlg = false,
        search = text.toLocaleLowerCase(),
        isDebug = isDebugLegacyOption();
        
    let sel = window.getSelection();
    let chapters = Array.from(document.getElementsByClassName('chapterBody'));
    let c;
    if (sel && sel.focusNode) {
      let here = sel.focusNode.parentNode;
      c = here;
      if (here.tagName=="h1") {
        // find next chapter.
        while(c && !c.classList.contains("chapterBody")) {
          c = backwards ? c.previousElementSibling : c.nextElementSibling;
        }
      }
      else {
        while(c && ((!c.classList) || (c.classList && !c.classList.contains("chapterBody")))) {
          c = c.parentNode;
          if (!c || c.id == "#helpContents") { 
            // top level!
            c = backwards ? chapters[chapters.length-1] : chapters[0];
            break;
          }
        }
      }
    }
    else {
       //  search from top / end
      c = backwards ? chapters[chapters.length-1] : chapters[0];
    }
    // get next chapter
    if (c) {
      let found = false,
          foundInChapter = false,
          currentChapter = null;
          
      let start = backwards ? (chapters.length-1) : 0,
          end = backwards ? 0 : chapters.length;
      
      let delta = backwards ? (-1) : 1;
      function testCollapsedMatch(el, search) {
        if (el.classList.contains("collapsed") && el.textContent.toLocaleLowerCase().includes(search)) {
          if (isDebug) { console.log("Found string in collapsed chapter: ", el); }
          // open chapter with match
          el.classList.remove("collapsed");
          return true;
        }
        return false;
      }
      
      for (let i=start; 
           (backwards, i, end) => { return backwards ? (i>=0) : (i<end) } ; 
           i=i+delta ) {
        if (backwards && i<0 || !backwards && i>end) {
          debugger;
          if (backwards && i<0) {
            testCollapsedMatch(chapters[0], search);
          }
          break;
        }
        // let previousChapter = currentChapter; 
        currentChapter = chapters[i];
        if (currentChapter === c || found) {
          found = true;
          // find next chapter which contains the search string and expand it.
          if (testCollapsedMatch(c, search)) {
            foundInChapter = true;
          } else {
            c = currentChapter;
            // if we are already on a search result in a uncollapsed chapter
            // check if there are still matches further down in current expanded chapter:
            if (sel && c && c.classList && c.classList.contains("chapterBody") && !c.classList.contains("collapsed")) {
              let where = backwards ? "before" : "after";
              let nextFocus = sel.focusNode ? sel.focusNode.parentNode : null;
              if (nextFocus && (nextFocus.id=="searchBox" || nextFocus.id=="allexpander")) {
                nextFocus = document.getElementById(backwards ? "endOfHelp" : "startHeading");
              }
              else if (!c.contains(nextFocus)) {
                // we moved on to a following / previous chapter
                nextFocus = c.firstElementChild;
                if (nextFocus && nextFocus.tagName=="ul") {
                  nextFocus = nextFocus.firstElementChild;
                }
              }
              else {
                if (isDebug) { console.log(`Check ${where} selection in expanded chapter:`, sel); }
              }
              let listItem = nextFocus;
              const listElements = ["li","aside","p"]; // "code" ?
              while (listItem && (listItem.nodeType==3 || !listElements.includes(listItem.tagName))) {  
                listItem = listItem.parentNode;
                if (listItem.tagName == "div" && listItem.classList.contains("chapterBody")) {
                  break;
                }
                if (listItem.id =="helpContents") {
                  break;
                }
              }
              if (listItem) {
                // check following siblings
                let sib = backwards ? listItem.previousSibling : listItem.nextSibling;
                while(sib) {
                  if (sib.textContent.toLocaleLowerCase().includes(search)) {
                    foundInChapter = true;
                    if (isDebug) {
                      console.log(`Found search string in node ${sib.tagName}\n` + sib.textContent);
                    }
                    break;
                  }
                  if (isDebug) {
                    console.log(`Nothing found in node ${sib.tagName}\n` + sib.textContent);
                  }
                  sib = backwards ? sib.previousElementSibling : sib.nextElementSibling;
                }
              }
            }
          }
        }
        if (foundInChapter) break;
      }
    }
    if (isDebug) { console.log("After loop: invoke window.find() ... "); }
      
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
      // we are using the tabindex=-1 hack to make the list items searchable even if the user highlights text or 
      // clicks into the help contents. Note that contentEditable doesn't work here.
      searchBox.addEventListener("keydown", (event) => {
        if (isDebugLegacyOption()) {
          console.log("searchbox caught:", event);
        }
        let target = event.target;
        switch (event.code) {
          case "NumpadEnter": // search next
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
      }, {capture:true});
    }
    let container = document.getElementById("helpContents");
    if (container) {
      container.addEventListener("keydown", (event) => {
        switch (event.code) {
          case "F3":
            event.preventDefault();
            event.stopPropagation();
            let backwards = (event.shiftKey);
            let search = document.getElementById("search");
            if (search.value) {
              findSearchString(search.value, true, backwards);
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
