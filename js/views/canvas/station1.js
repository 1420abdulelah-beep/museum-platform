/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 1 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station1Renderer = {
  meshGroup: null,
  waterParticles: null,
  particleData: [],
  lasers: [],
  targetCoordinates: [],

  // Set up 3D mud gates, volumetric waterfall particle nodes, and laser lines
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);
    
    // Adjust camera perspective
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 2, 0);

    // 1. Build Mud Gateway (Procedural mud-brick styling)
    const mudMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033, // Clay brown
      roughness: 0.95,
      metalness: 0.02
    });

    // Left pillar
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 2.5), mudMaterial);
    leftPillar.position.set(-4.5, 3, 0);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    this.meshGroup.add(leftPillar);

    // Right pillar
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6, 2.5), mudMaterial);
    rightPillar.position.set(4.5, 3, 0);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    this.meshGroup.add(rightPillar);

    // Arch header beam
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 2.5), mudMaterial);
    archHeader.position.set(0, 5.8, 0);
    archHeader.castShadow = true;
    this.meshGroup.add(archHeader);

    // 2. Generate volumetric particle nodes for waterfall
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    this.particleData = [];
    this.generateCalligraphyTargets(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Waterfall source position (dripping from arch header)
      const px = -2.5 + Math.random() * 5.0;
      const py = 0.5 + Math.random() * 4.5;
      const pz = -0.5 + Math.random() * 1.0;
      
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      
      this.particleData.push({
        x: px,
        y: py,
        z: pz,
        speed: 0.04 + Math.random() * 0.05,
        originalX: px,
        originalZ: pz
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Glowing cyan/water color material
    const particleMat = new THREE.PointsMaterial({
      color: 0x00ebd4,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.waterParticles = new THREE.Points(geometry, particleMat);
    this.meshGroup.add(this.waterParticles);

    // 3. Draw crossing laser lines (DMX emitters)
    const laserMatCyan = new THREE.LineBasicMaterial({ color: 0x00ebd4, linewidth: 2 });
    const laserMatGold = new THREE.LineBasicMaterial({ color: 0xdfb15b, linewidth: 2 });

    const laserGeom1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.5, 4, 1.2),
      new THREE.Vector3(4.5, 1, -1.2)
    ]);
    const laserGeom2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.5, 1, 1.2),
      new THREE.Vector3(4.5, 4, -1.2)
    ]);
    
    const laser1 = new THREE.Line(laserGeom1, laserMatCyan);
    const laser2 = new THREE.Line(laserGeom2, laserMatGold);
    
    this.lasers = [laser1, laser2];
    this.lasers.forEach(l => {
      l.visible = false;
      this.meshGroup.add(l);
    });
  },

  // Synthesize letter coordinates mathematically (Hijazi look spelling 'سراج')
  generateCalligraphyTargets(count) {
    this.targetCoordinates = [];
    for (let i = 0; i < count; i++) {
      // Choose letter index (0 to 3)
      const letterIdx = Math.floor(Math.random() * 4);
      let tx = 0, ty = 0;
      
      if (letterIdx === 0) {
        // 'سـ' shape: sine wave curl
        const t = (i / count) * Math.PI * 4;
        tx = -2.0 + (i % 250) * 0.005;
        ty = 2.5 + Math.sin(t * 3) * 0.3 + Math.cos(t) * 0.15;
      } else if (letterIdx === 1) {
        // 'ر' shape: simple smooth arc
        const t = Math.random();
        tx = -0.5 + t * 0.8;
        ty = 2.4 - t * t * 0.9;
      } else if (letterIdx === 2) {
        // 'ا' shape: vertical line
        tx = 0.8;
        ty = 1.8 + Math.random() * 1.5;
      } else {
        // 'ج' shape: circular curve + top flat bar
        const r = 0.5 + Math.random() * 0.1;
        const angle = Math.random() * Math.PI * 1.5 - Math.PI / 4;
        tx = 2.0 + Math.cos(angle) * r;
        ty = 2.2 + Math.sin(angle) * r;
      }
      
      this.targetCoordinates.push({ x: tx, y: ty, z: 0.1 });
    }
  },

  // Render volumetric flow and morphing particle interpolation
  animate(scene, camera, canvas, state, mousePos, ticks) {
    if (!this.waterParticles) return;
    
    const flowVal = state.water_flow / 100;
    const laserVal = state.laser_intensity / 100;
    
    // Enable/disable laser line meshes
    this.lasers.forEach(l => {
      l.visible = laserVal > 0.15;
    });

    // Animate waterfall particles
    const positions = this.waterParticles.geometry.attributes.position.array;
    
    // Linear interpolation value: morph particles to calligraphy letters
    // Morphs dynamically as laser intensity rises or when hover wave completes
    const morphWeight = laserVal > 0.4 ? Math.min(1.0, (laserVal - 0.4) * 2.0) : 0.0;
    
    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];
      const target = this.targetCoordinates[i];
      
      // Update vertical drop speed
      p.y -= p.speed * (0.3 + flowVal * 0.7);
      if (p.y < 0.2) {
        p.y = 5.2; // reset to ceiling emitter
      }
      
      // Morph factor between waterfall state and calligraphy text state
      const currentX = THREE.MathUtils.lerp(p.originalX, target.x, morphWeight);
      const currentY = THREE.MathUtils.lerp(p.y, target.y, morphWeight);
      const currentZ = THREE.MathUtils.lerp(p.originalZ, target.z, morphWeight);
      
      positions[i * 3] = currentX;
      positions[i * 3 + 1] = currentY;
      positions[i * 3 + 2] = currentZ;
    }
    
    this.waterParticles.geometry.attributes.position.needsUpdate = true;
    
    // Sway the gateway slightly for ambient life
    this.meshGroup.rotation.y = Math.sin(ticks * 0.005) * 0.03;
  },

  // Destroy and release GPU resources
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.waterParticles = null;
      this.lasers = [];
    }
  }
};
