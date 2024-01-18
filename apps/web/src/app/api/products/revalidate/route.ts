import { revalidatePath } from "next/cache";

export async function GET() {
  revalidatePath("/(app)/(browse)/search", "page");
  return Response.json({ revalidated: true, now: Date.now() });
}
