import { useEffect, useRef } from "react";
import * as THREE from "three";

const SEPARATION = 110;
const COLUMNS = 72;
const ROWS = 28;
const AMPLITUDE = 62;
const WAVE_SPEED = 0.008;
const BASELINE_Y = -60;
const GRID_Z_CENTER = -500;
const CAMERA_Y = 320;
const CAMERA_Z = 1650;
const STATIC_PHASE = 12;

const createDotTexture = (color: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 30);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.4, color);
    gradient.addColorStop(1, `${color}00`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
};

export const useParticleWaves = (color: string) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / Math.max(container.clientHeight, 1),
      1,
      12000,
    );
    camera.position.set(0, CAMERA_Y, CAMERA_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const texture = createDotTexture(color);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const sprites: THREE.Sprite[] = [];
    for (let column = 0; column < COLUMNS; column++) {
      for (let row = 0; row < ROWS; row++) {
        const sprite = new THREE.Sprite(material);
        sprite.position.x = column * SEPARATION - (COLUMNS * SEPARATION) / 2 + SEPARATION / 2;
        sprite.position.z = row * SEPARATION - (ROWS * SEPARATION) / 2 + GRID_Z_CENTER;
        sprites.push(sprite);
        scene.add(sprite);
      }
    }

    camera.lookAt(0, BASELINE_Y, GRID_Z_CENTER);

    let phase = reduceMotion ? STATIC_PHASE : 0;
    let frame = 0;

    const positionWave = () => {
      let index = 0;
      for (let column = 0; column < COLUMNS; column++) {
        for (let row = 0; row < ROWS; row++) {
          const sprite = sprites[index];
          index += 1;
          if (!sprite) continue;
          const columnWave = Math.sin((column + phase) * 0.3);
          const rowWave = Math.sin((row + phase) * 0.5);
          sprite.position.y = BASELINE_Y + columnWave * AMPLITUDE + rowWave * AMPLITUDE;
          sprite.scale.setScalar(((columnWave + 1) * 2 + (rowWave + 1) * 2) * 2.4);
        }
      }
    };

    const renderFrame = () => {
      positionWave();
      renderer.render(scene, camera);
      phase += WAVE_SPEED;
    };

    renderFrame();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      renderFrame();
    };

    if (!reduceMotion) animate();

    const observer = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (reduceMotion) renderFrame();
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sprites.forEach((sprite) => scene.remove(sprite));
      material.dispose();
      texture.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [color]);

  return containerRef;
};
