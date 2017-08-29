export * from "./dom";
export * from "./koa";

export function ssr(handler, options) {
  if (!options) options = {}
  if (handler === undefined) {
    throw new Error('must define handler for render');
  }
  if (options.target === undefined) {
    throw new Error('must define a render target');
  }

  return function(emit) {
    return {
      actions: {
        ssr: function() {
          handler(serialize(target));
        }
      },
      events: {
        render: function() {
          handler(serialize(target))
        }
      }
    }
  }
}

