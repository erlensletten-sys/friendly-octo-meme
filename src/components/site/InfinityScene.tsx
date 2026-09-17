"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Bernoullis lemniskat - åttetallet - lagt ut i rommet med en liten vridning i
 * z, slik at sløyfa ikke er helt flat og kurven leser seg som 3D når den snurrer.
 */
class Lemniscate extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly size = 1) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const u = t * Math.PI * 2;
    const d = 1 + Math.sin(u) * Math.sin(u);
    return target.set(
      (Math.cos(u) / d) * this.size,
      ((Math.sin(u) * Math.cos(u)) / d) * this.size,
      Math.sin(u * 3) * 0.14 * this.size,
    );
  }
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * Røret er nesten mørkt i seg selv. Det som gjør det synlig er kanten mot
 * betrakteren (fresnel) og to lyspulser som løper rundt sløyfa i hver sin
 * retning og aldri når slutten - det er hele poenget med figuren.
 */
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    float along = vUv.x;

    vec3 base = mix(uA, uB, 0.5 + 0.5 * sin(along * 6.2831853 + 1.2));

    float facing = max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - facing, 2.6);

    float head = fract(along - uTime * 0.085);
    float tail = fract(along + uTime * 0.05 + 0.5);
    float pulse =
      smoothstep(0.045, 0.0, head) * 1.0 +
      smoothstep(0.10, 0.0, head) * 0.25 +
      smoothstep(0.03, 0.0, tail) * 0.55;

    float ribs = 0.5 + 0.5 * sin(along * 520.0);

    vec3 color = base * (0.14 + fresnel * 0.95);
    color += base * pulse * 2.2 + vec3(pulse) * 0.30;
    color *= 0.86 + ribs * 0.14;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function Loop({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uA: { value: new THREE.Color("#3ef0dc") },
      uB: { value: new THREE.Color("#8b5cf6") },
    }),
    [],
  );

  // Tett rør for selve lyset, og et grovere for wireframe-skallet rundt.
  const tube = useMemo(() => new THREE.TubeGeometry(new Lemniscate(2.55), 760, 0.052, 18, true), []);
  const shell = useMemo(() => new THREE.TubeGeometry(new Lemniscate(2.62), 150, 0.115, 6, true), []);

  const dust = useMemo(() => {
    const count = 1100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Jevnt fordelt i et kuleskall, ikke i en kube - da blir hjørnene tomme.
      const radius = 4.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useEffect(() => {
    return () => {
      tube.dispose();
      shell.dispose();
      dust.dispose();
    };
  }, [tube, shell, dust]);

  useEffect(() => {
    if (still) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [still]);

  useFrame((state, delta) => {
    if (still) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    const node = group.current;
    if (!node) return;

    node.rotation.y += delta * 0.11;
    // Musa vipper sløyfa litt, men trekkes alltid tilbake mot ro.
    node.rotation.x += (pointer.current.y * 0.22 - node.rotation.x) * Math.min(1, delta * 2.2);
    node.rotation.z += (pointer.current.x * 0.12 - node.rotation.z) * Math.min(1, delta * 2.2);
  });

  // Sløyfa skal ligge ved siden av teksten, ikke oppå den. På smale skjermer
  // er det ikke plass ved siden av, så da flyttes den ned i stedet.
  const [scale, position] =
    size.width < 760
      ? ([0.58, [0, -1.75, 0]] as const)
      : size.width < 1180
        ? ([0.76, [1.25, -0.45, 0]] as const)
        : ([0.9, [2.3, -0.3, 0]] as const);

  return (
    <group ref={group} scale={scale} position={[position[0], position[1], position[2]]}>
      <mesh geometry={tube}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>

      <mesh geometry={shell}>
        <meshBasicMaterial
          color="#3ef0dc"
          wireframe
          transparent
          opacity={0.07}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <points geometry={dust}>
        <pointsMaterial
          size={0.022}
          color="#7d8aa0"
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/** Enkel SVG-sløyfe for nettlesere uten WebGL, eller når bevegelse er skrudd av. */
function FlatLoop() {
  return (
    <svg viewBox="-3 -1.6 6 3.2" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="loop-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3ef0dc" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d={lemniscatePath()}
        fill="none"
        stroke="url(#loop-stroke)"
        strokeWidth="0.035"
        opacity="0.75"
      />
    </svg>
  );
}

function lemniscatePath(): string {
  const points: string[] = [];
  const curve = new Lemniscate(2.55);
  const target = new THREE.Vector3();
  for (let i = 0; i <= 240; i++) {
    curve.getPoint(i / 240, target);
    points.push(`${i === 0 ? "M" : "L"}${target.x.toFixed(3)},${(-target.y).toFixed(3)}`);
  }
  return points.join(" ") + " Z";
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export default function InfinityScene({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<"venter" | "3d" | "flat">("venter");
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(reduced.matches);
    const onChange = (event: MediaQueryListEvent) => setStill(event.matches);
    reduced.addEventListener("change", onChange);
    setReady(supportsWebGL() ? "3d" : "flat");
    return () => reduced.removeEventListener("change", onChange);
  }, []);

  // Slutter å tegne når scenen er scrollet ut av syne, så resten av siden
  // ikke betaler for en animasjon ingen ser.
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} className={className} aria-hidden>
      {ready === "3d" ? (
        <Canvas
          camera={{ position: [0, 0, 6.6], fov: 42 }}
          dpr={[1, 1.75]}
          frameloop={!visible || still ? "demand" : "always"}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Loop still={still} />
        </Canvas>
      ) : ready === "flat" ? (
        <FlatLoop />
      ) : null}
    </div>
  );
}
