class titleRewriter {
  text(text) {
    // remove all text until it reaches lastInTextNode
    if (text.lastInTextNode) {
      text.replace("Cloudflare-internship-2020-fullstack");
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}

class headingRewriter {
  text(text) {
    // remove all text until it reaches lastInTextNode
    if (text.lastInTextNode) {
      text.replace("Chin-Yu Chou, MS@Cornell Tech");
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}

class descRewriter {
  text(text) {
    // remove all text until it reaches lastInTextNode
    if (text.lastInTextNode) {
      text.replace(
        "Hi, I am Chin-Yu. I am interested in full stack developement and machine learning!"
      );
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}

class urlRewriter {
  constructor(targetAttribute) {
    this.targetAttribute = targetAttribute;
  }

  element(element) {
    const attribute = element.getAttribute(this.targetAttribute);
    if (attribute) {
      element.setAttribute(this.targetAttribute, "https://github.com/jyChou");
    }
  }

  text(text) {
    // remove all text until it reaches lastInTextNode
    if (text.lastInTextNode) {
      text.replace("Go to Chin-Yu's github");
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}

const rewriter = new HTMLRewriter()
  .on("title", new titleRewriter())
  .on("h1#title", new headingRewriter())
  .on("p#description", new descRewriter())
  .on("a#url", new urlRewriter("href"));

async function handleRequest(request) {
  // Get the urls of two variants
  let variants = null;
  try {
    const response = await fetch(
      "https://cfw-takehome.developers.workers.dev/api/variants"
    );
    if (response.ok) {
      const data = await response.json();
      variants = data["variants"];
    } else {
      throw new Error(response.status);
    }
  } catch (err) {
    console.error(err);
  }    
  // if fetch fails, response with error status code
  if(!variants){
    return new Response("Fetch failed.");
  }
  // Create response of two variants
  const VARIANT_ONE = await fetch(variants[0]);
  const VARIANT_TWO = await fetch(variants[1]);
  // Get cookie
  const cookie = request.headers.get("cookie");
  // Assign user to the corresponding variant if cookie exists
  if (cookie && cookie.includes(`endpoint=1`)) {
    return rewriter.transform(VARIANT_ONE);
  } else if (cookie && cookie.includes(`endpoint=2`)) {
    return rewriter.transform(VARIANT_TWO);
  } else {
    // determine endpoint and generate cookie for new user
    const endpoint = Math.random() < 0.5 ? 1 : 2;
    let response;
    if (endpoint === 1) {
      response = new Response(VARIANT_ONE.body, VARIANT_ONE);
    } else {
      response = new Response(VARIANT_TWO.body, VARIANT_TWO);
    }
    response.headers.set("Set-Cookie", `endpoint=${endpoint};`);
    return rewriter.transform(response);
  }
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
