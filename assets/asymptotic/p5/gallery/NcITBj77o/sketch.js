// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

var colorFill, colorStroke, newX, newY, newSize, newAlpha;
var colorsASK = [];

function setup() {
  colorsASK = [
    color(235, 222, 232, 140), // beige 1
    color(226, 211, 240, 140), // warm lavender 5
    color(255, 140), // white
  ];
  (colorStroke = color(139, 121, 162, 140)), // smokey lavender 1
    angleMode(DEGREES);
  createCanvas(windowWidth, windowHeight);
  backgroundASK = color(164, 146, 200, 140); // warm lavender 2
  background(backgroundASK);
}

function draw() {
  let size = min(windowWidth, windowHeight);
  scale(size/16);

  newX = parseInt(random(0, 16*windowWidth/size));
  newY = parseInt(random(0, 16*windowHeight/size));
  newSize = parseInt(random(0, 4));
  //  newAlpha = random(3, 7) * 32;
  //  colorFill.setAlpha(newAlpha);

  let rShape = parseInt(random(2));
  if (rShape == 0) {
    noStroke();
    fill(colorsASK[0]);
    circle(newX, newY, newSize * 2);
  } else {
    let rFill = parseInt(random(1, colorsASK.length));
    for (let i = 1; i < colorsASK.length; i++) {
      if (rFill == i) {
        colorFill = colorsASK[i];
      }
    }
    let newCube = new IsometricCube(
      newX,
      newY,
      newSize,
      colorStroke,
      colorFill
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
  resizeCanvas(windowWidth, windowHeight);
}
