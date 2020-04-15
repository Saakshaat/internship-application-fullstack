addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const endpoint = "https://cfw-takehome.developers.workers.dev/api/variants";
  const urls = await parse(endpoint);

  const response = await distributeRequests(request, endpoint, urls); 
  return response;
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

  if (cookie && cookie.includes("/1")) {
    return first;
  } else if (cookie && cookie.includes("/2")) {
    return second;
  } else {
    let group = Math.random() < 0.5 ? 1 : 2;
    const response = group === 2 ? second : first;
    response.headers.append(
      "Set-Cookie",
      `${endpoint}/${group}=${group}; path=/`
    );
    return response;
  }
};
