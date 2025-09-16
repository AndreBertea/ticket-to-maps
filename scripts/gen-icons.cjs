#!/usr/bin/env node
// Generate simple solid-color PNG icons (192, 512) without external deps
// Uses zlib to compress and a small CRC32 implementation
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([t, data]));
  crc.writeUInt32BE(crcVal >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}

function pngSolid(width, height, rgba) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw image: each row starts with filter byte 0, then pixels RGBA
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const off = y * rowLen;
    raw[off] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const o = off + 1 + x * 4;
      raw[o + 0] = rgba[0];
      raw[o + 1] = rgba[1];
      raw[o + 2] = rgba[2];
      raw[o + 3] = rgba[3];
    }
  }
  const compressed = zlib.deflateSync(raw);
  const idat = chunk('IDAT', compressed);
  const ihdrChunk = chunk('IHDR', ihdr);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idat, iend]);
}

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

const outDir = path.resolve(process.cwd(), 'public', 'icons');
ensureDir(outDir);

// Colors: slate brand with slight opacity
const ICONS = [
  { name: 'icon-192.png', w: 192, h: 192, rgba: [15, 23, 42, 255] },
  { name: 'icon-512.png', w: 512, h: 512, rgba: [15, 23, 42, 255] },
];

for (const i of ICONS) {
  const buf = pngSolid(i.w, i.h, i.rgba);
  const p = path.join(outDir, i.name);
  fs.writeFileSync(p, buf);
}

console.log('Icons generated at public/icons');

