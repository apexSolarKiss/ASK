// studioASK

var init = 12;
var trail = 200;
var colorBackground, colorStroke;
// var colorsASK = [];
var bubbles = [];

function setup() {
colorsASK = [
    color(255, 255, 255), // white 
    color(139, 121, 162), // smokey lavender 1
    color(164, 146, 200), // warm lavender 2
    color(226, 211, 240), // warm lavender 5
    color(235, 222, 232), // beige 1
    color(255, 206, 194), // peach 1
  ];
  colorStroke = colorsASK[1];
  colorBackground = colorsASK[3]
  colorMode(HSL, 1);
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < init; i++) {
    let newX = random(0, width);
    let newY = random(0, height);
    blowBubble(newX, newY);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(colorBackground);
  for (let bubble of bubbles) {
    if (bubble.contains(mouseX, mouseY)) {
      bubble.changeColor(colorsASK[0]);
    } else {
      bubble.changeColor(bubble.memFill);
    }
    bubble.show();
    bubble.move();
  }
  if (bubbles.length > trail) {
    bubbles.shift();
  }
}

function mousePressed() {
  let blow = true;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (bubbles[i].contains(mouseX, mouseY)) {
      bubbles.splice(i, 1);
      blow = false;
    }
  }
  if (blow) {
    blowBubble(mouseX, mouseY);
  }
}

function mouseDragged() {
  blowBubble(mouseX, mouseY);
}

class Bubble {
  constructor(_x, _y, _r, _colorStroke, _colorFill, _memFill) {
    this.x = _x;
    this.y = _y;
    this.r = _r;
    this.colorStroke = _colorStroke;
    this.colorFill = _colorFill;
    this.memFill = _memFill;
  }

  contains(_x, _y) {
    let d = dist(_x, _y, this.x, this.y);
    if (d < this.r / 2) {
      return true;
    } else {
      return false;
    }
  }

  changeColor(_newFill) {
    this.colorFill = _newFill;
  }

  show() {
    stroke(this.colorStroke);
    fill(this.colorFill);
    circle(this.x, this.y, this.r);
  }

  move() {
    this.x = this.x + random(-5, 5);
    this.y = this.y + random(-5, 5);
  }
}

function blowBubble(_x, _y) {
  let newSize = random(40, 161);
  let newHue = random(0, 1);
  let newFill = color(newHue, 1, 0.5);
  let newBubble = new Bubble(
    _x,
    _y,
    newSize,
    colorStroke,
    newFill,
    newFill
  );
  bubbles.push(newBubble);
}