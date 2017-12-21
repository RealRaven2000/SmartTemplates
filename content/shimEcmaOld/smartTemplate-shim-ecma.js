
// OLD SHIM CODE 
//   this is to make SmartTemplate4 backwards compatible with Postbox 3,4,5
//   which hasn't got the new code of ECMA 1.7

if (!SmartTemplate4.Shim) {
	Components.utils.import("resource:///modules/iteratorUtils.jsm");
	SmartTemplate4.Shim = {
		getIdentityMailAddresses: function getIdentityMailAddresses(MailAddresses) {
			const Util = SmartTemplate4.Util,
						Ci = Components.interfaces,
						acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]
													.getService(Ci.nsIMsgAccountManager);
													
			for (let account in fixIterator(acctMgr.accounts, Components.interfaces.nsIMsgAccount)) {
				try {
					let idMail = '';
					if (account.defaultIdentity) {
						idMail = account.defaultIdentity.email;
					}
					else if (account.identities.length) {
						idMail = account.identities[0].email; // outgoing identities
					}
					else {
						Util.logDebug('getIdentityMailAddresses() found account without identities: ' + account.key);
					}
					if (idMail) {
						idMail = idMail.toLowerCase();
						if (idMail && MailAddresses.indexOf(idMail)==-1) 
							MailAddresses.push(idMail);
					}
				}
				catch(ex) {
					Util.logException ('getIdentityMailAddresses()', ex);
				}
			}
		} ,
		
		cloneHeaders: function cloneHeaders(msgHdr, messageClone, dbg, appendProperty) {
			for (let [propertyName, prop] in Object.entries(msgHdr)) {
				// propertyName is what you want
				// you can get the value like this: myObject[propertyName]
				try {
					let hasOwn = msgHdr.hasOwnProperty(propertyName),
							isCopied = false;  // replace msgHdr[propertyName] with prop
					if (hasOwn && typeof prop != "function" && typeof prop != "object") {
						messageClone[propertyName] = msgHdr[propertyName]; // copy to the clone!
						if (messageClone[propertyName])  // make sure we have some data! (e.g. author, subject, recipient, date, charset, messageId)
							dbg.countInit ++;
						isCopied = true;
					}
					if (isCopied) {
						dbg.test = appendProperty(dbg.test, msgHdr, propertyName);
					}
					else {
						dbg.test2 = appendProperty(dbg.test2, msgHdr, propertyName);
					}
				}
				catch(ex) { ; }
			}
		} ,
		
		get Accounts() {
			const Ci = Components.interfaces,
						Cc = Components.classes,
						util = SmartTemplate4.Util;
			let aAccounts=[];
			if (util.Application == 'Postbox') 
				aAccounts = util.getAccountsPostbox(); 
			else {
				throw("Old ECMA module! We can use for..in in modern platforms!");
			}
			return aAccounts;
		} ,
		dummy: ', <== end Shim properties here'
	} // end of Shim definition
};