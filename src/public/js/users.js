import { getJson } from './api.js';

const table = document.getElementById('users-table');
const empty = document.getElementById('users-empty');
const error = document.getElementById('users-error');

try {
  const { users } = await getJson('/api/users');
  if (users.length === 0) {
    empty.hidden = false;
  } else {
    table.querySelector('tbody').append(...users.map(toRow));
    table.hidden = false;
  }
} catch {
  error.textContent = 'No pudimos cargar la lista de usuarios.';
  error.hidden = false;
}

function toRow(user) {
  const row = document.createElement('tr');
  for (const value of [
    user.email,
    user.firstName,
    user.lastName,
    user.age,
    new Date(user.verifiedAt).toLocaleString('es'),
  ]) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }
  return row;
}
