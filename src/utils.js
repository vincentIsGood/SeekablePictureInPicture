///@ts-check
const debug = true;
let videoElement = null;

/**
 * @param {Object} msg 
 */
function log(msg){
    if(debug){
        console.log("[*] " + msg);
        logDiv?.append(msg);
    }
}

/**
 * @type {HTMLDivElement}
 */
let logDiv;
function createLog(){
    if(logDiv != null)
        return;
    logDiv = document.createElement("div");
    logDiv.id = "log-display";
    // @ts-ignore
    logDiv.style = `
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 16px;
        top: 0px;
        right: 0px;
        width: 16rem;
    `;
    document.body.append(logDiv);
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