"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BootLine } from "@/lib/site/content/types";
import { INTRO_SESSION_KEY } from "@/lib/site/intro";
import { ScreenTexture } from "./ScreenTexture";
import { useSite } from "./SiteContext";

const DURATION = 6.4; // sekunder fra første bilde til sida er framme

/* ------------------------------------------------------------------ scenen */

const SCREEN_CENTER = new THREE.Vector3(0, 1.3, -0.3);
const FIGURE_CENTER = new THREE.Vector3(0, 1.12, 0.35);

/**
 * Kamerabanen: bak og over høyre skulder, forbi hetta på høyre side, og så inn
 * foran ansiktet mot skjermen. Hetta står i (0, 1.42, 0.53) med radius ~0.2,
 * så banen må holde seg utenfor den - ellers fyller den bildet i det kameraet
 * skal stupe inn i navnet.
 */
const PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(1.75, 2.1, 3.7),
    new THREE.Vector3(0.95, 1.78, 2.25),
    new THREE.Vector3(0.5, 1.5, 1.15),
    new THREE.Vector3(0.4, 1.34, 0.6),
    new THREE.Vector3(0.08, 1.3, 0.3),
  ],
  false,
  "catmullrom",
  0.4,
);

/**
 * Kameraet driver sakte framover hele tida, men det meste av veien tas i den
 * siste tredjedelen - som en kamerakran som sakte finner fart før den
 * stuper inn i skjermen. Ved t = 0,5 er vi bare 20 % inn på banen.
 */
function easeCamera(t: number) {
  return 0.12 * t + 0.88 * Math.pow(t, 2.6);
}

function Rig({
  progress,
  start,
  onFirstFrame,
}: {
  progress: React.MutableRefObject<number>;
  start: React.MutableRefObject<number | null>;
  onFirstFrame: () => void;
}) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    // Klokka starter først når scenen faktisk tegner. Da spiser ikke
    // shader-kompilering og lasting av de første sekundene.
    if (start.current === null) {
      start.current = performance.now();
      onFirstFrame();
    }
    // Klemmes før kurven: rAF-klokka kan ligge noen ms bak performance.now()
    // i det første bildet, og et negativt tall opphøyd i 2,6 blir NaN - som
    // får kurveoppslaget til å krasje.
    const t = easeCamera(THREE.MathUtils.clamp(progress.current, 0, 1));
    PATH.getPointAt(t, pos);
    camera.position.copy(pos);
    // Blikket glir fra figuren over på skjermen.
    target.lerpVectors(FIGURE_CENTER, SCREEN_CENTER, THREE.MathUtils.smoothstep(t, 0.15, 0.7));
    camera.lookAt(target);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(46, 36, THREE.MathUtils.smoothstep(t, 0.4, 1));
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

const dark = { color: "#0a0d13", roughness: 0.92, metalness: 0.05 } as const;

function Figure() {
  return (
    <group position={[0, 0, 0.55]}>
      {/* Stol */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.56, 0.06, 0.52]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 0.98, 0.26]}>
        <boxGeometry args={[0.54, 0.7, 0.07]} />
        <meshStandardMaterial color="#080a0f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 12]} />
        <meshStandardMaterial color="#141924" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Kropp - overkropp, skuldre, hette. Sett bakfra er silhuetten det som teller. */}
      <mesh position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.2, 0.42, 6, 18]} />
        <meshStandardMaterial color="#0c1018" roughness={0.98} />
      </mesh>
      <mesh position={[-0.25, 1.17, 0.02]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial color="#0c1018" roughness={0.98} />
      </mesh>
      <mesh position={[0.25, 1.17, 0.02]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshStandardMaterial color="#0c1018" roughness={0.98} />
      </mesh>
      {/* Hetta: litt framoverbøyd, med en tydelig kant bakerst */}
      <group position={[0, 1.42, -0.02]} rotation={[0.18, 0, 0]}>
        <mesh scale={[1, 1.14, 1.06]}>
          <sphereGeometry args={[0.175, 28, 28]} />
          <meshStandardMaterial color="#0d1119" roughness={1} />
        </mesh>
        <mesh position={[0, -0.05, 0.11]} rotation={[0.35, 0, 0]}>
          <torusGeometry args={[0.16, 0.035, 12, 32, Math.PI]} />
          <meshStandardMaterial color="#0d1119" roughness={1} />
        </mesh>
      </group>
      {/* Armer mot tastaturet */}
      <mesh position={[-0.26, 0.98, -0.2]} rotation={[1.15, 0, 0.15]}>
        <capsuleGeometry args={[0.055, 0.34, 4, 12]} />
        <meshStandardMaterial color="#0c1018" roughness={0.98} />
      </mesh>
      <mesh position={[0.26, 0.98, -0.2]} rotation={[1.15, 0, -0.15]}>
        <capsuleGeometry args={[0.055, 0.34, 4, 12]} />
        <meshStandardMaterial color="#0c1018" roughness={0.98} />
      </mesh>
    </group>
  );
}

function Room({ screen }: { screen: ScreenTexture }) {
  return (
    <group>
      {/* Gulv og bakvegg - nesten svarte, tar bare imot lyset fra skjermen. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#05070a" roughness={0.75} metalness={0.15} />
      </mesh>
      <mesh position={[0, 2, -1.6]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#05070a" roughness={1} />
      </mesh>

      {/* Bord */}
      <mesh position={[0, 0.72, -0.2]} receiveShadow>
        <boxGeometry args={[2.6, 0.05, 0.95]} />
        <meshStandardMaterial color="#0b0e14" roughness={0.6} metalness={0.2} />
      </mesh>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.36, -0.2]}>
          <boxGeometry args={[0.05, 0.72, 0.85]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}

      {/* Tastatur og mus */}
      <mesh position={[0, 0.755, 0.12]}>
        <boxGeometry args={[0.56, 0.018, 0.19]} />
        <meshStandardMaterial color="#10141c" roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 0.755, 0.12]}>
        <capsuleGeometry args={[0.03, 0.06, 4, 12]} />
        <meshStandardMaterial color="#10141c" roughness={0.8} />
      </mesh>

      {/* Skjerm: fot, ramme og selve flaten med terminalen på */}
      <mesh position={[0, 0.78, -0.34]}>
        <cylinderGeometry args={[0.16, 0.2, 0.03, 24]} />
        <meshStandardMaterial color="#10141c" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, -0.36]}>
        <cylinderGeometry args={[0.03, 0.03, 0.24, 12]} />
        <meshStandardMaterial color="#10141c" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, -0.32]}>
        <boxGeometry args={[1.32, 0.76, 0.035]} />
        <meshStandardMaterial color="#0e121a" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* fog={false}: skjermen er lyskilden i rommet og skal være lesbar fra
          første bilde, også når kameraet står langt unna. */}
      <mesh position={SCREEN_CENTER}>
        <planeGeometry args={[1.2, 0.675]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} fog={false} />
      </mesh>
      {/* Glød fra skjermen. Bloom tar det herfra. */}
      <mesh position={[0, 1.3, -0.301]}>
        <planeGeometry args={[1.2, 0.675]} />
        <meshBasicMaterial color="#3ef0dc" transparent opacity={0.08} toneMapped={false} fog={false} />
      </mesh>

      <pointLight position={[0, 1.32, 0.05]} color="#7ff0e4" intensity={7} distance={4.5} decay={2} castShadow />
      <pointLight position={[-1.8, 1.7, 1.2]} color="#8b5cf6" intensity={1.4} distance={6} decay={2} />
      <ambientLight intensity={0.08} />
      <fog attach="fog" args={["#05070a", 5.5, 12]} />
    </group>
  );
}

function Dust() {
  const geometry = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = Math.random() * 2.4;
      positions[i * 3 + 2] = (Math.random() - 0.3) * 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.009} color="#9fb0c4" transparent opacity={0.28} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Scene({
  progress,
  start,
  screen,
  bootLines,
  onFirstFrame,
}: {
  progress: React.MutableRefObject<number>;
  start: React.MutableRefObject<number | null>;
  screen: ScreenTexture;
  bootLines: BootLine[];
  onFirstFrame: () => void;
}) {
  // Terminalen skriver seg mens kameraet kjører inn.
  useFrame((state) => {
    const elapsed = progress.current * DURATION;
    const typed = Math.min(screen.commandLength, Math.floor(Math.max(0, elapsed - 0.5) / 0.045));
    // Én linje mer enn det finnes, og skjermen ryddes for navnet alene -
    // det er det kameraet stuper inn i.
    const lines = Math.min(bootLines.length + 1, Math.floor(Math.max(0, elapsed - 1.9) / 0.28));
    screen.draw(typed, lines, state.clock.elapsedTime);
  });

  return (
    <>
      <Rig progress={progress} start={start} onFirstFrame={onFirstFrame} />
      <Room screen={screen} />
      <Figure />
      <Dust />
      <EffectComposer>
        <Bloom luminanceThreshold={0.55} luminanceSmoothing={0.2} intensity={1.15} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

/* --------------------------------------------------------------- overlegget */

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

/**
 * Åpningen. Et mørkt rom, en skikkelse med hetta mot oss, og en skjerm som
 * lyser opp ryggen hans. Kameraet kjører over skulderen og inn i skjermen -
 * og det som står på skjermen er sida du er på vei inn på.
 */
export default function CinematicIntro({ hold = false }: { hold?: boolean }) {
  const { t } = useSite();
  const reduced = useReducedMotion();
  const [state, setState] = useState<"ukjent" | "kjører" | "ferdig">("ukjent");
  const [fading, setFading] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const onFirstFrame = useCallback(() => setDrawn(true), []);
  const progress = useRef(0);
  const start = useRef<number | null>(null);
  const screen = useMemo(
    () => (typeof document !== "undefined" ? new ScreenTexture(t.brand, t.bootLines) : null),
    [t],
  );

  useEffect(() => {
    // Språkvalget vises først. Til det er gjort, gjør vi ingenting.
    if (hold) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
    } catch {
      /* privat modus */
    }
    setState(seen || reduced || !supportsWebGL() ? "ferdig" : "kjører");
  }, [reduced, hold]);

  const finish = useCallback(() => {
    setFading(true);
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      /* ignorert */
    }
    window.setTimeout(() => setState("ferdig"), 700);
  }, []);

  // Klokka som driver hele sekvensen. Den siste biten er selve overgangen.
  useEffect(() => {
    if (state !== "kjører") return;
    let raf = 0;
    const tick = (now: number) => {
      if (start.current === null) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = (now - start.current) / 1000 / DURATION;
      progress.current = Math.min(1, t);
      if (t >= 0.9 && !fading) finish();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, fading, finish]);

  useEffect(() => {
    if (state !== "kjører") return;
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      document.body.style.overflow = "";
    };
  }, [state, finish]);

  useEffect(() => () => screen?.dispose(), [screen]);

  return (
    <AnimatePresence>
      {state === "kjører" && screen && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[80] bg-ink-950"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden
        >
          <Canvas
            camera={{ position: [1.75, 2.1, 3.7], fov: 46, near: 0.05, far: 30 }}
            dpr={[1, 1.5]}
            shadows="percentage"
            gl={{ antialias: false, powerPreference: "high-performance" }}
            // Lys og møbler står stille - det er bare kameraet som beveger seg,
            // og skygger avhenger ikke av kameraet. Punktlyset ville ellers
            // tegnet seks skyggekart i hvert eneste bilde.
            onCreated={({ gl }) => {
              gl.shadowMap.autoUpdate = false;
              gl.shadowMap.needsUpdate = true;
            }}
          >
            <color attach="background" args={["#05070a"]} />
            <Scene progress={progress} start={start} screen={screen} bootLines={t.bootLines} onFirstFrame={onFirstFrame} />
          </Canvas>

          {/* Samme markør som plassholderen viste, til scenen har tegnet sitt
              første bilde. Shader-kompilering kan ta et sekund på svak maskin,
              og da skal det ikke være svart. */}
          <motion.p
            initial={{ opacity: 1 }}
            animate={{ opacity: drawn ? 0 : 1 }}
            transition={{ duration: 0.35 }}
            className="mono pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[13px] text-mist-300"
          >
            <span className="text-[color:var(--color-loop-a)]">$ </span>
            <span className="caret" />
          </motion.p>

          {/* Hvit blits i det kameraet går gjennom skjermen. */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[color:var(--color-loop-a)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: fading ? [0, 0.55, 0] : 0 }}
            transition={{ duration: 0.7, times: [0, 0.35, 1] }}
          />

          <p className="mono absolute inset-x-0 bottom-6 text-center text-[11px] text-mist-400">
            {t.intro.skip}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
