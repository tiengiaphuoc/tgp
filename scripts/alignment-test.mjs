import assert from 'node:assert/strict';import {latestForAngle,cameraCrop} from '../src/scan-alignment.js';
const photos=[{id:'1',angle:'Đường ngôi'},{id:'2',angle:'Đỉnh đầu'},{id:'3',angle:'Đường ngôi'}];assert.equal(latestForAngle(photos,'Đường ngôi').id,'3');assert.equal(latestForAngle(photos,'Đỉnh đầu').id,'2');assert.equal(latestForAngle(photos,'Thái dương trái'),null);
for(const [w,h,r]of [[1920,1080,.75],[1080,1920,1],[800,600,4/3]]){const c=cameraCrop(w,h,r);assert(Math.abs(c.width/c.height-r)<1e-8);assert(c.x>=0&&c.y>=0&&c.x+c.width<=w&&c.y+c.height<=h);assert(Math.abs(c.x*2+c.width-w)<1e-8);assert(Math.abs(c.y*2+c.height-h)<1e-8);}
console.log('ALIGNMENT_MATH_PASS: latest matching region and centered camera crops.');
