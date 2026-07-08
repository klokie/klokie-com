// Canonical-host worker: every non-www host (apex, workers.dev) 301s to
// www.klokie.com preserving path + query; www serves the static assets.
// See resources/programming/web-project-standards.md (canonical host).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== "www.klokie.com" && !url.hostname.startsWith("localhost")) {
      url.hostname = "www.klokie.com";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
