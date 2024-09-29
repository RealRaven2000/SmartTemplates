
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
            let wrnDefault = document.getElementById("wrnDefaultFormat");
            if (wrnDefault) {
              alert(wrnDefault.textContent);
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

        // for web ext we need to do runtim message instead.
        
        switch(code.tagName) {
          case 'code':
            if (!browser) {
              const customEvent = new CustomEvent("SmartTemplate4CodeWord",
                {bubbles:true, cancelable:false}
              );
            }

            if (browser) {
              var dispatch = "SmartTemplate4CodeWord";
              browser.runtime.sendMessage(dispatch);
              return;
            }


            // window.parent.document.dispatchEvent(customEvent);
            // customEvent.initEvent("SmartTemplate4CodeWord", true, false);
            break;
          case 'span': case 'lbl':
            if (isAddressConfig) {
              const customEvent = document.createEvent("Events");
              customEvent.initEvent("SmartTemplate4CAD", true, false);
            }              
            break;
          default:
            {
              const customEvent = document.createEvent("Events");
              customEvent.initEvent("SmartTemplate4Website", true, false);
            }
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
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  // determine parentChapter of any element
  function parentChapterOf(el) {
    if (!el) return null;
    if (el?.tagName=="h1") { return el; }
    let p = el?.parentNode;
    while (p) {
      if (p.nodeType==1 && p.classList.contains("chapterBody")) {
        return p;
      }
      p = p?.parentNode;
    }
    return null; // empty list
  }

  function serialize(listItem) {
    //flatten an entry
    let list = [];
    if (!listItem.childNodes.length) {
      list.push(listItem);
    }
    for (let node of listItem.childNodes) {
      switch(node.nodeType) {
        case 3:
          if (node.nodeName=="br") continue;
          if (!node.textContent.trim()) continue;
          if (/^\s*$/.test(node.textContent)) { // empty!
            continue;
          }
          list.push(node);
          break;
        case 1:
          list.push(...serialize(node));
      }
    }
    if(typeof list == "undefined") {
      // debugger;
      console.log(list);
    }

    return list;
  }

  function flattenList(ul) {
    let list=[];
    for (let li of ul.children) {
      if (li.classList.contains("chapterbreak")) {
        continue;
      }
      for (let child of li.childNodes) {
        switch (child.nodeType) {
          case 3:
            if (child.textContent.trim()) {
              list.push(child);
            }
            continue;
          case 1:
            if (child.nodeName=="br") continue;
            if (child?.style?.display=="none") continue; // hidden
            if (["aside","li","p","div","code","span"].includes(child.nodeName)) {
              list.push(...serialize(child));
            }
          default:
        }
      }
    }
    if(typeof list == "undefined") {
      // debugger;
      console.log(list);
    }
    return list;
  }

  function flattenChapter(chapter) {
    let contentElements=[];
    let chapterElements=[];
    for (let child of chapter.children) {
      chapterElements.push(child);
    }
    for (let el of chapterElements) {
      switch(el?.tagName) {
        case "aside": // fall-through
        case "p":
          contentElements.push(...serialize(el));
          break;
        case "ul":
          contentElements.push(...flattenList(el));
          break;
      }
    }
    return contentElements;
  }

  function flattenDocument() {
    const headings = Array.from(document.getElementsByClassName('helpchapter'));
    const chapters = Array.from(document.getElementsByClassName('chapterBody'));
    const containers = [];
    for (let i=0; i<headings.length; i++) {
      containers.push(headings[i]);
      containers.push(chapters[i]);
    }
    // create array of searchable contents
    const contents=[];
    for (let el of containers ) {
      if (el.tagName=="h1") {
        contents.push(el.childNodes[0]);
      }
      if (el.classList.contains("chapterBody")) {
        contents.push(...flattenChapter(el));
      }
    }
    return contents;
  }

  async function findSearchText(searchText, repeat, backwards=false) {
    function expandChapterOf(element) {
      const containerChapter = parentChapterOf(element);
      if (!containerChapter) {
        return;
      }
      if (!containerChapter.classList) {
        // debugger;
        console.log("invalid container chapter", {element, containerChapter})
        return;
      }
      
      if (containerChapter.classList && containerChapter.classList.contains("collapsed")) {
        containerChapter.classList.remove("collapsed");
      } 
    }
    function selectRange(element, pos, text) {
      if (element.parentElement.scrollIntoView) {
        const options = {
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        };        
        element.parentElement.scrollIntoView(options);
      }
      let selection = window.getSelection();
      let range = document.createRange();
      range.setStart(element, pos);
      range.setEnd(element, pos + text.length);
      selection.removeAllRanges();
      selection.addRange(range);
      return cloneSelection(selection);       
    }

    // make all searches case insensitive for ease of use
    const text = searchText.toLocaleLowerCase();
    const allNodes = flattenDocument();
    // make a list of nodes containing the search text
    const foundElements = allNodes.filter(
      e => (e.nodeType==1 && e.textContent.toLocaleLowerCase().includes(text))
           || 
           (e.nodeType==3 && e.nodeValue.toLocaleLowerCase().includes(text)));
    if (!foundElements.length) { 
      return false;
    }
    // console.log(foundElements);

    let foundElement;
    if(!repeat) {
      foundElement = (backwards) ? foundElements[foundElements.length-1] : foundElements[0];
      const textContent = (foundElement.nodeValue || foundElement.textContent).toLocaleLowerCase();
      const startPos = textContent.indexOf(text);
      // console.log({repeat, foundElement, startPos, backwards}, textContent.substring(0,50));
      if(startPos == -1) {
        console.log("text not found - should not happen");
        return false;
      }

      // Do we need to expand the chapter?
      expandChapterOf(foundElement);
      // remember selection
      LastSelection = selectRange(foundElement, startPos, text);
      return (foundElements.length>0);
    }

    let idx = foundElements.findIndex(e => e == LastSelection.focusNode);
    let nextIdx = backwards ? idx-1 : idx+1;
    if (nextIdx >= foundElements.length) {
      nextIdx = 0;
    }
    if(nextIdx < 0) {
      nextIdx = foundElements.length-1;
    }
      
    let nextElement = foundElements[nextIdx];
    const textContent = (nextElement.nodeValue || nextElement.textContent).toLocaleLowerCase();
    const startPos = textContent.indexOf(text); // what if twice?
    if(startPos == -1) {
      console.log("text not found - should not happen");
      return false;
    }
    // console.log({repeat, nextIdx, startPos, backwards, nextElement});

    // Do we need to expand the chapter?
    expandChapterOf(nextElement);
    // remember selection
    LastSelection = selectRange(nextElement, startPos, text);
    return (foundElements.length>0);
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

  async function initSearch() {
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
            const found = await findSearchText(search);
            if (found) {
              // make sure first match is shown as selected:
              searchBox.blur();
            }
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
      await findSearchText(searchBox.value, true, backwards);
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
              let isFound = await findSearchText(search.value, true, backwards);
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
        // console.log("clicked on help");
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
    
