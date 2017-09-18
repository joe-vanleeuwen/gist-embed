// Loads a gist when element appended to DOM, including Prism syntax highlighting
// Ex. <div data-gist="1b70f6572277e5795fe0badee8759d64" data-language="scala"></div>

;(function () {
  // Sequentially appends scripts to DOM
  var loadScripts = function (sources) {
    var src = sources[0]
    return src ? new Promise(function (resolve, reject) {
      var script = document.createElement("script")
      script.type = "text/javascript"
      script.src = src
      script.onload = function () {
        resolve(loadScripts(sources.slice(1)))
      }
      document.body.appendChild(script)
    }) : Promise.resolve()
  }

  var embedGistContents = (function () {
    var gistCache = {}
    return function embedGistContents(id, embedder) {
      return gistCache[id] || (gistCache[id] = new Promise(function (resolve, reject) {
        fetch("https://api.github.com/gists/" + id)
          .then(function(response) {
            response.json().then(function (gist) {
              var gistContents = [];
              for (file in gist.files) {
                var content = gist.files[file].content;
                if (content) {
                  gistContents.push(content);
                }
              }
              return resolve(embedder(gistContents))
            })
          })
          .catch(function (e) {
            if (e) {
              reject("Error getting the gist " + id + ": " + e)
            }
          })
      }))
    }
  })()

  function highlight(code, language) {
    var span = document.createElement("span")
    // reomoving problematic new line characters
    span.append(code)
    return Prism.highlight(span.innerHTML, Prism.languages[language])
  }

  function embedder(language) {
    return function(contents) {
      return contents.map(function (content) {
        var pre = document.createElement("pre")
        var code = document.createElement("code")
        pre.className = "language-" + language
        code.className = "language-" + language
        code.innerHTML = highlight(content, language)
        pre.append(code)
        return pre.outerHTML
      }).join("")
    };
  };

  function searchTree(node) {
    if (node.dataset && node.dataset["gist"]) {
      var gist = node.dataset["gist"]
      var language = node.dataset["language"]
      prismLoader.then(function() {
        embedGistContents(gist, embedder(language)).then(function (html) {
          node.innerHTML = html
        }).catch(console.log)
      })
    }
    if(node.children) {
      var l = node.children.length
      for (var i=0; i<l; i++) {
        searchTree(node.children[i])
      }
    }
   }

  // observe DOM for changes
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      var l = mutation.addedNodes && mutation.addedNodes.length
      if (l) {
        for (var i=0; i<l; i++) {
          window.test = mutation.addedNodes
          searchTree(mutation.addedNodes[i])
        }
      }
    })
  })
  observer.observe(document.body, {subtree: true, childList: true})

  // load prism.js
  var prismLoader = loadScripts([
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.7.0/prism.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.7.0/components/prism-java.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.7.0/components/prism-scala.min.js"
  ])
})()
