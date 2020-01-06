# JS GAME: JavaScript Game Platform

## What does this aim to be?
The aim of this application is to provide a modular framework for making "retro" games. In this case, "retro" refers to 2-dimensional games from the 8-bit and 16-bit eras within the mid 1970's through the mid 1990's.
You can use it to write games with HTML5 Canvas and JavaScript technologies.
The JS_GAME framework is designed to allow for multiple games selectable via a select menu.

## What does it consist of?
* Framework: The framework handles all the supporting display HTML/CSS/JS. This is JS_GAME.
* Cores: Within JS_GAME are "cores." There are cores for video and cores for audio. One core does not need to depend on another but they both depend on the JS_GAME framework and they will be used by the game.
    * There is one core for video and one core for audio. Others can be created.
* The games themselves.

## How do you make a game?
* The games themselves must select a video and audio core. Games can depend on those cores and JS_GAME itself.
* I cannot explain how to make a game with only a few lines here. However, there are demo games and eventually a tutorial will be created for this. For now check out the game "[JS_GAME: Tetris][_link_jsgame_tetris]."
* Everything about the game should be rendered to the HTML5 canvas but it does not have to be limited to that. You can use "alert" or "prompt" or even AJAX. Do keep in mind though that if you do something visual outside of the game with HTML that it may not look very "retro."

## HOW TO INSTALL:
```sh
# ############
# The easy way
# NOTE: "JS_GAME: Tetris" will be installed automatically if you use the install script.
# ############

# Create a new directory on the destination computer.
# Download the _install.txt file into that directory.

#Rename that file to _install.sh.
mv _install.txt _install.sh
# Make the file executable.
chmod +x _install.sh

# If you want DOCKER container created to host this then un-comment this line in _install.sh (near the bottom.)
#   cd APP/DOCKER_BUILD && ./00A_buildCreateStart.sh
# URL: http://127.0.0.1:8080/

# Run the file
./_install.sh

# After install the file will disable itself.
```

## Install a game! (Manual example)
* To manually install a game you must copy the game directory to JS_GAMES.
* Then you must create an entry in the APP/gamelist.json file.

```sh
# Create/edit the JS_GAME/APP/gameslist.json file to look something like this:
{
	"games": [
		{
    		"gamename":"Tetris (JS)",
    		"header_gameChoice":"Tetris_(JS)",
    		"gamedesc":"",
    		"author":"nicksen782",
    		"gamedir":"../JS_GAMES/Tetris",
    		"AVAILABLE":true
		 }
	]
}

# Other JS_GAMES should have a similar "install" procedure.
```
## Plugins (Credits)

This is a mostly "Vanilla JS" build. Libraries are used when needed. Here they are

| Plugin | Project URL | Info |
| ------ | ----------- | ---- |
| fileSaver.js          | [github.com/eligrey/FileSaver.js][_link_fileSaver.js]               | Used for downloading of generated files. |
| webaudio-tinysynth.js | [github.com/g200kg/webaudio-tinysynth][_link_webaudio-tinysynth.js] | Support for MIDI music. BGM/SFX|

## Additional links/resources

* [Uzebox Main]   [_link_uzebox.org] - Source inspiration. I have been with Uzebox for many years and the experience helped me to make this project possible.
* [Uzebox Forums] [_link_uzebox.org] - Uzebox forums.
* [Uzebox Wiki]   [_link_uzebox.org] - Uzebox wiki


[_link_fileSaver.js]:          <https://github.com/eligrey/FileSaver.js/>
[_link_webaudio-tinysynth.js]: <https://github.com/g200kg/webaudio-tinysynth/>
[_link_uzebox.org]:            <http://belogic.com/uzebox/>
[_link_uzebox_forums]:         <http://uzebox.org/forums/>
[_link_uzebox_wiki]:           <http://uzebox.org/wiki/>
[_link_jsgame_tetris]:         <https://github.com/nicksen782/JSGAME_Tetris/>

