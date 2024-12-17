const maxRetryCount = 2;
retryCount = 0;

let video;
let firstMessage = true;

window.addEventListener("load", ()=>{
    setTimeout(()=>{
        startVideoObserver();
    }, 1000);

    chrome.runtime.onMessage.addListener((msg)=>{
        if(msg.name !== "subframe_cmd") return;
        log(JSON.stringify(msg), appendDebugLog);
    
        /**
         * @type {VideoCommandMessage}
         */
        const data = msg.data;
    
        if(data.action == "retry"){
            if(retryCount >= maxRetryCount){
                firstMessage = true;
                startVideoObserver();
            }
            return;
        }
        
        if(!video) return;
        switch(data.action){
            case "pip": video.requestPictureInPicture().then((pip)=>pipRegisterEvents(pip, video)); break;
            case "seekforward": break;
            case "seekbackward": break;
        }
    });
});

function startVideoObserver(){
    // createDebugLog();
    log("[SUBFRAME] Starting video observer");
    retryCount = 0;
    const videoObserver = setInterval(()=>{
        video = getVideoElement();
        if(retryCount >= maxRetryCount){
            clearInterval(videoObserver);
            return;
        }
        if(video?.currentSrc){
            log(`[+] Video found, turning off subframe observer: ${window.self.location.href}`, appendDebugLog);
            setup();
            retryCount = maxRetryCount;
            clearInterval(videoObserver);
            return;
        }
        retryCount++;
    }, 5000);
}

function setup(){
    const canSendToMainFrame = video != null && isInIframe();
    if(!canSendToMainFrame) return;
    
    log(`[+] Sending video info to main: ${video.currentSrc}`, appendDebugLog);
    setInterval(()=>{
        if(video.paused && !firstMessage)
            return;
        sendMessageToBackground({
            name: "mainchannel",
            data: {
                signature: "VideoInfo",
                hasVideo: true,
                currentTime: video.currentTime,
                duration: video.duration,
                ended: video.ended,
                paused: video.paused,
                readyState: video.readyState,
                seekable: video.seekable,
                src: video.src,
                volume: video.volume,
            }
        });
        if(firstMessage)
            firstMessage = false;
    }, 300);
}