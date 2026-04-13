/**
 * @param {HTMLVideoElement} video 
 * @link https://developer.chrome.com/docs/web-platform/document-picture-in-picture
 */
async function createNewPipWindow(video){
    const width = 1000;
    const height = 600;
    /**
     * @type {Window}
     */
    const pipWindow = await documentPictureInPicture.requestWindow({
        width,
        height,
    });
    pipWindow.document.head.append(Object.assign(document.createElement("style"), {
        innerHTML: `
        *{
            margin: 0;
            padding: 0;
        }
        body {
            overflow-y: hidden;
            overflow-x: hidden;
            background-color: #0f0f0f;
        }
        video {
            position: absolute;
            left: 0px;
            top: 0px;
        }
        `
    }));


    const originalVideoStyles = video.style;
    video.style = "";
    video.style.width = width + "px";
    video.style.height = height + "px";
    video.width = null; // override just in case
    video.height = null; // override just in case

    const overlay = overlayVideoForControls(video);
    
    pipWindow.addEventListener("resize", ()=>{
        video.style.width = pipWindow.innerWidth + "px";
        video.style.height = pipWindow.innerHeight + "px";
        overlay.style.width = pipWindow.innerWidth + "px";
        overlay.style.height = pipWindow.innerHeight + "px";
    });
    
    // Put video back to original page
    const videoParent = video.parentElement;
    const videoNextSibling = video.nextSibling;
    pipWindow.addEventListener("pagehide", (e) => {
        video.style = originalVideoStyles;
        if(videoNextSibling) videoParent.insertBefore(video, videoNextSibling);
        else videoParent.appendChild(video);
    });

    videoControls(video, overlay);
    pipWindow.document.body.append(video);
    pipWindow.document.body.append(overlay);
    return pipWindow;
}

/**
 * @param {HTMLVideoElement} video 
 * @param {HTMLDivElement} overlay 
 */
function videoControls(video, overlay){
    overlay.addEventListener("click", ()=>{
        if(video.paused) video.play();
        else video.pause();
    });

    const sliderBar = overlay.querySelector(".slider-bar");
    const sliderWatched = overlay.querySelector(".slider-watched");
    const sliderThumb = overlay.querySelector(".slider-thumb");

    const updateSlidebarUi = ()=>{
        const properWidth = video.currentTime / video.duration * sliderBar.getBoundingClientRect().width;
        sliderWatched.style.width = `${properWidth}px`;
        sliderThumb.style.left = `${properWidth}px`;
    }

    let slideBarDragging = false;
    const dragSlidebarUi = (e)=>{
        /**
         * @type {MouseEvent}
         */
        const event = e;
        
        const seekPercent = event.clientX / sliderBar.getBoundingClientRect().width;
        sliderWatched.style.width = `${event.clientX}px`;
        sliderThumb.style.left = `${event.clientX}px`;
        video.currentTime = Math.round(video.duration * seekPercent);
        slideBarDragging = true;
        e.stopPropagation();
    };

    updateSlidebarUi();
    video.addEventListener("waiting", (e)=>console.log("waiting", e)); // show spinner here
    video.addEventListener("timeupdate", updateSlidebarUi);
    sliderBar.addEventListener("mousedown", dragSlidebarUi);
    overlay.addEventListener("mousemove", (e)=>{
        if(!slideBarDragging) return;
        dragSlidebarUi(e);
    });
    overlay.addEventListener("mouseup", (e)=>{
        slideBarDragging = false;
        video.play();
    });
}

/**
 * @param {HTMLVideoElement} video 
 */
function overlayVideoForControls(video){
    const divEle = document.createElement("div");
    divEle.style.position = "relative";
    divEle.style.left = "0px";
    divEle.style.top = "0px";
    divEle.style.width = video.style.width;
    divEle.style.height = video.style.height;
    divEle.style.zIndex = 5;
    divEle.innerHTML = `
    <style>
        .slider-bar{
            position: absolute;
            bottom: 0;
            width: 100vw;
            height: 1rem;
        }
        .slider-bar::before{
            content: "";
            position: absolute;
            width: 100vw;
            height: 0.5rem;
            background-color: white;
            opacity: 0.2;
            translate: 0 50%;
        }
        .slider-thumb{
            position: absolute;
            left: 0;
            width: 1rem;
            height: 1rem;
            border-radius: 0.5rem;
            background-color: red;
            opacity: 0.8;
        }
        .slider-watched{
            content: "";
            position: absolute;
            left: 0;
            width: 100%;
            height: 0.5rem;
            background-color: red;
            opacity: 0.8;
            translate: 0 50%;
        }
    </style>
    <div class="slider-bar">
        <div class="slider-watched" style="width: 0px"></div>
        <div class="slider-thumb" style="left: 0px"></div>
    </div>
    `;
    return divEle;
}