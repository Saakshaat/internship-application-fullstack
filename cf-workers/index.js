addEventListener("fetch", event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const endpoint = 'https://cfw-takehome.developers.workers.dev/api/variants';
  urls = await parse(endpoint);

  return await distributeRequests(request, endpoint, urls);
}

async function parse(endpoint) {
  const response = await fetch(endpoint);
  const variants = await response.json();

  return variants.variants;
}

async function distributeRequests(request, endpoint, urls) {
  /** 
   * Following A/B Testing methodology for equally distibuting the requests between the 2 variants
   * Saving the returned variant in a cookie for Persisting Variants
  */
 const FIRST_VARIANT = new Response('first variant', await fetch(urls[0]));
 const SECOND_VARIANT = new Response('second variant', await fetch(urls[1]));
 
 return processCookie(request, endpoint, FIRST_VARIANT, SECOND_VARIANT);
}

const processCookie = (request, endpoint, first, second) => {
  const cookie = request.headers.get('cookie')
  if(cookie && cookie.includes('/1')) {
      return first
    } else if(cookie && cookie.includes('/2')) {
      return second
    } else {
      let group = Math.random() < 0.5 ? 1 : 2;
      let response = group === 2 ? first : second;
      response.headers.append('Set-Cookie', `${endpoint}/${group}=${group}; path=/`);
      return response;
    }
}
