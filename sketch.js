let video; // Webcam input
let model; // Face landmarks model
let faces = []; // Array to store detected faces
let faceProgress = []; // Array to track progress for each face
let facePhase = []; // Array to track the phase for each face

async function setup() {
  // Set canvas size for mobile dimensions
  createCanvas(windowWidth, windowHeight);
  noSmooth(); // Improve rendering on smaller screens

  // Initialize webcam video input
  video = createCapture({
    video: {
      facingMode: "user" // Use front-facing camera
    }
  });
  video.size(windowWidth, windowHeight); // Match video to screen size
  video.hide();

  console.log("Loading TensorFlow...");
  await tf.ready();

  console.log("Loading model...");
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: 5 }
  );

  console.log("Model loaded.");
}

function draw() {
  background(0);

  // Draw video feed
  image(video, 0, 0, width, height);

  // Process and render each detected face
  if (video.loadedmetadata && model) {
    processFaces();
  }

  if (faces.length > 0) {
    faces.forEach((face, index) => {
      if (facePhase[index] < 3) {
        drawFacialMesh(face);
      }
      drawProgressOverlay(index);
    });
  } else {
    resetAllProgress();
    drawNoFaceMessage();
  }
}

// Detect multiple faces and store their data
async function processFaces() {
  const predictions = await model.estimateFaces({ input: video.elt });

  if (predictions.length > 0) {
    faces = predictions;

    // Ensure each face has progress and phase initialized
    while (faceProgress.length < faces.length) {
      faceProgress.push(0);
      facePhase.push(0);
    }
  } else {
    faces = [];
  }
}

// Draw the facial mesh for a specific face
function drawFacialMesh(face) {
  noFill();
  stroke(0, 255, 128, 150);
  strokeWeight(0.5);

  for (let i = 0; i < face.scaledMesh.length - 1; i++) {
    let pt1 = scalePoint(face.scaledMesh[i]);
    if (i < face.scaledMesh.length - 1) {
      let pt2 = scalePoint(face.scaledMesh[i + 1]);
      line(pt1.x, pt1.y, pt2.x, pt2.y);
    }
  }
}

// Update progress and switch phases
function updateProgress(index) {
  faceProgress[index] = constrain(faceProgress[index] + 0.5, 0, 100);

  if (faceProgress[index] >= 100) {
    facePhase[index]++;
    faceProgress[index] = 0;
  }
}

// Reset progress and phases if no faces are detected
function resetAllProgress() {
  faceProgress = [];
  facePhase = [];
}

// Draw the progress overlay for a specific face
function drawProgressOverlay(index) {
  updateProgress(index);

  let phaseMessages = [
    "SCANNING FACE...",
    "GETTING DATA FROM DEVICE...",
    "UPLOAD COMPLETE"
  ];

  let phaseColors = [
    color(0, 255, 128),
    color(255, 255, 0),
    color(255)
  ];

  let progressBarWidth = min(width, 300);
  let barX = (width - progressBarWidth) / 2;
  let barY = height - 60;

  if (facePhase[index] < 2) {
    fill(phaseColors[facePhase[index]]);
    rect(barX, barY, map(faceProgress[index], 0, 100, 0, progressBarWidth), 10);

    fill(255);
    textSize(12);
    textAlign(CENTER);
    text(
      `${phaseMessages[facePhase[index]]} (${Math.floor(faceProgress[index])}%)`,
      width / 2,
      barY + 20
    );
  } else if (facePhase[index] === 2) {
    fill(phaseColors[2]);
    textSize(16);
    textAlign(CENTER);
    text(phaseMessages[2], width / 2, barY + 10);
    faces[index].scaledMesh = [];
  }
}

// Display a message when no faces are detected
function drawNoFaceMessage() {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("NO FACE DETECTED", width / 2, height / 2);
}

// Convert facial points from video to canvas coordinates
function scalePoint(pt) {
  let x = map(pt[0], 0, video.width, 0, width);
  let y = map(pt[1], 0, video.height, 0, height);
  return createVector(x, y);
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}