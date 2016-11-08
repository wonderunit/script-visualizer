# Script Visualizer

Script Visualizer simply displays your screenplay so you can experience it like a movie.

It automatically goes through the script and calculates the timing for each scene, so when you play it back, it will be very similar to actual shot video. Additionally, Script Visualizer can read the script back to you as you edit your script.

Script Visualizer is just a viewer. You write your screenplay, Script Visualizer provides a time-paced way to view it.

### Why use this?

Ultimately, the content of 120 pages of feature script are hard to keep in your head. This visualizer allows you just another way to look at your script from an objective perspective and perhaps allow you to see something in your script you might have otherwise missed. It's also a nice tool to use as you're writing to double check pacing, feeling, language, etc. It's also an enjoyable way to read a script!

Simply open a screenplay in PDF or Fountain format.

## Installation

```
# Clone this repository
git clone https://github.com/setpixel/script-visualizer
# Go into the repository
cd script-visualizer
# Install dependencies
npm install
# Run the app
npm start```

## How to use

1. Load script
2. Press play

It's very simple. You can also choose whether you want it to speak or not. 

### The user interface

On the left is a list of every scene in order. You can click any scene to go right to it. The colors represent the unique scene. If you have different scenes in the same location, they will always be the same color.

On the right, is the content that will be played back, and the navigation below.

In the navigation, there are 2 timelines. On the top, is the current scene you are on. It will display each piece of dialogue or action over the time for that particular scene. Top character's dialogue will appear in neon colors.

### Use it while writing

When you make changes to the script, SV detects and will update automatically. SV will also advance automatically to the scene you last edited and automatically play it if you want. This means that you can have SV automatically read to you every time you press command+S in your script editor.

## Feedback Please!

If you notice any bugs or have feedback, please open a github issue!

Thanks!
