/**
 * Lite script som injiseres i rot-dokumentet til en opplastet preview.
 * Det gir foreldrevinduet to ting den ellers ikke kan få fra en sandboxet
 * iframe med ugjennomsiktig origin: dokumenthøyde og synkronisert scrolling.
 *
 * Det rører ingenting annet i sida, og feiler stille hvis noe er uvanlig.
 */
const BRIDGE = `
<script data-visningsrom-bridge>
(function () {
  if (window.top === window.self) return;
  var applying = false;
  var queued = false;

  function docHeight() {
    var b = document.body, e = document.documentElement;
    return Math.max(
      b ? b.scrollHeight : 0, b ? b.offsetHeight : 0,
      e ? e.scrollHeight : 0, e ? e.offsetHeight : 0
    );
  }

  function post(type, extra) {
    var payload = { __visningsrom: true, type: type };
    for (var key in extra) payload[key] = extra[key];
    try { window.parent.postMessage(payload, '*'); } catch (e) {}
  }

  function reportScroll() {
    queued = false;
    if (applying) return;
    var max = Math.max(1, docHeight() - window.innerHeight);
    post('scroll', { ratio: window.scrollY / max, top: window.scrollY });
  }

  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(reportScroll);
  }, { passive: true });

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.__visningsrom !== true) return;
    if (data.type === 'scrollTo') {
      applying = true;
      var max = Math.max(1, docHeight() - window.innerHeight);
      window.scrollTo(0, Math.round(data.ratio * max));
      setTimeout(function () { applying = false; }, 60);
    }
  });

  function reportReady() {
    post('ready', { height: docHeight(), title: document.title || '' });
  }

  if (document.readyState === 'complete') reportReady();
  else window.addEventListener('load', reportReady);
  document.addEventListener('DOMContentLoaded', reportReady);
})();
</script>
`;

/** Setter broen inn rett før </body>, ellers på slutten av dokumentet. */
export function injectBridge(html: string): string {
  const closing = html.lastIndexOf("</body>");
  if (closing !== -1) {
    return html.slice(0, closing) + BRIDGE + html.slice(closing);
  }
  const closingHtml = html.lastIndexOf("</html>");
  if (closingHtml !== -1) {
    return html.slice(0, closingHtml) + BRIDGE + html.slice(closingHtml);
  }
  return html + BRIDGE;
}
