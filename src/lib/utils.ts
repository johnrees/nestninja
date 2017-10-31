// recursively run the given function on the given element
export function recurse(element: Element, func: Function) {
  // only operate on original DOM tree, ignore any children that are added.
  // Avoid infinite loops
  const children = Array.prototype.slice.call(element.children);
  for (let i = 0; i < children.length; i++) {
    recurse(children[i], func);
  }
  func(element);
}

