import { ListUsers } from '../../application/ListUsers.js';
import { RegisterUser } from '../../application/RegisterUser.js';
import { ResendVerification } from '../../application/ResendVerification.js';
import { SendVerificationEmail } from '../../application/SendVerificationEmail.js';
import { VerifyRegistration } from '../../application/VerifyRegistration.js';
import { RuleSet } from '../../domain/validation/RuleSet.js';
import { AgeRangeRule } from '../../domain/validation/rules/AgeRangeRule.js';
import { EmailFormatRule } from '../../domain/validation/rules/EmailFormatRule.js';
import { PasswordStrengthRule } from '../../domain/validation/rules/PasswordStrengthRule.js';
import { RequiredNameRule } from '../../domain/validation/rules/RequiredNameRule.js';
import { createMailSender } from '../mail/createMailSender.js';
import { VerificationEmailTemplate } from '../mail/templates/VerificationEmailTemplate.js';
import { createPersistence } from '../persistence/createPersistence.js';
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher.js';
import { RandomCodeGenerator } from '../security/RandomCodeGenerator.js';

/**
 * Composition root: compone los casos de uso con implementaciones concretas.
 *
 * No decide el motor de base de datos ni el transporte de correo: eso lo
 * hacen sus fábricas (`createPersistence`, `createMailSender`). Cambiar de
 * motor, de transporte o añadir una regla de validación no toca el dominio
 * ni los casos de uso.
 */
export async function buildContainer(env, overrides = {}) {
  const persistence = overrides.persistence ?? (await createPersistence(env));
  const { users, pendingRegistrations, transactions } = persistence;

  const rules =
    overrides.rules ??
    new RuleSet([
      new EmailFormatRule(),
      new RequiredNameRule('firstName', 'El nombre'),
      new RequiredNameRule('lastName', 'Los apellidos'),
      new AgeRangeRule({ min: 18, max: 120 }),
      new PasswordStrengthRule({ minLength: 8 }),
    ]);

  const mailSender = overrides.mailSender ?? createMailSender(env);
  const passwordHasher =
    overrides.passwordHasher ?? new BcryptPasswordHasher({ rounds: env.bcryptRounds });
  const codeGenerator = overrides.codeGenerator ?? new RandomCodeGenerator();

  const sendVerificationEmail = new SendVerificationEmail({
    mailSender,
    template: new VerificationEmailTemplate(),
    baseUrl: env.baseUrl,
  });

  return {
    pendingRegistrations,
    users,
    registerUser: new RegisterUser({
      rules,
      users,
      pendingRegistrations,
      passwordHasher,
      codeGenerator,
      sendVerificationEmail,
    }),
    verifyRegistration: new VerifyRegistration({ users, pendingRegistrations, transactions }),
    resendVerification: new ResendVerification({ pendingRegistrations, sendVerificationEmail }),
    listUsers: new ListUsers({ users }),
    close() {
      return persistence.close();
    },
  };
}

