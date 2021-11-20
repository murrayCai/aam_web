#!/usr/bin/env node

'use strict';

/* eslint-env es6 */
/* eslint-disable no-console */

// node.js switched to chromium zlib implementation in version v12.17.0,
// which generates slightly different fixtures.
// https://github.com/nodejs/node/pull/31201
//
// so we create fixtures generated by older node.js versions

const ver = process.version.match(/^v(\d+)\.(\d+)\.\d+$/);

if (!(+ver[1] < 12 || +ver[1] === 12 && +ver[2] <= 16)) {
  throw new Error('Please use node.js <= 12.16.x to generate these fixtures');
}

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const sample = fs.readFileSync(path.join(__dirname, '../test/fixtures/samples/lorem_en_100k.txt'));

let dirname = path.join(__dirname, '../test/fixtures/binary_compare');
if (!fs.existsSync(dirname)) fs.mkdirSync(dirname);


function createSample(method, options, filename) {
  let file = path.join(dirname, filename);
  let data = zlib[method](sample, options);
  fs.writeFileSync(file, zlib[method](sample, options));
  console.log(file, data.length);
}


createSample('deflateSync', {}, 'deflate.bin');
createSample('deflateRawSync', {}, 'deflateRaw.bin');
createSample('gzipSync', {}, 'gzip.bin');
createSample('deflateSync', { level: 9 }, 'deflate_level=9.bin');
createSample('deflateSync', { level: 8 }, 'deflate_level=8.bin');
createSample('deflateSync', { level: 7 }, 'deflate_level=7.bin');
createSample('deflateSync', { level: 6 }, 'deflate_level=6.bin');
createSample('deflateSync', { level: 5 }, 'deflate_level=5.bin');
createSample('deflateSync', { level: 4 }, 'deflate_level=4.bin');
createSample('deflateSync', { level: 3 }, 'deflate_level=3.bin');
createSample('deflateSync', { level: 2 }, 'deflate_level=2.bin');
createSample('deflateSync', { level: 1 }, 'deflate_level=1.bin');
createSample('deflateSync', { level: -1 }, 'deflate_level=-1.bin');
createSample('deflateSync', { windowBits: 15 }, 'deflate_windowBits=15.bin');
createSample('deflateSync', { windowBits: 14 }, 'deflate_windowBits=14.bin');
createSample('deflateSync', { windowBits: 13 }, 'deflate_windowBits=13.bin');
createSample('deflateSync', { windowBits: 12 }, 'deflate_windowBits=12.bin');
createSample('deflateSync', { windowBits: 11 }, 'deflate_windowBits=11.bin');
createSample('deflateSync', { windowBits: 10 }, 'deflate_windowBits=10.bin');
createSample('deflateSync', { windowBits: 9 }, 'deflate_windowBits=9.bin');
createSample('deflateSync', { windowBits: 8 }, 'deflate_windowBits=8.bin');
createSample('deflateRawSync', { windowBits: 15 }, 'deflateRaw_windowBits=15.bin');
createSample('deflateSync', { memLevel: 9 }, 'deflate_memLevel=9.bin');
createSample('deflateSync', { memLevel: 8 }, 'deflate_memLevel=8.bin');
createSample('deflateSync', { memLevel: 7 }, 'deflate_memLevel=7.bin');
createSample('deflateSync', { memLevel: 6 }, 'deflate_memLevel=6.bin');
createSample('deflateSync', { memLevel: 5 }, 'deflate_memLevel=5.bin');
createSample('deflateSync', { memLevel: 4 }, 'deflate_memLevel=4.bin');
createSample('deflateSync', { memLevel: 3 }, 'deflate_memLevel=3.bin');
createSample('deflateSync', { memLevel: 2 }, 'deflate_memLevel=2.bin');
createSample('deflateSync', { memLevel: 1 }, 'deflate_memLevel=1.bin');
createSample('deflateSync', { strategy: 0 }, 'deflate_strategy=0.bin');
createSample('deflateSync', { strategy: 1 }, 'deflate_strategy=1.bin');
createSample('deflateSync', { strategy: 2 }, 'deflate_strategy=2.bin');
createSample('deflateSync', { strategy: 3 }, 'deflate_strategy=3.bin');
createSample('deflateSync', { strategy: 4 }, 'deflate_strategy=4.bin');
createSample('deflateRawSync', { level: 4 }, 'deflateRaw_level=4.bin');
createSample('deflateRawSync', { level: 1 }, 'deflateRaw_level=1.bin');

const dict = Buffer.from('abcdefghijklmnoprstuvwxyz');
createSample('deflateSync', { dictionary: dict }, 'deflate_dictionary=trivial.bin');

const spdyDict = fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'spdy_dict.txt'));
createSample('deflateSync', { dictionary: spdyDict }, 'deflate_dictionary=spdy.bin');
