# JSGAME V3
A modular system providing a platform to host games.
You can use it to write games with HTML5 Canvas and JavaScript technologies.

## What does JSGAME consist of?
JSGAME itself is a collection of shared plug-ins such as for a UI, Graphics, Sound, and Input. Each plug-in is optional. For example, there is a game that only uses the UI (SnakeGame.) Some games use VideoModeA such as the Input Tester and the Tetris-clone. Uno uses VideoModeB.
The goal is to provide this plug-ins for use or for research but nothing is stopping you from creating and using your own or modifying an existing plug-in for your needs.

## So, the plug-ins are shared via JSGAME?
Yes, they are available as part of the JSGAME repository. If you want to create your own plug-in to replace a shared one you can do that if you would like. 

## How do I create my own plug-in?
This can be a very complex answer. You may want to look at the existing plug-ins to see how they work before writing your own. Remember, when you create a plug-in you determine it's capabilities and it's limitations. Good planning is paramount. Any plug-ins that are not shared will need to be included in your game's code.

## How do I create a game?
* I cannot explain how to make a game with only a few lines here. However, there are demo games and eventually a tutorial will be created for this. For now check out the game "[JSGAME: Uno][_link_jsgame_uno]."
* Everything about the game should be rendered to the HTML5 canvas but it does not have to be limited to that. You can use "alert" or "prompt" or even AJAX. Do keep in mind though that if you do something visual outside of the game with HTML that it may not look very "retro."

## What games currently exist using JSGAME technologies? 

Some games that are available:
* [JSGAME: Uno][_link_jsgame_uno]
  * Uses videoModeB, inputModeA. 
  * Is a card game based on the Uno card game from Mattel.
* [JSGAME: VideoModeB Tests][_link_jsgame_vmbtest]
  * Uses videoModeB, inputModeA. 
  * Is a test of videoModeB functions. 
* [JSGAME: Tetris][_link_jsgame_tetris]
  * Uses videoModeA, inputModeA. 
  * A clone of Tetris.
* [JSGAME: InputA Tester][_link_jsgame_inputtester]
  * Uses videoModeA, inputModeA. 
  * Is a test of inputModeA functions. 
* [JSGAME: SnakeGame][_link_jsgame_snakegame]
  * Uses only the BASE_UI_A. Everything else is provided within the game.
  * A simple version of the popular game, Snake.

## How to install (Requires NodeJs):
```sh
# Install JSGAME
git clone https://github.com/nicksen782/JSGAME
cd JSGAME
npm install

# Install a game.
cd GAMES
git clone https://github.com/nicksen782/JSGAME_Uno

# NOTE: A game may have npm packages. Follow the game's README.md file for more information.

# Start the JSGAME server.
# Go back to the main JSGAME directory.
cd .. 
# Start the server.
node index.js

# NOTE: If you want JSGAME to stay running after a reboot then you may want to consider using something like PM2.
```

## Additional links/resources

* [Uzebox Main][_link_uzebox.org] - Source inspiration. I have been with Uzebox for many years and the experiences helped me to make this project possible.
* [Uzebox Forums][_link_uzebox_forums] - Uzebox forums.
* [Uzebox Wiki][_link_uzebox_wiki] - Uzebox wiki


[_link_uzebox.org]:        <http://belogic.com/uzebox/>
[_link_uzebox_forums]:     <http://uzebox.org/forums/>
[_link_uzebox_wiki]:       <http://uzebox.org/wiki/>

[_link_jsgame_uno]:        <https://github.com/nicksen782/JSGAME_Uno/>
[_link_jsgame_vmbtest]:    <https://github.com/nicksen782/JSGAME_videoModeB_TESTS/>
[_link_jsgame_tetris]:     <https://github.com/nicksen782/JSGAME_Tetris/>
[_link_jsgame_inputtester]:<https://github.com/nicksen782/JSGAME_InputTester/>
[_link_jsgame_snakegame]:  <https://github.com/nicksen782/SnakeGame/>