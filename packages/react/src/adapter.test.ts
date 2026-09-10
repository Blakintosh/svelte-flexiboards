import { describe, it, expect } from "vitest";
import { parseStyleString } from "./adapter.js";

describe("parseStyleString", () => {
  it("camel-cases properties and keeps custom properties verbatim", () => {
    expect(
      parseStyleString("grid-column: 1 / span 2; --fx-gap: 4px; opacity:0.5"),
    ).toEqual({
      gridColumn: "1 / span 2",
      "--fx-gap": "4px",
      opacity: "0.5",
    });
  });

  it("ignores empty declarations and values containing colons", () => {
    expect(parseStyleString(";; background: url(http://x/y.png);")).toEqual({
      background: "url(http://x/y.png)",
    });
    expect(parseStyleString("")).toEqual({});
  });
});
