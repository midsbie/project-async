# Project Async

Project Async is a package designed to significantly enhance file completion performance within
Emacs, particularly for developers working with very large repositories. It integrates seamlessly
with Emacs' core `project` package by introducing asynchronous file completion to the
`project-find-file` command, ensuring that Emacs remains responsive even when dealing with vast
numbers of files.

## Features

- The package overrides the standard `project-find-file-in` function, providing file completions via
  a background server process, resulting in faster and more responsive file searching.

- The `project-async-mode` global minor mode allows for seamless integration without additional
  configuration after setup.

- Users can enable the minor mode and continue using `project-find-file` as usual, benefiting
  immediately from the asynchronous enhancements.

- Works with the user's `completion-styles`.

## Motivation

Project Async was born out of necessity when working with very large codebases. In repositories
containing over a million files, the standard `project-find-file` function in Emacs becomes
practically unusable due to performance issues. The sheer volume of files causes significant delays
and can freeze the Emacs interface, impacting productivity. This package introduces asynchronous
file completion, which solves this problem.

## Installation

### Server Setup

The server, written in TypeScript, needs to be built before use:

```
cd /path/to/project-async/server
npm install
npm run build
```

### Emacs Client

1. Install the project-async package:

    ```
    (add-to-list 'load-path "/path/to/project-async")
    (require 'project-async)
    ```

    or

    ```
    (load-library "/path/to/project-async")
    ```


2. Enable `project-async-mode` globally:

    ```
    (project-async-mode 1)
    ```

3. The `project-async-server-command` variable in Emacs expects a project-async-server binary to be
   available in `exec-path`. After building, ensure the server is executable or adjust the
   `project-async-server-command` variable to point to the correct path:

    ```
    (setq project-async-server-command '("/path/to/project-async/server/dist/project-async-server" "serve" "--stdio"))
    ```

## Usage

Once the mode is enabled, use `project-find-file` as usual. The package will automatically handle
file completions asynchronously, improving performance in large projects.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and
create. All contributions are greatly appreciated.

## License

Distributed under the MIT License. See LICENSE for more information.
