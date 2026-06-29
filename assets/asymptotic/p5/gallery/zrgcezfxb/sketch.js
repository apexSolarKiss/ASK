// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// adapted from https://p5js.org/reference/#/p5/randomGaussian

var init = 3;
// var trail = 20;
var colorBackground, sizeASK;
var colorsASK = [];
var stars = [];

function setup() {
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
  renderColors();
}

// random color picker from ASK colors
function renderColors() {
  sizeASK = min(windowWidth, windowHeight);
  colorBackground = random(colorsASK);
  for (let i = 0; i < init; i++) {
    let x = random(0, sizeASK / 10);
    let y = random(0, sizeASK / 10);
    let colorStroke = random(colorsASK);
    stars[i] = new Star(x, y, colorStroke);
  }
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

// On window resize, update the canvas size
function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(colorBackground);
  translate(sizeASK / 2, sizeASK / 2);
  for (let star of stars) {
    star.show();
  }
}

class Star {
  constructor(_x, _y, _colorStroke) {
    this.x = _x;
    this.y = _y;
    this.colorStroke = _colorStroke;
    this.distribution = new Array(360);
    for (let i = 0; i < this.distribution.length; i++) {
      this.distribution[i] = floor(randomGaussian(0, sizeASK));
    }
  }

  show() {
    stroke(this.colorStroke);
    translate(this.x, this.y);
    for (let i = 0; i < this.distribution.length; i++) {
      rotate(TWO_PI / this.distribution.length);
      stroke(this.colorStroke);
      let dist = abs(this.distribution[i]);
      line(0, 0, dist, 0);
    }
  }

  move() {
    this.x = this.x + random(-5, 5);
    this.y = this.y + random(-5, 5);
  }
}
