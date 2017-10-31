import Parser from "./parser"
import Nester from "./nester"
import * as fs from "fs"

const svgString = fs.readFileSync("fixtures/test.svg").toString()

const parser = new Parser(svgString)
parser.clean()

const nester = new Nester()
nester.getParts(parser.svg.children)
