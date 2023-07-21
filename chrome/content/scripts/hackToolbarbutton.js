var hackToolbarbutton = {
  
  updateMenuMRU(menuStructure, doc, reset=false) {
    function needsConfig(menu) {
      if (!menu) return false;
      if (reset) return true;
      return (!menu.getAttribute('st4configured'));
    }    
    for (let item of menuStructure) {
      let thePopup = this.getMenupopupElement(doc, item.id);
      if (thePopup && needsConfig(thePopup)) {
        SmartTemplate4.fileTemplates.configureMenu(
          SmartTemplate4.fileTemplates.Entries[item.templates], 
          thePopup, 
          item.composeType
        );
      }            
    }            
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
  
  // get the menupopup element to add templates submenu
  getMenupopupElement(doc, menuId) {   
    let element = doc.getElementById(menuId);
    if (!element) {
      return null;
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
      let origCommand = button.getAttribute("command");
      
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