// Copyright (c) 2024 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

var backgroundASK, colorFill, colorRainbow, colorStroke, newX, newY, newSize, newAlpha;
var colorsASK = [];
var colorsMutedRainbow = [];

function setup() {
  colorsASK = [
    // color(255, 255, 255), // white
    color(139, 121, 162), // smokey lavender 1
    color(164, 146, 200), // warm lavender 2
    color(226, 211, 240), // warm lavender 5
    //    color(255, 0, 40), // red 1
    color(139, 121, 162), // smokey lavender 1
    color(132, 80, 155), // smokey plum 1
    color(114, 85, 131), // smokey plum 2
    color(190, 63, 246), // violet 1
    color(193, 154, 216), // warm lavender 1
    color(164, 146, 200), // warm lavender 2
    color(174, 135, 194), // warm lavender 4
  ];
  backgroundASK = color(226, 211, 240, 140); // warm lavender 5
  colorMode(HSL, 1);
  colorStroke = color(1, 1, 1); // white
  angleMode(DEGREES);
  createCanvas(windowWidth, windowHeight);
  background(backgroundASK);
}

function draw() {
  const hue = random(1);
  const sat = 1;
  const light = 0.6;
  colorRainbow = color(hue, sat, light);
  newX = random(0, width);
  newY = random(0, height);
  newW = random(120, 400);
  newH = random(120, 400);
  newA = random(-60, 60);
  newAlpha = random(0.5, 1);
  colorRainbow.setAlpha(newAlpha);
  colorsMutedRainbow = [
    ...colorsASK,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow,
    colorRainbow
  ];
  colorFill = random(colorsMutedRainbow);

  newX = random(0, width);
  newY = random(0, height);
  newSize = random(40, 161);
  
  let newCube = new IsometricCube(newX, newY, newSize, colorStroke, colorFill);
  newCube.show();
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
        this.x + this.r * cos(-30 + i*60),
        this.y + this.r * sin(-30 + i*60),
        this.x + this.r * cos(30 + i*60),
        this.y + this.r * sin(30 + i*60)
      );
      stroke(this.colorStroke);
      line(
        this.x + this.r * cos(-30 + i*60),
        this.y + this.r * sin(-30 + i*60),
        this.x + this.r * cos(30 + i*60),
        this.y + this.r * sin(30 + i*60)
      );
    }  
    for (let i = 0; i < 3; i++) {
      line(
        this.x,
        this.y,
        this.x + this.r * cos(30 + i*120),
        this.y - this.r * sin(30 + i*120)
      );
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}