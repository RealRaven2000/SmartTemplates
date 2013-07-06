"use strict";

/******
   Special interface to wrap Postbox signature stuff vs. the much simpler Thunderbird / SeaMonkey interface 
	 - Tb/Sm integrates everything signature related within identity
	 - Postbox creates its own interface c;ass/
****/

SmartTemplate4.Sig = {
  Identity: null,
	Postbox: {
	  get SignatureService() {
		  return Components.classes["@postbox-inc.com/signatures;1"].getService(Components.interfaces.pbISignatureService);
		},
		get SignatureKey() {
		  return SmartTemplate4.Sig.Identity.pbSignatureKey; // cannot dereference an object's parent in Javascript
		} ,
		get htmlSigFormat() {
			if (!this.SignatureKey) 
				return null;
			let sig = this.getSignature();
			if(!sig)
				return false;
			
		  return RegExp("<*.>", "i").test(sig.body); // simple HTML test.
		},
		getSignature: function() {
		  let k = this.SignatureKey;
			return this.SignatureService.getSignatureForKey(k);
		},
		get htmlSigText() {
		  let sig = this.getSignature();
			return sig ? (sig.body ? sig.body : '') : '';
		}
	} ,
	
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
		switch (SmartTemplate4.Util.Application) {
			case 'Thunderbird': case 'SeaMonkey':
				// see also: http://mxr.mozilla.org/comm-central/source/mailnews/base/public/nsIMsgIdentity.idl
			  return (id.htmlSigText && (id.htmlSigText.length > 0) && !id.attachSignature)
		            ||
		           (id.attachSignature && id.signature && id.signature.exists());
				break;

			case 'Postbox':
			  // am-main.xul => pbSignature.js => editSignature()
			  // see pbSignatureService.js...
				if (!this.Postbox.SignatureKey)
					return false;
				try {
				  // for more detail, see pbSignatureEditor.js
					let postboxSig = this.Postbox.getSignature();
					// signature has at least body and name attributes
					let s = postboxSig.toString();
					SmartTemplate4.Util.logDebug('Postbox Sig:' + s);
				}
				catch(ex) {
				  return false;
				}
				return true;
		} 
		return false;
	} ,
	
	get htmlSigFormat() {
		this._checkIdentity();
		if (SmartTemplate4.Util.Application == "Postbox")
			return this.Postbox.htmlSigFormat;
		else
		  return this.Identity.htmlSigFormat;
	} ,
	
	get htmlSigText() {
		this._checkIdentity();
	  if (SmartTemplate4.Util.Application == 'Postbox')
			return this.Postbox.htmlSigText;
		else
		  return this.Identity.htmlSigText;
	}
	
};

