function assign(obj, props) {
  for (let i in props) obj[i] = props[i]
}

function toLower(str) {
	return String(str).toLowerCase();
}

function splice(arr, item, add, byValueOnly) {
  let i = arr ? findWhere(arr, item, true, byValueOnly) : -1
  if (~i) add ? arr.splice(i, 0, add) : arr.splice(i, 1)
  return i
}

function findWhere(arr, fn, returnIndex, byValueOnly) {
  let i = arr.length
  while (i--)
    if (typeof fn === "function" && !byValueOnly ? fn(arr[i]) : arr[i] === fn)
      break
  return returnIndex ? i : arr[i]
}

function createAttributeFilter(ns, name) {
	return o => o.ns===ns && toLower(o.name)===toLower(name);
}

/*
const NODE_TYPES = {
	ELEMENT_NODE: 1,
	ATTRIBUTE_NODE: 2,
	TEXT_NODE: 3,
	CDATA_SECTION_NODE: 4,
	ENTITY_REFERENCE_NODE: 5,
	COMMENT_NODE: 6,
	PROCESSING_INSTRUCTION_NODE: 7,
	DOCUMENT_NODE: 9
}
*/

export function setup() {
  if (typeof global !== 'undefined') {
    global.requestAnimationFrame = (cb) => cb(Date.now());
    global.window = {};
    global.window.requestAnimationFrame = global.requestAnimationFrame;
    global.document = dom();
    global.window.document = global.document;
  }
}

export function serialize(el) {
  if (el.nodeType === 3) return el.textContent;
  var name = String(el.nodeName).toLowerCase(),
    str = "<" + name,
    c,
    i;
  for (i = 0; i < el.attributes.length; i++) {
    str += " " + el.attributes[i].name + '="' + el.attributes[i].value + '"';
  }
  switch (name) {
    case "area":
    case "base":
    case "br":
    case "col":
    case "command":
    case "hr":
    case "img":
    case "keygen":
    case "link":
    case "meta":
    case "param":
    case "source":
    case "track":
    case "wbr":
      return str + " />";
    default:
      str += ">";
      break;
  }
  for (i = 0; i < el.childNodes.length; i++) {
    c = serialize(el.childNodes[i]);
    if (c) str += "\n\t" + c.replace(/\n/g, "\n\t");
  }
  return str + (c ? "\n" : "") + "</" + name + ">";
}

export function enc(s) {
  return s.replace(/[&'"<>]/g, function(a) {
    return `&#${a};`;
  });
}

/** Create a minimally viable DOM Document
 *	@returns {Document} document
 */
export default function dom() {
  function isElement(node) {
    return node.nodeType === 1
  }

  class Node {
    constructor(nodeType, nodeName) {
      this.nodeType = nodeType
      this.nodeName = nodeName
      this.childNodes = []
    }

    appendChild(child) {
      this.insertBefore(child)
    }
    insertBefore(child, ref) {
      child.remove()
      child.parentNode = this
      if (!ref) this.childNodes.push(child)
      else splice(this.childNodes, ref, child)
    }
    replaceChild(child, ref) {
      if (ref.parentNode === this) {
        this.insertBefore(child, ref)
        ref.remove()
      }
    }
    removeChild(child) {
      splice(this.childNodes, child)
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this)
    }
  }

  class Text extends Node {
    constructor(text) {
      super(3, "#text") // TEXT_NODE
      this.nodeValue = text
    }
    set textContent(text) {
      this.nodeValue = text
    }
    get textContent() {
      return this.nodeValue
    }
  }

  class Element extends Node {
    constructor(nodeType, nodeName) {
      super(nodeType || 1, nodeName) // ELEMENT_NODE
      this.attributes = []
      this.__handlers = {}
      this.style = {}
      Object.defineProperty(this, "className", {
        set: val => {
          this.setAttribute("class", val)
        },
        get: () => this.getAttribute("class")
      })
      Object.defineProperty(this.style, "cssText", {
        set: val => {
          this.setAttribute("style", val)
        },
        get: () => this.getAttribute("style")
      })
    }

    get children() {
      return this.childNodes.filter(isElement)
    }

    setAttribute(key, value) {
      this.setAttributeNS(null, key, value)
    }
    getAttribute(key) {
      return this.getAttributeNS(null, key)
    }
    setAttributeNS(ns, name, value) {
			let attr = findWhere(this.attributes, createAttributeFilter(ns, name));
			if (!attr) this.attributes.push(attr = { ns, name });
			attr.value = String(value);
		}
		getAttributeNS(ns, name) {
			let attr = findWhere(this.attributes, createAttributeFilter(ns, name));
			return attr && attr.value;
		}
    removeAttributeNS(ns, name) {
			splice(this.attributes, createAttributeFilter(ns, name));
		}
    removeAttribute(key) {
      this.removeAttributeNS(null, key)
    }
    addEventListener(type, handler) {
      // mock for server side rendering
    }
    removeEventListener(type, handler) {
      // mocked for server side rendering
    }
    querySelector(str) {
      return null; // stubbing out to avoid hydration on server side...
    }
  }

  class Document extends Element {
    constructor() {
      super(9, "#document") // DOCUMENT_NODE
    }
  }

  function createElement(type) {
    return new Element(null, String(type).toUpperCase())
  }

  function createElementNS(ns, type) {
    let element = createElement(type)
    element.namespace = ns
    return element
  }

  function createTextNode(text) {
    return new Text(text)
  }

  function createDocument() {
    let document = new Document()
    assign(
      document,
      (document.defaultView = {
        document,
        Document,
        Node,
        Text,
        Element,
        SVGElement: Element /*, Event*/
      })
    )
    assign(document, {
      documentElement: document,
      createElement,
      createElementNS,
      createTextNode
    })
    document.appendChild((document.body = createElement("body")))
    document.readyState = ["1"]
    return document
  }

  return createDocument()
}