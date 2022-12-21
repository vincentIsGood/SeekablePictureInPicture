# Seekable Picture In Picture
This is a chrome extension that allows video seeking in picture in picture mode. This extension allows you to seek back and forth 5 seconds.

One of the important features of this chrome extension is to request picture in picture. 

## Request Picture in Picture
To request picture in picture, you need to press `SHIFT + ~` on your keyboard. It will find the first video in the page. If there are multiple videos, it is currently not possible to request pip other videos except the first one.

If a video is not found, the extension will find a canvas and turn it into picture in picture. 

## Adding Subtitles (.srt only)
This feature works best when you watch video on chromium browser with local files, like `file://path/to/local.mp4`, though it should still work on normal video streaming websites.

To this feature (**activate** this feature), press `{` anywhere in the page (ie. `SHIFT + [`). A file manager is shown for you to select a file. Make sure you select an `.srt` file.

The subtitle should now show below the video (not in the video). 

### Subtitle Timing
To adjust the timing of the `.srt`, go to the bottom-left side of the screen (after activating the feature, ie. pressing `{`) and type in the offset. After adjusting the timing, you are required to re-import the file by pressing `{` again and select the same `.srt` file.

## Tips
Since chromium browsers now has some kind of media play back thingy on the top right of the browser, the chrome extension may not work properly.

It is highly recommened to wait until the page is fully loaded until you request picture in picture.