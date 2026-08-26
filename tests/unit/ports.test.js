import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotImplementedError } from '../../src/domain/errors/NotImplementedError.js';
import { CodeGenerator } from '../../src/domain/ports/CodeGenerator.js';
import { MailSender } from '../../src/domain/ports/MailSender.js';
import { UserRepository } from '../../src/domain/ports/UserRepository.js';

describe('puertos', () => {
  it('un adaptador incompleto falla de forma explícita', () => {
    class RepoAMedias extends UserRepository {}
    assert.throws(() => new RepoAMedias().existsByEmail('a@b.co'), NotImplementedError);
    assert.throws(() => new CodeGenerator().generate(), NotImplementedError);
    assert.rejects(() => new MailSender().send({}), NotImplementedError);
  });
});
