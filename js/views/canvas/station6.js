/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 6 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station6Renderer = {
  meshGroup: null,
  domeScreen: null,
  starfield: null,
  starData: [],
  waterSplashGroup: null,

  // Set up 3D hemispherical dome, star particles, and 4D droplet overlays
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    // Adjust camera perspective (Placed right at the center of the dome theater)
    camera.position.set(0, 0, 0.1);
    camera.lookAt(0, 1, -2);

    // 1. Hemispherical Dome screen (wireframe style for high-tech feeling)
    const domeGeom = new THREE.SphereGeometry(8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0xdfb15b, // Gold vector lines
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    this.domeScreen = new THREE.Mesh(domeGeom, domeMat);
    this.domeScreen.rotation.x = -Math.PI / 2; // Face overhead
    this.meshGroup.add(this.domeScreen);

    // 2. Starfield particles for flight effect
    const starCount = 400;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    this.starData = [];

    for (let i = 0; i < starCount; i++) {
      // Spawn in a cone/box in front of camera
      const px = (Math.random() - 0.5) * 15;
      const py = (Math.random() - 0.5) * 15;
      const pz = -Math.random() * 20;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      this.starData.push({
        x: px,
        y: py,
        z: pz,
        speed: 0.05 + Math.random() * 0.1
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x00ebd4, // Cyan star speedlines
      size: 0.06,
      transparent: true,
      opacity: 0.8
    });
    this.starfield = new THREE.Points(geom, starMat);
    this.meshGroup.add(this.starfield);

    // 3. 4D Water Droplets splash group
    this.waterSplashGroup = new THREE.Group();
    this.meshGroup.add(this.waterSplashGroup);

    const dropMat = new THREE.MeshBasicMaterial({
      color: 0x50a0c8,
      transparent: true,
      opacity: 0.5
    });
    const dropGeom = new THREE.SphereGeometry(0.04, 8, 8);

    for (let i = 0; i < 20; i++) {
      const drop = new THREE.Mesh(dropGeom, dropMat);
      drop.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, -0.8);
      drop.scale.set(1.0, 1.5, 1.0); // teardrop look
      drop.visible = false;
      this.waterSplashGroup.add(drop);
    }
  },

  // Coordinate scroll flyby speeds, camera tilting, and haptic shaking offsets
  animate(scene, camera, canvas, state, mousePos, ticks) {
    if (!this.starfield) return;

    const windSpeedVal = state.wind_speed / 100;
    const hapticVal = state.haptic_shake / 100;

    // 1. Starfield warp speed simulation
    const positions = this.starfield.geometry.attributes.position.array;
    for (let i = 0; i < this.starData.length; i++) {
      const p = this.starData[i];
      // Adjust velocity using wind_speed slider
      p.z += p.speed * (0.3 + windSpeedVal * 2.2);
      
      // Reset if flypast completed
      if (p.z > 0.5) {
        p.z = -20;
        p.x = (Math.random() - 0.5) * 15;
        p.y = (Math.random() - 0.5) * 15;
      }

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    this.starfield.geometry.attributes.position.needsUpdate = true;

    // 2. Rotate dome grid overlay
    this.domeScreen.rotation.z = ticks * 0.001;

    // 3. Tilting camera looking coordinates based on mouse hover coordinates
    const targetRotX = mousePos.y * 0.45;
    const targetRotY = -mousePos.x * 0.65;
    
    // Damp/smooth rotation
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotX, 0.05);
    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotY, 0.05);

    // 4. Haptic vibration shakes displacement
    camera.position.set(0, 0, 0.1); // Reset base
    if (hapticVal > 0.05) {
      const shakeRange = hapticVal * 0.15;
      camera.position.x += (Math.random() - 0.5) * shakeRange;
      camera.position.y += (Math.random() - 0.5) * shakeRange;
      camera.position.z += (Math.random() - 0.5) * shakeRange;
    }

    // 5. 4D Water mist splash overlay
    this.waterSplashGroup.children.forEach(drop => {
      drop.visible = state.water_mist_4d;
      if (state.water_mist_4d) {
        // drip down
        drop.position.y -= 0.005;
        if (drop.position.y < -1.0) {
          drop.position.y = 1.0;
          drop.position.x = (Math.random() - 0.5) * 2;
        }
      }
    });
  },

  // Release memory
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.domeScreen = null;
      this.starfield = null;
      this.waterSplashGroup = null;
    }
  }
};
