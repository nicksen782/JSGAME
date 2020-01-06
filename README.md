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
* I cannot explain how to make a game with only a few lines here. However, there are demo games and eventually a tutorial will be created for this. For now check out the game "[JSGAME_Tetris](_jsgame_tetris)".
* Everything about the game should be rendered to the HTML5 canvas but it does not have to be limited to that. You can use "alert" or "prompt" or even AJAX. Do keep in mind though that if you do something visual outside of the game with HTML that it may not look very "retro."

## HOW TO INSTALL:
```sh
# BASE BUILD (BOTH BUILD OPTIONS REQUIRE THIS):
$ mkdir JS_GAME
$ mkdir JS_GAME/APP
$ mkdir JS_GAME/JS_GAMES
$ js JS_GAME
$ git clone https://github.com/nicksen782/JSGAME.git APP

# (OPTION #1) DOCKER BUILD:
$ cd JS_GAME/APP/DOCKER_BUILD
$ ./00A_buildCreateStart.sh
# Then, use your browser to go to 127.0.0.1:8080 and click the JS_GAME link.

# (OPTION #2) LOCAL/SERVER BUILD:
# You will need to have PHP and Apache setup.
# Look at the JS_GAME/APP/DOCKER_BUILD files for details.
# Setup a virtual host for the JS_GAME directory.
```

## Install a game! (Manual example)
```sh
$ js JS_GAME
$ git clone https://github.com/nicksen782/JSGAME_Tetris.git JS_GAMES/Tetris

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

* [Uzebox Main]  [_link_uzebox.org] - Source inspiration. I have been with Uzebox for many years and the experience helpped me to make this project possible.
* [Uzebox Forums][_link_uzebox.org] - Uzebox forums.
* [Uzebox Wiki]  [_link_uzebox.org] - Uzebox wiki


[_link_fileSaver.js]:          <https://github.com/eligrey/FileSaver.js/>
[_link_webaudio-tinysynth.js]: <https://github.com/g200kg/webaudio-tinysynth/>
[_link_uzebox.org]:            <http://belogic.com/uzebox/>
[_link_uzebox_forums]:         <http://uzebox.org/forums/>
[_link_uzebox_wiki]:           <http://uzebox.org/wiki/>
[_link_jsgame_tetris]:         <https://github.com/nicksen782/JSGAME_Tetris/>
