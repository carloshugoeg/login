/** Devuelve las cuentas verificadas. */
export class ListUsers {
  #users;

  constructor({ users }) {
    this.#users = users;
  }

  async execute() {
    return this.#users.findAll();
  }
}
