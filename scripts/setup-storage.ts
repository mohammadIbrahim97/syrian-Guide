import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";

const BUCKETS = ["avatars", "gallery"];

async function main() {
  const admin = createAdminClient();
  const { data: buckets, error: listErr } = await admin.storage.listBuckets();
  if (listErr) throw listErr;

  for (const name of BUCKETS) {
    if (buckets.some((b) => b.name === name)) {
      console.log(`Bucket "${name}" already exists — nothing to do.`);
      continue;
    }

    const { error } = await admin.storage.createBucket(name, { public: true });
    if (error) throw error;
    console.log(`Created public bucket "${name}".`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
