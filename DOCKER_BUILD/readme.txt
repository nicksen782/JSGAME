How to build JS_GAME as a Docker container:

# BASE BUILD:
$ mkdir JS_GAME
$ mkdir JS_GAME/APP
$ mkdir JS_GAME/JS_GAMES
$ js JS_GAME
$ git clone https://github.com/nicksen782/JSGAME.git APP

If you are installing LOCAL or on a SERVER you will need the base build.
Additionally, look to the Dockerfile here to see what you will need for the server.
The apache-config.conf file is used for setting the Apache virtual host.

See the JS_GAME project's README.md file for additional instructions.