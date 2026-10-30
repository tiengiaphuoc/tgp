import assert from 'node:assert/strict';
import {regionBounds,regionGuides} from '../src/hair-region.js';
assert.deepEqual(regionBounds({x:.2,y:.2,width:.6,height:.6},1000,800),{x:200,y:160,width:600,height:480});
assert.deepEqual(regionBounds({x:2,y:-1,width:.5,height:.5},100,100),{x:50,y:0,width:50,height:50});
assert.equal(Object.keys(regionGuides).length,5);
console.log('HAIR_REGION_MATH_PASS: normalized crop, clamped bounds, guidance for five regions.');
