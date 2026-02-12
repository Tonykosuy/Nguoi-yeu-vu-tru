// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001); // Adds depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.enablePan = false;
orbitControls.minDistance = 10;
orbitControls.maxDistance = 100;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 100);
pointLight.position.set(0, 0, 0); // Sun is at center
scene.add(pointLight);

// Starfield
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
createStars();

// Love Particles (Romantic Touch)
function createLoveParticles() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const color1 = new THREE.Color(0xff0066); // Pink
    const color2 = new THREE.Color(0xff66aa); // Light Pink

    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 100; // Closer range
        const y = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        positions.push(x, y, z);

        const color = Math.random() > 0.5 ? color1 : color2;
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animate these particles in the loop if needed (adding to a global list for rotation)
    // For now, let them rotate with the scene or add subtle specific movement
    return particles;
}
const loveParticles = createLoveParticles();

// Sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Glow effect for Sun (simple sprite)
const spriteMaterial = new THREE.SpriteMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
});
const sunGlow = new THREE.Sprite(spriteMaterial);
sunGlow.scale.set(20, 20, 1.0);
sun.add(sunGlow);

// Planets
const planets = [];
const planetData = [
    { size: 1.2, color: 0xaa5555, distance: 10, speed: 0.01 }, // Mercury-ish
    { size: 2.0, color: 0xffaa00, distance: 15, speed: 0.008 }, // Venus-ish
    { size: 2.2, color: 0x00aaff, distance: 22, speed: 0.006 }, // Earth-ish
    { size: 1.5, color: 0xff3300, distance: 30, speed: 0.005 }, // Mars-ish
    { size: 4.0, color: 0xffcc88, distance: 45, speed: 0.002, hasRing: true }  // Jupiter/Saturn-ish
];

const draggableObjects = [];

function createPlanet(data) {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: data.color,
        shininess: 30,
        specular: 0x111111
    });
    const planet = new THREE.Mesh(geometry, material);

    // Initial random angle
    const angle = Math.random() * Math.PI * 2;
    planet.position.x = Math.cos(angle) * data.distance;
    planet.position.z = Math.sin(angle) * data.distance;

    // Store orbit data for animation (if not being dragged)
    planet.userData = {
        distance: data.distance,
        angle: angle,
        speed: data.speed,
        isDragging: false
    };

    // Add Ring if specified
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.4, data.size * 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffddaa,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    scene.add(planet);
    planets.push(planet);
    draggableObjects.push(planet);
}

planetData.forEach(createPlanet);

// Drag Controls
const dragControls = new THREE.DragControls(draggableObjects, camera, renderer.domElement);

dragControls.addEventListener('dragstart', function (event) {
    orbitControls.enabled = false; // Disable camera controls while dragging
    event.object.userData.isDragging = true;
    event.object.material.emissive.set(0x444444); // Highlight effect
});

dragControls.addEventListener('dragend', function (event) {
    orbitControls.enabled = true;
    event.object.userData.isDragging = false;
    event.object.material.emissive.set(0x000000);

    // Re-calculate angle/distance based on new position so orbit continues from there
    const dx = event.object.position.x;
    const dz = event.object.position.z;
    event.object.userData.distance = Math.sqrt(dx * dx + dz * dz);
    event.object.userData.angle = Math.atan2(dz, dx);
});

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate Sun
    sun.rotation.y += 0.002;

    // Orbit Planets
    planets.forEach(planet => {
        if (!planet.userData.isDragging) {
            planet.userData.angle += planet.userData.speed;
            planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
            planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;

            // Self-rotation
            planet.rotation.y += 0.01;
        }
    });

    // Subtle star rotation
    scene.rotation.y += 0.0002;

    // Rotate love particles slightly faster/differently for depth
    if (loveParticles) {
        loveParticles.rotation.y -= 0.0005;
        loveParticles.rotation.x += 0.0002;
    }

    // Twinkle stars (accessing the point cloud created earlier)
    // Note: We need a reference to the stars object. 
    // Since createStars() didn't save it to a variable accessible here, let's fix that structure or just rotate scene.
    // For now, scene rotation is good enough for movement.

    orbitControls.update();
    renderer.render(scene, camera);
}

animate();
