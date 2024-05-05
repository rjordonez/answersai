let apiKey = null;
let selectedModel = "gpt-3.5-turbo";

chrome.storage.sync.get(["butler-chatgpt-apikey", "butler-chatgpt-model", "disable-extension"], (val) => {
    if (val["disable-extension"]) return;

    apiKey = val["butler-chatgpt-apikey"];
    selectedModel = val["butler-chatgpt-model"] || "gpt-3.5-turbo";
    
    console.log("Extension is enabled and running");
});

chrome.runtime.onMessage.addListener(function ({ data, model }, sender, sendResponse) {
  apiKey = data;
  selectedModel = model;
  sendResponse("Received API key and model");
});

const getTextParsed = (text) => {
  const keyword = 'helpme:';
  if (text.startsWith(keyword) && text.trim().endsWith(';'))
    return text.substring(keyword.length, text.lastIndexOf(';')).trim();
  return null;
};

const MAX_CHAR_LIMIT = 8000;
const ALLOWED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'article', 'section', 'header', 'footer', 'div'];

const extractLimitedTextFromAllowedTags = () => {
    let textContent = "";
    ALLOWED_TAGS.forEach((tag) => {
        const elements = document.querySelectorAll(tag);
        elements.forEach((el) => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            if (tag === 'div' && !el.className && !el.id) return;
            const text = el.textContent || el.innerText || '';
            if (text.trim()) {
                const cleanedText = text.replace(/\s+/g, ' ').trim();
                textContent += cleanedText + "\n";
                if (textContent.length >= MAX_CHAR_LIMIT) {
                    textContent = textContent.substring(0, MAX_CHAR_LIMIT) + "\n[Content truncated]";
                    return textContent;
                }
            }
        });
    });
    return textContent.trim();
};

const makeChatGPTCall = async (text, node) => {
  console.log("Starting GPT call with model:", selectedModel);
  if (!apiKey) {
      console.error("ChatGPT API key for Butler AI is missing");
      return "API key is missing.";
  }

  const pageContext = extractLimitedTextFromAllowedTags();
  toggleLoadingIcon(node);
  try {
      const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
      };

      const messages = [
          { role: "system", content: "Context from the current webpage." },
          { role: "system", content: pageContext },
          { role: "user", content: text }
      ];

      const body = JSON.stringify({
          model: selectedModel,
          messages,
          max_tokens: 2048,
          temperature: 0.7
      });

      const requestOptions = {
          method: "POST",
          headers,
          body
      };

      let response = await fetch("https://api.openai.com/v1/chat/completions", requestOptions);
      response = await response.json();

      if (response.error) {
          console.error("OpenAI API Error:", response.error.message);
          return `Error: ${response.error.message}`;
      }

      const { choices } = response;
      if (!choices || choices.length === 0) {
          console.error("No choices returned from the API");
          return "No response generated";
      }

      return choices[0].message.content.trim();
  } catch (e) {
      console.error("Error while calling OpenAI API", e);
      return "Error while calling OpenAI API";
  } finally {
      toggleLoadingIcon(node, false);
  }
};

let loaderElement = null;
const toggleLoadingIcon = (node, show = true) => {
  if (!loaderElement) {
    const ele = document.createElement("img");
    ele.src = chrome.runtime.getURL(`icons/loading.gif`);
    ele.style.width = "50px";
    ele.style.position = "absolute";
    ele.style.right = "0";
    ele.style.bottom = "15px";
    loaderElement = ele;
  }

  if (show) {
    node.parentNode.appendChild(loaderElement);
  } else {
    if (node.parentNode.contains(loaderElement)) {
      node.parentNode.removeChild(loaderElement);
    }
  }
};

const getTextContentFromDOMElements = (nodes, textarea = false) => {
  if (!nodes || nodes.length === 0) return null;

  for (let node of nodes) {
    const value = textarea ? node.value : node.textContent;
    if (node && value) {
      const text = getTextParsed(value);
      if (text) return [node, text];
      else return null;
    }
  }
};

function debounce(func, delay) {
  let inDebounce;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
}

chrome.storage.sync.get("disable-extension", (val) => {
  if (val["disable-extension"]) return;

  console.log("Extension is enabled and running");
});
