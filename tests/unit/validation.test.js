import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RuleSet } from '../../src/domain/validation/RuleSet.js';
import { AgeRangeRule } from '../../src/domain/validation/rules/AgeRangeRule.js';
import { EmailFormatRule } from '../../src/domain/validation/rules/EmailFormatRule.js';
import { PasswordStrengthRule } from '../../src/domain/validation/rules/PasswordStrengthRule.js';
import { RequiredNameRule } from '../../src/domain/validation/rules/RequiredNameRule.js';
import { validInput } from '../support/fixtures.js';

describe('EmailFormatRule', () => {
  const rule = new EmailFormatRule();

  it('acepta un correo con formato válido', () => {
    assert.deepEqual(rule.validate({ email: 'ana@example.com' }), []);
  });

  it('exige el correo', () => {
    assert.equal(rule.validate({ email: '   ' }).length, 1);
    assert.equal(rule.validate({}).length, 1);
  });

  it('rechaza formatos inválidos', () => {
    for (const email of ['ana', 'ana@', '@example.com', 'ana@example', 'a b@example.com']) {
      assert.equal(rule.validate({ email }).length, 1, `debería rechazar ${email}`);
    }
  });
});

describe('RequiredNameRule', () => {
  const rule = new RequiredNameRule('firstName', 'El nombre');

  it('se asocia al campo que le configuran', () => {
    assert.equal(rule.field, 'firstName');
    assert.equal(new RequiredNameRule('lastName', 'Los apellidos').field, 'lastName');
  });

  it('acepta un nombre normal', () => {
    assert.deepEqual(rule.validate({ firstName: 'Ana' }), []);
  });

  it('rechaza vacío y demasiado largo', () => {
    assert.equal(rule.validate({ firstName: '  ' }).length, 1);
    assert.equal(rule.validate({ firstName: 'a'.repeat(81) }).length, 1);
  });
});

describe('AgeRangeRule', () => {
  const rule = new AgeRangeRule({ min: 13, max: 120 });

  it('acepta los extremos del rango', () => {
    assert.deepEqual(rule.validate({ age: 13 }), []);
    assert.deepEqual(rule.validate({ age: 120 }), []);
  });

  it('acepta un entero enviado como texto', () => {
    assert.deepEqual(rule.validate({ age: '30' }), []);
  });

  it('rechaza fuera de rango, decimales y no numéricos', () => {
    assert.equal(rule.validate({ age: 12 }).length, 1);
    assert.equal(rule.validate({ age: 121 }).length, 1);
    assert.equal(rule.validate({ age: 30.5 }).length, 1);
    assert.equal(rule.validate({ age: 'treinta' }).length, 1);
    assert.equal(rule.validate({ age: '' }).length, 1);
  });
});

describe('PasswordStrengthRule', () => {
  const rule = new PasswordStrengthRule({ minLength: 8 });

  it('acepta una contraseña con letra y dígito', () => {
    assert.deepEqual(rule.validate({ password: 'secreta123' }), []);
  });

  it('acumula todos los defectos de una vez', () => {
    assert.equal(rule.validate({ password: '...' }).length, 3);
  });
});

describe('RuleSet', () => {
  it('no devuelve errores cuando la entrada es válida', () => {
    const result = ruleSet().validate(validInput());
    assert.ok(result.isValid);
    assert.deepEqual(result.errors, {});
  });

  it('acumula errores de varios campos sin cortar en el primero', () => {
    const result = ruleSet().validate({ email: 'nope', firstName: '', lastName: '', age: 5, password: 'x' });
    assert.equal(result.isValid, false);
    assert.deepEqual(Object.keys(result.errors).sort(), ['age', 'email', 'firstName', 'lastName', 'password']);
  });

  it('acepta una regla nueva sin modificar RuleSet (OCP)', () => {
    const reglaDeSimbolo = {
      field: 'password',
      validate: ({ password }) =>
        /[^\w\s]/.test(password ?? '') ? [] : ['La contraseña debe incluir un símbolo.'],
    };
    const result = new RuleSet([new PasswordStrengthRule(), reglaDeSimbolo]).validate(validInput());
    assert.deepEqual(result.errors.password, ['La contraseña debe incluir un símbolo.']);
  });
});

function ruleSet() {
  return new RuleSet([
    new EmailFormatRule(),
    new RequiredNameRule('firstName', 'El nombre'),
    new RequiredNameRule('lastName', 'Los apellidos'),
    new AgeRangeRule(),
    new PasswordStrengthRule(),
  ]);
}
