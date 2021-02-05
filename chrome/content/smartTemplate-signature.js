"use strict";

/******
	 - Tb/Sm integrates everything signature related within identity
****/

SmartTemplate4.Sig = {
  Identity: null,
	init: function(mailIdentity) {
		this.Identity = mailIdentity;
	} ,
	
	reset: function() {
	  this.Identity = null;
	} ,
	
	_checkIdentity: function() {
	  if (!this.Identity) {
			throw "SmartTemplate4.Sig was not initialized! No Identity set.";
		}
	} ,
	
	get isSignatureSetup() {
		this._checkIdentity();
		let id = this.Identity;
    // see also: http://mxr.mozilla.org/comm-central/source/mailnews/base/public/nsIMsgIdentity.idl
    return (id.htmlSigText && (id.htmlSigText.length > 0) && !id.attachSignature)
            ||
           (id.attachSignature && id.signature && id.signature.exists());
	} ,
	
	get htmlSigFormat() {
		this._checkIdentity();
    return this.Identity.htmlSigFormat; // straight from Account Settings
	} ,
	
	get htmlSigText() {
		this._checkIdentity();
    return this.Identity.htmlSigText;
	} ,
  
  get htmlSigPath() {
    const util = SmartTemplate4.Util;
    try {
      this._checkIdentity();
      if (!this.Identity.signature) return "";
      let sig = this.Identity.signature;
      if (sig) {
        try {
          if (sig.exists() && sig.isFile()) // nsIFile.isFile
            return sig.path;
        }
        catch (ex) {
          if (Cr.NS_ERROR_FILE_NOT_FOUND == ex.result) {
            util.logException("Invalid signature path: " + sig.path, ex);
          }
          else
            util.logException("SmartTemplate4.Sig.htmlSigPath() failed.", ex);
        }
      }
    }
    catch(ex) {
      util.logException("SmartTemplate4.Sig.htmlSigPath() failed.", ex);
    }
    return ""; 
  }
	
};

