/* eslint-disable object-shorthand */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 
/* 
  ORIGINAL CODE:
  https://searchfox.org/comm-central/source/mail/components/extensions/parent/ext-accounts.js
  
  This is a workaround for [Bug 1715968] - which doesn't prompt user to update a legacy add-on whgen it requires new permissions. Since we already have full permissions, we need to copy the code from the original API module for now.
  
  
  this way I can omit:
  "permissions": [
    "accountsRead"
  ],    
  
  Do undo, and use the "real" module we can later replace messenger.ex_accounts with messenger.accounts
  
  
  */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var ex_accounts = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      accounts: {
        async list() {
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