;;; project-async.el --- Asynchronous file completion for projects  -*- lexical-binding: t; -*-

;; Copyright (C) 2024  Miguel Guedes

;; Author: Miguel Guedes <miguel.a.guedes@gmail.com>
;; Keywords: tools

;; This program is free software; you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.

;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU General Public License for more details.

;; You should have received a copy of the GNU General Public License
;; along with this program.  If not, see <https://www.gnu.org/licenses/>.

;;; Commentary:

;; The `project-async' package is ideal for developers working with large
;; projects in Emacs who need a more responsive and efficient way to manage and
;; navigate files via the `project-find-file' command.
;;
;; It exposes the global minor mode `project-async-mode', which when enabled
;; runs a dedicated server process in the background to handle file completions
;; asynchronously, ensuring that the Emacs interface always remains responsive.

;; Key features include:
;;
;; * Asynchronous file completion
;;
;;   The module overrides the standard `project-find-file-in' function to
;;   provide file completions via an asynchronous process. This allows for
;;   quicker and more responsive file searching within large projects.

;; Example usage:
;;
;; To enable the mode, simply add the following to your Emacs configuration:
;;
;; (project-async-mode 1)
;;
;; Then, use `project-find-file' as usual, and enjoy faster, asynchronous file
;; searching.
;;
;; Disabling the mode restores standard functionality to `project-find-file'.

;;; Development:

;; * Function for easily triggering completions during development
;;
;; (defun complete-file-name ()
;;   (interactive)
;;   (completing-read "Enter file: "
;;                    #'project-async--completion-function))

;;; Code:

(require 'json)

(defvar project-async-server-command '("project-async-server" "serve" "--stdio")
  "The command to run the Project Async server.
This is a list where the first element is the path to the executable,
and subsequent elements are command-line arguments.")

(defvar project-async-process-buffer nil
  "Buffer to hold the output from the Project Async server process.")

(defvar project-async-process nil
  "Process handle for the Project Async server.")

(defvar project-async--last-completion-time 0
  "The last completion time, as returned by `float-time'.")

(defvar project-async--last-completion-table nil
  "The list of last completion results.")

(defvar project-async--request-in-progress nil
  "Flag to indicate if a request is in progress.")

(defconst project-async--process-output-timeout 2.5
  "Timeout in seconds to wait for a response from the Project Async server
process.")

(defun project-async--start-server ()
  "Start the Project Async server as a subprocess.

This function initiates the Project Async server process if it's not
already running.  It prepares the server buffer and starts the server
process using `project-async-server-command'.

The server process is stored in `project-async-process'."
  (unless (and project-async-process (process-live-p project-async-process))
    (with-current-buffer
        (setq project-async-process-buffer
              (get-buffer-create "*project-async-server*"))
      (add-hook 'kill-buffer-query-functions
                #'project-async--confirm-server-buffer-kill
                nil t)
      (erase-buffer)
      (setq buffer-undo-list t
            buffer-read-only t)
      (setq-local auto-save-default nil)
      (setq-local truncate-lines t)
      (setq project-async-process (apply #'start-process
                                         "project-async-server"
                                         (current-buffer)
                                         project-async-server-command))
      (set-process-query-on-exit-flag project-async-process nil))))

(defun project-async--stop-server ()
  "Stop the Project Async server process if it is running.

This function terminates the Project Async server process if it's active
and kills the associated process buffer if live.  It safely handles
potential errors during the termination process and resets
`project-async-process' and `project-async-process-buffer' to nil afterwards.

The function is idempotent and safe to call multiple times, even if the
server isn't running or has already been stopped."
  (when (and project-async-process (process-live-p project-async-process))
    (with-demoted-errors "Failed to stop Project Async server: %S"
      (kill-process project-async-process)))
  (project-async--kill-server-buffer)
  (setq project-async-process        nil
        project-async-process-buffer nil))

(defun project-async--server-live-p ()
  "Check if the Project Async server process is live.

This function determines whether the server process is currently running
and its associated buffer active.

Returns non-nil if the process and buffer are live."
  (and project-async-process (process-live-p project-async-process)
       project-async-process-buffer (buffer-live-p project-async-process-buffer)))

(defun project-async--kill-server-buffer ()
  "Safely kill the Project Async server process buffer.

This function checks if the `project-async-process-buffer' exists and is
still live, and if so, kills the buffer without triggering any
confirmation prompts."
  (when (and project-async-process-buffer (buffer-live-p project-async-process-buffer))
    (with-current-buffer project-async-process-buffer
      (let ((kill-buffer-query-functions nil))
        (kill-buffer project-async-process-buffer)))))

(defun project-async--confirm-server-buffer-kill ()
  "Ask for confirmation before killing the Project Async server buffer.
Skip confirmation if Emacs is quitting."
  (when (and (not (memq this-command '(save-buffers-kill-terminal save-buffers-kill-emacs)))
             (yes-or-no-p "The Project Async server buffer is being killed. This will disable async file completion. Continue?"))
    (project-async-mode -1)
    (message "Project Async mode disabled. Run project-async-mode to re-enable.")))

(defun project-async--send-request (input)
  "Send INPUT to the Project Async server process.

This function sends a request to the active server process and waits for
a response.  It handles concurrent requests, clears the buffer before
sending, and processes the server's output.  The function returns the
parsed response or nil if an error occurs."
  (when (project-async--server-live-p)
    (with-current-buffer project-async-process-buffer
      (while (and project-async--request-in-progress
                  (eq (point-min) (point-max)))
        (accept-process-output project-async-process project-async--process-output-timeout))
      (setq project-async--request-in-progress t)
      (let ((inhibit-read-only t))
        (erase-buffer)))
    (with-demoted-errors "Error during request to server: %S"
      (process-send-string project-async-process (concat input "\n"))
      (accept-process-output project-async-process project-async--process-output-timeout)
      (let ((result (project-async--read-response)))
        (setq project-async--request-in-progress nil)
        result))))

(defun project-async--read-response ()
  "Read and parse the JSON output from the Project Async server process buffer.

This function retrieves the content from the server buffer, trims
whitespace, and parses it as JSON if non-empty.  Returns the parsed JSON
data or nil if the buffer is empty."
  (with-current-buffer project-async-process-buffer
    (let ((json-array-type 'list)
          (content (string-trim (buffer-substring-no-properties (point-min) (point-max)))))
      (unless (string-empty-p content)
        (json-read-from-string content)))))

(defun project-async--complete-file (input)
  "Generate completion candidates for INPUT using the Project Async server.

This function sends a request to the Project Async server to complete file
paths based on the given INPUT.  It operates within the current project's
root directory.  The function returns the server's response, which should
be a list of completion candidates."
  (when-let ((dir (project-root (project-current))))
    (project-async--send-request (string-join
                                  (list "complete-file"
                                        (expand-file-name dir)
                                        input) " "))))

(defun project-async--override-project-find-file-in (suggested-filename dirs project &optional include-all)
  "Custom implementation replacing `project-find-file-in'.

This function provides an asynchronous file finding mechanism within a
project.  It uses `project-async--read-file' for reading file names and
`project-async--completion-function' for completion.  The function
respects the project root and the current `completion-ignore-case'
setting.  If a file is selected, it opens it using `find-file'; raises a
user error otherwise."
  (let* ((project-read-file-name-function #'project-async--read-file)
         (completion-ignore-case read-file-name-completion-ignore-case)
         (default-directory (project-root project))
         (file (project--read-file-name
                project "Find file"
                #'project-async--completion-function nil
                'file-name-history
                suggested-filename)))
    (if (string-empty-p file)
        (user-error "You didn't specify the file")
      (find-file file))))

(defun project-async--completion-function (str pred action)
  "Custom completion function for Project Async server interaction.

This function handles completion requests for project files.  It caches
results to improve performance on rapid subsequent calls.  Caching is
necessary because this completion function may be called multiple times
per query depending on the state of `completion-styles'.  If called
within 100ms of the last request, it uses cached candidates; otherwise,
fetches new completions from the server.  Cached candidates are stored
in `project-async--last-completion-table'.

When called with 'metadata action, it returns project-file category."
  (if (eq action 'metadata)
      (progn
        ;; Another possible value is '(metadata . ((category . file)))
        '(metadata . ((category . project-file)))
        )
    (cond
     ((< (- (float-time) project-async--last-completion-time) .1)
      (complete-with-action action (cadr project-async--last-completion-table) str pred)
      )
     (t
      (let* ((candidates (project-async--complete-file str))
             (result (complete-with-action action candidates str pred)))
        (setq project-async--last-completion-time (float-time)
              project-async--last-completion-table `(,str ,candidates))
        result)))))

(defun project-async--read-file (prompt
                                 get-collection &optional predicate
                                 hist mb-default)
  (project--completing-read-strict prompt
                                   get-collection
                                   predicate
                                   hist mb-default))

(define-minor-mode project-async-mode
  "Global minor mode for Project Async."
  :global t
  :lighter " Pasyn"
  :init-value nil
  :group 'project-async

  (if project-async-mode
      (progn
        (setq project-async--last-completion-time   0
              project-async--last-completion-table  nil
              project-async--request-in-progress    nil)
        (condition-case err
            (progn
              (project-async--start-server)
              (advice-add 'project-find-file-in :override #'project-async--override-project-find-file-in))
          (error
           (setq project-async-mode nil)
           (user-error "Failed to start Project Async server: %S" err))))
    (project-async--stop-server)
    (advice-remove 'project-find-file-in #'project-async--override-project-find-file-in)))

(provide 'project-async)
;;; project-async.el ends here
