/**
 * Neural scene — ported from Brilliant Disruptions' jarvis-neural.js.
 *
 * A two-lobe field of glowing neurons connected by synapse edges, with signal
 * pulses that travel node-to-node and cascade. Adapted for the portfolio:
 * renders inside a container (not fullscreen), and exposes excite(tint) so
 * each project can make the brain "think" in its own color.
 */
import * as THREE from 'three';

export type RGB = [number, number, number];

const MAX_EDGE_DIST = 1.6;
const ELLIPSOID = { x: 3.4, y: 2.4, z: 2.8 };
const HEMI_GAP = 0.35;

const IDLE = { activity: 0.18, pulseSpeed: 0.9, seedRate: 0.9, propagation: 0.14, edgeOpacity: 0.14, tintAmount: 0.3 };
const EXCITED = { activity: 0.75, pulseSpeed: 2.4, seedRate: 6.0, propagation: 0.4, edgeOpacity: 0.42, tintAmount: 0.7 };

type Node = {
  x: number; y: number; z: number;
  home: { x: number; y: number; z: number };
  activation: number;
  drift: { x: number; y: number; z: number };
};

export class NeuralScene {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private rafId = 0;

  private nodes: Node[] = [];
  private edges: { a: number; b: number; len: number }[] = [];
  private adj: number[][] = [];
  private livePulses: { edge: number; dir: number; t: number; speed: number }[] = [];

  private nodeGeo!: THREE.BufferGeometry;
  private nodeMat!: THREE.ShaderMaterial;
  private pulseMatRef!: THREE.ShaderMaterial;
  private edgeMat!: THREE.LineBasicMaterial;
  private pulseGeo!: THREE.BufferGeometry;
  private nodeActivations!: Float32Array;
  private pulsePositions!: Float32Array;
  private pulseSizes!: Float32Array;

  private maxPulses: number;
  private nodeCount: number;
  private neighbors: number;

  private target = { ...IDLE };
  private liveActivity = IDLE.activity;
  private tintTarget: RGB = [0.18, 0.83, 0.75]; // teal
  private tintCurrent: RGB = [0.18, 0.83, 0.75];
  private tintAmount = IDLE.tintAmount;
  private exciteDecay = 0; // 1 → excited profile, decays toward idle
  private seedAccumulator = 0;
  private mouse = { x: 0, y: 0 };
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private resizeObserver?: ResizeObserver;
  private reduceMotion: boolean;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.container = container;
    const small = window.innerWidth < 768;
    this.nodeCount = small ? 120 : 260;
    this.neighbors = small ? 3 : 4;
    this.maxPulses = small ? 40 : 100;
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

  init(): boolean {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.z = 8;

    this.generateNodes();
    this.buildEdges();
    this.buildNodeGeometry();
    this.buildEdgeGeometry();
    this.buildPulseGeometry();

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    window.addEventListener('mousemove', this.onMouseMove);

    this.animate();
    return true;
  }

  /** Make the brain fire in a project's color: tint shift + pulse cascade. */
  excite(tint: RGB, burst = 12) {
    this.tintTarget = tint;
    this.exciteDecay = 1;
    this.seedRandomPulses(this.reduceMotion ? Math.min(burst, 4) : burst);
  }

  setIdle() {
    this.exciteDecay = 0;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    window.removeEventListener('mousemove', this.onMouseMove);
    this.nodeGeo?.dispose();
    this.pulseGeo?.dispose();
    this.renderer?.dispose();
  }

  // ─── internals ───────────────────────────────────────────────────────────

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  private resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    // Pull back on narrow containers so both lobes stay in frame
    this.camera.position.z = Math.max(8, 7.5 / Math.max(aspect, 0.4));
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    // Point sizes are pixel-based: scale to container height so the additive
    // glow doesn't blow out on small canvases (JARVIS tuned 300 for ~900px)
    const sizeScale = (height / 900) * 210;
    if (this.nodeMat) this.nodeMat.uniforms.uSizeScale.value = sizeScale;
    if (this.pulseMatRef) this.pulseMatRef.uniforms.uSizeScale.value = sizeScale;
  }

  private generateNodes() {
    for (let i = 0; i < this.nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.55 + 0.45 * Math.cbrt(Math.random());
      let x = r * Math.sin(phi) * Math.cos(theta) * ELLIPSOID.x;
      const y = r * Math.sin(phi) * Math.sin(theta) * ELLIPSOID.y;
      const z = r * Math.cos(phi) * ELLIPSOID.z;
      x += x < 0 ? -HEMI_GAP : HEMI_GAP;
      this.nodes.push({
        x, y, z,
        home: { x, y, z },
        activation: 0,
        drift: {
          x: (Math.random() - 0.5) * 0.0006,
          y: (Math.random() - 0.5) * 0.0006,
          z: (Math.random() - 0.5) * 0.0006,
        },
      });
    }
  }

  private dist(a: Node, b: Node) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  private buildEdges() {
    const seen = new Set<string>();
    this.adj = this.nodes.map(() => []);
    for (let i = 0; i < this.nodes.length; i++) {
      const cands: { j: number; d: number }[] = [];
      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue;
        const d = this.dist(this.nodes[i], this.nodes[j]);
        if (d <= MAX_EDGE_DIST) cands.push({ j, d });
      }
      cands.sort((p, q) => p.d - q.d);
      const k = Math.min(this.neighbors, cands.length);
      for (let c = 0; c < k; c++) {
        const j = cands[c].j;
        const key = i < j ? `${i}_${j}` : `${j}_${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const edgeIndex = this.edges.length;
        this.edges.push({ a: i, b: j, len: cands[c].d });
        this.adj[i].push(edgeIndex);
        this.adj[j].push(edgeIndex);
      }
    }
  }

  private buildNodeGeometry() {
    const N = this.nodes.length;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    this.nodeActivations = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      positions[i * 3] = this.nodes[i].x;
      positions[i * 3 + 1] = this.nodes[i].y;
      positions[i * 3 + 2] = this.nodes[i].z;
      // Base palette: mostly teal, some violet, occasional white highlight
      const t = Math.random();
      if (t < 0.65) {
        colors[i * 3] = 0.1 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.75 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.15;
      } else if (t < 0.9) {
        colors[i * 3] = 0.4 + Math.random() * 0.2;
        colors[i * 3 + 1] = 0.15 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else {
        colors[i * 3] = 0.85 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        colors[i * 3 + 2] = 1.0;
      }
      sizes[i] = Math.random() * 2.6 + 1.4;
    }

    this.nodeGeo = new THREE.BufferGeometry();
    this.nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.nodeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.nodeGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.nodeGeo.setAttribute('aActivation', new THREE.BufferAttribute(this.nodeActivations, 1));

    this.nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlobalActivity: { value: this.liveActivity },
        uTint: { value: new THREE.Color(...this.tintCurrent) },
        uTintAmount: { value: this.tintAmount },
        uSizeScale: { value: 200 },
      },
      vertexShader: `
        attribute float size;
        attribute float aActivation;
        varying vec3 vColor;
        varying float vGlow;
        uniform float uTime;
        uniform float uGlobalActivity;
        uniform float uSizeScale;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float idle = sin(uTime * 1.5 + position.x * 3.7 + position.y * 2.1) * 0.3 + 0.7;
          float fire = aActivation;
          vGlow = idle * 0.5 + fire + uGlobalActivity * 0.4;
          float boost = 1.0 + fire * 2.2 + uGlobalActivity * 0.6;
          gl_PointSize = size * boost * (uSizeScale / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        uniform vec3 uTint;
        uniform float uTintAmount;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.15, d);
          float glow = 1.0 - smoothstep(0.1, 0.5, d);
          float alpha = (core * 0.9 + glow * 0.35) * vGlow * 0.55;
          vec3 tinted = mix(vColor, uTint, uTintAmount);
          gl_FragColor = vec4(tinted, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.scene.add(new THREE.Points(this.nodeGeo, this.nodeMat));
  }

  private buildEdgeGeometry() {
    const edgePos = new Float32Array(this.edges.length * 2 * 3);
    const edgeCol = new Float32Array(this.edges.length * 2 * 3);
    for (let k = 0; k < this.edges.length; k++) {
      const a = this.nodes[this.edges[k].a];
      const b = this.nodes[this.edges[k].b];
      edgePos.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
      edgeCol.set([0.0, 0.32, 0.3, 0.25, 0.1, 0.45], k * 6);
    }
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeCol, 3));
    this.edgeMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: IDLE.edgeOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.LineSegments(edgeGeo, this.edgeMat));
  }

  private buildPulseGeometry() {
    this.pulsePositions = new Float32Array(this.maxPulses * 3);
    this.pulseSizes = new Float32Array(this.maxPulses);
    const pulseColors = new Float32Array(this.maxPulses * 3);
    for (let i = 0; i < this.maxPulses; i++) {
      this.pulsePositions[i * 3] = 9999;
      pulseColors[i * 3] = 0.6;
      pulseColors[i * 3 + 1] = 0.95;
      pulseColors[i * 3 + 2] = 1.0;
    }
    this.pulseGeo = new THREE.BufferGeometry();
    this.pulseGeo.setAttribute('position', new THREE.BufferAttribute(this.pulsePositions, 3));
    this.pulseGeo.setAttribute('size', new THREE.BufferAttribute(this.pulseSizes, 1));
    this.pulseGeo.setAttribute('color', new THREE.BufferAttribute(pulseColors, 3));
    const pulseMat = new THREE.ShaderMaterial({
      uniforms: { uTint: this.nodeMat.uniforms.uTint, uSizeScale: { value: 200 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uSizeScale;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (uSizeScale / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform vec3 uTint;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(mix(vColor, uTint, 0.4), a);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.pulseMatRef = pulseMat;
    this.scene.add(new THREE.Points(this.pulseGeo, pulseMat));
  }

  private spawnPulse(edgeIndex: number, fromNode: number) {
    if (this.livePulses.length >= this.maxPulses) return;
    const e = this.edges[edgeIndex];
    if (!e) return;
    const dir = fromNode === e.a ? 1 : -1;
    this.livePulses.push({ edge: edgeIndex, dir, t: 0, speed: 0.9 / Math.max(e.len, 0.3) });
  }

  private seedRandomPulses(count: number) {
    for (let c = 0; c < count; c++) {
      if (!this.edges.length) return;
      const node = (Math.random() * this.nodes.length) | 0;
      const list = this.adj[node];
      if (list && list.length) {
        this.spawnPulse(list[(Math.random() * list.length) | 0], node);
      }
    }
  }

  private updatePulses(delta: number) {
    const speedMul = this.target.pulseSpeed;
    const propagation = this.target.propagation;
    for (let i = 0; i < this.maxPulses; i++) this.pulseSizes[i] = 0;

    for (let p = this.livePulses.length - 1; p >= 0; p--) {
      const pulse = this.livePulses[p];
      pulse.t += pulse.speed * delta * speedMul;
      const e = this.edges[pulse.edge];
      const from = pulse.dir > 0 ? this.nodes[e.a] : this.nodes[e.b];
      const to = pulse.dir > 0 ? this.nodes[e.b] : this.nodes[e.a];
      const tt = Math.min(pulse.t, 1);
      const slot = p % this.maxPulses;
      this.pulsePositions[slot * 3] = from.x + (to.x - from.x) * tt;
      this.pulsePositions[slot * 3 + 1] = from.y + (to.y - from.y) * tt;
      this.pulsePositions[slot * 3 + 2] = from.z + (to.z - from.z) * tt;
      this.pulseSizes[slot] = 5.0;

      if (pulse.t >= 1) {
        const arrived = pulse.dir > 0 ? e.b : e.a;
        this.nodes[arrived].activation = Math.min(1, this.nodes[arrived].activation + 0.9);
        const list = this.adj[arrived];
        for (let n = 0; n < list.length; n++) {
          if (list[n] !== pulse.edge && Math.random() < propagation) {
            this.spawnPulse(list[n], arrived);
          }
        }
        this.livePulses.splice(p, 1);
      }
    }
    this.pulseGeo.attributes.position.needsUpdate = true;
    this.pulseGeo.attributes.size.needsUpdate = true;
  }

  private animate = () => {
    if (this.destroyed) return;
    this.rafId = requestAnimationFrame(this.animate);
    if (document.hidden) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.getElapsedTime();

    // Blend between idle and excited profiles as excitement decays
    this.exciteDecay = Math.max(0, this.exciteDecay - delta * 0.35);
    const k = this.exciteDecay;
    this.target = {
      activity: IDLE.activity + (EXCITED.activity - IDLE.activity) * k,
      pulseSpeed: IDLE.pulseSpeed + (EXCITED.pulseSpeed - IDLE.pulseSpeed) * k,
      seedRate: IDLE.seedRate + (EXCITED.seedRate - IDLE.seedRate) * k,
      propagation: IDLE.propagation + (EXCITED.propagation - IDLE.propagation) * k,
      edgeOpacity: IDLE.edgeOpacity + (EXCITED.edgeOpacity - IDLE.edgeOpacity) * k,
      tintAmount: IDLE.tintAmount + (EXCITED.tintAmount - IDLE.tintAmount) * k,
    };

    this.liveActivity += (this.target.activity - this.liveActivity) * delta * 3;
    this.edgeMat.opacity += (this.target.edgeOpacity - this.edgeMat.opacity) * delta * 3;
    this.tintAmount += (this.target.tintAmount - this.tintAmount) * delta * 2;
    for (let i = 0; i < 3; i++) {
      this.tintCurrent[i] += (this.tintTarget[i] - this.tintCurrent[i]) * delta * 2;
    }

    const u = this.nodeMat.uniforms;
    u.uTime.value = elapsed;
    u.uGlobalActivity.value = this.liveActivity;
    u.uTintAmount.value = this.tintAmount;
    (u.uTint.value as THREE.Color).setRGB(...this.tintCurrent);

    const seedRate = this.reduceMotion && this.exciteDecay === 0 ? 0 : this.target.seedRate;
    this.seedAccumulator += seedRate * delta;
    while (this.seedAccumulator >= 1) {
      this.seedRandomPulses(1);
      this.seedAccumulator -= 1;
    }

    this.updatePulses(delta);

    const pos = this.nodeGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.x += node.drift.x;
      node.y += node.drift.y;
      node.z += node.drift.z;
      node.drift.x -= (node.x - node.home.x) * 0.00004;
      node.drift.y -= (node.y - node.home.y) * 0.00004;
      node.drift.z -= (node.z - node.home.z) * 0.00004;
      node.activation *= 0.92;
      pos[i * 3] = node.x;
      pos[i * 3 + 1] = node.y;
      pos[i * 3 + 2] = node.z;
      this.nodeActivations[i] = node.activation;
    }
    this.nodeGeo.attributes.position.needsUpdate = true;
    this.nodeGeo.attributes.aActivation.needsUpdate = true;

    const cam = this.camera.position;
    cam.x += (this.mouse.x * 0.4 - cam.x) * delta * 1.5;
    cam.y += (this.mouse.y * 0.4 - cam.y) * delta * 1.5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };
}
