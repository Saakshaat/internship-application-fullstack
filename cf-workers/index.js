addEventListener("fetch", event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(handleRequest(event.request), );
});

async function handleRequest(request) {
  let urls = [];
  const endpoint = 'https://cfw-takehome.developers.workers.dev/api/variants';
  let response = await fetch(endpoint);
  let variants = await response.json();

  urls = variants.variants;

  const FIRST_VARIANT = new Response('first variant', fetch(urls[0]));
  const SECOND_VARIANT = new Response('second variant', fetch(urls[1]));

  const cookie = request.headers.get('cookie')
  if(cookie && cookie.includes('/1')) {
    return FIRST_VARIANT;
  } else if(cookie && cookie.includes('/2')) {
    return SECOND_VARIANT;
  } else {
    let group = Math.random() < 0.5 ? 1 : 2;
    let response = group === 2 ? SECOND_VARIANT : FIRST_VARIANT;
    response.headers.append('Set-Cookie', `${endpoint}/${group}=${group}; path=/`)
    return response;
  }
}
