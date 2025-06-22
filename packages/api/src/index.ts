import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import type { JwtVariables } from 'hono/jwt';
import { verify } from 'hono/jwt';
import { db } from './db/index.js';
import { todosTable, usersTable } from './db/schema.js';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';
import { eq } from 'drizzle-orm';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { HTTPException } from 'hono/http-exception';

const api = new Hono<{ Variables: JwtVariables }>();

const postUsers = api.post(
  '/users',
  zValidator(
    'json',
    z.object({
      username: z.string().min(3),
    }),
  ),
  async (c) => {
    const { username } = c.req.valid('json');
    try {
      const users = await db
        .insert(usersTable)
        .values({ username })
        .returning();
      const payload = { username, id: users[0].id };
      const token = await sign(payload, process.env.JWT_SECRET!);
      return c.json(
        {
          ...users[0],
          token,
        },
        201,
      );
    } catch (err) {
      if (err instanceof DrizzleQueryError) {
        return c.json(
          {
            error: `username "${username}" already exists`,
          },
          400,
        );
      }
      throw new HTTPException(500);
    }
  },
);

const authLogin = api.post(
  '/auth/login',
  zValidator(
    'json',
    z.object({
      username: z.string().min(3),
    }),
  ),
  async (c) => {
    const { username } = c.req.valid('json');
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (users.length === 0) {
      return c.json({ error: `user "${username}" not found` }, 404);
    }
    const payload = { username, id: users[0].id };
    const token = await sign(payload, process.env.JWT_SECRET!);
    return c.json({ token });
  },
);

api.use(
  '*',
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
);

const getUsers = api.get('/users', async (c) => {
  const users = await db.select().from(usersTable);
  return c.json(users);
});

const getTodos = api.get('/todos', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Token is not found' }, 401);
  }
  const token = authHeader.slice(7);
  const payload = await verify(token, process.env.JWT_SECRET!);
  const todos = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.userId, payload.id as number));
  return c.json(todos);
});

const getTodo = api.get(
  '/todos/:id',
  zValidator(
    'param',
    z.object({
      id: z.coerce.number().int().positive(),
    }),
  ),
  async (c) => {
    const id = c.req.param('id');
    const todos = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.id, parseInt(id)));
    if (todos.length === 0) {
      return c.json({ error: `todo "${id}" not found` }, 404);
    }
    return c.json(todos[0]);
  },
);

const postTodos = api.post(
  '/todos',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1),
      body: z.string(),
    }),
  ),
  async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Token is not found' }, 401);
    }
    const token = authHeader.slice(7);
    const payload = await verify(token, process.env.JWT_SECRET!);
    const newTodo = c.req.valid('json');
    const todos = await db
      .insert(todosTable)
      .values({ ...newTodo, userId: payload.id as number })
      .returning();
    return c.json(todos[0], 201);
  },
);

const deleteTodos = api.delete(
  '/todos',
  zValidator(
    'json',
    z.object({
      id: z.number().int().positive(),
    }),
  ),
  async (c) => {
    const { id } = c.req.valid('json');
    const todos = await db
      .delete(todosTable)
      .where(eq(todosTable.id, id))
      .returning();
    if (todos.length === 0) {
      return c.json({ error: `todo "${id}" not found` }, 404);
    }
    return c.json(todos[0]);
  },
);

const patchTodos = api.patch(
  '/todos',
  zValidator(
    'json',
    z.object({
      id: z.number().int().positive(),
      title: z.string().min(1).optional(),
      body: z.string().optional(),
      status: z.enum(['inprogress', 'completed']).optional(),
    }),
  ),
  async (c) => {
    const todo = c.req.valid('json');
    const todos = await db
      .update(todosTable)
      .set(todo)
      .where(eq(todosTable.id, todo.id))
      .returning();
    if (todos.length === 0) {
      return c.json({ error: `todo "${todo.id}" not found` }, 404);
    }
    return c.json(todos[0]);
  },
);

const app = new Hono();

app.route('/api', api);

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

export type ApiType = typeof postUsers &
  typeof authLogin &
  typeof getUsers &
  typeof getTodos &
  typeof getTodo &
  typeof postTodos &
  typeof deleteTodos &
  typeof patchTodos;
