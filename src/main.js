let oldHref = window.location.href;
/**
 * @type {VideoInfo}
 */
let videoInfo;

let forceControls = false;
let firstMessage = true;

window.addEventListener("load", ()=>{
    initHrefObserver();

    setTimeout(()=>{
        log("[Loaded] Seekable Picture In Picture is enabled");
        if(isCurrentPageVideo())
            createOffsetInputElement();
        registerHandlers();
    }, 2000);
});

setTimeout(()=>{
    log("[Forced] Seekable Picture In Picture is enabled");
    if(isCurrentPageVideo())
        createOffsetInputElement();
    registerHandlers();
}, 5000);

chrome.runtime.onMessage.addListener((msg)=>{
    if(msg.name !== "mainchannel") return;
    videoInfo = msg.data;
    if(firstMessage){
        console.log("[+] Received video info: ", videoInfo);
        firstMessage = false;
    }
});

function initHrefObserver(){
    setInterval(()=>{
        if(window.location.href != oldHref){
            log("New page detected, reloading");
            registerHandlers();
            oldHref = window.location.href;
        }
    }, 5000);
}

/**
 * @returns success or not
 */
function registerHandlers(){
    console.log("[*] Keydown event handler is being registered");
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
        firstMessage = true;
        sendMessageToBackground({
            name: "subframe_cmd", 
            data: {action: "retry"}
        });
    }
    if(!vid) return;
    // console.log(e);

    if(e.shiftKey && e.key === "~"){
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
            forceControls = true;
        }else if(e.key === "}")
            forceControls = false;
    }else if(e.shiftKey){
        if(e.key === "{"){
            createOffsetInputElement();
            selectAndDisplaySubtitles();
        }else if(e.key === "}"){
            subtitleOffsetInput.remove();
            subtitleOffsetInput = null;
            subtitleDiv.remove();
            subtitleDiv = null;
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

// -------------- Subtitles ---------------- //
let subtitleUpdateInterval = -1;
/**
 * @type {HTMLInputElement}
 */
let subtitleOffsetInput = null;
/**
 * @type {HTMLDivElement}
 */
let subtitleDiv = null;
/**
 * @type {SrtEntry[]}
 */
let srtEntries = null;
let currentEntry;
function selectAndDisplaySubtitles(){
    let vid = getVideoElement() || videoInfo;
    if(vid == null){
        log("Still cannot find video element.");
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
        if(subtitleDiv != null)
            displaySubtitle(""); // clear subtitle div

        const file = localFileSelector.files.item(0);
        let fileTextContent = await file.text();
        if(file.name.endsWith(".vtt")){
            srtEntries = SrtParser.fromVtt(fileTextContent);
        }else srtEntries = SrtParser.parse(fileTextContent);
        console.log(srtEntries);
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
    if(subtitleDiv != null)
        return;
    subtitleDiv = document.createElement("div");
    subtitleDiv.id = "subtitle-display";
    // styling happens dynamically at `displaySubtitle`
    document.body.append(subtitleDiv);
}

function displaySubtitle(text = "Dummy text"){
    subtitleDiv.textContent = text;
    
    let videoRect = (getVideoElement() || $("iframe")).getBoundingClientRect();
    let topLoc = videoRect.bottom;
    let centerLoc = videoRect.width/2 + videoRect.left;
    // let size = parseInt(window.getComputedStyle(document.body).fontSize);
    // centerLoc -= (size * subtitleDiv.textContent.length);
    centerLoc -= subtitleDiv.getBoundingClientRect().width / 2;
    subtitleDiv.style = `
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 26px;
        top: ${topLoc}px;
        left: ${centerLoc}px;
    `;
}