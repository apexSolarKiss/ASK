// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// inspiration >> MaximSchoemaker
// https://www.youtube.com/watch?v=vIrecKTVe94

var colorBackground, sizeASK;
var colorsASK = [];

let t;
let frame = 0;
const frames = 2000;
const maxDepth = 2;

let n;

function setup() {
  let sizeASK = min(windowWidth, windowHeight);
  createCanvas(sizeASK, sizeASK);
  colorsASK = [
//    color(255, 255, 255), // white 
    color(139, 121, 162), // smokey lavender 1
    color(164, 146, 200), // warm lavender 2
//    color(226, 211, 240), // warm lavender 5
//    color(255, 0, 40), // red 1
    color(139, 121, 162), // smokey lavender 1
    color(132, 80, 155), // smokey plum 1
    color(114, 85, 131), // smokey plum 2
//    color(190, 63, 246), // violet 1
    color(193, 154, 216), // warm lavender 1
    color(164, 146, 200), // warm lavender 2
    color(174, 135, 194), // warm lavender 4
  ];
  colorMode(HSL, 1);
  renderColors();
}

// random color picker from ASK colors
function renderColors() {
  sizeASK = min(windowWidth, windowHeight);
//  colorStroke = random(colorsASK);
  colorBackground = random(colorsASK);
//  if (colorBackground == colorStroke) renderColors();
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

// On window resize, update the canvas size
function windowResized () {
  sizeASK = min(windowWidth, windowHeight);
  resizeCanvas(sizeASK, sizeASK);
}

function invCosn(v) {
  return 1 - (cos(v * TWO_PI) * 0.5 + 0.5);
}

function draw() {
  frame += deltaTime / (1000 / 60);
  t = fract(frame / frames);

  scale(width, height);
  background(colorBackground);
  stroke(1);
  strokeWeight(0.002);

//  n = 3 + floor(4 * t);
  n = 6;  
  const depth = 2 + maxDepth * invCosn(t * 4);
  
  drawFractal(0.5, 0.5, 1 / 2.5, depth);
}

function polar(angle, radius) {
  return {
    x: cos(angle * TWO_PI) * radius,
    y: sin(angle * TWO_PI) * radius,
  }
}

function drawFractal(x, y, size, depth) {
  const df = constrain(depth, 0, 1);
  for (let i = 0; i < n; i++) {
    const f = i / n;
    const angle = f + 0.25;

    if (depth > 0) {
      const scale = 0.5;
      const r = size;
      const p = polar(angle, r);
      const s = size * (1 - df * scale);
      drawFractal(x + p.x, y + p.y, s, depth - 1);
    } else {
      const p1 = polar(angle, size);
      const p2 = polar(angle + 1 / n, size);

      const hue = fract(t + y * 0.25 + .75);
      const sat = 1;
      const light = x * 0.2 + 0.5;
      const c = color(hue, sat, light);
      stroke(c);

      line(x + p1.x, y + p1.y, x + p2.x, y + p2.y);
    }
  }
}