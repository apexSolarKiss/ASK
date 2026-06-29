// Copyright (c) 2022 >> Andrew S Klug // ASKproduKtion
// Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

// adapted from @mattdesl https://twitter.com/mattdesl https://glitch.com/edit/#!/tone-example-synth-basic

// let init = 1;
// var trail = 20;
let colorBackground, colorLine, colorButton;
let colorsASK = [];
// let stars = [];

// Master volume in decibels
const volume = -15;

// The synth we'll use for audio
let synth;

// Create a new canvas to the browser size
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

  // Make the volume quieter
  Tone.Master.volume.value = volume;

  // Setup a synth with ToneJS
  synth = new Tone.Synth({
    "oscillator" : {
      "type": 'sine'
    }
  });

  // Wire up our nodes:
  // synth->master
  synth.connect(Tone.Master);
}

// random color picker from ASK colors
function renderColors() {
  colorBackground = random(colorsASK);
  colorLine = random(colorsASK);
  colorButton = random(colorsASK);
  if ((colorBackground !== colorLine) && (colorBackground !== colorButton)) return; else renderColors();
}

// On window resize, update the canvas size
function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}

// Update the FX and trigger synth ON
function mousePressed () {
  synth.triggerAttack();
  renderColors();
}

// Trigger synth OFF
function mouseReleased () {
  synth.triggerRelease();
}

// Draw a basic polygon, handles triangles, squares, pentagons, etc
function polygon(x, y, radius, sides = 3, angle = 0) {
  beginShape();
  for (let i = 0; i < sides; i++) {
    const a = angle + TWO_PI * (i / sides);
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// Render loop that draws shapes with p5
function draw() {
  const dim = Math.min(width, height);

  // Black background
  background(colorBackground);
  
  // Get a 0..1 value for the mouse
  const u = max(0, min(1, mouseX / width));

  // Choose a frequency that sounds good
  const frequency = lerp(75, 2500, u);
  synth.setNote(frequency);
  
  if (mouseIsPressed) {
    const time = millis() / 1000;
    
    const verts = 1000;
    noFill();
    stroke(colorLine);
    strokeWeight(dim * 0.005);
    beginShape();
    for (let i = 0; i < verts; i++) {
      const t = verts <= 1 ? 0.5 : i / (verts - 1);
      const x = t * width;
      let y = height / 2;
      
      // This is not an accurate representation, but
      // instead exaggerated for the sake of visualization
      const frequencyMod = lerp(1, 1000, pow(u, 5));
      const amplitude = sin(time + t * frequencyMod);
      
      y += amplitude * height / 2;

      vertex(x, y);
    }
    endShape();
  }
  
  // Draw a 'play' button
  noStroke();
  fill(colorButton);
  polygon(width / 2, height / 2, dim * 0.1, 3);
}