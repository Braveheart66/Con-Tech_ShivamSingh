"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const canUseWebGL =
      typeof window !== "undefined" &&
      !!(
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
      );

    if (!canUseWebGL) {
      setDisabled(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 6;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: "low-power"
      });
    } catch {
      // If WebGL context creation fails, keep app UI usable by disabling this visual layer.
      setDisabled(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const particleCount = 300;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.015,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    });

    const points = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(points);

    const applyResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        applyResize();
      }, 100);
    };

    applyResize();
    window.addEventListener("resize", handleResize, { passive: true });

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const positionArray = particlesGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i += 1) {
        const yIndex = i * 3 + 1;
        const xIndex = i * 3;

        positionArray[yIndex] += 0.001;
        positionArray[xIndex] += Math.sin(elapsed * 0.3 + i) * 0.0002;

        if (positionArray[yIndex] > 5) {
          positionArray[yIndex] = -5;
        }

        if (positionArray[xIndex] > 5) {
          positionArray[xIndex] = -5;
        }

        if (positionArray[xIndex] < -5) {
          positionArray[xIndex] = 5;
        }
      }

      particlesGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      window.removeEventListener("resize", handleResize);
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [disabled]);

  if (disabled) {
    return null;
  }

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[1] h-full w-full" aria-hidden />;
}
