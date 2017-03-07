var THREE = require('three');
var OBJLoader = require('three-obj-loader');
var OrbitControls = require('three-orbit-controls-loader');
var Promise = require('bluebird');
var $ = require('jquery');
var _ = require('lodash');
var Detector = require('./assets/js/Detector.js');

const Prizm3D = {
    scene: undefined,
    renderer: undefined,
    camera: undefined,
    controls: undefined,
    container: undefined,
    objLoader: undefined,
    manager: undefined,
    imgLoader: undefined,
    objLoader: undefined,
    pasPath: undefined,
    comments: [],
    init: (pasPath) => {
        //Activate Three.js extensions
        OBJLoader(THREE);
        OrbitControls(THREE);

        //Initialize file loaders
        Prizm3D.manager = new THREE.LoadingManager();
        Prizm3D.imgLoader = new THREE.ImageLoader(Prizm3D.manager);
        Prizm3D.objLoader = new THREE.OBJLoader(Prizm3D.manager);

        Prizm3D.pasPath = pasPath;

        var windowHalfX = window.innerWidth / 2;
        var windowHalfY = window.innerHeight / 2;

        //Initialize the renderer
        Prizm3D.renderer = Detector.webgl? new THREE.WebGLRenderer(): new THREE.CanvasRenderer();
        Prizm3D.renderer.lighting = true;
        Prizm3D.renderer.setPixelRatio(window.devicePixelRatio);
        Prizm3D.renderer.setSize(window.innerWidth, window.innerHeight);
        Prizm3D.renderer.setClearColor(new THREE.Color("hsl(0, 0%, 10%)"));
        Prizm3D.renderer.shadowMap.enabled = true;
        Prizm3D.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        Prizm3D.renderer.shadowMap.enabled = true;

        Prizm3D.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        Prizm3D.camera.position.x = 300;
        Prizm3D.camera.position.y = 300;
        Prizm3D.camera.position.z = 300;

        Prizm3D.scene = new THREE.Scene();

        Prizm3D.controls = new THREE.OrbitControls(Prizm3D.camera, Prizm3D.renderer.domElement);
        Prizm3D.controls.enableDamping = true;
        Prizm3D.controls.dampingFactor = 0.25;
        Prizm3D.controls.enableZoom = true;

        const ambient = new THREE.AmbientLight(new THREE.Color(0.3, 0.3, 0.3));
        Prizm3D.scene.add(ambient);

        document.body.style.margin = 0;
        Prizm3D.container = document.createElement('div');
        Prizm3D.container.appendChild(Prizm3D.renderer.domElement);
        document.body.appendChild(Prizm3D.container);

        window.addEventListener('resize', Prizm3D.onWindowResize, false);

        Prizm3D.animate();

        Prizm3D.addComment();
    },

    onWindowResize: () => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        Prizm3D.camera.aspect = window.innerWidth / window.innerHeight;
        Prizm3D.camera.updateProjectionMatrix();
        Prizm3D.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate: () => {
        requestAnimationFrame(Prizm3D.animate);
        Prizm3D.controls.update();
        Prizm3D.render();
    },

    render: () => {
        Prizm3D.comments.forEach((comment) => {
            comment.lookAt(Prizm3D.camera.position);
        });
        Prizm3D.renderer.render(Prizm3D.scene, Prizm3D.camera);
    },

    clearScene: () => {
        Prizm3D.scene.children = [];
        return Prizm3D.scene;
    },

    addComment: () => {
        var intersection = {
            intersects: false,
            point: new THREE.Vector3(),
            normal: new THREE.Vector3()
        };
        var mouse = new THREE.Vector2();

        //var mouseHelper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
        //mouseHelper.visible = false;
        //Prizm3D.scene.add(mouseHelper);
        /*window.addEventListener('resize', Prizm3D.onWindowResize, false);
        var moved = false;
        Prizm3D.controls.addEventListener('change', function() {
            moved = true;
        });
        */
        window.addEventListener('mousedown', function() {
            const intersections = getRayIntersections();
            if(intersections.length > 0) {
                // create a canvas element
            	var canvas1 = document.createElement('canvas');
            	var context1 = canvas1.getContext('2d');
            	context1.font = "Bold 20px Arial";
            	context1.fillStyle = "rgba(255,255,255,1)";
                var text = "Hello, world!";
                context1.fillText("width:" + context1.measureText(text).width, 0, 20);
                context1.fillText(text, 0, 20);
                canvas1.width = context1.measureText(text).width;
                canvas1.height = context1.height;

            	// canvas contents will be used for a texture
            	var texture1 = new THREE.Texture(canvas1)
                texture1.minFilter = THREE.LinearFilter;
            	texture1.needsUpdate = true;

                var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
                material1.transparent = true;

                var pivot = new THREE.Mesh(new THREE.CubeGeometry(10, 10, 10));

                var mesh1 = new THREE.Mesh(
                    new THREE.PlaneGeometry(canvas1.width, canvas1.height),
                    material1
                  );
                pivot.position.set(
                    intersections[0].point.x,
                    intersections[0].point.y,
                    intersections[0].point.z
                );
                mesh1.annotationType = 'Comment';
                //comment.translate(intersections[0].point);
                pivot.add(mesh1);
                Prizm3D.comments.push(pivot);
                Prizm3D.scene.add(pivot);
            }
        }, false);
        /*
        window.addEventListener('mouseup', function() {
            getRayIntersections();
            if (!moved) {
                console.log('hello')
            };
        });
        */
        window.addEventListener('mousemove', onTouchMove);
        window.addEventListener('touchmove', onTouchMove);

        function onTouchMove(event) {
            if (event.changedTouches) {
                x = event.changedTouches[0].pageX;
                y = event.changedTouches[0].pageY;
            } else {
                x = event.clientX;
                y = event.clientY;
            }
            mouse.x = (x / window.innerWidth) * 2 - 1;
            mouse.y = -(y / window.innerHeight) * 2 + 1;
            //checkIntersection();
        }

        function getRayIntersections() {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, Prizm3D.camera);
            return raycaster.intersectObjects(Prizm3D.scene.children, true);
        }
    },

    RayIntersection: (object, coordinates) => {
        return {
            object,
            coordinates
        };
    },

    loadFile: (documentId) => {
        const data = JSON.stringify({
            source: {
                type: "document",
                fileName: documentId
            }
        });

        const viewingSession = $.post(Prizm3D.pasPath + "/ViewingSession", data);

        viewingSession.done(
            function(data) {
                const texture = new THREE.Texture();
                Prizm3D.imgLoader.load('../assets/UV_Grid_Sm.jpg', function(image) {
                    texture.image = image;
                    texture.needsUpdate = true;
                });

                const sourceFilePath = Prizm3D.pasPath + "/ViewingSession/u" + data.viewingSessionId + "/SourceFile";

                Prizm3D.objLoader.load(sourceFilePath, function(object) {
                    object.traverse(function(child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.map = texture;
                            child.material.color = new THREE.Color(0, 1, 0);
                            child.material.receiveShadow = true;
                        }
                    });

                    Prizm3D.scene.add(object);

                    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                    directionalLight.position.set(0, 0, 1);
                    var helper = new THREE.CameraHelper(directionalLight.shadow.camera);
                    Prizm3D.scene.add(directionalLight);

                });
            });
    }
};

window.Prizm3D = Prizm3D;
