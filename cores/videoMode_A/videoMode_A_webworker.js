// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;
// ctx.globalCompositeOperation="copy";

self.onmessage = function(event) {
	switch( event.data.func ){
		// Called by: core.GRAPHICS.FADER.FUNCS.ProcessFading -> doNewFade.
		case "fade"                     : { fade(event);                     break; }
		case "fade_withOffscreenCanvas" : { fade_withOffscreenCanvas(event); break; }

		// Unmatched function.
		default     : { break; }
	}
}

// Fade effect for when OffscreenCanvas IS NOT available.
function fade(event){
	// Get the passed ArrayBuffer.
	let arr = new Uint8ClampedArray( event.data.buf );

	// Get the passed ArrayBuffer length.
	let len = arr.byteLength;

	// Get the max for red, green, and blue from the passed fade_record.
	let maxRed   = event.data["maxRed"];
	let maxGreen = event.data["maxGreen"];
	let maxBlue  = event.data["maxBlue"];

	// Adjust all pixels to be no higher than the max for that color.
	for(let i=0; i<len; i+=4){
		arr[i+0] = (arr[i+0] * (maxRed   / 100) ) | 0 ;
		arr[i+1] = (arr[i+1] * (maxGreen / 100) ) | 0 ;
		arr[i+2] = (arr[i+2] * (maxBlue  / 100) ) | 0 ;
	}

	// Return the data.
	self.postMessage(
		{ "modbuf"     : event.data["buf"] },
		[ event.data.buf ]
		);
}

// ... haven't figured out a way to do this correctly yet...
// Fade effect for when OffscreenCanvas IS available.
// function fade_withOffscreenCanvas(event){
// 	// Get handle to passed canvas.
// 	let canvas = event.data.canvas;

// 	// // Create new offline canvas and ctx.
// 	// let tmp_off_canvas = new OffscreenCanvas(canvas.width, canvas.height);// .getContext("2d");
// 	// let tmp_off_canvas_ctx = tmp_off_canvas.getContext("2d");

// 	// // Draw the passed canvas to the temp canvas.
// 	// tmp_off_canvas_ctx.drawImage(canvas,0,0);

// 	// arr = tmp_off_canvas_ctx.getImageData(0, 0, tmp_off_canvas.width, tmp_off_canvas.height);

// 	// // Get the passed ArrayBuffer.
// 	// // let arr = new Uint8ClampedArray( event.data.buf );

// 	// // Get the passed ArrayBuffer length.
// 	// let len = arr.byteLength;

// 	// // Get the max for red, green, and blue from the passed fade_record.
// 	// let maxRed   = event.data["maxRed"];
// 	// let maxGreen = event.data["maxGreen"];
// 	// let maxBlue  = event.data["maxBlue"];

// 	// // Adjust all pixels to be no higher than the max for that color.
// 	// for(let i=0; i<len; i+=4){
// 	// 	arr[i+0] = (arr[i+0] * (maxRed   / 100) ) | 0 ;
// 	// 	arr[i+1] = (arr[i+1] * (maxGreen / 100) ) | 0 ;
// 	// 	arr[i+2] = (arr[i+2] * (maxBlue  / 100) ) | 0 ;
// 	// }

// 	// var htmlCanvas = document.createElement("canvas").getContext("bitmaprenderer");
// 	// var offscreen = new OffscreenCanvas(256, 256);
// 	// var gl = offscreen.getContext("webgl");
// 	// var bitmap = offscreen.transferToImageBitmap();
// 	// htmlCanvas.transferFromImageBitmap(bitmap);

// 	// ctx.putImageData(arr, 0,0);
// 	var imageData;

// 	// Return the data.
// 	self.postMessage(
// 		{ "imageData"     : imageData },
// 		[ imageData ]
// 		);
// }