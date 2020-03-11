# RPG Touch Table

## Overview
RPG Touch Table is an easy to use, touch-friendly interface to manage and move tokens around a 2d map. It is intended for use by a DM/GM in pen and paper RPGs such as DnD and Dungeon World. 

## Usage
Run the program, then drag an image of your map (overworld or dungeon, or anything else) from your hard drive or a web browser into the main window. Drag tokens out of the left sidebar and onto the map. Use your scroll wheel or pinch to zoom to scale the tokens. Drag them to move them around. Some helpful tools like a 'fog of war' type token can be used to obscure parts of the map, check out the Shapes section.

![Screenshot](https://i.imgur.com/MFJgXec.jpg)

## Thanks
Thank you to the artists of the Dungeon Crawl Stone Soup tilesets!

# Development

## License
Code: GPLv3
Art: CC0 (https://opengameart.org/content/dungeon-crawl-32x32-tiles)

## Contribution
Feel free to submit pull requests containing feature enhancements, CC0 or public domain art tiles for use with the tool! Any submitted pull request code must be licensed GPLv3 to be included.  

## Roadmap

* Rewrite pinch to zoom on tokens
* Add dice tokens
* Add more useful shape tokens
* Add proper pinch to zoom on whole map area
* First-run tutorial

## Setup

`npm install -g electron@latest`
`npm install`

## Run
`npm start`

## Build
`npm install -g electron-packager`
`electron-packager rpgtouchtable RPGTouchTable --overwrite --icon=rpgtouchtable/icon.ico`
