/*
TO DO:

https://github.com/g200kg/webaudio-tinysynth
core.FUNCS.audio.TODO_resumeAllSounds
core.FUNCS.audio.TODO_pauseAllSounds
core.FUNCS.audio.changeMasterVolume

Have the MIDI player respect the master volume value.

*/

core.ASSETS.audio     = {} , // Audio lookup to the audio elements and some extra data.
core.FUNCS.audio      = {} ; // Functions for audio.
core.AUDIO            = {} ; // Audio elements and some extra data.
core.AUDIO.midiSynths = {} ; // Synths used by TinySynth
core.AUDIO.midiData   = {} ; // MIDI data used by TinySynth

// *** Init conversion functions - Removed after use. ***
core.FUNCS.audio.init = function(){
	return new Promise(function(resolve,reject){
		// Preload all sounds. (mp3 format)
		let soundsSetup_mp3 = function(){
			return new Promise(function(SNDresolve,SNDreject){
				// ['mp3_files']
				let audio_proms = [];
				let gamedir     = parentPath + JSGAME.PRELOAD.gameselected_json['gamedir'].replace("../", "");

				// JSGAME.PRELOAD.gamesettings_json['RAM_TILES_COUNT'];
				core.AUDIO['elems']          = {};
				core.ASSETS.audio['lookups'] = {};

				// Normal .mp3 audio.
				JSGAME.PRELOAD.gamesettings_json['mp3_files'].forEach(function(d){
					core.AUDIO['elems'][ d.key ] = {};
					// core.AUDIO['keys'][ d.key ]['elem']    = document.createElement("audio");
					core.AUDIO['elems'][ d.key ]    = document.createElement("audio");

					// Add entry to the lookup table.
					d['names'].forEach(function(dd){
						core.ASSETS.audio['lookups'][ dd ] = {};
						core.ASSETS.audio['lookups'][ dd ]['key']  = d.key;
						core.ASSETS.audio['lookups'][ dd ]['type'] = d.type;
					});

					// Get the audio file as-is.
					core.AUDIO['elems'][ d.key ].src = gamedir + "/" + d['fileurl'];
					core.AUDIO['elems'][ d.key ].volume=0.0;
					let prom ;
					prom = core.AUDIO['elems'][ d.key ].play();

					// Ask the server to gzip it before sending.
					// TODO

					// Immediately pause, and reset the audio when the promise resolves.
					prom.then(
						function(){
							var isPlaying = function (currentAudio) {
								return  currentAudio
									&&  currentAudio.currentTime > 0
									&& !currentAudio.paused
									&& !currentAudio.ended
									&&  currentAudio.readyState > 2;
							}
							if(isPlaying){ core.AUDIO['elems'][ d.key ].pause(); }
							core.AUDIO['elems'][ d.key ].currentTime=0;
							core.AUDIO['elems'][ d.key ].volume=1.0;
						},
						function(err){
							console.error("ERROR: Could not play audio.", err, d.key);
							alert("ERROR: SEE DEV CONSOLE FOR DETAILS.");
							throw "ERROR";
							SNDreject();
						});

					// Add the audio to the promises array.
					audio_proms.push(prom);
				});

				// audio_proms (For normal .mp3 audio.)
				Promise.all(audio_proms).then(function(){
					SNDresolve();
				}
				,function(err){ console.error("ERROR: Some promises may not have resolved. ", err); SNDreject(); });
			});
		};

		// Preload all sounds. (.midi format)
		let soundsSetup_midi = function(){
			// Get the combined MIDI binary and parse it.
			function load_midi_bin(){
				return new Promise(function(resolve,reject){
					// Determine the http filepath to the file.
					let gamedir      = parentPath + JSGAME.PRELOAD.gameselected_json['gamedir'].replace("../", "");
					let bin_filepath = gamedir + "/"+JSGAME.PRELOAD.gamesettings_json['midi_bin'] ;

					// Each file download is a promise. Keep an array of the promises.
					let proms = [];

					// Start file download.
					proms.push( JSGAME.SHARED.getFile_url_arraybuffer( bin_filepath ) );

					// When all file downloads have completed then parse the binary data.
					Promise.all(proms).then(
						function(res1){

							// One file should have been received. Set the res1 variable as the first array index of the results.
							res1=res1[0];

							// Offset.
							let offset = 0;

							// *** TOP BINARY PORTION ***

							// Create views for the received ArrayBuffer.
							let bin_view8  = new Uint8Array (res1) ;
							let bin_view16 = new Uint16Array(res1) ;
							let bin_view32 = new Uint32Array(res1) ;

							// Bytes 0-1
							let numSongs        = bin_view16[0] ;
							let RESERVED        = bin_view16[1] ;

							// Bytes 2-4
							let headerOffset    = bin_view32[1] ;
							let filenamesOffset = bin_view32[2] ;
							let dataOffset      = bin_view32[3] ;

							// *** READ FILENAMES FROM BINARY FILE ***

							// Expected length for filename entries.
							let filename_length = 20;
							// Expected length for filetype entries.
							let filetype_length = 7;
							// Hold the parsed filename/filetype data.
							let filename_data = [];
							// Reset the offset value.
							offset = 0;
							// Go through (for each song index) and get each entry for filename and filetype.
							for(let i=0; i<numSongs; i+=1){
								// Strings to hold our key and type.
								let name  = "";
								let type = "";

								// Read through the bytes and add them to the name string. (Decode from char code to char.)
								for(let i2=0; i2<filename_length; i2+=1){
									let test = bin_view8[offset+filenamesOffset+i2];
									name += String.fromCharCode(test);
								}
								// Adjust the offset by the expected filename length.
								offset+=filename_length;

								// Read through the bytes and add them to the type string. (Decode from char code to char.)
								for(let i3=0; i3<filetype_length; i3+=1){
									let test = bin_view8[offset+filenamesOffset+i3];
									type += String.fromCharCode(test);
								}
								// Adjust the offset by the expected filetype length.
								offset+=filetype_length;

								// Add the new key, type to filename_data. Use "trim()" on each string.
								filename_data.push({
									"key"  : name.trim() ,
									"type" : type.trim() ,
								});
							}

							// *** READ HEADER DATA FROM BINARY FILE ***

							// Hold the parsed header data.
							let header_data = [];
							// Set the offset value to the header offset.
							offset = headerOffset;
							// Go through (for each song index) and get each entry for start and end.
							for(let i=0; i<numSongs; i+=1){
								// Add the new start, end to the header data.
								header_data.push({
									"start" : bin_view32[ (offset/4)+0 ] ,
									"end"   : bin_view32[ (offset/4)+1 ] ,
								});

								// Go to the next entry by adjusting the offset by the byteLength of start and end.
								offset+=8;
							}

							// *** CREATE THE MUSIC DATA OBJECT ***

							// Hold the retrieved song data(s).
							let musicData = {};
							// Go through (for each song index) and get the song data(s).
							for(let i=0; i<numSongs; i+=1){
								// Copy the range of bytes for this entry.
								let songData = bin_view8.slice(
									dataOffset + header_data[i].start,
									dataOffset + header_data[i].end
								);

								// Create the musicData object for this song.
								musicData[ filename_data[i].key ] = {
									"key" : filename_data[i].key  ,
									"type": filename_data[i].type ,
									"data": songData              ,
								};
							}


							resolve(  musicData );
						}
						,function(err){ console.log(err); reject(); });
				});
			}
			// Brings in the Tiny Synth library.
			let import_tinysynth = function(){
				return new Promise(function(resolve,reject){
					// Create the script element.
					let script = document.createElement("script");

					// Do this when the script has completed load.
					script.onload=function(){
						script.onload=null;
						resolve();
					};

					// Set the source of the script.
					script.src="libs/webaudio-tinysynth.min.js"; // Minified
					// script.src="libs/webaudio-tinysynth.js";     // Not minified.

					// Add the element to the document body.
					document.body.appendChild(script);
				});
			};

			// Download the MIDI binary, parse the MIDI binary, load Tiny Synth.
			return new Promise(function(resolve,reject){
				load_midi_bin().then(
					function(res){
						// Save the parsed MIDI data.
						core.AUDIO.midiData=res;

						// Import Tiny Synth and then create the individual synths.
						import_tinysynth().then(
							function(){
								// Tiny Synth outputs junk to the console when starting and when a synth is created.
								// Temporarily remove the console.log function until Tiny Synth setup is complete.
								let old = console.log;
								console.log = function(){};

								// Will contain a list of synths made by Tiny Synth. They are also promises.
								let proms = [];

								let midi_synths = Object.keys( JSGAME.PRELOAD.gamesettings_json['midi_synths'] );

								// Create the synths for MIDI.
								// JSGAME.CORE_SETUP_PERFORMANCE.starts.sound_midi_synth=performance.now();
								for(let i=0; i<midi_synths.length; i+=1){
									// if(i==1){ break; };

									// Get the key.
									let key = midi_synths[i];
									// Get the record.
									let rec = JSGAME.PRELOAD.gamesettings_json['midi_synths'][key];
									// Get the record synthOptions.
									let synthOptions = rec.synthOptions;
									// Get the record options.
									let options = rec.synthOptions;

									// Create synth with the specified settings.
									core.AUDIO.midiSynths[key] = new WebAudioTinySynth( synthOptions );

									// core.AUDIO.midiSynths.music1.setVoices(synthOptions.voices);
									// core.AUDIO.midiSynths.music1.setQuality(synthOptions.quality);
									// core.AUDIO.midiSynths.music1.setReverbLev(synthOptions.useReverb);

									// Loop?
									if(options.loop){ core.AUDIO.midiSynths[key].setLoop(false); }
									else            { core.AUDIO.midiSynths[key].setLoop(false); }

									// Master volume?
									if(options.masterVol){ core.AUDIO.midiSynths[key].setMasterVol(options.masterVol); }
									else                 { core.AUDIO.midiSynths[key].setMasterVol(1.0); }

									// Reverb level?
									if(options.reverbLev){ core.AUDIO.midiSynths[key].setReverbLev(options.reverbLev); }
									// else                 { core.AUDIO.midiSynths[key].reverbLev=0.3; }

									// Is the synth ready?
									if( core.AUDIO.midiSynths[key].isReady ){
										// Already ready. No need to add a promise to the list.
										// console.log("synth:", key, "is ready!");
										// proms.push( new Promise(function(resolve,reject){resolve();}) );
									}
									// If it is NOT ready then wait for it by adding a promise to the proms array.
									else{
										// console.log("synth:", key, "is NOT ready!");
										proms.push( core.AUDIO.midiSynths[key].ready() );
									}
								}

								// Wait for all the synths to become ready.
								Promise.all(proms).then(function(res){
									// JSGAME.CORE_SETUP_PERFORMANCE.ends.sound_midi_synth=performance.now();
									// Restore the console.log functionality.
									console.log = old;

									// JSGAME.CORE_SETUP_PERFORMANCE.times.sound_midi_synth=JSGAME.CORE_SETUP_PERFORMANCE.ends.sound_midi_synth-JSGAME.CORE_SETUP_PERFORMANCE.starts.sound_midi_synth;

									// Console the MIDI data.
									// console.log("midiSynths:", core.AUDIO.midiSynths);
									// console.log("midiData  :", core.AUDIO.midiData  );

									// Resolve the outer Promise.
									resolve();
								}
								,function(err){ console.log(err); reject(); });
							}
							,function(err){ console.log(err); SNDreject(); });
					}
				);
			});
		};

		JSGAME.CORE_SETUP_PERFORMANCE.starts.SOUND      = performance.now();
		JSGAME.CORE_SETUP_PERFORMANCE.starts.sound_mp3  = performance.now();
		soundsSetup_mp3().then(
			function(res1){
				JSGAME.CORE_SETUP_PERFORMANCE.ends  .sound_mp3  = performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times .sound_mp3  = JSGAME.CORE_SETUP_PERFORMANCE.ends.sound_mp3  - JSGAME.CORE_SETUP_PERFORMANCE.starts.sound_mp3 ;

				JSGAME.CORE_SETUP_PERFORMANCE.starts.sound_midi = performance.now();
				soundsSetup_midi().then(
					function(res2){
						JSGAME.CORE_SETUP_PERFORMANCE.ends  .sound_midi = performance.now();
						JSGAME.CORE_SETUP_PERFORMANCE.times .sound_midi = JSGAME.CORE_SETUP_PERFORMANCE.ends.sound_midi - JSGAME.CORE_SETUP_PERFORMANCE.starts.sound_midi;

						JSGAME.CORE_SETUP_PERFORMANCE.ends  .SOUND = performance.now();
						JSGAME.CORE_SETUP_PERFORMANCE.times .SOUND = JSGAME.CORE_SETUP_PERFORMANCE.ends.SOUND      - JSGAME.CORE_SETUP_PERFORMANCE.starts.SOUND     ;

						resolve();
					},
					function(err2){ console.error("ERROR 2: A failure has occurred while loading audio.", err2); }
				);
			},
			function(err1){
				console.error("ERROR 1: A failure has occurred while loading audio.", err1);
			}
		);

		/*
		// Load the support music/file types.
		let proms1 = [
			soundsSetup_mp3()  ,
			soundsSetup_midi() ,
		];

		// When loading has completed...
		Promise.all(proms1).then(
			function(res){
				// Done!
				resolve();
			},
			function(err){
				console.error("ERROR: A failure has occurred while loading audio.", err);
			},
		);
		*/

	});
};

// *** Sound/audio control (MP3) ***

// Cancel all sounds (mp3) (stop the sound and reset the currentTime value.)
core.FUNCS.audio.cancelAllSounds_mp3 = function(type){
	// EXAMPLE:
	// core.FUNCS.audio.cancelAllSounds_mp3('all');
	// core.FUNCS.audio.cancelAllSounds_mp3('mp3_sfx');
	// core.FUNCS.audio.cancelAllSounds_mp3('mp3_bgm');

	// Make sure a valid type was specified.
	if(type==undefined || ['mp3_sfx', 'mp3_bgm', 'all'].indexOf(type) == -1){
		console.log("ERROR in cancelAllSounds_mp3: A type was not specified.");
		return ;
	}

	let keys = Object.keys( core.AUDIO['elems'] );

	let d;
	let len = keys.length;

	for(let i=0; i<len; i+=1){
		d=keys[i];

		// Turn off either the specified type or all depending on what was specified.
		if(d.type==type || type=="all"){
			// Abort if the sound was never used ...
			if(core.AUDIO['elems'][d].elem==undefined){ return; }

			// Pause the sound.
			core.AUDIO['elems'][d].pause();

			// Reset the time index.
			core.AUDIO['elems'][d].elem.currentTime=0;
		}
	}

};
// Plays Sound FX and Music.
core.FUNCS.audio.playSound_mp3 = function(soundKey, retrigger, volume){
	// core.FUNCS.audio.playSound_mp3("payfee1", true, 1.0);

	// If volume or retrigger where not specified then provide default values.
	if(volume    == undefined){ volume=1.0;     };
	if(retrigger == undefined){ retrigger=true; };

	// Actual audio elements are found here:
	// core.AUDIO['elems']

	// Available sounds are setup here: core.ASSETS.audio.lookups.
	// This function uses different names that are unlikely to change in the code.
	// Easier to change where each sound points to via here.

	let playSound = function(soundKey, retrigger, volume){
		// Get the src value.
		let elem = core.AUDIO['elems'][soundKey];

		// If the src is invalid, bail out.
		if(!elem) {
			// Invalid soundKey was specified.
			console.log("ERROR in playSound_mp3, cancelAllSound: A valid soundKey was not specified.");
			return ;
		}

		// Play the sound.

		// Reset the time index if specified.
		if(retrigger){ elem.currentTime=0; }

		// Adjust volume.
		elem.volume = volume;

		// Adjust the volume against the master volume value.
		try     { elem.volume = (100 * JSGAME.SHARED.masterVolume/100)/100 ; }
		catch(e){ console.log("WARNING: Unable to read the master volume."); }

		// Play the sound.
		let prom = elem.play().then(
			function(){},
			function(res){ console.error("PLAY ERROR:", res, elem); }
		);

	};

	// Make sure the specified sound exists.
	let keys = Object.keys( core.ASSETS.audio.lookups );
	if( keys.indexOf( soundKey) !=-1) {
		// Based on what soundKey is specified, determine what sound to play.
		let sound = core.ASSETS.audio.lookups[soundKey].key;

		// If the sound is not set then just return.
		if(sound==""){ return ; }

		// Good, the sound was found. Play it.
		playSound(sound , retrigger, volume);
	}
	else{
		// Invalid soundKey was specified.
		console.log("Invalid soundKey was specified:", soundKey, core.ASSETS.audio.lookups);
		return;
	}

};

// *** Sound/audio control (MIDI) ***

// (MIDI)
core.FUNCS.audio.resume_midi = function(synthKey){
	if(synthKey==""){ return; }

	let synth = core.AUDIO.midiSynths[synthKey];
	if(! synth.getPlayStatus().play ){ synth.playMIDI(); }
}
// (MIDI)
core.FUNCS.audio.stop_midi = function(synthKey, resetPosition){
	if(synthKey==""){ return; }

	let synth = core.AUDIO.midiSynths[synthKey];
	if( synth.getPlayStatus().play ){
		if(resetPosition){ synth.locateMIDI(0); }
		synth.stopMIDI();
	}
}
// (MIDI)
core.FUNCS.audio.play_midi = function(synthKey, soundKey, loop, vol){
	if(synthKey==""){ return; }
	if(soundKey==""){ return; }
	if(loop == undefined){ loop = false; }
	if(vol  == undefined){ vol  = 1.0; }

	let synth    = core.AUDIO.midiSynths[synthKey];
	let midiData = core.AUDIO.midiData[soundKey]["data"]

	synth.masterVol=vol;
	synth.setLoop(loop);
	synth.loadMIDI( midiData );
	synth.playMIDI();
}

// Cancel all sounds (MIDI) (can also reset the position to 0.)
core.FUNCS.audio.stopAllSounds_midi = function(resetPosition){
	// Do a pause on all synths and then reset their song position to 0.

	// Get the synth keys.
	let keys1 = Object.keys(core.AUDIO.midiSynths);

	// Synths for MIDI.
	for(let i=0; i<keys1.length; i+=1){
		let synthKey = keys1[i];
		let synth    = core.AUDIO.midiSynths[synthKey];
		let status   = synth.getPlayStatus();
		if( status.play ){
			if(resetPosition){ synth.locateMIDI(0); }
			synth.stopMIDI();
		}
	}
};

// *** Sound/audio control (SHARED) ***

// Change the master volume (affects all sounds.)
core.FUNCS.audio.changeMasterVolume = function(newVol){
	JSGAME.SHARED.masterVolume=newVol;
	JSGAME.DOM["masterVolumeSlider"].value=newVol;
	JSGAME.DOM["masterVolumeSlider"].title=newVol;
};
// Pause all sounds (mp3, midi)
core.FUNCS.audio.TODO_pauseAllSounds = function(){
	// MIDI
	core.FUNCS.audio.stopAllSounds_midi(false);

	// MP3
	let keys2 = Object.keys(core.AUDIO.elems);
	for(let i=0; i<keys2.length; i+=1){
		let elem = core.AUDIO.elems[ keys2[i] ];
		// core.AUDIO['elems'].tick.readyState
		// core.AUDIO['elems'].tick.duration
		// core.AUDIO['elems'].tick.currentTime
		// core.AUDIO['elems'].tick.paused
	}

};
// Resume all sounds (mp3, midi)
core.FUNCS.audio.TODO_resumeAllSounds = function(){
	// core.FUNCS.audio.stopAllSounds_midi(false);

	// Get the MIDI synth keys.
	let keys1 = Object.keys(core.AUDIO.midiSynths);
	for(let i=0; i<keys1.length; i+=1){
		let synthKey = keys1[i];
		let synth    = core.AUDIO.midiSynths[synthKey];
		let status   = synth.getPlayStatus();
		if( !status.play && synth.playTick){
			if(synth.playTick){ core.FUNCS.audio.resume_midi(synth); }
		}
	}

	// MP3
	let keys2 = Object.keys(core.AUDIO.elems);
	for(let i=0; i<keys2.length; i+=1){
		let elem = core.AUDIO.elems[ keys2[i] ];
		// core.AUDIO['elems'].tick.readyState
		// core.AUDIO['elems'].tick.duration
		// core.AUDIO['elems'].tick.currentTime
		// core.AUDIO['elems'].tick.paused
	}
};
