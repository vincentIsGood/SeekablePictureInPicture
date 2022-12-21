// Message proxy.
(async ()=>{
    chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
        broadcast(message);
    });

    // Broadcast to all content scripts
    async function broadcast(message){
        const currentWindowId = await chrome.windows.getCurrent().id;
        chrome.tabs.query({active: true, windowId: currentWindowId}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, message);
        });
    }
})();