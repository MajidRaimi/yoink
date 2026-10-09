import { llmsFull } from "@/features/seo/llms";

export const dynamic = "force-static";

export const GET = (): Response =>
  new Response(llmsFull(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
