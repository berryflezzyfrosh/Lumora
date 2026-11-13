import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LrGlyph } from '@/components/brand/LrMark';
import { createOrbitScene, ORBIT_REST_TIME } from '@/components/brand/orbitScene';

const LOGO_GLB_URL = `${import.meta.env.BASE_URL}models/lumora-logo.glb`;

type LrOrbitLogoProps = {
  className?: string;
};

export function LrOrbitLogo({ className = '' }: LrOrbitLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let orbit: ReturnType<typeof createOrbitScene> | null = null;
    let frame = 0;
    let disposed = false;
    const start = performance.now();

    const tick = (now: number) => {
      orbit?.render((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };

    const fit = () => {
      const { clientWidth: width, clientHeight: height } = container;
      if (!width || !height) return;
      renderer.setSize(width, height);
      orbit?.resize(width / height);
      if (reduceMotion && orbit) orbit.render(ORBIT_REST_TIME);
    };

    const observer = new ResizeObserver(fit);
    observer.observe(container);

    const loader = new GLTFLoader();
    loader.load(
      LOGO_GLB_URL,
      (gltf) => {
        if (disposed) return;
        orbit = createOrbitScene(renderer, gltf.scene);
        fit();
        if (!reduceMotion) {
          frame = requestAnimationFrame(tick);
        }
      },
      undefined,
      () => {
        if (!disposed) setLoadFailed(true);
      },
    );

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      orbit?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  if (webglFailed || loadFailed) {
    return <LrGlyph className={`w-full ${className}`} />;
  }

  return <div ref={containerRef} role="img" aria-label="LUMORA" className={`relative ${className}`} />;
}
