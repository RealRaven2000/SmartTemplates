/* eslint-disable object-shorthand */
const { setTimeout, clearTimeout } = ChromeUtils.importESModule(
  "resource://gre/modules/Timer.sys.mjs"
);


var { ExtensionCommon } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionCommon.sys.mjs"
);
var { MailServices } =  ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");

var Services = globalThis.Services || ChromeUtils.import(
	"resource://gre/modules/Services.jsm"
	).Services;


// might be better to get the parent window of the current window
// because we may be screwed otherwise.
var win = Services.wm.getMostRecentWindow("mail:3pane"); 

var Utilities = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {    

    return {
      Utilities: {
        collapseTimeout: null, // timeout id for gathering save timeouts
        UPDATE_INTERVAL: 2000,

        async selectSnippetFolder() {
          const parent = Services.wm.getMostRecentWindow("mail:3pane");
          const util = parent.SmartTemplate4.Util;
          const prefs = parent.SmartTemplate4.Preferences;
          const picker = Components.classes["@mozilla.org/filepicker;1"]
            .createInstance(Components.interfaces.nsIFilePicker);
          picker.init(util.getFileInitArg(parent), util.getBundleString("snippets.browser.targetFolder"), picker.modeGetFolder);
          const remembered = prefs.getStringPref("fileTemplates.path");
          if (remembered) {
            try {
              const directory = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsIFile);
              directory.initWithPath(remembered);
              if (directory.exists() && directory.isDirectory()) { picker.displayDirectory = directory; }
            } catch (error) {
              util.logDebugOptional("snippets.remote", "Cannot use remembered snippet folder", remembered, error);
            }
          }
          const result = await new Promise(resolve => picker.open(resolve));
          if (result !== Components.interfaces.nsIFilePicker.returnOK || !picker.file) { return ""; }
          prefs.setStringPref("fileTemplates.path", picker.file.path);
          util.logDebugOptional("snippets.remote", "Selected target folder", picker.file.path);
          return picker.file.path;
        },

        // MailExtension file downloads cannot write an arbitrary asset tree to the chosen folder.
        // Preserve the repository layout and confirm before replacing local edits.
        async installSnippetFiles(files, targetFolder) {
          const { ExtensionUtils } = ChromeUtils.importESModule("resource://gre/modules/ExtensionUtils.sys.mjs");
          const log = (...args) => win.SmartTemplate4.Util.logDebugOptional("snippets.remote", ...args);
          let stage = "validate files";
          const createdFiles = [];
          const replacedFiles = [];
          try {
            log("installSnippetFiles: start", files.map(file => file.path));
            if (!files.length) { throw new Error("No snippet files to install."); }
            const relativeParts = files.map(file => {
              const parts = file.path.split("/");
              if (parts.some(part => !part || part === "." || part === ".." ||
                  /[\\:*?"<>|%\x00-\x1f]/.test(part) || /[. ]$/.test(part))) {
                throw new Error("Invalid snippet asset path.");
              }
              return parts;
            });
            stage = "validate target folder";
            const directory = Components.classes["@mozilla.org/file/local;1"]
              .createInstance(Components.interfaces.nsIFile);
            directory.initWithPath(targetFolder);
            if (!directory.exists() || !directory.isDirectory()) { throw new Error("Target folder does not exist."); }
            const root = directory.path;
            const prepared = [];
            // Check the entire batch before creating files, so a conflict changes nothing.
            for (let index = 0; index < files.length; index++) {
              const path = PathUtils.join(root, ...relativeParts[index]);
              stage = "check " + files[index].path;
              const binary = Services.wm.getMostRecentWindow("mail:3pane").atob(files[index].data);
              const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
              const exists = await IOUtils.exists(path);
              const existing = exists ? await IOUtils.read(path) : null;
              const changed = exists && (existing.length !== bytes.length || existing.some((value, i) => value !== bytes[i]));
              prepared.push({ path, bytes, exists, existing, changed });
            }
            const conflicts = prepared.filter(file => file.changed);
            if (conflicts.length) {
              const localize = key => context.extension.localeData.localizeMessage(key);
              const approved = Services.prompt.confirm(
                Services.wm.getMostRecentWindow("mail:3pane"),
                localize("snippets.browser.overwriteTitle"),
                localize("snippets.browser.overwritePrompt") + "\n\n" + conflicts.map(file => file.path).join("\n")
              );
              if (!approved) { return { paths: [], conflicts: conflicts.map(file => file.path) }; }
            }
            for (const { path, bytes, exists, existing, changed } of prepared) {
              if (exists && !changed) { log("Reusing identical file", path); continue; }
              stage = "install " + path;
              log(stage, path);
              await IOUtils.makeDirectory(PathUtils.parent(path), { ignoreExisting: true, createAncestors: true });
              if (changed) { replacedFiles.push({ path, bytes: existing }); }
              await IOUtils.write(path, bytes, { mode: changed ? "overwrite" : "create" });
              if (!exists) { createdFiles.push(path); }
              log("installed", path, bytes.length + " bytes");
            }
            const paths = prepared.map(file => file.path);
            log("installSnippetFiles: complete", paths);
            return { paths, conflicts: [] };
          } catch (error) {
            log("installSnippetFiles: failed at " + stage, error);
            for (const { path, bytes } of replacedFiles.reverse()) {
              try {
                await IOUtils.write(path, bytes, { mode: "overwrite" });
              } catch (restoreError) {
                log("Failed to restore overwritten snippet", path, restoreError);
              }
            }
            for (const path of createdFiles.reverse()) {
              try {
                await IOUtils.remove(path, { ignoreAbsent: true });
              } catch (cleanupError) {
                log("Failed to remove incomplete download", cleanupError);
              }
            }
            throw new ExtensionUtils.ExtensionError(`Snippet import (${stage}): ${error.message}`);
          }
        },

        logDebug(text) {
          win.SmartTemplate4.Util.logDebug(text);
        },

        showToolbarPopup: function () {
          let win = Services.wm.getMostRecentWindow("mail:3pane");
          win.SmartTemplate4.Util.showToolbarPopup();
        },

        getUserName: function () {
          for (let account of MailServices.accounts.accounts) {
            if (account.defaultIdentity) {
              let name = account.defaultIdentity.fullName;
              if (name) {
                return name;
              }
            }
          }
          return "user"; // anonymous
        },

        showVersionHistory: function () {
          win.SmartTemplate4.Util.showVersionHistory(false); // no prompt before showing
        },

        showXhtmlPage: function (uri) {
          let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane");
          mail3PaneWindow.openDialog(uri).focus();
        },

        getCommandsEnabled: async function (commands, tabId) {
          // Get a real tab from a tab ID:
          let tabObject = context.extension.tabManager.get(tabId);
          // let realTab = tabObject.nativeTab;
          let realTabWindow = tabObject.window;

          let results = [];
          if (typeof realTabWindow.getEnabledControllerForCommand == "function") {
            for (let cmd of commands) {
              let ctrl = realTabWindow.getEnabledControllerForCommand(cmd);
              if (!ctrl) {
                results.push(false);
                continue;
              }
              results.push(ctrl.isCommandEnabled(cmd));
            }
          } else {
            // eslint-disable-next-line no-unused-vars
            for (let _cmd of commands) {
              results.push(true); // default to true in case this fails
            }
          }

          return results;
        },

        insertSnippet: async function (tabId, entry) {
          const composeWindow = context.extension.tabManager.get(tabId).window;
          if (composeWindow?.document.documentElement.getAttribute("windowtype") !== "msgcompose" ||
              !composeWindow.gMsgCompose?.editor) {
            throw new Error("Snippet insertion requires an open compose tab.");
          }
          const fileTemplates = composeWindow.SmartTemplate4?.fileTemplates;
          if (typeof fileTemplates?.insertFileEntryInComposer !== "function") {
            throw new Error("SmartTemplates is not ready in this compose window.");
          }
          await fileTemplates.insertFileEntryInComposer({
            path: entry.path, label: entry.label, category: entry.category || "",
          });
        },

        beforeSend: async function (tabId, composeDetails) {
          // [issue 284] tidy up all fields when user hits [Send] button
          let tabObject = context.extension.tabManager.get(tabId);
          let realTabWindow = tabObject.window;
          let rv = await realTabWindow.SmartTemplate4.composer.beforeSend(composeDetails);
          return rv;
        },

        readTemplateMenus: async function () {
          // replaces SmartTemplate4.fileTemplates.readStringFile()
          let profileDir = PathUtils.profileDir,
            path = PathUtils.join(profileDir, "extensions", "smartTemplates.json"),
            isExist = await IOUtils.exists(path);
          if (!isExist) {
            // [issue 227] default smartTemplates.json data
            let defaultContent = `{
              "templatesNew": [
              ],
              "templatesRsp": [
              ],
              "templatesFwd": [
              ],
              "snippets": [
              ]
            }
            `;
            return JSON.parse(defaultContent);
          }
          let promise = IOUtils.readJSON(path, { encoding: "utf-8" }); // Read the complete file as an json object

          return promise;
        },

        updateTemplates: async function (entries, immediate = false) {
          if (this.collapseTimeout) {
            clearTimeout(this.collapseTimeout);
          }

          if (immediate) {
            this.logDebug("SmartTemplates Experiment - sending fileTemplate Entries...");
            win.SmartTemplate4.fileTemplates.updateTemplatesDataFromBackEnd(entries);
            return;
          }

          this.collapseTimeout = setTimeout(() => {
            this.logDebug("SmartTemplates Experiment - sending fileTemplate Entries...");
            win.SmartTemplate4.fileTemplates.updateTemplatesDataFromBackEnd(entries);
          }, this.UPDATE_INTERVAL);
        },

        // item: {path, label, category}
        editTemplateExternal: async function (item) {
          // opens external editor to edit template in background.
          // there is no need to update anything in Thunderbird as path remains the same!
          win.SmartTemplate4.fileTemplates.edit(item);
        },

        // Get file path of existing html template / css file.
        // itemParams: template menu item from listbox {path, label, filter}
        // should return path and name (label) of the file
        openFileExternal: async function (itemParams) {
          let result = await win.SmartTemplate4.fileTemplates.openTemplateFileExternal(itemParams);
          return result;
        },

        openTemplateList: async function (itemParams) {
          let result = await win.SmartTemplate4.fileTemplates.openJsonFile(itemParams);
          return result;
        },

        fileAccountSettings: async function (mode, jsonData, fname = "") {
          function rememberPath(path) {
            // Remember last path
            let lastSlash = path.lastIndexOf("/");
            if (lastSlash < 0) {
              lastSlash = path.lastIndexOf("\\");
            }
            let lastPath = path.substring(0, lastSlash);
            win.SmartTemplate4.Util.logDebug("Storing Path: " + lastPath);
            win.SmartTemplate4.Preferences.setStringPref("files.path", lastPath);
          }
          const Cc = Components.classes,
            Ci = Components.interfaces;

          let filterText; //localized text for filePicker filter menu

          let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker),
            fileOpenMode = mode == "load" ? fp.modeOpen : fp.modeSave;

          // "Remember save location"
          if (win.SmartTemplate4.Preferences.getStringPref("files.path")) {
            let defaultPath = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            const prefPath = win.SmartTemplate4.Preferences.getStringPref("files.path");
            try {
              defaultPath.initWithPath(prefPath);
              fp.displayDirectory = defaultPath;
            } catch (ex) {
              win.SmartTemplate4.Util.logException(`initializing Path ${prefPath} failed:`, ex);
            }
          }
          fp.init(win.SmartTemplate4.Util.getFileInitArg(win), "", fileOpenMode); // second parameter: prompt
          filterText = win.SmartTemplate4.Util.getBundleString("fpJsonFile");
          fp.appendFilter(filterText, "*.json");
          fp.defaultExtension = "json";
          if (mode == "save") {
            fp.defaultString = fname + ".json";
          }
          // ************************************************************ END PREP
          const logDebug = this.logDebug;
          let load = async function (fp) {
            const path = fp.file.path;
            let data = await IOUtils.readJSON(path, { encoding: "utf-8" });
            return data;
          };

          let save = async function (fp, jsonData) {
            logDebug("attempting to save file", fp, jsonData);
            let path = fp.file.path;
            // force appending correct file extension!
            if (!path.toLowerCase().endsWith(".json")) {
              path += ".json";
            }
            // eslint-disable-next-line no-unused-vars
            let _isDelete = await IOUtils.remove(path);
            try {
              let countBytes = await IOUtils.writeUTF8(path, jsonData);
              win.SmartTemplate4.Util.logDebug(
                `Successfully saved account data (${countBytes} bytes) to:\n${path}`
              );
              return true;
            } catch (ex) {
              // console.log(path, jsonData);
              win.SmartTemplate4.Util.logException("Couldn't write data to file!", ex);
              return false;
            }
          };

          let result = await new Promise((resolve) => {
            fp.open(resolve);
          });
          // if (fp.open) {
          //   fp.open(fpCallback);
          // }
          if (result != Ci.nsIFilePicker.returnOK && result != Ci.nsIFilePicker.returnReplace) {
            return false; // cancelled
          }
          if (!fp.file) {
            return false; // cancelled
          }
          const path = fp.file.path;
          rememberPath(path);

          // passing the promise as callback
          switch (mode) {
            case "load":
              return await load(fp);

            case "save":
              return await save(fp, jsonData);
          }
          throw new Error(`fileAccountSettings() unsupported mode: ${mode}`);
        },

        focusDocument: async function (tabId) {
          this.logDebug("Accessibility: Focus current tab document...", tabId);
          win.gTabmail.currentTabInfo.browser.focus();
        },

        updatePreferencesCache: (data) => {
          const windowTypes = ["mail:3pane", "msgcompose", "mail:messageWindow"];
          for (const type of windowTypes) {
            const enumerator = Services.wm.getEnumerator(type);
            while (enumerator.hasMoreElements()) {
              const win = enumerator.getNext();
              if (win.SmartTemplate4?.Preferences?.cache?.updateFromBackend) {
                win.SmartTemplate4.Preferences.cache.updateFromBackend(data);
              }
            }
          }
          return true;
        },
      },
    };
  };
}

// shut up the linter's "assigned but never used":
{
  // eslint-disable-next-line no-unused-vars
  void Utilities; // void references, doesn't redeclare!
}
