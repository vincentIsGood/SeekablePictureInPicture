///@ts-check
const debug = true;
let videoElement = null;

/**
 * @type {HTMLDivElement}
 */
// @ts-ignore
let debugLogEle = null;

function createDebugLog(){
    if(debugLogEle != null)
        return;
    debugLogEle = document.createElement("div");
    debugLogEle.id = "debug-log-display";
    document.body.append(debugLogEle);
    appendDebugLog("[PiP-INFO] Created debug log");
}

function appendDebugLog(text = "Dummy text"){
    if(!debugLogEle) return;
    // @ts-ignore
    debugLogEle.style = `
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 15px;
        right: 0;
        top: 0;
        width: 20rem;
        white-space: pre;
    `;
    debugLogEle.textContent += text + "\n";
}

/**
 * @param {Object} msg 
 * @param {(msg: string)=>void} callback
 */
function log(msg, callback){
    if(debug){
        console.log(msg);
        callback?.(msg);
    }
}

/**
 * @template {keyof HTMLElementTagNameMap} K - K is the keyof HTMLElementTagNameMap (= the type of the value of HTMLElementTagNameMap)
 * @param {K} query
 * @return {HTMLElementTagNameMap[K] | null} - returns the type after dereferencing HTMLElementTagNameMap[K]
 */
function $(query){
    return document.querySelector(query);
}

function isCurrentPageVideo(){
    const dotPosition = window.location.href.lastIndexOf(".");
    if(dotPosition == -1) return false;

    const urlFileExtension = window.location.href.substring(dotPosition);
    switch(urlFileExtension){
        case ".webm":
        case ".mp4":
        case ".mp3": return true;
        default: return false;
    }
}

function isInIframe(){
    return window.self !== window.top;
}

/**
 * @returns {HTMLVideoElement | null}
 */
function getVideoElement(){
    // if(videoElement)
    //     return videoElement;
    return videoElement = $("video");
}

function sendMessageToBackground(msg){
    /// @ts-ignore
    chrome.runtime.sendMessage(msg);
}


//// -------------------- PIP Utils -------------------- ////
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

//// -------------------- Data Types -------------------- ////
class MessageInfo{
    /**
     * @type {name} channel name
     */
    name;
    
    /**
     * @type {VideoInfo | VideoCommandMessage}
     */
    data;
}

class VideoCommandMessage{
    /**
     * @type {"pip" | "seekforward" | "seekbackward"}
     */
    action;
    
    /**
     * @type {number} number for seeking forward / backward by an amount
     */
    data;
}

class VideoInfo{
    signature = "VideoInfo";

    /**
     * @type {boolean}
     */
    hasVideo;
    
    /**
     * @type {number}
     */
    currentTime;

    /**
     * @type {number}
     */
    duration;

    /**
     * @type {boolean}
     */
    ended;

    /**
     * @type {boolean}
     */
    paused;

    /**
     * @type {number}
     */
    readyState;

    /**
     * @type {TimeRanges}
     */
    seekable;

    /**
     * @type {string}
     */
    src;

    /**
     * @type {number}
     */
    volume;
}