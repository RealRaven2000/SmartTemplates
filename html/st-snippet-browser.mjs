// Catalog paths are relative to index.json; edited titles live only for this dialog session.
export function repositoryURL(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("The snippet repository must use HTTPS.");
  }
  if (url.search || url.hash) { throw new Error("Use a repository URL without a query or fragment."); }
  if (!url.pathname.endsWith(".json")) {
    url.pathname = url.pathname.replace(/\/?$/, "/") + "index.json";
  }
  return url.href;
}

export function assetURL(path, indexURL) {
  if (typeof path !== "string" || !path || path.includes("\\") ||
      path.split("/").some(part => !part || part === "." || part === "..") ||
      /[:?#%]/.test(path) || path.startsWith("/")) {
    throw new Error("Invalid repository path: " + path);
  }
  const base = new URL(".", indexURL);
  const url = new URL(path, base);
  if (!url.href.startsWith(base.href)) { throw new Error("Path outside repository"); }
  return url.href;
}

export function parseCatalog(data, indexURL) {
  if (data.version !== 1 || !Array.isArray(data.snippets)) {
    throw new Error("Unsupported snippet catalog format.");
  }
  const seen = new Set();
  return data.snippets.map(item => {
    if (!item.title?.trim() || typeof item.description !== "string" ||
        typeof item.category !== "string" || !/\.html?$/i.test(item.file) || seen.has(item.file)) {
      throw new Error("Invalid or duplicate snippet entry.");
    }
    seen.add(item.file);
    assetURL(item.file, indexURL);
    if (item.preview) { assetURL(item.preview, indexURL); }
    const assets = item.assets ?? [];
    if (!Array.isArray(assets)) { throw new Error("Invalid snippet assets."); }
    assets.forEach(path => assetURL(path, indexURL));
    return { ...item, assets, localTitle: item.title, localCategory: item.category, checked: false };
  });
}

async function fetchFile(url, signal) {
  const response = await fetch(url, { signal, credentials: "omit", redirect: "error" });
  if (!response.ok) { throw new Error(`Download failed (${response.status}): ${url}`); }
  return response;
}

export async function prepareImport(items, indexURL, signal, log = () => {}) {
  const paths = new Set(items.flatMap(item => [item.file, ...item.assets]));
  const files = [];
  for (const path of paths) {
    log("Downloading snippet resource", assetURL(path, indexURL));
    const bytes = new Uint8Array(await (await fetchFile(assetURL(path, indexURL), signal)).arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    files.push({ path, data: btoa(binary) });
    log("Downloaded", path, bytes.length + " bytes");
  }
  return files;
}

export function initSnippetBrowser({ onImport, onImported, log = () => {} }) {
  const dialog = document.getElementById("snippetBrowser");
  // Use pointer capture so dragging continues when the pointer leaves the handle.
  const position = (left, top, width, height) => {
    const availableWidth = Math.max(1, window.innerWidth - 16);
    const availableHeight = Math.max(1, window.innerHeight - 16);
    width = Math.min(width, availableWidth);
    height = Math.min(height, availableHeight);
    dialog.style.margin = "0";
    dialog.style.inset = "auto";
    dialog.style.left = Math.max(8, Math.min(left, window.innerWidth - width - 8)) + "px";
    dialog.style.top = Math.max(8, Math.min(top, window.innerHeight - height - 8)) + "px";
    dialog.style.width = width + "px";
    dialog.style.height = height + "px";
  };
  for (const [id, resizing] of [["snippetBrowserHeading", false], ["snippetBrowserResize", true]]) {
    const handle = document.getElementById(id);
    let gesture;
    handle.addEventListener("pointerdown", event => {
      if (event.button !== 0) { return; }
      gesture = { rect: dialog.getBoundingClientRect(), x: event.clientX, y: event.clientY, pointer: event.pointerId };
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    handle.addEventListener("pointermove", event => {
      if (!gesture || event.pointerId !== gesture.pointer) { return; }
      const { rect, x, y } = gesture;
      const dx = event.clientX - x;
      const dy = event.clientY - y;
      if (resizing) {
        const width = Math.max(Math.min(560, window.innerWidth - 16), rect.width + dx);
        const height = Math.max(Math.min(400, window.innerHeight - 16), rect.height + dy);
        position(rect.left, rect.top, Math.min(width, window.innerWidth - rect.left - 8), Math.min(height, window.innerHeight - rect.top - 8));
      } else {
        position(rect.left + dx, rect.top + dy, rect.width, rect.height);
      }
    });
    handle.addEventListener("pointerup", event => {
      if (!gesture || event.pointerId !== gesture.pointer) { return; }
      gesture = null;
      handle.releasePointerCapture(event.pointerId);
    });
    handle.addEventListener("lostpointercapture", () => { gesture = null; });
  }
  window.addEventListener("resize", () => {
    if (!dialog.open) { return; }
    const rect = dialog.getBoundingClientRect();
    position(rect.left, rect.top, rect.width, rect.height);
  });
  const list = document.getElementById("snippetCatalogList");
  const status = document.getElementById("snippetCatalogStatus");
  const add = document.getElementById("snippetCatalogAdd");
  const cancel = document.getElementById("snippetCatalogCancel");
  const close = document.getElementById("snippetBrowserClose");
  const contextMenu = document.getElementById("snippetCatalogContextMenu");
  const title = document.getElementById("snippetCatalogTitle");
  const category = document.getElementById("snippetCatalogCategory");
  const filename = document.getElementById("snippetCatalogFile");
  const description = document.getElementById("snippetCatalogDescription");
  const image = document.getElementById("snippetCatalogPreview");
  const placeholder = document.getElementById("snippetCatalogPlaceholder");
  let items = [];
  let active;
  let indexURL;
  let controller;
  let busy = false;
  const message = key => messenger.i18n.getMessage("snippets.browser." + key);
  const menuLabel = item => item.localCategory.trim()
    ? `${item.localCategory.trim()} » ${item.localTitle || item.title}`
    : item.localTitle || item.title;
  const updateAdd = () => {
    const selected = items.filter(item => item.checked);
    add.disabled = busy || !selected.length || selected.some(item => !item.localTitle.trim());
  };
  const showPreview = item => {
    active = item;
    for (const row of list.children) {
      row.classList.toggle("previewed", row.dataset.file === item.file);
    }
    filename.textContent = item.file;
    title.disabled = false;
    title.value = item.localTitle;
    category.disabled = false;
    category.value = item.localCategory;
    description.textContent = item.description;
    image.hidden = true;
    placeholder.hidden = false;
    image.removeAttribute("src");
    if (item.preview) { image.src = assetURL(item.preview, indexURL); }
  };
  image.addEventListener("load", () => {
    image.hidden = false;
    placeholder.hidden = true;
  });
  image.addEventListener("error", () => {
    image.hidden = true;
    placeholder.hidden = false;
  });
  title.addEventListener("input", () => {
    if (active) {
      active.localTitle = title.value;
      const row = Array.from(list.children).find(item => item.dataset.file === active.file);
      row.querySelector("button").textContent = menuLabel(active);
    }
    updateAdd();
  });
  category.addEventListener("input", () => {
    if (!active) { return; }
    active.localCategory = category.value;
    const row = Array.from(list.children).find(item => item.dataset.file === active.file);
    row.querySelector("button").textContent = menuLabel(active);
  });
  cancel.addEventListener("click", () => dialog.close());
  close.addEventListener("click", () => {
    if (!busy) { dialog.close(); }
  });
  dialog.addEventListener("cancel", event => {
    if (busy) { event.preventDefault(); }
  });
  dialog.addEventListener("close", () => {
    controller?.abort();
    items = [];
    active = null;
  });
  add.addEventListener("click", async () => {
    const selected = items.filter(item => item.checked);
    if (!selected.length || busy || selected.some(item => !item.localTitle.trim())) { return; }
    busy = true;
    updateAdd();
    cancel.disabled = true;
    close.disabled = true;
    contextMenu.disabled = true;
    title.disabled = true;
    category.disabled = true;
    list.inert = true;
    status.textContent = message("importing");
    try {
      const targetFolder = await messenger.Utilities.selectSnippetFolder();
      if (!targetFolder) {
        log("Add Snippets: target folder selection cancelled");
        status.textContent = "";
        return;
      }
      log("Add Snippets: target folder", targetFolder);
      log("Add Snippets: selected files", selected.map(item => item.file));
      const files = await prepareImport(selected, indexURL, controller.signal, log);
      log("Add Snippets: downloads complete, installing", files.map(file => file.path));
      await onImport(selected.map(item => ({
        file: item.file, label: item.localTitle.trim(), category: item.localCategory.trim(),
        contextMenu: contextMenu.checked,
      })), files, targetFolder);
      dialog.close();
      log("Add Snippets: complete");
      onImported?.();
    } catch (error) {
      log("Add Snippets: failed", error);
      status.textContent = message("error") + " " + error.message;
    } finally {
      busy = false;
      cancel.disabled = false;
      close.disabled = false;
      contextMenu.disabled = false;
      title.disabled = !active;
      category.disabled = !active;
      list.inert = false;
      updateAdd();
    }
  });
  return async function open() {
    if (dialog.open) { return; }
    controller = new AbortController();
    const signal = controller.signal;
    list.replaceChildren();
    filename.textContent = "";
    description.textContent = "";
    title.value = "";
    contextMenu.checked = false;
    title.disabled = true;
    category.value = "";
    category.disabled = true;
    image.hidden = true;
    image.removeAttribute("src");
    placeholder.hidden = false;
    status.textContent = message("loading");
    updateAdd();
    dialog.showModal();
    try {
      const { snippetRepositoryURL = "https://smarttemplates.quickfolders.org/repo/snippets/index.json" } =
        await messenger.storage.local.get("snippetRepositoryURL");
      if (!snippetRepositoryURL) { status.textContent = message("notConfigured"); return; }
      indexURL = repositoryURL(snippetRepositoryURL);
      log("Loading catalog", indexURL);
      const data = await (await fetchFile(indexURL, signal)).json();
      if (signal.aborted) { return; }
      items = parseCatalog(data, indexURL);
      log("Catalog loaded", items.length + " snippets");
      for (const item of items) {
        const row = document.createElement("div");
        row.className = "snippetCatalogRow";
        row.dataset.file = item.file;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.setAttribute("aria-label", item.title);
        checkbox.addEventListener("change", () => {
          item.checked = checkbox.checked;
          if (item.checked) { showPreview(item); }
          updateAdd();
        });
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = menuLabel(item);
        button.addEventListener("click", () => showPreview(item));
        row.append(checkbox, button);
        list.appendChild(row);
      }
      status.textContent = items.length ? "" : message("empty");
      if (items.length) { showPreview(items[0]); }
    } catch (error) {
      if (!signal.aborted) { status.textContent = message("error") + " " + error.message; }
    }
  };
}
