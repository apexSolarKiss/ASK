// Copyright (c) 2024 >> Andrew S Klug // ASKproduKtion
// ASK's changes and additions are licensed under the Apache License, Version 2.0 (the "License"); they may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
//
// The star drawing in class Star follows the algorithm of the second randomGaussian() example in the p5.js 1.4.0 reference (src/math/random.js); the code is ASK's own.
//
// Sound adapted from examples by Matt DesLauriers, https://glitch.com/edit/#!/tone-example-effects
// and https://glitch.com/edit/#!/tone-example-tap, also published as src/js/13-tone-effects.js and
// src/js/11-tone-tap.js in https://github.com/mattdesl/workshop-web-audio (commit 6bcfd87).
// That code is used under the following license:
//
// The MIT License (MIT)
// Copyright (c) 2017 Matt DesLauriers
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
// OR OTHER DEALINGS IN THE SOFTWARE.

let init = 3;
// var trail = 20;
let colorBackground, sizeASK, x, y;
let colorsASK = [];
let stars = [];
let logos = [];
let logo;

// The setup() function is async
// So it might take a little while to load
let ready = false;

// The synth that plays notes
let synthE, synthT;

// Can be 'sine', 'sawtooth', 'triangle', 'square'
// Can also add suffixes like sine8, square4
const type = 'square';

// Global volume in decibels
const volume = -15;

// The filter and effect nodes which we will modulate
let filter, effect;

// Min and max frequency (Hz) cutoff range for the filter
const filterMin = 100;
const filterMax = 8000;

// 0..1 values for our FX
let fxU = 0.5;
let fxV = 0.5;

// The notes we will use
const notesE = [ 'C5', 'A3', 'D4', 'G4', 'A4', 'F4' ];

// Create a new canvas to the browser size
async function setup() {
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
  
  renderStars(windowWidth * 2/3, windowHeight * 2/3);
  // logos[0] = loadImage('ASK Produktion Logo 4.13 3 3 2-01.png');
  logos[0] = loadImage('ASK logo 4.13 3 5 K-01 button420.png');
  logo = new Logo(windowWidth * 2/3, windowHeight * 2/3, random(logos));

// Make the volume quieter
  Tone.Master.volume.value = volume;

  // Setup a reverb with ToneJS
  const reverb = new Tone.Reverb({
    decay: 5,
    wet: 0.5,
    preDelay: 0.2
  });

  // Load the reverb
  await reverb.generate();

  // Create an effect node that creates a feedback delay
  effect = new Tone.FeedbackDelay(0.4, 0.85);
  
  // Create a new filter for the X slider
  filter = new Tone.Filter();
  filter.type = 'lowpass';
  
  // Setup a synth with ToneJS
  synthE = new Tone.Synth({
    "oscillator" : {
      // We prefix 'fat' so we can spread the oscillator over multiple frequencies
      "type" : `fat${type}`,
      "count" : 3,
      "spread" : 30
    },
    "envelope": {
      "attack": 0.001,
      "decay": 0.1,
      "sustain": 0.5,
      "release": 0.1,
      "attackCurve" : "exponential"
    }
  });

  // Now lets wire up our stack like so:
  // synth->filter->effect->reverb->master
  synthE.connect(filter);  
  filter.connect(effect);
  effect.connect(reverb);
  reverb.connect(Tone.Master);
  
  // Setup a synth with ToneJS
  synthT = new Tone.Synth({
    "oscillator" : {
      "type": 'sine'
    }
  });

  // Wire up our nodes:
  // synth->master
  synthT.connect(Tone.Master);
  
  // Now we're ready for drawing!
  ready = true;
}

// render stars from ASK colors
function renderStars (xR, yR) {
  sizeASK = min(windowWidth, windowHeight);
  colorBackground = random(colorsASK);
  for (let i = 0; i < init; i++) {
    let x = xR + random(-windowWidth/10, windowWidth/10);
    let y = yR + random(-windowHeight/10, windowHeight/10);
    let colorStrokeR = random(colorsASK);
    stars[i] = new Star(x, y, colorStrokeR);
  }  
}

// On window resize, update the canvas size
function windowResized () {
  resizeCanvas(windowWidth, windowHeight);
}

// Update the FX and trigger synth ON
function mousePressed () {
  updateEffects();
  if (synthE) synthE.triggerAttack(random(notesE));
  
  // Hirajoshi scale in C
  // https://www.pianoscales.org/hirajoshi.html
  const notesT = ['C', 'Db', 'F', 'Gb', 'Bb'];
  const octaves = [ 2, 3, 4 ];
  const octave = random(octaves);
  const note = random(notesT);
  synthT.triggerAttackRelease(note + octave, '8n');
  
  renderStars(mouseX, mouseY);
  logo.x = random(1, 5) * windowWidth/6 - sizeASK/6;
  logo.y = random(1, 5) * windowHeight/6 - sizeASK/6;
  logo.image = random(logos);
}

// Update the FX values
function mouseDragged () {
  updateEffects();
}

// Trigger synth OFF
function mouseReleased () {
  if (synthE) synthE.triggerRelease();
}

// Render loop that draws shapes with p5
function draw() {
  // Make sure async setup() is done before we draw
  if (!ready) return;

  filter.frequency.value = lerp(filterMin, filterMax, fxU);
  effect.wet.value = fxV;

  background(colorBackground);
  for (let star of stars) {
    star.show();
  }
  logo.show();
}

// Update FX values based on mouse position
function updateEffects () {
  fxU = max(0, min(1, mouseX / width));
  fxV = max(0, min(1, mouseY / height));
}

class Star {
  constructor(_x, _y, _colorStroke) {
    this.x = _x;
    this.y = _y;
    this.colorStroke = _colorStroke;
    // one ray per degree, each reaching a whole number of pixels set by a
    // normal distribution centered on 0 with a spread of sizeASK
    this.rays = [];
    for (let degree = 1; degree <= 360; degree++) {
      const reach = Math.abs(Math.floor(randomGaussian(0, sizeASK)));
      const angle = degree * Math.PI / 180;
      this.rays.push([reach * Math.cos(angle), reach * Math.sin(angle)]);
    }
  }

  show() {
    stroke(this.colorStroke);
    for (const [endX, endY] of this.rays) {
      line(this.x, this.y, this.x + endX, this.y + endY);
    }
  }

  move() {
    this.x = this.x + random(-5, 5);
    this.y = this.y + random(-5, 5);
  }
}

class Logo {
  constructor(_x, _y, _image) {
    this.x = _x;
    this.y = _y;
    this.image = _image;
  }

  show() {
    image(this.image, this.x, this.y, sizeASK/6, sizeASK/6);
  }

  move() {
    this.x = this.x + random(-5, 5);
    this.y = this.y + random(-5, 5);
  }
}