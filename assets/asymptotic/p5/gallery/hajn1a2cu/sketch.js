// Copyright (c) 2026 >> Andrew S Klug // ASK
// Licensed under the Apache License, Version 2.0

let colorBackground, color1, color2, color3, color4;
let sizeASK;
let weightASK = 0.0005;
let colorsASK = [];
let opac = 1;

let t = 0;

function setup() {
  sizeASK = min(windowWidth, windowHeight);
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noFill();

  colorsASK = [
    color(255, 255, 255),   // white
    color(139, 121, 162),   // smokey lavender 1
    color(164, 146, 200),   // warm lavender 2
    color(226, 211, 240),   // warm lavender 5
    color(139, 121, 162),   // smokey lavender 1
    color(132, 80, 155),    // smokey plum 1
    color(114, 85, 131),    // smokey plum 2
    color(190, 63, 246),    // violet 1
    color(193, 154, 216),   // warm lavender 1
    color(164, 146, 200),   // warm lavender 2
    color(174, 135, 194)    // warm lavender 4
  ];

  renderColors();
}

function draw() {
  background(colorBackground);

  push();
  scale(windowWidth, windowHeight);
  translate(0.5, 0.5);

  strokeWeight(weightASK);
  noFill();

  let rows = 180;
  let cols = 240;
  let fieldScale = 0.34;

  // full-bleed controls
  let zoomASK = 1.38;       // increase for more zoom
  let domainASK = 1.18;     // sample past the visible frame

  scale(zoomASK);

  for (let j = 0; j < rows; j++) {
    let v = map(j, 0, rows - 1, -domainASK, domainASK);

    let blendAmt = map(j, 0, rows - 1, 0, 1);
    let cA = lerpColor(color1, color2, blendAmt);
    let cB = lerpColor(color3, color4, 1.0 - blendAmt);
    let c = lerpColor(cA, cB, 0.35);

    stroke(red(c), green(c), blue(c), 255 * opac);

    beginShape();
    for (let i = 0; i < cols; i++) {
      let u = map(i, 0, cols - 1, -domainASK, domainASK);

      let wave1 = sin(6.0 * u + 2.2 * t);
      let wave2 = sin(8.0 * v - 1.7 * t);
      let wave3 = sin(10.0 * (u + v) + 1.3 * t);
      let wave4 = sin(18.0 * dist(u, v, 0, 0) - 2.5 * t);

      let z =
        0.55 * wave1 +
        0.35 * wave2 +
        0.25 * wave3 +
        0.18 * wave4;

      let x = u * fieldScale + 0.06 * sin(3.0 * v + z * 2.0 + t * 0.8);
      let y = v * fieldScale + z * 0.08;

      x *= 1.0 - 0.18 * abs(v);

      curveVertex(x, y);
    }
    endShape();
  }

  pop();

  t += 0.02;
}

// random color picker from ASK colors
function renderColors() {
  colorBackground = random(colorsASK);
  color1 = random(colorsASK);
  color2 = random(colorsASK);
  color3 = random(colorsASK);
  color4 = random(colorsASK);

  // optional safeguard against invisible output
  let attempts = 0;
  while (
    attempts < 20 &&
    colorBackground.toString() === color1.toString() &&
    colorBackground.toString() === color2.toString() &&
    colorBackground.toString() === color3.toString() &&
    colorBackground.toString() === color4.toString()
  ) {
    color1 = random(colorsASK);
    color2 = random(colorsASK);
    color3 = random(colorsASK);
    color4 = random(colorsASK);
    attempts++;
  }
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

// On window resize, update the canvas size
function windowResized() {
  sizeASK = min(windowWidth, windowHeight);
  resizeCanvas(windowWidth, windowHeight);
}