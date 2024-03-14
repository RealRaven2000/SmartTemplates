var hackToolbarbutton = {
  
  updateMenuMRU(menuStructure, doc, reset=false) {
    function needsConfig(menu) {
      if (!menu) return false;
      if (reset) return true;
      return (!menu.getAttribute('st4configured'));
    }    
    let thePopup = null;
    let notFound = [];
    for (let item of menuStructure) {
      // 2 new (dummy) items: mru-smartTemplates-unified & mru-smartTemplates-header
      try {
        thePopup = this.getMenupopupElement(doc, item.id);
        if (!thePopup) { // [issue 253]
          this.getApiPopupElement(doc, item.id);
        }
        if (!thePopup) {
          notFound.push(item);
          continue;
        }

        if (!needsConfig(thePopup)) {
          continue;
        }

        if (item.id.startsWith("mru-")) {
          SmartTemplate4.fileTemplates.configureMenu(
            SmartTemplate4.fileTemplates.MRU_Entries,
            thePopup, 
            item.id,    // use this as signal for MRU processing
            false       // no "show Configure.." menuitem
          );
        } else {
          SmartTemplate4.fileTemplates.configureMenu(
            SmartTemplate4.fileTemplates.Entries[item.templates], 
            thePopup, 
            item.composeType
          );
        }
          
      } catch (ex) {
        SmartTemplate4.Util.logException("updateMenuMRU()", ex);
      }
    } 
    if (notFound.length) {
      SmartTemplate4.Util.logDebugOptional("fileTemplates",
        "Didn't find any of the following popup menus:", notFound);
    }
    return thePopup; // just for testing. 
  }, 

  // enable/disable the default action of the button
  allowDefaultAction(window, buttonId, allow = true) {
    let innerButton = window.document.getElementById(`${buttonId}-inner-button`);
    if (innerButton) {
      innerButton.setAttribute("allowevents", allow ? "true" : "false");
    }
  },
  
  //check if the button still contains menuitems and downgrade the button if that is not the case anymore
  cleanupIfNeeded(doc, buttonId) {
    let button = doc.getElementById(buttonId);
    if (button) {
      let popup = button.querySelector("menupopup");
      if (popup) {
        let menuitems = popup.querySelectorAll("menuitem");
        if (menuitems.length == 0) {
          popup.remove();
          button.removeAttribute("is");
          button.removeAttribute("type");
          button.removeAttribute("wantdropmarker");

          let toolbarbutton = button.querySelector("toolbarbutton");
          if (toolbarbutton) {
            toolbarbutton.remove();
          }
          let dropmarker = button.querySelector("dropmarker");
          if (dropmarker) {
            dropmarker.remove();
          }
          
          button.querySelector("label").hidden = false;
          button.querySelector("image").hidden = false;        
        }
      }
    }      
  },
  
  getApiPopupElement(doc, menuId) {
    // smarttemplate4_thunderbird_extension-menuitem-_smartTemplates-reply-menu
    const ApiPrefix = "smarttemplate4_thunderbird_extension-menuitem-_";
    let apiSelector = `#${ApiPrefix}${menuId}`;
    let element = doc?.querySelector(apiSelector) || null;
    return element;
  },

  // get the menupopup element to add templates submenu
  getMenupopupElement(doc, menuId) {
    let parentSelector;
    let isTopLevel = false;

    switch(menuId) {
      case "mru-smartTemplates-unified":
        parentSelector = ".unified-toolbar-button [data-extension-id='smarttemplate4@thunderbird.extension']";
        isTopLevel = true;
        break;
      case "mru-smartTemplates-header":
        let el = doc.querySelector("[data-extension-id='smarttemplate4@thunderbird.extension']"); 
        isTopLevel = true;
        return el;
      default: 
        parentSelector = "#" + menuId; 
    }
    let element = doc.querySelector(parentSelector);
    if (!element) {
      return null;
    }
    if (isTopLevel) {
      return element; // [issue 263] MRU list
    } 

    // check if we need to add popup
    let popup = element.querySelector("menupopup");
    if (!popup) {
      popup = doc.createXULElement("menupopup");
      popup.setAttribute("id", `${buttonId}-popup`);
      popup.setAttribute("oncommand", "event.stopPropagation();");
      button.appendChild(popup);
    }  
    return popup;
  },


  // returns the menupopup element of the button, 
  // check if the button needs to converted beforehand and adds the menupopup element if needed first
  getMenupopupElement_Btn(doc, buttonId) {   
    let button = doc.getElementById(buttonId);
    if (!button) {
      return null;
    }

    if (!(button.hasAttribute("type") && button.getAttribute("type") == "menu-button")) {
      let origLabel = button.getAttribute("label");
      let origCommand = button.getAttribute("_command");
      
      button.setAttribute("is", "toolbarbutton-menu-button");

      // fix dropdowns working in Tb110
      let isTb110 = (SmartTemplate4.Util.versionGreaterOrEqual(SmartTemplate4.Util.Appver, "110"));
      let menuType = isTb110 ? "menu" : "menu-button";
      // hack the button, unless it already is:
      if (button.getAttribute("type") != menuType || !isTb110) {
        button.setAttribute("type", menuType);
        button.setAttribute("wantdropmarker", "true");
        button.appendChild(window.MozXULElement.parseXULToFragment(
        `<toolbarbutton
              id="${buttonId}-inner-button"
              class="box-inherit toolbarbutton-menubutton-button" 
              flex="1" 
              allowevents="true"
              command="${origCommand}"
              label="${origLabel}"/>`));    

        button.appendChild(window.MozXULElement.parseXULToFragment(
        `<dropmarker 
              type="menu-button"
              class="toolbarbutton-menubutton-dropmarker"/>`));
        
        button.querySelector("label").hidden = true;
        button.querySelector("image").hidden = true;
      }
    } 

    // check if we need to add popup
    let popup = button.querySelector("menupopup");
    if (!popup) {
      popup = doc.createXULElement("menupopup");
      popup.setAttribute("id", `${buttonId}-popup`);
      popup.setAttribute("oncommand", "event.stopPropagation();");
      button.appendChild(popup);
    }  
    return popup;
  },
  
  addMenuitem(doc, buttonId, menuitemId, attributes = null) {
    let popup = this.getMenupopupElement(doc, buttonId); 
    if (!popup)
      return null;
    
    // add menuitem
    let menuitem = doc.createXULElement("menuitem");
    menuitem.id = menuitemId;
    if (attributes) {
      for (let [attribute, value] of Object.entries(attributes)) {
        menuitem.setAttribute(attribute, value);
      }
    }  
    popup.appendChild(menuitem);
    return popup;
  },

  removeMenuitem(doc, buttonId, menuitemId) {
    let menuitem = doc.getElementById(menuitemId);
    if (menuitem) {
      menuitem.remove();
    }
    this.cleanupIfNeeded(doc, buttonId);
  },

}