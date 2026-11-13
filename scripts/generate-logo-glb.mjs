import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// --- Browser API polyfills for GLTFExporter ---
class FakeFileReader {
  constructor() {
    this.onload = null;
    this.onloadend = null;
    this.onerror = null;
    this.result = null;
  }
  _emit(blob, isData) {
    blob.arrayBuffer().then((buf) => {
      this.result = isData
        ? 'data:application/octet-stream;base64,' + Buffer.from(buf).toString('base64')
        : buf;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
  readAsArrayBuffer(blob) { this._emit(blob, false); }
  readAsDataURL(blob) { this._emit(blob, true); }
}

class FakeBlob {
  constructor(parts, options = {}) {
    this._type = options.type || '';
    if (parts && parts.length > 0) {
      const chunks = parts.map((p) => {
        if (p instanceof ArrayBuffer) return Buffer.from(p);
        if (ArrayBuffer.isView(p)) return Buffer.from(p.buffer, p.byteOffset, p.byteLength);
        if (p instanceof FakeBlob) return p._buffer || Buffer.alloc(0);
        if (typeof p === 'string') return Buffer.from(p);
        return Buffer.from(p);
      });
      this._buffer = Buffer.concat(chunks);
    } else {
      this._buffer = Buffer.alloc(0);
    }
    this.size = this._buffer.length;
    this.type = this._type;
  }
  arrayBuffer() { return Promise.resolve(this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength)); }
  text() { return Promise.resolve(this._buffer.toString('utf8')); }
}

globalThis.FileReader = FakeFileReader;
globalThis.Blob = FakeBlob;
globalThis.document = globalThis.document || {
  createElement(tag) {
    if (tag === 'canvas') {
      return { width: 0, height: 0, getContext: () => null, toDataURL: () => '' };
    }
    return {};
  },
};

// --- Now import three and generate ---
const THREE = await import('three');
const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

const LOGO_CENTER = { x: 670.5, y: 469.5 };

const LETTER_L = [
  ['M', 343, 207], ['L', 462, 300], ['L', 455, 604], ['H', 622], ['L', 722, 710], ['H', 346], ['Z'],
];
const LETTER_R = [
  ['M', 530, 270], ['H', 762],
  ['C', 858, 270, 906, 312, 906, 362],
  ['C', 906, 418, 862, 446, 812, 452],
  ['L', 998, 732], ['L', 818, 720], ['L', 686, 516],
  ['H', 600], ['V', 438], ['H', 530], ['Z'],
  ['M', 600, 332], ['H', 755],
  ['C', 785, 332, 805, 346, 805, 380],
  ['C', 805, 412, 785, 437, 755, 437],
  ['H', 600], ['Z'],
];

const LETTER_DEPTH = 0.45;
const RING_RADIUS = 4.3;
const RING_TUBE = 0.16;
const RING_TILT_X = 1.0;
const RING_TILT_Z = -0.25;

function outlinePaths(commands) {
  const toX = (x) => (x - LOGO_CENTER.x) / 100;
  const toY = (y) => -(y - LOGO_CENTER.y) / 100;
  const paths = [];
  const current = () => paths[paths.length - 1];
  let x = 0, y = 0, startX = 0, startY = 0;
  for (const cmd of commands) {
    switch (cmd[0]) {
      case 'M': paths.push(new THREE.Path()); current().moveTo(toX(cmd[1]), toY(cmd[2])); [x,y]=[cmd[1],cmd[2]]; [startX,startY]=[x,y]; break;
      case 'L': current().lineTo(toX(cmd[1]), toY(cmd[2])); [x,y]=[cmd[1],cmd[2]]; break;
      case 'H': current().lineTo(toX(cmd[1]), toY(y)); x=cmd[1]; break;
      case 'V': current().lineTo(toX(x), toY(cmd[1])); y=cmd[1]; break;
      case 'C': current().bezierCurveTo(toX(cmd[1]),toY(cmd[2]),toX(cmd[3]),toY(cmd[4]),toX(cmd[5]),toY(cmd[6])); [x,y]=[cmd[5],cmd[6]]; break;
      case 'Q': current().quadraticCurveTo(toX(cmd[1]),toY(cmd[2]),toX(cmd[3]),toY(cmd[4])); [x,y]=[cmd[3],cmd[4]]; break;
      case 'Z': current().lineTo(toX(startX),toY(startY)); [x,y]=[startX,startY]; break;
    }
  }
  return paths;
}

function letterGeometry(commands) {
  const [outline, ...holes] = outlinePaths(commands);
  const shape = new THREE.Shape();
  shape.curves = outline.curves;
  shape.holes = holes;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: LETTER_DEPTH, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.12, bevelSegments: 10, curveSegments: 32 });
  geo.translate(0, 0, -LETTER_DEPTH / 2);
  return geo;
}

const scene = new THREE.Scene();
const logoGroup = new THREE.Group();
logoGroup.name = 'Logo';

const letterMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8a2cff, metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3 });
const leftMesh = new THREE.Mesh(letterGeometry(LETTER_L), letterMaterial);
leftMesh.name = 'LetterL';
const rightMesh = new THREE.Mesh(letterGeometry(LETTER_R), letterMaterial);
rightMesh.name = 'LetterR';
logoGroup.add(leftMesh, rightMesh);
scene.add(logoGroup);

const ringGroup = new THREE.Group();
ringGroup.name = 'OrbitRing';
ringGroup.rotation.set(RING_TILT_X, 0, RING_TILT_Z);

const ringMaterial = new THREE.MeshPhysicalMaterial({ color: 0xb366ff, metalness: 1, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x3a0080, emissiveIntensity: 0.5, envMapIntensity: 1.5 });
const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 24, 320), ringMaterial);
ringMesh.name = 'Ring';
ringGroup.add(ringMesh);

const glintMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
glintMesh.name = 'Glint';
glintMesh.position.x = RING_RADIUS;
ringGroup.add(glintMesh);

scene.add(ringGroup);

const exporter = new GLTFExporter();
await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    (result) => {
      if (result instanceof ArrayBuffer) {
        const outPath = 'public/models/lumora-logo.glb';
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, Buffer.from(result));
        console.log(`Wrote ${outPath} (${result.byteLength} bytes)`);
        resolve();
      } else {
        reject(new Error('Expected binary GLB output'));
      }
    },
    (error) => reject(error),
    { binary: true },
  );
});
