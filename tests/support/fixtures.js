export function validInput(overrides = {}) {
  return {
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Pérez Gómez',
    age: 30,
    password: 'secreta123',
    ...overrides,
  };
}
