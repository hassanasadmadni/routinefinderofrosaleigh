// Real-time 3D background for "A day with Rosaleigh": the sky moves from
// sunrise to night as the visitor scrolls, the sun sets and the moon rises
// and stars appear. Loaded lazily, desktop only.
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";

interface Props {
  progress: MotionValue<number>;
}

/* Sky palette through the day: [progress, top colour, horizon colour] */
const SKY: [number, string, string][] = [
  [0.0, "#F3B9A2", "#FFE7D2"],
  [0.2, "#A9CFEF", "#FFF1DE"],
  [0.42, "#86BBE8", "#FBE6C9"],
  [0.52, "#4B4683", "#EFA07F"],
  [0.7, "#202857", "#56508C"],
  [1.0, "#0A0E24", "#1E244F"],
];

function sampleSky(p: number, top: THREE.Color, bottom: THREE.Color) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const [p0, t0, b0] = SKY[i]!;
    const [p1, t1, b1] = SKY[i + 1]!;
    if (p <= p1 || i === SKY.length - 2) {
      const k = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
      const e = k * k * (3 - 2 * k);
      top.set(t0).lerp(new THREE.Color(t1), e);
      bottom.set(b0).lerp(new THREE.Color(b1), e);
      return;
    }
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ── Sky dome ──────────────────────────────────────────────────────────── */

function Sky({ progress }: Props) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uTop: { value: new THREE.Color(SKY[0]![1]) },
          uBottom: { value: new THREE.Color(SKY[0]![2]) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying vec3 vPos;
          void main() {
            float h = smoothstep(-0.25, 0.75, vPos.y);
            vec3 col = mix(uBottom, uTop, h);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(() => {
    sampleSky(progress.get(), mat.uniforms.uTop!.value as THREE.Color, mat.uniforms.uBottom!.value as THREE.Color);
  });
  return (
    <mesh material={mat}>
      <sphereGeometry args={[60, 32, 16]} />
    </mesh>
  );
}

/* ── Stars (fade in at dusk) ───────────────────────────────────────────── */

function Stars({ progress }: Props) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * 0.9 + 0.05; // upper hemisphere mostly
      const r = 45;
      pos[i * 3] = r * Math.cos(u) * Math.sin(v * Math.PI * 0.5 + 0.3);
      pos[i * 3 + 1] = r * Math.cos(v * Math.PI * 0.5) * 0.9 - 4;
      pos[i * 3 + 2] = -Math.abs(r * Math.sin(u) * Math.sin(v * Math.PI * 0.5 + 0.3)) - 5;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const material = useMemo(
    () => new THREE.PointsMaterial({ color: "#ffffff", size: 0.14, transparent: true, opacity: 0, depthWrite: false }),
    [],
  );
  useFrame((state) => {
    const p = progress.get();
    material.opacity = smooth(0.55, 0.85, p) * (0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 1.3));
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.004;
  });
  return <points ref={ref} geometry={geometry} material={material} />;
}

/* ── Sun → moon ────────────────────────────────────────────────────────── */

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function Celestial({ progress }: Props) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.SpriteMaterial>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const tex = useMemo(glowTexture, []);
  const sun = useMemo(() => new THREE.Color("#FFD27A"), []);
  const moon = useMemo(() => new THREE.Color("#E9ECFF"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const p = progress.get();
    // Sun rises and sets over the first half; moon rises and crosses the second half.
    const day = p < 0.5;
    const t = day ? p / 0.5 : (p - 0.5) / 0.5;
    const x = THREE.MathUtils.lerp(-9, 9, t);
    const y = -3.2 + Math.sin(t * Math.PI) * 7.5;
    if (group.current) group.current.position.set(x, y, -18);
    const nightness = smooth(0.45, 0.6, p);
    tmp.copy(sun).lerp(moon, nightness);
    if (body.current) body.current.color.copy(tmp);
    if (glow.current) {
      glow.current.color.copy(tmp);
      glow.current.opacity = day ? 0.85 : 0.45;
    }
    if (light.current) {
      light.current.position.set(x, y + 2, -4);
      light.current.color.copy(tmp);
      light.current.intensity = day ? 2.2 : 0.9;
    }
  });

  return (
    <>
      <group ref={group}>
        <sprite scale={[9, 9, 1]}>
          <spriteMaterial ref={glow} map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <mesh>
          <sphereGeometry args={[1.25, 48, 24]} />
          <meshBasicMaterial ref={body} />
        </mesh>
      </group>
      <directionalLight ref={light} />
    </>
  );
}

/* ── Scene setup ───────────────────────────────────────────────────────── */

function Rig() {
  useFrame((state) => {
    const { camera, pointer } = state;
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -6);
  });
  return null;
}

function Ambient({ progress }: Props) {
  const ref = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = THREE.MathUtils.lerp(0.9, 0.35, smooth(0.45, 0.75, progress.get()));
  });
  return <ambientLight ref={ref} />;
}

export default function DayScene3D({ progress }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  // Only render frames while the section is on screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="absolute inset-0 transition-opacity duration-1000"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          setReady(true);
        }}
      >
        <Sky progress={progress} />
        <Stars progress={progress} />
        <Celestial progress={progress} />
        <Ambient progress={progress} />
        <Rig />
      </Canvas>
    </div>
  );
}
