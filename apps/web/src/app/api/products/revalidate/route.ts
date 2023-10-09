import { revalidatePath } from "next/cache";

export const revalidate = 0;

export async function GET() {
  revalidatePath("/(app)/(browse)/browse", "page");
  return Response.json({ revalidated: true, now: Date.now() });
}