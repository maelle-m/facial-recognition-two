let video; // Webcam input
let model; // Face landmarks model
let faces = []; // Array to store detected faces
let faceProgress = []; // Array to track progress for each face
let facePhase = []; // Array to track the phase for each face

async function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture({
    video: {
      facingMode: "user", // Front-facing camera for mobile
    },
  });
  video.size(windowWidth, windowHeight); // Match video to canvas size
  video.hide();

  console.log("Loading TensorFlow...");
  await tf.ready();

  console.log("Loading model...");
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: 5 } // Allow detection of up to 5 faces
  );

  console.log("Model loaded.");
}

function draw() {
  background(0);

  // Display video feed
  image(video, 0, 0, width, height);

  // Process faces if video and model are ready
  if (video.loadedmetadata && model) {
    processFaces();
  }

  if (faces.length > 0) {
    faces.forEach((face, index) => {
      if (facePhase[index] < 3) {
        drawFacialMesh(face, facePhase[index]);
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

    // Initialize progress and phases for new faces
    while (faceProgress.length < faces.length) {
      faceProgress.push(0);
      facePhase.push(0);
    }
  } else {
    faces = [];
  }
}

// Draw the facial mesh for a specific face
function drawFacialMesh(face, phase) {
  if (phase === 2) return; // Skip mesh in phase 3

  noFill();
  stroke(0, 255, 128, 150);
  strokeWeight(0.5);

  // Draw facial mesh lines
  for (let i = 0; i < face.scaledMesh.length; i++) {
    let pt1 = scalePoint(face.scaledMesh[i]);
    if (i + 1 < face.scaledMesh.length) {
      let pt2 = scalePoint(face.scaledMesh[i + 1]);
      line(pt1.x, pt1.y, pt2.x, pt2.y);
    }
  }
}

// Progress overlay logic
function drawProgressOverlay(index) {
  updateProgress(index);

  let phaseMessages = [
    "SCANNING FACE...",
    "GETTING DATA FROM DEVICE...",
    "UPLOAD COMPLETE",
  ];

  let phaseColors = [
    color(0, 255, 128), // Green
    color(255, 255, 0), // Yellow
    color(255), // White
  ];

  let progressBarWidth = width * 0.8;
  let barX = (width - progressBarWidth) / 2;
  let barY = height - (100 + index * 60); // Position dynamically for multiple faces

  if (facePhase[index] < 2) {
    fill(phaseColors[facePhase[index]]);
    rect(barX, barY, map(faceProgress[index], 0, 100, 0, progressBarWidth), 10);

    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(
      `${phaseMessages[facePhase[index]]} (${Math.floor(faceProgress[index])}%)`,
      width / 2,
      barY + 25
    );
  } else if (facePhase[index] === 2) {
    fill(phaseColors[2]);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(phaseMessages[2], width / 2, barY + 20);

    // Remove mesh for this face
    faces[index].scaledMesh = [];
  }
}

// Update progress and manage phases
function updateProgress(index) {
  faceProgress[index] = constrain(faceProgress[index] + 0.5, 0, 100);

  if (faceProgress[index] >= 100) {
    facePhase[index]++;
    faceProgress[index] = 0;
  }
}

// Reset all progress and phases
function resetAllProgress() {
  faceProgress = [];
  facePhase = [];
}

// Display message when no faces are detected
function drawNoFaceMessage() {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("NO FACE DETECTED", width / 2, height / 2);
}

// Scale points from video to canvas
function scalePoint(pt) {
  let x = map(pt[0], 0, video.width, 0, width);
  let y = map(pt[1], 0, video.height, 0, height);
  return createVector(x, y);
}

// Handle resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}