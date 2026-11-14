import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

function shadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.18)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function ResinObject() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      stage.classList.add("is-fallback");
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x0b0f14, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f14);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0.15, 8.4);
    camera.lookAt(0, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envTexture = pmrem.fromScene(environment, 0.04).texture;
    scene.environment = envTexture;

    const key = new THREE.DirectionalLight(0xd8fbfc, 2.8);
    key.position.set(4, 5.5, 5);
    const rim = new THREE.DirectionalLight(0x20c4c7, 2.2);
    rim.position.set(-5, -2.5, -4);
    const fill = new THREE.DirectionalLight(0xffffff, 1);
    fill.position.set(-3, 3, 4);
    scene.add(key, rim, fill);

    const geometry = new THREE.TorusKnotGeometry(1.42, 0.42, 280, 64, 2, 3);
    geometry.center();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xbdeef0,
      metalness: 0,
      roughness: 0.09,
      transmission: 1,
      thickness: 1.35,
      ior: 1.49,
      attenuationColor: new THREE.Color(0x0e6b72),
      attenuationDistance: 2.6,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      iridescence: 0.14,
      iridescenceIOR: 1.3,
      envMapIntensity: 1.35,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(0.86);
    mesh.rotation.set(-0.14, 0.5, 0.08);
    scene.add(mesh);

    const shadowMap = shadowTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 1.5),
      new THREE.MeshBasicMaterial({
        map: shadowMap,
        transparent: true,
        depthWrite: false,
        opacity: 0.8,
      }),
    );
    shadow.position.set(0.2, -1.7, -1.6);
    scene.add(shadow);

    let visible = false;
    let dragging = false;
    let rotY = 0.5;
    let rotX = -0.14;
    let spin = 0;
    let lastX = 0;
    let lastY = 0;
    let pointerX = 0;
    let pointerY = 0;

    const setSize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onPointerMove = (event) => {
      const rect = stage.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;

      if (dragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        rotY += dx * 0.008;
        rotX = Math.max(-0.9, Math.min(0.9, rotX + dy * 0.006));
        spin = dx * 0.0018;
        lastX = event.clientX;
        lastY = event.clientY;
      }
    };

    const onPointerDown = (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      stage.classList.add("is-dragging");
      stage.setPointerCapture?.(event.pointerId);
    };

    const onPointerUp = (event) => {
      dragging = false;
      stage.classList.remove("is-dragging");
      if (stage.hasPointerCapture?.(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerdown", onPointerDown, { passive: true });
    stage.addEventListener("pointerup", onPointerUp, { passive: true });
    stage.addEventListener("pointercancel", onPointerUp, { passive: true });
    stage.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const onContextLost = (event) => {
      event.preventDefault();
      stage.classList.add("is-fallback");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(stage);

    const resizer = new ResizeObserver(setSize);
    resizer.observe(stage);
    setSize();

    let frame = 0;
    let last = performance.now();

    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      if (!visible) {
        last = now;
        return;
      }

      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduce) {
        rotY += spin + delta * 0.2;
        spin *= 0.94;
      }

      mesh.rotation.y += (rotY - mesh.rotation.y) * 0.12;
      mesh.rotation.x += (rotX - mesh.rotation.x) * 0.12;
      mesh.position.x += (pointerX * 0.14 - mesh.position.x) * 0.05;
      mesh.position.y =
        (reduce ? 0 : Math.sin((now / 1000) * 0.7) * 0.055) - pointerY * 0.06;
      shadow.position.x = 0.2 + mesh.position.x * 0.6;

      renderer.render(scene, camera);
      canvas.classList.add("is-ready");
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      stage.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      shadow.geometry.dispose();
      shadow.material.map?.dispose();
      shadow.material.dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="resin-stage__canvas" aria-hidden="true" />;
}
