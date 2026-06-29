// Copyright (c) 2025 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// inspiration >> MaximSchoemaker + Numberphile
//  https://www.youtube.com/watch?v=RrSOv9FH6uo + https://www.youtube.com/watch?v=sj8Sg8qnjOg

let backgroundASK;
let x, y, sizeASK;
let colorsASK, canvasSizes, aspect = [];
let output = false;

let shapes = [
  "circle",
  "star"
]
// choose shape
let shape = shapes[1];

function setup() {
  let width4K = 3840/2;
  if (output) {
    canvasSizes = [
      [width4K*9/16, width4K*9/16], // square 2160
      [width4K, width4K*9/16] // 16x9 4K
    ];
  } else {
    sizeASK = min(windowWidth/16, windowHeight/9);
    canvasSizes = [
      [sizeASK*9, sizeASK*9], // square
      [sizeASK*16, sizeASK*9] // 16x9
    ];
  }

  // choose aspect ratio
  aspect = canvasSizes[1];
  
  colorsASK = [
    color(174 , 135, 194), // warm lavender 4
    color(193, 154, 194), // warm lavender 1
    color(226, 211, 240) // warm lavender 5
  ]
  
  // choose background color
  renderColors();
  
  createCanvas(...aspect);
  noStroke();
  colorMode(HSL, 1);
}

// random color picker from ASK colors
function renderColors() {
  backgroundASK = random(colorsASK);
  background(backgroundASK);
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

function cosn(v) {
  return cos(v * TWO_PI) * 0.5 + 0.5;
}

function invCosn(v) {
  return 1 - cosn(v);
}

const radius =  Math.sqrt(0.5);
const dotSize = 0.1;
const PHI = (1 + Math.sqrt(5)) / 2;

const frames = 1000;
let t;
function draw() {
  scale(width, width);
  // t = mouseX / width; 
  t = fract(frameCount / frames);
  background(backgroundASK);
  
  if (mouseX > windowWidth/2) {shape = shapes[0]} else {shape = shapes[1]};
  
  const count = 2000 * invCosn(t);
  for (let i=1; i< count; i++) {
    const f = i / count;
    const angle = i * PHI * t;
    const dist = f * radius;
    
    switch (aspect) {
      case canvasSizes[0]:
        x = 0.5 + cos(angle * TWO_PI) * dist;
        y = 0.5 + sin(angle * TWO_PI) * dist;
        break;
      case canvasSizes[1]:
        x = (1/3) + cos(angle * TWO_PI) * dist;
        y = (1/3) + sin(angle * TWO_PI) * dist;
        break;
    }
    
    
    const sig = pow(cosn(f - t * 20), 0.5);
    const r =  f * sig * dotSize * 0.5 + 0.003;
    
    const hue = fract(t + f * 2 + 0.4);
    const sat = 1;
    const light = 0.2 * sig + 0.5;
    const colorVariable = color(hue, sat, light);
    fill(colorVariable);
    
    switch (shape) {
      case "circle":
        circle(x, y , r);
        break;
      case "star":
        let newStar = new Star(
          x, y, r, 1, colorVariable
        );
        newStar.show();
        break;
    }
  }
}

class Star {
  constructor(_x, _y, _r, _colorStroke, _colorFill) {
    this.x = _x;
    this.y = _y;
    this.r = _r;
    this.colorStroke = _colorStroke;
    this.colorFill = _colorFill;
  }

  /*
  move() {
    this.x = this.x + random(-5, 5);
    this.y = this.y + random(-5, 5);
  }
*/

  show() {
    fill(this.colorFill);

    for (let i = 0; i < 6; i++) {
      noStroke();
      triangle(
        this.x,
        this.y,
        this.x + this.r * cos(-30 + i * 60),
        this.y + this.r * sin(-30 + i * 60),
        this.x + this.r * cos(30 + i * 60),
        this.y + this.r * sin(30 + i * 60)
      );
      /*
      stroke(this.colorStroke);
      line(
        this.x + this.r * cos(-30 + i*60),
        this.y + this.r * sin(-30 + i*60),
        this.x + this.r * cos(30 + i*60),
        this.y + this.r * sin(30 + i*60)
      );
*/
    }
    /*    
    for (let i = 0; i < 3; i++) {
      line(
        this.x,
        this.y,
        this.x + this.r * cos(30 + i*120),
        this.y - this.r * sin(30 + i*120)
      );
    }
*/
  }
}

/*
function windowResized() {
  let size = min(windowWidth, windowHeight);
  resizeCanvas(size, size);
}
*/