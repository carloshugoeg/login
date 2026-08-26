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
import { createDatabase } from '../persistence/sqlite/Database.js';
import { SqlitePendingRegistrationRepository } from '../persistence/sqlite/SqlitePendingRegistrationRepository.js';
import { SqliteTransactionRunner } from '../persistence/sqlite/SqliteTransactionRunner.js';
import { SqliteUserRepository } from '../persistence/sqlite/SqliteUserRepository.js';
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher.js';
import { RandomCodeGenerator } from '../security/RandomCodeGenerator.js';

/**
 * Composition root: el ÚNICO archivo que elige implementaciones concretas.
 *
 * Cambiar de transporte de correo, de algoritmo de hash o añadir una regla
 * de validación se hace aquí; ni el dominio ni los casos de uso se enteran.
 */
export function buildContainer(env, overrides = {}) {
  const db = overrides.db ?? createDatabase(env.databasePath);

  const users = overrides.users ?? new SqliteUserRepository(db);
  const pendingRegistrations =
    overrides.pendingRegistrations ?? new SqlitePendingRegistrationRepository(db);
  const transactions = overrides.transactions ?? new SqliteTransactionRunner(db);

  const rules =
    overrides.rules ??
    new RuleSet([
      new EmailFormatRule(),
      new RequiredNameRule('firstName', 'El nombre'),
      new RequiredNameRule('lastName', 'Los apellidos'),
      new AgeRangeRule({ min: 13, max: 120 }),
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
    db,
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
      db.close();
    },
  };
}

