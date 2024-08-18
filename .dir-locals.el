(((js-mode js-ts-mode tsx-ts-mode typescript-ts-mode typescript-mode)
  . ((eglot-server-programs
      . ((((js-mode :language-id "javascript")
           (js-ts-mode :language-id "javascript")
           (tsx-ts-mode :language-id "typescriptreact")
           (typescript-ts-mode :language-id "typescript")
           (typescript-mode :language-id "typescript"))
          . ("typescript-language-server" "--stdio"
             :initializationOptions
             (:tsserver (:path "./server/node_modules/.bin/tsserver")))))))))
