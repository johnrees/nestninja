import Parser from "./parser"
import Nester from "./nester"
import * as fs from "fs"

const svgString = fs.readFileSync("fixtures/test.svg").toString()

const parser = new Parser(svgString)
parser.clean()

for (var i = 0; i < parser.svg.children.length; i++) {
  console.log(parser.svg.children[i].tagName)
}

// const nester = new Nester()
// nester.getParts(parser.svg.children)
