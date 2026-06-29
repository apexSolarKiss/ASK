/*
////////////////////////////////////////////////////////////////
> Copyright (c) 2025 >> Andrew S Klug // ASKproduKtion
////////////////////////////////////////////////////////////////
> Licensed under the Apache License, Version 2.0 (the "License"); this file may not be used except in compliance with the License, a copy of which is available at http://www.apache.org/licenses/LICENSE-2.0
////////////////////////////////////////////////////////////////
> Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
////////////////////////////////////////////////////////////////
*/

let paletteASK;         // [{ c: p5.Color, weight: number }, …]
let unit;               // base measurement unit (grid size)
let strokeColor;        // cube edge color
let backgroundColor;    // background color

////////////////////////////////////////////////////////////////
function setup() {
  angleMode(DEGREES);

  // Canvas dimensions >> 4K wide // 16:9 aspect
  const w = 3840/2;
  createCanvas(w, w * 9 / 16);
  unit = w / 32;

  ////////////////////////////////////////////////////////////////
  // color paletteASK with relative ratios
  ////////////////////////////////////////////////////////////////
  
  // adjust the weight values to change relative frequency
  paletteASK = [
    { c: color(255),             weight: 20 }, // white
    { c: color(226, 211, 240),   weight: 30 }, // warm lavender 5
    { c: color(193, 154, 216),   weight: 10 }, // warm lavender 1
    { c: color(174, 135, 194),   weight: 40 }  // warm lavender 4
  ];

  strokeColor = color(84, 77, 93);             // smokey lavender 2
  backgroundColor = color(226, 211, 240);      // warm lavender 5
  background(backgroundColor);
}

////////////////////////////////////////////////////////////////
function draw() {
  // pick a random fill color from paletteASK, subject to specified weights
  const fillColor = weightedRandomColor();
  fillColor.setAlpha(random(3, 7) * 32);       //  depth variation

  // random grid‑aligned position + size
  // x >> aligned on a skewed isometric grid // x is compressed by cos(30°) in iso‑projection
  const x = floor(random(0, 32 / cos(31))) * unit * cos(30);
  // y >> aligned on a straight grid // 19 rows
  const y = floor(random(0, 19)) * unit;
  // random radius (size)
  const r = floor(random(1, 6)) * unit / 4;

  new IsometricCube(x, y, r, strokeColor, fillColor).show();
}

////////////////////////////////////////////////////////////////
// weighted random swatch
////////////////////////////////////////////////////////////////

function weightedRandomColor() {
  const total = paletteASK.reduce((sum, p) => sum + p.weight, 0);
  let threshold = random(total);

  for (const swatch of paletteASK) {
    threshold -= swatch.weight;
    if (threshold <= 0) return swatch.c;
  }
  return paletteASK[0].c; // safety fallback
}

////////////////////////////////////////////////////////////////
// IsometricCube class
////////////////////////////////////////////////////////////////

class IsometricCube {
  constructor(x, y, r, strokeColor, fillColor) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.strokeColor = strokeColor;
    this.fillColor = fillColor;
  }

   ////////////////////////////////////////////////////////////////
   // rendering >>
   // > 6 equilateral triangles for faces
   // > edge outlines
   // > 3 spokes to achieve illusion of isometric depth
   ////////////////////////////////////////////////////////////////
  show() {
    noStroke();
    fill(this.fillColor);

    // 6 triangular faces around the centre
    for (let i = 0; i < 6; i++) {
      triangle(
        this.x,
        this.y,
        this.x + this.r * cos(-30 + i * 60),
        this.y + this.r * sin(-30 + i * 60),
        this.x + this.r * cos(30 + i * 60),
        this.y + this.r * sin(30 + i * 60)
      );
    }

    // edge outlines
    stroke(this.strokeColor);
    for (let i = 0; i < 6; i++) {
      line(
        this.x + this.r * cos(-30 + i * 60),
        this.y + this.r * sin(-30 + i * 60),
        this.x + this.r * cos(30 + i * 60),
        this.y + this.r * sin(30 + i * 60)
      );
    }

    // centre‑to‑vertex spokes
    for (let i = 0; i < 3; i++) {
      line(
        this.x,
        this.y,
        this.x + this.r * cos(30 + i * 120),
        this.y - this.r * sin(30 + i * 120)
      );
    }
  }
}

////////////////////////////////////////////////////////////////
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}