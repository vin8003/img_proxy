export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);
    const imageUrl = reqUrl.searchParams.get("url");

    // 1. Validate input
    if (!imageUrl) {
      return new Response("Missing image url", { status: 400 });
    }

    // (Optional but recommended) allow-list
    if (
      !imageUrl.startsWith(
        "https://bmvhzw5ybhpw.compat.objectstorage.ap-mumbai-1.oraclecloud.com"
      )
    ) {
      return new Response("Forbidden", { status: 403 });
    }

    // 2. Fetch upstream image
    const upstream = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!upstream.ok) {
      return new Response("Upstream fetch failed", {
        status: upstream.status,
      });
    }

    // 3. Optional size guard (prevents crashes & abuse)
    const size = upstream.headers.get("content-length");
    if (size && Number(size) > 3_000_000) {
      return new Response("Image too large", { status: 413 });
    }

    // 4. Clone headers
    const headers = new Headers(upstream.headers);

    // 🔑 REQUIRED FOR FLUTTER WEB
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");

    // Fix invalid CORS combo
    headers.set(
      "Access-Control-Allow-Origin",
      request.headers.get("Origin") || "*"
    );
    headers.delete("Access-Control-Allow-Credentials");

    // Strong caching
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};
