
// the main object

var gSmartTemplate = {
    // definitions for whatIsX (time of %A-Za-z%)
    XisToday : 0,
    XisSent  : 1,
    signature : null,
    sigIsDefined : false,
    
    stateListener: {
        NotifyComposeFieldsReady: function() {},
        NotifyComposeBodyReady: function() {
            gSmartTemplate.notifyComposeBodyReady();
        },
        ComposeProcessDone: function(aResult) {},
        SaveInFolderDone: function(folderURI) {}
    },
    
    initListner: function() {   
        gMsgCompose.RegisterStateListener(gSmartTemplate.stateListener);
    },
    // -------------------------------------------------------------------
    // A handler to add template message
    // -------------------------------------------------------------------
    notifyComposeBodyReady: function()
    {   
        this.Util.logDebugOptional('events','gSmartTemplate.notifyComposeBodyReady()');
        // Add template message
        this.smartTemplate.insertTemplate(true);
    },
    
    // -------------------------------------------------------------------
    // A handler to switch identity
    // -------------------------------------------------------------------
    loadIdentity : function(startup)
    {   
        this.Util.logDebugOptional('functions','gSmartTemplate.loadIdentity(' + startup +')');
        if (startup) {
            // Old function call
            this.oldFunc_LoadIdentity(startup);
        } else {
            // Check body modified or not
            var isBodyModified = gMsgCompose.bodyModified;
            if (!isBodyModified) {
                // Add template message
                this.smartTemplate.insertTemplate(false);
            }
            // Old function call
            this.oldFunc_LoadIdentity(startup);
            if (!isBodyModified && gMsgCompose.bodyModified)
              { gMsgCompose.editor.resetModificationCount(); }  // for TB bug?
        }
    },
    
    // -------------------------------------------------------------------
    // Escape to HTML character references
    // -------------------------------------------------------------------
    escapeHtml: function(str)
    {
        return str.replace(/&/gm, "&amp;").replace(/"/gm, "&quot;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/\n/gm, "<br>");
    },

    // -------------------------------------------------------------------
    // Get day name and month name
    // -------------------------------------------------------------------
    classCalIDateTimeFormatter: function(useLegacy)
    {
        // -----------------------------------
        // Constructor
        try {
            if (useLegacy)
                throw "without lightning";
            // with Lightning
            var cal = Components.classes["@mozilla.org/calendar/datetime-formatter;1"].
                        getService(Components.interfaces.calIDateTimeFormatter);
        } 
        catch(ex) {
            // without Lightning
            var strBndlSvc = Components.classes["@mozilla.org/intl/stringbundle;1"].
                             getService(Components.interfaces.nsIStringBundleService);
            var bundle = strBndlSvc.createBundle("chrome://smarttemplate4/locale/calender.properties");
            var cal = {
                dayName        : function(n){ return bundle.GetStringFromName("day." + (n + 1) + ".name"); },
                shortDayName   : function(n){ return bundle.GetStringFromName("day." + (n + 1) + ".short"); },
                monthName      : function(n){ return bundle.GetStringFromName("month." + (n + 1) + ".name"); },
                shortMonthName : function(n){ return bundle.GetStringFromName("month." + (n + 1) + ".short"); }
            };
        }
    
        function list() {
            var str = "";
            for (var i=0;i<7 ;i++){str+=(cal.dayName(i)  +"("+cal.shortDayName(i)  +")/");} str += "\n";
            for (var i=0;i<12;i++){str+=(cal.monthName(i)+"("+cal.shortMonthName(i)+")/");}
            return str;
        };
    
        // -----------------------------------
        // Public methods
        this.dayName        = cal.dayName;
        this.shortDayName   = cal.shortDayName;
        this.monthName      = cal.monthName;
        this.shortMonthName = cal.shortMonthName;
        this.list           = list;
    } ,
    
    // -------------------------------------------------------------------
    // Initialize - we only call this from the compose window
    // -------------------------------------------------------------------
    init: function()
    {
        function smartTemplate_loadIdentity(startup){
            return gSmartTemplate.loadIdentity(startup);
        }
        gSmartTemplate.Util.logDebug('gSmartTemplate.init()');
        this.oldFunc_LoadIdentity = LoadIdentity;
        LoadIdentity = smartTemplate_loadIdentity;
    
        this.pref = new this.classPref("extensions.smarttemplate.", "def");
        this.smartTemplate = new this.classSmartTemplate();
        this.cal = new this.classCalIDateTimeFormatter(true);
        
        // Time of %A-Za-z% is today(default)
        this.whatIsX = this.XisToday;
        this.Util.logDebug('gSmartTemplate.init() ends.');
        
    }
    
};
