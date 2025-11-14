import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from './schema'

// This is a server-side only database client
// Use this for server actions and API routes, not in middleware or edge runtime
const sql = neon(process.env.DATABASE_URL!);
export const dbServer = drizzle(sql, { schema });
