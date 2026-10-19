"use strict";

// No experiments, injected scripts, template processing, storage, or file access.
// Menu creation occurs once when this test extension starts.
browser.menus.onShown.addListener((info, tab) => {
  console.log("[ComposeMenuTest] shown " + JSON.stringify({
    time: Date.now(), contexts: info.contexts, menuIds: info.menuIds,
    tabId: tab?.id, windowId: tab?.windowId,
  }));
});

browser.menus.onHidden.addListener(() => {
  console.log("[ComposeMenuTest] hidden " + JSON.stringify({ time: Date.now() }));
});

browser.menus.onClicked.addListener((info, tab) => {
  console.log("[ComposeMenuTest] clicked " + JSON.stringify({
    time: Date.now(), menuItemId: info.menuItemId, tabId: tab?.id,
  }));
});

browser.menus.removeAll().then(() => {
  for (const item of [
    { id: "test-root", title: "Compose Menu Test" },
    { id: "test-category", parentId: "test-root", title: "Layout" },
    { id: "test-snippet", parentId: "test-category", title: "Test snippet" },
  ]) {
    browser.menus.create({ ...item, contexts: ["compose_body"] }, () => {
      const error = browser.runtime.lastError;
      if (error) {
        console.error("[ComposeMenuTest] creation failed", item.id, error.message);
      } else {
        console.log("[ComposeMenuTest] created", item.id);
      }
    });
  }
}).catch(error => console.error("[ComposeMenuTest] startup failed", error));
