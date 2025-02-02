import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js';
import * as fflate from 'three/addons/libs/fflate.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VolumeRenderShader1 } from 'three/addons/shaders/VolumeShader.js';

window.NRRDLoader = NRRDLoader;
window.fflate = fflate;
window.OrbitControls = OrbitControls;
window.VolumeRenderShader1 = VolumeRenderShader1;
