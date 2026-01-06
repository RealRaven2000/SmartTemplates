/*******************************************************************
*                      File: environment.js                        *
*                                                                  *
*                  by Axel Grude & Marky Mark DE                   *
*                         Version 04/2014                          *
*                                                                  *
*                   Date: Tue 22/04/2014 01:64                     *
*                                                                  *
*******************************************************************/

"use strict"; // use ECMAScript5 strict mode

/******************************************************************/
/********************* Modern Environment.js *********************/
/******************************************************************/


const Environment = {
    isMobile: {
        // Detect Android devices via UA fallback
        Android: function() {
            return (navigator.userAgent || "").match(/Android/i) ? true : false;
        },

        // Detect iOS devices via UA fallback
        iOS: function() {
            return (navigator.userAgent || "").match(/iPhone|iPad|iPod/i) ? true : false;
        },

        // Detect touch capability (preferred over UA)
        touch: function() {
            return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        },

        // Detect mobile / tablet
        any: function() {
            // First, check actual touch capability
            if (this.touch()) {
                return true;
            }

            // Optional UA sniff fallback if touch not available
            if (this.Android() || this.iOS()) {
                return true;
            }

            // Optional: detect coarse pointer devices
            if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
                return true;
            }

            return false;
        }
    },

    // Detect modern browsers using feature + UA heuristics
    browser: (function() {
        try {
            const ua = navigator.userAgent || "";
            if (ua.indexOf("Firefox") > -1) {
                return "Firefox";
            } else if (ua.indexOf("Edg") > -1) {
                return "Edge";
            } else if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) {
                return "Chrome";
            } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
                return "Safari";
            } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
                return "Opera";
            } else {
                return "Other";
            }
        } catch (ex) {
            return "Other";
        }
    })(),

    // Detect OS using feature detection / UA fallback
    OS: (function() {
        try {
            const ua = navigator.userAgent || "";
            const platform = navigator.platform || "";

            if (/Win/i.test(platform)) {
                return "Windows";
            } else if (/Mac/i.test(platform)) {
                return "Mac";
            } else if (/Linux/i.test(platform)) {
                return "Linux";
            } else if (/iPhone|iPad|iPod/i.test(ua)) {
                return "iOS";
            } else if (/Android/i.test(ua)) {
                return "Android";
            } else {
                return "Other";
            }
        } catch (ex) {
            return "Other";
        }
    })()
};


