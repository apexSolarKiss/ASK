// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// inspiration >> MaximSchoemaker + Numberphile
//  https://www.youtube.com/watch?v=RrSOv9FH6uo + https://www.youtube.com/watch?v=sj8Sg8qnjOg

var colorBackground, colorStroke, sizeASK;
var colorsASK = [];

const radius = Math.sqrt(0.5);
const dotSize = 0.01;
const PHI = (1 + Math.sqrt(5)) / 2;

const frames = 1000;
let t;

function setup() {
  let sizeASK = min(windowWidth, windowHeight);
  createCanvas(sizeASK, sizeASK);
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
  noStroke();
  renderColors();
}

// random color picker from ASK colors
function renderColors() {
  sizeASK = min(windowWidth, windowHeight);
  colorStroke = random(colorsASK);
  colorBackground = random(colorsASK);
  if (colorBackground == colorStroke) renderColors();
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

// On window resize, update the canvas size
function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}

/*
function cosn(v) {
  return cos(v * TWO_PI) * 0.5 + 0.5;
}

function invCosn(v) {
  return 1 - cosn(v);
}
*/

function draw() {
  scale(width, height);
  //  t = mouseX / width; 
  t = fract(frameCount / frames);
  background(colorBackground);
  
  const count =2000;  // = 2000 * invCosn(t);
  for (let i=1; i< count; i++) {
    const f = i / count;
    const angle = i * PHI - t*12;
    const dist = f * radius;
    
    const x = 0.5 + cos(angle * TWO_PI) * dist;
    const y = 0.5 + sin(angle * TWO_PI) * dist;
    
//    const sig = pow(cosn(f - t * 20), 0.5);
    const r = (f+.1) * dotSize;  // =  f * sig * dotSize;    
    
//    const sat = .8;
//    const light = 0.6 * sig + 0.25;
    fill(colorStroke);  
    circle(x, y , r);
  }
}