// Copyright (c) 2025 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// inspiration >> MaximSchoemaker + Numberphile
//  https://www.youtube.com/watch?v=RrSOv9FH6uo + https://www.youtube.com/watch?v=sj8Sg8qnjOg

let backgroundASK;

function setup() {
  const size = min(window.innerWidth, window.innerHeight);
  createCanvas(size, size);
  backgroundASK = color(174 , 135, 194), // warm lavender 4
  noStroke();
  colorMode(HSL, 1);
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
  scale(width, height);
  // t = mouseX / width; 
  t = fract(frameCount / frames);
  background(backgroundASK);
  
  const count = 2000 * invCosn(t);
  for (let i=1; i< count; i++) {
    const f = i / count;
    const angle = i * PHI * t;
    const dist = f * radius;
    
    const x = 0.5 + cos(angle * TWO_PI) * dist;
    const y = 0.5 + sin(angle * TWO_PI) * dist;
    
    const sig = pow(cosn(f - t * 20), 0.5);
    const r =  f * sig * dotSize * 0.5 + 0.003;
    
    const hue = fract(t + f * 2 + 0.4);
    const sat = 1;
    const light = 0.2 * sig + 0.5;
    const clr = color(hue, sat, light);
    fill(clr);
  
    let newCube = new IsometricCube(
      x,
      y,
      r,
      1,
      clr
    );
    newCube.show();
  }
}

class IsometricCube {
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

function windowResized() {
  let size = min(windowWidth, windowHeight);
  resizeCanvas(size, size);
}