import * as jsdom from "jsdom";
import Matrix from "./lib/matrix";
import { recurse } from "./lib/utils";
import GeometryUtil from "./lib/geometryutil";

type Point = {
  x: number;
  y: number;
};

const conf = {
  // max bound for bezier->line segment conversion, in native SVG units
  tolerance: 2,
  // fudge factor for browser inaccuracy in SVG unit handling
  toleranceSvg: 0.005
};

export default class Parser {
  dom: Document;
  svg: SVGSVGElement;
  allowedElements: string[] = [
    "svg",
    "circle",
    "ellipse",
    "path",
    "polygon",
    "polyline",
    "rect"
  ];

  constructor(svgString: string) {
    this.dom = new jsdom.JSDOM(svgString).window.document;
    this.svg = this.dom.querySelector("svg");
  }

  // recursively apply the transform property to the given element
  private transformParse(transformString: string) {
    // const operations = {
    //   matrix: true,
    //   scale: true,
    //   rotate: true,
    //   translate: true,
    //   skewX: true,
    //   skewY: true
    // };
    const CMD_SPLIT_RE = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
    // const PARAMS_SPLIT_RE = /[\s,]+/;
    // var cmd, params;
    const matrix = new Matrix();

    // Split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate',  '-45', '']
    transformString.split(CMD_SPLIT_RE).forEach(item => {
      // Skip empty elements
      if (!item.length) {
        return;
      }

      //   // remember operation
      //   if (typeof operations[item] !== 'undefined') {
      //   cmd = item;
      //   return;
      //   }

      //   // extract params & att operation to matrix
      //   params = item.split(PARAMS_SPLIT_RE).map(function (i) {
      //   return +i || 0;
      //   });

      //   // If params count is not correct - ignore command
      //   switch (cmd) {
      //     case 'matrix':
      //       if (params.length === 6) {
      //         matrix.matrix(params);
      //       }
      //       return;

      //     case 'scale':
      //       if (params.length === 1) {
      //         matrix.scale(params[0], params[0]);
      //       } else if (params.length === 2) {
      //         matrix.scale(params[0], params[1]);
      //       }
      //     return;

      //     case 'rotate':
      //       if (params.length === 1) {
      //         matrix.rotate(params[0], 0, 0);
      //       } else if (params.length === 3) {
      //         matrix.rotate(params[0], params[1], params[2]);
      //       }
      //     return;

      //     case 'translate':
      //       if (params.length === 1) {
      //         matrix.translate(params[0], 0);
      //       } else if (params.length === 2) {
      //         matrix.translate(params[0], params[1]);
      //       }
      //     return;

      //     case 'skewX':
      //       if (params.length === 1) {
      //         matrix.skewX(params[0]);
      //       }
      //     return;

      //     case 'skewY':
      //       if (params.length === 1) {
      //         matrix.skewY(params[0]);
      //       }
      //     return;
      //   }
    });

    return matrix;
  }

  private applyTransform(element: any, globalTransform = ""): void {
    let transformString: string = element.getAttribute("transform") || "";
    transformString = globalTransform.concat(transformString);

    let transform: any;
    if (transformString && transformString.length > 0) {
      transform = this.transformParse(transformString);
    } else {
      transform = new Matrix();
    }

    // if (element instanceof SVGGElement || element instanceof SVGSVGElement) {
    if (element.tagName === "g" || element.tagName === "svg") {
      element.removeAttribute("transform");
      const children = Array.prototype.slice.call(element.children);
      for (let i = 0; i < children.length; i++) {
        this.applyTransform(children[i], transformString);
      }
    } else if (transform && !transform.isIdentity()) {
      console.log("B");
    }
  }

  // bring all child elements to the top level
  private flatten(element: SVGElement): void {
    for (let i = 0; i < element.children.length; i++) {
      this.flatten(<SVGElement>element.children[i]);
    }
    // if (!(element instanceof SVGSVGElement)) {
    if (element.tagName !== "svg") {
      while (element.children.length > 0) {
        element.parentElement.appendChild(element.children[0]);
      }
    }
  }

  // remove all elements with tag name not in the whitelist
  // use this to remove <text>, <g> etc that don't represent shapes
  private filter(
    whitelist: string[] = [],
    element: SVGElement = undefined
  ): void {
    element = element || this.svg;

    for (let i = 0; i < element.children.length; i++) {
      this.filter(whitelist, <SVGElement>element.children[i]);
    }

    if (
      element.children.length === 0 &&
      whitelist.indexOf(element.tagName) < 0
    ) {
      element.parentElement.removeChild(element);
    }
  }

  // split a compound path (paths with M, m commands) into an array of paths
  private splitPath(path: SVGPathElement) {
    const { pathSegList } = path;

    if (
      !path ||
      !pathSegList ||
      path.tagName != "path" ||
      !path.parentElement
    ) {
      return false;
    }

    // let x = 0,
    //   y = 0,
    //   x0 = 0,
    //   y0 = 0;
    // const paths = [];
    // let p;
    // let lastM = 0;

    for (var i = pathSegList.numberOfItems - 1; i >= 0; i--) {
      // console.log(i);
      // if (
      //   (i > 0 && pathSegList.getItem(i).pathSegTypeAsLetter == "M") ||
      //   pathSegList.getItem(i).pathSegTypeAsLetter == "m"
      // ) {
      //   lastM = i;
      //   break;
      // }
    }

    // if (lastM == 0) {
    //   return false; // only 1 M command, no need to split
    // }

    // for (i = 0; i < pathSegList.numberOfItems; i++) {
    //   var s = pathSegList.getItem(i);
    //   var command = s.pathSegTypeAsLetter;

    //   if (command == "M" || command == "m") {
    //     p = path.cloneNode();
    //     p.setAttribute("d", "");
    //     paths.push(p);
    //   }

    //   if (/[MLHVCSQTA]/.test(command)) {
    //     if ("x" in s) x = s.x;
    //     if ("y" in s) y = s.y;

    //     p.pathSegList.appendItem(s);
    //   } else {
    //     if ("x" in s) x += s.x;
    //     if ("y" in s) y += s.y;
    //     if (command == "m") {
    //       p.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(x, y));
    //     } else {
    //       if (command == "Z" || command == "z") {
    //         x = x0;
    //         y = y0;
    //       }
    //       p.pathSegList.appendItem(s);
    //     }
    //   }
    //   // Record the start of a subpath
    //   if (command == "M" || command == "m") {
    //     (x0 = x), (y0 = y);
    //   }
    // }

    // var addedPaths = [];
    // for (i = 0; i < paths.length; i++) {
    //   // don't add trivial paths from sequential M commands
    //   if (paths[i].pathSegList.numberOfItems > 1) {
    //     path.parentElement.insertBefore(paths[i], path);
    //     addedPaths.push(paths[i]);
    //   }
    // }

    // path.remove();

    // return addedPaths;
  }

  // return a polygon from the given SVG element
  // in the form of an array of points
  static polygonify(element: any): number[] {
    const poly = [];
    let i, cx, cy, num;

    console.log("POLY", element.tagName);

    switch (element.tagName) {
      case "polygon":
        element = element as SVGPolygonElement;
      case "polyline":
        // console.log(">>>", element.tagName);
        element = element as SVGPolylineElement;
        console.log(JSON.stringify(element))
        // for (i = 0; i < element.points.length; i++) {
        //   poly.push({
        //     x: element.points[i].x,
        //     y: element.points[i].y
        //   });
        // }
        break;
      case "rect":
        element = <SVGRectElement>element;
        let p1: Point;
        let p2: Point;
        let p3: Point;
        let p4: Point;

        p1.x = parseFloat(element.getAttribute("x")) || 0;
        p1.y = parseFloat(element.getAttribute("y")) || 0;

        p2.x = p1.x + parseFloat(element.getAttribute("width"));
        p2.y = p1.y;

        p3.x = p2.x;
        p3.y = p1.y + parseFloat(element.getAttribute("height"));

        p4.x = p1.x;
        p4.y = p3.y;

        poly.push(p1);
        poly.push(p2);
        poly.push(p3);
        poly.push(p4);
        break;
      case "circle":
        element = <SVGCircleElement>element;
        const radius = parseFloat(element.getAttribute("r"));
        cx = parseFloat(element.getAttribute("cx"));
        cy = parseFloat(element.getAttribute("cy"));

        // num is the smallest number of segments required to approximate the circle to the given tolerance
        num = Math.ceil(2 * Math.PI / Math.acos(1 - conf.tolerance / radius));

        if (num < 3) {
          num = 3;
        }

        for (i = 0; i < num; i++) {
          var theta = i * (2 * Math.PI / num);
          const point: Point = {
            x: radius * Math.cos(theta) + cx,
            y: radius * Math.sin(theta) + cy
          };
          poly.push(point);
        }
        break;
      case "ellipse":
        element = <SVGEllipseElement>element;
        // same as circle case. There is probably a way to reduce points but for convenience we will just flatten the equivalent circular polygon
        const rx = parseFloat(element.getAttribute("rx"));
        const ry = parseFloat(element.getAttribute("ry"));
        const maxradius = Math.max(rx, ry);

        cx = parseFloat(element.getAttribute("cx"));
        cy = parseFloat(element.getAttribute("cy"));

        num = Math.ceil(
          2 * Math.PI / Math.acos(1 - conf.tolerance / maxradius)
        );

        if (num < 3) {
          num = 3;
        }

        for (i = 0; i < num; i++) {
          var theta = i * (2 * Math.PI / num);
          var point: Point = {
            x: rx * Math.cos(theta) + cx,
            y: ry * Math.sin(theta) + cy
          };
          poly.push(point);
        }
        break;
      case "path":
        element = <SVGPathElement>element;
        // we'll assume that splitpath has already been run on this path, and it only has one M/m command
        var seglist = element.pathSegList;

        // var firstCommand = seglist.getItem(0);
        // var lastCommand = seglist.getItem(seglist.numberOfItems - 1);

        let x = 0,
          y = 0,
          x0 = 0,
          y0 = 0,
          x1 = 0,
          y1 = 0,
          x2 = 0,
          y2 = 0,
          prevx = 0,
          prevy = 0,
          prevx1 = 0,
          prevy1 = 0,
          prevx2 = 0,
          prevy2 = 0;

        for (i = 0; i < seglist.numberOfItems; i++) {
          var s = seglist.getItem(i);
          var command = s.pathSegTypeAsLetter;

          prevx = x;
          prevy = y;

          prevx1 = x1;
          prevy1 = y1;

          prevx2 = x2;
          prevy2 = y2;

          if (/[MLHVCSQTA]/.test(command)) {
            if ("x1" in s) x1 = s.x1;
            if ("x2" in s) x2 = s.x2;
            if ("y1" in s) y1 = s.y1;
            if ("y2" in s) y2 = s.y2;
            if ("x" in s) x = s.x;
            if ("y" in s) y = s.y;
          } else {
            if ("x1" in s) x1 = x + s.x1;
            if ("x2" in s) x2 = x + s.x2;
            if ("y1" in s) y1 = y + s.y1;
            if ("y2" in s) y2 = y + s.y2;
            if ("x" in s) x += s.x;
            if ("y" in s) y += s.y;
          }
          switch (command) {
            // linear line types
            case "m":
            case "M":
            case "l":
            case "L":
            case "h":
            case "H":
            case "v":
            case "V":
              poly.push({ x, y });
              break;
            // Quadratic Beziers
            case "t":
            case "T":
              // implicit control point
              if (
                i > 0 &&
                /[QqTt]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)
              ) {
                x1 = prevx + (prevx - prevx1);
                y1 = prevy + (prevy - prevy1);
              } else {
                x1 = prevx;
                y1 = prevy;
              }
            case "q":
            case "Q":
              var pointlist = GeometryUtil.QuadraticBezier.linearize(
                { x: prevx, y: prevy },
                { x: x, y: y },
                { x: x1, y: y1 },
                conf.tolerance
              );
              pointlist.shift(); // firstpoint would already be in the poly
              for (var j = 0; j < pointlist.length; j++) {
                poly.push({
                  x: pointlist[j].x,
                  y: pointlist[j].y
                });
              }
              break;
            case "s":
            case "S":
              if (
                i > 0 &&
                /[CcSs]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)
              ) {
                x1 = prevx + (prevx - prevx2);
                y1 = prevy + (prevy - prevy2);
              } else {
                x1 = prevx;
                y1 = prevy;
              }
            case "c":
            case "C":
              var pointlist = GeometryUtil.CubicBezier.linearize(
                { x: prevx, y: prevy },
                { x: x, y: y },
                { x: x1, y: y1 },
                { x: x2, y: y2 },
                conf.tolerance
              );
              pointlist.shift(); // firstpoint would already be in the poly
              for (var j = 0; j < pointlist.length; j++) {
                poly.push({
                  x: pointlist[j].x,
                  y: pointlist[j].y
                });
              }
              break;
            case "a":
            case "A":
              var pointlist = GeometryUtil.Arc.linearize(
                { x: prevx, y: prevy },
                { x: x, y: y },
                s.r1,
                s.r2,
                s.angle,
                s.largeArcFlag,
                s.sweepFlag,
                conf.tolerance
              );
              pointlist.shift();

              for (var j = 0; j < pointlist.length; j++) {
                poly.push({
                  x: pointlist[j].x,
                  y: pointlist[j].y
                });
              }
              break;
            case "z":
            case "Z":
              x = x0;
              y = y0;
              break;
          }
          // Record the start of a subpath
          if (command == "M" || command == "m") (x0 = x), (y0 = y);
        }

        break;
    }

    // do not include last point if coincident with starting point
    while (
      poly.length > 0 &&
      GeometryUtil.almostEqual(
        poly[0].x,
        poly[poly.length - 1].x,
        conf.toleranceSvg
      ) &&
      GeometryUtil.almostEqual(
        poly[0].y,
        poly[poly.length - 1].y,
        conf.toleranceSvg
      )
    ) {
      poly.pop();
    }

    // return poly;
    return [1,2,3]
  }

  clean() {
    // apply any transformations, so that all path positions etc
    // will be in the same coordinate space
    this.applyTransform(this.svg);

    // remove any g elements and bring all elements to the top level
    this.flatten(this.svg);

    // remove any non-contour elements like text
    this.filter(this.allowedElements);

    // split any compound paths into individual path elements
    recurse(this.svg, this.splitPath);

    return this.svg;
  }
}
