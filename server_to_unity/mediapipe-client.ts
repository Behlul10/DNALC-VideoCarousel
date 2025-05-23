import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
const demosSection = document.getElementById("demos");
const imageBlendShapes = document.getElementById("image-blend-shapes");
const videoBlendShapes = document.getElementById("video-blend-shapes");

let faceLandmarker;
let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
const videoWidth = 480;

// Create WebSocket connection
let socket;
let socketConnected = false;
let lastSentData = 0;
const SEND_INTERVAL = 100; // Send data every 100ms to avoid flooding

function initWebSocket() {
  socket = new WebSocket('ws://localhost:8080');
  
  socket.onopen = () => {
    console.log('WebSocket connected to server');
    socketConnected = true;
  };
  
  socket.onclose = () => {
    console.log('WebSocket disconnected');
    socketConnected = false;
    // Try to reconnect in 2 seconds
    setTimeout(initWebSocket, 2000);
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socketConnected = false;
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message.type);
    } catch (err) {
      console.error('Error processing message:', err);
    }
  };
}

// Initialize WebSocket connection
initWebSocket();

// Function to send blendshape data to the server
function sendBlendShapesData(blendShapes) {
  if (!socketConnected || !blendShapes || !blendShapes.length) return;
  
  // Rate limiting - only send data every SEND_INTERVAL ms
  const now = Date.now();
  if (now - lastSentData < SEND_INTERVAL) return;
  lastSentData = now;
  
  const message = {
    type: 'blendshapes',
    data: blendShapes[0].categories.map(shape => ({
      name: shape.categoryName,
      displayName: shape.displayName,
      score: shape.score
    })),
    timestamp: Date.now()
  };
  
  socket.send(JSON.stringify(message));
}

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  });
  demosSection.classList.remove("invisible");
}
createFaceLandmarker();

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;

const canvasCtx = canvasElement.getContext("2d");

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById(
    "webcamButton"
  ) as HTMLButtonElement;
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);
async function predictWebcam() {
  const radio = video.videoHeight / video.videoWidth;
  video.style.width = videoWidth + "px";
  video.style.height = videoWidth * radio + "px";
  canvasElement.style.width = videoWidth + "px";
  canvasElement.style.height = videoWidth * radio + "px";
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceLandmarker.setOptions({ runningMode: runningMode });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
  }
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      );
    }
  }
  
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes);
  
  // Send blendshape data to the server
  if (results.faceBlendshapes) {
    sendBlendShapesData(results.faceBlendshapes);
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function drawBlendShapes(el: HTMLElement, blendShapes: any[]) {
  if (!blendShapes || !blendShapes.length) {
    return;
  }

  let htmlMaker = "";
  blendShapes[0].categories.map((shape) => {
    htmlMaker += `
      <li class="blend-shapes-item">
        <span class="blend-shapes-label">${
          shape.displayName || shape.categoryName
        }</span>
        <span class="blend-shapes-value" style="width: calc(${
          +shape.score * 100
        }% - 120px)">${(+shape.score).toFixed(4)}</span>
      </li>
    `;
  });

  el.innerHTML = htmlMaker;
}

// Add slide control UI if needed
const slideControlDiv = document.createElement('div');
slideControlDiv.innerHTML = `
  <div class="slide-controls" style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
    <h3>Slide Controls</h3>
    <button id="prevSlide" style="margin-right: 10px; padding: 5px 10px;">Previous Slide</button>
    <button id="nextSlide" style="padding: 5px 10px;">Next Slide</button>
  </div>
`;
document.body.appendChild(slideControlDiv);

// Add event listeners for slide control buttons
document.getElementById('prevSlide').addEventListener('click', () => {
  if (socketConnected) {
    socket.send(JSON.stringify({
      type: 'slideState',
      slideState: 'previous',
      timestamp: Date.now()
    }));
  }
});

document.getElementById('nextSlide').addEventListener('click', () => {
  if (socketConnected) {
    socket.send(JSON.stringify({
      type: 'slideState',
      slideState: 'next',
      timestamp: Date.now()
    }));
  }
});