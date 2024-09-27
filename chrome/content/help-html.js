/* load help.js first */

// this one was written by chatGPT. (I was lazy and ran out of time :) 
// but at least we avoid assigning content to innerHTML!    <:)
function replacePlaceholdersWithSpans(element, placeholders, classNames) {
  const textContent = element.textContent;
  const fragment = document.createDocumentFragment();

  // Get the XHTML namespace from the document's root element
  const xhtmlNamespace = document.documentElement.namespaceURI || "http://www.w3.org/1999/xhtml";

  let currentIndex = 0; // Start index for splitting text

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

    // Create a span element in the correct namespace for XHTML
    const span = document.createElementNS(xhtmlNamespace, "span");
    span.className = matchedClassName;
    span.textContent = matchedPlaceholder;
    fragment.append(span);

    // Move index past the placeholder
    currentIndex = nextPlaceholderIndex + matchedPlaceholder.length;
  }

  // Replace the content with the updated fragment
  element.textContent = ""; // Clear existing content
  element.appendChild(fragment);
}

async function initHTML() {
  console.log("help-html.js init()");
  isDebugLegacyOption = async function () {
    const isDebug =  await messenger.LegacyPrefs.getPref("extensions.smartTemplate4.debug.variables.search")
    return isDebug;
  }

  i18n.updateDocument(); // parent doc must have loaded ../chrome/content/i18n.js
  let fs = document.getElementById("tagFormatString");
  replacePlaceholdersWithSpans(fs, ["$label$", "$color$"], ["paramLiteral", "paramLiteral"]);
  
  // functions from help.js
  fixClipboardNote(); 
  initSearch();
  const expander = document.getElementById("allexpander");
  const collapser = document.getElementById("collapseAll");
  expander.addEventListener("click", evt => {
    expandAll(evt);
    collapser.classList.remove('collapsed');
    expander.classList.add('collapsed');

  });
  collapser.addEventListener("click", evt => {
    collapseAll(evt);
    collapser.classList.add('collapsed');
    expander.classList.remove('collapsed');
  });

  helpContents = document.getElementById("helpContents");
  if (!helpContents) return;
  helpContents.addEventListener("click",
    (evt) => {
      containerClick(helpContents, evt);
    }
  );
  
}


if (findOrigin() == "html") {
  // this was called from settings.html (and not from the XUL dialog)
  initHTML();
}

