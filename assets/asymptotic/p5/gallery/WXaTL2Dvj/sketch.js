// Copyright (c) 2025 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

let dx, dy, dir;
let phi;
let size = 1; // Starting square size
let count = 24; // number of iterations
let sizesGolden = getFibonacciSequence(count); // Golden ratio

let colorsASK, colorsSpiral, canvasSizes, aspect, stepX, stepY = [];
let output = false;

function setup() {
  let width4K = 3840;
  if (output) {
    canvasSizes = [
      [width4K*9/16, width4K*9/16], // square 2160
      [width4K, width4K*9/16] // 16x9 4K
    ];
    // choose aspect ratio
    aspect = canvasSizes[0];
  } else {
    aspect = [windowWidth, windowHeight];
  }
  
  colorsASK = [
    color(193, 154, 194), // warm lavender 1
    color(174 , 135, 194), // warm lavender 4
    color(226, 211, 240), // warm lavender 5
    // color(127, 0,  249), // electric violet 1
    color(255, 0,  40), // red 1
    color(255, 0, 255), // pink
    color(0, 200, 255), // blue
    color(167, 0, 255) // violet 2
  ]
  
  createCanvas(...aspect);
  noStroke();
  
  // choose colors
  renderColors();
  
  phi = (1 + sqrt(5)) / 2; // Golden ratio
}

// random color picker from ASK colors
function renderColors() {
  background(random(colorsASK.slice(0, 3)));
  colorsSpiral = [
    random(colorsASK.slice(3, (colorsASK.length +1))),
    random(colorsASK.slice(3, (colorsASK.length +1))),
    random(colorsASK.slice(3, (colorsASK.length +1)))
  ]
  if (colorsSpiral[0] == colorsSpiral[1] || colorsSpiral[1] == colorsSpiral[2] || colorsSpiral[0] == colorsSpiral[2]) {renderColors()}
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

function getFibonacciSequence(n) {
  let fib = [0, 1]; // Starting values

  for (let i = 2; i < n; i++) {
    fib[i] = fib[i - 1] + fib[i - 2];
  }

  return fib.slice(0, n); // In case n < 2
}

function draw() {
  // scale(sizeASK, sizeASK);
  fill(colorsSpiral[0]);
  translate(width/phi, height*(1-1/phi));
  square(0, 0, sizesGolden[1]);
  for (let i=1; i < count-2; i++) {
    dx = [-sizesGolden[i], 0, sizesGolden[i-1], -sizesGolden[i-2]];  // x step for each quadrant direction
    dy = [-sizesGolden[i-2], -sizesGolden[i], 0, sizesGolden[i-1]];  // y step for each quadrant direction
    dir = (i+3) % 4;
    stepX = dx[dir];
    stepY = dy[dir];
    translate(stepX, stepY);
    fill(colorsSpiral[i%3]);
    square(0, 0, sizesGolden[i]);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  renderColors();
}