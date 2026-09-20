import { DealActions } from "./actions";
import { useDealStore } from "./store";
import { categories, deals, type Category } from "./data";
import { filterDeals } from "./model";
interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
}
export function registerDealTools() {
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (
          tool: Tool,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    }
  ).modelContext;
  if (!context) return;
  const lifecycle = new AbortController();
  const register = (tool: Tool) => {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Unsupported experimental API must not affect the UI. */
    }
  };
  register({
    name: "search_dealmap_deals",
    description:
      "Filter the visible sample franchise deals and map pins by query and category.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string", enum: categories },
      },
      required: ["query", "category"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute(input) {
      const v = input as { query?: unknown; category?: unknown };
      if (
        !v ||
        typeof v.query !== "string" ||
        typeof v.category !== "string" ||
        !categories.includes(v.category as Category)
      )
        throw new Error(
          "A query and a supported Korean category are required.",
        );
      DealActions.resetFilters();
      DealActions.setQuery(v.query);
      DealActions.setCategory(v.category as Category);
      return {
        sample: true,
        deals: filterDeals(deals, useDealStore.getState()).map((d) => ({
          id: d.id,
          brand: d.brand,
          title: d.title,
        })),
      };
    },
  });
  register({
    name: "read_dealmap_records",
    description: "Read personal coupon and stamp records saved on this device.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute() {
      return { deviceLocal: true, records: useDealStore.getState().rewards };
    },
  });
  return () => lifecycle.abort();
}
