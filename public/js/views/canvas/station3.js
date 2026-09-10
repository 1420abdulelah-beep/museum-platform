/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 3 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station3Renderer = {
  meshGroup: null,
  scrollGroup: null,
  spotlight: null,
  particles: null,
  particleData: [],
  soundwaveCone: null,

  // Set up 3D dark chamber, volumetric cone, floating particles, and rotating parchment
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    // Adjust camera perspective
    camera.position.set(0, 3, 7);
    camera.lookAt(0, 1.5, 0);

    // 1. Volumetric Spotlight Cone
    const coneGeom = new THREE.CylinderGeometry(0.3, 2.5, 6, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xdfb15b, // Gold light
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.spotlight = new THREE.Mesh(coneGeom, coneMat);
    this.spotlight.position.set(0, 3, 0);
    this.meshGroup.add(this.spotlight);

    // 2. Volumetric Floating Particles
    const count = 150;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.particleData = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.8;
      const px = Math.cos(angle) * r;
      const py = Math.random() * 5.0;
      const pz = Math.sin(angle) * r;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      this.particleData.push({
        angle,
        radius: r,
        speed: 0.005 + Math.random() * 0.01,
        y: py
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xdfb15b,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(geom, partMat);
    this.meshGroup.add(this.particles);

    // 3. 3D Scroll (Scroll backing + Left and Right rollers)
    this.scrollGroup = new THREE.Group();
    this.scrollGroup.position.set(0, 2.2, 0);
    this.meshGroup.add(this.scrollGroup);

    // Generate parchment texture on the fly
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const tCtx = textureCanvas.getContext('2d');
    
    tCtx.fillStyle = '#f2e6cf'; // Parchment beige
    tCtx.fillRect(0, 0, 512, 512);

    // Ink letter lines
    tCtx.strokeStyle = 'rgba(40, 20, 10, 0.7)';
    tCtx.lineWidth = 4;
    for (let y = 60; y < 450; y += 35) {
      tCtx.beginPath();
      tCtx.moveTo(60, y);
      tCtx.lineTo(452, y);
      tCtx.stroke();
    }

    // Red wax seal stamp
    tCtx.fillStyle = 'rgba(180, 30, 30, 0.85)';
    tCtx.beginPath();
    tCtx.arc(380, 420, 30, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.fillStyle = '#8b0000';
    tCtx.font = "bold 20px 'Cairo'";
    tCtx.fillText("سراج", 360, 427);

    const texture = new THREE.CanvasTexture(textureCanvas);
    const scrollMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    const scrollSheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), scrollMat);
    scrollSheet.castShadow = true;
    this.scrollGroup.add(scrollSheet);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.6 });
    const rollerGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 16);

    const leftRoller = new THREE.Mesh(rollerGeom, woodMat);
    leftRoller.position.set(-0.83, 0, 0);
    this.scrollGroup.add(leftRoller);

    const rightRoller = new THREE.Mesh(rollerGeom, woodMat);
    rightRoller.position.set(0.83, 0, 0);
    this.scrollGroup.add(rightRoller);

    // 4. Directional Soundwave indicator (focal cone)
    const waveConeGeom = new THREE.CylinderGeometry(0.01, 1.2, 5, 16, 1, true);
    const waveConeMat = new THREE.MeshBasicMaterial({
      color: 0x00ebd4,
      transparent: true,
      opacity: 0.08,
      wireframe: true
    });
    this.soundwaveCone = new THREE.Mesh(waveConeGeom, waveConeMat);
    this.soundwaveCone.position.set(0, 2.5, 0);
    this.meshGroup.add(this.soundwaveCone);
  },

  // Rotate hologram elements and updates volumetric variables
  animate(scene, camera, canvas, state, mousePos, ticks) {
    if (!this.scrollGroup) return;

    const speedVal = state.holo_speed / 100;
    
    // Rotate scroll
    this.scrollGroup.rotation.y += 0.01 * (0.2 + speedVal * 0.8);
    // Float scroll gently up and down
    this.scrollGroup.position.y = 2.2 + Math.sin(ticks * 0.03) * 0.12;

    // Adjust spotlight brightness
    this.spotlight.material.opacity = 0.05 + (speedVal * 0.15);

    // Volumetric particles updating
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];
      p.y += p.speed;
      if (p.y > 5.0) p.y = 0.0;
      
      p.angle += 0.005;
      positions[i * 3] = Math.cos(p.angle) * p.radius;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = Math.sin(p.angle) * p.radius;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // Adjust soundwave indicator focal width
    const focusVal = state.audio_isolation / 100;
    this.soundwaveCone.scale.x = 0.2 + focusVal * 1.5;
    this.soundwaveCone.scale.z = 0.2 + focusVal * 1.5;
    this.soundwaveCone.rotation.y = ticks * 0.01;
  },

  // Release memory
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.scrollGroup = null;
      this.spotlight = null;
      this.particles = null;
      this.soundwaveCone = null;
    }
  }
};
