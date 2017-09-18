// Loads a gist when element appended to DOM, including Prism syntax highlighting
// Ex. <div data-gist="1b70f6572277e5795fe0badee8759d64"></div>

;(function() {
  // Sequentially appends scripts to DOM
  var loadScripts = function(sources) {
    var src = sources[0]
    return src
      ? new Promise(function(resolve, reject) {
          var script = document.createElement("script")
          script.type = "text/javascript"
          script.src = src
          script.onload = function() {
            resolve(loadScripts(sources.slice(1)))
          }
          document.body.appendChild(script)
        })
      : Promise.resolve()
  }

  var embedGistContents = (function() {
    var gistCache = {}
    return function embedGistContents(id, embedder) {
      return (
        gistCache[id] ||
        (gistCache[id] = new Promise(function(resolve, reject) {
          fetch("https://api.github.com/gists/" + id)
            .then(function(response) {
              response.json().then(function(gist) {
                return resolve(
                  Object.keys(gist.files).map(function(file) {
                    var content = gist.files[file].content
                    var language =
                      gist.files[file].language &&
                      gist.files[file].language.toLowerCase()
                    return content && language
                      ? generateGistHTML(content, language)
                      : ""
                  })
                )
              })
            })
            .catch(function(e) {
              if (e) {
                reject("Error getting the gist " + id + ": " + e)
              }
            })
        }))
      )
    }
  })()

  function highlightCode(code, language) {
    var span = document.createElement("span")
    // reomoving problematic new line characters
    span.append(code)
    return Prism.highlight(span.innerHTML, Prism.languages[language])
  }

  function generateGistHTML(content, language) {
    var pre = document.createElement("pre")
    var code = document.createElement("code")
    pre.className = "language-" + language
    code.className = "language-" + language
    code.innerHTML = highlightCode(content, language)
    pre.append(code)
    return pre.outerHTML
  }

  function searchTree(node) {
    if (node.dataset && node.dataset["gist"]) {
      var gist = node.dataset["gist"]
      prismLoader.then(function() {
        embedGistContents(gist)
          .then(function(html) {
            node.innerHTML = html
          })
          .catch(console.log)
      })
    }
    if (node.children) {
      var l = node.children.length
      for (var i = 0; i < l; i++) {
        searchTree(node.children[i])
      }
    }
  }

  // observe DOM for changes
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      var l = mutation.addedNodes && mutation.addedNodes.length
      if (l) {
        for (var i = 0; i < l; i++) {
          window.test = mutation.addedNodes
          searchTree(mutation.addedNodes[i])
        }
      }
    })
  })
  observer.observe(document.body, { subtree: true, childList: true })

  // load prism.js
  var prismLoader = loadScripts([
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.7.0/prism.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.7.0/components/prism-java.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.7.0/components/prism-scala.min.js"
  ])
})()
