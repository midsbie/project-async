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

(defvar project-async-server-command '("project-async-server")
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
  "Start the Project Async server as a subprocess."
  (unless (and project-async-process (process-live-p project-async-process))
    (let ((buffer (get-buffer-create "*project-async-server*")))
      (with-current-buffer buffer
        (setq buffer-undo-list t
              buffer-read-only t)
        (setq-local auto-save-default nil)
        (setq-local truncate-lines t)
        )
      (setq project-async-process-buffer buffer
            project-async-process (apply #'start-process
                                         "project-async-server"
                                         buffer
                                         project-async-server-command))
      (set-process-query-on-exit-flag project-async-process nil))))

(defun project-async--stop-server ()
  "Stop the Project Async server process if it is running."
  (unwind-protect
      (when (and project-async-process (process-live-p project-async-process))
        (condition-case err
            (kill-process project-async-process)
          (error
           (message "Failed to stop Project Async server: %s" err))))
    (setq project-async-process nil)))

(defun project-async--send-request (input)
  "Send INPUT to the Project Async server process."
  (when (process-live-p project-async-process)
    (when project-async--request-in-progress
      (accept-process-output project-async-process))
    (setq project-async--request-in-progress t)
    (with-current-buffer project-async-process-buffer
      (let ((inhibit-read-only t))
        (erase-buffer)))
    (unwind-protect
        (progn
          (process-send-string project-async-process (concat input "\n"))
          (accept-process-output project-async-process project-async--process-output-timeout)
          (project-async--read-response))
      (setq project-async--request-in-progress nil))))

(defun project-async--read-response ()
  "Read and parse the JSON output from the Project Async server process buffer."
  (with-current-buffer project-async-process-buffer
    (let ((json-array-type 'list))
      (json-read-from-string (buffer-string)))))

(defun project-async--complete-file (input)
  "Generate completion candidates for INPUT using the Project Async server."
  (when-let ((dir (project-root (project-current))))
    (project-async--send-request (string-join
                                  (list "ls-files"
                                        (expand-file-name dir)
                                        input) " "))))

(defun project-async--override-project-find-file-in (suggested-filename dirs project &optional include-all)
  "Custom implementation replacing `project-find-file-in`."
  (let* ((project-read-file-name-function #'project-async--read-file)
         (completion-ignore-case read-file-name-completion-ignore-case)
         (default-directory (project-root project))
         (file (project--read-file-name
                project "Find file"
                #'project-async--completion-function nil
                'file-name-history
                suggested-filename)))
    (if (string= file "")
        (user-error "You didn't specify the file")
      (find-file file))))

(defun project-async--completion-function (str pred action)
  "Custom completion function that interacts with the Project Async server."
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
           (user-error "Failed to start Project Async server: %s" err))))
    (project-async--stop-server)
    (when (buffer-live-p project-async-process-buffer)
      (kill-buffer project-async-process-buffer))
    (advice-remove 'project-find-file-in #'project-async--override-project-find-file-in)))

(provide 'project-async)
;;; project-async.el ends here
