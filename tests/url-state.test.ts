import { describe,expect,it } from "vitest";
import { buildAppUrl, parseAppUrl } from "@/core/url-state";
describe("url state",()=>{
  it("builds a query-string url for a plain app open",()=>{expect(buildAppUrl("tools")).toBe("/?app=tools")});
  it("builds a query-string url with an item payload",()=>{expect(buildAppUrl("projects",{item:"riscv-cpu"})).toBe("/?app=projects&item=riscv-cpu")});
  it("builds a pretty path for a note with an item payload",()=>{expect(buildAppUrl("notes",{item:"my-note"})).toBe("/notes/my-note")});
  it("parses a note path",()=>{expect(parseAppUrl("/notes/my-note","")).toEqual({appId:"notes",item:"my-note"})});
  it("parses an app+item query string",()=>{expect(parseAppUrl("/","?app=projects&item=x")).toEqual({appId:"projects",item:"x"})});
  it("rejects an unknown app id",()=>{expect(parseAppUrl("/","?app=nonexistent")).toBeNull()});
  it("returns null when there is nothing to parse",()=>{expect(parseAppUrl("/","")).toBeNull()});
});
