addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  let urls = [];
  let response = await fetch(`https://cfw-takehome.developers.workers.dev/api/variants`);
  let variants = await response.json();

  urls = variants.variants;

  var url = urls[Math.floor(Math.random() * urls.length)];  

  return new Response(url, {
    headers: { "content-type": "application/json" }
  });
}
