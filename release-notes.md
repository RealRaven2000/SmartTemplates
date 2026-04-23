The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.19) 


**Improvements**

*   Set Minimum Version to Thunderbird 140 to avoid problems with deprecated APIs and to focus on modern Thunderbird versions [issue #418].


**Bug Fixes**

*   Fixed: Sandbox script stops functioning in Tb 150 beta 3 [issue #417]  because the string prototype modification was deprecated in Thunderbird 150.

From version 149 forward, we require the syntax `from()` when the variable has no parameters. Chaining of variables can be done using the form `(await from()).someStringFunction()`.

Added detailed diagnostics for syntax problems with literal parameters ($mail) or missing empty parameters `()`.

