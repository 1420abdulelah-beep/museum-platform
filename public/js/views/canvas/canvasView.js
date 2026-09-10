/* ==========================================
   SERAJ AL-AHSA - THREE.JS WEBGL VIEW LAYER
   ========================================== */

window.App = window.App || {};

App.CanvasView = class {
  constructor(modelInstance) {
    this.model = modelInstance;
    this.canvas = document.getElementById("sim-canvas");
    this.container = document.getElementById("viewport-canvas-container");
    
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = {};
    
    // State variables
    this.animationFrameId = null;
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.ticks = 0;
    this.currentRenderer = null;
    
    this.initThreeEngine();
  }

  // Initialize Three.js context
  initThreeEngine() {
    // 1. Create Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04050a); // Deep dark heritage background
    
    // 2. Create Camera
    this.camera = new THREE.PerspectiveCamera(60, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 12);
    
    // 3. Create WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    
    // 4. Set Ambient Lighting
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.lights.ambient);
    
    // 5. Set Directional Gold Light Source
    this.lights.directional = new THREE.DirectionalLight(0xdfb15b, 0.85);
    this.lights.directional.position.set(5, 10, 5);
    this.lights.directional.castShadow = true;
    this.scene.add(this.lights.directional);
    
    // Resize triggers
    this.resize();
  }

  // Adjust camera aspect ratio and WebGL viewport dimensions on resize
  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height, false);
  }

  // Translate 2D window hover coordinate to normalized Three.js canvas coordinate
  trackMouseCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    // Normalize coordinates (-1 to +1) for Three.js raycasting
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // Clear previous Three.js geometries, materials, and group layers
  clearThreeScene() {
    // 1. Traverse and dispose children (excluding lights)
    const toRemove = [];
    this.scene.traverse((child) => {
      if (child.isMesh || child.isPoints || child.isLine) {
        toRemove.push(child);
      }
    });

    toRemove.forEach((obj) => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    // 2. Re-anchor base camera position
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.camera.rotation);
    this.camera.position.set(0, 5, 12);
    this.camera.lookAt(0, 0, 0);
  }

  // Set active sub-renderer and setup 3D layout
  setRenderer(stationRenderer) {
    if (this.currentRenderer && typeof this.currentRenderer.destroy === "function") {
      this.currentRenderer.destroy(this.scene);
    }
    
    this.clearThreeScene();
    
    this.currentRenderer = stationRenderer;
    if (this.currentRenderer && typeof this.currentRenderer.setup === "function") {
      this.currentRenderer.setup(this.scene, this.camera, this.canvas, this.model.state);
    }
  }

  // Central WebGL animation tick
  tick() {
    this.ticks++;
    
    if (this.currentRenderer && typeof this.currentRenderer.animate === "function") {
      this.currentRenderer.animate(this.scene, this.camera, this.canvas, this.model.state, this.mousePos, this.ticks);
    }
    
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  // Start anim cycles
  startAnimation() {
    if (!this.animationFrameId) {
      this.tick();
    }
  }

  // Stop cycles
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
};
