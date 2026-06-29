// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

let colorBackground, color1, color2, color3, color4;
let sizeASK; // = 1224;
let weightASK = 0.0005;
let colorsASK = [];
let opac = 0.2;
let output = false;

let corners = [];
let controls = [];
let axesMain = [];
let axesRvrse = [];
let axisControl = [];
let stars = [];

let controlsCenter = {
    x: 0.25,
    y: 0.6,
  };
let stch0 = 1;

let dim1 = 8;
let stch1 = 1;
let stch2 = 1;

let t;
let frame = 0;
const frames = 600;

function setup() {
  if (output) {
    sizeASK = min(2880/2, 2160/2);
    createCanvas(2880/2, 2160/2);
  } else {
    sizeASK = min(windowWidth, windowHeight);
    createCanvas(windowWidth, windowHeight);
  }
  colorsASK = [
    color(255, 255, 255), // white
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
  renderColors();
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      corners[2 * i + j] = {
        x: 0.5 + ((2 * j - 1) * (1 + stch1)) / 2,
        y: 0.5 + ((2 * i - 1) * (1 + stch2)) / 2,
      };
    }
  }
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      axesMain[2 * i + j] = new Axis(
        corners[j * (2 - i)],
        corners[(1 + i) * (1 - j) + 3 * j],
        dim1
      );
      axesRvrse[2 * i + j] = new Axis(
        corners[(1 + i) * (1 - j) + 3 * j],
        corners[j * (2 - i)],
        dim1
      );
    }
  }

  for (let i = 0; i < 2; i++) {
    controls[i] = {
      x: controlsCenter.x + (2 * i - 1) * stch0 / 2,
      y: controlsCenter.y + (2 * i - 1) * stch0 / 2,
    };
  }

  axisControl[0] = new Axis(
    controls[0],
    controls[1],
    1,
  );
  axisControl[1] = new Axis(
    controls[1],
    controls[0],
    1,
  );

  stars[0] = new Star(
    axesMain[0],
    axesMain[1],
    axisControl[0],
    true,
    color1,
    false,
    color1
  );
  stars[1] = new Star(
    axesMain[2],
    axesMain[3],
    axisControl[0],
    true,
    color2,
    false,
    color1
  );
  stars[2] = new Star(
    axesMain[0],
    axesMain[1],
    axisControl[1],
    true,
    color1,
    false,
    color1
  );
  stars[3] = new Star(
    axesMain[2],
    axesMain[3],
    axisControl[1],
    true,
    color2,
    false,
    color1
  );
  //  noLoop();
}

// random color picker from ASK colors
function renderColors() {
  colorBackground = random(colorsASK);
  //  colorStroke = random(colorsASK);
  color1 = random(colorsASK);
  color2 = random(colorsASK);
//  color3 = random(colorsASK);
//  color4 = random(colorsASK);
  if (colorBackground == color1) renderColors();
  background(colorBackground);
}

// on mouse pressed, reset drawing and colors
function mousePressed() {
  renderColors();
}

// On window resize, update the canvas size
function windowResized() {
  sizeASK = min(windowWidth, windowHeight);
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
//  frame += deltaTime / (1000 / 60);
  t = fract(frameCount / frames);

  if (cos(t*TWO_PI*6) == 1) renderColors();
  if (output) {
    scale(2880/2, 2160/2);
  } else {
    scale(windowWidth, windowHeight);
  }
  strokeWeight(weightASK);
  //  for (let axis of axesMain) axis.show();
  for (let star of stars) {
    star.axis3.stch( -cos(t*TWO_PI*6)/200, -cos(t*TWO_PI*6)/200)
    star.show();
  }
  
  //  axesMain[1].move(0, -0.01);

}

class Axis {
  constructor(_corner1, _corner2, _dim) {
    this.corner1 = _corner1;
    this.corner2 = _corner2;
    this.dim = _dim;
    this.notches = new Array(this.dim + 1);
    for (let i = 0; i < this.dim + 1; i++) {
      let xP =
        this.corner1.x + (i * (this.corner2.x - this.corner1.x)) / this.dim;
      let yP =
        this.corner1.y + (i * (this.corner2.y - this.corner1.y)) / this.dim;
      this.notches[i] = { x: xP, y: yP };
    }
  }

  show() {
    for (let i = 0; i < this.dim + 1; i++) {
      point(this.notches[i].x, this.notches[i].y);
    }
  }

  move(_deltaX, _deltaY) {
    for (let i = 0; i < this.dim + 1; i++) {
      this.notches[i].x += _deltaX;
      this.notches[i].y += _deltaY;
    }
  }

  stch(_stch1, _stch2) {
    for (let i = 0; i < this.dim + 1; i++) {
      this.notches[i].x += _stch1 * ((2 * i) / this.dim - 1);
      this.notches[i].y += _stch2 * ((2 * i) / this.dim - 1);
    }
    /*  
    this.corner1.x -= _stch1;
    this.corner2.x += _stch1;
    this.corner1.y -= _stch2;
    this.corner2.x += _stch1;
  */
  }
}

class Star {
  constructor(
    _axis1,
    _axis2,
    _axis3,
    _strokeOn,
    _colorStroke,
    _fillOn,
    _colorFill
  ) {
    this.axis1 = _axis1;
    this.axis2 = _axis2;
    this.axis3 = _axis3;
    this.dim = this.axis1.dim;
    this.strokeOn = _strokeOn;
    this.colorStroke = _colorStroke;
    this.fillOn = _fillOn;
    this.colorFill = _colorFill;
  }

  show() {
    for (let i = 0; i < this.dim + 1; i++) {
      if (this.strokeOn) stroke(this.colorStroke);
      else noStroke();
      if (this.fillOn) {
        this.colorFill.setAlpha(opac);
        fill(this.colorFill);
      } else noFill();
      bezier(
        this.axis1.notches[i].x,
        this.axis1.notches[i].y,
        this.axis3.notches[0].x,
        this.axis3.notches[0].y,
        this.axis3.notches[1].x,
        this.axis3.notches[1].y,
        this.axis2.notches[i].x,
        this.axis2.notches[i].y
      );
    }
  }
}