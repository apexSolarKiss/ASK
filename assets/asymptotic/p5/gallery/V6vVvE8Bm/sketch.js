// Copyright (c) 2024 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

var backgroundASK, colorFill, colorRainbow, colorStroke, newX, newY, newW, newH, newA, newAlpha;
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
  colorStroke = color(1, 1, 1); // white
  createCanvas(windowWidth, windowHeight);
  backgroundASK = color(226, 211, 240, 140); // warm lavender 5
  background(backgroundASK);
  colorMode(HSL, 1);
}

function draw() {
  const hue = random(1);
  const sat = 1;
  const light = 0.6;
  colorRainbow = color(hue, sat, light);
  newX = random(0, width*1.2);
  newY = random(0, height*1.2);
  newW = random(40, 120);
  newH = random(40, 120);
  newA = random(-PI/12, PI/12);
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
  let newShard = new Shard(newX, newY, newW, newH, newA, colorStroke, colorFill);
  newShard.show();
}

class Shard {
  constructor(_x, _y, _w, _h , _a, _colorStroke, _colorFill) {
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
    this.a = _a;
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
    noStroke();
    quad(
// rippling rainbows
      (this.x + this.w/2)*cos(this.a) - (this.y + this.h/2)*sin(this.a),
      (this.x + this.w/2)*sin(this.a) + (this.y + this.h/2)*cos(this.a),
      
      (this.x + this.w/2)*cos(this.a) - (this.y - this.h/2)*sin(this.a),
      (this.x + this.w/2)*sin(this.a) + (this.y - this.h/2)*cos(this.a),
      
      (this.x - this.w/2)*cos(this.a) - (this.y - this.h/2)*cos(this.a),
      (this.x - this.w/2)*sin(this.a) + (this.y - this.h/2)*sin(this.a),
      
      (this.x - this.w/2)*cos(this.a) - (this.y + this.h/2)*cos(this.a),
      (this.x - this.w/2)*sin(this.a) + (this.y + this.h/2)*sin(this.a)
    );
  }  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}