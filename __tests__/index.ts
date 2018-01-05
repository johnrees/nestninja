import "jest"
import Parser from "../src/parser";

it("works", () => {
  const p = new Parser('<svg><polygon points="0 0 5 5 10 10"></svg>');
  // expect(p.dom).toBeInstanceOf(Document)
  // expect(p.svg).toBeInstanceOf(SVGSVGElement)
  console.log(p)
  expect(p.svg.tagName).toEqual("svg")
});
