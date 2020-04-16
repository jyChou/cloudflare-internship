class titleRewriter {
  constructor() {
    this.buffer = "";
  }
  text(text) {
    // concatenate all text until it reaches lastInTextNode
    this.buffer += text.text;
    if (text.lastInTextNode) {
      text.replace(
        this.buffer.replace(
          /Variant [12]+/,
          "Cloudflare-internship-2020-fullstack"
        )
      );
      // reset buffer
      this.buffer = "";
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}

class headingRewriter {
  constructor() {
    this.buffer = "";
  }
  text(text) {
    // concatenate text until it reaches lastInTextNode
    this.buffer += text.text;
    if (text.lastInTextNode) {
      text.replace(
        this.buffer.replace(
          /Variant [12]+/, 
          "Chin-Yu Chou, MS@Cornell Tech"
        )
      );
      // reset buffer
      this.buffer = "";
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}
class descRewriter {
  constructor() {
    this.buffer = "";
  }
  text(text) {
    // concatenate all text until it reaches lastInTextNode
    this.buffer += text.text;
    if (text.lastInTextNode) {
      text.replace(
        this.buffer.replace(
          /This is variant (one|two) of the take home project!/,
          "Hi, I am Chin-Yu. I am interested in full stack developement and machine learning!"
        )
      );
      // reset buffer
      this.buffer = "";
    } else {
      // remove any intermediate text
      text.remove();
    }
  }
}

class urlRewriter {
  constructor(targetAttribute) {
    this.targetAttribute = targetAttribute;
    this.buffer = "";
  }

  element(element) {
    const attribute = element.getAttribute(this.targetAttribute);
    if (attribute) {
      element.setAttribute(
        this.targetAttribute,
        attribute.replace(
          "https://cloudflare.com", 
          "https://github.com/jyChou"
        )
      );
    }
  }

  text(text) {
    this.buffer += text.text;
    if (text.lastInTextNode) {
      text.replace(
        this.buffer.replace(
          "Return to cloudflare.com",
          "Go to Chin-Yu's github"
        )
      );
      this.buffer = "";
    } else {
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
  const { variants } = await fetch(
    "https://cfw-takehome.developers.workers.dev/api/variants"
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("API server error!");
      }
    })
    .catch((error) => {
      console.error(`Error:${error}`);
    });

  // Create response with correspoding paths
  const VARIANT_ONE = await fetch(variants[0]);
  const VARIANT_TWO = await fetch(variants[1]);

  // Get cookie
  const cookie = request.headers.get("cookie");

  // Assign user to the presisting variant if cookie exists
  if (cookie && cookie.includes(`endpoint=1`)) {
    return rewriter.transform(VARIANT_ONE);
  } else if (cookie && cookie.includes(`endpoint=2`)) {
    return rewriter.transform(VARIANT_TWO);
  } else {
    // create cookie for new user
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
