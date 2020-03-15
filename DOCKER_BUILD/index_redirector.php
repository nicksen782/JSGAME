<?php
	// This file is added to the Docker web dir under MOUNT and requires the image to be rebuilt if it is updated.
	// So, this file just pulls in the actual index.php which CAN be updated without an image rebuild.
	require "MOUNT/JS_GAME/DOCKER_BUILD/index.php";
?>