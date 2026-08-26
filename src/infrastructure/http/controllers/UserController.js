export class UserController {
  #listUsers;

  constructor({ listUsers }) {
    this.#listUsers = listUsers;
    this.index = this.index.bind(this);
  }

  index(_req, res) {
    res.json({ users: this.#listUsers.execute().map((user) => user.toPublicJSON()) });
  }
}
