// Small local runner for the mockup screens, so they open in any browser without the mockup site.
// It understands what the screens use: {{value}} holes, <sc-for>, <sc-if>, click/pointer/drop events and setState.
(function () {
  const EVENTS = { onclick: 'click', ondblclick: 'dblclick', onpointerdown: 'pointerdown', onpointermove: 'pointermove', onpointerup: 'pointerup', onpointerleave: 'pointerleave', ondragover: 'dragover', ondrop: 'drop' };
  const WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;
  let component, template, host, pending = false;
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(change) { this.state = Object.assign({}, this.state, typeof change === 'function' ? change(this.state) : change); schedule(); }
    forceUpdate() { schedule(); }
  }
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; render(); }); }
  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    const parts = path.split('.');
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i] && parts[0] in scopes[i]) { let value = scopes[i]; for (const part of parts) value = value == null ? undefined : value[part]; return value; }
    }
    return undefined;
  }
  const fill = (text, scopes) => text.replace(/\{\{([^}]+)\}\}/g, (m, path) => { const v = lookup(path, scopes); return v == null ? '' : String(v); });
  function build(node, scopes, parent) {
    if (node.nodeType === 3) { parent.appendChild(document.createTextNode(fill(node.nodeValue, scopes))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.localName;
    if (tag === 'helmet') return;
    if (tag === 'sc-for') {
      const list = lookup(WHOLE.exec(node.getAttribute('list'))[1], scopes) || [], name = node.getAttribute('as');
      list.forEach((item, index) => { for (const child of node.childNodes) build(child, [...scopes, { [name]: item, $index: index }], parent); });
      return;
    }
    if (tag === 'sc-if') { if (lookup(WHOLE.exec(node.getAttribute('value'))[1], scopes)) for (const child of node.childNodes) build(child, scopes, parent); return; }
    const html = node.namespaceURI === 'http://www.w3.org/1999/xhtml';
    const el = html ? document.createElement(tag) : document.createElementNS(node.namespaceURI, node.tagName);
    for (const attr of node.attributes) {
      const whole = WHOLE.exec(attr.value);
      if (EVENTS[attr.name]) { const fn = whole && lookup(whole[1], scopes); if (typeof fn === 'function') el.addEventListener(EVENTS[attr.name], fn); continue; }
      if (attr.name.startsWith('hint-')) continue;
      if (whole) {
        const v = lookup(whole[1], scopes);
        if (v == null || (v === false && !attr.name.startsWith('aria-'))) continue;
        el.setAttribute(attr.name, String(v));
      } else el.setAttribute(attr.name, attr.value.includes('{{') ? fill(attr.value, scopes) : attr.value);
    }
    for (const child of node.childNodes) build(child, scopes, el);
    parent.appendChild(el);
  }
  function render() { const values = component.renderVals(); host.replaceChildren(); for (const child of template.childNodes) build(child, [values], host); }
  addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('x-dc');
    for (const style of root.querySelectorAll('helmet style')) document.head.appendChild(style.cloneNode(true));
    template = root.cloneNode(true);
    host = document.createElement('div');
    root.replaceWith(host);
    const script = document.querySelector('script[data-dc-script]');
    const props = {};
    try { for (const [key, spec] of Object.entries(JSON.parse(script.getAttribute('data-props') || '{}'))) if (spec && 'default' in spec) props[key] = spec.default; } catch {}
    const Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    component = new Component(props);
    render();
  });
})();
