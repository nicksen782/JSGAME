#! /bin/sh

# Get the real path to this script.
BASE_PATH="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
HOSTEDPATH="$(cd ../../"$(dirname "$1")"; pwd)/$(basename "$1")"

echo
# echo "BASE_PATH :"  $BASE_PATH
# echo "HOSTEDPATH:"  $HOSTEDPATH
cd "$BASE_PATH"

echo "REMOVING CONTAINER..."

HOSTEDPATH="$(cd ../../"$(dirname "$1")"; pwd)/$(basename "$1")"

docker rm js_game_container
