**Convert Registration Dialog to HTML
**

The registration dialog of all my Add-ons (quickFilters, QuickFolders and SmartTemplates) is currently implemented in the legacy xhtml format, using privileged code:

<img width="1065" height="654" alt="image" src="https://github.com/user-attachments/assets/518bb263-fc26-4572-b177-1b712c327170" />

It's one of the last xhtml user interfaces of the Add-on and serves as a entrance to the online license shop and has a few important functions:

- inform about the annual license model
- show current license type and expiry date
- show different license options for new and licensed users: Standard, Pro and Domain Licenses including:
- provide an upgrade path to standard users
- provide an upgrade path from all licenses to a Domain license
- inform about the differences in functionality of the editions via a link to the support site
- select the licensed account info
- transmit preselected licensee's information (name, email)
- transmit the previous license (for entitlements and date when renewing / extending / upgrading) in the referrer `querystring` parameter
- for new users, transmit the last function used that may have started the shopping flow, in order to learn which functions are the most important. this is put into the `referrer` querystring parameter

<img width="1039" height="684" alt="image" src="https://github.com/user-attachments/assets/598a968c-ab15-46eb-8f23-e9218efb82ce" />

Since all of the necessary information (mail accounts, existing license status) is already present in the background, a rewrite using pure mail API extensions is entirely possible.