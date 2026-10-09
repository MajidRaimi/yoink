import { llmsIndex } from "@/features/seo/llms";

export const dynamic = "force-static";

export const GET = (): Response =>
  new Response(llmsIndex(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
