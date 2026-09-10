/* ==========================================
   SERAJ AL-AHSA - CANVAS STATION 7 RENDERER
   ========================================== */

window.App = window.App || {};

App.Station7Renderer = {
  meshGroup: null,
  table: null,
  books: [],
  nfcReader: null,

  // Set up 3D research bench, nfc pad geometry, and interactive books
  setup(scene, camera, canvas, state) {
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);

    // Adjust camera perspective
    camera.position.set(0, 3.5, 6);
    camera.lookAt(0, 1.0, 0);

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x241d17, roughness: 0.7 });
    const metallicMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.85, roughness: 0.1 });

    // 1. Build 3D Study Table Bench
    this.table = new THREE.Group();
    this.meshGroup.add(this.table);

    // Tabletop board
    const board = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.15, 3.2), woodMat);
    board.position.y = 1.2;
    board.castShadow = true;
    board.receiveShadow = true;
    this.table.add(board);

    // Table steel legs
    const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 12);
    const legPositions = [
      { x: -2.3, z: -1.4 },
      { x: -2.3, z: 1.4 },
      { x: 2.3, z: -1.4 },
      { x: 2.3, z: 1.4 }
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeom, metallicMat);
      leg.position.set(pos.x, 0.6, pos.z);
      this.table.add(leg);
    });

    // 2. Build Pulsing NFC Scanner Disc
    const discGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xdfb15b, // gold base
      side: THREE.DoubleSide
    });
    this.nfcReader = new THREE.Mesh(discGeom, discMat);
    this.nfcReader.position.set(0, 1.295, 1.0); // Placed on tabletop
    this.table.add(this.nfcReader);

    // 3. Build Clickable 3D Books
    this.books = [];
    const bookColors = [0xcc3333, 0x3366cc, 0x33cc66]; // Red, Blue, Green book covers
    const bookXOffsets = [-1.4, 0, 1.4];

    for (let i = 0; i < 3; i++) {
      const book = new THREE.Group();
      book.position.set(bookXOffsets[i], 1.28, -0.4);
      book.name = `book_${i}`;
      this.table.add(book);

      // Book cover geometry
      const coverMat = new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.8 });
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.0), coverMat);
      cover.castShadow = true;
      book.add(cover);

      // Book pages geometry (white paper edge)
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.96), pageMat);
      pages.position.set(0, 0, 0.02);
      book.add(pages);

      this.books.push(book);
    }
  },

  // Bounce selected book models and animate NFC scanner indicator glow
  animate(scene, camera, canvas, state, mousePos, ticks) {
    if (!this.table) return;

    // 1. Animate books hovering based on selection states in Model
    // We check Window.App.modelInstance.booksSelection to match state
    const selection = window.App.modelInstance ? window.App.modelInstance.booksSelection : [true, false, true];

    this.books.forEach((book, idx) => {
      const isSelected = selection[idx];
      
      let targetY = 1.28;
      let targetRotX = 0;
      let targetRotY = 0;
      
      if (isSelected) {
        // Rise and tilt book if selected
        targetY = 1.55 + Math.sin(ticks * 0.04 + idx) * 0.08;
        targetRotX = 0.2;
        targetRotY = Math.sin(ticks * 0.02) * 0.15;
      }
      
      book.position.y = THREE.MathUtils.lerp(book.position.y, targetY, 0.08);
      book.rotation.x = THREE.MathUtils.lerp(book.rotation.x, targetRotX, 0.08);
      book.rotation.y = THREE.MathUtils.lerp(book.rotation.y, targetRotY, 0.08);
    });

    // 2. Pulse NFC reader scanner pad
    if (state.nfc_linked) {
      this.nfcReader.material.color.setHex(0x00ebd4); // Cyan connected color
      const scaleVal = 1.0 + Math.sin(ticks * 0.1) * 0.06;
      this.nfcReader.scale.set(scaleVal, 1, scaleVal);
    } else {
      this.nfcReader.material.color.setHex(0xdfb15b); // Gold standby color
      this.nfcReader.scale.set(1, 1, 1);
    }

    // Sway scene view slightly
    this.meshGroup.rotation.y = Math.sin(ticks * 0.003) * 0.02;
  },

  // Release memory
  destroy(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup = null;
      this.table = null;
      this.books = [];
      this.nfcReader = null;
    }
  }
};
