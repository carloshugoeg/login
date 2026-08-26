import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RandomCodeGenerator } from '../../src/infrastructure/security/RandomCodeGenerator.js';

describe('RandomCodeGenerator', () => {
  it('produce códigos seguros para una URL', () => {
    const code = new RandomCodeGenerator().generate();
    assert.match(code, /^[A-Za-z0-9_-]+$/);
    assert.equal(code, encodeURIComponent(code));
  });

  it('produce códigos de longitud estable y no triviales', () => {
    assert.equal(new RandomCodeGenerator({ byteLength: 32 }).generate().length, 43);
  });

  it('no repite códigos', () => {
    const generator = new RandomCodeGenerator();
    const codes = new Set(Array.from({ length: 500 }, () => generator.generate()));
    assert.equal(codes.size, 500);
  });
});
