/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 2 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station2Renderer = {
  meshGroup: null,
  sandPlane: null,
  caravanGroup: null,
  stepIndicator: null,
  raycaster: new THREE.Raycaster(),
  planeZ: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), // Flat ground plane

  // Set up 3D floor grids, sand geometry, procedural camels, and LiDAR spotlights
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    // Adjust camera perspective
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // 1. Grid Corridor (LED visual floor)
    const gridHelper = new THREE.GridHelper(20, 20, 0x00ebd4, 0x1a2130);
    gridHelper.position.y = -0.01;
    this.meshGroup.add(gridHelper);

    // 2. Sand Layer plane
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb15b, // Sand Gold
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85
    });

    const sandGeometry = new THREE.PlaneGeometry(16, 16, 40, 40);
    // Deform vertices to simulate sand dunes procedurally
    const pos = sandGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const duneZ = Math.sin(vx * 0.4) * 0.15 + Math.cos(vy * 0.4) * 0.15;
      pos.setZ(i, duneZ);
    }
    sandGeometry.computeVertexNormals();

    this.sandPlane = new THREE.Mesh(sandGeometry, sandMaterial);
    this.sandPlane.rotation.x = -Math.PI / 2; // Flat on ground
    this.sandPlane.receiveShadow = true;
    this.meshGroup.add(this.sandPlane);

    // 3. Procedural Camel Caravan
    this.caravanGroup = new THREE.Group();
    this.meshGroup.add(this.caravanGroup);

    const camelMat = new THREE.MeshStandardMaterial({
      color: 0x2b1e0f, // Dark wood silhouette style
      roughness: 0.8
    });

    for (let i = 0; i < 3; i++) {
      const camel = this.createCamelMesh(camelMat);
      camel.position.set(-6 + i * 2.8, 0.4, -2 + i * 0.5);
      camel.scale.set(0.65, 0.65, 0.65);
      this.caravanGroup.add(camel);
    }

    // 4. LiDAR Raycast Spot Light Highlight
    const lightGeom = new THREE.RingGeometry(0.1, 0.4, 32);
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0x00ebd4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.stepIndicator = new THREE.Mesh(lightGeom, lightMat);
    this.stepIndicator.rotation.x = -Math.PI / 2;
    this.stepIndicator.position.set(0, 0.15, 0);
    this.stepIndicator.visible = false;
    this.meshGroup.add(this.stepIndicator);
  },

  // Model a 3D camel procedurally using basic geometric primitives
  createCamelMesh(material) {
    const camelGroup = new THREE.Group();

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.5), material);
    body.position.y = 0.4;
    camelGroup.add(body);

    // Humps
    const hump1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.6, 4), material);
    hump1.position.set(-0.35, 1.0, 0);
    hump1.rotation.y = Math.PI / 4;
    camelGroup.add(hump1);

    const hump2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 4), material);
    hump2.position.set(0.3, 0.95, 0);
    hump2.rotation.y = Math.PI / 4;
    camelGroup.add(hump2);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), material);
    neck.position.set(0.7, 0.8, 0);
    neck.rotation.z = -Math.PI / 6;
    camelGroup.add(neck);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), material);
    head.position.set(0.9, 1.25, 0);
    camelGroup.add(head);

    // Legs (Four simple boxes)
    const legG = new THREE.BoxGeometry(0.12, 0.8, 0.12);
    const leg1 = new THREE.Mesh(legG, material); leg1.position.set(-0.5, -0.4, 0.18); camelGroup.add(leg1);
    const leg2 = new THREE.Mesh(legG, material); leg2.position.set(-0.5, -0.4, -0.18); camelGroup.add(leg2);
    const leg3 = new THREE.Mesh(legG, material); leg3.position.set(0.5, -0.4, 0.18); camelGroup.add(leg3);
    const leg4 = new THREE.Mesh(legG, material); leg4.position.set(0.5, -0.4, -0.18); camelGroup.add(leg4);

    return camelGroup;
  },

  // Animate caravan marching and perform real-time sand raycasting
  animate(scene, camera, canvas, state, mousePos, ticks) {
    if (!this.caravanGroup) return;

    // 1. Move Caravan
    const speed = 0.008;
    this.caravanGroup.children.forEach((c, idx) => {
      c.position.x += speed;
      // Leg swaying animation
      c.children.forEach(part => {
        if (part.geometry && part.geometry.type === "BoxGeometry" && part.position.y < 0) {
          // It's a leg, sway it based on index
          part.rotation.z = Math.sin(ticks * 0.05 + idx * Math.PI) * 0.25;
        }
      });
      
      // Loop caravans back
      if (c.position.x > 8) {
        c.position.x = -8;
      }
    });

    // 2. Adjust sand transparency depending on slider depth
    if (this.sandPlane) {
      this.sandPlane.material.opacity = (state.sand_depth / 100) * 0.95;
    }

    // 3. LiDAR cursor intersection tracking
    if (state.lidar_steps) {
      this.raycaster.setFromCamera(mousePos, camera);
      const intersects = this.raycaster.intersectObject(this.sandPlane);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.stepIndicator.position.set(point.x, 0.08, point.z);
        this.stepIndicator.visible = true;
        
        // Deform sand dynamically if clicking/brushing
        if (ticks % 3 === 0) {
          const geom = this.sandPlane.geometry;
          const pos = geom.attributes.position;
          
          for (let i = 0; i < pos.count; i++) {
            // Find world coordinates of vertex
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const dist = Math.sqrt((vx - point.x) * (vx - point.x) + (vy - (-point.z)) * (vy - (-point.z)));
            
            if (dist < 1.0) {
              const currentZ = pos.getZ(i);
              // push sand down slightly to create path
              pos.setZ(i, Math.max(-0.4, currentZ - 0.08 * (1.0 - dist)));
            }
          }
          pos.needsUpdate = true;
          geom.computeVertexNormals();
        }
      } else {
        this.stepIndicator.visible = false;
      }
    } else {
      this.stepIndicator.visible = false;
    }
  },

  // Release memory
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.sandPlane = null;
      this.caravanGroup = null;
      this.stepIndicator = null;
    }
  }
};
