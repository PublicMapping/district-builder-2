import { abbreviateNumber } from "../commands/process-geojson";

describe("process geojson", () => {
  it("should abbreviate numbers", () => {
    expect(abbreviateNumber(0)).toEqual("0");
    expect(abbreviateNumber(5)).toEqual("5");
    expect(abbreviateNumber(10)).toEqual("10");
    expect(abbreviateNumber(99)).toEqual("99");
    expect(abbreviateNumber(100)).toEqual("100");
    expect(abbreviateNumber(999)).toEqual("999");
    expect(abbreviateNumber(1000)).toEqual("1k");
    expect(abbreviateNumber(1500)).toEqual("1.5k");
    expect(abbreviateNumber(9000)).toEqual("9k");
    expect(abbreviateNumber(9500)).toEqual("9.5k");
    expect(abbreviateNumber(9950)).toEqual("9.9k");
    expect(abbreviateNumber(9999)).toEqual("10k");
    expect(abbreviateNumber(99499)).toEqual("99k");
    expect(abbreviateNumber(99500)).toEqual("100k");
    expect(abbreviateNumber(100000)).toEqual("100k");
    expect(abbreviateNumber(110000)).toEqual("110k");
    expect(abbreviateNumber(150000)).toEqual("150k");
    expect(abbreviateNumber(999499)).toEqual("999k");
    expect(abbreviateNumber(999500)).toEqual("1m");
    expect(abbreviateNumber(1000000)).toEqual("1m");
    expect(abbreviateNumber(1500000)).toEqual("1.5m");
    expect(abbreviateNumber(999499999)).toEqual("999m");
    expect(abbreviateNumber(999500000)).toEqual("1b");
    expect(abbreviateNumber(1000000000)).toEqual("1b");
    expect(abbreviateNumber(999499999999)).toEqual("999b");
    expect(abbreviateNumber(999500000000)).toEqual("1t");
    expect(abbreviateNumber(1000000000000)).toEqual("1t");
  });
});
