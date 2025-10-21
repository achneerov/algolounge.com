const db = require('../config/database');

class User {
  static async create({ username, email, password_hash }) {
    const [id] = await db('users').insert({
      username,
      email,
      password_hash
    });
    return this.findById(id);
  }

  static async findById(id) {
    return db('users').where({ id }).first();
  }

  static async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  static async findByUsername(username) {
    return db('users').where({ username }).first();
  }

  static async update(id, data) {
    await db('users').where({ id }).update(data);
    return this.findById(id);
  }

  static async delete(id) {
    return db('users').where({ id }).delete();
  }
}

module.exports = User;
