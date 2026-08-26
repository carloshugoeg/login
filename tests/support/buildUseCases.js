import { ListUsers } from '../../src/application/ListUsers.js';
import { RegisterUser } from '../../src/application/RegisterUser.js';
import { ResendVerification } from '../../src/application/ResendVerification.js';
import { SendVerificationEmail } from '../../src/application/SendVerificationEmail.js';
import { VerifyRegistration } from '../../src/application/VerifyRegistration.js';
import { RuleSet } from '../../src/domain/validation/RuleSet.js';
import { AgeRangeRule } from '../../src/domain/validation/rules/AgeRangeRule.js';
import { EmailFormatRule } from '../../src/domain/validation/rules/EmailFormatRule.js';
import { PasswordStrengthRule } from '../../src/domain/validation/rules/PasswordStrengthRule.js';
import { RequiredNameRule } from '../../src/domain/validation/rules/RequiredNameRule.js';
import { VerificationEmailTemplate } from '../../src/infrastructure/mail/templates/VerificationEmailTemplate.js';
import { InMemoryPendingRegistrationRepository } from '../../src/infrastructure/persistence/memory/InMemoryPendingRegistrationRepository.js';
import { InMemoryTransactionRunner } from '../../src/infrastructure/persistence/memory/InMemoryTransactionRunner.js';
import { InMemoryUserRepository } from '../../src/infrastructure/persistence/memory/InMemoryUserRepository.js';
import { RandomCodeGenerator } from '../../src/infrastructure/security/RandomCodeGenerator.js';
import { FakeMailSender } from './FakeMailSender.js';
import { FakePasswordHasher } from './FakePasswordHasher.js';

/**
 * Los casos de uso sobre adaptadores en memoria: la prueba de que la
 * inversión de dependencias funciona (misma lógica, cero infraestructura).
 */
export function buildUseCases() {
  const users = new InMemoryUserRepository();
  const pendingRegistrations = new InMemoryPendingRegistrationRepository();
  const mailSender = new FakeMailSender();

  const sendVerificationEmail = new SendVerificationEmail({
    mailSender,
    template: new VerificationEmailTemplate(),
    baseUrl: 'http://localhost:3000',
  });

  const rules = new RuleSet([
    new EmailFormatRule(),
    new RequiredNameRule('firstName', 'El nombre'),
    new RequiredNameRule('lastName', 'Los apellidos'),
    new AgeRangeRule(),
    new PasswordStrengthRule(),
  ]);

  return {
    users,
    pendingRegistrations,
    mailSender,
    registerUser: new RegisterUser({
      rules,
      users,
      pendingRegistrations,
      passwordHasher: new FakePasswordHasher(),
      codeGenerator: new RandomCodeGenerator(),
      sendVerificationEmail,
    }),
    verifyRegistration: new VerifyRegistration({
      users,
      pendingRegistrations,
      transactions: new InMemoryTransactionRunner(),
    }),
    resendVerification: new ResendVerification({ pendingRegistrations, sendVerificationEmail }),
    listUsers: new ListUsers({ users }),
  };
}
