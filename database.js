import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing');
}

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 15
});

export const db = {
  async list() {
    return await sql`
      SELECT id, name, status
      FROM public.projects
      ORDER BY id DESC
    `;
  },

  async create({ name, status }) {
    const [project] = await sql`
      INSERT INTO public.projects (name, status)
      VALUES (${name}, ${status})
      RETURNING id, name, status
    `;

    return project;
  },

  async update(id, { name, status }) {
    const [project] = await sql`
      UPDATE public.projects
      SET name = ${name}, status = ${status}
      WHERE id = ${id}
      RETURNING id, name, status
    `;

    return project ?? null;
  },

  async remove(id) {
    const deleted = await sql`
      DELETE FROM public.projects
      WHERE id = ${id}
      RETURNING id
    `;

    return deleted.length > 0;
  }
};