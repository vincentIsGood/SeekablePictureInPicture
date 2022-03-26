const debug = true;
let oldHref = window.location.href;

let createdVideoElement = null;

window.addEventListener("load", ()=>{
    initHrefObserver();
    
    log("Seekable Picture In Picture is enabled");
    findVideo();
});

function initHrefObserver(){
    setInterval(()=>{
        if(window.location.href != oldHref){
            log("New page detected, reloading");
            findVideo();
            oldHref = window.location.href;
        }
    }, 5000);
}

function findVideo(){
    if($("video")){
        log("Video found. Adding actions and event listeners to PiP");
        document.body.removeEventListener("keydown", keydownEventHandler);
        document.body.addEventListener("keydown", keydownEventHandler);
    }
}
function keydownEventHandler(e){
    let vid = $("video");
    if(e.shiftKey && e.key === "~"){
        // Handle success and Failure
        vid.requestPictureInPicture()
            .then(pipSuccessHandler)
            .catch(pipBackupFeature);
    }

    if(!window.location.href.endsWith(".mp4"))
        return;
    if(e.key === "ArrowLeft"){
        vid.currentTime -= 5;
    }
    if(e.key === "ArrowRight"){
        vid.currentTime += 5;
    }
}

/**
 * @param {PictureInPictureWindow} pipWindow 
 */
function pipSuccessHandler(pipWindow){
    const vid = $("video");
    navigator.mediaSession.setActionHandler("previoustrack", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
    
    navigator.mediaSession.setActionHandler("previoustrack", ()=>{
        vid.currentTime -= 5;
    });
    navigator.mediaSession.setActionHandler("nexttrack", ()=>{
        vid.currentTime += 5;
    });
}
function pipBackupFeature(e){
    console.log("[-] Error occured, reason:", e);
    console.log("[*] Trying to read canvas, if any");
    if(createdVideoElement){
        console.log("[*] An existing canvas relates to a created video element");
        console.log("[+] Trying to request PiP on it");
        createdVideoElement.requestPictureInPicture();
        return;
    }
    const canvas = $("canvas");
    if(!canvas) 
        return;
    console.log("[+] Found canvas, creating a new video element to contain it");
    let newVid = document.createElement("video");
    createdVideoElement = newVid;
    
    const mediaStream = canvas.captureStream();
    newVid.srcObject = mediaStream;
    console.log("[*] Wait a sec...");
    setTimeout(()=>{
        newVid.play();
        newVid.requestPictureInPicture().catch((e)=>{
            console.log("[-] Error occured, reason:", e);
        });
    }, 1000);
}

function log(string){
    if(debug)
        console.log("[*] " + string);
}

/**
 * @template {keyof HTMLElementTagNameMap} K - K is the keyof HTMLElementTagNameMap (= the type of the value of HTMLElementTagNameMap)
 * @param {K} query
 * @return {HTMLElementTagNameMap[K] | null} - returns the type after dereferencing HTMLElementTagNameMap[K]
 */
function $(query){
    return document.querySelector(query);
}