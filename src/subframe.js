let retryCount = 0;
let maxRetryCount = 2;

let video;
let firstMessage = true;

window.addEventListener("load", startVideoObserver);

chrome.runtime.onMessage.addListener((msg)=>{
    if(msg.name !== "subframe_cmd") return;
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

function startVideoObserver(){
    console.log("[*] Starting video observer");
    retryCount = 0;
    const videoObserver = setInterval(()=>{
        video = getVideoElement();
        if(retryCount >= maxRetryCount){
            clearInterval(videoObserver);
            return;
        }
        if(video?.currentSrc){
            console.log("[+] Video found, turning off subframe observer: ", window.self.location.href);
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
    
    // alert("setting up: " + getVideoElement().currentSrc);
    console.log("[+] Sending video info to main: " + video.currentSrc);
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