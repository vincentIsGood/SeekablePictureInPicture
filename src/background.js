// Message proxy.
(async ()=>{
    chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
        // console.log("[WORKER]", message);
        broadcast(message);
        return true;
    });

    // Broadcast to all content scripts
    async function broadcast(message){
        const currentWindowId = await chrome.windows.getCurrent().id;
        chrome.tabs.query({active: true, windowId: currentWindowId}, (tabs) => {
            for(const tab of tabs){
                chrome.tabs.sendMessage(tab.id, message);
            }
        });
    }
})();