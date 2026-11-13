import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const FOV_DEGREES = 30;
const LOGO_HALF_WIDTH = 4.8;
const RING_RADIUS = 4.3;
const GLINT_SPEED = 1.1;
const SPIN_PERIOD = 4;
const SPIN_RAMP = 8;

export const ORBIT_REST_TIME = 4;

export type OrbitScene = {
  render: (seconds: number) => void;
  resize: (aspect: number) => void;
  dispose: () => void;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, p: number) => from + (to - from) * p;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutQuart = (p: number) => 1 - Math.pow(1 - p, 4);
const arch = (p: number) => Math.sin(Math.PI * clamp01(p));

const TRAIL_VERTEX = `
  varying float vProgress;
  void main() {
    vProgress = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TRAIL_FRAGMENT = `
  uniform vec3 color;
  varying float vProgress;
  void main() {
    gl_FragColor = vec4(color, pow(vProgress, 2.5) * 0.9);
  }
`;

function findNamed(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined;
  root.traverse((child) => {
    if (!found && child.name === name) found = child;
  });
  return found;
}

function enhanceMaterial(
  obj: THREE.Object3D | undefined,
  enhance: (mat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial) => void,
) {
  if (!obj || !(obj as THREE.Mesh).isMesh) return;
  const mesh = obj as THREE.Mesh;
  const material = mesh.material;
  if (Array.isArray(material)) {
    material.forEach((m) => enhance(m as THREE.MeshPhysicalMaterial));
  } else {
    enhance(material as THREE.MeshPhysicalMaterial);
  }
}

export function createOrbitScene(
  renderer: THREE.WebGLRenderer,
  gltfScene: THREE.Group,
): OrbitScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV_DEGREES, 1, 0.1, 100);
  camera.position.z = 12.5;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-4, 6, 8);
  const rim = new THREE.PointLight(0xa66bff, 18, 30, 2);
  rim.position.set(6, -3, -6);
  const sweep = new THREE.PointLight(0xffffff, 0, 25, 2);
  scene.add(key, rim, sweep);

  // Extract named objects from the GLB before reparenting
  const logoGroup = findNamed(gltfScene, 'Logo') as THREE.Group | undefined;
  const orbitRingGroup = findNamed(gltfScene, 'OrbitRing') as THREE.Group | undefined;
  const leftMesh = findNamed(gltfScene, 'LetterL') as THREE.Mesh | undefined;
  const rightMesh = findNamed(gltfScene, 'LetterR') as THREE.Mesh | undefined;

  // Re-apply Three.js-specific material properties that glTF doesn't store
  enhanceMaterial(leftMesh, (mat) => {
    mat.envMapIntensity = 1.3;
    if ('clearcoat' in mat) {
      mat.clearcoat = 1;
      mat.clearcoatRoughness = 0.08;
    }
  });
  enhanceMaterial(rightMesh, (mat) => {
    mat.envMapIntensity = 1.3;
    if ('clearcoat' in mat) {
      mat.clearcoat = 1;
      mat.clearcoatRoughness = 0.08;
    }
  });
  const ringMesh = orbitRingGroup
    ? (findNamed(orbitRingGroup, 'Ring') as THREE.Mesh | undefined)
    : undefined;
  enhanceMaterial(ringMesh, (mat) => {
    mat.envMapIntensity = 1.5;
    if ('clearcoat' in mat) {
      mat.clearcoat = 1;
      mat.clearcoatRoughness = 0.05;
    }
  });
  const glintMesh = orbitRingGroup
    ? (findNamed(orbitRingGroup, 'Glint') as THREE.Mesh | undefined)
    : undefined;
  enhanceMaterial(glintMesh, (mat) => {
    mat.toneMapped = false;
  });

  // The GLB has the ring tilt baked into OrbitRing's matrix.
  // Decompose it into the tilt group's Euler rotation, then reset the source.
  const spinner = new THREE.Group();
  const tilt = new THREE.Group();
  if (orbitRingGroup) {
    orbitRingGroup.updateMatrixWorld(true);
    const m = orbitRingGroup.matrix.clone();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    m.decompose(pos, quat, scale);
    tilt.quaternion.copy(quat);
    orbitRingGroup.matrix.identity();
    orbitRingGroup.matrixWorldNeedsUpdate = true;
  }
  spinner.add(tilt);
  scene.add(spinner);

  if (logoGroup) scene.add(logoGroup);
  if (orbitRingGroup) tilt.add(orbitRingGroup);

  // Animated trail (procedural — not part of the GLB)
  const TRAIL_ARC = 1.1;
  const TRAIL_TUBE = 0.2;
  const trailGeometry = new THREE.TorusGeometry(RING_RADIUS, TRAIL_TUBE, 12, 160, TRAIL_ARC);
  const trailMaterial = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#b366ff') } },
    vertexShader: TRAIL_VERTEX,
    fragmentShader: TRAIL_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const trailArm = new THREE.Group();
  trailArm.add(new THREE.Mesh(trailGeometry, trailMaterial));
  tilt.add(trailArm);

  // Glint light (the sphere mesh comes from the GLB; we add the animated light)
  const glintArm = new THREE.Group();
  const glintLight = new THREE.PointLight(0xc084ff, 8, 7, 2);
  glintLight.position.x = RING_RADIUS;
  glintArm.add(glintLight);
  if (glintMesh) glintArm.add(glintMesh);
  tilt.add(glintArm);

  const render = (seconds: number) => {
    const turn = easeOutQuart(clamp01((seconds - 0.35) / 1.9));
    if (logoGroup) {
      logoGroup.rotation.y = lerp(-1.48, 0, turn) + 0.12 * Math.sin(seconds * 0.6) * turn;
      logoGroup.scale.setScalar(lerp(0.8, 1, turn));
    }

    const split = 0.3 * arch((seconds - 2.45) / 1.15);
    if (leftMesh) leftMesh.position.x = -split;
    if (rightMesh) rightMesh.position.x = split;

    const sweepP = clamp01((seconds - 1.9) / 1.3);
    sweep.position.set(lerp(-7, 7, sweepP), 2.5, 5);
    sweep.intensity = 40 * arch(sweepP);

    const formP = easeOutCubic(clamp01((seconds - 0.9) / 1.6));
    spinner.scale.setScalar(lerp(0.7, 1, formP));

    const ringTime = Math.max(0, seconds - 0.9);
    const omega = (2 * Math.PI) / SPIN_PERIOD;
    spinner.rotation.y =
      ringTime < SPIN_RAMP
        ? (omega * ringTime * ringTime) / (2 * SPIN_RAMP)
        : (omega * SPIN_RAMP) / 2 + omega * (ringTime - SPIN_RAMP);

    const glintAngle = seconds * GLINT_SPEED;
    glintArm.rotation.z = glintAngle;
    trailArm.rotation.z = glintAngle - TRAIL_ARC;

    renderer.render(scene, camera);
  };

  const resize = (aspect: number) => {
    camera.aspect = aspect;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(FOV_DEGREES / 2));
    camera.position.z = Math.max(12.5, LOGO_HALF_WIDTH / (tanHalfFov * aspect));
    camera.updateProjectionMatrix();
  };

  const dispose = () => {
    trailGeometry.dispose();
    trailMaterial.dispose();
    environment.dispose();
    pmrem.dispose();
  };

  return { render, resize, dispose };
}
