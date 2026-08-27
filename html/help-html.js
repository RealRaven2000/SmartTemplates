/* load help.js first */

/* 
  global 
    fixClipboardNote: readonly,
    initSearch: readonly,
    expandAll: readonly,
    collapseAll: readonly,
    containerClick,
    findOrigin
*/


/**
 * Replaces placeholders in a container element with styled spans (or other semantic tags) without using innerHTML.
 *
 * Each placeholder in the `placeholders` array is searched for in the text nodes of the given `element`.
 * When found, it is wrapped in a new element (default: <span>) with a class name specified in `classNames`.
 * Optionally, you can limit wrapping to the first occurrence of each placeholder with `options.firstOnly`.
 *
 * @param {HTMLElement} element - The container element whose text nodes will be processed.
 * @param {string[]} placeholders - Array of placeholder strings to wrap (e.g., ["$label$", "$color$"]).
 * @param {string[]} classNames - Array of class names corresponding to each placeholder. Must match the length of `placeholders`.
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.firstOnly=false] - If true, each placeholder is wrapped only once per container.
 *
 * @example
 * // Wrap each priority value once in paramLiteral spans
 * const priorities = ["highest", "high", "normal", "low", "lowest"];
 * replacePlaceholdersWithSpans(priorityElement, priorities, priorities.map(() => "paramLiteral"), { firstOnly: true });
 *
 * @note
 * - Existing HTML elements inside `element` (like other spans) are preserved.
 * - Commas, spaces, and other non-placeholder text remain untouched.
 * - Fully compatible with flattening/search algorithms that operate on text nodes.
 */
function replacePlaceholdersWithSpans(element, placeholders, classNames, options = {}) {
  const xhtmlNamespace = document.documentElement.namespaceURI || "http://www.w3.org/1999/xhtml";
  const firstOnly = options.firstOnly || false;
  const wrapped = new Set(); // Track placeholders already wrapped (for firstOnly)

  const fragment = document.createDocumentFragment();

  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let textContent = node.textContent;
      let currentIndex = 0;

      while (currentIndex < textContent.length) {
        let nextPlaceholderIndex = -1;
        let matchedPlaceholder = "";
        let matchedClassName = "";

        placeholders.forEach((placeholder, index) => {
          if (firstOnly && wrapped.has(placeholder)) {
            // skip if already wrapped. avoids partial rematching (low, lowest)
            return;
          }

          const idx = textContent.indexOf(placeholder, currentIndex);
          if (idx !== -1 && (nextPlaceholderIndex === -1 || idx < nextPlaceholderIndex)) {
            nextPlaceholderIndex = idx;
            matchedPlaceholder = placeholder;
            matchedClassName = classNames[index];
          }
        });

        if (nextPlaceholderIndex === -1) {
          fragment.append(document.createTextNode(textContent.slice(currentIndex)));
          break;
        }

        fragment.append(document.createTextNode(textContent.slice(currentIndex, nextPlaceholderIndex)));

        const span = document.createElementNS(xhtmlNamespace, "span");
        span.className = matchedClassName;
        span.textContent = matchedPlaceholder.replace(/^\{|\}$/g, ""); 

        fragment.append(span);

        if (firstOnly) {
          // mark as wrapped
          wrapped.add(matchedPlaceholder);
        }

        currentIndex = nextPlaceholderIndex + matchedPlaceholder.length;
      }
    } else {
      fragment.append(node);
    }
  });

  element.textContent = "";
  element.appendChild(fragment);
}


function isVisible(el) {
  return el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

async function isDebug() {
  const { debug = {} } = await browser.storage.local.get({ debug: {} });
  return debug.debugActive ?? false;
}

async function initHTML() {
  if (await isDebug()) {
    console.log("help-html.js init()");
  }

  i18n.updateDocument(); // parent doc must have loaded i18n.js
  // update every text that contains params
  const params = document.querySelectorAll(".containsParams");
  const reg = /\{[^}]+\}/; // {parameter}
  for (let p of params) {
    const text = p.innerHTML; // Use innerHTML to ensure we check the full content
    if (!reg.test(text)) {continue}; // Skip if no placeholders found
    replacePlaceholdersWithSpans(
      p,
      ["{attribute=value}", "{imagePath}", "%file(images/test.jpg)%", "{[[Cc: %cc(name)%]]}", "{%cc(name)%}"], 
      ["paramLiteral", "paramLiteral", "codeExample", "codeExample", "codeExample"]
    );
  }
    

  let fs = document.getElementById("tagFormatString");
  replacePlaceholdersWithSpans(fs, ["$label$", "$color$"], ["paramLiteral", "paramLiteral"]);

  // style lists of literal parameters
  document.querySelectorAll(".literalParamList").forEach((container) => {
    // Only wrap text nodes, skip existing spans
    const values = container.textContent.split(",").map((v) => v.trim());
    replacePlaceholdersWithSpans(
      container,
      values,
      values.map(() => "paramLiteral"),
      { firstOnly: true }
    );
  });


  // functions from help.js
  fixClipboardNote();
  initSearch();
  const expander = document.getElementById("allexpander");
  const collapser = document.getElementById("collapseAll");
  expander.querySelector("a").addEventListener("click", (evt) => {
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
  if (!helpContents) {return;}
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
        if (!p) {return;}
        let n = p.nextElementSibling;
        while (n && !n.classList?.contains("helpchapter")) {
          n = n.nextElementSibling;
        }
        if (!n) {return;}
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

