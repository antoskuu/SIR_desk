'use strict';

(function () {
/* global THREE operative async*/

const { THREE, require, async } = window;

THREE.BINLoader = function () {
};

THREE.BINLoader.prototype = {

    load : function (url, opts, callback) {
        if (typeof opts === "function") {
            callback = opts;
            opts = {size};
        }

        this.loadAndParse(window.location.origin + url, function (res) {
            var material = new THREE.ShaderMaterial( {
                uniforms : {
                    color:     { type: "c", value: new THREE.Color( 0xffffff ) },
                    size:     { type: "1f", value: 1 },
                    culling:     { type: "1i", value: 0 },
                    lighting:     { type: "1f", value: 0.5},
                    rgb:     { type: "1f", value:  0 },
                    amplitude: { type: "1f", value: 1.0 },
                    opacity: { type: "1f", value: 1.0 },
                    time:      { type: "f", value: 1.0 }
                },
            	vertexShader :   this.vertexShader,
            	fragmentShader : this.fragmentShader,
            	depthTest: true,
                transparent:	true
            });
            material.extensions.fragDepth = true;


            var positions = res.position;
            var numPoints = positions.length / 3;
            var colors = new THREE.BufferAttribute(new Float32Array( numPoints * 3), 3 );
            var ids = new THREE.BufferAttribute(new Float32Array( numPoints ), 1);
            var normal = new THREE.BufferAttribute(res.normal, 3 );

            var geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.BufferAttribute(res.position, 3 ));
            geometry.setAttribute( 'normal', normal);
            geometry.setAttribute( 'id', ids );
            geometry.setAttribute( 'customColor', colors);

            var normals = res.normal;
            var n = new THREE.Vector3();
            var nx, ny, nz;
            var invert = opts.invertColors;
            var offset;

            for (var i = 0; i < numPoints; i++) {
                offset = i * 3;
                nx = normals[offset];
                ny = normals[offset + 1];
                nz = normals[offset + 2];
                if (invert) {
                    nx = - nx;
                    ny = - ny;
                    nz = - nz;
                }
                nx = Math.abs(nx);//( 1 + nx ) / 2;
                ny = Math.abs(ny);//( 1 + ny ) / 2;
                nz = Math.abs(nz);//( 1 + nz ) / 2;
                var invNorm = 1 / ( Math.sqrt( nx * nx + ny * ny + nz * nz ) );
            	colors.setXYZ( i, nx * invNorm, ny * invNorm, nz * invNorm );
            }

/*            offset = 0;
            var averageDistance = 0;
            for (i = 0; i < numPoints; i++) {
                var dx = positions[ offset + 3 ] - positions[ offset ];
                var dy = positions[ offset + 4 ] - positions[ offset + 1 ];
                var dz = positions[ offset + 5 ] - positions[ offset + 2 ];
                averageDistance += Math.sqrt( dx * dx + dy * dy + dz * dz);
            }

            averageDistance /= numPoints - 1;

*/
/*
            var x, y, z, x2, y2, z2, dMin;
            var positions = res.position;
            var distances = [];
            var nPicks = 1000;
            for ( i = 0; i < nPicks; i++ ) {
                offset = i * 3;
                x = positions[ offset ];
                y = positions[ offset + 1 ];
                z = positions[ offset + 2 ];

                dMin = 1e300;
                for (var j = 0; j < numPoints; j++) {
                    if (j === i) continue;
                    var offset2 = j * 3;
                    x2 = positions[ offset2 ];
                    y2 = positions[ offset2 + 1 ];
                    z2 = positions[ offset2 + 2 ];
                    var d2 = ( x - x2 ) * ( x - x2 )
                        + ( y - y2 ) * ( y - y2 )
                        + ( z - z2 ) * ( z - z2 );
                    if (d2 < dMin) dMin = d2;
                }
                distances.push(Math.sqrt(dMin));
            }
            distances.sort();
            console.log(distances);
//            material.uniforms.size.value = 100 * distances[4];
            
*/
            geometry.computeBoundingBox();
            var diagLength = geometry.boundingBox.getSize( new THREE.Vector3()).length().toPrecision(4);
//            console.log(diagLength);
//            material.uniforms.size.value = 1000 * Math.sqrt(diagLength / numPoints);
//            material.uniforms.size.value = 800 * distances[nPicks / 2] / diagLength;

            material.uniforms.size.value = opts.size || size;
//console.log("average distance : ", averageDistance);
//            material.uniforms.size.value = opts.size || (averageDistance / 1.5);

            callback(null, new THREE.Points( geometry, material ));
        }.bind(this));
    },

    loadAndParse : function (url, callback) {
        var points, normals;

        async.parallel([
            function (callback) {
                var oReq = new XMLHttpRequest();
                oReq.open("GET", url + "/points.bin", true);
                oReq.responseType = "arraybuffer";
                
                oReq.onload = function (oEvent) {
                    points = new Float32Array(oReq.response);
                    callback();
                };
                oReq.send(null);
            },
            function (callback) {
                var oReq = new XMLHttpRequest();
                oReq.open("GET", url + "/normals.bin", true);
                oReq.responseType = "arraybuffer";
                
                oReq.onload = function (oEvent) {
                    normals = new Float32Array(oReq.response);
                    callback();
                };
                oReq.send(null);
            }
        ], function () {
            callback({position : points, normal : normals});
        });
    },

    vertexShader : `
        uniform float size;
        uniform float rgb;
        uniform float lighting;
        
        attribute vec3 customColor;
        attribute float id;
        
        varying vec3 vColor;
        varying vec3 vCameraDirection;
        varying vec3 n;
        varying vec3 grandAxe;
        varying vec3 worldPosition;
        varying float spriteSize;
        
        void main() {
            n = normalize(normalMatrix * normal);
            float dotproduct = mix(1.0, dot(n, normalize(vec3(200.0, 200.0, 1000.0))), lighting);
            float absDot = 0.2 + 0.8 * abs(dotproduct);
            spriteSize = size;
        
            vec3 realColor = mix(vec3(1.0, 1.0, 1.0), customColor, rgb);
            vColor = realColor * absDot;
        
            vec3 cameraPosition = -vec3(viewMatrix[3]);
            vCameraDirection = normalize(cameraPosition - (modelViewMatrix * vec4(position, 1.0)).xyz);
        
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = size / length(mvPosition.xyz);
            
            grandAxe = normalize(cross(vCameraDirection, n));
        }`,

    fragmentShader : `
        uniform vec3 color;
        uniform float opacity;
        uniform int culling;
        
        varying vec3 vColor;
        varying vec3 vCameraDirection;
        varying vec3 n;
        varying float spriteSize;
        
        void main() {
            if ((culling == 1) && (n.z < -0.1)) discard;
        
            float cosTheta = max(abs(dot(normalize(n), normalize(vCameraDirection))), 0.00001);
            vec2 positionFrag = 2.0 * (gl_PointCoord - 0.5);
        
            float distanceSquared = pow(positionFrag.x, 2.0) + pow(positionFrag.y / cosTheta, 2.0);
            if (distanceSquared > 1.0) discard;
        
            vec3 lightDir = normalize(vCameraDirection);
            float intensity = max(dot(n, lightDir), 0.0);
            vec3 lightColor = color * intensity;
        
            gl_FragColor = vec4(lightColor * vColor, opacity);
        }`
};

const prom = Promise.promisify ? Promise.promisify : require( 'util').promisify;
THREE.BINLoader.prototype.loadAsync = prom( THREE.BINLoader.prototype.load );
} )();


const { desk , THREE, require, async } = window;
const viewer = new desk.THREE.Viewer();
const loader = new THREE.BINLoader();

function after( err, cloud ) {
    console.log( cloud );
    viewer.addMesh( cloud)

    
    
}

loader.load( desk.FileSystem.getFileURL( "code/pointCloud" ), {size : 50}, after );
