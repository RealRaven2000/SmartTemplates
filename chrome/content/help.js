
  var LastSelection;

  globalThis.containerClick = (el, evt) => {
    const element = evt.target;
    if (!element) {return;}
    // clicked a heading. none of our business
    if (element && element.classList.contains("helpchapter")) {
      return;
    }

    const classList = element.classList,
      isAddressConfig =
        (classList && classList.contains("config_default")) ||
        (element.parentElement && element.parentElement.classList.contains("config_default"));
    const tagName = element.tagName?.toLowerCase();
    if (tagName == "code" || tagName == "a" || isAddressConfig) {
      switch (tagName) {
        case "code":
          if (browser) {
            const dispatch = {
              msg: "SmartTemplate4CodeWord",
              code: element.innerText,
              class: element.className,
            };
            browser.runtime.sendMessage(dispatch);
            return;
          }
          break;
        case "button":
        case "span":
        case "lbl":
          if (browser) {
            const dispatch = {
              msg: "SmartTemplate4CAD",
              code: element.closest("code")?.innerText,
            };
            browser.runtime.sendMessage(dispatch);
            return;
          }
          break;
        default:
          if (browser) {
            const dispatch = {
              msg: "SmartTemplate4Website",
              href: element.getAttribute("href"),
            };
            browser.runtime.sendMessage(dispatch);
            return;
          }
          break;
      }
      // window.parent.document.dispatchEvent(customEvent);
    }
  };
  
  globalThis.expandAll = async (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    var allchapters = Array.from(document.getElementsByClassName('chapterBody'));
    allchapters.forEach(function(el) {
      el.classList.remove('collapsed');
    });
  };
  globalThis.collapseAll = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    var allchapters = Array.from(document.getElementsByClassName('chapterBody'));
    allchapters.forEach(function(el) {
      el.classList.add('collapsed');
    });
  };
  
  // Accordion:
  const toggleCollapseExpand = (hd, el) => {
    var isCollapsed = el.classList.contains("collapsed");
    if (isCollapsed) {
      Array.from(document.getElementsByClassName("chapterBody")).forEach((x) => {
        if (x !== el) {
          x.classList.add("collapsed");
          x.previousElementSibling.classList.remove("expanded");
        }
      });
      el.classList.remove("collapsed");
      // hd.scrollIntoView({ behavior: "smooth", block: "start" });
      hd.classList.add("expanded");
      hd.setAttribute("aria-expanded", "true");
      setTimeout(() => {
        hd.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      el.classList.add("collapsed");
      hd.classList.remove("expanded");
      hd.setAttribute("aria-expanded", "false");
    }
  };


  var mychapters = Array.from(document.getElementsByClassName("chapterBody"));
  mychapters.forEach(function(el) {
    var hd = el.previousElementSibling;

    /* alert("adding event listener: " + el.tagName + " "  + el.textContent);  */
    // Usage
    hd.addEventListener("click", () => toggleCollapseExpand(hd, el));
    hd.addEventListener("keydown", (e) => { // accessibility
      if (e.key === "Enter") {
        toggleCollapseExpand(hd, el);
      }
    });
    el.classList.add("collapsed");
  });
  

  function cloneSelection(sel) {
    if (!sel) {return null;}
    let result = {
      anchorOffset: sel.anchorOffset,
      direction: sel.direction,
      focusNode: sel.focusNode,
      focusOffset: sel.focusOffset,
      isCollapsed: sel.isCollapsed,
      rangeCount: sel.rangeCount
    }
    // type: sel.type
    return result;
  }
  globalThis.reSelectRange = (sel, focusNode, text) => {
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
  };
  
  // determine parentChapter of any element
  function parentChapterOf(el) {
    if (!el) {return null;}
    if (el.tagName?.toLowerCase()=="h1") { return el; }
    let p = el?.parentNode;
    while (p) {
      if (p.nodeType==1 && p.classList.contains("chapterBody")) {
        return p;
      }
      p = p?.parentNode;
    }
    return null; // empty list
  }

  function serialize(item) {
    //flatten an entry
    let list = [];
    if (!item.childNodes.length) {
      list.push(item);
    }
    for (let node of item.childNodes) {
      switch(node.nodeType) {
        case 3:
          if (!node.textContent.trim()) { continue; }
          if (/^\s*$/.test(node.textContent)) { // empty!
            continue;
          }
          list.push(node);
          break;
        case 1:
          if (node.tagName.toLowerCase() === "br") { continue; } // skip <br>
          list.push(...serialize(node));
      }
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
          case 1: {
            const tag = child.tagName.toLowerCase();
            if (tag == "br") {continue;}
            if (child?.style?.display=="none") {continue;} // hidden
            if (tag == "tr") {
              list.push(...flattenList(child));
            }
            if (["aside","li","p","div","code","span","th","td"].includes(tag)) {
              list.push(...serialize(child));
            }
          }
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
      const tag = el.tagName?.toLowerCase();
      switch (tag) {
        case "aside": // fall-through
        case "p":
          contentElements.push(...serialize(el));
          break;
        case "table":
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
      const tag = el.tagName?.toLowerCase();
      if (tag == "h1") {
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
      (e) =>
        (e.nodeType == 1 && e.textContent.toLocaleLowerCase().replace(/\s+/g, " ").includes(text)) ||
        (e.nodeType == 3 && e.nodeValue.toLocaleLowerCase().replace(/\s+/g, " ").includes(text))
    );
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

  globalThis.fixClipboardNote = () => {
    let note1 = document.getElementById("clipboardNotes");
    if (!note1) {
      return;
    }
    const text = note1.textContent;
    note1.textContent = "";

    // Split on placeholders, keep them in result
    const parts = text.split(/(\{file\}|\{toclip\})/);

/*  [issue 393] Original Code
    note1.innerHTML = note1.textContent
      .replace("{file}", "<code>%file()%</code>")
      .replace("{toclip}", "<span class='paramLiteral'>toclipboard</span>");
 */

    for (let part of parts) {
      switch (part) {
        case "{file}": {
          const codeEl = document.createElement("code");
          codeEl.textContent = "%file()%";
          note1.appendChild(codeEl);
          break;
        }
        case "{toclip}": {
          const spanEl = document.createElement("span");
          spanEl.className = "paramLiteral";
          spanEl.textContent = "toclipboard";
          note1.appendChild(spanEl);
          break;
        }
        default:
          // Regular text
          note1.appendChild(document.createTextNode(part));
      }    
    }

  };

  function findNextChapterBody(el) {
    let sibling = el.nextElementSibling;
    while (sibling) {
      if (sibling.classList.contains("chapterBody")) {
        return sibling;
      }
      sibling = sibling.nextElementSibling;
    }
    return null; // No more chapterBody elements
  }

  globalThis.initSearch = () => {
    const searchBox = document.getElementById("search");
    if (searchBox) {
      // we are using the tabindex=-1 hack to make the list items searchable even if the user highlights text or 
      // clicks into the help contents. Note that contentEditable doesn't work here.
      searchBox.addEventListener("keydown", async (event) => {
        // if (await isDebugLegacyOption()) { console.log("searchbox keydown:", event); }
        const noShenanigans = (e) => {
          e.preventDefault();
          e.stopPropagation();
        }
        let target = event.target;
        switch (event.code) {
          case "NumpadEnter": // search next
          case "Enter": {
            // search start - how do we prevent [OK] from catching this???
            const search = target.value;
            noShenanigans(event);
            const found = await findSearchText(search);
            if (found) {
              // make sure first match is shown as selected:
              searchBox.blur();
            }
            document.getElementById("findnext").style.display="inline-block";
            document.getElementById("findprevious").style.display="inline-block";
          } break;
          case "Escape":
            noShenanigans(event);
            target.blur();
            document.getElementById("searchHelpContent").classList.add("hidden");
            document.getElementById("findnext").style.display="none";
            document.getElementById("findprevious").style.display="none";
            break;
          case "Tab": {
            const hFirst = document.querySelector("#startHeading");
            noShenanigans(event);
            // console.log(getEventListeners(searchBox).blur); // chrome only
            searchBox.blur();
            setTimeout(() => {
              hFirst.focus();
              console.log("Focus check!", document.activeElement, hFirst);
            }, 30);
          } break;
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
        async (_evt) => {
          findRepeat(true); 
        }
      );
    }
    const findnext = document.getElementById("findnext");
    if (findnext) {
      findnext.addEventListener("mouseup",
        async (_evt) => {
          findRepeat(false);
        }
      );
    }

    const isDebug = true;
    let container = document.getElementById("helpContents");
    if (container) {
      container.addEventListener("keydown", async (event) => {
        if (isDebug) {
          const targ = event.target;
          const txt =
            targ?.tagName == "H1"
              ? targ.textContent
              : `${targ.tagName} ${targ.getAttribute("Name")}`;
          console.log("helpContents frame", txt, event);
        }
        switch (event.code) {
          case "F4": {
            event.preventDefault();
            event.stopPropagation();
            let backwards = (event.shiftKey);
            let search = document.getElementById("search");
            if (!search.value) {
              // fix lost focus problem
              // event.originalTarget.ownerDocument.body.focus();
              // search.focus();
              search.focus();
              return;
            }
            // event.originalTarget.ownerDocument.body.focus();
            let isFound = await findSearchText(search.value, true, backwards);
            document.getElementById("searchHelpContent").classList.add("hidden");
            if (!isFound) { return; }
            let el = LastSelection.focusNode.parentElement;
            for (; el; el = el.parentElement) { // continue untill no parents
              // we mean it.
              if (!el.classList) {
                continue;
              }
              if (
                el.classList.contains("chapterBody") ||
                el.classList.contains("cursorNavigate")
              ) {
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
          } break;
          case "ArrowDown": {
            if (!event.target?.classList.contains("helpchapter")) {
              break;
            }
            // go to first chapter next sibling element and focus first .cursorNavigate child
            const nextChapterBody = findNextChapterBody(event.target);
            if (!nextChapterBody) {break;}
            const firstCursorNavigate = nextChapterBody?.querySelector(".cursorNavigate");
            if (!firstCursorNavigate) {break;}
            if (isDebug) {
              console.log("Focusing 1st found .cursorNavigate element:", firstCursorNavigate.textContent);
            }
            firstCursorNavigate.focus();
          } break;
          case "KeyF": { // CTRL+F for find
            if (event.metaKey) {break;}
            if (event.altKey) {break;}
            if (!event.ctrlKey) {break;}
            event.preventDefault();
            event.stopPropagation();
            const srch = document.getElementById("search");
            srch.focus();
          } break;
        }
      });
    }    

    let helpSearch = document.getElementById("fq-variables-search-help");
    if (helpSearch) {
      helpSearch.textContent = " ";
      // QuickFolders.Interface.quickMoveHelp(this);
      helpSearch.addEventListener("click", (_event) => {
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
      const text = helpContent.textContent;
      helpContent.textContent = "";

/* [issue 393] Original Code
      helpContent.innerHTML = helpContent.textContent
        .replaceAll("{{", "<span class='key'>")
        .replaceAll("}}", "</span>");
 */
      const parts = text.split(/(\{\{.*?\}\})/);
      for (let part of parts) {
        if (part.startsWith("{{") && part.endsWith("}}")) {
          const span = document.createElement("span");
          span.className = "key";
          span.textContent = part.slice(2, -2); // strip {{ }}
          helpContent.appendChild(span);
        } else if (part) {
          helpContent.appendChild(document.createTextNode(part));
        }
      }      

    }    
  };

  function findOrigin() {
    const url = new URL(document.URL);
    const scriptParams = Object.fromEntries(url.searchParams)
    // console.log(scriptParams);
    return scriptParams["context"] || null;
  }

  globalThis.isContextXML = () => { // helper function to see if we are in the old dialog
    return (findOrigin() != "html");
  };
  
  globalThis.showActiveElement = (txt) => {
    const color="white", background="rgb(80,0,0)";
    console.log(`%c${txt} - Active element:`, `color: ${color}; background: ${background}`, document.activeElement, document.activeElement?.textContent.substring(0,25));
  };

