/* eslint-disable object-shorthand */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 
/* 
  ORIGINAL CODE:
  https://searchfox.org/comm-esr78/source/mail/components/extensions/parent/ext-accounts.js
  SCHEMA:
  https://searchfox.org/comm-esr78/source/mail/components/extensions/schemas/accounts.json
  
  This is a workaround for [Bug 1715968] - which doesn't prompt user to update a legacy add-on whgen it requires new permissions. Since we already have full permissions, we need to copy the code from the original API module for now.
  
  
  this way I can omit:
  "permissions": [
    "accountsRead"
  ],    
  
  Do undo, and use the "real" module we can later replace messenger.ex_accounts with messenger.accounts
  
  */
  
ChromeUtils.defineModuleGetter(
  this,
  "MailServices",
  "resource:///modules/MailServices.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "toXPCOMArray",
  "resource:///modules/iteratorUtils.jsm"
);

function convertAccount(account) {
  if (!account) {
    return null;
  }

  account = account.QueryInterface(Ci.nsIMsgAccount);
  let server = account.incomingServer;
  if (server.type == "im") {
    return null;
  }

  let folders = traverseSubfolders(
    account.incomingServer.rootFolder,
    account.key
  ).subFolders;

  return {
    id: account.key,
    name: account.incomingServer.prettyName,
    type: account.incomingServer.type,
    folders,
    identities: account.identities.map(id => convertMailIdentity(account, id)),
  };
}

var ex_accounts = class extends ExtensionAPI {
  getAPI(context) {
    return {
      accounts: {
        async list() {
          debugger;
          let accounts = [];
          for (let account of MailServices.accounts.accounts) {
            account = convertAccount(account);
            if (account) {
              accounts.push(account);
            }
          }
          return accounts;
        },
        async get(accountId) {
          let account = MailServices.accounts.getAccount(accountId);
          return convertAccount(account);
        },
        async getDefault() {
          let account = MailServices.accounts.defaultAccount;
          return convertAccount(account);
        },
        async getDefaultIdentity(accountId) {
          let account = MailServices.accounts.getAccount(accountId);
          return convertMailIdentity(account, account?.defaultIdentity);
        },
        async setDefaultIdentity(accountId, identityId) {
          let account = MailServices.accounts.getAccount(accountId);
          if (!account) {
            throw new ExtensionError(`Account not found: ${accountId}`);
          }
          for (let identity of account.identities) {
            if (identity.key == identityId) {
              account.defaultIdentity = identity;
              return;
            }
          }
          throw new ExtensionError(
            `Identity ${identityId} not found for ${accountId}`
          );
        },
      },
    };
  }
};