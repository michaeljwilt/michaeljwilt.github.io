/**
 * Neural — a brain of neurons behind the whole site.
 *
 * Many molten-core neurons (each styled on the real JARVIS visual: amber
 * nucleus, filament corona, faint teal shell) scattered through space and
 * wired together with axons. Each page section owns a neuron; the camera
 * flies neuron-to-neuron as you scroll, the active neuron wakes up, and a
 * signal train races down the axon from the previous neuron to the next.
 */
import * as THREE from 'three';

export type RGB = [number, number, number];

export type CamState = {
  tx: number; ty: number; tz: number; // orbit target (usually a neuron)
  radius: number;
  azimuth: number;
  elevation: number;
  lookX: number; // view-space: +X puts the target right of screen center
  lookY: number; // view-space: +Y puts it above center
};

// Hand-placed so camera poses are deterministic.
// First 9 are section neurons, in page order:
//   0 hero · 1 fit · 2 work · 3 scope · 4 about · 5 chart · 6 projects
//   7 studio · 8 contact
// The rest are background filler that give the brain depth.
export const NEURONS: { pos: [number, number, number]; scale: number; major: boolean }[] = [
  { pos: [0, 0, 0],       scale: 1.0,  major: true },  // 0 hero
  { pos: [-9, 3, -6],     scale: 0.7,  major: true },  // 1 fit
  { pos: [7, 6, -10],     scale: 0.65, major: true },  // 2 work
  { pos: [11, -3, -5],    scale: 0.75, major: true },  // 3 scope
  { pos: [3, -8, -12],    scale: 0.7,  major: true },  // 4 about
  { pos: [-5, -7, -16],   scale: 0.6,  major: true },  // 5 chart
  { pos: [10, 4, -19],    scale: 0.8,  major: true },  // 6 projects
  { pos: [-9, 1, -23],    scale: 0.9,  major: true },  // 7 studio
  { pos: [-2, 9, -15],    scale: 0.65, major: true },  // 8 contact
  { pos: [-15, -3, -12],  scale: 0.35, major: false },
  { pos: [15, 5, -15],    scale: 0.3,  major: false },
  { pos: [5, 13, -21],    scale: 0.4,  major: false },
  { pos: [-12, 10, -24],  scale: 0.3,  major: false },
  { pos: [17, -9, -16],   scale: 0.35, major: false },
  { pos: [-4, -13, -9],   scale: 0.3,  major: false },
  { pos: [8, -2, -26],    scale: 0.4,  major: false },
  { pos: [-17, 3, -28],   scale: 0.3,  major: false },
];

// Axons: consecutive section neurons always connected (the journey path, so a
// signal train always has a route), plus cross-links and filler hookups.
const AXONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0],
  [0, 3], [1, 8], [2, 6], [4, 7], [3, 5],
  [1, 9], [2, 10], [6, 11], [7, 12], [3, 13], [4, 14], [6, 15], [7, 16],
  [9, 14], [11, 12], [10, 15],
];

const CORE_R = 1;

type Path = { p0: THREE.Vector3; p1: THREE.Vector3; p2: THREE.Vector3 };
type Pulse = { path: Path; t: number; speed: number; size: number };

function bezier(out: THREE.Vector3, path: Path, t: number) {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  out.set(
    a * path.p0.x + b * path.p1.x + c * path.p2.x,
    a * path.p0.y + b * path.p1.y + c * path.p2.y,
    a * path.p0.z + b * path.p1.z + c * path.p2.z
  );
}

export class NeuralScene {
  camState: CamState = {
    tx: 0, ty: 0, tz: 0,
    radius: 10.5, azimuth: 0, elevation: 0.08, lookX: 1.4, lookY: 0,
  };

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private rafId = 0;
  private destroyed = false;
  private canvas: HTMLCanvasElement;
  private reduceMotion: boolean;
  private small: boolean;

  private neuronPos: THREE.Vector3[] = NEURONS.map((n) => new THREE.Vector3(...n.pos));
  private strandPaths: Path[] = [];
  private strandNeuron: number[] = [];
  private axonPaths: Path[] = [];
  private axonEdges = AXONS;

  private lineMat!: THREE.ShaderMaterial;
  private coreMats: THREE.ShaderMaterial[] = [];
  private pulseGeo!: THREE.BufferGeometry;
  private pulseMat!: THREE.ShaderMaterial;
  private pulsePositions!: Float32Array;
  private pulseSizes!: Float32Array;
  private livePulses: Pulse[] = [];
  private maxPulses: number;

  private activeNeuron = 0;
  private tintTarget: RGB = [0.3, 0.9, 0.85];
  private tintCurrent: RGB = [0.3, 0.9, 0.85];
  private excitement = 0;
  private seedAccumulator = 0;
  private axonAccumulator = 0;
  private idleAzimuth = 0;
  private mouse = { x: 0, y: 0 };
  private static UP = new THREE.Vector3(0, 1, 0);
  private viewDir = new THREE.Vector3();
  private viewRight = new THREE.Vector3();
  private viewUp = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private tmpV = new THREE.Vector3();
  private onResizeBound = () => this.resize();
  private onMouseBound = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.small = window.innerWidth < 768;
    this.maxPulses = this.small ? 60 : 140;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static supported(canvas: HTMLCanvasElement): boolean {
    try {
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
      );
    } catch {
      return false;
    }
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);

    this.buildStars();
    this.buildNeurons();
    this.buildFilaments();
    this.buildAxons();
    this.buildPulses();

    this.resize();
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('mousemove', this.onMouseBound);
    this.animate();
  }

  /** Focus a neuron: it wakes, and a signal train races to it from the last one. */
  setActive(idx: number) {
    if (idx === this.activeNeuron) return;
    const from = this.activeNeuron;
    this.activeNeuron = idx;
    this.excitement = 1;
    if (!this.reduceMotion) this.fireTrain(from, idx);
  }

  /** The active neuron's corona shimmers toward a color and fires pulses. */
  excite(tint: RGB, burst = 18) {
    this.tintTarget = tint;
    this.excitement = 1;
    const n = this.reduceMotion ? Math.min(burst, 5) : burst;
    for (let i = 0; i < n; i++) this.spawnStrandPulse(this.activeNeuron);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('mousemove', this.onMouseBound);
    this.renderer?.dispose();
  }

  // ─── build ───────────────────────────────────────────────────────────────

  private buildStars() {
    const N = 380;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 45 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0xf2f2fa, size: 0.16, sizeAttenuation: true,
          transparent: true, opacity: 0.5, depthWrite: false,
        })
      )
    );
  }

  private makeCoreMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBoost: { value: 1 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBoost;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float noise(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
            f.z);
        }
        void main() {
          float n = noise(vPos * 4.0 + uTime * 0.12) + 0.5 * noise(vPos * 9.0 - uTime * 0.08);
          n /= 1.5;
          vec3 col = mix(vec3(0.95, 0.35, 0.02), vec3(1.0, 0.82, 0.18), n);
          float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
          col += vec3(1.0, 0.6, 0.2) * rim * 0.55;
          gl_FragColor = vec4(col * uBoost, 1.0);
        }
      `,
    });
  }

  private glowTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 160, 40, 0.8)');
    grad.addColorStop(0.35, 'rgba(255, 120, 20, 0.3)');
    grad.addColorStop(1, 'rgba(255, 100, 10, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  private buildNeurons() {
    const coreGeo = new THREE.SphereGeometry(CORE_R, 40, 40);
    const shellGeo = new THREE.SphereGeometry(3.95, 40, 40);
    const glowMap = this.glowTexture();
    const shellMat = new THREE.ShaderMaterial({
      uniforms: { uTint: { value: new THREE.Color(0.18, 0.83, 0.75) } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uTint;
        void main() {
          float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.5);
          gl_FragColor = vec4(uTint, rim * 0.4);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });

    NEURONS.forEach((n, i) => {
      const p = this.neuronPos[i];
      if (n.major) {
        const mat = this.makeCoreMaterial();
        this.coreMats[i] = mat;
        const core = new THREE.Mesh(coreGeo, mat);
        core.position.copy(p);
        core.scale.setScalar(n.scale);
        this.scene.add(core);

        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.copy(p);
        shell.scale.setScalar(n.scale);
        this.scene.add(shell);
      }
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowMap, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: n.major ? 1 : 0.6,
        })
      );
      sprite.position.copy(p);
      sprite.scale.setScalar((n.major ? 4.6 : 2.2) * n.scale);
      this.scene.add(sprite);
    });
  }

  private buildFilaments() {
    const SEGS = 8;
    // strand budget per neuron: hero gets the most, majors plenty, minors a dusting
    const counts = NEURONS.map((n, i) => {
      if (i === 0) return this.small ? 180 : 300;
      return n.major ? (this.small ? 80 : 130) : (this.small ? 22 : 36);
    });
    const totalStrands = counts.reduce((a, b) => a + b, 0);
    const totalVerts = totalStrands * SEGS * 2;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const phases = new Float32Array(totalVerts);
    const neuronIdx = new Float32Array(totalVerts);
    const teals = new Float32Array(totalVerts);

    let v = 0;
    const pt = new THREE.Vector3();
    NEURONS.forEach((n, ni) => {
      const center = this.neuronPos[ni];
      const s = n.scale;
      for (let k = 0; k < counts[ni]; k++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        );
        const len = (1.1 + Math.random() * 1.7) * s;
        const perp = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .cross(dir).normalize();
        const bend = (Math.random() - 0.5) * 1.5 * s;
        const base = 1.15 * s;

        const p0 = dir.clone().multiplyScalar(base).add(center);
        const p1 = dir.clone().multiplyScalar(base + len * 0.55).addScaledVector(perp, bend * 0.5).add(center);
        const p2 = dir.clone().multiplyScalar(base + len).addScaledVector(perp, bend).add(center);
        const path = { p0, p1, p2 };
        this.strandPaths.push(path);
        this.strandNeuron.push(ni);

        const isTeal = Math.random() < 0.32 ? 1 : 0;
        const col: RGB = isTeal
          ? [0.25 + Math.random() * 0.15, 0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.15]
          : [0.82 + Math.random() * 0.15, 0.85 + Math.random() * 0.12, 0.9 + Math.random() * 0.1];
        const phase = Math.random() * Math.PI * 2;
        const strandBrightness = (0.5 + Math.random() * 0.5) * (n.major ? 1 : 0.5);

        for (let i = 0; i < SEGS; i++) {
          for (const t of [i / SEGS, (i + 1) / SEGS]) {
            bezier(pt, path, t);
            positions[v * 3] = pt.x;
            positions[v * 3 + 1] = pt.y;
            positions[v * 3 + 2] = pt.z;
            const fade = Math.sin(Math.min(t * 1.15, 1) * Math.PI) * 0.85 + 0.15 * (1 - t);
            const bright = fade * strandBrightness;
            colors[v * 3] = col[0] * bright;
            colors[v * 3 + 1] = col[1] * bright;
            colors[v * 3 + 2] = col[2] * bright;
            phases[v] = phase;
            neuronIdx[v] = ni;
            teals[v] = isTeal;
            v++;
          }
        }
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aNeuron', new THREE.BufferAttribute(neuronIdx, 1));
    geo.setAttribute('aTeal', new THREE.BufferAttribute(teals, 1));

    this.lineMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTint: { value: new THREE.Color(...this.tintCurrent) },
        uTintAmount: { value: 0 },
        uActivity: { value: 0 },
        uActive: { value: 0 },
      },
      vertexShader: `
        attribute float aPhase;
        attribute float aNeuron;
        attribute float aTeal;
        varying vec3 vColor;
        varying float vPhase;
        varying float vTeal;
        varying float vIsActive;
        uniform float uActive;
        void main() {
          vColor = color;
          vPhase = aPhase;
          vTeal = aTeal;
          vIsActive = 1.0 - step(0.5, abs(aNeuron - uActive));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPhase;
        varying float vTeal;
        varying float vIsActive;
        uniform float uTime;
        uniform vec3 uTint;
        uniform float uTintAmount;
        uniform float uActivity;
        void main() {
          float shimmer = 0.62 + 0.38 * sin(uTime * 1.1 + vPhase);
          vec3 col = vColor;
          col = mix(col, uTint * length(vColor) * 1.2, uTintAmount * vTeal * vIsActive);
          float wake = mix(0.55, 1.0 + uActivity * 0.6, vIsActive);
          col *= shimmer * wake;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true, vertexColors: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.scene.add(new THREE.LineSegments(geo, this.lineMat));
  }

  private buildAxons() {
    const SEGS = 22;
    const totalVerts = this.axonEdges.length * SEGS * 2;
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    let v = 0;
    const pt = new THREE.Vector3();

    for (const [a, b] of this.axonEdges) {
      const pa = this.neuronPos[a];
      const pb = this.neuronPos[b];
      const mid = pa.clone().add(pb).multiplyScalar(0.5);
      // sag the axon sideways so it reads organic, not straight wiring
      const off = new THREE.Vector3(
        Math.sin(a * 3.7 + b), Math.cos(a - b * 2.3), Math.sin(a * 1.3 + b * 0.7)
      ).normalize().multiplyScalar(pa.distanceTo(pb) * 0.18);
      const path = { p0: pa.clone(), p1: mid.add(off), p2: pb.clone() };
      this.axonPaths.push(path);

      for (let i = 0; i < SEGS; i++) {
        for (const t of [i / SEGS, (i + 1) / SEGS]) {
          bezier(pt, path, t);
          positions[v * 3] = pt.x;
          positions[v * 3 + 1] = pt.y;
          positions[v * 3 + 2] = pt.z;
          // dim teal-gray, brighter toward the middle of the run
          const m = Math.sin(t * Math.PI) * 0.5 + 0.2;
          colors[v * 3] = 0.1 * m;
          colors[v * 3 + 1] = 0.3 * m;
          colors[v * 3 + 2] = 0.32 * m;
          v++;
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.scene.add(
      new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({
          vertexColors: true, transparent: true, opacity: 0.7,
          depthWrite: false, blending: THREE.AdditiveBlending,
        })
      )
    );
  }

  private buildPulses() {
    this.pulsePositions = new Float32Array(this.maxPulses * 3);
    this.pulseSizes = new Float32Array(this.maxPulses);
    for (let i = 0; i < this.maxPulses; i++) this.pulsePositions[i * 3] = 9999;
    this.pulseGeo = new THREE.BufferGeometry();
    this.pulseGeo.setAttribute('position', new THREE.BufferAttribute(this.pulsePositions, 3));
    this.pulseGeo.setAttribute('size', new THREE.BufferAttribute(this.pulseSizes, 1));
    this.pulseMat = new THREE.ShaderMaterial({
      uniforms: {
        uTint: { value: new THREE.Color(...this.tintCurrent) },
        uSizeScale: { value: 200 },
      },
      vertexShader: `
        attribute float size;
        uniform float uSizeScale;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (uSizeScale / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTint;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(mix(vec3(1.0), uTint, 0.5), a * 0.9);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.pulseGeo, this.pulseMat));
  }

  // ─── behavior ────────────────────────────────────────────────────────────

  private spawnStrandPulse(neuron: number) {
    if (this.livePulses.length >= this.maxPulses) return;
    // pick a random strand belonging to this neuron
    for (let tries = 0; tries < 8; tries++) {
      const i = (Math.random() * this.strandPaths.length) | 0;
      if (this.strandNeuron[i] === neuron) {
        this.livePulses.push({
          path: this.strandPaths[i], t: 0, speed: 0.5 + Math.random() * 0.7, size: 3.0,
        });
        return;
      }
    }
  }

  private spawnAxonPulse() {
    if (this.livePulses.length >= this.maxPulses) return;
    const path = this.axonPaths[(Math.random() * this.axonPaths.length) | 0];
    this.livePulses.push({ path, t: 0, speed: 0.25 + Math.random() * 0.25, size: 2.4 });
  }

  /** Signal train along the axon between two section neurons. */
  private fireTrain(from: number, to: number) {
    const edge = this.axonEdges.findIndex(
      ([a, b]) => (a === from && b === to) || (a === to && b === from)
    );
    if (edge < 0) return;
    let path = this.axonPaths[edge];
    // trains always run from -> to
    if (this.axonEdges[edge][0] !== from) {
      path = { p0: path.p2, p1: path.p1, p2: path.p0 };
    }
    for (let i = 0; i < 7; i++) {
      if (this.livePulses.length >= this.maxPulses) break;
      this.livePulses.push({ path, t: -i * 0.06, speed: 0.65, size: 3.4 });
    }
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.pulseMat.uniforms.uSizeScale.value = (h / 900) * 240;
  }

  private animate = () => {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this.animate);
    if (document.hidden) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.getElapsedTime();

    this.excitement = Math.max(0, this.excitement - delta * 0.4);
    for (let i = 0; i < 3; i++) {
      this.tintCurrent[i] += (this.tintTarget[i] - this.tintCurrent[i]) * delta * 2;
    }
    const lu = this.lineMat.uniforms;
    lu.uTime.value = t;
    lu.uActivity.value = this.excitement;
    lu.uTintAmount.value = 0.25 + this.excitement * 0.65;
    lu.uActive.value = this.activeNeuron;
    (lu.uTint.value as THREE.Color).setRGB(...this.tintCurrent);
    (this.pulseMat.uniforms.uTint.value as THREE.Color).setRGB(...this.tintCurrent);

    this.coreMats.forEach((m, i) => {
      if (!m) return;
      m.uniforms.uTime.value = t;
      const target = i === this.activeNeuron ? 1 + this.excitement * 0.35 : 0.8;
      m.uniforms.uBoost.value += (target - m.uniforms.uBoost.value) * delta * 3;
    });

    if (!this.reduceMotion) {
      // active neuron trickles pulses; whole brain murmurs along axons
      this.seedAccumulator += (0.8 + this.excitement * 5) * delta;
      while (this.seedAccumulator >= 1) {
        this.spawnStrandPulse(this.activeNeuron);
        this.seedAccumulator -= 1;
      }
      this.axonAccumulator += 1.6 * delta;
      while (this.axonAccumulator >= 1) {
        this.spawnAxonPulse();
        this.axonAccumulator -= 1;
      }
    }

    for (let i = 0; i < this.maxPulses; i++) this.pulseSizes[i] = 0;
    for (let p = this.livePulses.length - 1; p >= 0; p--) {
      const pulse = this.livePulses[p];
      pulse.t += pulse.speed * delta;
      if (pulse.t >= 1) {
        this.livePulses.splice(p, 1);
        continue;
      }
      if (pulse.t < 0) continue; // staggered train members not launched yet
      bezier(this.tmpV, pulse.path, pulse.t);
      const slot = p % this.maxPulses;
      this.pulsePositions[slot * 3] = this.tmpV.x;
      this.pulsePositions[slot * 3 + 1] = this.tmpV.y;
      this.pulsePositions[slot * 3 + 2] = this.tmpV.z;
      this.pulseSizes[slot] = pulse.size * (1 - pulse.t * 0.4);
    }
    this.pulseGeo.attributes.position.needsUpdate = true;
    this.pulseGeo.attributes.size.needsUpdate = true;

    // camera: orbit the scroll-driven target with view-space framing
    if (!this.reduceMotion) this.idleAzimuth += delta * 0.03;
    const az = this.camState.azimuth + this.idleAzimuth;
    const el = this.camState.elevation;
    const r = this.camState.radius;
    const tx = this.camState.tx, ty = this.camState.ty, tz = this.camState.tz;
    this.camera.position.set(
      tx + r * Math.cos(el) * Math.sin(az) + this.mouse.x * 0.35,
      ty + r * Math.sin(el) + this.mouse.y * 0.35,
      tz + r * Math.cos(el) * Math.cos(az)
    );
    this.viewDir.set(tx, ty, tz).sub(this.camera.position).normalize();
    this.viewRight.crossVectors(this.viewDir, NeuralScene.UP).normalize();
    this.viewUp.crossVectors(this.viewRight, this.viewDir).normalize();
    this.lookTarget
      .set(tx, ty, tz)
      .addScaledVector(this.viewRight, -this.camState.lookX)
      .addScaledVector(this.viewUp, -this.camState.lookY);
    this.camera.lookAt(this.lookTarget);

    this.renderer.render(this.scene, this.camera);
  };
}
