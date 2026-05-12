import { localProvider } from "@/lib/llm/local-provider";
import type { GenerateRequest, GeneratedOutput, LlmProvider } from "@/lib/llm/types";

const providers: Record<string, LlmProvider> = {
  local: localProvider
};

export function listProviders() {
  return Object.values(providers).map((provider) => ({ id: provider.id, label: provider.label }));
}

export async function generateWithProvider(request: GenerateRequest): Promise<GeneratedOutput> {
  const providerId = request.provider || process.env.UPMYSKILLS_PROVIDER || "local";
  const provider = providers[providerId] ?? providers.local;
  return provider.generate(request);
}
