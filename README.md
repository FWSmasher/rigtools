# Rigtools
Extension/Devtools code execution

## Release information
- Release 0.0.1
  - This release contains the following things:
    - Updater
    - Extension debugging
    - Devtools debugging
    - Chrome url debugging.
## Terminology
- Entry
    - Entrypoint (or main script) when running devtools xss. 
    - Payload
    - Script passed to extension to run code, such as disabling extensions.
- Chrome URLs
    - Elevated URLs that have extra access to features such as WebUI.  

<b>Only modify the entrypoint when necessary. If not modified properly, thigns such as the updater will break, do not remove any buttons and reuse ids.</b>
## Private, do not share.