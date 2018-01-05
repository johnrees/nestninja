import * as fs from "fs"
import * as cheerio from "cheerio"
import * as Rx from "rxjs"
import { promisify } from "util"

const file$ = Rx.Observable.of("fixtures/test.svg")

// const svgString = fs.readFileSync("fixtures/test.svg").toString()
// const $ = cheerio.load(svgString);
// const svg = $('#svg2');

function applyTransform($, element, globalTransform=""):void {
  let transformString = $(element).attr('transform') || "";
  transformString = globalTransform.concat(transformString);
  // // let transform;
  // // if (transformString && transformString.length > 0) {
  // // }
  // console.log({transformString})
  // console.log(element.prop('tagName'))

  if (element.prop('tagName') === "G" || element.prop('tagName') === "SVG") {
    element.removeAttr('transform')
    element.children().each(function(index, child) {
      child = applyTransform($, $(child), transformString)
    })
  }

  return element
}

function flatten($, element):void {
  element.children().each(function(index, child) {
    flatten($, $(child))
    if (element.prop('tagName') !== "SVG") {
      while(element.children.length > 0) {
        element.parent.appendChild(element.children[0])
      }
    }
  })
}

file$
  .switchMap(fileName => promisify(fs.readFile)(fileName))
  .map(binary => binary.toString())
  .map(file => cheerio.load(file))
  .map($ => applyTransform($, $('#svg2')))
  .subscribe(console.log)

// applyTransform(svg)
// flatten(svg)
// console.log(svg.html())
