// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
	switch( event.data.func ){
		case "fade" : { fade(event); break; }
		default     : { break; }
	}
}

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
		{
			"modbuf"     : event.data["buf"] ,
		}
		,[
			event.data.buf
		]
	);
}