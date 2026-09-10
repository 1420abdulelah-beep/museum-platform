/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 5 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station5Renderer = {
  meshGroup: null,
  palms: [],
  waterChannel: null,
  visitors: [],
  lightSource: null,

  // Set up 3D oasis meadow, Aflaj water channels, swaying palms, and thermal nodes mapping
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    // Adjust camera perspective
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 1.5, 0);

    // 1. Oasis ground meadow
    const groundGeom = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1d3a24, // Moss green
      roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.meshGroup.add(ground);

    // 2. Swaying Palm Trees
    this.palms = [];
    const palmPositions = [
      { x: -5, z: -3, scale: 0.9 },
      { x: -6.2, z: 2, scale: 1.15 },
      { x: 5, z: -4, scale: 1.0 },
      { x: 6, z: 1.5, scale: 1.05 }
    ];

    palmPositions.forEach((pos) => {
      const palm = this.createPalmTree();
      palm.position.set(pos.x, 0, pos.z);
      palm.scale.set(pos.scale, pos.scale, pos.scale);
      this.meshGroup.add(palm);
      this.palms.push(palm);
    });

    // 3. Flowing Aflaj Water Channel
    const waterGeom = new THREE.BoxGeometry(1.8, 0.1, 15);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x50a0c8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8
    });
    this.waterChannel = new THREE.Mesh(waterGeom, waterMat);
    this.waterChannel.position.set(0, 0.05, 0);
    this.meshGroup.add(this.waterChannel);

    // Channel stone banks
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4f473e, roughness: 0.8 });
    const bankL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 15), stoneMat);
    bankL.position.set(-1.05, 0.1, 0);
    this.meshGroup.add(bankL);

    const bankR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 15), stoneMat);
    bankR.position.set(1.05, 0.1, 0);
    this.meshGroup.add(bankR);

    // 4. Set dynamic directional sun light mapping
    this.lightSource = new THREE.DirectionalLight(0xffffff, 0.8);
    this.lightSource.position.set(2, 6, 4);
    this.meshGroup.add(this.lightSource);
  },

  // Model a 3D Palm tree Group (Cylinder trunk + Box leaf fronds)
  createPalmTree() {
    const palm = new THREE.Group();

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d3f2e, roughness: 0.9 });
    const trunkGeom = new THREE.CylinderGeometry(0.1, 0.18, 5, 8);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    palm.add(trunk);

    // Leaves crown
    const leaves = new THREE.Group();
    leaves.position.y = 5.0;
    palm.add(leaves);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a4a25, roughness: 0.8, side: THREE.DoubleSide });
    const leafGeom = new THREE.BoxGeometry(2.0, 0.02, 0.4);

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.position.set(Math.cos(angle) * 0.9, -0.2, Math.sin(angle) * 0.9);
      leaf.rotation.y = -angle;
      leaf.rotation.z = 0.25; // drooping angle
      leaves.add(leaf);
    }

    return palm;
  },

  // Animate daylight solar color cycles and floating visitor nodes
  animate(scene, camera, canvas, state, mousePos, ticks) {
    // 1. Palm trees swaying
    const sway = Math.sin(ticks * 0.02) * 0.05;
    this.palms.forEach((p, idx) => {
      const leaves = p.children[1];
      leaves.rotation.z = sway + (idx * 0.02);
      leaves.rotation.x = Math.cos(ticks * 0.02) * 0.03;
    });

    // 2. Water ripples texture simulation
    if (this.waterChannel) {
      this.waterChannel.position.y = 0.05 + Math.sin(ticks * 0.04) * 0.015;
    }

    // 3. Solar cycles light mapping (oasis_time)
    const time = state.oasis_time;
    let skyCol = new THREE.Color(0x0a1e12); // default night
    let sunCol = new THREE.Color(0x112233);
    let intensity = 0.2;

    if (time >= 6 && time < 10) {
      // Dawn/Sunrise Gold
      skyCol = new THREE.Color(0xeed2b3);
      sunCol = new THREE.Color(0xe8a77a);
      intensity = 0.75;
    } else if (time >= 10 && time < 16) {
      // Bright Noon
      skyCol = new THREE.Color(0x66a5ad);
      sunCol = new THREE.Color(0xffffff);
      intensity = 1.0;
    } else if (time >= 16 && time < 19) {
      // Golden Sunset
      skyCol = new THREE.Color(0xdf8a49);
      sunCol = new THREE.Color(0xd85a38);
      intensity = 0.85;
    }

    scene.background = skyCol;
    this.lightSource.color = sunCol;
    this.lightSource.intensity = intensity;

    // 4. Update thermal visitor spheres mapping
    const count = state.visitor_density;
    
    // Clean up extra nodes
    while (this.visitors.length > count) {
      const v = this.visitors.pop();
      this.meshGroup.remove(v);
      v.geometry.dispose();
      v.material.dispose();
    }
    
    // Add missing nodes
    const visMat = new THREE.MeshBasicMaterial({
      color: 0xdfb15b,
      transparent: true,
      opacity: 0.65
    });
    const visGeom = new THREE.SphereGeometry(0.16, 8, 8);
    
    while (this.visitors.length < count) {
      const v = new THREE.Mesh(visGeom, visMat);
      // Spawn random coords
      const seedX = (Math.random() - 0.5) * 12.0;
      const seedZ = (Math.random() - 0.5) * 12.0;
      v.position.set(seedX, 0.2, seedZ);
      this.meshGroup.add(v);
      this.visitors.push(v);
    }

    // Drift visitor spheres
    this.visitors.forEach((v, i) => {
      v.position.x += Math.sin(ticks * 0.01 + i) * 0.006;
      v.position.z += Math.cos(ticks * 0.015 + i) * 0.006;
      // Bounce gently
      v.position.y = 0.25 + Math.sin(ticks * 0.04 + i) * 0.05;
    });
  },

  // Release memory
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.palms = [];
      this.waterChannel = null;
      this.visitors = [];
      this.lightSource = null;
    }
  }
};
