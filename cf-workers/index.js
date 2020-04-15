addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const endpoint = "https://cfw-takehome.developers.workers.dev/api/variants";
  const urls = await parse(endpoint);

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

  const firstVariant = await fetch(urls[0]);
  const firstContent = await rewriteHTML('First', await firstVariant).text();
  const secondVariant = await fetch(urls[1]);
  const secondContent = await rewriteHTML('Second', await secondVariant).text();

  const FIRST_RESPONSE = new Response(firstContent);
  const SECOND_RESPONSE = new Response(secondContent);

  return processCookie(
    request,
    endpoint,
    FIRST_RESPONSE,
    SECOND_RESPONSE,
    urls
  );
}

function rewriteHTML(variant, content) {
  return new HTMLRewriter()
      .on('title', {
        element(element) {
          element.setInnerContent(`${variant} Variant, Saakshaat`);
        }
      })
      .on('a#url', new AttributeHandler('href'))
      .on('a#url', {
        element(element) {
          element.setInnerContent('Check out this awesome developer')
        }
      })
      .on('p#description', {
        element(element) {
          element.setInnerContent(`I will confess, the HTMLRewriter API was impressive. <br> Here's the ${variant} page.`)
        }
      })
      .transform(content);
}

class AttributeHandler {
  constructor(attributeName){
    this.attributeName = attributeName;
  }

  element(element) {
    console.log("I'm here");
    const attribute = element.getAttribute(this.attributeName)
    if(attribute) {
      element.setAttribute(
        this.attributeName,
        attribute.replace('https://cloudflare.com', 'https://saakshaat.github.io')
      )
    }
  }
}


const processCookie = (request, endpoint, first, second, urls) => {
  const cookie = request.headers.get("cookie");
  let response;

  if (cookie && cookie.includes("/1")) {
    response = first;
  } else if (cookie && cookie.includes("/2")) {
    response = second;
  } else {
    let group = Math.random() < 0.5 ? 1 : 2;
    response = group === 2 ? first : second;
    response.headers.append(
      "Set-Cookie",
      `${endpoint}/${group}=${group}; path=/`
    );
    req = new Request(`${endpoint}/${group}`);
    console.log(req);
    response;
  }
  return response;
};