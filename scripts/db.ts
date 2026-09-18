import postgres from "postgres";
export function database() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL in .env.local.");
  return postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    ssl: "require",
    connect_timeout: 15,
    onnotice: () => {},
  });
}
