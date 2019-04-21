var canvas
var ctx
var video;
var webcamWidth;
var webcamHeight;

navigator.getUserMedia = (
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia
);

function startWebcam() {
  // canvas = document.getElementById("myCanvas")
  // video = document.getElementById('video')
  canvas = document.createElement('canvas')
  video = document.createElement('video')
  video.setAttribute('autoplay', true)
  ctx = canvas.getContext('2d')

  if (navigator.getUserMedia) {
    navigator.getUserMedia (
      {
        video: true,
        audio: false
      },

      function(stream) {
        webcamWidth = stream.getVideoTracks()[0].getSettings().width
        webcamHeight = stream.getVideoTracks()[0].getSettings().height
        canvas.setAttribute('width', webcamWidth);
        canvas.setAttribute('height', webcamHeight);

        // video.src = window.URL.createObjectURL(localMediaStream);
        video.srcObject = stream
      },

      function(err) {
        console.log( err);
      }
    );
  } else {
  console.log("getUserMedia not supported by your browser");
  }
}

function getCurrentFrame() {
  ctx.drawImage(video, 0,0)
  img_dataURI = canvas.toDataURL('image/png')
  document.getElementById("my-data-uri").src = img_dataURI
}
