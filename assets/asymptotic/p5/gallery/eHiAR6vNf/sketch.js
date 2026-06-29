// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// adapted from @mattdesl https://twitter.com/mattdesl https://glitch.com/edit/#!/p5-example-line

var colorBackground, colorStroke;
var colorsASK = [];

// Create a new canvas to the browser size
function setup () {
  createCanvas(windowWidth, windowHeight);
  colorsASK = [
    color(255, 255, 255), // white 
    color(139, 121, 162), // smokey lavender 1
    color(164, 146, 200), // warm lavender 2
    color(226, 211, 240), // warm lavender 5
    color(255, 0, 40), // red 1
    color(139, 121, 162), // smokey lavender 1
    color(132, 80, 155), // smokey plum 1
    color(114, 85, 131), // smokey plum 2
    color(190, 63, 246), // violet 1
    color(193, 154, 216), // warm lavender 1
    color(164, 146, 200), // warm lavender 2
    color(174, 135, 194), // warm lavender 4
  ];
  renderStars();
}

// random color picker from ASK colors
function randomColor () {
  let colorR = parseInt(random(colorsASK.length));
    for (let j = 0; j < colorsASK.length; j++) {
      if (colorR == j) {
        return colorsASK[j];
    }
  }
}

function renderStars() {
  sizeASK = min(windowWidth, windowHeight);
  colorStroke = randomColor();
  colorBackground = randomColor();
  if (colorBackground == colorStroke) renderStars();
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderStars();
}

// On window resize, update the canvas size
function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}

// Render loop that draws shapes with p5
function draw(){
  // For consistent sizing regardless of portrait/landscape
  const dim = Math.max(width, height);
  
  background(colorBackground);
  
  // Stroke only with a specific join style and thickness
  noFill();
  stroke(colorStroke);
  strokeCap(ROUND);
  strokeWeight(dim * 0.015);

  const gridSize = 10;
  const margin = dim * 0.1;
  const innerWidth = width - margin * 2;
  const cellSize = innerWidth / gridSize;
  
  const time = millis() / 1000;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const u = gridSize <= 1 ? 0.5 : x / (gridSize - 1);
      const v = gridSize <= 1 ? 0.5 : y / (gridSize - 1);
      
      const px = lerp(margin, width - margin, u);
      const py = lerp(margin, height - margin, v);
      
      const rotation = sin(time + u * PI * 0.25) * PI;
      const lineSize = sin(time + v * PI) * 0.5 + 0.5;
      segment(px, py, cellSize * lineSize, rotation);
    }
  }
}

// Draw a line segment centred at the given point
function segment(x, y, length, angle = 0) {
  const r = length / 2;
  const u = Math.cos(angle);
  const v = Math.sin(angle);
  line(x - u * r, y - v * r, x + u * r, y + v * r);
}