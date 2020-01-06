#! /bin/sh

# Get the real path to this script.
BASE_PATH="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
HOSTEDPATH="$(cd ../../"$(dirname "$1")"; pwd)/$(basename "$1")"

echo
# echo "BASE_PATH :"  $BASE_PATH
# echo "HOSTEDPATH:"  $HOSTEDPATH
cd "$BASE_PATH"

echo "CREATING CONTAINER..."

docker create --mount type=bind,source="$HOSTEDPATH",target=/var/www/site/MOUNT -p 8080:80 --name js_game_container js_game
