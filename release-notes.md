The full change log with screen shots [can be found here](https://smarttemplates.quickfolders.org/version.html#4.13) 

**Improvements**

*    Made compatible with Thunderbird 141. 
*    Indicate when a web page was opened in a tab in the background (by adding a label to the link) 
*     Support for Unix style time strings to %dateformat% variable:  [issue #381]
    `%dateformat.received(unix)%` - – Inserts the received time as a Unix timestamp (seconds since epoch = January 1, 1970).
    `%dateformat.current(timestamp)%` - – Inserts the current time in milliseconds since the epoch.
*   Added optional `nodefer` parameter to `%dateformat.current()%`.  [issue #382]

    Normally, dynamic fields like `%subject%`, `%recipient(name)%`, or `%date.current%` are inserted as interactive placeholders (so they can update when you click or when sending the email).  

    These are useful when the data isn't available yet, like when composing a new message. The `nodefer` parameter disables this behavior and immediately inserts the actual value as plain text. 

