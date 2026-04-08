"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type WireData = {
  vertices: THREE.Vector3[];
  edges: Array<[number, number]>;
};

type OrbitParticle = {
  angle: number;
  orbitX: number;
  orbitY: number;
  speed: number;
  size: number;
  alpha: number;
  phase: number;
};

function createWireData(): WireData {
  const geometry = new THREE.IcosahedronGeometry(1.15, 2);
  const position = geometry.getAttribute("position");
  const vertices: THREE.Vector3[] = [];

  for (let i = 0; i < position.count; i += 1) {
    vertices.push(new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)));
  }

  const edgeSet = new Set<string>();
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    edgeSet.add(key);
  };

  if (geometry.index) {
    for (let i = 0; i < geometry.index.count; i += 3) {
      const a = geometry.index.getX(i);
      const b = geometry.index.getX(i + 1);
      const c = geometry.index.getX(i + 2);
      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, a);
    }
  }

  const edges: Array<[number, number]> = [];
  edgeSet.forEach((key) => {
    const [a, b] = key.split("-").map(Number);
    edges.push([a, b]);
  });

  geometry.dispose();
  return { vertices, edges };
}

function startCanvasFallback(container: HTMLDivElement, canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    return () => {};
  }

  const { vertices, edges } = createWireData();
  const particles: OrbitParticle[] = Array.from({ length: 220 }).map(() => ({
    angle: Math.random() * Math.PI * 2,
    orbitX: 150 + Math.random() * 180,
    orbitY: 90 + Math.random() * 130,
    speed: 0.0008 + Math.random() * 0.002,
    size: 0.9 + Math.random() * 1.6,
    alpha: 0.07 + Math.random() * 0.2,
    phase: Math.random() * Math.PI * 2
  }));

  const pointerTarget = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0 };

  const onPointerMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTarget.x = normalizedX;
    pointerTarget.y = normalizedY;
  };

  const onPointerLeave = () => {
    pointerTarget.x = 0;
    pointerTarget.y = 0;
  };

  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerleave", onPointerLeave);

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
  });

  resizeObserver.observe(container);
  resize();

  let rafId = 0;
  let disposed = false;

  const draw = (time: number) => {
    if (disposed) {
      return;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width * 0.5;
    const centerY = height * 0.58;
    const radius = Math.min(width, height) * 0.26;

    pointer.x += (pointerTarget.x - pointer.x) * 0.06;
    pointer.y += (pointerTarget.y - pointer.y) * 0.06;

    context.clearRect(0, 0, width, height);

    const glow = context.createRadialGradient(
      centerX,
      centerY,
      radius * 0.12,
      centerX,
      centerY,
      radius * 1.45
    );
    glow.addColorStop(0, "rgba(45,181,93,0.42)");
    glow.addColorStop(0.45, "rgba(240,180,41,0.2)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(centerX, centerY, radius * 1.45, 0, Math.PI * 2);
    context.fill();

    const rotation = new THREE.Euler(
      pointer.y * 0.2 + time * 0.00021,
      pointer.x * 0.26 + time * 0.00033,
      time * 0.00013
    );

    const projected = vertices.map((vertex) => {
      const transformed = vertex.clone().applyEuler(rotation);
      const depth = 3.15 + transformed.z;
      const scale = radius / depth;

      return {
        x: centerX + transformed.x * scale * radius,
        y: centerY + transformed.y * scale * radius,
        z: transformed.z
      };
    });

    context.lineWidth = 1;

    for (let i = 0; i < edges.length; i += 1) {
      const [fromIndex, toIndex] = edges[i];
      const from = projected[fromIndex];
      const to = projected[toIndex];

      const edgeAlpha = 0.06 + ((from.z + to.z + 2) / 4) * 0.3;
      context.strokeStyle = `rgba(240,180,41,${Math.max(0.04, Math.min(0.36, edgeAlpha))})`;

      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    context.strokeStyle = "rgba(240,180,41,0.2)";
    context.lineWidth = 1.3;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radius * 1.15,
      radius * 0.55,
      time * 0.00018,
      0,
      Math.PI * 2
    );
    context.stroke();

    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radius * 0.9,
      radius * 0.42,
      -time * 0.00022,
      0,
      Math.PI * 2
    );
    context.stroke();

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      particle.angle += particle.speed;
      const twinkle = 0.4 + 0.6 * Math.sin(time * 0.0013 + particle.phase);

      const px = centerX + Math.cos(particle.angle) * particle.orbitX;
      const py = centerY + Math.sin(particle.angle) * particle.orbitY;

      context.fillStyle = `rgba(240,180,41,${Math.max(0.04, particle.alpha * twinkle)})`;
      context.beginPath();
      context.arc(px, py, particle.size, 0, Math.PI * 2);
      context.fill();
    }

    rafId = window.requestAnimationFrame(draw);
  };

  rafId = window.requestAnimationFrame(draw);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerleave", onPointerLeave);
  };
}

export default function LegalOrb() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (useFallback) {
      return;
    }

    const container = containerRef.current;
    const canvas = webglCanvasRef.current;

    if (!container || !canvas) {
      return;
    }

    let disposed = false;

    const enableFallback = () => {
      if (!disposed) {
        setUseFallback(true);
      }
    };

    const canUseWebGL =
      typeof window !== "undefined" &&
      !!(
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
      );

    if (!canUseWebGL) {
      enableFallback();
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 4;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
      });
    } catch {
      enableFallback();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color("#F0B429"), 1.35, 12, 1.4);
    pointLight.position.set(2, 3, 1);
    scene.add(pointLight);

    const group = new THREE.Group();
    scene.add(group);

    const innerGeometry = new THREE.IcosahedronGeometry(1.02, 2);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0D1410"),
      emissive: new THREE.Color("#1A6B35"),
      emissiveIntensity: 0.28,
      roughness: 0.45,
      metalness: 0.1
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerMesh);

    const wireGeometry = new THREE.IcosahedronGeometry(1.24, 2);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#F0B429"),
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    group.add(wireMesh);

    const pointsGeometry = new THREE.BufferGeometry();
    const pointsCount = 800;
    const positions = new Float32Array(pointsCount * 3);

    for (let i = 0; i < pointsCount; i += 1) {
      const radius = 1.85 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#F0B429"),
      size: 0.022,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    group.add(pointsMesh);

    const parallaxTarget = new THREE.Vector2(0, 0);
    const parallaxCurrent = new THREE.Vector2(0, 0);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      parallaxTarget.set(normalizedX, normalizedY);
    };

    const handlePointerLeave = () => {
      parallaxTarget.set(0, 0);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };

    let resizeTimer: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        resize();
      }, 100);
    });

    resizeObserver.observe(container);
    resize();

    const clock = new THREE.Clock();
    let rafId = 0;

    const render = () => {
      if (disposed) {
        return;
      }

      const elapsed = clock.getElapsedTime();
      parallaxCurrent.lerp(parallaxTarget, 0.05);

      group.rotation.y += 0.001 + parallaxCurrent.x * 0.0006;
      group.rotation.x += 0.0005 + parallaxCurrent.y * 0.0004;
      wireMesh.rotation.x -= 0.00035;
      wireMesh.rotation.y -= 0.00055;

      innerMaterial.emissiveIntensity = 0.24 + Math.sin(elapsed * 1.9) * 0.11;
      pointsMesh.rotation.y -= 0.0007;
      pointsMesh.rotation.x += 0.0003;

      try {
        renderer.render(scene, camera);
      } catch {
        enableFallback();
        return;
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);

      innerGeometry.dispose();
      innerMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();

      renderer.dispose();
    };
  }, [useFallback]);

  useEffect(() => {
    if (!useFallback) {
      return;
    }

    const container = containerRef.current;
    const fallbackCanvas = fallbackCanvasRef.current;

    if (!container || !fallbackCanvas) {
      return;
    }

    return startCanvasFallback(container, fallbackCanvas);
  }, [useFallback]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
      <canvas
        ref={fallbackCanvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          useFallback ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <canvas
        ref={webglCanvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          useFallback ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />
    </div>
  );
}
