// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

var colorFill, colorStroke, newX, newY, newW, newH, newA, newAlpha;
var colorsASK = [];

function setup() {
  colorMode(HSL, 1);
  colorStroke = color(1, 1, 1); // white
  angleMode(DEGREES);
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  const hue = random(1);
  const sat = 1;
  const light = 0.6;
  colorFill = color(hue, sat, light);
  newX = random(0, width);
  newY = random(0, height);
  newW = random(120, 400);
  newH = random(120, 400);
  newA = random(-30, 30);
  newAlpha = random(0.5, 1);
  colorFill.setAlpha(newAlpha);
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
      this.x + this.w/2,
      this.y + this.h/2,
      
      this.x + this.w/2 - sin(this.a) * this.w,
      this.y - this.h/2 + sin(this.a) * this.w,
      
      this.x - this.w/2 + sin(this.a) * this.w,
      this.y - this.h/2 - sin(this.a) * this.w,
      
      this.x - this.w/2 - sin(this.a) * this.w,
      this.y + this.h/2 - sin(this.a) * this.w
    );
  }  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}