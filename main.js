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

var scene, renderer, camera;
var model = {};
var controls;

// save configuration
var configuration;

var edgesModel, originalModel, backgroundModel, conditionalModel, shadowModel, floor, depthModel, gui;

//helpers
var gridXZ, arrowHelper, arrowHelper_norm

var angle;

var helpers = false;

// AdDD BIKEPARTS HERE IN THE ACCORDING ARRAY
var frames = [
    {name: 'vigorelli', path: './models/parts/frame_01_vigorelli.obj',
        position: [0, 0.95, 0.65]
    },
    {name: 'super', path: './models/parts/frame_02_super_pista.obj',
        position: [0, 0.95, 0.64]
    },
    {name: 'barcelona', path: './models/parts/frame_03_barcelona.obj',
        position: [0, 0.90, 0.60]
    },
    {name: 'profesional', path: './models/parts/frame_04_barcelona_low_pro.obj',
        position: [0, 0.90, 0.63]
    },
    {name: 'prototype', path: './models/parts/frame_05_barcelona_prototype.obj',
        position: [0, 0.90, 0.63]
    },
]
var forks = [
    {name: 'standart', path: './models/parts/fork_01.obj'},
    {name: 'extended', path: './models/parts/fork_02.obj'},
    {name: 'thin', path: './models/parts/fork_03.obj'},
]
var front_wheels = [
    {name: 'sensible', path: './models/parts/wheel_01.obj'},
    {name: 'wheeler', path: './models/parts/wheel_02.obj'},
    {name: 'vampire', path: './models/parts/wheel_03.obj'},
    {name: 'disk', path: './models/parts/wheel_04.obj'}
]
var back_wheels = [
    {name: 'sensible', path: './models/parts/wheel_01.obj'},
    {name: 'wheeler', path: './models/parts/wheel_02.obj'},
    {name: 'vampire', path: './models/parts/wheel_03.obj'},
    {name: 'disk', path: './models/parts/wheel_04.obj'}
]
var handlebars = [
    {name: 'deep', path: './models/parts/handlebar_01.obj'},
    {name: 'narrow', path: './models/parts/handlebar_02.obj'},
    {name: 'wide', path: './models/parts/handlebar_03.obj'},
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
const LIGHT_MODEL = 0xffffff;
const LIGHT_LINES = 0x000000;
const LIGHT_SHADOW = 0xc4c9cb;

const DARK_BACKGROUND = 0x111111;
const DARK_MODEL = 0x111111;
const DARK_LINES = 0xb0bec5;
const DARK_SHADOW = 0x2c2e2f;

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
    controls.target.set( 0, 0.2, 0 );

    gridXZ = new THREE.GridHelper(100, 10, new THREE.Color(0xff0000), new THREE.Color(0x000000));
    if (helpers) {
        scene.add(gridXZ);
    } else {
        document.getElementById ("toggle").textContent = "Add Helpers";
    }

    generate();
    
    initGui();

}

function generate() {

    console.log("generate new model")
    model = {};

    createConfiguration();
    loadModels();

    function waitForModels() {
        if(Object.keys(model).length !== 5) {
            window.setTimeout(waitForModels, 100);
        } else {
            console.log(model)
            var pos = configuration.frame.position;

            // add arrowhelpers
            const dir = new THREE.Vector3( 0, -3, 0.8 );
            const norm = new THREE.Vector3( 1, 0, 0 );
            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();
            const origin = new THREE.Vector3(pos[0], pos[1], pos[2]);
            const length = 4;
            const hex = 0x00ff00;
            scene.remove( arrowHelper );
            scene.remove( arrowHelper_norm );
            arrowHelper = new THREE.ArrowHelper( dir, origin.clone().sub(dir), length, hex );
            arrowHelper_norm = new THREE.ArrowHelper( norm, origin, 2, 0x0000ff );
            if (helpers) {
                scene.add( arrowHelper );
                scene.add( arrowHelper_norm );
            }

            angle = Math.random() * 2 - 1;
            model.handlebar.position.set(pos[0], pos[1], pos[2]);
            model.handlebar.rotateAroundWorldAxis(origin, dir, angle);
            model.front_wheel.position.set(0, 0, 1.00);
            model.front_wheel.rotateAroundWorldAxis(origin, dir, angle);
            model.fork.rotateAroundWorldAxis(origin, dir, angle);
            model.back_wheel.position.set(0, 0.02, -0.99);

            const group = new THREE.Group();

            Object.values(model).forEach(object => {
                group.add(object);
                // scene.add(object);
            });

            console.log(group)

            var object = mergeObject(group)
            object.children[0].material = new THREE.MeshStandardMaterial( { color: 0x009900 } );
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

function createConfiguration() {
    configuration = {
        frame: randomElement(frames),
        front_wheel: randomElement(front_wheels),
        back_wheel: randomElement(back_wheels),
        handlebar: randomElement(handlebars),
        fork: randomElement(forks)
    }

    console.log(configuration);
}

function loadModels() {

    // instantiate a loader
    const obj_loader = new OBJLoader();
    // load a resource

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
    requestAnimationFrame( animate );

    if (Object.keys(model).length !== 0 && false) {
        model.wheel.rotation.x += 0.01;
        model.wheel.rotation.y += 0.01;
    }

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

        linesColor = params.lineColor;
        modelColor = params.modelColor;
        backgroundColor = params.backgroundColor;
        shadowColor = params.shadowColor;

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

    scene.background.set( backgroundColor );
    floor.material.color.set( shadowColor );
    floor.material.opacity = params.opacity;
    floor.visible = params.lit;

    renderer.render( scene, camera );
}

function mergeObject( object ) {

    object.updateMatrixWorld( true );

    const geometry = [];
    object.traverse( c => {

        if ( c.isMesh ) {

            const g = c.geometry;
            g.applyMatrix4( c.matrixWorld );
            for ( const key in g.attributes ) {

                if ( key !== 'position' && key !== 'normal' ) {

                    g.deleteAttribute( key );

                }

            }
            geometry.push( g.toNonIndexed() );

        }

    } );

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
    var temp_back = scene.background;
    scene.remove(gridXZ);
    scene.remove( arrowHelper );
    scene.remove( arrowHelper_norm );
    scene.background = null;
    renderer.render( scene, camera );
    var dataUrl = renderer.domElement.toDataURL("image/png");
    var link = document.createElement('a');
    link.download = "my-image.png";
    link.href = dataUrl;
    link.click();
    console.log(dataUrl)

    // renderer.setPixelRatio( window.devicePixelRatio * 2 );
    if (helpers) {
        scene.add(gridXZ)
        scene.add( arrowHelper );
        scene.add( arrowHelper_norm );
    }
    scene.background = temp_back;
    renderer.render( scene, camera );
}

function toggleHelpers (e) {
    helpers = !helpers;
    if(helpers) {
        e.target.textContent = "Remove Helpers";
        scene.add(gridXZ)
        scene.add( arrowHelper );
        scene.add( arrowHelper_norm );
        renderer.render( scene, camera );
    } else {
        e.target.textContent = "Add Helpers";
        scene.remove(gridXZ)
        scene.remove( arrowHelper );
        scene.remove( arrowHelper_norm );
        renderer.render( scene, camera );
    }
}

function possibilities () {
    var number = frames.length * back_wheels.length * front_wheels.length * handlebars.length * forks.length;
    document.getElementById ("number").textContent = number;
}

function updateName() {
    var name =
        configuration.frame.name + "-" +
        configuration.fork.name + "-" +
        configuration.front_wheel.name + "-" +
        configuration.back_wheel.name + "-" +
        configuration.handlebar.name;
    document.getElementById ("name").textContent = name;
}

document.getElementById ("generate").addEventListener ("click", generate, false);
document.getElementById ("export").addEventListener ("click", exportBike, false);
document.getElementById ("toggle").addEventListener ("click", toggleHelpers, false);

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}