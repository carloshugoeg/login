export class UserController {
  #listUsers;

  constructor({ listUsers }) {
    this.#listUsers = listUsers;
    this.index = this.index.bind(this);
  }

  async index(_req, res) {
    const users = await this.#listUsers.execute();
    res.json({ users: users.map((user) => user.toPublicJSON()) });
  }
}
