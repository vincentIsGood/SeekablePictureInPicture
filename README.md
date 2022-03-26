# Seekable Picture In Picture
This is a chrome extension that allows video seeking in picture in picture mode. This extension allows you to seek back and forth 5 seconds.

One of the important features of this chrome extension is to request picture in picture. 

## Request Picture in Picture
To request picture in picture, you need to press `CTRL + ~` on your keyboard. It will find the first video in the page. If there are multiple videos, it is currently not possible to request pip other videos except the first one.

If a video is not found, the extension will find a canvas and turn it into picture in picture. 

## Tips
Since chromium browsers now has some kind of media play back thingy on the top right of the browser, the chrome extension may not work properly.

It is highly recommened to wait until the page is fully loaded until you request picture in picture.