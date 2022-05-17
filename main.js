// import action
import * as THREE from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
// import { GLTFLoader } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js';
import { BufferGeometryUtils } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/utils/BufferGeometryUtils.js';
import dat from '//cdn.skypack.dev/dat.gui/build/dat.gui.module.js';

import { LineSegmentsGeometry } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/lines/LineMaterial.js';

import { OutsideEdgesGeometry } from './src/OutsideEdgesGeometry.js';
import { ConditionalEdgesGeometry } from './src/ConditionalEdgesGeometry.js';
import { ConditionalEdgesShader } from './src/ConditionalEdgesShader.js';
import { ConditionalLineSegmentsGeometry } from './src/Lines2/ConditionalLineSegmentsGeometry.js';
import { ConditionalLineMaterial } from './src/Lines2/ConditionalLineMaterial.js';
import { ColoredShadowMaterial } from './src/ColoredShadowMaterial.js';

// import * as SHADER from './shader.js'; // Or the extension could be just `.js`
// SHADER.hello('world');

var scene, renderer, camera;
var background_scene = new THREE.Scene();
var model = {};
var controls;

// save configuration
var configuration;

var edgesModel, originalModel, backgroundModel, conditionalModel, shadowModel, floor, depthModel, gui;

//helpers
var gridXZ, angle_helper, handlebar_helper, fork_helper

var angle, wheel_scale

var helpers = true;
var rotate = false;
var debug = false;

// ADD BIKEPARTS HERE IN THE ACCORDING ARRAY
var frames = [
    {name: 'vigorelli', path: './models/parts/frame_01_vigorelli.obj',
        positions: {
            handlebar: [0, 0.96, 0.644],
            fork: [0, 0.666, 0.73], // left, up, front
            back_wheel: [0.01, 0, -1.01]
        }
    },
    {name: 'super', path: './models/parts/frame_02_super_pista.obj',
        positions: {
            handlebar: [0, 0.99, 0.629],
            fork: [0, 0.651, 0.735], // left, up, front
            back_wheel: [-0.01, 0, -1.01]
        }
    },
    {name: 'barcelona', path: './models/parts/frame_03_barcelona.obj',
        positions: {
            handlebar: [0, 0.988, 0.643],
            fork: [0, 0.651, 0.753], // left, up, front
            back_wheel: [0.01, 0, -1.01]
        }
    },
    {name: 'profesional', path: './models/parts/frame_04_barcelona_low_pro.obj',
        positions: {
            handlebar: [0, 0.912, 0.645],
            fork: [0, 0.67, 0.728], // left, up, front
            back_wheel: [0.01, 0, -1.01]
        }
    },
    {name: 'prototype', path: './models/parts/frame_05_barcelona_prototype.obj',
        positions: {
            handlebar: [0, 0.912, 0.646],
            fork: [0, 0.67, 0.727], // left, up, front
            back_wheel: [0.01, 0, -1.01]
        }
    },
    {name: 'long', path: './models/parts/frame_06_barcelona_long.obj',
        positions: {
            handlebar: [0, 0.912, 1.70],
            fork: [0.01, 0.70, 1.728], // left, up, front
            back_wheel: [0.01, 0, -1.01]
        }
    },
    {name: 'detail', path: './models/parts/frame_07_barcelona_details.obj',
        positions: {
            handlebar: [0, 0.912, 0.646],
            fork: [0, 0.67, 0.727], // left, up, front
            back_wheel: [0.01, 0, -1.01]
        }
    },
]
var forks = [
    {name: 'standart', path: './models/parts/fork_01.obj',vector: [0.005, -0.75, 0.065]},
    {name: 'extended', path: './models/parts/fork_02.obj',vector: [0.005, -0.75, 0.065]},
    {name: 'thin', path: './models/parts/fork_03.obj', vector: [0.005, -0.75, 0.065]},
    {name: 'longboy', path: './models/parts/fork_04.obj', vector: [0.005, -0.74, 0.17]},
]
var wheels = [
    {name: 'sensible', path: './models/parts/wheel_01.obj'},
    {name: 'wheeler', path: './models/parts/wheel_02.obj'},
    {name: 'vampire', path: './models/parts/wheel_03.obj'},
    {name: 'disk', path: './models/parts/wheel_04.obj'},
    {name: 'single', path: './models/parts/wheel_05.obj'},
]
var handlebars = [
    {name: 'deep', path: './models/parts/handlebar_01.obj'},
    {name: 'narrow', path: './models/parts/handlebar_02.obj'},
    {name: 'wide', path: './models/parts/handlebar_03.obj'},
    {name: 'bull', path: './models/parts/handlebar_04.obj'},
]

// globals
var params = {
    colors: 'LIGHT',
    backgroundColor: '#0d2a28',
    modelColor: '#0d2a28',
    lineColor: '#000000',
    shadowColor: '#44491f',

    lit: false,
    opacity: 1,
    threshold: 20,
    display: 'THRESHOLD_EDGES',
    displayConditionalEdges: true,
    thickness: 2.5,
    useThickLines: true,
    model: 'FRAME',

    randomize: () => randomizeColors(),
};

const color = new THREE.Color();
const color2 = new THREE.Color();

const LIGHT_BACKGROUND = 0xeeeeee;
const LIGHT_MODEL = 0x2e08e3;
const LIGHT_LINES = 0xffffff;
const LIGHT_SHADOW = 0xc4c9cb;

const DARK_BACKGROUND = 0x111111;
const DARK_MODEL = 0xff4d06;
const DARK_LINES = 0xffffff;
const DARK_SHADOW = 0x2c2e2f;

const GREEN_BACKGROUND = 0x111111;
const GREEN_MODEL = 0x8800b5;
const GREEN_LINES = 0xffffff;
const GREEN_SHADOW = 0x2c2e2f;

init();
animate();

function init() {

    possibilities();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer : true // required to support .toDataURL()
    });
    renderer.autoClear = false;
    renderer.setClearColor( 0x000000, 0 );
    renderer.setPixelRatio( window.devicePixelRatio * 2 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    camera.position.set(1.5,1.5,1.5);

    // Floor
    floor = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(),
        new THREE.ShadowMaterial( { color: LIGHT_LINES, opacity: 0.25, transparent: true } )
    );
    floor.rotation.x = - Math.PI / 2;
    floor.scale.setScalar( 20 );
    floor.receiveShadow = true;
    scene.add( floor );

    // Lights
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    dirLight.position.set( 5, 10, 5 );
    dirLight.castShadow = true;
    dirLight.shadow.bias = -1e-10;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    window.dirLight = dirLight;

    const shadowCam = dirLight.shadow.camera;
    shadowCam.left = shadowCam.bottom = -1;
    shadowCam.right = shadowCam.top = 1;

    scene.add( dirLight );

    // camera controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( -0.2, 0.3, 0.2 );
    if (!rotate) {
        document.getElementById ("rotate").textContent = "Start Rotation";
        controls.autoRotate = false;
    } else {
        controls.autoRotate = true;
    }
    controls.autoRotateSpeed = 0.5;

    gridXZ = new THREE.GridHelper(100, 10, new THREE.Color(0xff0000), new THREE.Color(0x000000));
    if (helpers) {
        scene.add(gridXZ);
    } else {
        document.getElementById ("toggle").textContent = "Add Helpers";
    }

    generate();
    
    initGui();

}

function generate(update = true, pre_cof = null) {

    if (update) {
        if(debug) {
            toggleDebug();
        }
        console.log("generate new model")
        model = {};
        createConfiguration(pre_cof);
        loadModels();
    } else {
        console.log("generate old model")
    }

    function waitForModels() {
        if(Object.keys(model).length !== 5) {
            window.setTimeout(waitForModels, 100);
        } else {
            console.log(model);
            console.log(full_wheel);

            // add angle_helpers
            const handlebar_point = new THREE.Vector3(
                configuration.frame.positions.handlebar[0],
                configuration.frame.positions.handlebar[1],
                configuration.frame.positions.handlebar[2],
            );
            const fork_point = new THREE.Vector3(
                configuration.frame.positions.fork[0],
                configuration.frame.positions.fork[1],
                configuration.frame.positions.fork[2],
            );
            // const dir = new THREE.Vector3( 0, -3, 0.8 );
            const dir = handlebar_point.clone().sub(fork_point);
            const norm = new THREE.Vector3( 1, 0, 0 );
            const tilt = dir.angleTo(new THREE.Vector3(0,1,0))
            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();

            const length = 1.6;
            const hex = 0x00ff00;
            scene.remove( angle_helper );
            scene.remove( handlebar_helper );
            scene.remove( fork_helper );
            angle_helper = new THREE.ArrowHelper( dir, handlebar_point.clone().sub(dir), length, hex );
            handlebar_helper = new THREE.ArrowHelper( norm, handlebar_point, 0.5, 0x0000ff );
            fork_helper = new THREE.ArrowHelper( norm, fork_point, 0.5, 0x0000ff );
            if (helpers) {
                scene.add( angle_helper );
                scene.add( handlebar_helper );
                scene.add( fork_helper );
            }

            var front_wheel_position = new THREE.Vector3(
                configuration.fork.vector[0],
                configuration.fork.vector[1],
                configuration.fork.vector[2] 
            );
            front_wheel_position.applyAxisAngle( norm, -tilt );
            front_wheel_position = fork_point.clone().add(front_wheel_position);

            if (update) {
                console.log("hello");
                angle = Math.random() * 2 - 1;
                // angle = 0;
                wheel_scale = [1, 1];

                model.handlebar.position.set(
                    configuration.frame.positions.handlebar[0],
                    configuration.frame.positions.handlebar[1],
                    configuration.frame.positions.handlebar[2]
                );
                model.handlebar.rotateAroundWorldAxis(handlebar_point, norm, -tilt);
                model.handlebar.rotateAroundWorldAxis(handlebar_point, dir, angle);
                model.front_wheel.scale.set(1, wheel_scale[0], wheel_scale[0]);
                // model.front_wheel.position.set(
                //     configuration.frame.positions.front_wheel[0],
                //     configuration.frame.positions.front_wheel[1],
                //     configuration.frame.positions.front_wheel[2]
                // );
                model.front_wheel.position.set(
                    front_wheel_position.x,
                    front_wheel_position.y,
                    front_wheel_position.z
                );
                model.front_wheel.rotateAroundWorldAxis(handlebar_point, dir, angle);
                model.fork.position.set(
                    configuration.frame.positions.fork[0],
                    configuration.frame.positions.fork[1],
                    configuration.frame.positions.fork[2]
                );
                model.fork.rotateAroundWorldAxis(fork_point, norm, -tilt);
                model.fork.rotateAroundWorldAxis(handlebar_point, dir, angle);
                model.back_wheel.scale.set(1, wheel_scale[1], wheel_scale[1]);
                model.back_wheel.position.set(
                    configuration.frame.positions.back_wheel[0],
                    configuration.frame.positions.back_wheel[1],
                    configuration.frame.positions.back_wheel[2]
                );
            }

            // const geo = new THREE.CylinderGeometry( 2, 2, 2, 32 );
            // const mat = new THREE.MeshBasicMaterial( {color: 0x000000} );
            // const cyl = new THREE.Mesh( geo, mat );

            const group = new THREE.Group();

            Object.values(model).forEach(object => {
                group.add(object);
                // scene.add(object);
            });

            console.log(group)

            if(debug) {
                var object = mergeObject(model.frame)
            } else {
                if(update) {
                    var object = mergeObject(group, true);
                } else {
                    var object = mergeObject(group, false);
                }
            }

            // fix background problems
            while(background_scene.children.length > 0){ 
                background_scene.remove(background_scene.children[0]); 
            }
            const backmodel = new THREE.Group();
            // var front_backmodel = full_wheel.children[0].clone();
            // var back_backmodel = full_wheel.children[0].clone();
            const geometry = new THREE.CylinderGeometry( 0.6, 0.6, 0.01, 32 );
            const material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
            const cylinder = new THREE.Mesh( geometry, material );
            cylinder.rotation.z = Math.PI / 2;
            var front_backmodel = cylinder.clone();
            front_backmodel.scale.set(
                wheel_scale[0],
                1,
                wheel_scale[0]
            );
            front_backmodel.position.set(
                front_wheel_position.x,
                front_wheel_position.y,
                front_wheel_position.z
            );
            front_backmodel.rotateAroundWorldAxis(handlebar_point, dir, angle);
            var back_backmodel = cylinder.clone();
            back_backmodel.scale.set(
                wheel_scale[1],
                1,
                wheel_scale[1]
            );
            back_backmodel.position.set(
                configuration.frame.positions.back_wheel[0],
                configuration.frame.positions.back_wheel[1],
                configuration.frame.positions.back_wheel[2]
            );
            backmodel.add(back_backmodel)
            backmodel.add(front_backmodel)
            background_scene.add(backmodel);

            // object.add(cyl);

            object.children[ 0 ].material = new THREE.MeshStandardMaterial( { color: 0x009900 } );
            object.children[ 0 ].geometry.computeBoundingBox();
			object.children[ 0 ].castShadow = true;
            // scene.add(object);
            updateModel(object);
            console.log(scene);

            updateName();
        }
    }

    waitForModels();
}

THREE.Object3D.prototype.rotateAroundWorldAxis = function() {

    // rotate object around axis in world space (the axis passes through point)
    // axis is assumed to be normalized
    // assumes object does not have a rotated parent

    var q = new THREE.Quaternion();

    return function rotateAroundWorldAxis( point, axis, angle ) {

        q.setFromAxisAngle( axis, angle );

        this.applyQuaternion( q );

        this.position.sub( point );
        this.position.applyQuaternion( q );
        this.position.add( point );

        return this;

    }

}();

function randomElement (a) {
    return a[Math.floor((Math.random()*a.length))];
}

function createConfiguration(pre_conf = null) {
    if(pre_conf == null) {
        configuration = {
            frame: randomElement(frames),
            front_wheel: randomElement(wheels),
            back_wheel: randomElement(wheels),
            handlebar: randomElement(handlebars),
            fork: randomElement(forks)
        }
    } else {
        // fix undefined configuration
        configuration = {
            frame: frames.find(element => element.name == pre_conf[0]),
            front_wheel: wheels.find(element => element.name == pre_conf[2]),
            back_wheel: wheels.find(element => element.name == pre_conf[3]),
            handlebar: handlebars.find(element => element.name == pre_conf[4]),
            fork: forks.find(element => element.name == pre_conf[1])
        }
    }

    console.log(configuration);
}

var full_wheel;

function loadModels() {

    // instantiate a loader
    const obj_loader = new OBJLoader();
    // load a resource
    obj_loader.load(
        // resource URL
        './models/parts/wheel_03.obj',
        // called when resource is loaded
        function ( object ) {
            object.traverse( function( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = new THREE.MeshStandardMaterial( { color: 0x009900 } );
                }
            });
            full_wheel = object;
            // scene.add( object );
        },
        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );

    Object.entries(configuration).forEach(entry => {
        const [part, data] = entry;
        obj_loader.load(
            // resource URL
            data.path,
            // called when resource is loaded
            function ( object ) {
                object.traverse( function( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.material = new THREE.MeshStandardMaterial( { color: 0x009900 } );
                    }
                });
                model[part] = object;
                console.log(object)
                // scene.add( object );
            },
            // called when loading is in progresses
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened' );
            }
        );
    });
}

function animate() {
    
    controls.update();
    requestAnimationFrame(animate);

    let linesColor = LIGHT_LINES;
    let modelColor = LIGHT_MODEL;
    let backgroundColor = LIGHT_BACKGROUND;
    let shadowColor = LIGHT_SHADOW;

    if ( params.colors === 'DARK' ) {

        linesColor = DARK_LINES;
        modelColor = DARK_MODEL;
        backgroundColor = DARK_BACKGROUND;
        shadowColor = DARK_SHADOW;

    } else if ( params.colors === 'CUSTOM' ) {

        linesColor = GREEN_LINES;
        modelColor = GREEN_MODEL;
        backgroundColor = GREEN_BACKGROUND;
        shadowColor = GREEN_SHADOW;

    }

    if ( conditionalModel ) {

        conditionalModel.visible = params.displayConditionalEdges;
        conditionalModel.traverse( c => {

            if ( c.material && c.material.resolution ) {

                renderer.getSize( c.material.resolution );
                c.material.resolution.multiplyScalar( window.devicePixelRatio );
                c.material.linewidth = params.thickness;

            }

            if ( c.material ) {

                c.visible = c instanceof LineSegments2 ? params.useThickLines : ! params.useThickLines;
                c.material.uniforms.diffuse.value.set( linesColor );

            }

        } );

    }


    if ( edgesModel ) {

        edgesModel.traverse( c => {

            if ( c.material && c.material.resolution ) {

                renderer.getSize( c.material.resolution );
                c.material.resolution.multiplyScalar( window.devicePixelRatio );
                c.material.linewidth = params.thickness;

            }

            if ( c.material ) {

                c.visible = c instanceof LineSegments2 ? params.useThickLines : ! params.useThickLines;
                c.material.color.set( linesColor );

            }

        } );

    }

    if ( backgroundModel ) {

        backgroundModel.visible = ! params.lit;
        backgroundModel.traverse( c => {

            if ( c.isMesh ) {

                c.material.transparent = params.opacity !== 1.0;
                c.material.opacity = params.opacity;
                c.material.color.set( modelColor );

            }

        } );

    }

    // gives a very sick shading effect if commented out!
    if ( shadowModel ) {

        shadowModel.visible = params.lit;
        shadowModel.traverse( c => {

            if ( c.isMesh ) {

                c.material.transparent = params.opacity !== 1.0;
                c.material.opacity = params.opacity;
                c.material.color.set( modelColor );
                c.material.shadowColor.set( shadowColor );

            }

        } );

    }

    if ( originalModel ) {

        floor.position.y = originalModel.children[ 0 ].geometry.boundingBox.min.y;

    }

    scene.background = null;
    background_scene.background = new THREE.Color( 0xffffff );
    floor.material.color.set( shadowColor );
    floor.material.opacity = params.opacity;
    floor.visible = params.lit;

    render();
}

function render() {
    renderer.clear();
    renderer.render( background_scene, camera );
    renderer.clearDepth();
    renderer.render( scene, camera );
}

function mergeObject( object, update = true ) {

    if (update) {
        object.updateMatrixWorld( true );
    }

    const geometry = [];
    object.traverse( c => {

        if ( c.isMesh ) {

            const g = c.geometry;
            if(update){
                g.applyMatrix4(c.matrixWorld);
                for (const key in g.attributes) {
                    if (key !== 'position' && key !== 'normal') {
                        g.deleteAttribute(key);
                    }
                
                }
            }
            // geometry.push(g.toNonIndexed());
            geometry.push(g);

        }
    });

    const mergedGeometries = BufferGeometryUtils.mergeBufferGeometries( geometry, false );
    const mergedGeometry = BufferGeometryUtils.mergeVertices( mergedGeometries );

    const group = new THREE.Group();
    const mesh = new THREE.Mesh( mergedGeometry );
    group.add( mesh );
    return group;

}

function updateModel(model) {

    originalModel = model;

    initEdgesModel();

    initBackgroundModel();

    initConditionalModel();

}

function initBackgroundModel() {

    if ( backgroundModel ) {

        backgroundModel.parent.remove( backgroundModel );
        shadowModel.parent.remove( shadowModel );
        depthModel.parent.remove( depthModel );

        backgroundModel.traverse( c => {

            if ( c.isMesh ) {

                c.material.dispose();

            }

        } );

        shadowModel.traverse( c => {

            if ( c.isMesh ) {

                c.material.dispose();

            }

        } );

        depthModel.traverse( c => {

            if ( c.isMesh ) {

                c.material.dispose();

            }

        } );

    }

    if ( ! originalModel ) {

        return;

    }

    backgroundModel = originalModel.clone();
    backgroundModel.traverse( c => {

        if ( c.isMesh ) {

            c.material = new THREE.MeshBasicMaterial( { color: LIGHT_MODEL } );
            c.material.polygonOffset = true;
            c.material.polygonOffsetFactor = 1;
            c.material.polygonOffsetUnits = 1;
            c.renderOrder = 2;

        }

    } );
    scene.add( backgroundModel );

    shadowModel = originalModel.clone();
    shadowModel.traverse( c => {

        if ( c.isMesh ) {

            c.material = new ColoredShadowMaterial( { color: LIGHT_MODEL, shininess: 1.0 } );
            c.material.polygonOffset = true;
            c.material.polygonOffsetFactor = 1;
            c.material.polygonOffsetUnits = 1;
            c.receiveShadow = true;
            c.renderOrder = 2;

        }

    } );
    scene.add( shadowModel );

    depthModel = originalModel.clone();
    depthModel.traverse( c => {

        if ( c.isMesh ) {

            c.material = new THREE.MeshBasicMaterial( { color: LIGHT_MODEL } );
            c.material.polygonOffset = true;
            c.material.polygonOffsetFactor = 1;
            c.material.polygonOffsetUnits = 1;
            c.material.colorWrite = false;
            c.renderOrder = 1;

        }

    } );
    scene.add( depthModel );

}

function initEdgesModel() {

    // remove any previous model
    if ( edgesModel ) {

        edgesModel.parent.remove( edgesModel );
        edgesModel.traverse( c => {

            if ( c.isMesh ) {

                if ( Array.isArray( c.material ) ) {

                    c.material.forEach( m => m.dispose() );

                } else {

                    c.material.dispose();

                }

            }

        } );

    }

    // early out if there's no model loaded
    if ( ! originalModel ) {

        return;

    }

    // store the model and add it to the scene to display
    // behind the lines
    edgesModel = originalModel.clone();
    scene.add( edgesModel );

    // early out if we're not displaying any type of edge
    if ( params.display === 'NONE' ) {

        edgesModel.visible = false;
        return;

    }

    const meshes = [];
    edgesModel.traverse( c => {

        if ( c.isMesh ) {

            meshes.push( c );

        }

    } );

    for ( const key in meshes ) {

        const mesh = meshes[ key ];
        const parent = mesh.parent;

        let lineGeom;
        if ( params.display === 'THRESHOLD_EDGES' ) {

            lineGeom = new THREE.EdgesGeometry( mesh.geometry, params.threshold );

        } else {

            const mergeGeom = mesh.geometry.clone();
            mergeGeom.deleteAttribute( 'uv' );
            mergeGeom.deleteAttribute( 'uv2' );
            lineGeom = new OutsideEdgesGeometry( BufferGeometryUtils.mergeVertices( mergeGeom, 1e-3 ) );

        }

        const line = new THREE.LineSegments( lineGeom, new THREE.LineBasicMaterial( { color: LIGHT_LINES } ) );
        line.position.copy( mesh.position );
        line.scale.copy( mesh.scale );
        line.rotation.copy( mesh.rotation );

        const thickLineGeom = new LineSegmentsGeometry().fromEdgesGeometry( lineGeom );
        const thickLines = new LineSegments2( thickLineGeom, new LineMaterial( { color: LIGHT_LINES, linewidth: 3 } ) );
        thickLines.position.copy( mesh.position );
        thickLines.scale.copy( mesh.scale );
        thickLines.rotation.copy( mesh.rotation );

        parent.remove( mesh );
        parent.add( line );
        parent.add( thickLines );

    }

}

function initConditionalModel() {

    // remove the original model
    if ( conditionalModel ) {

        conditionalModel.parent.remove( conditionalModel );
        conditionalModel.traverse( c => {

            if ( c.isMesh ) {

                c.material.dispose();

            }

        } );

    }

    // if we have no loaded model then exit
    if ( ! originalModel ) {

        return;

    }

    conditionalModel = originalModel.clone();
    scene.add( conditionalModel );
    conditionalModel.visible = false;

    // get all meshes
    const meshes = [];
    conditionalModel.traverse( c => {

        if ( c.isMesh ) {

            meshes.push( c );

        }

    } );

    for ( const key in meshes ) {

        const mesh = meshes[ key ];
        const parent = mesh.parent;

        // Remove everything but the position attribute
        const mergedGeom = mesh.geometry.clone();
        for ( const key in mergedGeom.attributes ) {

            if ( key !== 'position' ) {

                mergedGeom.deleteAttribute( key );

            }

        }

        // Create the conditional edges geometry and associated material
        const lineGeom = new ConditionalEdgesGeometry( BufferGeometryUtils.mergeVertices( mergedGeom ) );
        const material = new THREE.ShaderMaterial( ConditionalEdgesShader );
        material.uniforms.diffuse.value.set( LIGHT_LINES );

        // Create the line segments objects and replace the mesh
        const line = new THREE.LineSegments( lineGeom, material );
        line.position.copy( mesh.position );
        line.scale.copy( mesh.scale );
        line.rotation.copy( mesh.rotation );

        const thickLineGeom = new ConditionalLineSegmentsGeometry().fromConditionalEdgesGeometry( lineGeom );
        const thickLines = new LineSegments2( thickLineGeom, new ConditionalLineMaterial( { color: LIGHT_LINES, linewidth: 2 } ) );
        thickLines.position.copy( mesh.position );
        thickLines.scale.copy( mesh.scale );
        thickLines.rotation.copy( mesh.rotation );

        parent.remove( mesh );
        parent.add( line );
        parent.add( thickLines );

    }

}

function initGui() {

    if ( gui ) {

        gui.destroy();

    }

    // dat gui
    gui = new dat.GUI();
    gui.width = 300;
    gui.add( params, 'colors', [ 'LIGHT', 'DARK', 'CUSTOM' ] );
    gui.addColor( params, 'backgroundColor' );
    gui.addColor( params, 'modelColor' );
    gui.addColor( params, 'lineColor' );
    gui.addColor( params, 'shadowColor' );
    gui.add( params, 'randomize' );

    const modelFolder = gui.addFolder( 'model' );

    // modelFolder.add( params, 'model', Object.keys( models ) ).onChange( updateModel );

    modelFolder.add( params, 'opacity' ).min( 0 ).max( 1.0 ).step( 0.01 );

    modelFolder.add( params, 'lit' );

    // modelFolder.open();

    const linesFolder = gui.addFolder( 'conditional lines' );

    linesFolder.add( params, 'threshold' )
        .min( 0 )
        .max( 120 )
        .onChange( initEdgesModel );

    linesFolder.add( params, 'display', [
        'THRESHOLD_EDGES',
        'NORMAL_EDGES',
        'NONE',
    ] ).onChange( initEdgesModel );

    linesFolder.add( params, 'displayConditionalEdges' );

    linesFolder.add( params, 'useThickLines' );

    linesFolder.add( params, 'thickness', 0, 5 );

    linesFolder.open();

    const cameraFolder = gui.addFolder( 'camera' );

    function updateCamera() {
        camera.updateProjectionMatrix();
    }

    class MinMaxGUIHelper {
        constructor(obj, minProp, maxProp, minDif) {
            this.obj = obj;
            this.minProp = minProp;
            this.maxProp = maxProp;
            this.minDif = minDif;
        }
        get min() {
            return this.obj[this.minProp];
        }
        set min(v) {
            this.obj[this.minProp] = v;
            this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
        }
        get max() {
            return this.obj[this.maxProp];
        }
        set max(v) {
            this.obj[this.maxProp] = v;
            this.min = this.min;  // this will call the min setter
        }
    }

    cameraFolder.add(camera, 'fov', 1, 180).onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    cameraFolder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    cameraFolder.add(minMaxGUIHelper, 'max', 0.1, 2000, 0.1).name('far').onChange(updateCamera);

    cameraFolder.open();

    gui.close();
}

function exportBike(e) {

    // no background
    // renderer.setPixelRatio( window.devicePixelRatio * 4 );
    var temp_back = background_scene.background;
    scene.remove(gridXZ);
    scene.remove( angle_helper );
    scene.remove( handlebar_helper );
    scene.remove( fork_helper );
    background_scene.background = null;
    // renderer.render( scene, camera );
    render();
    var dataUrl = renderer.domElement.toDataURL("image/png");
    var link = document.createElement('a');
    link.download = "model_" + name + ".png";
    link.href = dataUrl;
    link.click();
    console.log(dataUrl)

    // renderer.setPixelRatio( window.devicePixelRatio * 2 );
    if (helpers) {
        scene.add(gridXZ)
        scene.add( angle_helper );
        scene.add( handlebar_helper );
        scene.add( fork_helper );
    }
    background_scene.background = temp_back;
    // renderer.render( scene, camera );
    render();
}

function toggleHelpers (e) {
    helpers = !helpers;
    if(helpers) {
        e.target.textContent = "Remove Helpers";
        scene.add(gridXZ)
        scene.add( angle_helper );
        scene.add( handlebar_helper );
        scene.add( fork_helper );
        // renderer.render( scene, camera );
    } else {
        e.target.textContent = "Add Helpers";
        scene.remove(gridXZ)
        scene.remove( angle_helper );
        scene.remove( handlebar_helper );
        scene.remove( fork_helper );
        // renderer.render( scene, camera );
    }
}

function possibilities () {
    var number = frames.length * wheels.length * wheels.length * handlebars.length * forks.length;
    document.getElementById ("number").textContent = number;
}

var name;
function updateName() {
    name =
        configuration.frame.name + "-" +
        configuration.fork.name + "-" +
        configuration.front_wheel.name + "-" +
        configuration.back_wheel.name + "-" +
        configuration.handlebar.name;
    document.getElementById ("name").textContent = name;

    let canvas = document.createElement('canvas');
    try {
        // console.log(bwipjs);
        bwipjs.toCanvas(canvas, {
            bcid:        'azteccode',       // Barcode type
            text:        name,    // Text to encode
            scale:       3,               // 3x scaling factor
            includetext: true,            // Show human-readable text
            textxalign:  'center',        // Always good to set this
        });
        console.log(canvas.toDataURL('image/png'));
        document.getElementById('code').src = canvas.toDataURL('image/png');
    } catch (e) {
        // `e` may be a string or Error object
        console.log(e);
    }
}

function toggleRotate (e) {
    rotate = !rotate;
    if (rotate) {
        document.getElementById ("rotate").textContent = "Stop Rotation";
        controls.autoRotate = true; 
    } else {
        document.getElementById ("rotate").textContent = "Start Rotation";
        controls.autoRotate = false;  
    }
}

function toggleDebug(e) {
    debug = !debug;
    if (debug) {
        document.getElementById("debug").textContent = "No Debug";
        document.getElementById("position").textContent = "click to get coordinates"
        document.getElementById("position").classList.remove("hidden");
        generate(false);
        // document.getElementById ("position").
    } else {
        document.getElementById ("debug").textContent = "Debug";
        document.getElementById("position").classList.add("hidden")
        generate(false);
    }
}

document.getElementById ("generate").addEventListener ("click", generate, false);
document.getElementById ("export").addEventListener ("click", exportBike, false);
document.getElementById ("toggle").addEventListener ("click", toggleHelpers, false);
document.getElementById ("rotate").addEventListener ("click", toggleRotate, false);
document.getElementById ("debug").addEventListener ("click", toggleDebug, false);
document.getElementById ("scan").addEventListener ("click", scan, false);

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// function getCanvasRelativePosition(event) {
//     const rect = renderer.domElement.getBoundingClientRect();
//     return {
//         x: (event.clientX - rect.left) * renderer.domElement.width  / rect.width,
//         y: (event.clientY - rect.top ) * renderer.domElement.height / rect.height,
//     };
// }

// const temp = new THREE.Vector3();
// function setPosition(event) {
//     const pos = getCanvasRelativePosition(e);
//     const x = pos.x / renderer.domElement.width * 2 - 1;
//     const y = pos.y / renderer.domElement.height * -2 + 1;
//     temp.set(x, y, 0).unproject(camera);
//     // state.x = temp.x;
//     // state.y = temp.y;
//     console.log(temp);
// }

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function onMouseMove(event) {
    if(debug) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    //   console.log(backgroundModel.children);
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(backgroundModel.children);
    if (intersects.length > 0) {
        // console.log(backgroundModel);
        // console.log(intersects[0].point)
        document.getElementById ("position").textContent = 
        "x: " + intersects[0].point.x.toFixed(3) + 
        "\ny: " + intersects[0].point.y.toFixed(3) +
        "\nz: " + intersects[0].point.z.toFixed(3);
    }

    // for (var i = 0; i < intersects.length; i++) {
    //     console.log(intersects[i])
    // }
    }

}

renderer.domElement.addEventListener('mousedown', onMouseMove);

var scaning = false;
var html5QrCode;
function scan() {
    scaning = !scaning;
    if(!scaning) {
        document.getElementById("scan").textContent = "Scan";
        if(html5QrCode) {
            html5QrCode.stop().then((ignore) => {
                // QR Code scanning is stopped.
            }).catch((err) => {
                // Stop failed, handle it.
            });
        }

    } else {
        document.getElementById("scan").textContent = "No Scan";
        // This method will trigger user permissions
        Html5Qrcode.getCameras().then(devices => {
            /**
             * devices would be an array of objects of type:
             * { id: "id", label: "label" }
             */
            if (devices && devices.length) {
            var cameraId = devices[0].id;
            html5QrCode = new Html5Qrcode(/* element id */ "reader");
            html5QrCode.start(
            cameraId, 
            {
                fps: 10,    // Optional, frame per seconds for qr code scanning
                qrbox: { width: 250, height: 250 }  // Optional, if you want bounded box UI
            },
            (decodedText, decodedResult) => {
                // do something when code is read
                var code = decodedText.split("-");
                console.log(code);
                generate(true, code);
                html5QrCode.stop().then((ignore) => {
                    // QR Code scanning is stopped.
                    document.getElementById("scan").textContent = "Scan";
                    scaning = false;
                }).catch((err) => {
                    // Stop failed, handle it.
                });
            },
            (errorMessage) => {
                // parse error, ignore it.
            })
            .catch((err) => {
            // Start failed, handle it.
            });
            }
        }).catch(err => {
            // handle err
        });
    }
}