/* load help.js first */

/* 
  global 
    i18n: readonly,
    fixClipboardNote: readonly,
    initSearch: readonly,
    expandAll: readonly,
    collapseAll: readonly,
    containerClick,
    findOrigin
*/


// this one was written by chatGPT. (I was lazy and ran out of time :) 
// but at least we avoid assigning content to innerHTML!    <:)
function replacePlaceholdersWithSpans(element, placeholders, classNames) {
  const xhtmlNamespace = document.documentElement.namespaceURI || "http://www.w3.org/1999/xhtml";

  // Create a new document fragment to build the new content
  const fragment = document.createDocumentFragment();
  
  // Loop over all child nodes of the element (text nodes and spans)
  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Process the text node for placeholders
      let textContent = node.textContent;
      let currentIndex = 0;

      while (currentIndex < textContent.length) {
        let nextPlaceholderIndex = -1;
        let matchedPlaceholder = "";
        let matchedClassName = "";

        // Find the next placeholder
        placeholders.forEach((placeholder, index) => {
          const idx = textContent.indexOf(placeholder, currentIndex);
          if (idx !== -1 && (nextPlaceholderIndex === -1 || idx < nextPlaceholderIndex)) {
            nextPlaceholderIndex = idx;
            matchedPlaceholder = placeholder;
            matchedClassName = classNames[index];
          }
        });

        // If no placeholder is found, append the rest of the text and stop
        if (nextPlaceholderIndex === -1) {
          fragment.append(document.createTextNode(textContent.slice(currentIndex)));
          break;
        }

        // Append text before the next placeholder
        fragment.append(document.createTextNode(textContent.slice(currentIndex, nextPlaceholderIndex)));

        // Create a span element for the placeholder
        const span = document.createElementNS(xhtmlNamespace, "span");
        span.className = matchedClassName;
        span.textContent = matchedPlaceholder.replace(/^\{|\}$/g, ""); // Remove curly braces

        fragment.append(span);

        // Move index past the placeholder
        currentIndex = nextPlaceholderIndex + matchedPlaceholder.length;
      }
    } else {
      // If it's not a text node (like a <span>), just append it as-is
      fragment.append(node);
    }
  });

  // Replace the content with the updated fragment
  element.textContent = ""; // Clear existing content
  element.appendChild(fragment);
}

function isVisible(el) {
  return el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

async function initHTML() {
  console.log("help-html.js init()");
  const isDebugLegacyOption = async function () {
    const isDebug = await messenger.LegacyPrefs.getPref(
      "extensions.smartTemplate4.debug.variables.search"
    );
    return isDebug;
  };

  i18n.updateDocument(); // parent doc must have loaded ../chrome/content/i18n.js
  // update every text that contains params
  const params = document.querySelectorAll(".containsParams");
  const reg = /\{[^}]+\}/; // {parameter}
  for (let p of params) {
    const text = p.innerHTML; // Use innerHTML to ensure we check the full content
    if (!reg.test(text)) continue; // Skip if no placeholders found
    replacePlaceholdersWithSpans(
      p,
      ["{attribute=value}", "{imagePath}", "%file(images/test.jpg)%", "{[[Cc: %cc(name)%]]}", "{%cc(name)%}"], 
      ["paramLiteral", "paramLiteral", "codeExample", "codeExample", "codeExample"]
    );
  }
    

  let fs = document.getElementById("tagFormatString");
  replacePlaceholdersWithSpans(fs, ["$label$", "$color$"], ["paramLiteral", "paramLiteral"]);

  // functions from help.js
  fixClipboardNote();
  initSearch();
  const expander = document.getElementById("allexpander");
  const collapser = document.getElementById("collapseAll");
  expander.addEventListener("click", (evt) => {
    expandAll(evt);
    collapser.classList.remove("collapsed");
    expander.classList.add("collapsed");
  });
  collapser.addEventListener("click", (evt) => {
    collapseAll(evt);
    collapser.classList.add("collapsed");
    expander.classList.remove("collapsed");
  });

  const helpContents = document.getElementById("helpContents");
  if (!helpContents) return;
  helpContents.addEventListener("click", (evt) => {
    containerClick(helpContents, evt);
  });

  let chapterHeads = document.querySelectorAll("h1.helpchapter");
  let chapterCount = 1;
  for (const heading of chapterHeads) {
    heading.setAttribute("tabIndex", chapterCount++);
    heading.setAttribute("aria-expanded","false");
  }

  // make chapter contents keyboard friendly
  const navigableItems = document.querySelectorAll(".cursorNavigate");
  const items = Array.from(navigableItems);

  navigableItems.forEach((item) => {
    item.setAttribute("tabIndex", -1); // focus-able, but only through code / cursor keys:
    item.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        let index = items.indexOf(item);
        const currentChapter = item.closest(".chapterBody");
        let next = items[index + 1];
        // check for chapter boundaries!
        if (next && next.closest(".chapterBody") !== currentChapter) {
          next = null; // No valid next item in this chapter
        }

        while (next && (!isVisible(next) || next.closest(".chapterBody") !== currentChapter)) {
          next = items[++index];
        }

        if (next) {
          e.preventDefault(); // Prevent page scrolling
          next.focus();
          return;
        }

        e.preventDefault(); // Prevent page scrolling
        // goto next chapter heading
        let p = item.parentNode;
        while (p && !p.classList?.contains("chapterBody")) {
          p = p.parentNode;
        }
        if (!p) return;
        let n = p.nextElementSibling;
        while (n && !n.classList?.contains("helpchapter")) {
          n = n.nextElementSibling;
        }
        if (!n) return;
        n.focus();
      } else if (e.key === "ArrowUp") {
        let index = items.indexOf(item);
        const currentChapter = item.closest(".chapterBody");
        let prev = items[index - 1];

        // Skip invisible items and prevent crossing chapters
        while (prev && (!isVisible(prev) || prev.closest(".chapterBody") !== currentChapter)) {
          prev = items[--index];
        }

        if (prev) {
          e.preventDefault();
          prev.focus();
          return;
        }

        // Move to previous chapter heading
        let prevChapter = currentChapter?.previousElementSibling;
        while (prevChapter && !prevChapter.classList.contains("helpchapter")) {
          prevChapter = prevChapter.previousElementSibling;
        }
        if (prevChapter) {
          e.preventDefault();
          prevChapter.focus();
        }
      }
    });
  });  
}


if (findOrigin() == "html") {
  // this was called from settings.html (and not from the XUL dialog)
  initHTML();
}

