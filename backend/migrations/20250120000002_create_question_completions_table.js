exports.up = function(knex) {
  return knex.schema.createTable('question_completions', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('question_id', 100).notNullable(); // JSON question identifier
    table.timestamp('completed_at').defaultTo(knex.fn.now());

    // Foreign key constraint
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Ensure a user can only complete a question once
    table.unique(['user_id', 'question_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('question_completions');
};
