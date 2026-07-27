/**
 * Neural — the organism behind the whole site.
 *
 * Modeled on the real JARVIS Neural visual: a molten amber nucleus wrapped in
 * a corona of thousands of fine curved filaments (warm white + teal), inside a
 * faint teal shell, floating in a sparse starfield.
 *
 * The camera is driven from outside via `camState` (scroll choreography flies
 * it to a different part of the network for each section), and `excite(tint)`
 * makes the corona shimmer in a color and fires pulses outward along strands.
 */
import * as THREE from 'three';

export type RGB = [number, number, number];

const CORE_R = 1;
const STRAND_MIN = 1.15; // filament base radius
const SHELL_R = 3.95;

export type CamState = {
  radius: number;
  azimuth: number;
  elevation: number;
  lookX: number;
  lookY: number;
};

type Strand = {
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
};

export class NeuralScene {
  camState: CamState = { radius: 10.5, azimuth: 0, elevation: 0.08, lookX: -1.2, lookY: 0.1 };

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private rafId = 0;
  private destroyed = false;

  private canvas: HTMLCanvasElement;
  private reduceMotion: boolean;
  private small: boolean;

  private strands: Strand[] = [];
  private strandCount: number;
  private lineMat!: THREE.ShaderMaterial;
  private coreMat!: THREE.ShaderMaterial;
  private shellMat!: THREE.ShaderMaterial;

  private pulseGeo!: THREE.BufferGeometry;
  private pulseMat!: THREE.ShaderMaterial;
  private pulsePositions!: Float32Array;
  private pulseSizes!: Float32Array;
  private livePulses: { strand: number; t: number; speed: number }[] = [];
  private maxPulses: number;

  private tintTarget: RGB = [0.3, 0.9, 0.85];
  private tintCurrent: RGB = [0.3, 0.9, 0.85];
  private excitement = 0;
  private seedAccumulator = 0;
  private idleAzimuth = 0;
  private mouse = { x: 0, y: 0 };
  private static UP = new THREE.Vector3(0, 1, 0);
  private viewDir = new THREE.Vector3();
  private viewRight = new THREE.Vector3();
  private viewUp = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private onResizeBound = () => this.resize();
  private onMouseBound = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.small = window.innerWidth < 768;
    this.strandCount = this.small ? 320 : 640;
    this.maxPulses = this.small ? 40 : 90;
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
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

    this.buildStars();
    this.buildCore();
    this.buildFilaments();
    this.buildShell();
    this.buildPulses();

    this.resize();
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('mousemove', this.onMouseBound);
    this.animate();
  }

  /** Corona shimmers toward a color and pulses race outward along strands. */
  excite(tint: RGB, burst = 24) {
    this.tintTarget = tint;
    this.excitement = 1;
    const n = this.reduceMotion ? Math.min(burst, 6) : burst;
    for (let i = 0; i < n; i++) this.spawnPulse();
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
    const N = 320;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf2f2fa,
      size: 0.14,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.scene.add(new THREE.Points(geo, mat));
  }

  private buildCore() {
    // Molten nucleus: noise-marbled amber surface with a hot fresnel rim
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
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

        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash(i);
          float n100 = hash(i + vec3(1.0, 0.0, 0.0));
          float n010 = hash(i + vec3(0.0, 1.0, 0.0));
          float n110 = hash(i + vec3(1.0, 1.0, 0.0));
          float n001 = hash(i + vec3(0.0, 0.0, 1.0));
          float n101 = hash(i + vec3(1.0, 0.0, 1.0));
          float n011 = hash(i + vec3(0.0, 1.0, 1.0));
          float n111 = hash(i + vec3(1.0, 1.0, 1.0));
          return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
                     mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
        }

        void main() {
          float n = noise(vPos * 4.0 + uTime * 0.12);
          n += 0.5 * noise(vPos * 9.0 - uTime * 0.08);
          n /= 1.5;
          vec3 deep = vec3(0.95, 0.35, 0.02);
          vec3 hot  = vec3(1.0, 0.82, 0.18);
          vec3 col = mix(deep, hot, n);
          float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
          col += vec3(1.0, 0.6, 0.2) * rim * 0.55;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(CORE_R, 48, 48), this.coreMat));

    // Cheap bloom: additive radial-gradient sprite behind the core
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 160, 40, 0.85)');
    grad.addColorStop(0.35, 'rgba(255, 120, 20, 0.35)');
    grad.addColorStop(1, 'rgba(255, 100, 10, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sprite.scale.setScalar(4.6);
    this.scene.add(sprite);
  }

  private buildFilaments() {
    const SEGS = 9;
    const vertsPerStrand = SEGS + 1;
    const segsPerStrand = SEGS;
    const totalVerts = this.strandCount * segsPerStrand * 2;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const phases = new Float32Array(totalVerts);
    const teals = new Float32Array(totalVerts); // 1 = teal strand (tintable)

    let v = 0;
    const tmp = new THREE.Vector3();
    for (let s = 0; s < this.strandCount; s++) {
      // radial direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      const len = 1.1 + Math.random() * 1.7; // tip at 2.25..3.95
      // curvature: bend sideways via a perpendicular vector
      const perp = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .cross(dir)
        .normalize();
      const bend = (Math.random() - 0.5) * 1.5;

      const p0 = dir.clone().multiplyScalar(STRAND_MIN);
      const p1 = dir.clone().multiplyScalar(STRAND_MIN + len * 0.55).addScaledVector(perp, bend * 0.5);
      const p2 = dir.clone().multiplyScalar(STRAND_MIN + len).addScaledVector(perp, bend);
      this.strands.push({ p0, p1, p2 });

      const isTeal = Math.random() < 0.32 ? 1 : 0;
      const base: RGB = isTeal
        ? [0.25 + Math.random() * 0.15, 0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.15]
        : [0.82 + Math.random() * 0.15, 0.85 + Math.random() * 0.12, 0.9 + Math.random() * 0.1];
      const phase = Math.random() * Math.PI * 2;
      const strandBrightness = 0.5 + Math.random() * 0.5;

      const vertAt = (t: number) => {
        // quadratic bezier
        const a = (1 - t) * (1 - t);
        const b = 2 * (1 - t) * t;
        const cc = t * t;
        tmp.set(
          a * p0.x + b * p1.x + cc * p2.x,
          a * p0.y + b * p1.y + cc * p2.y,
          a * p0.z + b * p1.z + cc * p2.z
        );
        return tmp;
      };

      for (let i = 0; i < vertsPerStrand - 1; i++) {
        for (const t of [i / SEGS, (i + 1) / SEGS]) {
          const p = vertAt(t);
          positions[v * 3] = p.x;
          positions[v * 3 + 1] = p.y;
          positions[v * 3 + 2] = p.z;
          // brightness: dim at base, brightest mid, fades to nothing at tip
          const fade = Math.sin(Math.min(t * 1.15, 1) * Math.PI) * 0.85 + 0.15 * (1 - t);
          const bright = fade * strandBrightness;
          colors[v * 3] = base[0] * bright;
          colors[v * 3 + 1] = base[1] * bright;
          colors[v * 3 + 2] = base[2] * bright;
          phases[v] = phase;
          teals[v] = isTeal;
          v++;
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aTeal', new THREE.BufferAttribute(teals, 1));

    this.lineMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTint: { value: new THREE.Color(...this.tintCurrent) },
        uTintAmount: { value: 0 },
        uActivity: { value: 0 },
      },
      vertexShader: `
        attribute float aPhase;
        attribute float aTeal;
        varying vec3 vColor;
        varying float vPhase;
        varying float vTeal;
        void main() {
          vColor = color;
          vPhase = aPhase;
          vTeal = aTeal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPhase;
        varying float vTeal;
        uniform float uTime;
        uniform vec3 uTint;
        uniform float uTintAmount;
        uniform float uActivity;
        void main() {
          float shimmer = 0.62 + 0.38 * sin(uTime * 1.1 + vPhase);
          vec3 col = vColor;
          // tintable strands take on the excited color
          col = mix(col, uTint * length(vColor) * 1.2, uTintAmount * vTeal);
          col *= shimmer * (0.75 + uActivity * 0.6);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.scene.add(new THREE.LineSegments(geo, this.lineMat));
  }

  private buildShell() {
    this.shellMat = new THREE.ShaderMaterial({
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
          gl_FragColor = vec4(uTint, rim * 0.55);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(SHELL_R, 48, 48), this.shellMat));
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
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.pulseGeo, this.pulseMat));
  }

  // ─── run ─────────────────────────────────────────────────────────────────

  private spawnPulse() {
    if (this.livePulses.length >= this.maxPulses) return;
    this.livePulses.push({
      strand: (Math.random() * this.strands.length) | 0,
      t: 0,
      speed: 0.5 + Math.random() * 0.7,
    });
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

    // excitement decays; tint eases toward target
    this.excitement = Math.max(0, this.excitement - delta * 0.4);
    for (let i = 0; i < 3; i++) {
      this.tintCurrent[i] += (this.tintTarget[i] - this.tintCurrent[i]) * delta * 2;
    }
    this.lineMat.uniforms.uTime.value = t;
    this.lineMat.uniforms.uActivity.value = this.excitement;
    this.lineMat.uniforms.uTintAmount.value = 0.25 + this.excitement * 0.65;
    (this.lineMat.uniforms.uTint.value as THREE.Color).setRGB(...this.tintCurrent);
    (this.pulseMat.uniforms.uTint.value as THREE.Color).setRGB(...this.tintCurrent);
    this.coreMat.uniforms.uTime.value = t;

    // ambient pulses (a calm trickle, more when excited)
    if (!this.reduceMotion) {
      this.seedAccumulator += (0.8 + this.excitement * 6) * delta;
      while (this.seedAccumulator >= 1) {
        this.spawnPulse();
        this.seedAccumulator -= 1;
      }
    }

    // advance pulses outward along their strand
    for (let i = 0; i < this.maxPulses; i++) this.pulseSizes[i] = 0;
    for (let p = this.livePulses.length - 1; p >= 0; p--) {
      const pulse = this.livePulses[p];
      pulse.t += pulse.speed * delta;
      if (pulse.t >= 1) {
        this.livePulses.splice(p, 1);
        continue;
      }
      const s = this.strands[pulse.strand];
      const tt = pulse.t;
      const a = (1 - tt) * (1 - tt);
      const b = 2 * (1 - tt) * tt;
      const c = tt * tt;
      const slot = p % this.maxPulses;
      this.pulsePositions[slot * 3] = a * s.p0.x + b * s.p1.x + c * s.p2.x;
      this.pulsePositions[slot * 3 + 1] = a * s.p0.y + b * s.p1.y + c * s.p2.y;
      this.pulsePositions[slot * 3 + 2] = a * s.p0.z + b * s.p1.z + c * s.p2.z;
      this.pulseSizes[slot] = 3.2 * (1 - tt * 0.5);
    }
    this.pulseGeo.attributes.position.needsUpdate = true;
    this.pulseGeo.attributes.size.needsUpdate = true;

    // camera: scroll-driven pose + slow ambient orbit + mouse parallax
    if (!this.reduceMotion) this.idleAzimuth += delta * 0.035;
    const az = this.camState.azimuth + this.idleAzimuth;
    const el = this.camState.elevation;
    const r = this.camState.radius;
    this.camera.position.set(
      r * Math.cos(el) * Math.sin(az) + this.mouse.x * 0.35,
      r * Math.sin(el) + this.mouse.y * 0.35,
      r * Math.cos(el) * Math.cos(az)
    );
    // lookX/lookY place the organism on screen (view-space pan): positive X
    // puts it right of center, positive Y above — stable across the orbit.
    this.viewDir.copy(this.camera.position).multiplyScalar(-1).normalize();
    this.viewRight.crossVectors(this.viewDir, NeuralScene.UP).normalize();
    this.viewUp.crossVectors(this.viewRight, this.viewDir).normalize();
    this.lookTarget
      .set(0, 0, 0)
      .addScaledVector(this.viewRight, -this.camState.lookX)
      .addScaledVector(this.viewUp, -this.camState.lookY);
    this.camera.lookAt(this.lookTarget);

    this.renderer.render(this.scene, this.camera);
  };
}
