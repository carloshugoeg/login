/** Devuelve las cuentas verificadas. */
export class ListUsers {
  #users;

  constructor({ users }) {
    this.#users = users;
  }

  execute() {
    return this.#users.findAll();
  }
}
