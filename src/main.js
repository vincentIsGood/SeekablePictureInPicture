let oldHref = window.location.href;
/**
 * @type {VideoInfo}
 */
let videoInfo;

let forceControls = false;
let firstMessage = true;

window.addEventListener("load", ()=>{
    console.clear = () => {};
    initHrefObserver();
    // createDebugLog(); // UNCOMMENT TO ENABLE DEBUG CONSOLE

    setTimeout(()=>{
        log("[Loaded] Seekable Picture In Picture is enabled", appendDebugLog);
        if(isCurrentPageVideo())
            createOffsetInputElement();
        registerHandlers();
    }, 2000);
    
    try{
        chrome.runtime.onMessage.addListener((msg)=>{
            log("[SUBFRAME] " + JSON.stringify(msg), appendDebugLog);
            if(msg.name !== "mainchannel") return;

            videoInfo = msg.data;
            if(firstMessage){
                log(`[+] Received video info: ${videoInfo}`, appendDebugLog);
                firstMessage = false;
            }
        });
    }catch(e){
        log(`[-] Extension Error: ${e}`, appendDebugLog);
    }
});

setTimeout(()=>{
    log("[Forced] Seekable Picture In Picture is enabled", appendDebugLog);
    if(isCurrentPageVideo())
        createOffsetInputElement();
    registerHandlers();
}, 5000);

function initHrefObserver(){
    setInterval(()=>{
        if(window.location.href != oldHref){
            log("[*] New page detected, reloading", appendDebugLog);
            registerHandlers();
            oldHref = window.location.href;
        }
    }, 5000);
}

/**
 * @returns success or not
 */
function registerHandlers(){
    log("[*] Keydown event handler is being registered", appendDebugLog);
    document.body.removeEventListener("keydown", keydownEventHandler);
    document.body.addEventListener("keydown", keydownEventHandler);
}

// Nov 2023 note:
// use e.preventDefault() as a workaround to double keydown event bug 
// in Brave when the default player page is used. It does seem like 
// 'Space' is not bugged out (it is called once)
/**
 * @param {KeyboardEvent} e 
 */
function keydownEventHandler(e){
    let vid = getVideoElement() || videoInfo;
    if(!vid && e.shiftKey && e.key === "~"){
        log("[*] Requesting video info", appendDebugLog);
        firstMessage = true;
        sendMessageToBackground({
            name: "subframe_cmd", 
            data: {action: "retry"}
        });
    }
    if(!vid) return;

    if(e.shiftKey && e.key === "~"){
        log("[+] Requesting pip", appendDebugLog);
        if(vid instanceof HTMLVideoElement){
            // Handle success and Failure
            vid.requestPictureInPicture()
                .then((pip)=>pipRegisterEvents(pip))
                .catch(pipBackupFeature);
        }else{
            sendMessageToBackground({
                name: "subframe_cmd", 
                data: {action: "pip"}
            });
        }
    }

    // Force the use of subtitle
    if(e.shiftKey && e.ctrlKey){
        if(e.key === "{"){
            log("[*] Force controls", appendDebugLog);
            forceControls = true;
        }else if(e.key === "}"){
            forceControls = false;
        }
    }else if(e.shiftKey){
        if(e.key === "{"){
            log("[*] Enabling subtitles", appendDebugLog);
            createOffsetInputElement();
            selectAndDisplaySubtitles();
        }else if(e.key === "}"){
            subtitleOffsetInput.remove();
            subtitleOffsetInput = null;
            subtitleEle.remove();
            subtitleEle = null;
        }else return;
        e.preventDefault();
    }

    if(!isCurrentPageVideo() && !forceControls)
        return;

    if(e.key === "ArrowLeft"){
        vid.currentTime -= 5;
    }else if(e.key === "ArrowRight"){
        vid.currentTime += 5;
    }else if(e.key === "Space"){
        if(vid.paused) vid.play();
        else vid.pause();
    }else if(e.key === "s"){
        selectAndDisplaySubtitles();
    }else return;
    e.preventDefault();
}

/**
 * @param {PictureInPictureWindow} pipWindow 
 */
function pipRegisterEvents(pipWindow, videoElement = null){
    log("[+] Register pip events", appendDebugLog);
    const vid = getVideoElement() || videoElement;
    if(!vid) return;
    
    navigator.mediaSession.setActionHandler("previoustrack", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
    
    navigator.mediaSession.setActionHandler("previoustrack", ()=>{
        vid.currentTime -= 5;
    });
    navigator.mediaSession.setActionHandler("nexttrack", ()=>{
        vid.currentTime += 5;
    });
}

let createdVideoElement = null;
function pipBackupFeature(e){
    log(`[-] Error occured, reason: ${e}`, appendDebugLog);
    log("[*] Trying to read canvas, if any", appendDebugLog);
    if(createdVideoElement){
        log("[*] An existing canvas relates to a created video element", appendDebugLog);
        log("[+] Trying to request PiP on it", appendDebugLog);
        createdVideoElement.requestPictureInPicture();
        return;
    }
    const canvas = $("canvas");
    if(!canvas) 
        return;
    log("[+] Found canvas, creating a new video element to contain it", appendDebugLog);
    let newVid = document.createElement("video");
    createdVideoElement = newVid;
    
    const mediaStream = canvas.captureStream();
    newVid.srcObject = mediaStream;
    log("[*] Wait a sec...", appendDebugLog);
    setTimeout(()=>{
        newVid.play();
        newVid.requestPictureInPicture().catch((e)=>{
            log(`[-] Error occured, reason: ${e}`, appendDebugLog);
        });
    }, 1000);
}

// -------------- Subtitles ---------------- //
let subtitleUpdateInterval = -1;
/**
 * @type {HTMLInputElement}
 */
let subtitleOffsetInput = null;
/**
 * @type {HTMLDivElement}
 */
let subtitleEle = null;
/**
 * @type {SrtEntry[]}
 */
let srtEntries = null;
let currentEntry;
function selectAndDisplaySubtitles(){
    let vid = getVideoElement() || videoInfo;
    if(vid == null){
        log("[-] Still cannot find video element.", appendDebugLog);
        return;
    }
    const localFileSelector = document.createElement("input");
    localFileSelector.type = "file";
    localFileSelector.click();
    localFileSelector.onchange = async (_)=>{
        if(localFileSelector.files.length == 0)
            return;
        if(subtitleUpdateInterval != -1){
            // clear old interval
            clearInterval(subtitleUpdateInterval);
            subtitleUpdateInterval = -1;
        }
        if(subtitleEle != null)
            displaySubtitle(""); // clear subtitle div

        const file = localFileSelector.files.item(0);
        let fileTextContent = await file.text();
        if(file.name.endsWith(".vtt")){
            srtEntries = SrtParser.fromVtt(fileTextContent);
        }else srtEntries = SrtParser.parse(fileTextContent);
        // log(srtEntries, appendDebugLog);
        if(srtEntries.length == 0)
            return;

        let subtitleOffset = parseInt($("#offsetInput").value) || 0;
        if(subtitleOffset != 0)
            srtEntries.forEach(entry => entry.offset(subtitleOffset));
        createSubtitle();
        searchAndDisplaySubtitle(vid.currentTime);
        subtitleUpdateInterval = setInterval(()=>{
            vid = (getVideoElement() || videoInfo);
            if(vid.paused)
                return;
            searchAndDisplaySubtitle(vid.currentTime);
        }, 300);

        localFileSelector.value = ""; // delete old selected files
    };
}

function createOffsetInputElement(){
    if(subtitleOffsetInput != null)
        return;
    subtitleOffsetInput = document.createElement("input");
    subtitleOffsetInput.id = "offsetInput";
    subtitleOffsetInput.placeholder = "subtitle offset ms";
    subtitleOffsetInput.style = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 10rem;
        position: absolute;
        left: 5px;
        bottom: 5px; 
        color: white;
    `;
    document.body.append(subtitleOffsetInput);
}

/**
 * Given the current time of video, display the correct subtitle
 */
function searchAndDisplaySubtitle(currentTimeSec){
    let currentTimeMs = currentTimeSec * 1000;
    // not changed yet.
    if(currentEntry && currentTimeMs >= currentEntry.from.total() && currentTimeMs <= currentEntry.to.total())
        return;
    // bin search is significantly faster, though.
    for(let entry of srtEntries){
        if(currentTimeMs >= entry.from.total() && currentTimeMs <= entry.to.total()){
            displaySubtitle(entry.subtitle);
            currentEntry = entry;
            return;
        }
    }
}

function createSubtitle(){
    if(subtitleEle != null)
        return;
    subtitleEle = document.createElement("div");
    subtitleEle.id = "subtitle-display";
    document.body.append(subtitleEle);
}

function displaySubtitle(text = "Dummy text"){
    subtitleEle.textContent = text;
    
    let videoRect = (getVideoElement() || $("iframe")).getBoundingClientRect();
    let topLoc = videoRect.bottom;
    let centerLoc = videoRect.width/2 + videoRect.left;
    // let size = parseInt(window.getComputedStyle(document.body).fontSize);
    // centerLoc -= (size * subtitleEle.textContent.length);
    centerLoc -= subtitleEle.getBoundingClientRect().width / 2;
    subtitleEle.style = `
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 26px;
        top: ${topLoc}px;
        left: ${centerLoc}px;
        z-index: 999;
    `;
}