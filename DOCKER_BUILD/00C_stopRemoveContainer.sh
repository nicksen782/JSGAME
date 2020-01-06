#! /bin/sh

# Get the real path to this script.
ORG_PATH="$(dirname "$1")"
BASE_PATH="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
HOSTEDPATH="$(cd ../../"$(dirname "$1")"; pwd)/$(basename "$1")"

echo
# echo "BASE_PATH :"  $BASE_PATH
# echo "HOSTEDPATH:"  $HOSTEDPATH
cd "$BASE_PATH"

./04_stop.sh  && \
cd "$ORG_PATH" && ./05_removeContainer.sh && \
echo "DONE"