
  var LastFoundNode;
  var LastSelection;
  var isDebugLegacyOption;

  function containerClick(el, evt) {
    var code = evt.target;
    
    if (code && code.classList.contains("helpchapter")) {
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

        if (!exists) {
          document.documentElement.appendChild(element);
        }

        // make a new custom event
        var customEvent = document.createEvent("Events");
        
        switch(code.tagName) {
          case 'code':
            customEvent = new CustomEvent("SmartTemplate4CodeWord",
              {bubbles:true, cancelable:false}
            );
            // window.parent.document.dispatchEvent(customEvent);
            // customEvent.initEvent("SmartTemplate4CodeWord", true, false);
            break;
          case 'span': case 'lbl':
            if (isAddressConfig) {
              customEvent.initEvent("SmartTemplate4CAD", true, false);
            }              
            break;
          default:
            customEvent.initEvent("SmartTemplate4Website", true, false);
            break;
        }
        // window.parent.document.dispatchEvent(customEvent);
        element.dispatchEvent(customEvent);
      }
    }
  }
  
  async function expandAll(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var allchapters = Array.from(document.getElementsByClassName('chapterBody'));
    allchapters.forEach(function(el) {
      el.classList.remove('collapsed');
    });
  }    
  async function collapseAll(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var allchapters = Array.from(document.getElementsByClassName('chapterBody'));
    allchapters.forEach(function(el) {
      el.classList.add('collapsed');
    });
  }
  
  // Accordion:
  var mychapters = Array.from(document.getElementsByClassName('chapterBody'));
  mychapters.forEach(function(el) {
    var hd = el.previousElementSibling;
    
    /* alert("adding event listener: " + el.tagName + " "  + el.textContent);  */
    hd.addEventListener('click', 
      function(e) { 
        var isCollapsed = el.classList.contains('collapsed');
        if (isCollapsed) {
          // collapse all other chapters
          Array.from(document.getElementsByClassName('chapterBody')).forEach(
            (x) => {
              if (x!=el) {
                x.classList.add('collapsed');
                x.previousElementSibling.classList.remove('expanded');
              }
            }
          )
          el.classList.remove('collapsed'); // uncollapse chapter below this heading
          window.setTimeout( function() { 
            const options = {
              behavior:"smooth",
              block: "start"
            }
            hd.scrollIntoView(options); 

            if (isContextXML()) {
              // send message to container to scroll itself to top:
              /* OBSOLETE in HTML view */
              let customEvent = new CustomEvent("SmartTemplate4ScrollVariables", {bubbles:true} );
              // document.dispatchEvent(customEvent);
              const parentDoc = window.parent.document;
              parentDoc.dispatchEvent(customEvent);
              setTimeout( 
                (x) => {
                  window.parent.document.dispatchEvent(customEvent)},
                250
              );
            }
          }, 150);
          hd.classList.add('expanded');
        } else {
          el.classList.add('collapsed');
          let sel = window.getSelection();
          if (sel && el.contains(sel.focusNode)) {
            sel.removeAllRanges();
          }
          hd.classList.remove('expanded');
        }
      }
    );
    el.classList.add('collapsed');
  });
  
  var myheadings = Array.from(document.getElementsByClassName('helpchapter'));
  myheadings.forEach((el) => { // for purpose of search / focus()
    el.setAttribute("tabindex",-1);
  });
  

  function cloneSelection(sel) {
    if (!sel) return null;
    let result = {
      anchorOffset: sel.anchorOffset,
      direction: sel.direction,
      focusNode: sel.focusNode,
      focusOffset: sel.focusOffset,
      isCollapsed: sel.isCollapsed,
      rangeCount: sel.rangeCount
    }
    // ​type: sel.type
    return result;
  }
  function reSelectRange(sel, focusNode, text) {
    if (!sel) { 
      return;
    }
    const range = document.createRange();
    if (!range) { return; }
    range.setStart(focusNode, sel.anchorOffset);
    range.setEnd(focusNode, sel.anchorOffset + text.length);
    window.getSelection().addRange(range);
  }
  
  // [issue 215] search box for variables tab
  async function findSearchString(text, repeat, backwards=false) {
    const caseSensitive = false, 
        wraparound = true, 
        wholeword = false,
        frames = true, // test
        dlg = false,
        searchText = text.toLocaleLowerCase(),
        isDebug = await isDebugLegacyOption();

    if (isDebug) { showActiveElement("findSearchString"); }

    function highlightContainer(el, on = true) {
      if (!el) return null;
      let highlight = el.classList  ? el : el.parentNode;
      if (!highlight) return null;
      if (!highlight.classList) return null;

      if (on) {
        highlight.classList.add("searchFocus");
      } else {
        highlight.classList.remove("searchFocus");
      }
      return highlight;
    }
        
    let focusNode;
    if (!repeat) {
      let sel = window.getSelection();
      LastSelection = cloneSelection(sel);
      focusNode = sel?.focusNode || null;
    } else {
      // set selection again (in case find next / previous were clicked)
      reSelectRange(LastSelection, LastFoundNode, text);
      focusNode = LastFoundNode;
    }
    let chapters = Array.from(document.getElementsByClassName('chapterBody'));
    let c;
    if (focusNode) {
      let here = focusNode.parentNode;
      c = here;
      if (here.tagName=="h1") {
        // find next chapter.
        while(c && !c.classList.contains("chapterBody")) {
          c = backwards ? c.previousElementSibling : c.nextElementSibling;
        }
      } else {
        while(c && ((!c.classList) || (c.classList && !c.classList.contains("chapterBody")))) {
          c = c.parentNode;
          if (!c || c.id == "#helpContents") { 
            // top level!
            c = backwards ? chapters[chapters.length-1] : chapters[0];
            break;
          }
        }
      }
    } else {
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
      function testCollapsedMatch(el, searchString) {
        if (el.classList.contains("collapsed") && el.textContent.toLocaleLowerCase().includes(searchString)) {
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
          if (backwards && i<0) {
            testCollapsedMatch(chapters[0], searchText);
          }
          break;
        }
        // let previousChapter = currentChapter; 
        currentChapter = chapters[i];
        if (isDebug) { 
          const txtChapter = currentChapter?.previousElementSibling?.textContent || currentChapter?.textContent?.substring(0,50) + "...";
          console.log(`Search  chapter[${i}]: ${txtChapter} ...`); 
        }
        if (currentChapter === c || found) {
          found = true;
          // find next chapter which contains the search string and expand it.
          if (testCollapsedMatch(c, searchText)) {
            foundInChapter = true;
            if (isDebug) { console.log(`Found '${searchText}' in Chapter`);}
          } else {
            c = currentChapter;
            // if we are already on a search result in a uncollapsed chapter
            // check if there are still matches further down / up in current chapter:
            if (focusNode && c && c.classList && c.classList.contains("chapterBody") && !c.classList.contains("collapsed")) {
              let where = backwards ? "before" : "after";
              let nextFocus = focusNode ? focusNode.parentNode : null;
              if (nextFocus && (nextFocus.id=="searchBox" || nextFocus.id=="allexpander")) {
                nextFocus = document.getElementById(backwards ? "endOfHelp" : "startHeading");
              } else if (!c.contains(nextFocus)) {
                // we moved on to a following / previous chapter
                nextFocus = c.firstElementChild;
                if (nextFocus && nextFocus.tagName=="ul") {
                  nextFocus = nextFocus.firstElementChild;
                }
              } else {
                if (isDebug) { console.log(`Check ${where} selection in expanded chapter:`, focusNode); }
              }
              let listItem = nextFocus;
              const listElements = ["li","aside","p","code"]; // "code" ?
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
                let sib = backwards ? listItem.previousElementSibling : listItem.nextElementSibling;
                while(sib) {
                  if (sib.textContent.toLocaleLowerCase().includes(searchText)) {
                    foundInChapter = true;
                    if (isDebug) {
                      console.log(`Found search string in node ${sib.tagName}\n ${sib?.textContent?.substring(0,50)}...`);
                    }
                    break;
                  }
                  highlightContainer(sib, false);
                  sib = backwards ? sib.previousElementSibling : sib.nextElementSibling;
                  highlightContainer(sib);
                }
              }
            }
          }
        }
        if (foundInChapter) break;
      }
    }
    if (isDebug) { console.log("After loop: invoke window.find() ... "); }
    // if (backwards) debugger;

    let isFound = window.find(searchText,
                caseSensitive, 
                backwards, 
                wraparound, 
                wholeword,
                frames,
                dlg);

    if (isFound) {
      // remember selection
      // what if same thing is found?
      if (backwards && LastSelection?.focusNode == window.getSelection()?.focusNode) {
        // repeat search
        if (isDebug) {
          console.log({last: LastSelection?.focusNode, current: window.getSelection()?.focusNode});
        }
        isFound = window.find(searchText, caseSensitive, backwards, wraparound, wholeword, frames, dlg);
      }

      LastSelection = cloneSelection(window.getSelection());
      LastFoundNode = window.getSelection()?.focusNode;
      if (LastFoundNode) {
        // LastFoundNode.parentElement?.focus();
        if (isDebug) { console.log("LastFoundNode:", LastFoundNode); }
        for (let nd=LastFoundNode; (nd) ; nd=nd.parentElement) {
          if (nd.scrollIntoView) {
            if (isDebug) { console.log("scrollIntoView:", nd); }
            nd.scrollIntoView({behavior:"smooth", block: "nearest"});
            break;
          }
        }
        for (let node=LastFoundNode; node?.tagName != "body"; node=node.parentElement) {
          if (!node.getAttribute) {
            continue;
          }
          if (node.getAttribute("tabindex")) {
            if (isDebug) { console.log("focusing on:", node); }
            node.focus();
            reSelectRange(LastSelection, LastFoundNode, text);
            break;
          }
        }
      }
    } else { // keep last selection, so we can search backwards?
      if (isDebug) {console.log("reSelectRange(LastFoundNode)")};
      reSelectRange(LastSelection, LastFoundNode, text);
    }
  }    
    

  function fixClipboardNote() {
    let note1 = document.getElementById("clipboardNotes");
    if (note1) {
      note1.innerHTML = 
        note1.textContent
        .replace("{file}", "<code>%file()%</code>")
        .replace("{toclip}", "<span class='paramLiteral'>toclipboard</span>");
    }    
  }

  function initSearch() {
    const searchBox = document.getElementById("search");
    if (searchBox) {
      // we are using the tabindex=-1 hack to make the list items searchable even if the user highlights text or 
      // clicks into the help contents. Note that contentEditable doesn't work here.
      searchBox.addEventListener("keydown", async (event) => {
        // if (await isDebugLegacyOption()) { console.log("searchbox keydown:", event); }
        let target = event.target;
        switch (event.code) {
          case "NumpadEnter": // search next
          case "Enter": // search start - how do we prevent [OK] from catching this???
            let search = target.value;
            event.preventDefault();
            event.stopPropagation();
            findSearchString(search);
            document.getElementById("findnext").style.display="inline-block";
            document.getElementById("findprevious").style.display="inline-block";
            break;
          case "Escape":
            event.preventDefault();
            event.stopPropagation();
            target.blur();
            document.getElementById("searchHelpContent").classList.add("hidden");
            document.getElementById("findnext").style.display="none";
            document.getElementById("findprevious").style.display="none";
            break;
        }
      }, {capture:true});
    }

    const searchHelpContent = document.getElementById("searchHelpContent");
    async function findRepeat(backwards) {
      if (!searchBox.value) {
        searchBox.focus();
        return;
      }
      await findSearchString(searchBox.value, true, backwards);
      searchHelpContent.classList.add("hidden");
    }

    const findprevious = document.getElementById("findprevious");
    if (findprevious) {
      findprevious.addEventListener("mouseup",
        async (evt) => {
          findRepeat(true); 
        }
      );
    }
    const findnext = document.getElementById("findnext");
    if (findnext) {
      findnext.addEventListener("mouseup",
        async (evt) => {
          findRepeat(false);
        }
      );
    }

    const isDebug = true;
    let container = document.getElementById("helpContents");
    if (container) {
      container.addEventListener("keydown", async (event) => {
        if (isDebug) console.log("helpContents frame", event);
        switch (event.code) {
          case "F4":
            event.preventDefault();
            event.stopPropagation();
            let backwards = (event.shiftKey);
            let search = document.getElementById("search");
            if (search.value) {
              // event.originalTarget.ownerDocument.body.focus();
              let isFound = await findSearchString(search.value, true, backwards);
              document.getElementById("searchHelpContent").classList.add("hidden");
              if (isFound) {
                let el = LastSelection.focusNode;
                while (el = el.parentElement) {
                  if (!el.classList) continue;
                  if (el.classList.contains("chapterBody")) {
                    el.focus();
                    break;
                  }
                  if (el.classList.contains("helpchapter")) {
                    if (backwards) {
                      el.previousElementSibling.focus();
                    } else {
                      el.nextElementSibling.focus();
                    }
                    break;
                  }
                }
                // anchorOffset: sel.anchorOffset,
                // direction: sel.direction,
                // focusNode: sel.focusNode,
                // focusOffset: sel.focusOffset,
                // isCollapsed: sel.isCollapsed,
                // rangeCount: sel.rangeCount                
              }
              // fix lost focus problem
              // event.originalTarget.ownerDocument.body.focus();
              // search.focus();
            } else {
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

    // when copying keys:
    let helpContent = document.getElementById("searchHelpContent");
    if (helpContent) {
      helpContent.innerHTML = helpContent.textContent
        .replaceAll("{{", "<span class='key'>")
        .replaceAll("}}", "</span>")
    }    
  }

  function findOrigin() {
    const url = new URL(document.URL);
    const scriptParams = Object.fromEntries(url.searchParams)
    // console.log(scriptParams);
    return scriptParams["context"] || null;
  }

  function isContextXML() { // helper function to see if we are in the old dialog
    return (findOrigin() != "html");
  }
  
  function showActiveElement(txt) {
    const color="white", background="rgb(80,0,0)";
    console.log(`%c${txt} - Active element:`, `color: ${color}; background: ${background}`, document.activeElement, document.activeElement?.textContent.substring(0,25));
  }
    
