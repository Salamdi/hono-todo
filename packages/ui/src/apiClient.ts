import type { ApiType } from '@todo/api';
import { hc } from 'hono/client';

export const client = hc<ApiType>('/api');


