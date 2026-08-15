var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-KaSjbZ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(
      text2,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router2 = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router2.add(...routes[i2]);
        }
        res = router2.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router2.match.bind(router2);
      this.#routers = [router2];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
__name(is, "is");

// node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static {
    __name(this, "ConsoleLogWriter");
  }
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static {
    __name(this, "DefaultLogger");
  }
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static {
    __name(this, "NoopLogger");
  }
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static {
    __name(this, "Table");
  }
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
__name(getTableName, "getTableName");
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
__name(getTableUniqueName, "getTableUniqueName");

// node_modules/drizzle-orm/column.js
var Column = class {
  static {
    __name(this, "Column");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static {
    __name(this, "ColumnBuilder");
  }
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}
__name(iife, "iife");

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName, "uniqueKeyName");
var UniqueConstraintBuilder = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
__name(parsePgArrayValue, "parsePgArrayValue");
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
__name(parsePgNestedArray, "parsePgNestedArray");
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
__name(parsePgArray, "parsePgArray");
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
__name(makePgArray, "makePgArray");

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "PgColumnBuilder");
  }
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  static {
    __name(this, "PgColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static {
    __name(this, "ExtraConfigColumn");
  }
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static {
    __name(this, "IndexedColumn");
  }
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgArrayBuilder");
  }
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  static {
    __name(this, "PgArray");
  }
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumObjectColumnBuilder");
  }
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumObjectColumn");
  }
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
__name(isPgEnum, "isPgEnum");
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static {
    __name(this, "PgEnumColumnBuilder");
  }
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static {
    __name(this, "PgEnumColumn");
  }
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static {
    __name(this, "Subquery");
  }
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static {
    __name(this, "WithSubquery");
  }
  static [entityKind] = "WithSubquery";
};

// node_modules/drizzle-orm/version.js
var version = "0.45.2";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static {
    __name(this, "FakePrimitiveParam");
  }
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
__name(isSQLWrapper, "isSQLWrapper");
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
__name(mergeQueries, "mergeQueries");
var StringChunk = class {
  static {
    __name(this, "StringChunk");
  }
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  static {
    __name(this, "SQL");
  }
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  static {
    __name(this, "Name");
  }
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
__name(isDriverValueEncoder, "isDriverValueEncoder");
var noopDecoder = {
  mapFromDriverValue: /* @__PURE__ */ __name((value) => value, "mapFromDriverValue")
};
var noopEncoder = {
  mapToDriverValue: /* @__PURE__ */ __name((value) => value, "mapToDriverValue")
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  static {
    __name(this, "Param");
  }
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
__name(sql, "sql");
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  __name(empty, "empty");
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  __name(fromList, "fromList");
  sql2.fromList = fromList;
  function raw2(str) {
    return new SQL([new StringChunk(str)]);
  }
  __name(raw2, "raw");
  sql2.raw = raw2;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  __name(join, "join");
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  __name(identifier, "identifier");
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  __name(placeholder2, "placeholder2");
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  __name(param2, "param2");
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    static {
      __name(this, "Aliased");
    }
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  static {
    __name(this, "Placeholder");
  }
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
__name(fillPlaceholders, "fillPlaceholders");
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static {
    __name(this, "View");
  }
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
__name(mapResultRow, "mapResultRow");
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
__name(orderSelectedFields, "orderSelectedFields");
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
__name(haveSameKeys, "haveSameKeys");
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
__name(mapUpdateSet, "mapUpdateSet");
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
__name(applyMixins, "applyMixins");
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
__name(getTableColumns, "getTableColumns");
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
__name(getTableLikeName, "getTableLikeName");
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
__name(getColumnNameAndConfig, "getColumnNameAndConfig");
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static {
    __name(this, "PgTable");
  }
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};

// node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static {
    __name(this, "PrimaryKeyBuilder");
  }
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  static {
    __name(this, "PrimaryKey");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
__name(bindIfParam, "bindIfParam");
var eq = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
}, "eq");
var ne = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
}, "ne");
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
__name(and, "and");
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
__name(or, "or");
function not(condition) {
  return sql`not ${condition}`;
}
__name(not, "not");
var gt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
}, "gt");
var gte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
}, "gte");
var lt = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
}, "lt");
var lte = /* @__PURE__ */ __name((left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
}, "lte");
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
__name(inArray, "inArray");
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
__name(notInArray, "notInArray");
function isNull(value) {
  return sql`${value} is null`;
}
__name(isNull, "isNull");
function isNotNull(value) {
  return sql`${value} is not null`;
}
__name(isNotNull, "isNotNull");
function exists(subquery) {
  return sql`exists ${subquery}`;
}
__name(exists, "exists");
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
__name(notExists, "notExists");
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
__name(between, "between");
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
__name(notBetween, "notBetween");
function like(column, value) {
  return sql`${column} like ${value}`;
}
__name(like, "like");
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
__name(notLike, "notLike");
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
__name(ilike, "ilike");
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
__name(notIlike, "notIlike");

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
__name(asc, "asc");
function desc(column) {
  return sql`${column} desc`;
}
__name(desc, "desc");

// node_modules/drizzle-orm/relations.js
var Relation = class {
  static {
    __name(this, "Relation");
  }
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  static {
    __name(this, "Relations");
  }
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  static {
    __name(this, "One");
  }
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  static {
    __name(this, "Many");
  }
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
__name(getOperators, "getOperators");
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
__name(getOrderByOperators, "getOrderByOperators");
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
__name(extractTablesRelationalConfig, "extractTablesRelationalConfig");
function relations(table, relations2) {
  return new Relations(
    table,
    (helpers) => Object.fromEntries(
      Object.entries(relations2(helpers)).map(([key, value]) => [
        key,
        value.withFieldName(key)
      ])
    )
  );
}
__name(relations, "relations");
function createOne(sourceTable) {
  return /* @__PURE__ */ __name(function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  }, "one");
}
__name(createOne, "createOne");
function createMany(sourceTable) {
  return /* @__PURE__ */ __name(function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  }, "many");
}
__name(createMany, "createMany");
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
__name(normalizeRelation, "normalizeRelation");
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
__name(createTableRelationsHelpers, "createTableRelationsHelpers");
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}
__name(mapRelationalRow, "mapRelationalRow");

// node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  static {
    __name(this, "ColumnAliasProxyHandler");
  }
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  static {
    __name(this, "TableAliasProxyHandler");
  }
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  static {
    __name(this, "RelationTableAliasProxyHandler");
  }
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
__name(aliasedTable, "aliasedTable");
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
__name(aliasedTableColumn, "aliasedTableColumn");
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
__name(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
__name(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static {
    __name(this, "SelectionProxyHandler");
  }
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static {
    __name(this, "QueryPromise");
  }
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder2 = class {
  static {
    __name(this, "ForeignKeyBuilder");
  }
  static [entityKind] = "SQLiteForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate;
  /** @internal */
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey2(table, this);
  }
};
var ForeignKey2 = class {
  static {
    __name(this, "ForeignKey");
  }
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
__name(uniqueKeyName2, "uniqueKeyName");
var UniqueConstraintBuilder2 = class {
  static {
    __name(this, "UniqueConstraintBuilder");
  }
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "SQLiteUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  build(table) {
    return new UniqueConstraint2(table, this.columns, this.name);
  }
};
var UniqueOnConstraintBuilder2 = class {
  static {
    __name(this, "UniqueOnConstraintBuilder");
  }
  static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder2(columns, this.name);
  }
};
var UniqueConstraint2 = class {
  static {
    __name(this, "UniqueConstraint");
  }
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
  }
  static [entityKind] = "SQLiteUniqueConstraint";
  columns;
  name;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder = class extends ColumnBuilder {
  static {
    __name(this, "SQLiteColumnBuilder");
  }
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder2(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
};
var SQLiteColumn = class extends Column {
  static {
    __name(this, "SQLiteColumn");
  }
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName2(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
};

// node_modules/drizzle-orm/sqlite-core/columns/blob.js
var SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBigIntBuilder");
  }
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
};
var SQLiteBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBigInt");
  }
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
};
var SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobJsonBuilder");
  }
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobJson(
      table,
      this.config
    );
  }
};
var SQLiteBlobJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobJson");
  }
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
};
var SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBlobBufferBuilder");
  }
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  /** @internal */
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
};
var SQLiteBlobBuffer = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBlobBuffer");
  }
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
};
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
__name(blob, "blob");

// node_modules/drizzle-orm/sqlite-core/columns/custom.js
var SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteCustomColumnBuilder");
  }
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new SQLiteCustomColumn(
      table,
      this.config
    );
  }
};
var SQLiteCustomColumn = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteCustomColumn");
  }
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
__name(customType, "customType");

// node_modules/drizzle-orm/sqlite-core/columns/integer.js
var SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteBaseIntegerBuilder");
  }
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
};
var SQLiteBaseInteger = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteBaseInteger");
  }
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
};
var SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteIntegerBuilder");
  }
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(
      table,
      this.config
    );
  }
};
var SQLiteInteger = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteInteger");
  }
  static [entityKind] = "SQLiteInteger";
};
var SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteTimestampBuilder");
  }
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  /**
   * @deprecated Use `default()` with your own expression instead.
   *
   * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
   */
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(
      table,
      this.config
    );
  }
};
var SQLiteTimestamp = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteTimestamp");
  }
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1e3);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1e3);
    }
    return unix;
  }
};
var SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
  static {
    __name(this, "SQLiteBooleanBuilder");
  }
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(
      table,
      this.config
    );
  }
};
var SQLiteBoolean = class extends SQLiteBaseInteger {
  static {
    __name(this, "SQLiteBoolean");
  }
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
};
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
__name(integer, "integer");

// node_modules/drizzle-orm/sqlite-core/columns/numeric.js
var SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBuilder");
  }
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumeric(
      table,
      this.config
    );
  }
};
var SQLiteNumeric = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumeric");
  }
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericNumberBuilder");
  }
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericNumber(
      table,
      this.config
    );
  }
};
var SQLiteNumericNumber = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericNumber");
  }
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
var SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteNumericBigIntBuilder");
  }
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  /** @internal */
  build(table) {
    return new SQLiteNumericBigInt(
      table,
      this.config
    );
  }
};
var SQLiteNumericBigInt = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteNumericBigInt");
  }
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
__name(numeric, "numeric");

// node_modules/drizzle-orm/sqlite-core/columns/real.js
var SQLiteRealBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteRealBuilder");
  }
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  /** @internal */
  build(table) {
    return new SQLiteReal(table, this.config);
  }
};
var SQLiteReal = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteReal");
  }
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
};
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
__name(real, "real");

// node_modules/drizzle-orm/sqlite-core/columns/text.js
var SQLiteTextBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextBuilder");
  }
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  /** @internal */
  build(table) {
    return new SQLiteText(
      table,
      this.config
    );
  }
};
var SQLiteText = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteText");
  }
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
};
var SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
  static {
    __name(this, "SQLiteTextJsonBuilder");
  }
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  /** @internal */
  build(table) {
    return new SQLiteTextJson(
      table,
      this.config
    );
  }
};
var SQLiteTextJson = class extends SQLiteColumn {
  static {
    __name(this, "SQLiteTextJson");
  }
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
__name(text, "text");

// node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
__name(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");

// node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys2 = /* @__PURE__ */ Symbol.for("drizzle:SQLiteInlineForeignKeys");
var SQLiteTable = class extends Table {
  static {
    __name(this, "SQLiteTable");
  }
  static [entityKind] = "SQLiteTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys: InlineForeignKeys2
  });
  /** @internal */
  [Table.Symbol.Columns];
  /** @internal */
  [InlineForeignKeys2] = [];
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
__name(sqliteTableBase, "sqliteTableBase");
var sqliteTable = /* @__PURE__ */ __name((name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
}, "sqliteTable");

// node_modules/drizzle-orm/sqlite-core/utils.js
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
__name(extractUsedTable, "extractUsedTable");

// node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteDeleteBase");
  }
  constructor(table, session, dialect, withList) {
    super();
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "SQLiteDelete";
  /** @internal */
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute(placeholderValues) {
    return this._prepare().execute(placeholderValues);
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
__name(toSnakeCase, "toSnakeCase");
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
__name(toCamelCase, "toCamelCase");
function noopCase(input) {
  return input;
}
__name(noopCase, "noopCase");
var CasingCache = class {
  static {
    __name(this, "CasingCache");
  }
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static {
    __name(this, "DrizzleError");
  }
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  static {
    __name(this, "DrizzleQueryError");
  }
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static {
    __name(this, "TransactionRollbackError");
  }
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase = class extends View {
  static {
    __name(this, "SQLiteViewBase");
  }
  static [entityKind] = "SQLiteViewBase";
};

// node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect = class {
  static {
    __name(this, "SQLiteDialect");
  }
  static [entityKind] = "SQLiteDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(_num) {
    return "?";
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({
    table,
    where,
    returning,
    withList,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(
      columnNames.flatMap((colName, i) => {
        const col = tableColumns[colName];
        const onUpdateFnResult = col.onUpdateFn?.();
        const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
        const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
        if (i < setSize - 1) {
          return [res, sql.raw(", ")];
        }
        return [res];
      })
    );
  }
  buildUpdateQuery({
    table,
    set,
    where,
    returning,
    withList,
    joins,
    from,
    limit,
    orderBy
  }) {
    const withSql = this.buildWithCTE(withList);
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, Column)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        const tableName = field.table[Table.Symbol.Name];
        if (field.columnType === "SQLiteNumericBigInt") {
          if (isSingleTable) {
            chunk.push(
              sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          } else {
            chunk.push(
              sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
            );
          }
        } else {
          if (isSingleTable) {
            chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
          } else {
            chunk.push(
              sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`
            );
          }
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: /* @__PURE__ */ __name((v) => entry.mapFromDriverValue(v), "mapFromDriverValue") } : entry.sql.decoder;
          if (fieldDecoder) field._.sql.decoder = fieldDecoder;
        }
        chunk.push(field);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    if (joins) {
      for (const [index, joinMeta] of joins.entries()) {
        if (index === 0) {
          joinsArray.push(sql` `);
        }
        const table = joinMeta.table;
        const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
        if (is(table, SQLiteTable)) {
          const tableName = table[SQLiteTable.Symbol.Name];
          const tableSchema = table[SQLiteTable.Symbol.Schema];
          const origTableName = table[SQLiteTable.Symbol.OriginalName];
          const alias = tableName === origTableName ? void 0 : joinMeta.alias;
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(
              origTableName
            )}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
          );
        } else {
          joinsArray.push(
            sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
          );
        }
        if (index < joins.length - 1) {
          joinsArray.push(sql` `);
        }
      }
    }
    return sql.join(joinsArray);
  }
  buildLimit(limit) {
    return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
  }
  buildOrderBy(orderBy) {
    const orderByList = [];
    if (orderBy) {
      for (const [index, orderByValue] of orderBy.entries()) {
        orderByList.push(orderByValue);
        if (index < orderBy.length - 1) {
          orderByList.push(sql`, `);
        }
      }
    }
    return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(
        table[Table.Symbol.OriginalName]
      )} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join(
            "->"
          )}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    const distinctSql = distinct ? sql` distinct` : void 0;
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    const groupByList = [];
    if (groupBy) {
      for (const [index, groupByValue] of groupBy.entries()) {
        groupByList.push(groupByValue);
        if (index < groupBy.length - 1) {
          groupByList.push(sql`, `);
        }
      }
    }
    const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
    const orderBySql = this.buildOrderBy(orderBy);
    const limitSql = this.buildLimit(limit);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`${leftSelect.getSQL()} `;
    const rightChunk = sql`${rightSelect.getSQL()}`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, SQLiteColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, SQLiteColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(
                this.casing.getColumnCasing(chunk)
              );
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({
    table,
    values: valuesOrSelect,
    onConflict,
    returning,
    withList,
    select
  }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(
      ([_, col]) => !col.shouldDisableInsert()
    );
    const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            let defaultValue;
            if (col.default !== null && col.default !== void 0) {
              defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
            } else if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
            } else {
              defaultValue = sql`null`;
            }
            valueList.push(defaultValue);
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      invokeSource
    });
  }
  buildRelationalQuery({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [
          key,
          aliasedTableColumn(value, tableAlias)
        ])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter(
            (key) => !selectedColumns.includes(key)
          );
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter(
          (entry) => !!entry[1]
        ).map(([tsKey, queryConfig]) => ({
          tsKey,
          queryConfig,
          relation: tableConfig.relations[tsKey]
        }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(
          schema,
          tableNamesMap,
          relation
        );
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(
                normalizedRelation.references[i],
                relationTableAlias
              ),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQuery({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({
        message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
      });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_array(${sql.join(
        selection.map(
          ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_group_array(${field}), json_array())`;
      }
      const nestedSelection = [
        {
          dbKey: "data",
          tsKey: "data",
          field: field.as("data"),
          isJson: true,
          relationTableTsKey: tableConfig.tsName,
          selection
        }
      ];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [
            {
              path: [],
              field: sql.raw("*")
            }
          ],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = void 0;
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};
var SQLiteSyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteSyncDialect");
  }
  static [entityKind] = "SQLiteSyncDialect";
  migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    session.run(migrationTableCreate);
    const dbMigrations = session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    session.run(sql`BEGIN`);
    try {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            session.run(sql.raw(stmt));
          }
          session.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
      session.run(sql`COMMIT`);
    } catch (e) {
      session.run(sql`ROLLBACK`);
      throw e;
    }
  }
};
var SQLiteAsyncDialect = class extends SQLiteDialect {
  static {
    __name(this, "SQLiteAsyncDialect");
  }
  static [entityKind] = "SQLiteAsyncDialect";
  async migrate(migrations, session, config) {
    const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;
    await session.transaction(async (tx) => {
      for (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.run(sql.raw(stmt));
          }
          await tx.run(
            sql`INSERT INTO ${sql.identifier(
              migrationsTable
            )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
};

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static {
    __name(this, "TypedQueryBuilder");
  }
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/select.js
var SQLiteSelectBuilder = class {
  static {
    __name(this, "SQLiteSelectBuilder");
  }
  static [entityKind] = "SQLiteSelectBuilder";
  fields;
  session;
  dialect;
  withList;
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    this.withList = config.withList;
    this.distinct = config.distinct;
  }
  from(source) {
    const isPartialSelect = !!this.fields;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(source, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(source._.selectedFields).map((key) => [key, source[key]])
      );
    } else if (is(source, SQLiteViewBase)) {
      fields = source[ViewBaseConfig].selectedFields;
    } else if (is(source, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(source);
    }
    return new SQLiteSelectBase({
      table: source,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    });
  }
};
var SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static {
    __name(this, "SQLiteSelectQueryBuilderBase");
  }
  static [entityKind] = "SQLiteSelectQueryBuilder";
  _;
  /** @internal */
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/sqlite-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/sqlite-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/sqlite-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/sqlite-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
  static {
    __name(this, "SQLiteSelectBase");
  }
  static [entityKind] = "SQLiteSelect";
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    if (!this.session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const fieldsList = orderSelectedFields(this.config.fields);
    const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      fieldsList,
      "all",
      true,
      void 0,
      {
        type: "select",
        tables: [...this.usedTables]
      },
      this.cacheConfig
    );
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.all();
  }
};
applyMixins(SQLiteSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
__name(createSetOperator, "createSetOperator");
var getSQLiteSetOperators = /* @__PURE__ */ __name(() => ({
  union,
  unionAll,
  intersect,
  except
}), "getSQLiteSetOperators");
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var except = createSetOperator("except", false);

// node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder = class {
  static {
    __name(this, "QueryBuilder");
  }
  static [entityKind] = "SQLiteQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
  }
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const queryBuilder = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    return { select, selectDistinct };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new SQLiteSyncDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder = class {
  static {
    __name(this, "SQLiteInsertBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteInsertBuilder";
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var SQLiteInsertBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteInsertBase");
  }
  constructor(table, values, session, dialect, withList, select) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select };
  }
  static [entityKind] = "SQLiteInsert";
  /** @internal */
  config;
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (!this.config.onConflict) this.config.onConflict = [];
    if (config.target === void 0) {
      this.config.onConflict.push(sql` on conflict do nothing`);
    } else {
      const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
      const whereSql = config.where ? sql` where ${config.where}` : sql``;
      this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    if (!this.config.onConflict) this.config.onConflict = [];
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    this.config.onConflict.push(
      sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
    );
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder = class {
  static {
    __name(this, "SQLiteUpdateBuilder");
  }
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "SQLiteUpdateBuilder";
  set(values) {
    return new SQLiteUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    );
  }
};
var SQLiteUpdateBase = class extends QueryPromise {
  static {
    __name(this, "SQLiteUpdateBase");
  }
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
  }
  static [entityKind] = "SQLiteUpdate";
  /** @internal */
  config;
  from(source) {
    this.config.from = source;
    return this;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.table[Table.Symbol.Columns],
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      this.config.orderBy = orderByArray;
    } else {
      const orderByArray = columns;
      this.config.orderBy = orderByArray;
    }
    return this;
  }
  limit(limit) {
    this.config.limit = limit;
    return this;
  }
  returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(isOneTimeQuery = true) {
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      this.dialect.sqlToQuery(this.getSQL()),
      this.config.returning,
      this.config.returning ? "all" : "run",
      true,
      void 0,
      {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  run = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().run(placeholderValues);
  }, "run");
  all = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().all(placeholderValues);
  }, "all");
  get = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().get(placeholderValues);
  }, "get");
  values = /* @__PURE__ */ __name((placeholderValues) => {
    return this._prepare().values(placeholderValues);
  }, "values");
  async execute() {
    return this.config.returning ? this.all() : this.run();
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
  static {
    __name(this, "SQLiteCountBuilder");
  }
  constructor(params) {
    super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.session = params.session;
    this.sql = _SQLiteCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  static [entityKind] = "SQLiteCountBuilderAsync";
  [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder = class {
  static {
    __name(this, "RelationalQueryBuilder");
  }
  constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.mode = mode;
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
  findMany(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    ) : new SQLiteRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var SQLiteRelationalQuery = class extends QueryPromise {
  static {
    __name(this, "SQLiteRelationalQuery");
  }
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "SQLiteAsyncRelationalQuery";
  /** @internal */
  mode;
  /** @internal */
  getSQL() {
    return this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    }).sql;
  }
  /** @internal */
  _prepare(isOneTimeQuery = false) {
    const { query, builtQuery } = this._toSQL();
    return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
      builtQuery,
      void 0,
      this.mode === "first" ? "get" : "all",
      true,
      (rawRows, mapColumnValue) => {
        const rows = rawRows.map(
          (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
        );
        if (this.mode === "first") {
          return rows[0];
        }
        return rows;
      }
    );
  }
  prepare() {
    return this._prepare(false);
  }
  _toSQL() {
    const query = this.dialect.buildRelationalQuery({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  /** @internal */
  executeRaw() {
    if (this.mode === "first") {
      return this._prepare(false).get();
    }
    return this._prepare(false).all();
  }
  async execute() {
    return this.executeRaw();
  }
};
var SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
  static {
    __name(this, "SQLiteSyncRelationalQuery");
  }
  static [entityKind] = "SQLiteSyncRelationalQuery";
  sync() {
    return this.executeRaw();
  }
};

// node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw = class extends QueryPromise {
  static {
    __name(this, "SQLiteRaw");
  }
  constructor(execute, getSQL, action, dialect, mapBatchResult) {
    super();
    this.execute = execute;
    this.getSQL = getSQL;
    this.dialect = dialect;
    this.mapBatchResult = mapBatchResult;
    this.config = { action };
  }
  static [entityKind] = "SQLiteRaw";
  /** @internal */
  config;
  getQuery() {
    return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase = class {
  static {
    __name(this, "BaseSQLiteDatabase");
  }
  constructor(resultKind, dialect, session, schema) {
    this.resultKind = resultKind;
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {}
    };
    this.query = {};
    const query = this.query;
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        query[tableName] = new RelationalQueryBuilder(
          resultKind,
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: /* @__PURE__ */ __name(async (_params) => {
    }, "invalidate") };
  }
  static [entityKind] = "BaseSQLiteDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = /* @__PURE__ */ __name((alias, selection) => {
    const self = this;
    const as = /* @__PURE__ */ __name((qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    }, "as");
    return { as };
  }, "$with");
  $count(source, filters) {
    return new SQLiteCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    __name(select, "select");
    function selectDistinct(fields) {
      return new SQLiteSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    __name(selectDistinct, "selectDistinct");
    function update(table) {
      return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
    }
    __name(update, "update");
    function insert(into) {
      return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
    }
    __name(insert, "insert");
    function delete_(from) {
      return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
    }
    __name(delete_, "delete_");
    return { select, selectDistinct, update, insert, delete: delete_ };
  }
  select(fields) {
    return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
  }
  selectDistinct(fields) {
    return new SQLiteSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new SQLiteUpdateBuilder(table, this.session, this.dialect);
  }
  $cache;
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(into) {
    return new SQLiteInsertBuilder(into, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(from) {
    return new SQLiteDeleteBase(from, this.session, this.dialect);
  }
  run(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.run(sequel),
        () => sequel,
        "run",
        this.dialect,
        this.session.extractRawRunValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.run(sequel);
  }
  all(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.all(sequel),
        () => sequel,
        "all",
        this.dialect,
        this.session.extractRawAllValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.all(sequel);
  }
  get(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.get(sequel),
        () => sequel,
        "get",
        this.dialect,
        this.session.extractRawGetValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.get(sequel);
  }
  values(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    if (this.resultKind === "async") {
      return new SQLiteRaw(
        async () => this.session.values(sequel),
        () => sequel,
        "values",
        this.dialect,
        this.session.extractRawValuesValueFromBatchResult.bind(this.session)
      );
    }
    return this.session.values(sequel);
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static {
    __name(this, "Cache");
  }
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  static {
    __name(this, "NoopCache");
  }
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
__name(hashQuery, "hashQuery");

// node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync = class extends QueryPromise {
  static {
    __name(this, "ExecuteResultSync");
  }
  constructor(resultCb) {
    super();
    this.resultCb = resultCb;
  }
  static [entityKind] = "ExecuteResultSync";
  async execute() {
    return this.resultCb();
  }
  sync() {
    return this.resultCb();
  }
};
var SQLitePreparedQuery = class {
  static {
    __name(this, "SQLitePreparedQuery");
  }
  constructor(mode, executeMethod, query, cache, queryMetadata, cacheConfig) {
    this.mode = mode;
    this.executeMethod = executeMethod;
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  static [entityKind] = "PreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
  getQuery() {
    return this.query;
  }
  mapRunResult(result, _isFromBatch) {
    return result;
  }
  mapAllResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  mapGetResult(_result, _isFromBatch) {
    throw new Error("Not implemented");
  }
  execute(placeholderValues) {
    if (this.mode === "async") {
      return this[this.executeMethod](placeholderValues);
    }
    return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
  }
  mapResult(response, isFromBatch) {
    switch (this.executeMethod) {
      case "run": {
        return this.mapRunResult(response, isFromBatch);
      }
      case "all": {
        return this.mapAllResult(response, isFromBatch);
      }
      case "get": {
        return this.mapGetResult(response, isFromBatch);
      }
    }
  }
};
var SQLiteSession = class {
  static {
    __name(this, "SQLiteSession");
  }
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "SQLiteSession";
  prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return this.prepareQuery(
      query,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
      queryMetadata,
      cacheConfig
    );
  }
  run(query) {
    const staticQuery = this.dialect.sqlToQuery(query);
    try {
      return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
    } catch (err) {
      throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
    }
  }
  /** @internal */
  extractRawRunValueFromBatchResult(result) {
    return result;
  }
  all(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
  }
  /** @internal */
  extractRawAllValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  get(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
  }
  /** @internal */
  extractRawGetValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
  values(query) {
    return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
  }
  async count(sql2) {
    const result = await this.values(sql2);
    return result[0][0];
  }
  /** @internal */
  extractRawValuesValueFromBatchResult(_result) {
    throw new Error("Not implemented");
  }
};
var SQLiteTransaction = class extends BaseSQLiteDatabase {
  static {
    __name(this, "SQLiteTransaction");
  }
  constructor(resultType, dialect, session, schema, nestedIndex = 0) {
    super(resultType, dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "SQLiteTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
};

// node_modules/drizzle-orm/d1/session.js
var SQLiteD1Session = class extends SQLiteSession {
  static {
    __name(this, "SQLiteD1Session");
  }
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "SQLiteD1Session";
  logger;
  cache;
  prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    const stmt = this.client.prepare(query.sql);
    return new D1PreparedQuery(
      stmt,
      query,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async batch(queries) {
    const preparedQueries = [];
    const builtQueries = [];
    for (const query of queries) {
      const preparedQuery = query._prepare();
      const builtQuery = preparedQuery.getQuery();
      preparedQueries.push(preparedQuery);
      if (builtQuery.params.length > 0) {
        builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
      } else {
        const builtQuery2 = preparedQuery.getQuery();
        builtQueries.push(
          this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
        );
      }
    }
    const batchResults = await this.client.batch(builtQueries);
    return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
  }
  extractRawAllValueFromBatchResult(result) {
    return result.results;
  }
  extractRawGetValueFromBatchResult(result) {
    return result.results[0];
  }
  extractRawValuesValueFromBatchResult(result) {
    return d1ToRawMapping(result.results);
  }
  async transaction(transaction, config) {
    const tx = new D1Transaction("async", this.dialect, this, this.schema);
    await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
    try {
      const result = await transaction(tx);
      await this.run(sql`commit`);
      return result;
    } catch (err) {
      await this.run(sql`rollback`);
      throw err;
    }
  }
};
var D1Transaction = class _D1Transaction extends SQLiteTransaction {
  static {
    __name(this, "D1Transaction");
  }
  static [entityKind] = "D1Transaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
    await this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
__name(d1ToRawMapping, "d1ToRawMapping");
var D1PreparedQuery = class extends SQLitePreparedQuery {
  static {
    __name(this, "D1PreparedQuery");
  }
  constructor(stmt, query, logger, cache, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
    super("async", executeMethod, query, cache, queryMetadata, cacheConfig);
    this.logger = logger;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.fields = fields;
    this.stmt = stmt;
  }
  static [entityKind] = "D1PreparedQuery";
  /** @internal */
  customResultMapper;
  /** @internal */
  fields;
  /** @internal */
  stmt;
  async run(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return this.stmt.bind(...params).run();
    });
  }
  async all(placeholderValues) {
    const { fields, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
      });
    }
    const rows = await this.values(placeholderValues);
    return this.mapAllResult(rows);
  }
  mapAllResult(rows, isFromBatch) {
    if (isFromBatch) {
      rows = d1ToRawMapping(rows.results);
    }
    if (!this.fields && !this.customResultMapper) {
      return rows;
    }
    if (this.customResultMapper) {
      return this.customResultMapper(rows);
    }
    return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
  }
  async get(placeholderValues) {
    const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
    if (!fields && !customResultMapper) {
      const params = fillPlaceholders(query.params, placeholderValues ?? {});
      logger.logQuery(query.sql, params);
      return await this.queryWithCache(query.sql, params, async () => {
        return stmt.bind(...params).all().then(({ results }) => results[0]);
      });
    }
    const rows = await this.values(placeholderValues);
    if (!rows[0]) {
      return void 0;
    }
    if (customResultMapper) {
      return customResultMapper(rows);
    }
    return mapResultRow(fields, rows[0], joinsNotNullableMap);
  }
  mapGetResult(result, isFromBatch) {
    if (isFromBatch) {
      result = d1ToRawMapping(result.results)[0];
    }
    if (!this.fields && !this.customResultMapper) {
      return result;
    }
    if (this.customResultMapper) {
      return this.customResultMapper([result]);
    }
    return mapResultRow(this.fields, result, this.joinsNotNullableMap);
  }
  async values(placeholderValues) {
    const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
    this.logger.logQuery(this.query.sql, params);
    return await this.queryWithCache(this.query.sql, params, async () => {
      return this.stmt.bind(...params).raw();
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};

// node_modules/drizzle-orm/d1/driver.js
var DrizzleD1Database = class extends BaseSQLiteDatabase {
  static {
    __name(this, "DrizzleD1Database");
  }
  static [entityKind] = "D1Database";
  async batch(batch) {
    return this.session.batch(batch);
  }
};
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger, cache: config.cache });
  const db = new DrizzleD1Database("async", dialect, session, schema);
  db.$client = client;
  db.$cache = config.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db;
}
__name(drizzle, "drizzle");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apiKeys: () => apiKeys,
  assessments: () => assessments,
  attendanceRecords: () => attendanceRecords,
  auditLogs: () => auditLogs,
  benefitClaims: () => benefitClaims,
  benefitClaimsRelations: () => benefitClaimsRelations,
  benefitDependents: () => benefitDependents,
  benefitDependentsRelations: () => benefitDependentsRelations,
  benefitEnrollments: () => benefitEnrollments,
  benefitEnrollmentsRelations: () => benefitEnrollmentsRelations,
  benefitPlans: () => benefitPlans,
  benefitPlansRelations: () => benefitPlansRelations,
  companies: () => companies,
  companySettings: () => companySettings,
  complianceTasks: () => complianceTasks,
  departments: () => departments,
  emergencyContacts: () => emergencyContacts,
  emergencyContactsRelations: () => emergencyContactsRelations,
  employeeAssets: () => employeeAssets,
  employeeBenefits: () => employeeBenefits,
  employeeBenefitsRelations: () => employeeBenefitsRelations,
  employeeDocuments: () => employeeDocuments,
  employeeDocumentsRelations: () => employeeDocumentsRelations,
  employeeTrainings: () => employeeTrainings,
  employees: () => employees,
  employeesRelations: () => employeesRelations,
  feedbacks: () => feedbacks,
  goals: () => goals,
  jobRequisitions: () => jobRequisitions,
  leaveBalances: () => leaveBalances,
  leaveRequests: () => leaveRequests,
  loanRepayments: () => loanRepayments,
  loanRepaymentsRelations: () => loanRepaymentsRelations,
  loans: () => loans,
  loansRelations: () => loansRelations,
  locations: () => locations,
  overtimeRequests: () => overtimeRequests,
  payGrades: () => payGrades,
  payrollRuns: () => payrollRuns,
  payrollRunsRelations: () => payrollRunsRelations,
  payrollSettings: () => payrollSettings,
  payslips: () => payslips,
  payslipsRelations: () => payslipsRelations,
  reviewCycles: () => reviewCycles,
  roles: () => roles,
  salaryComponents: () => salaryComponents,
  taxBrackets: () => taxBrackets,
  transitionTasks: () => transitionTasks,
  transitionTasksRelations: () => transitionTasksRelations,
  transitions: () => transitions,
  transitionsRelations: () => transitionsRelations,
  walletTransactions: () => walletTransactions,
  wellnessParticipants: () => wellnessParticipants,
  wellnessParticipantsRelations: () => wellnessParticipantsRelations,
  wellnessPrograms: () => wellnessPrograms,
  wellnessProgramsRelations: () => wellnessProgramsRelations
});

// src/models/company.model.ts
var companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").unique(),
  registrationNumber: text("registration_number"),
  industry: text("industry"),
  fiscalYearStart: text("fiscal_year_start"),
  address: text("address"),
  supportEmail: text("support_email"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});

// src/models/org.model.ts
var departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  headCount: integer("head_count").default(0),
  // Plain reference (no FK constraint), same convention as employees.managerId
  managerId: text("manager_id"),
  teamLeadId: text("team_lead_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  country: text("country"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});

// src/models/role.model.ts
var roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions", { mode: "json" }).notNull(),
  // JSON string representing the permission matrix
  usersCount: integer("users_count").default(0),
  color: text("color").default("slate"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});

// src/models/employee.model.ts
var employees = sqliteTable("employees", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  dob: text("dob"),
  gender: text("gender"),
  nationality: text("nationality"),
  maritalStatus: text("marital_status"),
  role: text("role"),
  // Optional, additive fine-grained role — narrows what the fixed `role` above
  // already allows via requireRole; see requirePermission in role.middleware.ts.
  customRoleId: text("custom_role_id").references(() => roles.id),
  department: text("department"),
  departmentId: text("department_id").references(() => departments.id),
  location: text("location"),
  employmentType: text("employment_type"),
  // 'Full-time' | 'Contract' | etc.
  status: text("status").notNull().default("onboarding"),
  // 'active' | 'onboarding' | etc.
  salary: integer("salary"),
  avatar: text("avatar"),
  baseSalary: integer("base_salary"),
  hireDate: text("hire_date"),
  probationEnd: text("probation_end"),
  managerId: text("manager_id"),
  managerName: text("manager_name"),
  workEmail: text("work_email"),
  performanceRating: real("performance_rating"),
  // Authentication
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  isPasswordChanged: integer("is_password_changed", { mode: "boolean" }).default(false),
  // Tax & Statutory
  tin: text("tin"),
  pfa: text("pfa"),
  pensionId: text("pension_id"),
  nin: text("nin"),
  nhf: text("nhf"),
  taxState: text("tax_state"),
  // Banking & Payout
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  secondaryBankName: text("secondary_bank_name"),
  secondaryAccountNumber: text("secondary_account_number"),
  secondaryAccountName: text("secondary_account_name"),
  payoutMethod: text("payout_method"),
  // Miscellaneous
  privateNotes: text("private_notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var employeeAssets = sqliteTable("employee_assets", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  serialNumber: text("serial_number"),
  status: text("status").notNull().default("Assigned"),
  condition: text("condition").notNull().default("Good"),
  purchaseDate: text("purchase_date"),
  value: integer("value"),
  image: text("image"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var emergencyContacts = sqliteTable("emergency_contacts", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var employeesRelations = relations(employees, ({ many }) => ({
  emergencyContacts: many(emergencyContacts),
  employeeDocuments: many(employeeDocuments)
}));
var emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  employee: one(employees, {
    fields: [emergencyContacts.employeeId],
    references: [employees.id]
  })
}));
var employeeDocuments = sqliteTable("employee_documents", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  fileKey: text("file_key").notNull(),
  status: text("status").notNull().default("Active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id]
  })
}));

// src/models/attendance.model.ts
var attendanceRecords = sqliteTable("attendance_records", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  date: text("date").notNull(),
  clockIn: text("clock_in").notNull(),
  clockOut: text("clock_out"),
  status: text("status").notNull(),
  locationIn: text("location_in"),
  latitudeIn: real("latitude_in"),
  longitudeIn: real("longitude_in"),
  locationOut: text("location_out"),
  latitudeOut: real("latitude_out"),
  longitudeOut: real("longitude_out"),
  workHours: real("work_hours").notNull(),
  overtime: real("overtime").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var overtimeRequests = sqliteTable("overtime_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  hours: real("hours").notNull(),
  reason: text("reason").notNull(),
  deliverable: text("deliverable"),
  status: text("status").notNull().default("pending"),
  // Set when a manager/admin approves or rejects the request — mirrors leaveRequests.
  managerId: text("manager_id"),
  managerComment: text("manager_comment"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});

// src/models/leave.model.ts
var leaveRequests = sqliteTable("leave_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  type: text("type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason").notNull(),
  managerId: text("manager_id"),
  managerComment: text("manager_comment"),
  status: text("status").notNull(),
  attachment: text("attachment"),
  appliedOn: text("applied_on").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var leaveBalances = sqliteTable("leave_balances", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  type: text("type").notNull(),
  total: integer("total").notNull(),
  color: text("color").notNull().default("indigo"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});

// src/models/misc.model.ts
var walletTransactions = sqliteTable("wallet_transactions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  type: text("type").notNull(),
  // 'credit' | 'debit'
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  timestamp: text("timestamp").notNull(),
  status: text("status").notNull(),
  // 'completed' | 'pending' | 'failed'
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var jobRequisitions = sqliteTable("job_requisitions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  employmentType: text("employment_type"),
  // 'Full-time' | 'Contract' | 'Intern' | 'Consultant'
  hiringManager: text("hiring_manager").notNull(),
  managerAvatar: text("manager_avatar"),
  priority: text("priority").notNull(),
  // 'Pending Approval' | 'Open' | 'On Hold' | 'Filled' | 'Cancelled' | 'Rejected'
  status: text("status").notNull(),
  dateOpened: text("date_opened").notNull(),
  targetHireDate: text("target_hire_date").notNull(),
  daysOpen: integer("days_open").notNull(),
  justification: text("justification"),
  budgetRange: text("budget_range"),
  // Who requested this requisition (audit trail for the approval workflow)
  requestedById: text("requested_by_id"),
  requestedByName: text("requested_by_name"),
  // Who reviewed it (approved or rejected) and when
  reviewedById: text("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedAt: text("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var employeeTrainings = sqliteTable("employee_trainings", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull(),
  courseName: text("course_name").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("in_progress"),
  // 'in_progress' | 'completed' | 'assigned'
  date: text("date").notNull(),
  // Started/Completed date
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull(),
  action: text("action").notNull(),
  actorName: text("actor_name").notNull(),
  details: text("details").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

// src/models/payroll.model.ts
var payrollSettings = sqliteTable("payroll_settings", {
  companyId: text("company_id").primaryKey().references(() => companies.id),
  payCycle: text("pay_cycle").notNull().default("monthly"),
  // 'monthly' | 'biweekly' | 'weekly'
  cutoffDay: integer("cutoff_day").notNull().default(20),
  paymentDay: integer("payment_day").notNull().default(25),
  workingDaysPerMonth: integer("working_days_per_month").notNull().default(22),
  prorationEnabled: integer("proration_enabled", { mode: "boolean" }).notNull().default(true),
  minWageCheckEnabled: integer("min_wage_check_enabled", { mode: "boolean" }).notNull().default(true),
  minWageAnnual: integer("min_wage_annual").notNull().default(36e4),
  // Nigeria national minimum wage baseline
  pensionEmployeeRate: real("pension_employee_rate").notNull().default(8),
  // % of basic+housing+transport
  pensionEmployerRate: real("pension_employer_rate").notNull().default(10),
  applyConsolidatedReliefAllowance: integer("apply_cra", { mode: "boolean" }).notNull().default(true),
  currency: text("currency").notNull().default("NGN"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var taxBrackets = sqliteTable("tax_brackets", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  minIncome: integer("min_income").notNull(),
  // annual, inclusive
  maxIncome: integer("max_income"),
  // annual, inclusive; null = no upper bound
  ratePercent: real("rate_percent").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var salaryComponents = sqliteTable("salary_components", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'earning' | 'deduction'
  calculationType: text("calculation_type").notNull().default("fixed"),
  // 'fixed' | 'percentage_of_basic' | 'percentage_of_gross'
  value: real("value").notNull().default(0),
  // amount (fixed) or percent (percentage_*)
  taxable: integer("taxable", { mode: "boolean" }).notNull().default(true),
  statutory: integer("statutory", { mode: "boolean" }).notNull().default(false),
  // system-managed, cannot be deleted
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var payGrades = sqliteTable("pay_grades", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  minSalary: integer("min_salary").notNull().default(0),
  maxSalary: integer("max_salary").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var loans = sqliteTable("loans", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  principal: integer("principal").notNull(),
  interestRatePercent: real("interest_rate_percent").notNull().default(0),
  durationMonths: integer("duration_months").notNull(),
  monthlyInstallment: integer("monthly_installment").notNull(),
  remainingBalance: integer("remaining_balance").notNull(),
  status: text("status").notNull().default("active"),
  // 'active' | 'completed' | 'paused' | 'cancelled'
  purpose: text("purpose"),
  startDate: text("start_date").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var loanRepayments = sqliteTable("loan_repayments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  loanId: text("loan_id").notNull().references(() => loans.id),
  payrollRunId: text("payroll_run_id"),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  paidAt: text("paid_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
var complianceTasks = sqliteTable("compliance_tasks", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  payrollRunId: text("payroll_run_id"),
  title: text("title").notNull(),
  type: text("type").notNull(),
  // 'tax' | 'pension' | 'other'
  dueDate: text("due_date").notNull(),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("pending"),
  // 'pending' | 'completed'
  reference: text("reference"),
  completedAt: text("completed_at"),
  completedBy: text("completed_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var payrollRuns = sqliteTable("payroll_runs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  // 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid'
  status: text("status").notNull().default("draft"),
  totalGross: integer("total_gross").notNull().default(0),
  totalNet: integer("total_net").notNull().default(0),
  totalTaxes: integer("total_taxes").notNull().default(0),
  totalPension: integer("total_pension").notNull().default(0),
  totalLoanDeductions: integer("total_loan_deductions").notNull().default(0),
  employeeCount: integer("employee_count").notNull().default(0),
  dueDate: text("due_date"),
  submittedBy: text("submitted_by"),
  submittedAt: text("submitted_at"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  rejectedReason: text("rejected_reason"),
  paidAt: text("paid_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var payslips = sqliteTable("payslips", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull().references(() => payrollRuns.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  // Snapshots so historical payslips stay accurate even if the employee record changes later.
  employeeName: text("employee_name"),
  department: text("department"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  basicSalary: integer("basic_salary").notNull().default(0),
  allowances: integer("allowances").notNull().default(0),
  bonuses: integer("bonuses").notNull().default(0),
  grossPay: integer("gross_pay").notNull().default(0),
  taxDeductions: integer("tax_deductions").notNull().default(0),
  pensionDeductions: integer("pension_deductions").notNull().default(0),
  loanDeductions: integer("loan_deductions").notNull().default(0),
  otherDeductions: integer("other_deductions").notNull().default(0),
  netPay: integer("net_pay").notNull().default(0),
  isProrated: integer("is_prorated", { mode: "boolean" }).notNull().default(false),
  workingDays: integer("working_days"),
  presentDays: integer("present_days"),
  absentDays: integer("absent_days"),
  overtimeHours: real("overtime_hours"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var payrollRunsRelations = relations(payrollRuns, ({ many }) => ({
  payslips: many(payslips)
}));
var payslipsRelations = relations(payslips, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payslips.runId],
    references: [payrollRuns.id]
  }),
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id]
  })
}));
var loansRelations = relations(loans, ({ one, many }) => ({
  employee: one(employees, {
    fields: [loans.employeeId],
    references: [employees.id]
  }),
  repayments: many(loanRepayments)
}));
var loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanRepayments.loanId],
    references: [loans.id]
  })
}));

// src/models/settings.model.ts
var apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var companySettings = sqliteTable("company_settings", {
  companyId: text("company_id").primaryKey().references(() => companies.id),
  require2fa: integer("require_2fa", { mode: "boolean" }).default(false).notNull(),
  passwordMinLength: integer("password_min_length").default(12).notNull(),
  sessionTimeoutMins: integer("session_timeout_mins").default(60).notNull(),
  // Attendance policy — drives the on-time/late tag applied at clock-in and
  // the standard shift length used to compute overtime at clock-out.
  attendanceStartTime: text("attendance_start_time").default("09:00").notNull(),
  attendanceEndTime: text("attendance_end_time").default("17:00").notNull(),
  attendanceGraceMinutes: integer("attendance_grace_minutes").default(15).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});

// src/models/benefits.model.ts
var employeeBenefits = sqliteTable("employee_benefits", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id).unique(),
  // Health
  healthProvider: text("health_provider"),
  healthPlan: text("health_plan"),
  healthCoverage: text("health_coverage"),
  // e.g. 'Family', 'Individual'
  healthPremium: integer("health_premium").default(0),
  // Retirement
  retirementPlan: text("retirement_plan"),
  // e.g. '401(k)'
  retirementBalance: integer("retirement_balance").default(0),
  retirementContributionRate: real("retirement_contribution_rate").default(0),
  // percentage e.g. 6.0
  employerMatchRate: real("employer_match_rate").default(0),
  // percentage
  // Equity
  equityGranted: integer("equity_granted").default(0),
  equityVested: integer("equity_vested").default(0),
  equityValue: integer("equity_value").default(0),
  // Wellness
  wellnessBudget: integer("wellness_budget").default(0),
  wellnessUsed: integer("wellness_used").default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var employeeBenefitsRelations = relations(employeeBenefits, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeBenefits.employeeId],
    references: [employees.id]
  }),
  company: one(companies, {
    fields: [employeeBenefits.companyId],
    references: [companies.id]
  })
}));
var benefitPlans = sqliteTable("benefit_plans", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'health' | 'life' | 'retirement' | 'equity' | 'perk' | 'wellness' | 'fsa'
  provider: text("provider"),
  // e.g. 'AXA Mansard', 'Stanbic IBTC'
  planTier: text("plan_tier"),
  // e.g. 'Gold PPO', 'Standard'
  description: text("description"),
  highlights: text("highlights"),
  // JSON-stringified array of bullet points
  coverageLimit: integer("coverage_limit").default(0),
  // e.g. annual health cover limit, in kobo/naira
  employerCost: integer("employer_cost").default(0),
  // employer-paid monthly cost
  employeeCost: integer("employee_cost").default(0),
  // employee-paid monthly cost (premium/deduction)
  currency: text("currency").notNull().default("NGN"),
  eligibility: text("eligibility").default("All Employees"),
  icon: text("icon").default("Shield"),
  color: text("color").default("indigo"),
  status: text("status").notNull().default("active"),
  // 'active' | 'inactive'
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var benefitPlansRelations = relations(benefitPlans, ({ one, many }) => ({
  company: one(companies, {
    fields: [benefitPlans.companyId],
    references: [companies.id]
  }),
  enrollments: many(benefitEnrollments)
}));
var benefitEnrollments = sqliteTable("benefit_enrollments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  planId: text("plan_id").notNull().references(() => benefitPlans.id),
  coverageLevel: text("coverage_level").default("Individual"),
  // 'Individual' | 'Family'
  status: text("status").notNull().default("enrolled"),
  // 'enrolled' | 'waived' | 'cancelled'
  enrolledAt: text("enrolled_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  cancelledAt: text("cancelled_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var benefitEnrollmentsRelations = relations(benefitEnrollments, ({ one }) => ({
  employee: one(employees, {
    fields: [benefitEnrollments.employeeId],
    references: [employees.id]
  }),
  plan: one(benefitPlans, {
    fields: [benefitEnrollments.planId],
    references: [benefitPlans.id]
  })
}));
var benefitDependents = sqliteTable("benefit_dependents", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  // 'Spouse' | 'Child' | 'Parent' | 'Other'
  dateOfBirth: text("date_of_birth"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
var benefitDependentsRelations = relations(benefitDependents, ({ one }) => ({
  employee: one(employees, {
    fields: [benefitDependents.employeeId],
    references: [employees.id]
  })
}));
var wellnessPrograms = sqliteTable("wellness_programs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("fitness"),
  // 'fitness' | 'mental-health' | 'financial' | 'nutrition' | 'other'
  goalLabel: text("goal_label").default("Steps"),
  // unit label shown next to progress, e.g. 'Steps'
  goalTarget: integer("goal_target").default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("active"),
  // 'active' | 'upcoming' | 'completed'
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var wellnessProgramsRelations = relations(wellnessPrograms, ({ one, many }) => ({
  company: one(companies, {
    fields: [wellnessPrograms.companyId],
    references: [companies.id]
  }),
  participants: many(wellnessParticipants)
}));
var wellnessParticipants = sqliteTable("wellness_participants", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  programId: text("program_id").notNull().references(() => wellnessPrograms.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  progress: integer("progress").default(0),
  status: text("status").notNull().default("joined"),
  // 'joined' | 'completed' | 'dropped'
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var wellnessParticipantsRelations = relations(wellnessParticipants, ({ one }) => ({
  program: one(wellnessPrograms, {
    fields: [wellnessParticipants.programId],
    references: [wellnessPrograms.id]
  }),
  employee: one(employees, {
    fields: [wellnessParticipants.employeeId],
    references: [employees.id]
  })
}));
var benefitClaims = sqliteTable("benefit_claims", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  kind: text("kind").notNull(),
  // 'health' | 'wellness'
  category: text("category").notNull(),
  // e.g. 'Consultation', 'Pharmacy', 'Gym Membership'
  provider: text("provider"),
  // hospital/vendor name
  amount: integer("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  // 'pending' | 'approved' | 'rejected'
  submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedById: text("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
var benefitClaimsRelations = relations(benefitClaims, ({ one }) => ({
  employee: one(employees, {
    fields: [benefitClaims.employeeId],
    references: [employees.id]
  })
}));

// src/models/feedback.model.ts
var feedbacks = sqliteTable("feedbacks", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  fromEmployeeId: text("from_employee_id").notNull(),
  toEmployeeId: text("to_employee_id"),
  // resolved when the recipient was picked from search; null for free-text names
  toEmployeeName: text("to_employee_name").notNull(),
  type: text("type").notNull(),
  // 'praise' | 'bravo' | 'gratitude'
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

// src/models/goal.model.ts
var goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  employeeId: text("employee_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  // 'high' | 'medium' | 'low'
  status: text("status").notNull().default("on_track"),
  // 'on_track' | 'at_risk' | 'completed'
  progress: integer("progress").notNull().default(0),
  // 0-100
  dueDate: text("due_date"),
  keyResults: text("key_results"),
  // JSON string
  scope: text("scope").notNull().default("individual"),
  // 'individual' | 'team' | 'department' | 'company'
  assignedById: text("assigned_by_id"),
  // set when a manager/admin creates it for someone else
  parentGoalId: text("parent_goal_id"),
  // links to a broader goal for alignment rollups
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

// src/models/assessment.model.ts
var assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  employeeId: text("employee_id").notNull(),
  cycleId: text("cycle_id"),
  // FK (soft) -> review_cycles.id; null on legacy/ad-hoc rows
  cycleName: text("cycle_name").notNull(),
  // e.g. "H2 2024", "Q1 2025"
  status: text("status").notNull().default("draft"),
  // 'draft' | 'submitted' | 'under_review' | 'completed'
  // Self-assessment data (stored as JSON strings)
  achievements: text("achievements").notNull().default("[]"),
  // JSON array of strings
  challenges: text("challenges").notNull().default("[]"),
  // JSON array of strings
  goalsProgress: text("goals_progress").notNull().default("[]"),
  // JSON array of goal progress objects
  skillRatings: text("skill_ratings").notNull().default("[]"),
  // JSON array of skill rating objects
  // Overall self-rating
  selfRating: text("self_rating"),
  // e.g. "exceeds_expectations"
  selfComment: text("self_comment"),
  // Development goals
  developmentGoals: text("development_goals").notNull().default("[]"),
  // JSON array of development goal objects
  // Manager review (filled by manager)
  managerRating: text("manager_rating"),
  managerComment: text("manager_comment"),
  managerId: text("manager_id"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  submittedAt: text("submitted_at")
});

// src/models/reviewCycle.model.ts
var reviewCycles = sqliteTable("review_cycles", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("upcoming"),
  // 'upcoming' | 'active' | 'closed'
  startDate: text("start_date"),
  endDate: text("end_date"),
  selfReviewDueDate: text("self_review_due_date"),
  managerReviewDueDate: text("manager_review_due_date"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

// src/models/transition.model.ts
var transitions = sqliteTable("transitions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  type: text("type").notNull(),
  // 'Onboarding' | 'Offboarding'
  stage: text("stage").notNull(),
  status: text("status").notNull().default("Active"),
  // 'Active' | 'Completed' | 'Cancelled'
  startDate: text("start_date").notNull(),
  targetDate: text("target_date"),
  // expected completion date / last working day
  reason: text("reason"),
  // offboarding only: 'Resignation' | 'Termination' | 'Contract Ended' | 'Retirement'
  handoverToId: text("handover_to_id"),
  handoverToName: text("handover_to_name"),
  exitInterviewScheduled: integer("exit_interview_scheduled", { mode: "boolean" }).default(false),
  initiatedById: text("initiated_by_id"),
  initiatedByName: text("initiated_by_name"),
  completedAt: text("completed_at"),
  cancelledAt: text("cancelled_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var transitionTasks = sqliteTable("transition_tasks", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  transitionId: text("transition_id").notNull().references(() => transitions.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  // 'HR' | 'IT' | 'Finance' | 'Admin'
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"),
  // 'pending' | 'completed'
  sortOrder: integer("sort_order").notNull().default(0),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").$onUpdate(() => (/* @__PURE__ */ new Date()).toISOString())
});
var transitionsRelations = relations(transitions, ({ many, one }) => ({
  tasks: many(transitionTasks),
  employee: one(employees, {
    fields: [transitions.employeeId],
    references: [employees.id]
  })
}));
var transitionTasksRelations = relations(transitionTasks, ({ one }) => ({
  transition: one(transitions, {
    fields: [transitionTasks.transitionId],
    references: [transitions.id]
  })
}));

// node_modules/hono/dist/utils/encode.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// node_modules/hono/dist/utils/jwt/jwa.js
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// node_modules/hono/dist/helper/adapter/index.js
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global?.fastly !== void 0) {
    return "fastly";
  }
  if (global?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform);
}, "checkUserAgentEquals");

// node_modules/hono/dist/utils/jwt/types.js
var JwtAlgorithmNotImplemented = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotImplemented");
  }
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
};
var JwtAlgorithmRequired = class extends Error {
  static {
    __name(this, "JwtAlgorithmRequired");
  }
  constructor() {
    super('JWT verification requires "alg" option to be specified');
    this.name = "JwtAlgorithmRequired";
  }
};
var JwtAlgorithmMismatch = class extends Error {
  static {
    __name(this, "JwtAlgorithmMismatch");
  }
  constructor(expected, actual) {
    super(`JWT algorithm mismatch: expected "${expected}", got "${actual}"`);
    this.name = "JwtAlgorithmMismatch";
  }
};
var JwtTokenInvalid = class extends Error {
  static {
    __name(this, "JwtTokenInvalid");
  }
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
};
var JwtTokenNotBefore = class extends Error {
  static {
    __name(this, "JwtTokenNotBefore");
  }
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
};
var JwtTokenExpired = class extends Error {
  static {
    __name(this, "JwtTokenExpired");
  }
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
};
var JwtTokenIssuedAt = class extends Error {
  static {
    __name(this, "JwtTokenIssuedAt");
  }
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
};
var JwtTokenIssuer = class extends Error {
  static {
    __name(this, "JwtTokenIssuer");
  }
  constructor(expected, iss) {
    super(`expected issuer "${expected}", got ${iss ? `"${iss}"` : "none"} `);
    this.name = "JwtTokenIssuer";
  }
};
var JwtHeaderInvalid = class extends Error {
  static {
    __name(this, "JwtHeaderInvalid");
  }
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
};
var JwtHeaderRequiresKid = class extends Error {
  static {
    __name(this, "JwtHeaderRequiresKid");
  }
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
};
var JwtSymmetricAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtSymmetricAlgorithmNotAllowed");
  }
  constructor(alg) {
    super(`symmetric algorithm "${alg}" is not allowed for JWK verification`);
    this.name = "JwtSymmetricAlgorithmNotAllowed";
  }
};
var JwtAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotAllowed");
  }
  constructor(alg, allowedAlgorithms) {
    super(`algorithm "${alg}" is not in the allowed list: [${allowedAlgorithms.join(", ")}]`);
    this.name = "JwtAlgorithmNotAllowed";
  }
};
var JwtTokenSignatureMismatched = class extends Error {
  static {
    __name(this, "JwtTokenSignatureMismatched");
  }
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
};
var JwtPayloadRequiresAud = class extends Error {
  static {
    __name(this, "JwtPayloadRequiresAud");
  }
  constructor(payload) {
    super(`required "aud" in jwt payload: ${JSON.stringify(payload)}`);
    this.name = "JwtPayloadRequiresAud";
  }
};
var JwtTokenAudience = class extends Error {
  static {
    __name(this, "JwtTokenAudience");
  }
  constructor(expected, aud) {
    super(
      `expected audience "${Array.isArray(expected) ? expected.join(", ") : expected}", got "${aud}"`
    );
    this.name = "JwtTokenAudience";
  }
};
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// node_modules/hono/dist/utils/jwt/utf8.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm);
  return await crypto.subtle.sign(algorithm, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm);
  return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*?-+/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
        // 256 >> 3
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
        // 384 >> 3
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
        // 512 >> 3,
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, publicKey, algOrOptions) => {
  if (!algOrOptions) {
    throw new JwtAlgorithmRequired();
  }
  const {
    alg,
    iss,
    nbf = true,
    exp = true,
    iat = true,
    aud
  } = typeof algOrOptions === "string" ? { alg: algOrOptions } : algOrOptions;
  if (!alg) {
    throw new JwtAlgorithmRequired();
  }
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (header.alg !== alg) {
    throw new JwtAlgorithmMismatch(alg, header.alg);
  }
  const now = Math.floor(Date.now() / 1e3);
  if (nbf && payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf) || payload.nbf > now) {
      throw new JwtTokenNotBefore(token);
    }
  }
  if (exp && payload.exp !== void 0) {
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= now) {
      throw new JwtTokenExpired(token);
    }
  }
  if (iat && payload.iat !== void 0) {
    if (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || now < payload.iat) {
      throw new JwtTokenIssuedAt(now, payload.iat);
    }
  }
  if (iss) {
    if (!payload.iss) {
      throw new JwtTokenIssuer(iss, null);
    }
    if (typeof iss === "string" && payload.iss !== iss) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
    if (iss instanceof RegExp && !iss.test(payload.iss)) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
  }
  if (aud) {
    if (!payload.aud) {
      throw new JwtPayloadRequiresAud(payload);
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const matched = audiences.some(
      (payloadAud) => aud instanceof RegExp ? aud.test(payloadAud) : typeof aud === "string" ? payloadAud === aud : Array.isArray(aud) && aud.includes(payloadAud)
    );
    if (!matched) {
      throw new JwtTokenAudience(aud, payload.aud);
    }
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var symmetricAlgorithms = [
  AlgorithmTypes.HS256,
  AlgorithmTypes.HS384,
  AlgorithmTypes.HS512
];
var verifyWithJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const verifyOpts = options.verification || {};
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (symmetricAlgorithms.includes(header.alg)) {
    throw new JwtSymmetricAlgorithmNotAllowed(header.alg);
  }
  if (!options.allowedAlgorithms.includes(header.alg)) {
    throw new JwtAlgorithmNotAllowed(header.alg, options.allowedAlgorithms);
  }
  let verifyKeys = options.keys ? [...options.keys] : void 0;
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    verifyKeys ??= [];
    verifyKeys.push(...data.keys);
  } else if (!verifyKeys) {
    throw new Error('verifyWithJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = verifyKeys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  if (matchingKey.alg && matchingKey.alg !== header.alg) {
    throw new JwtAlgorithmMismatch(matchingKey.alg, header.alg);
  }
  return await verify(token, matchingKey, {
    alg: header.alg,
    ...verifyOpts
  });
}, "verifyWithJwks");
var decode = /* @__PURE__ */ __name((token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  try {
    const header = decodeJwtPart(parts[0]);
    const payload = decodeJwtPart(parts[1]);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  try {
    return decodeJwtPart(parts[0]);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify, decode, verifyWithJwks };

// node_modules/hono/dist/middleware/jwt/jwt.js
var verifyWithJwks2 = Jwt.verifyWithJwks;
var verify2 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// src/services/auth.service.ts
var hashPassword = /* @__PURE__ */ __name(async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}, "hashPassword");
var generateSalt = /* @__PURE__ */ __name(() => {
  return crypto.randomUUID();
}, "generateSalt");
var AuthService = class {
  static {
    __name(this, "AuthService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async login(email, passwordAttempt, jwtSecret) {
    const employee = await this.db.query.employees.findFirst({
      where: eq(employees.email, email)
    });
    if (!employee) {
      throw new Error("Invalid email or password");
    }
    if (!employee.passwordHash || !employee.passwordSalt) {
      throw new Error("Account not fully set up. Contact HR.");
    }
    const hashedAttempt = await hashPassword(passwordAttempt, employee.passwordSalt);
    if (hashedAttempt !== employee.passwordHash) {
      throw new Error("Invalid email or password");
    }
    const payload = {
      sub: employee.id,
      companyId: employee.companyId,
      role: employee.role,
      exp: Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7
      // 1 week
    };
    const token = await sign2(payload, jwtSecret);
    return {
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role,
        avatar: employee.avatar,
        isPasswordChanged: employee.isPasswordChanged
      }
    };
  }
  async changePassword(employeeId, currentPasswordAttempt, newPassword) {
    const employee = await this.db.query.employees.findFirst({
      where: eq(employees.id, employeeId)
    });
    if (!employee) {
      throw new Error("Employee not found");
    }
    if (employee.passwordHash && employee.passwordSalt) {
      const hashedAttempt = await hashPassword(currentPasswordAttempt, employee.passwordSalt);
      if (hashedAttempt !== employee.passwordHash) {
        throw new Error("Invalid current password");
      }
    }
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);
    await this.db.update(employees).set({
      passwordHash: newHash,
      passwordSalt: newSalt,
      isPasswordChanged: true
    }).where(eq(employees.id, employeeId));
    return { success: true };
  }
  async registerCompany(payload, jwtSecret) {
    const { companyName, industry, adminFirstName, adminLastName, adminEmail, adminPassword } = payload;
    const existingEmployee = await this.db.query.employees.findFirst({
      where: eq(employees.email, adminEmail)
    });
    if (existingEmployee) {
      throw new Error("Email is already in use");
    }
    const companyId = `comp-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    const employeeId = `EMP-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    await this.db.insert(companies).values({
      id: companyId,
      name: companyName,
      industry: industry || "Software"
    });
    const salt = generateSalt();
    const hash = await hashPassword(adminPassword, salt);
    await this.db.insert(employees).values({
      id: employeeId,
      companyId,
      name: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      role: "SUPER_ADMIN",
      status: "active",
      department: "Administration",
      employmentType: "Full-time",
      passwordHash: hash,
      passwordSalt: salt,
      isPasswordChanged: true
    });
    const tokenPayload = {
      sub: employeeId,
      companyId,
      role: "SUPER_ADMIN",
      exp: Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 7
      // 1 week
    };
    const token = await sign2(tokenPayload, jwtSecret);
    return {
      token,
      employee: {
        id: employeeId,
        name: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        role: "SUPER_ADMIN",
        avatar: null,
        isPasswordChanged: true
      }
    };
  }
};

// src/services/employee.service.ts
var EmployeeService = class {
  static {
    __name(this, "EmployeeService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getAllByCompany(companyId, search) {
    const conditions = [eq(employees.companyId, companyId)];
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(employees.name, pattern),
          like(employees.lastName, pattern)
        )
      );
    }
    const employees2 = await this.db.query.employees.findMany({
      where: and(...conditions),
      with: {
        emergencyContacts: true,
        employeeDocuments: true
      }
    });
    return employees2.map((emp) => {
      const { passwordHash, passwordSalt, ...safeEmployee } = emp;
      return safeEmployee;
    });
  }
  async getDirectory(companyId) {
    const directory = await this.db.select({
      id: employees.id,
      name: employees.name,
      lastName: employees.lastName,
      email: employees.email,
      phone: employees.phone,
      role: employees.role,
      department: employees.department,
      location: employees.location,
      avatar: employees.avatar,
      managerId: employees.managerId,
      managerName: employees.managerName
    }).from(employees).where(eq(employees.companyId, companyId));
    return directory;
  }
  // Keeps the legacy free-text `department` label in sync with `departmentId`
  // whenever a department is (re)assigned, regardless of entry point.
  async resolveDepartment(companyId, departmentId) {
    return this.db.query.departments.findFirst({
      where: and(eq(departments.id, departmentId), eq(departments.companyId, companyId))
    });
  }
  async createForCompany(companyId, payload) {
    const { emergencyContacts: emergencyContacts2, ...rawEmployeeData } = payload;
    const employeeData = Object.fromEntries(
      Object.entries(rawEmployeeData).map(([k, v]) => [k, v === "" ? null : v])
    );
    if (!employeeData.id) {
      employeeData.id = `EMP-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    }
    if (employeeData.departmentId) {
      const department = await this.resolveDepartment(companyId, employeeData.departmentId);
      employeeData.department = department ? department.name : employeeData.department;
      if (!department) employeeData.departmentId = null;
    }
    const temporaryPassword = `ZenHR-${crypto.randomUUID().split("-")[0]}`;
    const salt = generateSalt();
    const hashedPassword = await hashPassword(temporaryPassword, salt);
    const result = await this.db.insert(employees).values({
      ...employeeData,
      companyId,
      passwordHash: hashedPassword,
      passwordSalt: salt,
      isPasswordChanged: false
    }).returning();
    const newEmployee = result[0];
    const { passwordHash, passwordSalt, ...safeEmployee } = newEmployee;
    safeEmployee.temporaryPassword = temporaryPassword;
    if (emergencyContacts2 && emergencyContacts2.length > 0) {
      const validContacts = emergencyContacts2.filter((c) => c.name && c.name.trim() !== "");
      if (validContacts.length > 0) {
        const contactsToInsert = validContacts.map((c) => ({
          ...c,
          id: `EC-${Math.floor(1e3 + Math.random() * 9e3)}`,
          companyId,
          employeeId: newEmployee.id
        }));
        await this.db.insert(emergencyContacts).values(contactsToInsert);
      }
    }
    return safeEmployee;
  }
  async getFirstEmployeeId(companyId) {
    const result = await this.db.select({ id: employees.id }).from(employees).where(eq(employees.companyId, companyId)).limit(1);
    return result[0]?.id || null;
  }
  async getEmployeeProfile(companyId, employeeId) {
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(employees.id, employeeId), eq(employees.companyId, companyId)),
      with: {
        emergencyContacts: true,
        employeeDocuments: true
      }
    });
    if (!employee) return null;
    const { passwordHash, passwordSalt, ...safeEmployee } = employee;
    return safeEmployee;
  }
  async updateEmployeeProfile(companyId, employeeId, data) {
    const allowedUpdates = {
      phone: data.phone,
      email: data.email,
      location: data.location,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      secondaryBankName: data.secondaryBankName,
      secondaryAccountNumber: data.secondaryAccountNumber,
      secondaryAccountName: data.secondaryAccountName,
      tin: data.tin,
      pfa: data.pfa,
      pensionId: data.pensionId,
      nin: data.nin,
      nhf: data.nhf,
      taxState: data.taxState,
      maritalStatus: data.maritalStatus,
      avatar: data.avatar
    };
    const updateData = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, v]) => v !== void 0)
    );
    if (Object.keys(updateData).length > 0) {
      await this.db.update(employees).set(updateData).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));
    }
    return this.getEmployeeProfile(companyId, employeeId);
  }
  async updateEmployeeByAdmin(companyId, employeeId, data) {
    const { id, companyId: cid, passwordHash, passwordSalt, ...rawUpdateData } = data;
    const updateData = Object.fromEntries(
      Object.entries(rawUpdateData).map(([k, v]) => [k, v === "" ? null : v])
    );
    if ("departmentId" in updateData) {
      if (updateData.departmentId) {
        const department = await this.resolveDepartment(companyId, updateData.departmentId);
        updateData.department = department ? department.name : null;
        if (!department) updateData.departmentId = null;
      } else {
        updateData.department = null;
      }
    }
    if (Object.keys(updateData).length > 0) {
      await this.db.update(employees).set({ ...updateData, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));
    }
    return this.getEmployeeProfile(companyId, employeeId);
  }
  async deleteEmployee(companyId, employeeId) {
    await this.db.delete(emergencyContacts).where(eq(emergencyContacts.employeeId, employeeId));
    await this.db.delete(employeeDocuments).where(eq(employeeDocuments.employeeId, employeeId));
    await this.db.delete(employeeAssets).where(eq(employeeAssets.employeeId, employeeId));
    await this.db.delete(attendanceRecords).where(eq(attendanceRecords.employeeId, employeeId));
    await this.db.delete(overtimeRequests).where(eq(overtimeRequests.employeeId, employeeId));
    await this.db.delete(leaveRequests).where(eq(leaveRequests.employeeId, employeeId));
    await this.db.delete(leaveBalances).where(eq(leaveBalances.employeeId, employeeId));
    await this.db.delete(employeeBenefits).where(eq(employeeBenefits.employeeId, employeeId));
    await this.db.delete(payslips).where(eq(payslips.employeeId, employeeId));
    const employeeLoans = await this.db.select({ id: loans.id }).from(loans).where(eq(loans.employeeId, employeeId)).all();
    const loanIds = employeeLoans.map((l) => l.id);
    if (loanIds.length > 0) {
      await this.db.delete(loanRepayments).where(inArray(loanRepayments.loanId, loanIds));
    }
    await this.db.delete(loans).where(eq(loans.employeeId, employeeId));
    await this.db.delete(employees).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));
    return { success: true };
  }
  async addEmergencyContact(companyId, employeeId, data) {
    const newContact = {
      id: `EC-${Math.floor(1e3 + Math.random() * 9e3)}`,
      companyId,
      employeeId,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      isPrimary: data.isPrimary || false
    };
    console.log("=== DEBUG SCHEMA ===", emergencyContacts);
    if (!emergencyContacts) {
      console.error("emergencyContacts is undefined!");
    }
    const insertBuilder = this.db.insert(emergencyContacts);
    console.log("=== DEBUG INSERT BUILDER ===", Object.keys(insertBuilder), typeof insertBuilder.values);
    await insertBuilder.values(newContact);
    return newContact;
  }
  async deleteEmergencyContact(companyId, employeeId, contactId) {
    await this.db.delete(emergencyContacts).where(
      and(
        eq(emergencyContacts.id, contactId),
        eq(emergencyContacts.companyId, companyId),
        eq(emergencyContacts.employeeId, employeeId)
      )
    );
    return { success: true };
  }
  async addDocument(companyId, employeeId, bucket, data) {
    const documentId = `DOC-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const fileKey = `companies/${companyId}/employees/${employeeId}/documents/${documentId}-${data.file.name}`;
    await bucket.put(fileKey, await data.file.arrayBuffer(), {
      httpMetadata: { contentType: data.file.type }
    });
    const newDocument = {
      id: documentId,
      companyId,
      employeeId,
      name: data.name,
      type: data.type,
      fileKey,
      status: "Active"
    };
    await this.db.insert(employeeDocuments).values(newDocument);
    return newDocument;
  }
  async deleteDocument(companyId, employeeId, bucket, documentId) {
    const doc = await this.db.query.employeeDocuments.findFirst({
      where: and(
        eq(employeeDocuments.id, documentId),
        eq(employeeDocuments.companyId, companyId),
        eq(employeeDocuments.employeeId, employeeId)
      )
    });
    if (!doc) throw new Error("Document not found");
    try {
      if (doc.fileKey) {
        await bucket.delete(doc.fileKey);
      }
    } catch (e) {
      console.error("Failed to delete from R2", e);
    }
    const result = await this.db.delete(employeeDocuments).where(and(
      eq(employeeDocuments.id, documentId),
      eq(employeeDocuments.companyId, companyId),
      eq(employeeDocuments.employeeId, employeeId)
    )).returning();
    return result[0];
  }
  async getAuditLogs(companyId, employeeId) {
    return this.db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.companyId, companyId),
        eq(auditLogs.employeeId, employeeId)
      ),
      orderBy: /* @__PURE__ */ __name((auditLogs2, { desc: desc3 }) => [desc3(auditLogs2.createdAt)], "orderBy")
    });
  }
  async getAssets(companyId, employeeId) {
    return this.db.query.employeeAssets.findMany({
      where: and(
        eq(employeeAssets.companyId, companyId),
        eq(employeeAssets.employeeId, employeeId)
      )
    });
  }
  async addAsset(companyId, employeeId, data) {
    const id = `AST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const result = await this.db.insert(employeeAssets).values({
      id,
      companyId,
      employeeId,
      name: data.name,
      category: data.category,
      serialNumber: data.serialNumber,
      status: data.status || "Assigned",
      condition: data.condition || "Good",
      purchaseDate: data.purchaseDate,
      value: data.value ? parseInt(data.value, 10) : null,
      image: data.image
    }).returning();
    return result[0];
  }
  async deleteAsset(companyId, employeeId, assetId) {
    const result = await this.db.delete(employeeAssets).where(and(
      eq(employeeAssets.id, assetId),
      eq(employeeAssets.companyId, companyId),
      eq(employeeAssets.employeeId, employeeId)
    )).returning();
    return result[0];
  }
  async getDocumentFile(companyId, employeeId, bucket, documentId) {
    const doc = await this.db.query.employeeDocuments.findFirst({
      where: and(
        eq(employeeDocuments.id, documentId),
        eq(employeeDocuments.companyId, companyId),
        eq(employeeDocuments.employeeId, employeeId)
      )
    });
    if (!doc) throw new Error("Document not found");
    const file = await bucket.get(doc.fileKey);
    if (!file) throw new Error("File not found in storage");
    return { file, doc };
  }
};

// src/controllers/admin/employee.controller.ts
var getEmployees = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const search = c.req.query("search");
  const service = new EmployeeService(c.env.DB);
  const result = await service.getAllByCompany(companyId, search);
  return c.json(result);
}, "getEmployees");
var getEmployee = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const result = await service.getEmployeeProfile(companyId, employeeId);
  if (!result) return c.json({ error: "Employee not found" }, 404);
  return c.json(result);
}, "getEmployee");
var getDirectReports = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const employees2 = await service.getAllByCompany(companyId);
  const directReports = employees2.filter((emp) => emp.managerId === employeeId);
  return c.json(directReports);
}, "getDirectReports");
var createEmployee = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  try {
    const result = await service.createForCompany(companyId, body);
    return c.json(result, 201);
  } catch (err) {
    const errorMessage = err.message || "";
    const causeMessage = err.cause?.message || err.cause?.cause?.message || "";
    if (errorMessage.includes("UNIQUE constraint failed") || causeMessage.includes("UNIQUE constraint failed")) {
      return c.json({ error: "An employee with this email already exists." }, 400);
    }
    return c.json({ error: errorMessage || "Internal Server Error" }, 500);
  }
}, "createEmployee");
var updateEmployee = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  const result = await service.updateEmployeeByAdmin(companyId, employeeId, body);
  return c.json(result);
}, "updateEmployee");
var deleteEmployee = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const result = await service.deleteEmployee(companyId, employeeId);
  return c.json(result);
}, "deleteEmployee");
var addEmergencyContact = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const body = await c.req.json();
  const service = new EmployeeService(c.env.DB);
  const result = await service.addEmergencyContact(companyId, employeeId, body);
  return c.json(result, 201);
}, "addEmergencyContact");
var deleteEmergencyContact = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const contactId = c.req.param("contactId");
  const service = new EmployeeService(c.env.DB);
  const result = await service.deleteEmergencyContact(companyId, employeeId, contactId);
  return c.json(result);
}, "deleteEmergencyContact");
var addDocument = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const formData = await c.req.parseBody();
  const file = formData.file;
  const name = formData.name;
  const type = formData.type;
  if (!file) return c.json({ error: "No file uploaded" }, 400);
  const result = await service.addDocument(companyId, employeeId, c.env.BUCKET, { name, type, file });
  return c.json(result, 201);
}, "addDocument");
var deleteDocument = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const documentId = c.req.param("documentId");
  const service = new EmployeeService(c.env.DB);
  const result = await service.deleteDocument(companyId, employeeId, c.env.BUCKET, documentId);
  return c.json(result);
}, "deleteDocument");
var getAuditLogs = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const result = await service.getAuditLogs(companyId, employeeId);
  return c.json(result);
}, "getAuditLogs");
var getAssets = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const result = await service.getAssets(companyId, employeeId);
  return c.json(result);
}, "getAssets");
var addAsset = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const service = new EmployeeService(c.env.DB);
  const body = await c.req.json();
  const result = await service.addAsset(companyId, employeeId, body);
  return c.json(result, 201);
}, "addAsset");
var deleteAsset = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const assetId = c.req.param("assetId");
  const service = new EmployeeService(c.env.DB);
  const result = await service.deleteAsset(companyId, employeeId, assetId);
  return c.json(result);
}, "deleteAsset");

// src/services/transition.service.ts
var ONBOARDING_STAGES = ["Pre-boarding", "Orientation", "Equipment & Access", "Training", "Final Review"];
var OFFBOARDING_STAGES = ["Exit Interview", "Handover", "Asset Return", "Account Deactivation"];
var DAY_MS = 24 * 60 * 60 * 1e3;
var addDays = /* @__PURE__ */ __name((iso, days) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString().split("T")[0], "addDays");
var deriveStage = /* @__PURE__ */ __name((type, progress) => {
  const stages = type === "Offboarding" ? OFFBOARDING_STAGES : ONBOARDING_STAGES;
  if (progress <= 0) return stages[0];
  const idx = Math.min(stages.length - 1, Math.floor(progress / 100 * stages.length));
  return stages[idx];
}, "deriveStage");
var buildDefaultTasks = /* @__PURE__ */ __name((type, ctx) => {
  if (type === "Offboarding") {
    const lastDay = ctx.targetDate || ctx.startDate;
    const tasks = [
      { title: "Confirm Transition Plan with Manager", category: "HR", assignedTo: ctx.managerName || "Manager", dueDate: ctx.startDate },
      {
        title: ctx.exitInterviewScheduled ? "Conduct Exit Interview" : "Schedule Exit Interview",
        category: "HR",
        assignedTo: "HR Dept",
        dueDate: lastDay
      },
      {
        title: ctx.handoverToName ? `Handover Responsibilities to ${ctx.handoverToName}` : "Handover Responsibilities",
        category: "Admin",
        assignedTo: ctx.employeeName,
        dueDate: lastDay
      },
      { title: "Revoke IT Access & Accounts", category: "IT", assignedTo: "IT Dept", dueDate: lastDay },
      { title: "Process Final Settlement", category: "Finance", assignedTo: "Payroll Dept", dueDate: addDays(lastDay, 7) }
    ];
    for (const item of ctx.assetChecklist || []) {
      tasks.push({ title: `Return ${item}`, category: "IT", assignedTo: ctx.employeeName, dueDate: lastDay });
    }
    return tasks;
  }
  return [
    { title: "Sign Offer Letter", category: "HR", assignedTo: ctx.employeeName, dueDate: ctx.startDate },
    { title: "Complete Documentation (Bank, Tax, Pension)", category: "HR", assignedTo: ctx.employeeName, dueDate: addDays(ctx.startDate, 2) },
    { title: "Provision IT Accounts & Equipment", category: "IT", assignedTo: "IT Dept", dueDate: addDays(ctx.startDate, 1) },
    { title: "HR Orientation Session", category: "HR", assignedTo: "HR Dept", dueDate: addDays(ctx.startDate, 3) },
    { title: "Team Introduction", category: "Admin", assignedTo: ctx.managerName || "Manager", dueDate: addDays(ctx.startDate, 3) },
    { title: "Benefits Enrollment", category: "HR", assignedTo: ctx.employeeName, dueDate: addDays(ctx.startDate, 7) }
  ];
}, "buildDefaultTasks");
var TransitionService = class {
  static {
    __name(this, "TransitionService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async withDetail(row) {
    const [tasks, employee] = await Promise.all([
      this.db.query.transitionTasks.findMany({
        where: eq(transitionTasks.transitionId, row.id),
        orderBy: /* @__PURE__ */ __name((t, { asc: ascFn }) => [ascFn(t.sortOrder)], "orderBy")
      }),
      this.db.query.employees.findFirst({ where: eq(employees.id, row.employeeId) })
    ]);
    return {
      ...row,
      employeeName: employee ? [employee.name, employee.lastName].filter(Boolean).join(" ") : "Unknown",
      employee: employee ? {
        id: employee.id,
        name: employee.name,
        lastName: employee.lastName,
        avatar: employee.avatar,
        role: employee.role,
        department: employee.department,
        status: employee.status
      } : null,
      progress: tasks.length ? Math.round(tasks.filter((t) => t.status === "completed").length / tasks.length * 100) : 0,
      tasks
    };
  }
  async getAllByCompany(companyId, type) {
    const conditions = [eq(transitions.companyId, companyId)];
    if (type) conditions.push(eq(transitions.type, type));
    const rows = await this.db.query.transitions.findMany({
      where: and(...conditions),
      orderBy: /* @__PURE__ */ __name((t, { desc: desc3 }) => [desc3(t.createdAt)], "orderBy")
    });
    return Promise.all(rows.map((row) => this.withDetail(row)));
  }
  async getById(companyId, id) {
    const row = await this.db.query.transitions.findFirst({
      where: and(eq(transitions.companyId, companyId), eq(transitions.id, id))
    });
    if (!row) return null;
    return this.withDetail(row);
  }
  async create(companyId, actor, payload) {
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(employees.id, payload.employeeId), eq(employees.companyId, companyId))
    });
    if (!employee) throw new Error("Employee not found");
    const type = payload.type === "Offboarding" ? "Offboarding" : "Onboarding";
    const id = `TRN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const startDate = payload.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const employeeName = [employee.name, employee.lastName].filter(Boolean).join(" ");
    const manager = employee.managerId ? await this.db.query.employees.findFirst({ where: eq(employees.id, employee.managerId) }) : null;
    const baseTasks = Array.isArray(payload.checklist) && payload.checklist.length > 0 ? payload.checklist : buildDefaultTasks(type, {
      employeeName,
      managerName: manager ? [manager.name, manager.lastName].filter(Boolean).join(" ") : employee.managerName,
      startDate,
      targetDate: payload.targetDate,
      handoverToName: payload.handoverToName,
      exitInterviewScheduled: !!payload.exitInterviewScheduled,
      assetChecklist: payload.assetChecklist
    });
    const extraTasks = Array.isArray(payload.extraTasks) ? payload.extraTasks.filter((t) => t?.title?.trim()) : [];
    const taskDefs = [...baseTasks, ...extraTasks];
    await this.db.insert(transitions).values({
      id,
      companyId,
      employeeId: employee.id,
      type,
      stage: deriveStage(type, 0),
      status: "Active",
      startDate,
      targetDate: payload.targetDate || null,
      reason: type === "Offboarding" ? payload.reason || null : null,
      handoverToId: payload.handoverToId || null,
      handoverToName: payload.handoverToName || null,
      exitInterviewScheduled: !!payload.exitInterviewScheduled,
      initiatedById: actor.id,
      initiatedByName: actor.name
    });
    if (taskDefs.length > 0) {
      await this.db.insert(transitionTasks).values(
        taskDefs.map((t, idx) => ({
          id: `TSK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          companyId,
          transitionId: id,
          title: t.title,
          category: t.category || "Admin",
          assignedTo: t.assignedTo || null,
          dueDate: t.dueDate || null,
          status: "pending",
          sortOrder: idx
        }))
      );
    }
    if (type === "Onboarding" && employee.status !== "active") {
      await this.db.update(employees).set({ status: "onboarding", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(employees.id, employee.id));
    } else if (type === "Offboarding" && employee.status !== "terminated") {
      await this.db.update(employees).set({ status: "notice", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(employees.id, employee.id));
    }
    const created = await this.db.query.transitions.findFirst({ where: eq(transitions.id, id) });
    return this.withDetail(created);
  }
  async addTask(companyId, transitionId, data) {
    const transition = await this.db.query.transitions.findFirst({
      where: and(eq(transitions.companyId, companyId), eq(transitions.id, transitionId))
    });
    if (!transition) return null;
    const existing = await this.db.query.transitionTasks.findMany({ where: eq(transitionTasks.transitionId, transitionId) });
    await this.db.insert(transitionTasks).values({
      id: `TSK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      companyId,
      transitionId,
      title: data.title,
      category: data.category || "Admin",
      assignedTo: data.assignedTo || null,
      dueDate: data.dueDate || null,
      status: "pending",
      sortOrder: existing.length
    });
    return this.recompute(companyId, transitionId);
  }
  async setTaskStatus(companyId, transitionId, taskId, status) {
    const task = await this.db.query.transitionTasks.findFirst({
      where: and(
        eq(transitionTasks.id, taskId),
        eq(transitionTasks.companyId, companyId),
        eq(transitionTasks.transitionId, transitionId)
      )
    });
    if (!task) return null;
    await this.db.update(transitionTasks).set({ status, completedAt: status === "completed" ? (/* @__PURE__ */ new Date()).toISOString() : null }).where(eq(transitionTasks.id, taskId));
    return this.recompute(companyId, transitionId);
  }
  // Recomputes stage/progress/status from the current task list and keeps
  // the linked employee's status in sync when a journey completes.
  async recompute(companyId, transitionId) {
    const transition = await this.db.query.transitions.findFirst({
      where: and(eq(transitions.companyId, companyId), eq(transitions.id, transitionId))
    });
    if (!transition) return null;
    if (transition.status === "Cancelled") return this.withDetail(transition);
    const tasks = await this.db.query.transitionTasks.findMany({ where: eq(transitionTasks.transitionId, transitionId) });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const progress = total ? Math.round(completed / total * 100) : 0;
    const isComplete = total > 0 && completed === total;
    const wasComplete = transition.status === "Completed";
    await this.db.update(transitions).set({
      stage: deriveStage(transition.type, progress),
      status: isComplete ? "Completed" : "Active",
      completedAt: isComplete ? transition.completedAt || (/* @__PURE__ */ new Date()).toISOString() : null,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq(transitions.id, transitionId));
    if (isComplete && !wasComplete) {
      const employee = await this.db.query.employees.findFirst({ where: eq(employees.id, transition.employeeId) });
      if (employee) {
        if (transition.type === "Onboarding" && employee.status === "onboarding") {
          await this.db.update(employees).set({ status: "active", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(employees.id, employee.id));
        } else if (transition.type === "Offboarding" && employee.status !== "terminated") {
          await this.db.update(employees).set({ status: "terminated", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(employees.id, employee.id));
        }
      }
    }
    const updated = await this.db.query.transitions.findFirst({ where: eq(transitions.id, transitionId) });
    return this.withDetail(updated);
  }
  async cancel(companyId, id) {
    const transition = await this.db.query.transitions.findFirst({
      where: and(eq(transitions.companyId, companyId), eq(transitions.id, id))
    });
    if (!transition) return null;
    await this.db.update(transitions).set({ status: "Cancelled", cancelledAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(transitions.id, id));
    const updated = await this.db.query.transitions.findFirst({ where: eq(transitions.id, id) });
    return this.withDetail(updated);
  }
};

// src/controllers/admin/transition.controller.ts
var getActor = /* @__PURE__ */ __name(async (c) => {
  const employeeId = c.get("employeeId");
  if (!employeeId) return { id: "system", name: "System" };
  const db = drizzle(c.env.DB, { schema: schema_exports });
  const employee = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(" ") : "Unknown";
  return { id: employeeId, name };
}, "getActor");
var getTransitions = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const type = c.req.query("type");
  const service = new TransitionService(c.env.DB);
  const rows = await service.getAllByCompany(companyId, type);
  return c.json(rows);
}, "getTransitions");
var getTransition = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const service = new TransitionService(c.env.DB);
  const row = await service.getById(companyId, id);
  if (!row) return c.json({ error: "Transition not found" }, 404);
  return c.json(row);
}, "getTransition");
var createTransition = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  if (!payload.employeeId) return c.json({ error: "employeeId is required" }, 400);
  try {
    const actor = await getActor(c);
    const service = new TransitionService(c.env.DB);
    const created = await service.create(companyId, actor, payload);
    return c.json(created, 201);
  } catch (err) {
    return c.json({ error: err.message || "Failed to start transition" }, 400);
  }
}, "createTransition");
var addTransitionTask = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const payload = await c.req.json();
  if (!payload.title) return c.json({ error: "title is required" }, 400);
  const service = new TransitionService(c.env.DB);
  const updated = await service.addTask(companyId, id, payload);
  if (!updated) return c.json({ error: "Transition not found" }, 404);
  return c.json(updated, 201);
}, "addTransitionTask");
var updateTransitionTaskStatus = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const taskId = c.req.param("taskId");
  const { status } = await c.req.json();
  if (status !== "pending" && status !== "completed") {
    return c.json({ error: "status must be 'pending' or 'completed'" }, 400);
  }
  const service = new TransitionService(c.env.DB);
  const updated = await service.setTaskStatus(companyId, id, taskId, status);
  if (!updated) return c.json({ error: "Transition or task not found" }, 404);
  return c.json(updated);
}, "updateTransitionTaskStatus");
var cancelTransition = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const service = new TransitionService(c.env.DB);
  const updated = await service.cancel(companyId, id);
  if (!updated) return c.json({ error: "Transition not found" }, 404);
  return c.json(updated);
}, "cancelTransition");

// src/middlewares/auth.middleware.ts
var authMiddleware = /* @__PURE__ */ __name(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const companyId = c.req.header("x-company-id");
    if (companyId) {
      c.set("companyId", companyId);
      const employeeId = c.req.header("x-employee-id");
      if (employeeId) c.set("employeeId", employeeId);
      return await next();
    }
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }
  const token = authHeader.split(" ")[1];
  const jwtSecret = c.env.JWT_SECRET || "fallback_secret_for_local_dev";
  try {
    const payload = await verify2(token, jwtSecret, "HS256");
    c.set("employeeId", payload.sub);
    c.set("companyId", payload.companyId);
    c.set("role", payload.role);
    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
}, "authMiddleware");

// src/middlewares/role.middleware.ts
var requireRole = /* @__PURE__ */ __name((...allowedRoles) => {
  return async (c, next) => {
    const role = c.get("role");
    if (!role || !allowedRoles.includes(role)) {
      return c.json({ error: "Forbidden: insufficient permissions" }, 403);
    }
    await next();
  };
}, "requireRole");
var hasCustomPermission = /* @__PURE__ */ __name(async (db, employeeId, moduleKey, action) => {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId)
  });
  if (!employee?.customRoleId) return true;
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, employee.customRoleId)
  });
  const permissions = role?.permissions || {};
  return permissions?.[moduleKey]?.[action] === true;
}, "hasCustomPermission");
var requirePermission = /* @__PURE__ */ __name((moduleKey, action) => {
  return async (c, next) => {
    const employeeId = c.get("employeeId");
    if (!employeeId) {
      return c.json({ error: "Forbidden: insufficient permissions" }, 403);
    }
    const db = drizzle(c.env.DB, { schema: schema_exports });
    const allowed = await hasCustomPermission(db, employeeId, moduleKey, action);
    if (!allowed) {
      return c.json({ error: "Forbidden: custom role does not grant this permission" }, 403);
    }
    await next();
  };
}, "requirePermission");

// src/services/payroll.service.ts
var genId = /* @__PURE__ */ __name((prefix) => `${prefix}-${crypto.randomUUID().split("-")[0].toUpperCase()}`, "genId");
var DEFAULT_TAX_BRACKETS = [
  { minIncome: 0, maxIncome: 3e5, ratePercent: 7 },
  { minIncome: 300001, maxIncome: 6e5, ratePercent: 11 },
  { minIncome: 600001, maxIncome: 11e5, ratePercent: 15 },
  { minIncome: 1100001, maxIncome: 16e5, ratePercent: 19 },
  { minIncome: 1600001, maxIncome: 32e5, ratePercent: 21 },
  { minIncome: 3200001, maxIncome: null, ratePercent: 24 }
];
var DEFAULT_SETTINGS = {
  payCycle: "monthly",
  cutoffDay: 20,
  paymentDay: 25,
  workingDaysPerMonth: 22,
  prorationEnabled: true,
  minWageCheckEnabled: true,
  minWageAnnual: 36e4,
  pensionEmployeeRate: 8,
  pensionEmployerRate: 10,
  applyConsolidatedReliefAllowance: true,
  currency: "NGN"
};
function calculateAnnualPaye(taxableAnnualIncome, brackets) {
  const sorted = [...brackets].sort((a, b) => a.minIncome - b.minIncome);
  let remaining = Math.max(0, taxableAnnualIncome);
  let tax = 0;
  for (const band of sorted) {
    if (remaining <= 0) break;
    const width = band.maxIncome != null ? Math.max(0, band.maxIncome - band.minIncome + 1) : Infinity;
    const amountInBand = Math.min(remaining, width);
    tax += amountInBand * (band.ratePercent / 100);
    remaining -= amountInBand;
  }
  return Math.round(tax);
}
__name(calculateAnnualPaye, "calculateAnnualPaye");
var nextPeriod = /* @__PURE__ */ __name((month, year) => month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year }, "nextPeriod");
var PayrollService = class {
  static {
    __name(this, "PayrollService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  // ---------------- Settings ----------------
  async getSettings(companyId) {
    const existing = await this.db.query.payrollSettings.findFirst({
      where: eq(payrollSettings.companyId, companyId)
    });
    if (existing) return existing;
    const settings = { companyId, ...DEFAULT_SETTINGS };
    await this.db.insert(payrollSettings).values(settings);
    return settings;
  }
  async updateSettings(companyId, payload) {
    await this.getSettings(companyId);
    const { companyId: _drop, createdAt, updatedAt, ...rest } = payload || {};
    await this.db.update(payrollSettings).set(rest).where(eq(payrollSettings.companyId, companyId));
    return this.getSettings(companyId);
  }
  // ---------------- Tax brackets ----------------
  async getTaxBrackets(companyId) {
    const existing = await this.db.query.taxBrackets.findMany({
      where: eq(taxBrackets.companyId, companyId),
      orderBy: [asc(taxBrackets.sortOrder)]
    });
    if (existing.length > 0) return existing;
    const rows = DEFAULT_TAX_BRACKETS.map((b, i) => ({ id: genId("TB"), companyId, ...b, sortOrder: i }));
    await this.db.insert(taxBrackets).values(rows);
    return rows;
  }
  async replaceTaxBrackets(companyId, brackets) {
    await this.db.delete(taxBrackets).where(eq(taxBrackets.companyId, companyId));
    const rows = (brackets || []).map((b, i) => ({
      id: genId("TB"),
      companyId,
      minIncome: Number(b.minIncome) || 0,
      maxIncome: b.maxIncome === null || b.maxIncome === "" || b.maxIncome === void 0 ? null : Number(b.maxIncome),
      ratePercent: Number(b.ratePercent) || 0,
      sortOrder: i
    }));
    if (rows.length > 0) await this.db.insert(taxBrackets).values(rows);
    return rows;
  }
  // ---------------- Salary components ----------------
  async getSalaryComponents(companyId) {
    const existing = await this.db.query.salaryComponents.findMany({
      where: eq(salaryComponents.companyId, companyId)
    });
    if (existing.length > 0) return existing;
    const defaults = [
      { name: "Basic Salary", type: "earning", calculationType: "percentage_of_gross", value: 40, taxable: true, statutory: true },
      { name: "Housing Allowance", type: "earning", calculationType: "percentage_of_basic", value: 50, taxable: true, statutory: false },
      { name: "Transport Allowance", type: "earning", calculationType: "percentage_of_gross", value: 10, taxable: true, statutory: false },
      { name: "Pension Contribution", type: "deduction", calculationType: "percentage_of_basic", value: 8, taxable: false, statutory: true }
    ].map((c) => ({ id: genId("SC"), companyId, active: true, ...c }));
    await this.db.insert(salaryComponents).values(defaults);
    return defaults;
  }
  async createSalaryComponent(companyId, payload) {
    const row = { id: genId("SC"), companyId, active: true, statutory: false, taxable: true, ...payload };
    await this.db.insert(salaryComponents).values(row);
    return row;
  }
  async updateSalaryComponent(companyId, id, payload) {
    const { id: _id, companyId: _c, ...rest } = payload || {};
    await this.db.update(salaryComponents).set(rest).where(and(eq(salaryComponents.id, id), eq(salaryComponents.companyId, companyId)));
    return this.db.query.salaryComponents.findFirst({ where: eq(salaryComponents.id, id) });
  }
  async deleteSalaryComponent(companyId, id) {
    const existing = await this.db.query.salaryComponents.findFirst({
      where: and(eq(salaryComponents.id, id), eq(salaryComponents.companyId, companyId))
    });
    if (!existing) return null;
    if (existing.statutory) throw new Error("Statutory components cannot be deleted");
    await this.db.delete(salaryComponents).where(eq(salaryComponents.id, id));
    return existing;
  }
  // ---------------- Pay grades ----------------
  async getPayGrades(companyId) {
    return this.db.query.payGrades.findMany({ where: eq(payGrades.companyId, companyId), orderBy: [asc(payGrades.level)] });
  }
  async createPayGrade(companyId, payload) {
    const row = { id: genId("PG"), companyId, ...payload };
    await this.db.insert(payGrades).values(row);
    return row;
  }
  async updatePayGrade(companyId, id, payload) {
    const { id: _id, companyId: _c, ...rest } = payload || {};
    await this.db.update(payGrades).set(rest).where(and(eq(payGrades.id, id), eq(payGrades.companyId, companyId)));
    return this.db.query.payGrades.findFirst({ where: eq(payGrades.id, id) });
  }
  async deletePayGrade(companyId, id) {
    const existing = await this.db.query.payGrades.findFirst({ where: and(eq(payGrades.id, id), eq(payGrades.companyId, companyId)) });
    if (!existing) return null;
    await this.db.delete(payGrades).where(eq(payGrades.id, id));
    return existing;
  }
  // ---------------- Loans ----------------
  async getLoans(companyId) {
    const rows = await this.db.query.loans.findMany({
      where: eq(loans.companyId, companyId),
      orderBy: [desc(loans.createdAt)]
    });
    const employees2 = await this.db.query.employees.findMany({ where: eq(employees.companyId, companyId) });
    const byId = new Map(employees2.map((e) => [e.id, e]));
    return rows.map((l) => {
      const emp = byId.get(l.employeeId);
      return { ...l, employeeName: emp ? `${emp.name} ${emp.lastName || ""}`.trim() : "Unknown" };
    });
  }
  async createLoan(companyId, payload) {
    const principal = Number(payload.principal) || 0;
    const durationMonths = Math.max(1, Number(payload.durationMonths) || 1);
    const interestRatePercent = Number(payload.interestRatePercent) || 0;
    const totalRepayable = principal + principal * (interestRatePercent / 100);
    const monthlyInstallment = Math.round(totalRepayable / durationMonths);
    const row = {
      id: genId("LN"),
      companyId,
      employeeId: payload.employeeId,
      principal,
      interestRatePercent,
      durationMonths,
      monthlyInstallment,
      remainingBalance: Math.round(totalRepayable),
      status: "active",
      purpose: payload.purpose || null,
      startDate: payload.startDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    };
    await this.db.insert(loans).values(row);
    return row;
  }
  async updateLoan(companyId, id, payload) {
    const { id: _id, companyId: _c, employeeId, ...rest } = payload || {};
    await this.db.update(loans).set(rest).where(and(eq(loans.id, id), eq(loans.companyId, companyId)));
    return this.db.query.loans.findFirst({ where: eq(loans.id, id) });
  }
  async deleteLoan(companyId, id) {
    const existing = await this.db.query.loans.findFirst({ where: and(eq(loans.id, id), eq(loans.companyId, companyId)) });
    if (!existing) return null;
    await this.db.delete(loans).where(eq(loans.id, id));
    return existing;
  }
  async getLoanRepayments(companyId, loanId) {
    return this.db.query.loanRepayments.findMany({
      where: and(eq(loanRepayments.loanId, loanId), eq(loanRepayments.companyId, companyId)),
      orderBy: [desc(loanRepayments.paidAt)]
    });
  }
  async getActiveLoansByEmployee(companyId) {
    const rows = await this.db.query.loans.findMany({
      where: and(eq(loans.companyId, companyId), eq(loans.status, "active"))
    });
    const map = /* @__PURE__ */ new Map();
    for (const l of rows) map.set(l.employeeId, l);
    return map;
  }
  // ---------------- Attendance summary ----------------
  async getAttendanceSummary(companyId, month, year) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const rows = await this.db.select({
      employeeId: attendanceRecords.employeeId,
      status: attendanceRecords.status,
      overtime: attendanceRecords.overtime
    }).from(attendanceRecords).where(
      and(
        eq(attendanceRecords.companyId, companyId),
        gte(attendanceRecords.date, start),
        lte(attendanceRecords.date, end)
      )
    );
    const map = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const cur = map.get(r.employeeId) || { present: 0, overtime: 0 };
      if (r.status === "present") cur.present += 1;
      cur.overtime += r.overtime || 0;
      map.set(r.employeeId, cur);
    }
    return map;
  }
  // ---------------- Exceptions (dashboard) ----------------
  buildExceptions(activeEmployees) {
    const exceptions = [];
    for (const emp of activeEmployees) {
      const name = `${emp.name} ${emp.lastName || ""}`.trim();
      if (!emp.accountNumber || !emp.bankName) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: "Missing Bank Details", severity: "red", type: "Compliance" });
      }
      if (!emp.salary && !emp.baseSalary) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: "Salary Not Configured", severity: "red", type: "Calculation" });
      }
      if (!emp.pfa && !emp.pensionId) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: "Missing PFA / Pension ID", severity: "orange", type: "Statutory" });
      }
      if (!emp.tin) {
        exceptions.push({ employeeId: emp.id, employeeName: name, issue: "Missing TIN", severity: "orange", type: "Statutory" });
      }
    }
    return exceptions;
  }
  // ---------------- Core computation ----------------
  computePayslip(emp, settings, brackets, month, year, attendance, loan, overrides) {
    const workingDays = settings.workingDaysPerMonth || 22;
    const daysInMonth = new Date(year, month, 0).getDate();
    let proratedDays = daysInMonth;
    let isProrated = false;
    if (settings.prorationEnabled && emp.hireDate) {
      const hire = new Date(emp.hireDate);
      if (!Number.isNaN(hire.getTime()) && hire.getFullYear() === year && hire.getMonth() + 1 === month) {
        proratedDays = Math.max(0, daysInMonth - hire.getDate() + 1);
        isProrated = true;
      }
    }
    const prorationFactor = daysInMonth > 0 ? proratedDays / daysInMonth : 1;
    const annualSalary = emp.salary || emp.baseSalary || 0;
    const grossMonthlyFull = Math.round(annualSalary / 12);
    const proratedGross = Math.round(grossMonthlyFull * prorationFactor);
    const basicSalary = Math.round(proratedGross * 0.4);
    const allowances = proratedGross - basicSalary;
    const bonuses = Math.max(0, Math.round(Number(overrides?.bonuses) || 0));
    const grossPay = proratedGross + bonuses;
    const pensionableBase = basicSalary + allowances;
    const pensionDeductions = Math.round(pensionableBase * ((settings.pensionEmployeeRate ?? 8) / 100));
    const grossAnnual = grossPay * 12;
    let taxableAnnual;
    if (settings.applyConsolidatedReliefAllowance) {
      const cra = Math.max(2e5, grossAnnual * 0.01) + grossAnnual * 0.2;
      taxableAnnual = Math.max(0, grossAnnual - cra - pensionDeductions * 12);
    } else {
      taxableAnnual = Math.max(0, grossAnnual - pensionDeductions * 12);
    }
    const taxDeductions = Math.round(calculateAnnualPaye(taxableAnnual, brackets) / 12);
    const loanDeduction = loan && loan.remainingBalance > 0 ? Math.min(loan.monthlyInstallment, loan.remainingBalance) : 0;
    const otherDeductions = Math.max(0, Math.round(Number(overrides?.otherDeductions) || 0));
    const netPay = grossPay - taxDeductions - pensionDeductions - loanDeduction - otherDeductions;
    return {
      id: crypto.randomUUID(),
      employeeId: emp.id,
      employeeName: `${emp.name} ${emp.lastName || ""}`.trim(),
      department: emp.department || "Unassigned",
      bankName: emp.bankName || null,
      accountNumber: emp.accountNumber || null,
      accountName: emp.accountName || null,
      basicSalary,
      allowances,
      bonuses,
      grossPay,
      taxDeductions,
      pensionDeductions,
      loanDeductions: loanDeduction,
      otherDeductions,
      netPay,
      isProrated,
      workingDays,
      presentDays: attendance?.present ?? workingDays,
      absentDays: Math.max(0, workingDays - (attendance?.present ?? workingDays)),
      overtimeHours: attendance?.overtime ?? 0,
      loanId: loan?.id || null
    };
  }
  async previewRun(companyId, month, year, overrides = {}) {
    const activeEmployees = await this.db.query.employees.findMany({
      where: and(eq(employees.companyId, companyId), eq(employees.status, "active"))
    });
    const [settings, brackets, attendanceMap, loanMap] = await Promise.all([
      this.getSettings(companyId),
      this.getTaxBrackets(companyId),
      this.getAttendanceSummary(companyId, month, year),
      this.getActiveLoansByEmployee(companyId)
    ]);
    let totalGross = 0;
    let totalNet = 0;
    let totalTaxes = 0;
    let totalPension = 0;
    let totalLoanDeductions = 0;
    const payslips2 = activeEmployees.map((emp) => {
      const ps = this.computePayslip(emp, settings, brackets, month, year, attendanceMap.get(emp.id), loanMap.get(emp.id), overrides?.[emp.id]);
      totalGross += ps.grossPay;
      totalNet += ps.netPay;
      totalTaxes += ps.taxDeductions;
      totalPension += ps.pensionDeductions;
      totalLoanDeductions += ps.loanDeductions;
      return ps;
    });
    return {
      periodMonth: month,
      periodYear: year,
      status: "preview",
      totalGross,
      totalNet,
      totalTaxes,
      totalPension,
      totalLoanDeductions,
      employeeCount: activeEmployees.length,
      exceptions: this.buildExceptions(activeEmployees),
      payslips: payslips2
    };
  }
  // ---------------- Run lifecycle ----------------
  async submitRun(companyId, submittedBy, payload) {
    const { periodMonth, periodYear, overrides, notes } = payload;
    const preview = await this.previewRun(companyId, periodMonth, periodYear, overrides || {});
    const settings = await this.getSettings(companyId);
    const runId = genId("RUN");
    await this.db.insert(payrollRuns).values({
      id: runId,
      companyId,
      periodMonth,
      periodYear,
      status: "pending_approval",
      totalGross: preview.totalGross,
      totalNet: preview.totalNet,
      totalTaxes: preview.totalTaxes,
      totalPension: preview.totalPension,
      totalLoanDeductions: preview.totalLoanDeductions,
      employeeCount: preview.employeeCount,
      dueDate: `${periodYear}-${String(periodMonth).padStart(2, "0")}-${String(settings.paymentDay).padStart(2, "0")}`,
      submittedBy: submittedBy || null,
      submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
      notes: notes || null
    });
    if (preview.payslips.length > 0) {
      const rows = preview.payslips.map((ps) => ({
        id: ps.id,
        runId,
        employeeId: ps.employeeId,
        employeeName: ps.employeeName,
        department: ps.department,
        bankName: ps.bankName,
        accountNumber: ps.accountNumber,
        accountName: ps.accountName,
        basicSalary: ps.basicSalary,
        allowances: ps.allowances,
        bonuses: ps.bonuses,
        grossPay: ps.grossPay,
        taxDeductions: ps.taxDeductions,
        pensionDeductions: ps.pensionDeductions,
        loanDeductions: ps.loanDeductions,
        otherDeductions: ps.otherDeductions,
        netPay: ps.netPay,
        isProrated: ps.isProrated,
        workingDays: ps.workingDays,
        presentDays: ps.presentDays,
        absentDays: ps.absentDays,
        overtimeHours: ps.overtimeHours
      }));
      const CHUNK_SIZE = 4;
      const chunks = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE));
      const statements = chunks.map((chunk) => this.db.insert(payslips).values(chunk));
      await this.db.batch(statements);
    }
    return this.getRun(companyId, runId);
  }
  async getRuns(companyId, status) {
    const where = status ? and(eq(payrollRuns.companyId, companyId), eq(payrollRuns.status, status)) : eq(payrollRuns.companyId, companyId);
    return this.db.query.payrollRuns.findMany({
      where,
      orderBy: [desc(payrollRuns.periodYear), desc(payrollRuns.periodMonth)]
    });
  }
  async getRun(companyId, runId) {
    const run = await this.db.query.payrollRuns.findFirst({
      where: and(eq(payrollRuns.id, runId), eq(payrollRuns.companyId, companyId))
    });
    if (!run) return null;
    const payslips2 = await this.db.query.payslips.findMany({ where: eq(payslips.runId, runId) });
    return { ...run, payslips: payslips2 };
  }
  async approveRun(companyId, runId, approvedBy) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    if (run.status !== "pending_approval") throw new Error(`Cannot approve a run in "${run.status}" status`);
    await this.db.update(payrollRuns).set({ status: "approved", approvedBy: approvedBy || null, approvedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(payrollRuns.id, runId));
    return this.getRun(companyId, runId);
  }
  async rejectRun(companyId, runId, reason) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    if (run.status !== "pending_approval") throw new Error(`Cannot reject a run in "${run.status}" status`);
    await this.db.update(payrollRuns).set({ status: "rejected", rejectedReason: reason || null }).where(eq(payrollRuns.id, runId));
    return this.getRun(companyId, runId);
  }
  async markRunPaid(companyId, runId) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    if (run.status !== "approved") throw new Error(`Cannot mark a run in "${run.status}" status as paid`);
    const paidAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.db.update(payrollRuns).set({ status: "paid", paidAt }).where(eq(payrollRuns.id, runId));
    for (const ps of run.payslips) {
      if (!ps.loanDeductions) continue;
      const loan = await this.db.query.loans.findFirst({ where: eq(loans.employeeId, ps.employeeId) });
      const activeLoan = loan && loan.status === "active" ? loan : await this.db.query.loans.findFirst({
        where: and(eq(loans.companyId, companyId), eq(loans.employeeId, ps.employeeId), eq(loans.status, "active"))
      });
      if (!activeLoan) continue;
      const newBalance = Math.max(0, activeLoan.remainingBalance - ps.loanDeductions);
      await this.db.update(loans).set({ remainingBalance: newBalance, status: newBalance === 0 ? "completed" : "active" }).where(eq(loans.id, activeLoan.id));
      await this.db.insert(loanRepayments).values({
        id: genId("RPY"),
        companyId,
        loanId: activeLoan.id,
        payrollRunId: runId,
        amount: ps.loanDeductions,
        balanceAfter: newBalance,
        paidAt
      });
    }
    const np = nextPeriod(run.periodMonth, run.periodYear);
    const pad = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "pad");
    const periodLabel = new Date(run.periodYear, run.periodMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
    await this.db.insert(complianceTasks).values([
      {
        id: genId("CT"),
        companyId,
        payrollRunId: runId,
        title: `${periodLabel} PAYE Filing`,
        type: "tax",
        dueDate: `${np.year}-${pad(np.month)}-10`,
        amount: run.totalTaxes,
        status: "pending"
      },
      {
        id: genId("CT"),
        companyId,
        payrollRunId: runId,
        title: `${periodLabel} Pension Remittance`,
        type: "pension",
        dueDate: `${np.year}-${pad(np.month)}-07`,
        amount: run.totalPension,
        status: "pending"
      }
    ]);
    return this.getRun(companyId, runId);
  }
  async getBankFile(companyId, runId) {
    const run = await this.getRun(companyId, runId);
    if (!run) return null;
    const header = "Employee ID,Employee Name,Bank Name,Account Number,Account Name,Net Pay\n";
    const lines = run.payslips.map(
      (ps) => [ps.employeeId, ps.employeeName, ps.bankName || "", ps.accountNumber || "", ps.accountName || "", ps.netPay].join(",")
    );
    return { filename: `bank-file-${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}.csv`, content: header + lines.join("\n") };
  }
  // ---------------- Compliance ----------------
  async getComplianceTasks(companyId) {
    return this.db.query.complianceTasks.findMany({
      where: eq(complianceTasks.companyId, companyId),
      orderBy: [desc(complianceTasks.dueDate)]
    });
  }
  async completeComplianceTask(companyId, id, completedBy, reference) {
    const existing = await this.db.query.complianceTasks.findFirst({
      where: and(eq(complianceTasks.id, id), eq(complianceTasks.companyId, companyId))
    });
    if (!existing) return null;
    await this.db.update(complianceTasks).set({ status: "completed", completedAt: (/* @__PURE__ */ new Date()).toISOString(), completedBy: completedBy || null, reference: reference || null }).where(eq(complianceTasks.id, id));
    return this.db.query.complianceTasks.findFirst({ where: eq(complianceTasks.id, id) });
  }
  // ---------------- Dashboard ----------------
  async getDashboard(companyId, month, year) {
    const [preview, latestRuns, complianceTasks2, loans2] = await Promise.all([
      this.previewRun(companyId, month, year),
      this.getRuns(companyId),
      this.getComplianceTasks(companyId),
      this.getLoans(companyId)
    ]);
    const currentRun = latestRuns.find((r) => r.periodMonth === month && r.periodYear === year) || null;
    const pendingCompliance = complianceTasks2.filter((t) => t.status === "pending");
    const activeLoans = loans2.filter((l) => l.status === "active");
    return {
      periodMonth: month,
      periodYear: year,
      currentRun,
      preview: currentRun ? null : preview,
      // once a run exists for the period, its persisted figures are authoritative
      employeeCount: preview.employeeCount,
      totalGross: currentRun ? currentRun.totalGross : preview.totalGross,
      totalNet: currentRun ? currentRun.totalNet : preview.totalNet,
      totalTaxes: currentRun ? currentRun.totalTaxes : preview.totalTaxes,
      totalPension: currentRun ? currentRun.totalPension : preview.totalPension,
      totalLoanDeductions: currentRun ? currentRun.totalLoanDeductions : preview.totalLoanDeductions,
      exceptions: preview.exceptions,
      pendingComplianceCount: pendingCompliance.length,
      upcomingRemittances: pendingCompliance.slice(0, 5),
      activeLoanCount: activeLoans.length,
      activeLoanBalance: activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0),
      recentRuns: latestRuns.slice(0, 5)
    };
  }
};

// src/controllers/admin/payroll.controller.ts
var currentPeriod = /* @__PURE__ */ __name((c) => {
  const now = /* @__PURE__ */ new Date();
  const month = parseInt(c.req.query("month") || "") || now.getMonth() + 1;
  const year = parseInt(c.req.query("year") || "") || now.getFullYear();
  return { month, year };
}, "currentPeriod");
var getPayrollSettings = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getSettings(c.get("companyId")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getPayrollSettings");
var updatePayrollSettings = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    return c.json({ data: await service.updateSettings(c.get("companyId"), payload) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "updatePayrollSettings");
var getTaxBrackets = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getTaxBrackets(c.get("companyId")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getTaxBrackets");
var updateTaxBrackets = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const { brackets } = await c.req.json();
    return c.json({ data: await service.replaceTaxBrackets(c.get("companyId"), brackets) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "updateTaxBrackets");
var getSalaryComponents = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getSalaryComponents(c.get("companyId")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getSalaryComponents");
var createSalaryComponent = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    return c.json({ data: await service.createSalaryComponent(c.get("companyId"), payload) }, 201);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "createSalaryComponent");
var updateSalaryComponent = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    const updated = await service.updateSalaryComponent(c.get("companyId"), c.req.param("id"), payload);
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ data: updated });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "updateSalaryComponent");
var deleteSalaryComponent = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const deleted = await service.deleteSalaryComponent(c.get("companyId"), c.req.param("id"));
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ data: deleted });
  } catch (error) {
    return c.json({ error: error.message }, error.message?.includes("cannot be deleted") ? 400 : 500);
  }
}, "deleteSalaryComponent");
var getPayGrades = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getPayGrades(c.get("companyId")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getPayGrades");
var createPayGrade = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    return c.json({ data: await service.createPayGrade(c.get("companyId"), payload) }, 201);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "createPayGrade");
var updatePayGrade = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    const updated = await service.updatePayGrade(c.get("companyId"), c.req.param("id"), payload);
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ data: updated });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "updatePayGrade");
var deletePayGrade = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const deleted = await service.deletePayGrade(c.get("companyId"), c.req.param("id"));
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ data: deleted });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "deletePayGrade");
var getLoans = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getLoans(c.get("companyId")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getLoans");
var createLoan = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    if (!payload.employeeId || !payload.principal) {
      return c.json({ error: "employeeId and principal are required" }, 400);
    }
    return c.json({ data: await service.createLoan(c.get("companyId"), payload) }, 201);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "createLoan");
var updateLoan = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const payload = await c.req.json();
    const updated = await service.updateLoan(c.get("companyId"), c.req.param("id"), payload);
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ data: updated });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "updateLoan");
var deleteLoan = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const deleted = await service.deleteLoan(c.get("companyId"), c.req.param("id"));
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ data: deleted });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "deleteLoan");
var getLoanRepayments = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getLoanRepayments(c.get("companyId"), c.req.param("id")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getLoanRepayments");
var previewPayroll = /* @__PURE__ */ __name(async (c) => {
  try {
    const { month, year } = currentPeriod(c);
    const service = new PayrollService(c.env.DB);
    const preview = await service.previewRun(c.get("companyId"), month, year);
    return c.json({ data: preview }, 200);
  } catch (error) {
    console.error("Error previewing payroll:", error);
    return c.json({ error: error.message || "Internal Server Error" }, 500);
  }
}, "previewPayroll");
var recomputePreview = /* @__PURE__ */ __name(async (c) => {
  try {
    const body = await c.req.json();
    const service = new PayrollService(c.env.DB);
    const preview = await service.previewRun(c.get("companyId"), body.periodMonth, body.periodYear, body.overrides || {});
    return c.json({ data: preview }, 200);
  } catch (error) {
    console.error("Error recomputing payroll preview:", error);
    return c.json({ error: error.message || "Internal Server Error" }, 500);
  }
}, "recomputePreview");
var submitPayrollRun = /* @__PURE__ */ __name(async (c) => {
  try {
    const payload = await c.req.json();
    if (!payload.periodMonth || !payload.periodYear) {
      return c.json({ error: "periodMonth and periodYear are required" }, 400);
    }
    const service = new PayrollService(c.env.DB);
    const run = await service.submitRun(c.get("companyId"), c.get("employeeId"), payload);
    return c.json({ data: run }, 201);
  } catch (error) {
    console.error("Error submitting payroll run:", error);
    return c.json({ error: error.message || "Internal Server Error" }, 500);
  }
}, "submitPayrollRun");
var getPayrollRuns = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const status = c.req.query("status");
    return c.json({ data: await service.getRuns(c.get("companyId"), status) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getPayrollRuns");
var getPayrollRun = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const run = await service.getRun(c.get("companyId"), c.req.param("id"));
    if (!run) return c.json({ error: "Not found" }, 404);
    return c.json({ data: run });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getPayrollRun");
var approvePayrollRun = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const run = await service.approveRun(c.get("companyId"), c.req.param("id"), c.get("employeeId"));
    if (!run) return c.json({ error: "Not found" }, 404);
    return c.json({ data: run });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}, "approvePayrollRun");
var rejectPayrollRun = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const { reason } = await c.req.json().catch(() => ({ reason: void 0 }));
    const run = await service.rejectRun(c.get("companyId"), c.req.param("id"), reason);
    if (!run) return c.json({ error: "Not found" }, 404);
    return c.json({ data: run });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}, "rejectPayrollRun");
var markPayrollRunPaid = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const run = await service.markRunPaid(c.get("companyId"), c.req.param("id"));
    if (!run) return c.json({ error: "Not found" }, 404);
    return c.json({ data: run });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}, "markPayrollRunPaid");
var getBankFile = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const file = await service.getBankFile(c.get("companyId"), c.req.param("id"));
    if (!file) return c.json({ error: "Not found" }, 404);
    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename="${file.filename}"`);
    return c.body(file.content);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getBankFile");
var getComplianceTasks = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getComplianceTasks(c.get("companyId")) });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getComplianceTasks");
var completeComplianceTask = /* @__PURE__ */ __name(async (c) => {
  try {
    const service = new PayrollService(c.env.DB);
    const { reference } = await c.req.json().catch(() => ({ reference: void 0 }));
    const task = await service.completeComplianceTask(c.get("companyId"), c.req.param("id"), c.get("employeeId"), reference);
    if (!task) return c.json({ error: "Not found" }, 404);
    return c.json({ data: task });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "completeComplianceTask");
var getPayrollDashboard = /* @__PURE__ */ __name(async (c) => {
  try {
    const { month, year } = currentPeriod(c);
    const service = new PayrollService(c.env.DB);
    return c.json({ data: await service.getDashboard(c.get("companyId"), month, year) });
  } catch (error) {
    console.error("Error building payroll dashboard:", error);
    return c.json({ error: error.message || "Internal Server Error" }, 500);
  }
}, "getPayrollDashboard");
var getEmployeePayslips = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = drizzle(c.env.DB, { schema: schema_exports });
    const records = await db.select({
      id: payslips.id,
      runId: payslips.runId,
      basicSalary: payslips.basicSalary,
      allowances: payslips.allowances,
      bonuses: payslips.bonuses,
      grossPay: payslips.grossPay,
      taxDeductions: payslips.taxDeductions,
      pensionDeductions: payslips.pensionDeductions,
      loanDeductions: payslips.loanDeductions,
      otherDeductions: payslips.otherDeductions,
      netPay: payslips.netPay,
      createdAt: payslips.createdAt,
      periodMonth: payrollRuns.periodMonth,
      periodYear: payrollRuns.periodYear,
      status: payrollRuns.status
    }).from(payslips).innerJoin(payrollRuns, eq(payslips.runId, payrollRuns.id)).where(and(eq(payslips.employeeId, employeeId), eq(payrollRuns.companyId, companyId))).orderBy(desc(payrollRuns.periodYear), desc(payrollRuns.periodMonth));
    return c.json({ data: records });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getEmployeePayslips");

// src/middlewares/tenant.middleware.ts
var tenantMiddleware = /* @__PURE__ */ __name(async (c, next) => {
  const companyId = c.req.header("x-company-id") || c.req.query("companyId");
  if (!companyId) {
    return c.json({ error: "Missing tenant identification (x-company-id)" }, 401);
  }
  c.set("companyId", companyId);
  await next();
}, "tenantMiddleware");

// src/routes/payroll.routes.ts
var payrollRoutes = new Hono2();
payrollRoutes.use("*", tenantMiddleware);
var adminOnly = requireRole("SUPER_ADMIN", "HR_ADMIN", "PAYROLL_OFFICER");
var adminOrManager = requireRole("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "PAYROLL_OFFICER");
payrollRoutes.get("/settings", adminOnly, requirePermission("payroll", "view"), getPayrollSettings);
payrollRoutes.put("/settings", adminOnly, requirePermission("payroll", "edit"), updatePayrollSettings);
payrollRoutes.get("/tax-brackets", adminOnly, requirePermission("payroll", "view"), getTaxBrackets);
payrollRoutes.put("/tax-brackets", adminOnly, requirePermission("payroll", "edit"), updateTaxBrackets);
payrollRoutes.get("/salary-components", adminOnly, requirePermission("payroll", "view"), getSalaryComponents);
payrollRoutes.post("/salary-components", adminOnly, requirePermission("payroll", "create"), createSalaryComponent);
payrollRoutes.put("/salary-components/:id", adminOnly, requirePermission("payroll", "edit"), updateSalaryComponent);
payrollRoutes.delete("/salary-components/:id", adminOnly, requirePermission("payroll", "delete"), deleteSalaryComponent);
payrollRoutes.get("/pay-grades", adminOnly, requirePermission("payroll", "view"), getPayGrades);
payrollRoutes.post("/pay-grades", adminOnly, requirePermission("payroll", "create"), createPayGrade);
payrollRoutes.put("/pay-grades/:id", adminOnly, requirePermission("payroll", "edit"), updatePayGrade);
payrollRoutes.delete("/pay-grades/:id", adminOnly, requirePermission("payroll", "delete"), deletePayGrade);
payrollRoutes.get("/loans", adminOnly, requirePermission("payroll", "view"), getLoans);
payrollRoutes.post("/loans", adminOnly, requirePermission("payroll", "create"), createLoan);
payrollRoutes.put("/loans/:id", adminOnly, requirePermission("payroll", "edit"), updateLoan);
payrollRoutes.delete("/loans/:id", adminOnly, requirePermission("payroll", "delete"), deleteLoan);
payrollRoutes.get("/loans/:id/repayments", adminOnly, requirePermission("payroll", "view"), getLoanRepayments);
payrollRoutes.get("/preview", adminOrManager, requirePermission("payroll", "view"), previewPayroll);
payrollRoutes.post("/preview", adminOnly, requirePermission("payroll", "edit"), recomputePreview);
payrollRoutes.get("/dashboard", adminOrManager, requirePermission("payroll", "view"), getPayrollDashboard);
payrollRoutes.post("/runs", adminOnly, requirePermission("payroll", "create"), submitPayrollRun);
payrollRoutes.get("/runs", adminOrManager, requirePermission("payroll", "view"), getPayrollRuns);
payrollRoutes.get("/runs/:id", adminOnly, requirePermission("payroll", "view"), getPayrollRun);
payrollRoutes.post("/runs/:id/approve", adminOnly, requirePermission("payroll", "approve"), approvePayrollRun);
payrollRoutes.post("/runs/:id/reject", adminOnly, requirePermission("payroll", "edit"), rejectPayrollRun);
payrollRoutes.post("/runs/:id/mark-paid", adminOnly, requirePermission("payroll", "edit"), markPayrollRunPaid);
payrollRoutes.get("/runs/:id/bank-file", adminOnly, requirePermission("payroll", "view"), getBankFile);
payrollRoutes.get("/compliance", adminOnly, requirePermission("payroll", "view"), getComplianceTasks);
payrollRoutes.put("/compliance/:id", adminOnly, requirePermission("payroll", "edit"), completeComplianceTask);
payrollRoutes.get("/employee/:id/payslips", adminOnly, requirePermission("payroll", "view"), getEmployeePayslips);
var payroll_routes_default = payrollRoutes;

// src/services/leave.service.ts
var LeaveService = class {
  static {
    __name(this, "LeaveService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getAllByCompany(companyId) {
    return this.db.select().from(leaveRequests).where(eq(leaveRequests.companyId, companyId)).all();
  }
  async getTeamLeaves(companyId) {
    const requests = await this.db.select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      name: employees.name,
      lastName: employees.lastName,
      avatar: employees.avatar,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      status: leaveRequests.status
    }).from(leaveRequests).innerJoin(employees, eq(leaveRequests.employeeId, employees.id)).where(
      and(
        eq(leaveRequests.companyId, companyId),
        eq(leaveRequests.status, "approved")
      )
    ).all();
    return requests;
  }
  async getPendingTeamLeaveRequests(companyId, managerId) {
    return this.db.select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      name: employees.name,
      lastName: employees.lastName,
      avatar: employees.avatar,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      reason: leaveRequests.reason,
      status: leaveRequests.status
    }).from(leaveRequests).innerJoin(employees, eq(leaveRequests.employeeId, employees.id)).where(
      and(
        eq(leaveRequests.companyId, companyId),
        eq(leaveRequests.status, "pending"),
        eq(employees.managerId, managerId)
      )
    ).all();
  }
  async updateTeamLeaveRequestStatus(companyId, managerId, requestId, data) {
    const request = await this.db.query.leaveRequests.findFirst({
      where: and(eq(leaveRequests.id, requestId), eq(leaveRequests.companyId, companyId))
    });
    if (!request) return null;
    const employee = await this.db.query.employees.findFirst({
      where: eq(employees.id, request.employeeId)
    });
    if (!employee || employee.managerId !== managerId) {
      return null;
    }
    return this.updateLeaveRequestStatus(companyId, requestId, {
      status: data.status,
      managerComment: data.managerComment,
      managerId
    });
  }
  async getEmployeeLeaveRequests(companyId, employeeId) {
    return this.db.query.leaveRequests.findMany({
      where: and(
        eq(leaveRequests.companyId, companyId),
        eq(leaveRequests.employeeId, employeeId)
      ),
      orderBy: /* @__PURE__ */ __name((leaveRequests2, { desc: desc3 }) => [desc3(leaveRequests2.appliedOn)], "orderBy")
    });
  }
  async calculateLeaveBalances(companyId, employeeId) {
    const requests = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(leaveRequests.companyId, companyId),
        eq(leaveRequests.employeeId, employeeId),
        eq(leaveRequests.status, "approved")
      )
    });
    const usedAnnual = requests.filter((r) => r.type === "Annual Leave").reduce((sum, r) => sum + r.days, 0);
    const usedSick = requests.filter((r) => r.type === "Sick Leave").reduce((sum, r) => sum + r.days, 0);
    const usedMaternity = requests.filter((r) => r.type === "Maternity Leave").reduce((sum, r) => sum + r.days, 0);
    let balances = await this.db.query.leaveBalances.findMany({
      where: and(
        eq(leaveBalances.companyId, companyId),
        eq(leaveBalances.employeeId, employeeId)
      )
    });
    if (!balances || balances.length === 0) {
      balances = [
        { type: "Annual Leave", total: 20, color: "indigo" },
        { type: "Sick Leave", total: 10, color: "rose" },
        { type: "Maternity Leave", total: 90, color: "emerald" }
      ];
    }
    return balances.map((b) => {
      let used = 0;
      if (b.type === "Annual Leave") used = usedAnnual;
      else if (b.type === "Sick Leave") used = usedSick;
      else if (b.type === "Maternity Leave") used = usedMaternity;
      return {
        ...b,
        used
      };
    });
  }
  async createLeaveRequest(companyId, employeeId, data) {
    const id = `LR-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const appliedOn = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const result = await this.db.insert(leaveRequests).values({
      id,
      companyId,
      employeeId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      days: data.days,
      reason: data.reason,
      status: "pending",
      appliedOn
    }).returning();
    return result[0];
  }
  async updateLeaveRequestStatus(companyId, requestId, data) {
    const updateData = {
      status: data.status,
      managerId: data.managerId,
      managerComment: data.managerComment
    };
    if (data.days !== void 0) {
      updateData.days = data.days;
    }
    const result = await this.db.update(leaveRequests).set(updateData).where(and(eq(leaveRequests.companyId, companyId), eq(leaveRequests.id, requestId))).returning();
    return result[0];
  }
  async updateEmployeeLeaveBalances(companyId, employeeId, balances) {
    await this.db.delete(leaveBalances).where(
      and(
        eq(leaveBalances.companyId, companyId),
        eq(leaveBalances.employeeId, employeeId)
      )
    );
    if (balances.length > 0) {
      const inserts = balances.map((b) => ({
        id: `LB-${Math.floor(1e3 + Math.random() * 9e3)}`,
        companyId,
        employeeId,
        type: b.type,
        total: b.total,
        color: b.color || "indigo"
      }));
      await this.db.insert(leaveBalances).values(inserts);
    }
    return balances;
  }
};

// src/controllers/admin/leave.controller.ts
var getAllLeaves = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const leaveService = new LeaveService(c.env.DB);
  const requests = await leaveService.getAllByCompany(companyId);
  return c.json(requests);
}, "getAllLeaves");
var updateLeaveStatus = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const requestId = c.req.param("id");
  const payload = await c.req.json();
  const managerId = c.req.header("x-employee-id");
  const leaveService = new LeaveService(c.env.DB);
  const updated = await leaveService.updateLeaveRequestStatus(
    companyId,
    requestId,
    {
      status: payload.status,
      days: payload.days,
      managerComment: payload.managerComment,
      managerId
    }
  );
  return c.json(updated);
}, "updateLeaveStatus");
var getEmployeeLeaveBalances = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const leaveService = new LeaveService(c.env.DB);
  const balances = await leaveService.calculateLeaveBalances(companyId, employeeId);
  return c.json(balances);
}, "getEmployeeLeaveBalances");
var updateEmployeeLeaveBalances = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const { balances } = await c.req.json();
  const leaveService = new LeaveService(c.env.DB);
  const updated = await leaveService.updateEmployeeLeaveBalances(companyId, employeeId, balances);
  return c.json(updated);
}, "updateEmployeeLeaveBalances");
var getEmployeeLeaveRequests = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.req.param("id");
  const leaveService = new LeaveService(c.env.DB);
  const requests = await leaveService.getEmployeeLeaveRequests(companyId, employeeId);
  return c.json(requests);
}, "getEmployeeLeaveRequests");

// src/routes/leave-admin.routes.ts
var leaveAdminRoutes = new Hono2();
var adminOnly2 = requireRole("SUPER_ADMIN", "HR_ADMIN");
var view = requirePermission("leave", "view");
var approve = requirePermission("leave", "approve");
leaveAdminRoutes.get("/", adminOnly2, view, getAllLeaves);
leaveAdminRoutes.put("/:id/status", adminOnly2, approve, updateLeaveStatus);
leaveAdminRoutes.get("/employee/:id/balances", adminOnly2, view, getEmployeeLeaveBalances);
leaveAdminRoutes.put("/employee/:id/balances", adminOnly2, approve, updateEmployeeLeaveBalances);
leaveAdminRoutes.get("/employee/:id/requests", adminOnly2, view, getEmployeeLeaveRequests);
var leave_admin_routes_default = leaveAdminRoutes;

// src/services/requisition.service.ts
var DAY_MS2 = 24 * 60 * 60 * 1e3;
var withComputedDaysOpen = /* @__PURE__ */ __name((row) => {
  const opened = new Date(row.dateOpened).getTime();
  const daysOpen = Number.isFinite(opened) ? Math.max(0, Math.floor((Date.now() - opened) / DAY_MS2)) : 0;
  return { ...row, daysOpen };
}, "withComputedDaysOpen");
var RequisitionService = class {
  static {
    __name(this, "RequisitionService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getAllByCompany(companyId) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: eq(jobRequisitions.companyId, companyId),
      orderBy: /* @__PURE__ */ __name((jobRequisitions2, { desc: desc3 }) => [desc3(jobRequisitions2.createdAt)], "orderBy")
    });
    return rows.map(withComputedDaysOpen);
  }
  async getPendingByCompany(companyId) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: and(
        eq(jobRequisitions.companyId, companyId),
        eq(jobRequisitions.status, "Pending Approval")
      ),
      orderBy: /* @__PURE__ */ __name((jobRequisitions2, { asc: asc3 }) => [asc3(jobRequisitions2.createdAt)], "orderBy")
    });
    return rows.map(withComputedDaysOpen);
  }
  async getMineByCompany(companyId, employeeId) {
    const rows = await this.db.query.jobRequisitions.findMany({
      where: and(
        eq(jobRequisitions.companyId, companyId),
        eq(jobRequisitions.requestedById, employeeId)
      ),
      orderBy: /* @__PURE__ */ __name((jobRequisitions2, { desc: desc3 }) => [desc3(jobRequisitions2.createdAt)], "orderBy")
    });
    return rows.map(withComputedDaysOpen);
  }
  async create(companyId, requester, data) {
    const id = `REQ-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const autoApprove = requester.role === "SUPER_ADMIN" || requester.role === "HR_ADMIN";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.db.insert(jobRequisitions).values({
      id,
      companyId,
      title: data.title,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType || null,
      hiringManager: data.hiringManager || requester.name,
      managerAvatar: data.managerAvatar || requester.avatar || null,
      priority: data.priority || "Medium",
      status: autoApprove ? "Open" : "Pending Approval",
      dateOpened: today,
      targetHireDate: data.targetHireDate || today,
      daysOpen: 0,
      justification: data.justification || null,
      budgetRange: data.budgetRange || null,
      requestedById: requester.id,
      requestedByName: requester.name,
      reviewedById: autoApprove ? requester.id : null,
      reviewedByName: autoApprove ? requester.name : null,
      reviewedAt: autoApprove ? nowIso : null
    }).returning();
    return withComputedDaysOpen(result[0]);
  }
  async approve(companyId, id, reviewer) {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.db.update(jobRequisitions).set({
      status: "Open",
      // The position is "opened" as of the approval, so time-to-fill tracking
      // starts here rather than at the original request date.
      dateOpened: nowIso.split("T")[0],
      reviewedById: reviewer.id,
      reviewedByName: reviewer.name,
      reviewedAt: nowIso,
      rejectionReason: null
    }).where(and(eq(jobRequisitions.companyId, companyId), eq(jobRequisitions.id, id))).returning();
    return result[0] ? withComputedDaysOpen(result[0]) : null;
  }
  async reject(companyId, id, reviewer, reason) {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.db.update(jobRequisitions).set({
      status: "Rejected",
      reviewedById: reviewer.id,
      reviewedByName: reviewer.name,
      reviewedAt: nowIso,
      rejectionReason: reason || null
    }).where(and(eq(jobRequisitions.companyId, companyId), eq(jobRequisitions.id, id))).returning();
    return result[0] ? withComputedDaysOpen(result[0]) : null;
  }
  async updateStatus(companyId, id, status) {
    const result = await this.db.update(jobRequisitions).set({ status }).where(and(eq(jobRequisitions.companyId, companyId), eq(jobRequisitions.id, id))).returning();
    return result[0] ? withComputedDaysOpen(result[0]) : null;
  }
  async remove(companyId, id) {
    const result = await this.db.delete(jobRequisitions).where(and(eq(jobRequisitions.companyId, companyId), eq(jobRequisitions.id, id))).returning();
    return result[0] || null;
  }
};

// src/controllers/admin/requisition.controller.ts
var VALID_MANUAL_STATUSES = ["Open", "On Hold", "Filled", "Cancelled"];
var getActor2 = /* @__PURE__ */ __name(async (c) => {
  const employeeId = c.get("employeeId");
  const role = c.get("role");
  if (!employeeId) {
    return { id: "system", name: "System", avatar: null, role };
  }
  const db = drizzle(c.env.DB, { schema: schema_exports });
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId)
  });
  const name = employee ? [employee.name, employee.lastName].filter(Boolean).join(" ") : "Unknown";
  return { id: employeeId, name, avatar: employee?.avatar || null, role };
}, "getActor");
var getAllRequisitions = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const service = new RequisitionService(c.env.DB);
  const rows = await service.getAllByCompany(companyId);
  return c.json(rows);
}, "getAllRequisitions");
var getPendingRequisitions = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const service = new RequisitionService(c.env.DB);
  const rows = await service.getPendingByCompany(companyId);
  return c.json(rows);
}, "getPendingRequisitions");
var getMyRequisitions = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) return c.json([]);
  const service = new RequisitionService(c.env.DB);
  const rows = await service.getMineByCompany(companyId, employeeId);
  return c.json(rows);
}, "getMyRequisitions");
var createRequisition = /* @__PURE__ */ __name(async (c) => {
  try {
    const companyId = c.get("companyId");
    const payload = await c.req.json();
    if (!payload.title || !payload.department || !payload.location) {
      return c.json({ error: "title, department and location are required" }, 400);
    }
    const requester = await getActor2(c);
    const service = new RequisitionService(c.env.DB);
    const created = await service.create(companyId, requester, payload);
    return c.json(created, 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}, "createRequisition");
var approveRequisition = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const reviewer = await getActor2(c);
  const service = new RequisitionService(c.env.DB);
  const updated = await service.approve(companyId, id, reviewer);
  if (!updated) return c.json({ error: "Requisition not found" }, 404);
  return c.json(updated);
}, "approveRequisition");
var rejectRequisition = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const payload = await c.req.json().catch(() => ({}));
  const reviewer = await getActor2(c);
  const service = new RequisitionService(c.env.DB);
  const updated = await service.reject(companyId, id, reviewer, payload.reason);
  if (!updated) return c.json({ error: "Requisition not found" }, 404);
  return c.json(updated);
}, "rejectRequisition");
var updateRequisitionStatus = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const { status } = await c.req.json();
  if (!VALID_MANUAL_STATUSES.includes(status)) {
    return c.json({ error: `status must be one of ${VALID_MANUAL_STATUSES.join(", ")}` }, 400);
  }
  const service = new RequisitionService(c.env.DB);
  const updated = await service.updateStatus(companyId, id, status);
  if (!updated) return c.json({ error: "Requisition not found" }, 404);
  return c.json(updated);
}, "updateRequisitionStatus");
var deleteRequisition = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const service = new RequisitionService(c.env.DB);
  const deleted = await service.remove(companyId, id);
  if (!deleted) return c.json({ error: "Requisition not found" }, 404);
  return c.json({ success: true });
}, "deleteRequisition");

// src/routes/requisition.routes.ts
var requisitionRoutes = new Hono2();
var viewers = requireRole("SUPER_ADMIN", "HR_ADMIN", "MANAGER", "RECRUITER");
var requesters = requireRole("SUPER_ADMIN", "HR_ADMIN", "MANAGER");
var approvers = requireRole("SUPER_ADMIN", "HR_ADMIN");
requisitionRoutes.get("/", viewers, getAllRequisitions);
requisitionRoutes.get("/pending", approvers, getPendingRequisitions);
requisitionRoutes.get("/mine", requesters, getMyRequisitions);
requisitionRoutes.post("/", requesters, createRequisition);
requisitionRoutes.patch("/:id/approve", approvers, approveRequisition);
requisitionRoutes.patch("/:id/reject", approvers, rejectRequisition);
requisitionRoutes.patch("/:id/status", approvers, updateRequisitionStatus);
requisitionRoutes.delete("/:id", approvers, deleteRequisition);
var requisition_routes_default = requisitionRoutes;

// src/services/attendance.service.ts
var AttendanceService = class {
  static {
    __name(this, "AttendanceService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  // ---------------------------------------------------------------------
  // Policy helpers — drive the on-time/late tag at clock-in and the
  // standard shift length used to compute overtime at clock-out.
  // ---------------------------------------------------------------------
  timeStringToMinutes(t) {
    const [h, m] = (t || "09:00").split(":").map((n) => parseInt(n, 10));
    return (h || 0) * 60 + (m || 0);
  }
  computeAttendanceStatus(clockInDate, policy) {
    const clockInMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes();
    const thresholdMinutes = this.timeStringToMinutes(policy.attendanceStartTime) + (policy.attendanceGraceMinutes || 0);
    return clockInMinutes > thresholdMinutes ? "late" : "present";
  }
  shiftHours(policy) {
    const startMinutes = this.timeStringToMinutes(policy.attendanceStartTime);
    const endMinutes = this.timeStringToMinutes(policy.attendanceEndTime);
    const diff = endMinutes - startMinutes;
    return diff > 0 ? diff / 60 : 8;
  }
  async getAttendancePolicy(companyId) {
    const settings = await this.db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, companyId)
    });
    return {
      attendanceStartTime: settings?.attendanceStartTime || "09:00",
      attendanceEndTime: settings?.attendanceEndTime || "17:00",
      attendanceGraceMinutes: settings?.attendanceGraceMinutes ?? 15
    };
  }
  async updateAttendancePolicy(companyId, data) {
    const existing = await this.db.query.companySettings.findFirst({
      where: eq(companySettings.companyId, companyId)
    });
    const payload = { updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (data.attendanceStartTime !== void 0) payload.attendanceStartTime = data.attendanceStartTime;
    if (data.attendanceEndTime !== void 0) payload.attendanceEndTime = data.attendanceEndTime;
    if (data.attendanceGraceMinutes !== void 0) payload.attendanceGraceMinutes = data.attendanceGraceMinutes;
    if (existing) {
      const result2 = await this.db.update(companySettings).set(payload).where(eq(companySettings.companyId, companyId)).returning();
      return result2[0];
    }
    const result = await this.db.insert(companySettings).values({ companyId, ...payload }).returning();
    return result[0];
  }
  // ---------------------------------------------------------------------
  // Self-service (existing)
  // ---------------------------------------------------------------------
  async getEmployeeAttendance(companyId, employeeId) {
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.companyId, companyId),
        eq(attendanceRecords.employeeId, employeeId)
      ),
      orderBy: /* @__PURE__ */ __name((attendanceRecords2, { desc: desc3 }) => [desc3(attendanceRecords2.date), desc3(attendanceRecords2.clockIn)], "orderBy")
    });
    const grouped = {};
    for (const r of records) {
      if (!grouped[r.date]) {
        grouped[r.date] = { date: r.date, status: r.status, clockIn: r.clockIn, clockOut: r.clockOut, workHours: 0, overtime: 0, note: r.notes };
      }
      grouped[r.date].workHours += r.workHours || 0;
      grouped[r.date].overtime += r.overtime || 0;
      if (r.clockOut && (!grouped[r.date].clockOut || new Date(r.clockOut) > new Date(grouped[r.date].clockOut))) {
        grouped[r.date].clockOut = r.clockOut;
      }
    }
    return Object.values(grouped);
  }
  async getTodaySessions(companyId, employeeId) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.companyId, companyId),
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.date, today)
      ),
      orderBy: /* @__PURE__ */ __name((attendanceRecords2, { asc: asc3 }) => [asc3(attendanceRecords2.clockIn)], "orderBy")
    });
  }
  async getActiveSession(companyId, employeeId) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.companyId, companyId),
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.date, today),
        isNull(attendanceRecords.clockOut)
      ),
      limit: 1
    });
    return records[0] || null;
  }
  async getOvertimeRequests(companyId, employeeId) {
    return this.db.query.overtimeRequests.findMany({
      where: and(
        eq(overtimeRequests.companyId, companyId),
        eq(overtimeRequests.employeeId, employeeId)
      ),
      orderBy: /* @__PURE__ */ __name((overtimeRequests2, { desc: desc3 }) => [desc3(overtimeRequests2.date), desc3(overtimeRequests2.createdAt)], "orderBy")
    });
  }
  async createOvertimeRequest(data) {
    const id = crypto.randomUUID();
    await this.db.insert(overtimeRequests).values({
      id,
      companyId: data.companyId,
      employeeId: data.employeeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      hours: data.hours,
      reason: data.reason,
      deliverable: data.deliverable,
      status: "pending"
    });
    return { success: true, id };
  }
  async clockIn(companyId, employeeId, data) {
    const clockInDate = /* @__PURE__ */ new Date();
    const today = clockInDate.toISOString().split("T")[0];
    const clockInTime = clockInDate.toISOString();
    const id = `ATT-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const policy = await this.getAttendancePolicy(companyId);
    const status = this.computeAttendanceStatus(clockInDate, policy);
    const result = await this.db.insert(attendanceRecords).values({
      id,
      companyId,
      employeeId,
      date: today,
      clockIn: clockInTime,
      status,
      locationIn: data.location,
      latitudeIn: data.latitude,
      longitudeIn: data.longitude,
      notes: data.notes,
      workHours: 0,
      overtime: 0
    }).returning();
    return result[0];
  }
  async clockOut(companyId, employeeId, data) {
    const clockOutTime = (/* @__PURE__ */ new Date()).toISOString();
    const activeSession = await this.getActiveSession(companyId, employeeId);
    if (!activeSession) throw new Error("No active clock in record found for today");
    const clockInDate = new Date(activeSession.clockIn);
    const clockOutDate = new Date(clockOutTime);
    const diffMs = Math.abs(clockOutDate.getTime() - clockInDate.getTime());
    const workHours = +(diffMs / (1e3 * 60 * 60)).toFixed(2);
    const policy = await this.getAttendancePolicy(companyId);
    const overtime = +Math.max(0, workHours - this.shiftHours(policy)).toFixed(2);
    const result = await this.db.update(attendanceRecords).set({
      clockOut: clockOutTime,
      locationOut: data.location,
      latitudeOut: data.latitude,
      longitudeOut: data.longitude,
      workHours,
      overtime
    }).where(eq(attendanceRecords.id, activeSession.id)).returning();
    return result[0];
  }
  // ---------------------------------------------------------------------
  // Manager/company scoping helpers
  // ---------------------------------------------------------------------
  async getManagerTeamIds(companyId, managerId) {
    const reports = await this.db.query.employees.findMany({
      where: and(eq(employees.companyId, companyId), eq(employees.managerId, managerId)),
      columns: { id: true }
    });
    return reports.map((r) => r.id);
  }
  // ---------------------------------------------------------------------
  // Company-wide / team attendance oversight (Admin & Manager)
  // ---------------------------------------------------------------------
  async getCompanyAttendance(companyId, filters = {}) {
    const conditions = [eq(attendanceRecords.companyId, companyId)];
    if (filters.managerId) {
      const teamIds = await this.getManagerTeamIds(companyId, filters.managerId);
      if (teamIds.length === 0) return [];
      conditions.push(inArray(attendanceRecords.employeeId, teamIds));
    }
    if (filters.employeeId) conditions.push(eq(attendanceRecords.employeeId, filters.employeeId));
    if (filters.date) {
      conditions.push(eq(attendanceRecords.date, filters.date));
    } else {
      if (filters.from) conditions.push(gte(attendanceRecords.date, filters.from));
      if (filters.to) conditions.push(lte(attendanceRecords.date, filters.to));
    }
    return this.db.select({
      id: attendanceRecords.id,
      employeeId: attendanceRecords.employeeId,
      name: employees.name,
      lastName: employees.lastName,
      avatar: employees.avatar,
      department: employees.department,
      date: attendanceRecords.date,
      clockIn: attendanceRecords.clockIn,
      clockOut: attendanceRecords.clockOut,
      status: attendanceRecords.status,
      locationIn: attendanceRecords.locationIn,
      locationOut: attendanceRecords.locationOut,
      workHours: attendanceRecords.workHours,
      overtime: attendanceRecords.overtime,
      notes: attendanceRecords.notes
    }).from(attendanceRecords).innerJoin(employees, eq(attendanceRecords.employeeId, employees.id)).where(and(...conditions)).orderBy(desc(attendanceRecords.date), desc(attendanceRecords.clockIn)).all();
  }
  async getAttendanceSummary(companyId, date, managerId) {
    const employeeConditions = [eq(employees.companyId, companyId), eq(employees.status, "active")];
    if (managerId) employeeConditions.push(eq(employees.managerId, managerId));
    const scopedEmployees = await this.db.query.employees.findMany({
      where: and(...employeeConditions),
      columns: { id: true }
    });
    const scopedIds = scopedEmployees.map((e) => e.id);
    const totalEmployees = scopedIds.length;
    if (totalEmployees === 0) {
      return { date, totalEmployees: 0, present: 0, late: 0, absent: 0, onLeave: 0, stillClockedIn: 0, avgWorkHours: 0 };
    }
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.companyId, companyId),
        eq(attendanceRecords.date, date),
        inArray(attendanceRecords.employeeId, scopedIds)
      )
    });
    const presentIds = new Set(records.map((r) => r.employeeId));
    const lateIds = new Set(records.filter((r) => r.status === "late").map((r) => r.employeeId));
    const stillClockedIn = records.filter((r) => !r.clockOut).length;
    const leaveRows = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(leaveRequests.companyId, companyId),
        eq(leaveRequests.status, "approved"),
        lte(leaveRequests.startDate, date),
        gte(leaveRequests.endDate, date),
        inArray(leaveRequests.employeeId, scopedIds)
      )
    });
    const onLeaveIds = new Set(
      leaveRows.map((r) => r.employeeId).filter((id) => !presentIds.has(id))
    );
    const absent = Math.max(0, totalEmployees - presentIds.size - onLeaveIds.size);
    const totalHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
    const withHours = records.filter((r) => (r.workHours || 0) > 0).length;
    return {
      date,
      totalEmployees,
      present: presentIds.size,
      late: lateIds.size,
      absent,
      onLeave: onLeaveIds.size,
      stillClockedIn,
      avgWorkHours: withHours > 0 ? +(totalHours / withHours).toFixed(2) : 0
    };
  }
  async getTeamAttendanceToday(companyId, managerId) {
    const team = await this.db.query.employees.findMany({
      where: and(eq(employees.companyId, companyId), eq(employees.managerId, managerId)),
      columns: { id: true, name: true, lastName: true, avatar: true, department: true, role: true }
    });
    if (team.length === 0) return [];
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const teamIds = team.map((t) => t.id);
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(attendanceRecords.companyId, companyId),
        eq(attendanceRecords.date, today),
        inArray(attendanceRecords.employeeId, teamIds)
      )
    });
    const byEmployee = {};
    for (const r of records) {
      const existing = byEmployee[r.employeeId];
      if (!existing || new Date(r.clockIn) > new Date(existing.clockIn)) byEmployee[r.employeeId] = r;
    }
    return team.map((t) => {
      const record = byEmployee[t.id];
      return {
        employeeId: t.id,
        name: t.name,
        lastName: t.lastName,
        avatar: t.avatar,
        department: t.department,
        status: record ? record.clockOut ? "clocked-out" : record.status : "absent",
        clockIn: record?.clockIn || null,
        clockOut: record?.clockOut || null
      };
    });
  }
  async createManualAttendanceRecord(companyId, data) {
    const id = `ATT-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const date = data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const clockIn2 = data.clockIn || `${date}T00:00:00.000Z`;
    let workHours = data.workHours ?? 0;
    if (data.clockOut && data.workHours === void 0) {
      workHours = +(Math.abs(new Date(data.clockOut).getTime() - new Date(clockIn2).getTime()) / (1e3 * 60 * 60)).toFixed(2);
    }
    const result = await this.db.insert(attendanceRecords).values({
      id,
      companyId,
      employeeId: data.employeeId,
      date,
      clockIn: clockIn2,
      clockOut: data.clockOut || null,
      status: data.status || "present",
      locationIn: data.locationIn || "Manual Entry (HR)",
      workHours,
      overtime: data.overtime ?? 0,
      notes: data.notes
    }).returning();
    return result[0];
  }
  async updateAttendanceRecord(companyId, id, data) {
    const existing = await this.db.query.attendanceRecords.findFirst({
      where: and(eq(attendanceRecords.id, id), eq(attendanceRecords.companyId, companyId))
    });
    if (!existing) return null;
    const updateData = {};
    if (data.clockIn !== void 0) updateData.clockIn = data.clockIn;
    if (data.clockOut !== void 0) updateData.clockOut = data.clockOut;
    if (data.status !== void 0) updateData.status = data.status;
    if (data.notes !== void 0) updateData.notes = data.notes;
    if (data.locationIn !== void 0) updateData.locationIn = data.locationIn;
    if (data.locationOut !== void 0) updateData.locationOut = data.locationOut;
    const effectiveClockIn = updateData.clockIn ?? existing.clockIn;
    const effectiveClockOut = updateData.clockOut !== void 0 ? updateData.clockOut : existing.clockOut;
    if (data.workHours !== void 0) {
      updateData.workHours = data.workHours;
    } else if (effectiveClockOut) {
      updateData.workHours = +(Math.abs(new Date(effectiveClockOut).getTime() - new Date(effectiveClockIn).getTime()) / (1e3 * 60 * 60)).toFixed(2);
    }
    if (data.overtime !== void 0) updateData.overtime = data.overtime;
    const result = await this.db.update(attendanceRecords).set(updateData).where(and(eq(attendanceRecords.id, id), eq(attendanceRecords.companyId, companyId))).returning();
    return result[0];
  }
  async deleteAttendanceRecord(companyId, id) {
    const result = await this.db.delete(attendanceRecords).where(and(eq(attendanceRecords.id, id), eq(attendanceRecords.companyId, companyId))).returning();
    return result[0] || null;
  }
  // ---------------------------------------------------------------------
  // Overtime oversight (Admin & Manager)
  // ---------------------------------------------------------------------
  async getAllOvertimeRequests(companyId, filters = {}) {
    const conditions = [eq(overtimeRequests.companyId, companyId)];
    if (filters.status) conditions.push(eq(overtimeRequests.status, filters.status));
    if (filters.managerId) {
      const teamIds = await this.getManagerTeamIds(companyId, filters.managerId);
      if (teamIds.length === 0) return [];
      conditions.push(inArray(overtimeRequests.employeeId, teamIds));
    }
    return this.db.select({
      id: overtimeRequests.id,
      employeeId: overtimeRequests.employeeId,
      name: employees.name,
      lastName: employees.lastName,
      avatar: employees.avatar,
      department: employees.department,
      date: overtimeRequests.date,
      startTime: overtimeRequests.startTime,
      endTime: overtimeRequests.endTime,
      hours: overtimeRequests.hours,
      reason: overtimeRequests.reason,
      deliverable: overtimeRequests.deliverable,
      status: overtimeRequests.status,
      managerComment: overtimeRequests.managerComment,
      createdAt: overtimeRequests.createdAt
    }).from(overtimeRequests).innerJoin(employees, eq(overtimeRequests.employeeId, employees.id)).where(and(...conditions)).orderBy(desc(overtimeRequests.date), desc(overtimeRequests.createdAt)).all();
  }
  async updateOvertimeRequestStatus(companyId, requestId, data) {
    const updateData = {
      status: data.status,
      managerId: data.managerId,
      managerComment: data.managerComment
    };
    if (data.hours !== void 0) updateData.hours = data.hours;
    const result = await this.db.update(overtimeRequests).set(updateData).where(and(eq(overtimeRequests.companyId, companyId), eq(overtimeRequests.id, requestId))).returning();
    return result[0];
  }
  async getPendingTeamOvertimeRequests(companyId, managerId) {
    return this.db.select({
      id: overtimeRequests.id,
      employeeId: overtimeRequests.employeeId,
      name: employees.name,
      lastName: employees.lastName,
      avatar: employees.avatar,
      date: overtimeRequests.date,
      startTime: overtimeRequests.startTime,
      endTime: overtimeRequests.endTime,
      hours: overtimeRequests.hours,
      reason: overtimeRequests.reason,
      deliverable: overtimeRequests.deliverable,
      status: overtimeRequests.status
    }).from(overtimeRequests).innerJoin(employees, eq(overtimeRequests.employeeId, employees.id)).where(
      and(
        eq(overtimeRequests.companyId, companyId),
        eq(overtimeRequests.status, "pending"),
        eq(employees.managerId, managerId)
      )
    ).all();
  }
  async updateTeamOvertimeRequestStatus(companyId, managerId, requestId, data) {
    const request = await this.db.query.overtimeRequests.findFirst({
      where: and(eq(overtimeRequests.id, requestId), eq(overtimeRequests.companyId, companyId))
    });
    if (!request) return null;
    const employee = await this.db.query.employees.findFirst({
      where: eq(employees.id, request.employeeId)
    });
    if (!employee || employee.managerId !== managerId) return null;
    return this.updateOvertimeRequestStatus(companyId, requestId, {
      status: data.status,
      managerComment: data.managerComment,
      hours: data.hours,
      managerId
    });
  }
};

// src/controllers/admin/attendance.controller.ts
var getAllAttendance = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const role = c.get("role");
  const employeeId = c.get("employeeId");
  const attendanceService = new AttendanceService(c.env.DB);
  const records = await attendanceService.getCompanyAttendance(companyId, {
    date: c.req.query("date"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    employeeId: c.req.query("employeeId"),
    managerId: role === "MANAGER" ? employeeId : void 0
  });
  return c.json(records);
}, "getAllAttendance");
var getAttendanceSummary = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const role = c.get("role");
  const employeeId = c.get("employeeId");
  const date = c.req.query("date") || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const attendanceService = new AttendanceService(c.env.DB);
  const summary = await attendanceService.getAttendanceSummary(companyId, date, role === "MANAGER" ? employeeId : void 0);
  return c.json(summary);
}, "getAttendanceSummary");
var createAttendanceRecord = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const record = await attendanceService.createManualAttendanceRecord(companyId, payload);
  return c.json(record, 201);
}, "createAttendanceRecord");
var updateAttendanceRecord = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateAttendanceRecord(companyId, id, payload);
  if (!updated) return c.json({ error: "Attendance record not found" }, 404);
  return c.json(updated);
}, "updateAttendanceRecord");
var deleteAttendanceRecord = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const attendanceService = new AttendanceService(c.env.DB);
  const deleted = await attendanceService.deleteAttendanceRecord(companyId, id);
  if (!deleted) return c.json({ error: "Attendance record not found" }, 404);
  return c.json(deleted);
}, "deleteAttendanceRecord");
var getOvertimeRequests = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const attendanceService = new AttendanceService(c.env.DB);
  const requests = await attendanceService.getAllOvertimeRequests(companyId, {
    status: c.req.query("status")
  });
  return c.json(requests);
}, "getOvertimeRequests");
var updateOvertimeStatus = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const requestId = c.req.param("id");
  const payload = await c.req.json();
  const managerId = c.get("employeeId");
  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateOvertimeRequestStatus(companyId, requestId, {
    status: payload.status,
    managerComment: payload.managerComment,
    hours: payload.hours,
    managerId
  });
  if (!updated) return c.json({ error: "Overtime request not found" }, 404);
  return c.json(updated);
}, "updateOvertimeStatus");
var getAttendancePolicy = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const attendanceService = new AttendanceService(c.env.DB);
  const policy = await attendanceService.getAttendancePolicy(companyId);
  return c.json(policy);
}, "getAttendancePolicy");
var updateAttendancePolicy = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateAttendancePolicy(companyId, payload);
  return c.json(updated);
}, "updateAttendancePolicy");

// src/routes/attendance-admin.routes.ts
var attendanceAdminRoutes = new Hono2();
var adminOnly3 = requireRole("SUPER_ADMIN", "HR_ADMIN");
var readable = requireRole("SUPER_ADMIN", "HR_ADMIN", "MANAGER");
var view2 = requirePermission("attendance", "view");
var edit = requirePermission("attendance", "edit");
var approve2 = requirePermission("attendance", "approve");
attendanceAdminRoutes.get("/summary", readable, view2, getAttendanceSummary);
attendanceAdminRoutes.get("/overtime", adminOnly3, view2, getOvertimeRequests);
attendanceAdminRoutes.patch("/overtime/:id/status", adminOnly3, approve2, updateOvertimeStatus);
attendanceAdminRoutes.get("/policy", adminOnly3, view2, getAttendancePolicy);
attendanceAdminRoutes.put("/policy", adminOnly3, edit, updateAttendancePolicy);
attendanceAdminRoutes.get("/", readable, view2, getAllAttendance);
attendanceAdminRoutes.post("/", adminOnly3, edit, createAttendanceRecord);
attendanceAdminRoutes.put("/:id", adminOnly3, edit, updateAttendanceRecord);
attendanceAdminRoutes.delete("/:id", adminOnly3, edit, deleteAttendanceRecord);
var attendance_admin_routes_default = attendanceAdminRoutes;

// src/services/settings.service.ts
var SettingsService = class {
  static {
    __name(this, "SettingsService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getSettings(companyId) {
    const settings = await this.db.select().from(companySettings).where(eq(companySettings.companyId, companyId)).get();
    if (!settings) {
      return {
        companyId,
        require2fa: false,
        passwordMinLength: 12,
        sessionTimeoutMins: 60,
        attendanceStartTime: "09:00",
        attendanceEndTime: "17:00",
        attendanceGraceMinutes: 15
      };
    }
    return settings;
  }
  async updateSettings(companyId, payload) {
    const existing = await this.db.select().from(companySettings).where(eq(companySettings.companyId, companyId)).get();
    const data = { ...payload, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (existing) {
      return this.db.update(companySettings).set(data).where(eq(companySettings.companyId, companyId)).returning().get();
    } else {
      return this.db.insert(companySettings).values({ companyId, ...data }).returning().get();
    }
  }
  async getApiKeys(companyId) {
    return this.db.select().from(apiKeys).where(eq(apiKeys.companyId, companyId)).all();
  }
  async createApiKey(companyId, name) {
    const key = `zk_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const id = `key_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(apiKeys).values({
      id,
      companyId,
      name,
      key,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning().get();
  }
  async deleteApiKey(companyId, keyId) {
    return this.db.delete(apiKeys).where(and(eq(apiKeys.id, keyId), eq(apiKeys.companyId, companyId))).returning().get();
  }
};

// src/services/company.service.ts
var CompanyService = class {
  static {
    __name(this, "CompanyService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getCompany(companyId) {
    return this.db.select().from(companies).where(eq(companies.id, companyId)).get();
  }
  async updateCompany(companyId, data) {
    return this.db.update(companies).set(data).where(eq(companies.id, companyId)).returning().get();
  }
};

// src/services/org.service.ts
var employeeSummaryColumns = {
  id: employees.id,
  name: employees.name,
  lastName: employees.lastName,
  email: employees.email,
  role: employees.role,
  avatar: employees.avatar,
  departmentId: employees.departmentId
};
var OrgService = class {
  static {
    __name(this, "OrgService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getDepartments(companyId) {
    const [departments2, employees2] = await Promise.all([
      this.db.select().from(departments).where(eq(departments.companyId, companyId)).all(),
      this.db.select(employeeSummaryColumns).from(employees).where(eq(employees.companyId, companyId)).all()
    ]);
    const employeesById = new Map(employees2.map((e) => [e.id, e]));
    const memberCounts = /* @__PURE__ */ new Map();
    for (const emp of employees2) {
      if (!emp.departmentId) continue;
      memberCounts.set(emp.departmentId, (memberCounts.get(emp.departmentId) || 0) + 1);
    }
    const toSummary = /* @__PURE__ */ __name((emp) => emp ? { id: emp.id, name: `${emp.name} ${emp.lastName}`.trim(), avatar: emp.avatar } : null, "toSummary");
    return departments2.map((d) => ({
      ...d,
      memberCount: memberCounts.get(d.id) || 0,
      manager: toSummary(d.managerId ? employeesById.get(d.managerId) : void 0),
      teamLead: toSummary(d.teamLeadId ? employeesById.get(d.teamLeadId) : void 0)
    }));
  }
  async createDepartment(companyId, data) {
    const id = `dept_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(departments).values({
      id,
      companyId,
      name: data.name,
      description: data.description,
      managerId: data.managerId || null,
      teamLeadId: data.teamLeadId || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning().get();
  }
  async updateDepartment(companyId, id, data) {
    return this.db.update(departments).set({ ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(eq(departments.id, id), eq(departments.companyId, companyId))).returning().get();
  }
  async deleteDepartment(companyId, id) {
    await this.db.update(employees).set({ departmentId: null, department: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(eq(employees.companyId, companyId), eq(employees.departmentId, id)));
    return this.db.delete(departments).where(and(eq(departments.id, id), eq(departments.companyId, companyId))).returning().get();
  }
  async getDepartmentMembers(companyId, departmentId) {
    return this.db.select(employeeSummaryColumns).from(employees).where(and(eq(employees.companyId, companyId), eq(employees.departmentId, departmentId))).all();
  }
  async assignEmployeeToDepartment(companyId, departmentId, employeeId) {
    const department = await this.db.query.departments.findFirst({
      where: and(eq(departments.id, departmentId), eq(departments.companyId, companyId))
    });
    if (!department) return null;
    const updated = await this.db.update(employees).set({ departmentId, department: department.name, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId))).returning().get();
    if (!updated) return null;
    const { passwordHash, passwordSalt, ...safeEmployee } = updated;
    return safeEmployee;
  }
  async removeEmployeeFromDepartment(companyId, departmentId, employeeId) {
    const updated = await this.db.update(employees).set({ departmentId: null, department: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(
      eq(employees.id, employeeId),
      eq(employees.companyId, companyId),
      eq(employees.departmentId, departmentId)
    )).returning().get();
    if (!updated) return null;
    const { passwordHash, passwordSalt, ...safeEmployee } = updated;
    return safeEmployee;
  }
  async getLocations(companyId) {
    return this.db.select().from(locations).where(eq(locations.companyId, companyId)).all();
  }
  async createLocation(companyId, data) {
    const id = `loc_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(locations).values({
      id,
      companyId,
      ...data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning().get();
  }
  async deleteLocation(companyId, id) {
    return this.db.delete(locations).where(and(eq(locations.id, id), eq(locations.companyId, companyId))).returning().get();
  }
};

// src/services/role.service.ts
var RoleService = class {
  static {
    __name(this, "RoleService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getRoles(companyId) {
    return this.db.select().from(roles).where(eq(roles.companyId, companyId)).all();
  }
  async getRole(companyId, id) {
    return this.db.select().from(roles).where(and(eq(roles.id, id), eq(roles.companyId, companyId))).get();
  }
  async createRole(companyId, data) {
    const id = `role_${Math.random().toString(36).substring(2, 9)}`;
    return this.db.insert(roles).values({
      id,
      companyId,
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      color: data.color || "slate",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning().get();
  }
  async updateRole(companyId, id, data) {
    return this.db.update(roles).set({ ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(eq(roles.id, id), eq(roles.companyId, companyId))).returning().get();
  }
  async deleteRole(companyId, id) {
    return this.db.delete(roles).where(and(eq(roles.id, id), eq(roles.companyId, companyId))).returning().get();
  }
};

// src/services/dashboard.service.ts
var DashboardService = class {
  static {
    __name(this, "DashboardService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getDashboardStats(companyId) {
    const headcountResult = await this.db.select({ count: sql`count(*)` }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        sql`${employees.status} IN ('active', 'onboarding')`
      )
    );
    const totalHeadcount = headcountResult[0]?.count || 0;
    const currentYearMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    const newHiresResult = await this.db.select({ count: sql`count(*)` }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        like(employees.hireDate, `${currentYearMonth}%`)
      )
    );
    const newHires = newHiresResult[0]?.count || 0;
    const openPositionsResult = await this.db.select({ count: sql`count(*)` }).from(jobRequisitions).where(
      and(
        eq(jobRequisitions.companyId, companyId),
        sql`${jobRequisitions.status} IN ('Sourcing', 'Interviewing', 'Open')`
      )
    );
    const openPositions = openPositionsResult[0]?.count || 0;
    const deptResult = await this.db.select({
      name: employees.department,
      value: sql`count(*)`
    }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        sql`${employees.status} IN ('active', 'onboarding')`
      )
    ).groupBy(employees.department);
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];
    const deptData = deptResult.map((d, i) => ({
      name: d.name || "Unassigned",
      value: d.value,
      fill: colors[i % colors.length]
    }));
    const diversityResult = await this.db.select({
      name: employees.gender,
      value: sql`count(*)`
    }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        sql`${employees.status} IN ('active', 'onboarding')`
      )
    ).groupBy(employees.gender);
    const genderColors = {
      "Male": "#3b82f6",
      "Female": "#ec4899",
      "Non-binary": "#8b5cf6",
      "Prefer not to say": "#94a3b8"
    };
    const diversityData = diversityResult.map((d) => ({
      name: d.name || "Unassigned",
      value: d.value,
      fill: genderColors[d.name || ""] || "#f59e0b"
    }));
    const attritionRate = totalHeadcount > 0 ? (Math.random() * 5).toFixed(1) + "%" : "0%";
    const headcountTrend = [
      { month: "Jan", total: totalHeadcount > 20 ? totalHeadcount - 10 : 0, hires: 2, exits: 0 },
      { month: "Feb", total: totalHeadcount > 20 ? totalHeadcount - 5 : 0, hires: 5, exits: 0 },
      { month: "Mar", total: totalHeadcount, hires: newHires, exits: 1 }
    ];
    const payrollResult = await this.db.select({ total: sql`sum(${employees.salary})` }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        sql`${employees.status} = 'active'`
      )
    );
    const totalPayroll = payrollResult[0]?.total || 0;
    const alerts = [];
    const today = /* @__PURE__ */ new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const todayStr = today.toISOString().slice(0, 10);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().slice(0, 10);
    const probationResult = await this.db.select({ count: sql`count(*)` }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        gte(employees.probationEnd, todayStr),
        sql`${employees.probationEnd} <= ${thirtyDaysStr}`
      )
    );
    const probationCount = probationResult[0]?.count || 0;
    if (probationCount > 0) {
      alerts.push({
        title: "Probation Ending",
        sub: `${probationCount} Employees (Next 30 days)`,
        type: "red",
        iconType: "UserCheck"
      });
    }
    const pendingLeaveResult = await this.db.select({ count: sql`count(*)` }).from(leaveRequests).where(
      and(
        eq(leaveRequests.companyId, companyId),
        eq(leaveRequests.status, "pending")
      )
    );
    const pendingLeaveCount = pendingLeaveResult[0]?.count || 0;
    if (pendingLeaveCount > 0) {
      alerts.push({
        title: "Leave Requests",
        sub: `${pendingLeaveCount} pending approvals`,
        type: "orange",
        iconType: "Calendar"
      });
    }
    const pendingRequisitionsResult = await this.db.select({ count: sql`count(*)` }).from(jobRequisitions).where(
      and(
        eq(jobRequisitions.companyId, companyId),
        eq(jobRequisitions.status, "Pending Approval")
      )
    );
    const pendingReqCount = pendingRequisitionsResult[0]?.count || 0;
    if (pendingReqCount > 0) {
      alerts.push({
        title: "Job Requisitions",
        sub: `${pendingReqCount} awaiting review`,
        type: "orange",
        iconType: "Briefcase"
        // Using Briefcase or similar for jobs
      });
    }
    const recentActivityRaw = await this.db.select().from(auditLogs).where(eq(auditLogs.companyId, companyId)).orderBy(sql`${auditLogs.createdAt} DESC`).limit(5);
    const recentActivity = recentActivityRaw.map((log) => {
      const logDate = new Date(log.createdAt);
      const diffMs = today.getTime() - logDate.getTime();
      const diffHrs = Math.floor(diffMs / (1e3 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      let tStr = "Just now";
      if (diffDays > 0) tStr = `${diffDays}d ago`;
      else if (diffHrs > 0) tStr = `${diffHrs}h ago`;
      return {
        ev: `${log.actorName} ${log.action} ${log.details}`.trim(),
        t: tStr,
        color: "bg-indigo-500"
        // Default color, could map based on action
      };
    });
    if (recentActivity.length === 0) {
      recentActivity.push({ ev: "System initialized", t: "Just now", color: "bg-emerald-500" });
    }
    const currentMonth = today.toISOString().slice(5, 7);
    const birthdaysResult = await this.db.select({ name: employees.name, lastName: employees.lastName }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        like(employees.dob, `%-${currentMonth}-%`)
      )
    );
    const birthdays = birthdaysResult.map((emp) => `${emp.name} ${emp.lastName?.[0]}.`);
    const anniversariesResult = await this.db.select({ name: employees.name, lastName: employees.lastName, hireDate: employees.hireDate }).from(employees).where(
      and(
        eq(employees.companyId, companyId),
        like(employees.hireDate, `%-${currentMonth}-%`)
      )
    );
    const anniversaries = anniversariesResult.filter((emp) => emp.hireDate && !emp.hireDate.startsWith(today.getFullYear().toString())).map((emp) => `${emp.name} ${emp.lastName?.[0]}.`);
    return {
      totalHeadcount,
      newHires,
      attritionRate,
      openPositions,
      totalPayroll,
      deptData,
      diversityData,
      headcountTrend,
      alerts,
      recentActivity,
      events: {
        birthdays,
        anniversaries
      }
    };
  }
};

// src/controllers/admin/performance.controller.ts
var getEmployeeAssessments = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = c.get("db");
    const records = await db.select().from(assessments).where(and(eq(assessments.employeeId, employeeId), eq(assessments.companyId, companyId))).orderBy(desc(assessments.createdAt));
    return c.json(records);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getEmployeeAssessments");
var addEmployeeAssessment = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = c.get("db");
    const body = await c.req.json();
    const id = `ASSESS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newAssessment = await db.insert(assessments).values({
      id,
      companyId,
      employeeId,
      cycleName: body.cycleName || "Mid-Year Review",
      managerRating: body.managerRating,
      managerComment: body.managerComment,
      status: "completed",
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return c.json(newAssessment[0]);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "addEmployeeAssessment");

// src/controllers/admin/benefits.controller.ts
var getEmployeeBenefits = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = c.get("db");
    const record = await db.select().from(employeeBenefits).where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId))).get();
    return c.json(record || null);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getEmployeeBenefits");
var updateEmployeeBenefits = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = c.get("db");
    const body = await c.req.json();
    const existing = await db.select().from(employeeBenefits).where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId))).get();
    if (existing) {
      const updated = await db.update(employeeBenefits).set({ ...body }).where(eq(employeeBenefits.id, existing.id)).returning();
      return c.json(updated[0]);
    } else {
      const id = `BEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const inserted = await db.insert(employeeBenefits).values({
        id,
        companyId,
        employeeId,
        ...body
      }).returning();
      return c.json(inserted[0]);
    }
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "updateEmployeeBenefits");

// src/controllers/admin/training.controller.ts
var getEmployeeTrainings = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = c.get("db");
    const records = await db.select().from(employeeTrainings).where(and(eq(employeeTrainings.employeeId, employeeId), eq(employeeTrainings.companyId, companyId))).orderBy(desc(employeeTrainings.createdAt));
    return c.json(records);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "getEmployeeTrainings");
var addEmployeeTraining = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.req.param("id");
    const companyId = c.get("companyId");
    const db = c.get("db");
    const body = await c.req.json();
    const id = `TRN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newTraining = await db.insert(employeeTrainings).values({
      id,
      companyId,
      employeeId,
      courseName: body.courseName,
      provider: body.provider,
      status: body.status || "in_progress",
      date: body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    }).returning();
    return c.json(newTraining[0]);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
}, "addEmployeeTraining");

// src/routes/admin.routes.ts
var adminRoutes = new Hono2();
var adminOnly4 = requireRole("SUPER_ADMIN", "HR_ADMIN");
var view3 = /* @__PURE__ */ __name((mod) => requirePermission(mod, "view"), "view");
var create = /* @__PURE__ */ __name((mod) => requirePermission(mod, "create"), "create");
var edit2 = /* @__PURE__ */ __name((mod) => requirePermission(mod, "edit"), "edit");
var del = /* @__PURE__ */ __name((mod) => requirePermission(mod, "delete"), "del");
adminRoutes.get("/dev/seed", async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema: schema_exports });
    const companyId = "comp-1234";
    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.id, companyId)
    });
    if (!existingCompany) {
      await db.insert(companies).values({
        id: companyId,
        name: "ZenHR Demo Company"
      });
    }
    const users = [
      { email: "admin@zenhr.com", role: "SUPER_ADMIN", name: "Super Admin", salary: 12e6 },
      { email: "hr@zenhr.com", role: "HR_ADMIN", name: "HR Admin", salary: 96e5 },
      { email: "manager@zenhr.com", role: "MANAGER", name: "Manager", salary: 84e5 },
      { email: "recruiter@zenhr.com", role: "RECRUITER", name: "Recruiter", salary: 6e6 },
      { email: "employee@zenhr.com", role: "EMPLOYEE", name: "Employee", salary: 48e5 },
      { email: "payroll@zenhr.com", role: "PAYROLL_OFFICER", name: "Payroll Officer", salary: 72e5 }
    ];
    for (const u of users) {
      const existingUser = await db.query.employees.findFirst({
        where: eq(employees.email, u.email)
      });
      if (!existingUser) {
        const salt = generateSalt();
        const hash = await hashPassword("password123", salt);
        const parts = u.name.split(" ");
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ");
        await db.insert(employees).values({
          id: `EMP-${crypto.randomUUID().split("-")[0].toUpperCase()}`,
          companyId,
          email: u.email,
          name: firstName,
          lastName,
          role: u.role,
          passwordHash: hash,
          passwordSalt: salt,
          isPasswordChanged: true,
          department: "Engineering",
          employmentType: "Full-time",
          status: "active",
          // Seeded so the Payroll module has something real to compute on
          // demo data instead of showing ₦0 for every employee.
          salary: u.salary,
          baseSalary: u.salary,
          bankName: "GTBank",
          accountNumber: `00${Math.floor(1e6 + Math.random() * 8999999)}`,
          accountName: `${firstName} ${lastName}`.trim(),
          pfa: "ARM Pension Managers",
          pensionId: `PEN${Math.floor(1e5 + Math.random() * 899999)}`,
          tin: `TIN${Math.floor(1e6 + Math.random() * 8999999)}`,
          hireDate: "2023-01-15"
        });
      }
    }
    return c.json({ message: "Dev users seeded" });
  } catch (err) {
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});
adminRoutes.use("*", authMiddleware);
adminRoutes.get("/employees", adminOnly4, view3("workforce"), getEmployees);
adminRoutes.get("/employees/:id", adminOnly4, view3("workforce"), getEmployee);
adminRoutes.get("/employees/:id/direct-reports", adminOnly4, view3("workforce"), getDirectReports);
adminRoutes.get("/employees/:id/audit-logs", adminOnly4, view3("workforce"), getAuditLogs);
adminRoutes.post("/employees", adminOnly4, create("workforce"), createEmployee);
adminRoutes.put("/employees/:id", adminOnly4, edit2("workforce"), updateEmployee);
adminRoutes.delete("/employees/:id", adminOnly4, del("workforce"), deleteEmployee);
adminRoutes.post("/employees/:id/emergency-contacts", adminOnly4, edit2("workforce"), addEmergencyContact);
adminRoutes.delete("/employees/:id/emergency-contacts/:contactId", adminOnly4, edit2("workforce"), deleteEmergencyContact);
adminRoutes.post("/employees/:id/documents", adminOnly4, edit2("workforce"), addDocument);
adminRoutes.delete("/employees/:id/documents/:documentId", adminOnly4, edit2("workforce"), deleteDocument);
adminRoutes.get("/employees/:id/assets", adminOnly4, view3("workforce"), getAssets);
adminRoutes.post("/employees/:id/assets", adminOnly4, edit2("workforce"), addAsset);
adminRoutes.delete("/employees/:id/assets/:assetId", adminOnly4, edit2("workforce"), deleteAsset);
adminRoutes.get("/transitions", adminOnly4, view3("workforce"), getTransitions);
adminRoutes.get("/transitions/:id", adminOnly4, view3("workforce"), getTransition);
adminRoutes.post("/transitions", adminOnly4, create("workforce"), createTransition);
adminRoutes.post("/transitions/:id/tasks", adminOnly4, edit2("workforce"), addTransitionTask);
adminRoutes.patch("/transitions/:id/tasks/:taskId", adminOnly4, edit2("workforce"), updateTransitionTaskStatus);
adminRoutes.patch("/transitions/:id/cancel", adminOnly4, del("workforce"), cancelTransition);
adminRoutes.get("/performance/employee/:id", adminOnly4, view3("performance"), getEmployeeAssessments);
adminRoutes.post("/performance/employee/:id", adminOnly4, create("performance"), addEmployeeAssessment);
adminRoutes.get("/benefits/employee/:id", adminOnly4, getEmployeeBenefits);
adminRoutes.put("/benefits/employee/:id", adminOnly4, updateEmployeeBenefits);
adminRoutes.get("/training/employee/:id", adminOnly4, view3("performance"), getEmployeeTrainings);
adminRoutes.post("/training/employee/:id", adminOnly4, create("performance"), addEmployeeTraining);
adminRoutes.route("/payroll", payroll_routes_default);
adminRoutes.route("/leaves", leave_admin_routes_default);
adminRoutes.route("/job-requisitions", requisition_routes_default);
adminRoutes.route("/attendance", attendance_admin_routes_default);
adminRoutes.get("/dashboard/stats", adminOnly4, async (c) => {
  try {
    const companyId = c.get("companyId");
    const dashboardService = new DashboardService(c.env.DB);
    const stats = await dashboardService.getDashboardStats(companyId);
    return c.json(stats);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
adminRoutes.get("/settings", adminOnly4, view3("settings"), async (c) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.getSettings(companyId);
  return c.json(settings);
});
adminRoutes.put("/settings", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const settings = await settingsService.updateSettings(companyId, payload);
  return c.json(settings);
});
adminRoutes.get("/api-keys", adminOnly4, view3("settings"), async (c) => {
  const companyId = c.get("companyId");
  const settingsService = new SettingsService(c.env.DB);
  const keys = await settingsService.getApiKeys(companyId);
  return c.json(keys);
});
adminRoutes.post("/api-keys", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const { name } = await c.req.json();
  const settingsService = new SettingsService(c.env.DB);
  const key = await settingsService.createApiKey(companyId, name);
  return c.json(key);
});
adminRoutes.delete("/api-keys/:id", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  const settingsService = new SettingsService(c.env.DB);
  const deleted = await settingsService.deleteApiKey(companyId, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json(deleted);
});
adminRoutes.get("/company", adminOnly4, view3("settings"), async (c) => {
  const companyId = c.get("companyId");
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.getCompany(companyId);
  return c.json(company);
});
adminRoutes.put("/company", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const companyService = new CompanyService(c.env.DB);
  const company = await companyService.updateCompany(companyId, payload);
  return c.json(company);
});
adminRoutes.get("/departments", adminOnly4, view3("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartments(companyId));
});
adminRoutes.post("/departments", adminOnly4, create("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createDepartment(companyId, payload));
});
adminRoutes.put("/departments/:id", adminOnly4, edit2("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const updated = await orgService.updateDepartment(companyId, c.req.param("id"), payload);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});
adminRoutes.delete("/departments/:id", adminOnly4, del("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(
    await orgService.deleteDepartment(companyId, c.req.param("id"))
  );
});
adminRoutes.get("/departments/:id/members", adminOnly4, view3("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getDepartmentMembers(companyId, c.req.param("id")));
});
adminRoutes.post("/departments/:id/members", adminOnly4, edit2("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const { employeeId } = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.assignEmployeeToDepartment(companyId, c.req.param("id"), employeeId);
  if (!member) return c.json({ error: "Department or employee not found" }, 404);
  return c.json(member);
});
adminRoutes.delete("/departments/:id/members/:employeeId", adminOnly4, edit2("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  const member = await orgService.removeEmployeeFromDepartment(companyId, c.req.param("id"), c.req.param("employeeId"));
  if (!member) return c.json({ error: "Employee is not a member of this department" }, 404);
  return c.json(member);
});
adminRoutes.get("/locations", adminOnly4, view3("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.getLocations(companyId));
});
adminRoutes.post("/locations", adminOnly4, create("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.createLocation(companyId, payload));
});
adminRoutes.delete("/locations/:id", adminOnly4, del("workforce"), async (c) => {
  const companyId = c.get("companyId");
  const orgService = new OrgService(c.env.DB);
  return c.json(await orgService.deleteLocation(companyId, c.req.param("id")));
});
adminRoutes.get("/roles", adminOnly4, view3("settings"), async (c) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.getRoles(companyId));
});
adminRoutes.post("/roles", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.createRole(companyId, payload));
});
adminRoutes.put("/roles/:id", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const payload = await c.req.json();
  const roleService = new RoleService(c.env.DB);
  return c.json(
    await roleService.updateRole(companyId, c.req.param("id"), payload)
  );
});
adminRoutes.delete("/roles/:id", adminOnly4, edit2("settings"), async (c) => {
  const companyId = c.get("companyId");
  const roleService = new RoleService(c.env.DB);
  return c.json(await roleService.deleteRole(companyId, c.req.param("id")));
});
var admin_routes_default = adminRoutes;

// src/controllers/employee/profile.controller.ts
var getMyProfile = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  const profile = await service.getEmployeeProfile(companyId, employeeId);
  if (!profile) {
    return c.json({ error: "Employee not found" }, 404);
  }
  return c.json(profile);
}, "getMyProfile");
var getDirectory = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  if (!companyId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  const directory = await service.getDirectory(companyId);
  return c.json(directory);
}, "getDirectory");
var updateMyProfile = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  const data = await c.req.json();
  const profile = await service.updateEmployeeProfile(companyId, employeeId, data);
  if (!profile) {
    return c.json({ error: "Employee not found" }, 404);
  }
  return c.json(profile);
}, "updateMyProfile");
var addEmergencyContact2 = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  const data = await c.req.json();
  const contact = await service.addEmergencyContact(companyId, employeeId, data);
  return c.json(contact);
}, "addEmergencyContact");
var deleteEmergencyContact2 = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const contactId = c.req.param("id");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  await service.deleteEmergencyContact(companyId, employeeId, contactId);
  return c.json({ success: true });
}, "deleteEmergencyContact");
var uploadDocument = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  const formData = await c.req.formData();
  const file = formData.get("file");
  const name = formData.get("name");
  const type = formData.get("type");
  if (!file || !name || !type) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  const document = await service.addDocument(companyId, employeeId, c.env.BUCKET, { name, type, file });
  return c.json(document);
}, "uploadDocument");
var deleteDocument2 = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const documentId = c.req.param("id");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  await service.deleteDocument(companyId, employeeId, c.env.BUCKET, documentId);
  return c.json({ success: true });
}, "deleteDocument");
var downloadDocument = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const documentId = c.req.param("id");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new EmployeeService(c.env.DB);
  try {
    const { file, doc } = await service.getDocumentFile(companyId, employeeId, c.env.BUCKET, documentId);
    c.header("Content-Type", file.httpMetadata?.contentType || "application/octet-stream");
    c.header("Content-Disposition", `attachment; filename="${doc.name}"`);
    return c.body(file.body);
  } catch (err) {
    return c.json({ error: err.message }, 404);
  }
}, "downloadDocument");

// src/controllers/employee/leave.controller.ts
var getMyLeaveData = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const leaveService = new LeaveService(c.env.DB);
  const balances = await leaveService.calculateLeaveBalances(companyId, employeeId);
  const requests = await leaveService.getEmployeeLeaveRequests(companyId, employeeId);
  return c.json({ balances, requests });
}, "getMyLeaveData");
var getTeamLeaves = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const leaveService = new LeaveService(c.env.DB);
  const teamLeaves = await leaveService.getTeamLeaves(companyId);
  return c.json(teamLeaves);
}, "getTeamLeaves");
var getMyTeamPendingLeaves = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const leaveService = new LeaveService(c.env.DB);
  const requests = await leaveService.getPendingTeamLeaveRequests(companyId, employeeId);
  return c.json(requests);
}, "getMyTeamPendingLeaves");
var updateTeamLeaveStatus = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const requestId = c.req.param("id");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const payload = await c.req.json();
  const leaveService = new LeaveService(c.env.DB);
  const updated = await leaveService.updateTeamLeaveRequestStatus(companyId, employeeId, requestId, {
    status: payload.status,
    managerComment: payload.managerComment
  });
  if (!updated) {
    return c.json({ error: "Leave request not found, or you are not this employee's manager" }, 404);
  }
  return c.json(updated);
}, "updateTeamLeaveStatus");
var applyForLeave = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const leaveService = new LeaveService(c.env.DB);
  const data = await c.req.json();
  const request = await leaveService.createLeaveRequest(companyId, employeeId, data);
  return c.json(request);
}, "applyForLeave");

// src/controllers/employee/attendance.controller.ts
var getAttendanceData = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const todaySessions = await attendanceService.getTodaySessions(companyId, employeeId);
  const activeSession = await attendanceService.getActiveSession(companyId, employeeId);
  const history = await attendanceService.getEmployeeAttendance(companyId, employeeId);
  const totalWorkHours = todaySessions.reduce((sum, s) => sum + (s.workHours || 0), 0);
  return c.json({ activeSession, todaySessions, totalWorkHours, history });
}, "getAttendanceData");
var clockIn = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const data = await c.req.json();
  const currentActive = await attendanceService.getActiveSession(companyId, employeeId);
  if (currentActive) {
    return c.json({ error: "You are already clocked in" }, 400);
  }
  const request = await attendanceService.clockIn(companyId, employeeId, data);
  return c.json(request);
}, "clockIn");
var clockOut = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const data = await c.req.json();
  const request = await attendanceService.clockOut(companyId, employeeId, data);
  return c.json(request);
}, "clockOut");
var getOvertimeRequests2 = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const overtimeRequests2 = await attendanceService.getOvertimeRequests(companyId, employeeId);
  return c.json(overtimeRequests2);
}, "getOvertimeRequests");
var submitOvertimeRequest = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const data = await c.req.json();
  const result = await attendanceService.createOvertimeRequest({
    ...data,
    companyId,
    employeeId
  });
  return c.json(result);
}, "submitOvertimeRequest");
var getMyTeamAttendanceToday = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const team = await attendanceService.getTeamAttendanceToday(companyId, employeeId);
  return c.json(team);
}, "getMyTeamAttendanceToday");
var getMyTeamPendingOvertime = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const attendanceService = new AttendanceService(c.env.DB);
  const requests = await attendanceService.getPendingTeamOvertimeRequests(companyId, employeeId);
  return c.json(requests);
}, "getMyTeamPendingOvertime");
var updateTeamOvertimeStatus = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const requestId = c.req.param("id");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const payload = await c.req.json();
  const attendanceService = new AttendanceService(c.env.DB);
  const updated = await attendanceService.updateTeamOvertimeRequestStatus(companyId, employeeId, requestId, {
    status: payload.status,
    managerComment: payload.managerComment,
    hours: payload.hours
  });
  if (!updated) {
    return c.json({ error: "Overtime request not found, or you are not this employee's manager" }, 404);
  }
  return c.json(updated);
}, "updateTeamOvertimeStatus");

// src/services/benefits.service.ts
var BenefitsService = class {
  static {
    __name(this, "BenefitsService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding);
  }
  async getEmployeeCompensation(companyId, employeeId) {
    const [employee] = await this.db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));
    if (!employee) throw new Error("Employee not found");
    let [benefits] = await this.db.select().from(employeeBenefits).where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId)));
    if (!benefits) {
      const defaultId = crypto.randomUUID();
      await this.db.insert(employeeBenefits).values({
        id: defaultId,
        companyId,
        employeeId,
        healthProvider: "ZenHR Care",
        healthPlan: "Premium Plus",
        healthCoverage: "Family",
        healthPremium: 5e4,
        retirementPlan: "ZenHR 401(k)",
        retirementBalance: 0,
        retirementContributionRate: 5,
        employerMatchRate: 5,
        equityGranted: 1e3,
        equityVested: 0,
        equityValue: 5e5,
        wellnessBudget: 15e4,
        wellnessUsed: 0
      });
      [benefits] = await this.db.select().from(employeeBenefits).where(eq(employeeBenefits.id, defaultId));
    }
    return {
      baseSalary: employee.baseSalary || employee.salary || 0,
      // Fallback if baseSalary is null
      benefits
    };
  }
};

// src/controllers/employee/compensation.controller.ts
var getMyCompensation = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  try {
    const benefitsService = new BenefitsService(c.env.DB);
    const compensation = await benefitsService.getEmployeeCompensation(companyId, employeeId);
    return c.json(compensation);
  } catch (error) {
    console.error("Error fetching compensation:", error);
    return c.json({ error: error.message }, 500);
  }
}, "getMyCompensation");

// src/controllers/employee/payslip.controller.ts
var getMyPayslips = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.get("employeeId");
    const companyId = c.get("companyId");
    if (!employeeId) return c.json({ error: "Unauthorized: No employee ID found" }, 401);
    const db = drizzle(c.env.DB, { schema: schema_exports });
    const records = await db.select({
      id: payslips.id,
      runId: payslips.runId,
      basicSalary: payslips.basicSalary,
      allowances: payslips.allowances,
      bonuses: payslips.bonuses,
      grossPay: payslips.grossPay,
      taxDeductions: payslips.taxDeductions,
      pensionDeductions: payslips.pensionDeductions,
      loanDeductions: payslips.loanDeductions,
      otherDeductions: payslips.otherDeductions,
      netPay: payslips.netPay,
      createdAt: payslips.createdAt,
      periodMonth: payrollRuns.periodMonth,
      periodYear: payrollRuns.periodYear,
      status: payrollRuns.status,
      paidAt: payrollRuns.paidAt
    }).from(payslips).innerJoin(payrollRuns, eq(payslips.runId, payrollRuns.id)).where(and(eq(payslips.employeeId, employeeId), eq(payrollRuns.companyId, companyId), eq(payrollRuns.status, "paid"))).orderBy(desc(payrollRuns.periodYear), desc(payrollRuns.periodMonth));
    return c.json({ data: records });
  } catch (error) {
    console.error("Error fetching my payslips:", error);
    return c.json({ error: error.message }, 500);
  }
}, "getMyPayslips");

// src/controllers/employee/feedback.controller.ts
var sendShoutout = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const { toEmployeeName, type, message } = await c.req.json();
  if (!toEmployeeName || !type || !message) {
    return c.json({ error: "recipient, type and message are required" }, 400);
  }
  const db = drizzle(c.env.DB);
  const id = `FB-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
  await db.insert(feedbacks).values({
    id,
    companyId,
    fromEmployeeId: employeeId,
    toEmployeeName,
    type,
    message
  });
  return c.json({ id, message: "Shoutout sent!" }, 201);
}, "sendShoutout");
var getShoutouts = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const db = drizzle(c.env.DB);
  const results = await db.select().from(feedbacks).where(eq(feedbacks.companyId, companyId)).orderBy(desc(feedbacks.createdAt)).limit(50);
  return c.json(results);
}, "getShoutouts");

// src/controllers/employee/goal.controller.ts
var getMyGoals = /* @__PURE__ */ __name(async (c) => {
  const employeeId = c.get("employeeId");
  const companyId = c.get("companyId");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(goals).where(and(eq(goals.employeeId, employeeId), eq(goals.companyId, companyId))).orderBy(desc(goals.createdAt));
  const result = rows.map((g) => ({
    ...g,
    keyResults: g.keyResults ? JSON.parse(g.keyResults) : []
  }));
  return c.json(result);
}, "getMyGoals");
var createGoal = /* @__PURE__ */ __name(async (c) => {
  const employeeId = c.get("employeeId");
  const companyId = c.get("companyId");
  const body = await c.req.json();
  const db = drizzle(c.env.DB);
  const id = `GOAL-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
  await db.insert(goals).values({
    id,
    companyId,
    employeeId,
    title: body.title,
    description: body.description || null,
    priority: body.priority || "medium",
    status: body.status || "on_track",
    progress: body.progress ?? 0,
    dueDate: body.dueDate || null,
    keyResults: body.keyResults ? JSON.stringify(body.keyResults) : null
  });
  return c.json({ id, message: "Goal created" }, 201);
}, "createGoal");
var updateGoalProgress = /* @__PURE__ */ __name(async (c) => {
  const employeeId = c.get("employeeId");
  const companyId = c.get("companyId");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Goal id is required" }, 400);
  const { progress, status } = await c.req.json();
  const db = drizzle(c.env.DB);
  await db.update(goals).set({ progress, status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(and(eq(goals.id, id), eq(goals.employeeId, employeeId), eq(goals.companyId, companyId)));
  return c.json({ message: "Goal updated" });
}, "updateGoalProgress");

// src/services/assessment.service.ts
var AssessmentService = class {
  static {
    __name(this, "AssessmentService");
  }
  db;
  constructor(dbBinding) {
    this.db = drizzle(dbBinding, { schema: schema_exports });
  }
  async getEmployeeAssessments(companyId, employeeId) {
    return this.db.query.assessments.findMany({
      where: and(
        eq(assessments.companyId, companyId),
        eq(assessments.employeeId, employeeId)
      ),
      orderBy: [desc(assessments.createdAt)]
    });
  }
  async getAssessmentById(companyId, assessmentId) {
    return this.db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, assessmentId),
        eq(assessments.companyId, companyId)
      )
    });
  }
  async createAssessment(companyId, employeeId, data) {
    const id = `ASM-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    const result = await this.db.insert(assessments).values({
      id,
      companyId,
      employeeId,
      cycleName: data.cycleName,
      status: "draft",
      achievements: JSON.stringify(data.achievements || []),
      challenges: JSON.stringify(data.challenges || []),
      goalsProgress: JSON.stringify(data.goalsProgress || []),
      skillRatings: JSON.stringify(data.skillRatings || []),
      selfRating: data.selfRating || null,
      selfComment: data.selfComment || null,
      developmentGoals: JSON.stringify(data.developmentGoals || [])
    }).returning();
    return result[0];
  }
  async updateAssessment(companyId, assessmentId, data) {
    const updateData = {
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (data.achievements !== void 0) updateData.achievements = JSON.stringify(data.achievements);
    if (data.challenges !== void 0) updateData.challenges = JSON.stringify(data.challenges);
    if (data.goalsProgress !== void 0) updateData.goalsProgress = JSON.stringify(data.goalsProgress);
    if (data.skillRatings !== void 0) updateData.skillRatings = JSON.stringify(data.skillRatings);
    if (data.selfRating !== void 0) updateData.selfRating = data.selfRating;
    if (data.selfComment !== void 0) updateData.selfComment = data.selfComment;
    if (data.developmentGoals !== void 0) updateData.developmentGoals = JSON.stringify(data.developmentGoals);
    const result = await this.db.update(assessments).set(updateData).where(and(
      eq(assessments.id, assessmentId),
      eq(assessments.companyId, companyId)
    )).returning();
    return result[0];
  }
  async submitAssessment(companyId, assessmentId) {
    const result = await this.db.update(assessments).set({
      status: "submitted",
      submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(and(
      eq(assessments.id, assessmentId),
      eq(assessments.companyId, companyId)
    )).returning();
    return result[0];
  }
  async getActiveCycleAssessment(companyId, employeeId, cycleName) {
    return this.db.query.assessments.findFirst({
      where: and(
        eq(assessments.companyId, companyId),
        eq(assessments.employeeId, employeeId),
        eq(assessments.cycleName, cycleName)
      )
    });
  }
};

// src/controllers/employee/assessment.controller.ts
var getMyAssessments = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new AssessmentService(c.env.DB);
  const assessments2 = await service.getEmployeeAssessments(companyId, employeeId);
  const parsedAssessments = assessments2.map((asm) => ({
    ...asm,
    achievements: asm.achievements ? JSON.parse(asm.achievements) : [],
    challenges: asm.challenges ? JSON.parse(asm.challenges) : [],
    goalsProgress: asm.goalsProgress ? JSON.parse(asm.goalsProgress) : [],
    skillRatings: asm.skillRatings ? JSON.parse(asm.skillRatings) : [],
    developmentGoals: asm.developmentGoals ? JSON.parse(asm.developmentGoals) : []
  }));
  return c.json(parsedAssessments);
}, "getMyAssessments");
var getAssessment = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const assessmentId = c.req.param("id");
  if (!assessmentId) {
    return c.json({ error: "Assessment ID is required" }, 400);
  }
  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getAssessmentById(companyId, assessmentId);
  if (!assessment) {
    return c.json({ error: "Assessment not found" }, 404);
  }
  const parsedAssessment = {
    ...assessment,
    achievements: assessment.achievements ? JSON.parse(assessment.achievements) : [],
    challenges: assessment.challenges ? JSON.parse(assessment.challenges) : [],
    goalsProgress: assessment.goalsProgress ? JSON.parse(assessment.goalsProgress) : [],
    skillRatings: assessment.skillRatings ? JSON.parse(assessment.skillRatings) : [],
    developmentGoals: assessment.developmentGoals ? JSON.parse(assessment.developmentGoals) : []
  };
  return c.json(parsedAssessment);
}, "getAssessment");
var createAssessment = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new AssessmentService(c.env.DB);
  const data = await c.req.json();
  const assessment = await service.createAssessment(companyId, employeeId, data);
  return c.json(assessment, 201);
}, "createAssessment");
var updateAssessment = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const assessmentId = c.req.param("id");
  if (!assessmentId) {
    return c.json({ error: "Assessment ID is required" }, 400);
  }
  const service = new AssessmentService(c.env.DB);
  const data = await c.req.json();
  const assessment = await service.updateAssessment(companyId, assessmentId, data);
  if (!assessment) {
    return c.json({ error: "Assessment not found" }, 404);
  }
  return c.json(assessment);
}, "updateAssessment");
var submitAssessment = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const assessmentId = c.req.param("id");
  if (!assessmentId) {
    return c.json({ error: "Assessment ID is required" }, 400);
  }
  const service = new AssessmentService(c.env.DB);
  const assessment = await service.submitAssessment(companyId, assessmentId);
  if (!assessment) {
    return c.json({ error: "Assessment not found" }, 404);
  }
  return c.json(assessment);
}, "submitAssessment");
var getActiveCycleAssessment = /* @__PURE__ */ __name(async (c) => {
  const companyId = c.get("companyId");
  const employeeId = c.get("employeeId");
  const cycleName = c.req.query("cycle") || "H2 2024";
  if (!employeeId) {
    return c.json({ error: "Unauthorized: No employee ID found" }, 401);
  }
  const service = new AssessmentService(c.env.DB);
  const assessment = await service.getActiveCycleAssessment(companyId, employeeId, cycleName);
  if (!assessment) {
    return c.json(null);
  }
  const parsedAssessment = {
    ...assessment,
    achievements: assessment.achievements ? JSON.parse(assessment.achievements) : [],
    challenges: assessment.challenges ? JSON.parse(assessment.challenges) : [],
    goalsProgress: assessment.goalsProgress ? JSON.parse(assessment.goalsProgress) : [],
    skillRatings: assessment.skillRatings ? JSON.parse(assessment.skillRatings) : [],
    developmentGoals: assessment.developmentGoals ? JSON.parse(assessment.developmentGoals) : []
  };
  return c.json(parsedAssessment);
}, "getActiveCycleAssessment");

// src/routes/employee.routes.ts
var employeeRoutes = new Hono2();
employeeRoutes.use("*", authMiddleware);
employeeRoutes.get("/directory", getDirectory);
employeeRoutes.get("/me", getMyProfile);
employeeRoutes.get("/me/compensation", getMyCompensation);
employeeRoutes.get("/me/payslips", getMyPayslips);
employeeRoutes.put("/me", updateMyProfile);
employeeRoutes.post("/me/emergency-contacts", addEmergencyContact2);
employeeRoutes.delete("/me/emergency-contacts/:id", deleteEmergencyContact2);
employeeRoutes.post("/me/documents", uploadDocument);
employeeRoutes.delete("/me/documents/:id", deleteDocument2);
employeeRoutes.get("/me/documents/:id/download", downloadDocument);
employeeRoutes.get("/leave/me", getMyLeaveData);
employeeRoutes.post("/leave/apply", applyForLeave);
employeeRoutes.get("/leave/team", getTeamLeaves);
employeeRoutes.get("/leave/team-requests", getMyTeamPendingLeaves);
employeeRoutes.patch("/leave/team-requests/:id/status", updateTeamLeaveStatus);
employeeRoutes.get("/attendance/me", getAttendanceData);
employeeRoutes.post("/attendance/clock-in", clockIn);
employeeRoutes.post("/attendance/clock-out", clockOut);
employeeRoutes.get("/attendance/overtime", getOvertimeRequests2);
employeeRoutes.post("/attendance/overtime", submitOvertimeRequest);
employeeRoutes.get("/attendance/team", getMyTeamAttendanceToday);
employeeRoutes.get("/attendance/team-requests", getMyTeamPendingOvertime);
employeeRoutes.patch("/attendance/team-requests/:id/status", updateTeamOvertimeStatus);
employeeRoutes.post("/feedback", sendShoutout);
employeeRoutes.get("/feedback", getShoutouts);
employeeRoutes.get("/goals", getMyGoals);
employeeRoutes.post("/goals", createGoal);
employeeRoutes.patch("/goals/:id", updateGoalProgress);
employeeRoutes.get("/assessments", getMyAssessments);
employeeRoutes.get("/assessments/active", getActiveCycleAssessment);
employeeRoutes.get("/assessments/:id", getAssessment);
employeeRoutes.post("/assessments", createAssessment);
employeeRoutes.put("/assessments/:id", updateAssessment);
employeeRoutes.post("/assessments/:id/submit", submitAssessment);
var employee_routes_default = employeeRoutes;

// src/controllers/auth.controller.ts
var login = /* @__PURE__ */ __name(async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    const authService = new AuthService(c.env.DB);
    const jwtSecret = c.env.JWT_SECRET || "fallback_secret_for_local_dev";
    const result = await authService.login(email, password, jwtSecret);
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 401);
  }
}, "login");
var changePassword = /* @__PURE__ */ __name(async (c) => {
  try {
    const employeeId = c.get("employeeId") || c.req.header("x-employee-id");
    if (!employeeId) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) {
      return c.json({ error: "Current and new passwords are required" }, 400);
    }
    const authService = new AuthService(c.env.DB);
    await authService.changePassword(employeeId, currentPassword, newPassword);
    return c.json({ message: "Password changed successfully" });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}, "changePassword");
var registerCompany = /* @__PURE__ */ __name(async (c) => {
  try {
    const payload = await c.req.json();
    const { companyName, adminFirstName, adminLastName, adminEmail, adminPassword } = payload;
    if (!companyName || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return c.json({ error: "All fields are required" }, 400);
    }
    const authService = new AuthService(c.env.DB);
    const jwtSecret = c.env.JWT_SECRET || "fallback_secret_for_local_dev";
    const result = await authService.registerCompany(payload, jwtSecret);
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}, "registerCompany");

// src/routes/auth.routes.ts
var router = new Hono2();
router.post("/login", login);
router.post("/register", registerCompany);
router.post("/change-password", changePassword);
var auth_routes_default = router;

// src/routes/index.ts
var rootRouter = new Hono2();
rootRouter.route("/auth", auth_routes_default);
rootRouter.route("/admin", admin_routes_default);
rootRouter.route("/employee", employee_routes_default);
var routes_default = rootRouter;

// src/index.ts
var app = new Hono2();
app.use("*", cors());
app.get("/", (c) => {
  return c.json({ message: "Welcome to the ZenHR API!" });
});
app.route("/", routes_default);
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-KaSjbZ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-KaSjbZ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
