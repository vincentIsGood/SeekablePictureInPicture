///@ts-check
const debug = true;
let videoElement = null;

/**
 * @param {Object} msg 
 */
function log(msg){
    if(debug){
        console.log("[*] " + msg);
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

function isCurrentPageMp4OrMp3(){
    const dotPosition = window.location.href.lastIndexOf(".");
    if(dotPosition == -1) return false;

    const urlFileExtension = window.location.href.substring(dotPosition);
    if(urlFileExtension === ".mp4" || urlFileExtension === ".mp3")
        return true;
    return false;
}

function isInIframe(){
    return window.self !== window.top;
}

/**
 * @returns {HTMLVideoElement | null}
 */
function getVideoElement(){
    if(videoElement)
        return videoElement;
    return videoElement = $("video");
}

function sendMessageToBackground(msg){
    /// @ts-ignore
    chrome.runtime.sendMessage(msg);
}

class MessageInfo{
    /**
     * @type {name} channel name
     */
    name;
    
    /**
     * @type {any}
     */
    data;
}

class VideoInfo{
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