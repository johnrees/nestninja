import Parser from "./parser"

export default class Nester {
  // assuming no intersections, return a tree where odd leaves are parts
  // and even ones are holes might be easier to use the DOM,
  // but paths can't have paths as children. So we'll just make our own tree.
  getParts(paths:HTMLCollection) {
    // let i:number, j:number;
    // let polygons = [];
    for (let i = 0; i < paths.length; i++) {
      let poly = Parser.polygonify(paths[i])
      console.log(poly)
    }
  }
}
