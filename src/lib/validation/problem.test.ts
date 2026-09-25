import { describe, expect, it } from "vitest";
import { locationToJson, problemSchema } from "./problem";
describe("problemSchema", () => {
  it("accepts a valid editable problem", () => { expect(problemSchema.safeParse({ title: "Transit reliability", description: "Service is uneven during high-demand periods.", status: "draft", location: "Central district" }).success).toBe(true); });
  it("rejects invalid status and underspecified values", () => { expect(problemSchema.safeParse({ title: "x", description: "short", status: "other", location: "" }).success).toBe(false); });
  it("keeps optional location context explicit", () => { expect(locationToJson("  North district ")).toEqual({ label: "North district" }); expect(locationToJson("")).toBeNull(); });
});
