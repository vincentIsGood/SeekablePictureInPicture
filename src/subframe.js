let retryCount = 0;
let maxRetryCount = 5;

let video;

window.addEventListener("load", ()=>{
    const videoObserver = setInterval(()=>{
        video = getVideoElement();
        if(retryCount >= maxRetryCount){
            clearInterval(videoObserver);
            return;
        }
        if(video?.currentSrc){
            console.log("[+] Video found, turning off subframe observer: ", window.self.location.href);
            setup();
            clearInterval(videoObserver);
            return;
        }
        retryCount++;
    }, 5000);
});

chrome.runtime.onMessage.addListener((msg)=>{
    if(msg.name !== "subframe_cmd" || !video) return;
    console.log("[+] Requesting picture in picture in subframe");
    /**
     * @type {VideoCommandMessage}
     */
    const data = msg.data;
    switch(data.action){
        case "pip": video.requestPictureInPicture().then((pip)=>pipRegisterEvents(pip, video)); break;
        case "seekforward": break;
        case "seekbackward": break;
    }
});

function setup(){
    const canSendToMainFrame = video != null && isInIframe();
    if(!canSendToMainFrame) return;
    // alert("setting up: " + getVideoElement().currentSrc);
    setInterval(()=>{
        if(video.paused)
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
    }, 300);
}