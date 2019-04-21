/* global mat4, VRCubeSea, WGLUStats, WGLUTextureLoader, VRSamplesUtil */
(function () {
"use strict";

var PLAYER_HEIGHT = 0 /* 1.65*/

var vrDisplay = null;
var frameData = null;
var projectionMat = mat4.create();
var viewMat = mat4.create();

var vrPresentButton = null;
var presentingMessage = document.getElementById("presenting-message");

// ===================================================
// WebGL scene setup. This code is not WebVR specific.
// ===================================================

// WebGL setup.
var gl = null;
var cubeSea = null;
var stats = null;


function onContextLost( event ) {
	event.preventDefault();
	console.log( 'WebGL Context Lost.' );
	gl = null;
	cubeSea = null;

	stats = null;
}

function onContextRestored( event ) {
	console.log( 'WebGL Context Restored.' );
	initWebGL();
}

var webglCanvas = document.getElementById("webgl-canvas");
webglCanvas.addEventListener( 'webglcontextlost', onContextLost, false );
webglCanvas.addEventListener( 'webglcontextrestored', onContextRestored, false );

function initWebGL (preserveDrawingBuffer) {
	var glAttribs = {
		alpha: false,
		preserveDrawingBuffer: preserveDrawingBuffer
	};
	var useWebgl2 = WGLUUrl.getBool('webgl2', false);
	var contextTypes = useWebgl2 ? ["webgl2"] : ["webgl", "experimental-webgl"];
	for (var i in contextTypes) {
		gl = webglCanvas.getContext(contextTypes[i], glAttribs);
		if (gl)
			break;
	}
	if (!gl) {
		var webglType = (useWebgl2 ? "WebGL 2" : "WebGL")
		VRSamplesUtil.addError("Your browser does not support " + webglType + ".");
		return;
	}
	gl.clearColor(0.1, 0.2, 0.3, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	var textureLoader = new WGLUTextureLoader(gl);
	var texture = textureLoader.loadTexture("media/textures/cube-sea.png");

	// If the VRDisplay doesn't have stageParameters we won't know
	// how big the users play space. Construct a scene around a
	// default space size like 2 meters by 2 meters as a placeholder.
	cubeSea = new VRCubeSea(gl, texture);

	var enablePerformanceMonitoring = WGLUUrl.getBool(
			'enablePerformanceMonitoring', false);
	stats = new WGLUStats(gl, enablePerformanceMonitoring);
	// debugGeom = new WGLUDebugGeometry(gl);

	// Wait until we have a WebGL context to resize and start rendering.
	window.addEventListener("resize", onResize, false);
	onResize();
	window.requestAnimationFrame(onAnimationFrame);
}

// ================================
// WebVR-specific code begins here.
// ================================

function onVRRequestPresent () {
	// This can only be called in response to a user gesture.
	vrDisplay.requestPresent([{ source: webglCanvas }]).then(function () {
		// Nothing to do because we're handling things in onVRPresentChange.
	}, function (err) {
		var errMsg = "requestPresent failed.";
		if (err && err.message) {
			errMsg += "<br/>" + err.message
		}
		VRSamplesUtil.addError(errMsg, 2000);
	});
}

function onVRExitPresent () {
	// No sense in exiting presentation if we're not actually presenting.
	// (This may happen if we get an event like vrdisplaydeactivate when
	// we weren't presenting.)
	if (!vrDisplay.isPresenting)
		return;

	vrDisplay.exitPresent().then(function () {
		// Nothing to do because we're handling things in onVRPresentChange.
	}, function (err) {
		var errMsg = "exitPresent failed.";
		if (err && err.message) {
			errMsg += "<br/>" + err.message
		}
		VRSamplesUtil.addError(errMsg, 2000);
	});
}

function onVRPresentChange () {
	// When we begin or end presenting, the canvas should be resized to the
	// recommended dimensions for the display.
	onResize();

	if (vrDisplay.isPresenting) {
		if (vrDisplay.capabilities.hasExternalDisplay) {
			// Because we're not mirroring any images on an external screen will
			// freeze while presenting. It's better to replace it with a message
			// indicating that content is being shown on the VRDisplay.
			presentingMessage.style.display = "block";

			// On devices with an external display the UA may not provide a way
			// to exit VR presentation mode, so we should provide one ourselves.
			VRSamplesUtil.removeButton(vrPresentButton);
			vrPresentButton = VRSamplesUtil.addButton("Exit VR", "E", "media/icons/cardboard64.png", onVRExitPresent);
		}
	} else {
		// If we have an external display take down the presenting message and
		// change the button back to "Enter VR".
		if (vrDisplay.capabilities.hasExternalDisplay) {
			presentingMessage.style.display = "";

			VRSamplesUtil.removeButton(vrPresentButton);
			vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "media/icons/cardboard64.png", onVRRequestPresent);
		}
	}
}

if (navigator.getVRDisplays) {
	frameData = new VRFrameData();

	navigator.getVRDisplays().then(function (displays) {
		if (displays.length > 0) {
			vrDisplay = displays[displays.length - 1];
			vrDisplay.depthNear = 0.1;
			vrDisplay.depthFar = 1024.0;

			initWebGL(vrDisplay.capabilities.hasExternalDisplay);

			if (vrDisplay.stageParameters &&
					vrDisplay.stageParameters.sizeX > 0 &&
					vrDisplay.stageParameters.sizeZ > 0) {
				// If we have stageParameters with a valid size use that to resize
				// our scene to match the users available space more closely. The
				// check for size > 0 is necessary because some devices, like the
				// Oculus Rift, can give you a standing space coordinate but don't
				// have a configured play area. These devices will return a stage
				// size of 0.
				// ################# cubeIsland.resize(vrDisplay.stageParameters.sizeX, vrDisplay.stageParameters.sizeZ);
			} else {
				if (vrDisplay.stageParameters) {
					VRSamplesUtil.addInfo("VRDisplay reported stageParameters, but stage size was 0. Using default size.", 3000);
				} else {
					VRSamplesUtil.addInfo("VRDisplay did not report stageParameters", 3000);
				}
			}

			if (vrDisplay.capabilities.canPresent)
				vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "media/icons/cardboard64.png", onVRRequestPresent);

			// For the benefit of automated testing. Safe to ignore.
			if (vrDisplay.capabilities.canPresent && WGLUUrl.getBool('canvasClickPresents', false))
				webglCanvas.addEventListener("click", onVRRequestPresent, false);

			window.addEventListener('vrdisplaypresentchange', onVRPresentChange, false);
			window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
			window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
		} else {
			initWebGL(false);
			VRSamplesUtil.addInfo("WebVR supported, but no VRDisplays found.", 3000);
		}
	}, function () {
		VRSamplesUtil.addError("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	});
} else if (navigator.getVRDevices) {
	initWebGL(false);
	VRSamplesUtil.addError("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
} else {
	initWebGL(false);
	VRSamplesUtil.addError("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
}

function onResize () {
	if (vrDisplay && vrDisplay.isPresenting) {
		// If we're presenting we want to use the drawing buffer size
		// recommended by the VRDevice, since that will ensure the best
		// results post-distortion.
		var leftEye = vrDisplay.getEyeParameters("left");
		var rightEye = vrDisplay.getEyeParameters("right");

		// For simplicity we're going to render both eyes at the same size,
		// even if one eye needs less resolution. You can render each eye at
		// the exact size it needs, but you'll need to adjust the viewports to
		// account for that.
		webglCanvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
		webglCanvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
	} else {
		// We only want to change the size of the canvas drawing buffer to
		// match the window dimensions when we're not presenting.
		webglCanvas.width = webglCanvas.offsetWidth * window.devicePixelRatio;
		webglCanvas.height = webglCanvas.offsetHeight * window.devicePixelRatio;
	}
}

// Listen for click events on the canvas, which may come from something
// like a Cardboard viewer or other VR controller, and make a small change
// to the scene in response (so that we know it's working.) This basic
// interaction mode is the baseline for all WebVR compatible devices, and
// should ideally always be minimally supported.
function onClick () {
	// Reset the background color to a random value
	if (gl) {
		gl.clearColor(
			Math.random() * 0.5,
			Math.random() * 0.5,
			Math.random() * 0.5, 1.0);
	}
}

// Register for mouse restricted events while in VR
// (e.g. mouse no longer available on desktop 2D view)
function onDisplayPointerRestricted() {
	if (webglCanvas && webglCanvas.requestPointerLock) {
		webglCanvas.requestPointerLock();
	}
}

// Register for mouse unrestricted events while in VR
// (e.g. mouse once again available on desktop 2D view)
function onDisplayPointerUnrestricted() {
	var lock = document.pointerLockElement;
	if (lock && lock === webglCanvas && document.exitPointerLock) {
		document.exitPointerLock();
	}
}

// This utility function monitors clicks from gamepads that are associated
// with a VRDisplay and fires the callback, providing "click" support for
// browsers that don't fire mouse click events on interaction.
VRSamplesUtil.addVRClickListener(onClick);

webglCanvas.addEventListener("click", onClick, false);
window.addEventListener('vrdisplaypointerrestricted', onDisplayPointerRestricted);
window.addEventListener('vrdisplaypointerunrestricted', onDisplayPointerUnrestricted);

// Get a matrix for the pose that takes into account the stageParameters
// if we have them, and otherwise adjusts the position to ensure we're
// not stuck in the floor.
function getStandingViewMatrix (out, view) {
	if (vrDisplay.stageParameters) {
		// If the headset provides stageParameters use the
		// sittingToStandingTransform to transform the view matrix into a
		// space where the floor in the center of the users play space is the
		// origin.
		mat4.invert(out, vrDisplay.stageParameters.sittingToStandingTransform);
		mat4.multiply(out, view, out);
	} else {
		// Otherwise you'll want to translate the view to compensate for the
		// scene floor being at Y=0. Ideally this should match the user's
		// height (you may want to make it configurable). For this demo we'll
		// just assume all human beings are 1.65 meters (~5.4ft) tall.
		mat4.identity(out);
		mat4.translate(out, out, [0, PLAYER_HEIGHT, 0]);
		mat4.invert(out, out);
		mat4.multiply(out, view, out);
	}
}

setInterval(function(){
	/* Send current view every 3 seconds */
	socket.emit('pic_to_server', getCurrentFrame())
}, 3000);

function renderSceneView (projection, view, pose, stats, t) {
	// cubeSea.render(projection, view, stats, t);

	var orientation = pose.orientation;
	var position = pose.position;
	if (!orientation) { orientation = [0, 0, 0, 1]; }
	if (!position) { position = [0, 0, 0]; }

	if ((new Date()).getSeconds() % 5 == 0 && (new Date()).getMilliseconds() <= 50) {
		socket.emit('to_server', "orientation")
		socket.emit('to_server', orientation.toString())
		socket.emit('to_server', "position")
		socket.emit('to_server', position.toString())
	}

	cubeSea.render(projection, view, stats, t, position, orientation);

	// // For fun, draw a blue cube where the players head would have been if
	// // we weren't taking the stageParameters into account. It'll start in
	// // the center of the floor.
	// var orientation = pose.orientation;
	// var position = pose.position;
	// if (!orientation) { orientation = [0, 0, 0, 1]; }
	// if (!position) { position = [0, 0, 0]; }
	// debugGeom.bind(projection, view);
	// debugGeom.drawCube(orientation, position, 0.2, [0, 0, 1, 1]);
}

function onAnimationFrame (t) {
	// do not attempt to render if there is no available WebGL context
	if (!gl || !stats || !cubeSea) {
		return;
	}

	stats.begin();

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (vrDisplay) {
		// When presenting content to the VRDisplay we want to update at its
		// refresh rate if it differs from the refresh rate of the main
		// display. Calling VRDisplay.requestAnimationFrame ensures we render
		// at the right speed for VR.
		vrDisplay.requestAnimationFrame(onAnimationFrame);

		// As a general rule you want to get the pose as late as possible
		// and call VRDisplay.submitFrame as early as possible after
		// retrieving the pose. Do any work for the frame that doesn't need
		// to know the pose earlier to ensure the lowest latency possible.
		//var pose = vrDisplay.getPose();
		vrDisplay.getFrameData(frameData);

		if (vrDisplay.isPresenting) {
			// When presenting render a stereo view.
			gl.viewport(0, 0, webglCanvas.width * 0.5, webglCanvas.height);
			getStandingViewMatrix(viewMat, frameData.leftViewMatrix);
			renderSceneView(frameData.leftProjectionMatrix, viewMat, frameData.pose, stats, t);

			gl.viewport(webglCanvas.width * 0.5, 0, webglCanvas.width * 0.5, webglCanvas.height);
			getStandingViewMatrix(viewMat, frameData.rightViewMatrix);
			renderSceneView(frameData.rightProjectionMatrix, viewMat, frameData.pose, stats, t);

			// If we're currently presenting to the VRDisplay we need to
			// explicitly indicate we're done rendering.
			vrDisplay.submitFrame();
		} else {
			// When not presenting render a mono view that still takes pose into
			// account.
			gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
			// It's best to use our own projection matrix in this case, but we can use the left eye's view matrix
			mat4.perspective(projectionMat, Math.PI*0.4, webglCanvas.width / webglCanvas.height, 0.1, 1024.0);
			cubeSea.render(projectionMat, frameData.leftViewMatrix, stats, t);
			stats.renderOrtho();
		}
	} else {
		window.requestAnimationFrame(onAnimationFrame);

		// No VRDisplay found.
		gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
		mat4.perspective(projectionMat, Math.PI*0.4, webglCanvas.width / webglCanvas.height, 0.1, 1024.0);
		mat4.identity(viewMat);
		cubeSea.render(projectionMat, viewMat, stats, t);

		stats.renderOrtho();
	}

	stats.end();
}
window.requestAnimationFrame(onAnimationFrame);
})();
