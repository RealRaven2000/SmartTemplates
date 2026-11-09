// Runs in the background page. The renderer is a standard composer content script.
export function createComposePrompts(api) {
  const command = "composePrompt";
  const pending = new Map();
  let nextId = 0;
  let registration;

  function model(request) {
    return {
      id: request.id,
      caption: api.i18n.getMessage("prompt.caption"),
      explanation: request.data.explanation,
      defaultValue: request.data.defaultValue,
      choices: [...request.data.choices],
      accept: api.i18n.getMessage("accept_button"),
      cancel: api.i18n.getMessage("cancel_button"),
    };
  }

  function finish(tabId, answer) {
    const request = pending.get(tabId);
    if (!request) {
      return false;
    }
    pending.delete(tabId);
    request.resolve(answer);
    return true;
  }

  function onMessage(data, sender) {
    if (data?.command !== command || sender.tab?.type !== "messageCompose") {
      return false;
    }
    const tabId = sender.tab.id;
    const request = pending.get(tabId);
    if (data.action === "ready") {
      return Promise.resolve(request ? model(request) : null);
    }
    if (data.action === "complete" && request?.id === data.id &&
        (data.answer === null || (typeof data.answer === "string" && data.answer.length &&
          (!request.data.choices.length || request.data.choices.includes(data.answer))))) {
      return Promise.resolve(finish(tabId, data.answer));
    }
    return Promise.resolve(false);
  }

  const onRemoved = tabId => { finish(tabId, null); };

  return {
    async show({ windowId, prompt }) {
      if (!Number.isInteger(windowId)) {
        throw new Error("Missing prompt composer window ID");
      }
      const tabs = await api.tabs.query({ windowId, type: "messageCompose" });
      if (tabs.length !== 1) {
        throw new Error("Could not uniquely identify the prompt composer");
      }
      const tabId = tabs[0].id;
      if (pending.has(tabId)) {
        throw new Error("A template prompt is already open for this composer");
      }
      let resolve;
      const result = new Promise(done => { resolve = done; });
      const request = { id: ++nextId, data: prompt, resolve };
      pending.set(tabId, request);
      try {
        await api.tabs.sendMessage(tabId, { command, model: model(request) });
      } catch {
        // Startup can precede script injection. Its ready message pulls pending data.
        // Check the tab still exists so a closed composer cannot leave a pending answer.
        let remaining;
        try {
          remaining = await api.tabs.query({ windowId, type: "messageCompose" });
        } catch (error) {
          finish(tabId, null);
          throw error;
        }
        if (!remaining.some(tab => tab.id === tabId)) {
          finish(tabId, null);
        }
      }
      return result;
    },

    async start() {
      api.runtime.onMessage.addListener(onMessage);
      api.tabs.onRemoved.addListener(onRemoved);
      registration = await api.composeScripts.register({
        js: [{ file: "html/prompt/compose.js" }],
      });
      for (const tab of await api.tabs.query({ type: "messageCompose" })) {
        await api.tabs.executeScript(tab.id, { file: "html/prompt/compose.js" }).catch(error => {
          console.warn("[ST443] Could not initialize composer prompt", tab.id, error);
        });
      }
    },

    async stop() {
      api.runtime.onMessage.removeListener(onMessage);
      api.tabs.onRemoved.removeListener(onRemoved);
      for (const tabId of pending.keys()) {
        await api.tabs.sendMessage(tabId, { command, action: "dismiss" }).catch(() => {});
        finish(tabId, null);
      }
      await registration?.unregister();
    },
  };
}
