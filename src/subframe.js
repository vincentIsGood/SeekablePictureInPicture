window.addEventListener("load", ()=>{
    setTimeout(setup, 2000);
});

function setup(){
    let video = getVideoElement();
    const canSendToMainFrame = video != null && isInIframe();
    if(!canSendToMainFrame) return;
    setInterval(()=>{
        if(video.paused)
            return;
        sendMessageToBackground({
            name: "mainchannel",
            data: {
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