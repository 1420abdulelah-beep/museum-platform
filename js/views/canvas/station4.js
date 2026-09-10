/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 4 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station4Renderer = {
  meshGroup: null,
  oledScreen: null,
  worshippers: [],
  clayArch: null,

  // Set up 3D clay columns, torus arch, transparent glass screens, and wireframe worshippers
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    // Adjust camera perspective
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1.8, 0);

    // Materials
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0x8d5c45, // Warm clay
      roughness: 0.9,
      metalness: 0.05
    });

    const oledGlassMat = new THREE.MeshStandardMaterial({
      color: 0x00ebd4,
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide
    });

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x00ebd4,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    // 1. Build Physical Clay Arches
    this.clayArch = new THREE.Group();
    this.meshGroup.add(this.clayArch);

    const pillarLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4, 16), clayMat);
    pillarLeft.position.set(-2.5, 2, 0);
    this.clayArch.add(pillarLeft);

    const pillarRight = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4, 16), clayMat);
    pillarRight.position.set(2.5, 2, 0);
    this.clayArch.add(pillarRight);

    // Torus arc connecting columns
    const arcTop = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.3, 12, 32, Math.PI), clayMat);
    arcTop.position.set(0, 4, 0);
    this.clayArch.add(arcTop);

    // 2. Build Transparent OLED Screen Plane
    this.oledScreen = new THREE.Group();
    this.meshGroup.add(this.oledScreen);

    // Glass panel
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.4), oledGlassMat);
    glass.position.set(0, 2, 0.5); // Placed slightly in front
    this.oledScreen.add(glass);

    // Bezel border frame
    const borderGeom = new THREE.BoxGeometry(5.3, 3.5, 0.08);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x0a101d, metalness: 0.8 });
    const bezel = new THREE.Mesh(borderGeom, borderMat);
    bezel.position.set(0, 2, 0.47);
    this.oledScreen.add(bezel);

    // 3. Build Wireframe Worshippers
    this.worshippers = [];
    const wPositions = [-1.5, 0, 1.5];

    wPositions.forEach((xOffset, idx) => {
      const worshipper = new THREE.Group();
      worshipper.position.set(xOffset, 0, -1); // Behind glass
      this.meshGroup.add(worshipper);

      // Body (Torso box)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.5), wireframeMat);
      body.position.y = 0.45;
      worshipper.add(body);

      // Head (Sphere)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), wireframeMat);
      head.position.set(0, 1.1, 0);
      worshipper.add(head);

      this.worshippers.push(worshipper);
    });
  },

  // Sway worshippers in bowing prayer poses and adjust AR opacity layers
  animate(scene, camera, canvas, state, mousePos, ticks) {
    if (!this.oledScreen) return;

    const transparencyVal = state.ar_transparency / 100;
    
    // Scale screen visibility
    this.oledScreen.children[0].material.opacity = transparencyVal * 0.15;
    
    // Adjust wireframe worshippers visibility
    this.worshippers.forEach((w, idx) => {
      w.children.forEach(child => {
        child.material.opacity = transparencyVal * 0.8;
      });

      // Bowing animation (Islamic prayer simulation: stand -> bow Ruku)
      const bowCycle = Math.sin(ticks * 0.02 + idx) * 0.5 + 0.5; // 0 to 1
      w.rotation.x = bowCycle * 0.65; // Bow angle
      w.position.y = -bowCycle * 0.3; // Sink slightly when bowing
    });

    // Ambient sway of camera or scene
    this.meshGroup.rotation.y = Math.sin(ticks * 0.005) * 0.04;
  },

  // Release memory
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.oledScreen = null;
      this.worshippers = [];
      this.clayArch = null;
    }
  }
};
