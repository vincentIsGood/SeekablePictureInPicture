var mainContent;

window.onload = function(){
	mainContent = document.getElementById("main-content");
	mainContent.innerHTML = "This application operates automatically";
	init();
}

function init(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		var tab = tabs[0];
		tabTitle = tab.title;
		console.log("Current tab: " + tabTitle);
		console.log(tab);
        // execute script on that tab
		//chrome.tabs.executeScript(tab.id, {file:"targetJS.js"});
	});
}