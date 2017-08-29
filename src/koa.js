/*
var vendor = "/vendor.js";
var main = "/main.js";
var styles = "";
if (!isDev()) {
  vendor = assets.vendor.js;
  main = assets.main.js;
  styles = `<link rel="stylesheet" type="text/css" href="/${assets.main.css}" />`;
}
*/
/*
import { readFileSync } from "fs";
import { isDev } from "@ajces/utils";

var assets = !isDev() ? JSON.parse(readFileSync(".build/assets.json")) : "";

function getMeta(meta) {
  return Object.keys(meta)
    .filter(k => k !== "title")
    .map(k => `<meta name="${k}" content="${meta[k]}" />`);
}

//example header
`<!DOCTYPE html>
      <html lang=en>
       <head>
          <meta charset="utf-8" />
          <meta name="referrer" content="origin" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${window.meta.title}</title>
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Roboto+Slab:400,700|Material+Icons" />
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css" />        
          ${meta.reduce((acc, val) => acc + val)}
          <script src='/vendor.js' defer></script>
          <script src='/main.js' defer></script>
          <script id="state" type="application/json">${JSON.stringify(state)}</script>
        </head>
        <body>`
// example footer
"</body></html>"
*/


export async function render(config, ctx, next) {
  var app = config.app;
  var state = config.state;
  var header = config.header;
  var footer = config.footer;
  var path = ctx.request.path;
  var data = {
    path
  };
  if (
    ctx.method !== "GET" ||
    path.startsWith("/__webpack_hmr") ||
    /\.(js|json|ico|jpg|gif|png|svg|eot|woff|woff2|cur)$/.test(path)
  ) {
    await next();
  } else {
    document.body = document.createElement("body");
    global.location = {
      pathname: path
    };
    global.addEventListener = (str, fn) => {};
    global.requestAnimationFrame = function(cb) {cb(Date.now())};
    window.meta = undefined;

    app(state, document.body);

    var meta = window.meta ? getMeta(window.meta) : { meta: {
      title: "CHANGE_ME"
    }};

    var html = `${header}${serialize(document.body.innerHTML)}${footer}`;

    ctx.body = html;
    ctx.type = "text/html";
  }
}
