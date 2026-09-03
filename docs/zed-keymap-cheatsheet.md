# Zed Default Keymap — macOS Cheat Sheet

_Generated 2026-09-03 from [zed-industries/zed `assets/keymaps/default-macos.json`](https://github.com/zed-industries/zed/blob/main/assets/keymaps/default-macos.json) — the bindings behind `"base_keymap": "Zed"`._

## How to explore live in Zed

- `cmd-k cmd-s` — open the keymap editor (searchable list of every binding)
- `cmd-shift-p` — command palette: every action is listed there; type a verb to find what a binding does
- `zed: open default keymap` — the raw default bindings file, searchable
- Custom overrides go in `keymap.json` — they always win over this base map

## Sections

1. [Standard macOS bindings](#1-standard-macos-bindings) (332)
2. [Bindings from VS Code](#2-bindings-from-vs-code) (185)
3. [Bindings from Sublime Text](#3-bindings-from-sublime-text) (15)
4. [Bindings from Atom](#4-bindings-from-atom) (4)
5. [Bindings that should be unified with bindings for more general actions](#5-bindings-that-should-be-unified-with-bindings-for-more-general-actions) (20)
6. [Custom bindings](#6-custom-bindings) (376)

## 1. Standard macOS bindings

| Keystroke             | Action                                                                                    | Context                                     |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| `f4`                  | `debugger::Start`                                                                         |                                             |
| `home`                | `menu::SelectFirst`                                                                       |                                             |
| `shift-pageup`        | `menu::SelectFirst`                                                                       |                                             |
| `pageup`              | `menu::SelectFirst`                                                                       |                                             |
| `cmd-up`              | `menu::SelectFirst`                                                                       |                                             |
| `end`                 | `menu::SelectLast`                                                                        |                                             |
| `shift-pagedown`      | `menu::SelectLast`                                                                        |                                             |
| `pagedown`            | `menu::SelectLast`                                                                        |                                             |
| `cmd-down`            | `menu::SelectLast`                                                                        |                                             |
| `tab`                 | `menu::SelectNext`                                                                        |                                             |
| `ctrl-n`              | `menu::SelectNext`                                                                        |                                             |
| `down`                | `menu::SelectNext`                                                                        |                                             |
| `shift-tab`           | `menu::SelectPrevious`                                                                    |                                             |
| `ctrl-p`              | `menu::SelectPrevious`                                                                    |                                             |
| `up`                  | `menu::SelectPrevious`                                                                    |                                             |
| `enter`               | `menu::Confirm`                                                                           |                                             |
| `ctrl-enter`          | `menu::SecondaryConfirm`                                                                  |                                             |
| `cmd-enter`           | `menu::SecondaryConfirm`                                                                  |                                             |
| `cmd-escape`          | `menu::Cancel`                                                                            |                                             |
| `ctrl-escape`         | `menu::Cancel`                                                                            |                                             |
| `ctrl-c`              | `menu::Cancel`                                                                            |                                             |
| `escape`              | `menu::Cancel`                                                                            |                                             |
| `alt-shift-enter`     | `menu::Restart`                                                                           |                                             |
| `cmd-shift-w`         | `workspace::CloseWindow`                                                                  |                                             |
| `shift-escape`        | `workspace::ToggleZoom`                                                                   |                                             |
| `cmd-o`               | `workspace::Open`                                                                         |                                             |
| `cmd-=`               | `["zed::IncreaseBufferFontSize",{"persist":false}]`                                       |                                             |
| `cmd-+`               | `["zed::IncreaseBufferFontSize",{"persist":false}]`                                       |                                             |
| `cmd--`               | `["zed::DecreaseBufferFontSize",{"persist":false}]`                                       |                                             |
| `cmd-0`               | `["zed::ResetBufferFontSize",{"persist":false}]`                                          |                                             |
| `cmd-alt-,`           | `zed::OpenSettingsFile`                                                                   |                                             |
| `cmd-q`               | `zed::Quit`                                                                               |                                             |
| `cmd-h`               | `zed::Hide`                                                                               |                                             |
| `alt-cmd-h`           | `zed::HideOthers`                                                                         |                                             |
| `cmd-m`               | `zed::Minimize`                                                                           |                                             |
| `ctrl-cmd-z`          | `edit_prediction::RatePredictions`                                                        |                                             |
| `ctrl-cmd-i`          | `edit_prediction::ToggleMenu`                                                             |                                             |
| `ctrl-cmd-l`          | `lsp_tool::ToggleMenu`                                                                    |                                             |
| `ctrl-cmd-c`          | `editor::DisplayCursorNames`                                                              |                                             |
| `ctrl-cmd-s`          | `workspace::ToggleWorktreeSecurity`                                                       |                                             |
| `right`               | `menu::SelectChild`                                                                       | menu                                        |
| `left`                | `menu::SelectParent`                                                                      | menu                                        |
| `escape`              | `editor::Cancel`                                                                          | Editor                                      |
| `shift-backspace`     | `editor::Backspace`                                                                       | Editor                                      |
| `ctrl-h`              | `editor::Backspace`                                                                       | Editor                                      |
| `backspace`           | `editor::Backspace`                                                                       | Editor                                      |
| `ctrl-d`              | `editor::Delete`                                                                          | Editor                                      |
| `delete`              | `editor::Delete`                                                                          | Editor                                      |
| `tab`                 | `editor::Tab`                                                                             | Editor                                      |
| `shift-tab`           | `editor::Backtab`                                                                         | Editor                                      |
| `ctrl-t`              | `editor::Transpose`                                                                       | Editor                                      |
| `ctrl-k`              | `editor::KillRingCut`                                                                     | Editor                                      |
| `ctrl-y`              | `editor::KillRingYank`                                                                    | Editor                                      |
| `cmd-k cmd-q`         | `editor::Rewrap`                                                                          | Editor                                      |
| `cmd-k q`             | `editor::Rewrap`                                                                          | Editor                                      |
| `cmd-backspace`       | `editor::DeleteToBeginningOfLine`                                                         | Editor                                      |
| `cmd-delete`          | `editor::DeleteToEndOfLine`                                                               | Editor                                      |
| `alt-backspace`       | `["editor::DeleteToPreviousWordStart",{"ignore_newlines":false,"ignore_brackets":false}]` | Editor                                      |
| `ctrl-w`              | `["editor::DeleteToPreviousWordStart",{"ignore_newlines":false,"ignore_brackets":false}]` | Editor                                      |
| `alt-delete`          | `["editor::DeleteToNextWordEnd",{"ignore_newlines":false,"ignore_brackets":false}]`       | Editor                                      |
| `cmd-x`               | `editor::Cut`                                                                             | Editor                                      |
| `cmd-c`               | `editor::Copy`                                                                            | Editor                                      |
| `cmd-v`               | `editor::Paste`                                                                           | Editor                                      |
| `cmd-z`               | `editor::Undo`                                                                            | Editor                                      |
| `cmd-shift-z`         | `editor::Redo`                                                                            | Editor                                      |
| `up`                  | `editor::MoveUp`                                                                          | Editor                                      |
| `ctrl-up`             | `editor::MoveToStartOfParagraph`                                                          | Editor                                      |
| `pageup`              | `editor::MovePageUp`                                                                      | Editor                                      |
| `shift-pageup`        | `editor::SelectPageUp`                                                                    | Editor                                      |
| `cmd-pageup`          | `editor::PageUp`                                                                          | Editor                                      |
| `ctrl-pageup`         | `editor::LineUp`                                                                          | Editor                                      |
| `down`                | `editor::MoveDown`                                                                        | Editor                                      |
| `ctrl-down`           | `editor::MoveToEndOfParagraph`                                                            | Editor                                      |
| `pagedown`            | `editor::MovePageDown`                                                                    | Editor                                      |
| `shift-pagedown`      | `editor::SelectPageDown`                                                                  | Editor                                      |
| `cmd-pagedown`        | `editor::PageDown`                                                                        | Editor                                      |
| `ctrl-pagedown`       | `editor::LineDown`                                                                        | Editor                                      |
| `ctrl-p`              | `editor::MoveUp`                                                                          | Editor                                      |
| `ctrl-n`              | `editor::MoveDown`                                                                        | Editor                                      |
| `ctrl-b`              | `editor::MoveLeft`                                                                        | Editor                                      |
| `left`                | `editor::MoveLeft`                                                                        | Editor                                      |
| `ctrl-f`              | `editor::MoveRight`                                                                       | Editor                                      |
| `right`               | `editor::MoveRight`                                                                       | Editor                                      |
| `ctrl-l`              | `editor::ScrollCursorCenter`                                                              | Editor                                      |
| `alt-left`            | `editor::MoveToPreviousWordStart`                                                         | Editor                                      |
| `alt-right`           | `editor::MoveToNextWordEnd`                                                               | Editor                                      |
| `cmd-left`            | `["editor::MoveToBeginningOfLine",{"stop_at_soft_wraps":true,"stop_at_indent":true}]`     | Editor                                      |
| `ctrl-a`              | `["editor::MoveToBeginningOfLine",{"stop_at_soft_wraps":false,"stop_at_indent":true}]`    | Editor                                      |
| `home`                | `["editor::MoveToBeginningOfLine",{"stop_at_soft_wraps":true,"stop_at_indent":true}]`     | Editor                                      |
| `cmd-right`           | `["editor::MoveToEndOfLine",{"stop_at_soft_wraps":true}]`                                 | Editor                                      |
| `ctrl-e`              | `["editor::MoveToEndOfLine",{"stop_at_soft_wraps":false}]`                                | Editor                                      |
| `end`                 | `["editor::MoveToEndOfLine",{"stop_at_soft_wraps":true}]`                                 | Editor                                      |
| `cmd-up`              | `editor::MoveToBeginning`                                                                 | Editor                                      |
| `cmd-down`            | `editor::MoveToEnd`                                                                       | Editor                                      |
| `cmd-home`            | `editor::MoveToBeginning`                                                                 | Editor                                      | — Typed via `cmd-fn-left`  |
| `cmd-end`             | `editor::MoveToEnd`                                                                       | Editor                                      | — Typed via `cmd-fn-right` |
| `shift-up`            | `editor::SelectUp`                                                                        | Editor                                      |
| `ctrl-shift-p`        | `editor::SelectUp`                                                                        | Editor                                      |
| `shift-down`          | `editor::SelectDown`                                                                      | Editor                                      |
| `ctrl-shift-n`        | `editor::SelectDown`                                                                      | Editor                                      |
| `shift-left`          | `editor::SelectLeft`                                                                      | Editor                                      |
| `ctrl-shift-b`        | `editor::SelectLeft`                                                                      | Editor                                      |
| `shift-right`         | `editor::SelectRight`                                                                     | Editor                                      |
| `ctrl-shift-f`        | `editor::SelectRight`                                                                     | Editor                                      |
| `alt-shift-left`      | `editor::SelectToPreviousWordStart`                                                       | Editor                                      | — cursorWordLeftSelect     |
| `alt-shift-right`     | `editor::SelectToNextWordEnd`                                                             | Editor                                      | — cursorWordRightSelect    |
| `ctrl-shift-up`       | `editor::SelectToStartOfParagraph`                                                        | Editor                                      |
| `ctrl-shift-down`     | `editor::SelectToEndOfParagraph`                                                          | Editor                                      |
| `cmd-shift-up`        | `editor::SelectToBeginning`                                                               | Editor                                      |
| `cmd-shift-down`      | `editor::SelectToEnd`                                                                     | Editor                                      |
| `cmd-a`               | `editor::SelectAll`                                                                       | Editor                                      |
| `cmd-l`               | `editor::SelectLine`                                                                      | Editor                                      |
| `cmd-shift-i`         | `editor::Format`                                                                          | Editor                                      |
| `alt-shift-o`         | `editor::OrganizeImports`                                                                 | Editor                                      |
| `cmd-shift-left`      | `["editor::SelectToBeginningOfLine",{"stop_at_soft_wraps":true,"stop_at_indent":true}]`   | Editor                                      |
| `shift-home`          | `["editor::SelectToBeginningOfLine",{"stop_at_soft_wraps":true,"stop_at_indent":true}]`   | Editor                                      |
| `ctrl-shift-a`        | `["editor::SelectToBeginningOfLine",{"stop_at_soft_wraps":true,"stop_at_indent":true}]`   | Editor                                      |
| `cmd-shift-right`     | `["editor::SelectToEndOfLine",{"stop_at_soft_wraps":true}]`                               | Editor                                      |
| `shift-end`           | `["editor::SelectToEndOfLine",{"stop_at_soft_wraps":true}]`                               | Editor                                      |
| `ctrl-shift-e`        | `["editor::SelectToEndOfLine",{"stop_at_soft_wraps":true}]`                               | Editor                                      |
| `ctrl-v`              | `["editor::MovePageDown",{"center_cursor":true}]`                                         | Editor                                      |
| `ctrl-shift-v`        | `["editor::MovePageUp",{"center_cursor":true}]`                                           | Editor                                      |
| `ctrl-cmd-space`      | `editor::ShowCharacterPalette`                                                            | Editor                                      |
| `cmd-;`               | `editor::ToggleLineNumbers`                                                               | Editor                                      |
| `cmd-'`               | `editor::ToggleSelectedDiffHunks`                                                         | Editor                                      |
| `cmd-"`               | `editor::ExpandAllDiffHunks`                                                              | Editor                                      |
| `cmd-alt-g b`         | `git::Blame`                                                                              | Editor                                      |
| `cmd-alt-g m`         | `git::OpenModifiedFiles`                                                                  | Editor                                      |
| `cmd-alt-g r`         | `git::ReviewDiff`                                                                         | Editor                                      |
| `cmd-i`               | `editor::ShowSignatureHelp`                                                               | Editor                                      |
| `f9`                  | `editor::ToggleBreakpoint`                                                                | Editor                                      |
| `shift-f9`            | `editor::EditLogBreakpoint`                                                               | Editor                                      |
| `ctrl-f12`            | `editor::GoToDeclaration`                                                                 | Editor                                      |
| `alt-ctrl-f12`        | `editor::GoToDeclarationSplit`                                                            | Editor                                      |
| `ctrl-cmd-e`          | `editor::ToggleEditPrediction`                                                            | Editor                                      |
| `shift-enter`         | `editor::Newline`                                                                         | Editor && mode == full                      |
| `enter`               | `editor::Newline`                                                                         | Editor && mode == full                      |
| `cmd-enter`           | `editor::NewlineBelow`                                                                    | Editor && mode == full                      |
| `cmd-shift-enter`     | `editor::NewlineAbove`                                                                    | Editor && mode == full                      |
| `cmd-k z`             | `editor::ToggleSoftWrap`                                                                  | Editor && mode == full                      |
| `cmd-f`               | `buffer_search::Deploy`                                                                   | Editor && mode == full                      |
| `cmd-alt-l`           | `["buffer_search::Deploy",{"selection_search_enabled":true}]`                             | Editor && mode == full                      |
| `cmd-e`               | `buffer_search::UseSelectionForFind`                                                      | Editor && mode == full                      |
| `cmd->`               | `agent::AddSelectionToThread`                                                             | Editor && mode == full                      |
| `cmd-alt-e`           | `editor::SelectEnclosingSymbol`                                                           | Editor && mode == full                      |
| `alt-enter`           | `editor::OpenSelectionsInMultibuffer`                                                     | Editor && mode == full                      |
| `alt-cmd-f`           | `text_finder::Toggle`                                                                     | Editor && mode == full                      |
| `cmd-up`              | `editor::MoveToStartOfExcerpt`                                                            | Editor && multibuffer                       |
| `cmd-down`            | `editor::MoveToStartOfNextExcerpt`                                                        | Editor && multibuffer                       |
| `cmd-shift-up`        | `editor::SelectToStartOfExcerpt`                                                          | Editor && multibuffer                       |
| `cmd-shift-down`      | `editor::SelectToStartOfNextExcerpt`                                                      | Editor && multibuffer                       |
| `alt-tab`             | `editor::NextEditPrediction`                                                              | Editor && mode == full && edit_prediction   |
| `alt-shift-tab`       | `editor::PreviousEditPrediction`                                                          | Editor && mode == full && edit_prediction   |
| `alt-tab`             | `editor::ShowEditPrediction`                                                              | Editor && !edit_prediction                  |
| `ctrl-enter`          | `editor::Newline`                                                                         | Editor && mode == auto_height               |
| `shift-enter`         | `editor::Newline`                                                                         | Editor && mode == auto_height               |
| `ctrl-shift-enter`    | `editor::NewlineBelow`                                                                    | Editor && mode == auto_height               |
| `cmd-c`               | `markdown::Copy`                                                                          | Markdown                                    |
| `ctrl-shift-enter`    | `repl::Run`                                                                               | Editor && jupyter                           |
| `ctrl-alt-enter`      | `repl::RunInPlace`                                                                        | Editor && jupyter                           |
| `cmd-alt-z`           | `git::Restore`                                                                            | Editor && !agent_diff && !AgentPanel        |
| `cmd-alt-y`           | `git::ToggleStaged`                                                                       | Editor && !agent_diff && !AgentPanel        |
| `cmd-y`               | `git::StageAndNext`                                                                       | Editor && !agent_diff && !AgentPanel        |
| `cmd-shift-y`         | `git::UnstageAndNext`                                                                     | Editor && !agent_diff && !AgentPanel        |
| `cmd-y`               | `agent::Keep`                                                                             | AgentDiff                                   |
| `cmd-alt-y`           | `agent::Keep`                                                                             | AgentDiff                                   |
| `cmd-alt-z`           | `agent::Reject`                                                                           | AgentDiff                                   |
| `shift-alt-y`         | `agent::KeepAll`                                                                          | AgentDiff                                   |
| `shift-alt-z`         | `agent::RejectAll`                                                                        | AgentDiff                                   |
| `cmd-y`               | `agent::Keep`                                                                             | Editor && editor_agent_diff                 |
| `cmd-alt-y`           | `agent::Keep`                                                                             | Editor && editor_agent_diff                 |
| `cmd-alt-z`           | `agent::Reject`                                                                           | Editor && editor_agent_diff                 |
| `shift-alt-y`         | `agent::KeepAll`                                                                          | Editor && editor_agent_diff                 |
| `shift-alt-z`         | `agent::RejectAll`                                                                        | Editor && editor_agent_diff                 |
| `shift-ctrl-r`        | `agent::OpenAgentDiff`                                                                    | Editor && editor_agent_diff                 |
| `cmd-n`               | `agent::NewThread`                                                                        | AgentPanel                                  |
| `cmd-alt-c`           | `agent::OpenSettings`                                                                     | AgentPanel                                  |
| `cmd-alt-m`           | `agent::ToggleOptionsMenu`                                                                | AgentPanel                                  |
| `cmd-alt-shift-n`     | `agent::ToggleNewThreadMenu`                                                              | AgentPanel                                  |
| `cmd-shift-e`         | `project_panel::ToggleFocus`                                                              | AgentPanel                                  |
| `ctrl-tab`            | `agents_sidebar::ToggleThreadSwitcher`                                                    | AgentPanel                                  |
| `ctrl-shift-tab`      | `["agents_sidebar::ToggleThreadSwitcher",{"select_last":true}]`                           | AgentPanel                                  |
| `cmd-c`               | `markdown::CopyAsMarkdown`                                                                | AgentPanel > Markdown                       |
| `escape`              | `menu::Cancel`                                                                            | AgentFeedbackMessageEditor > Editor         |
| `enter`               | `menu::Confirm`                                                                           | AgentFeedbackMessageEditor > Editor         |
| `alt-enter`           | `editor::Newline`                                                                         | AgentFeedbackMessageEditor > Editor         |
| `cmd-enter`           | `menu::Confirm`                                                                           | AcpThread > ModeSelector                    |
| `cmd-n`               | `agent::NewThread`                                                                        | AcpThread                                   |
| `ctrl--`              | `pane::GoBack`                                                                            | AcpThread                                   |
| `cmd-alt-l`           | `agent::ManageSkills`                                                                     | AcpThread                                   |
| `cmd-alt-p`           | `agent::ManageProfiles`                                                                   | AcpThread                                   |
| `cmd-i`               | `agent::ToggleProfileSelector`                                                            | AcpThread                                   |
| `shift-tab`           | `agent::CycleModeSelector`                                                                | AcpThread                                   |
| `cmd-alt-/`           | `agent::ToggleModelSelector`                                                              | AcpThread                                   |
| `alt-tab`             | `agent::CycleFavoriteModels`                                                              | AcpThread                                   |
| `shift-alt-escape`    | `agent::ExpandMessageEditor`                                                              | AcpThread                                   |
| `cmd->`               | `agent::AddSelectionToThread`                                                             | AcpThread                                   |
| `cmd-alt-y`           | `agent::AllowAlways`                                                                      | AcpThread                                   |
| `cmd-y`               | `agent::AllowOnce`                                                                        | AcpThread                                   |
| `cmd-alt-a`           | `agent::OpenPermissionDropdown`                                                           | AcpThread                                   |
| `cmd-alt-z`           | `agent::RejectOnce`                                                                       | AcpThread                                   |
| `pageup`              | `agent::ScrollOutputPageUp`                                                               | AcpThread                                   |
| `pagedown`            | `agent::ScrollOutputPageDown`                                                             | AcpThread                                   |
| `home`                | `agent::ScrollOutputToTop`                                                                | AcpThread                                   |
| `end`                 | `agent::ScrollOutputToBottom`                                                             | AcpThread                                   |
| `up`                  | `agent::ScrollOutputLineUp`                                                               | AcpThread                                   |
| `down`                | `agent::ScrollOutputLineDown`                                                             | AcpThread                                   |
| `shift-pageup`        | `agent::ScrollOutputToPreviousMessage`                                                    | AcpThread                                   |
| `shift-pagedown`      | `agent::ScrollOutputToNextMessage`                                                        | AcpThread                                   |
| `ctrl-pageup`         | `agent::ScrollOutputPageUp`                                                               | AcpThread                                   |
| `ctrl-pagedown`       | `agent::ScrollOutputPageDown`                                                             | AcpThread                                   |
| `ctrl-home`           | `agent::ScrollOutputToTop`                                                                | AcpThread                                   |
| `ctrl-end`            | `agent::ScrollOutputToBottom`                                                             | AcpThread                                   |
| `ctrl-alt-up`         | `agent::ScrollOutputLineUp`                                                               | AcpThread                                   |
| `ctrl-alt-down`       | `agent::ScrollOutputLineDown`                                                             | AcpThread                                   |
| `ctrl-alt-pageup`     | `agent::ScrollOutputToPreviousMessage`                                                    | AcpThread                                   |
| `ctrl-alt-pagedown`   | `agent::ScrollOutputToNextMessage`                                                        | AcpThread                                   |
| `cmd-f`               | `agent::ToggleSearch`                                                                     | AcpThread                                   |
| `cmd-g`               | `agent::SelectNextThreadMatch`                                                            | AcpThread                                   |
| `cmd-shift-g`         | `agent::SelectPreviousThreadMatch`                                                        | AcpThread                                   |
| `alt-cmd-c`           | `search::ToggleCaseSensitive`                                                             | AcpThread                                   |
| `alt-cmd-w`           | `search::ToggleWholeWord`                                                                 | AcpThread                                   |
| `alt-cmd-x`           | `search::ToggleRegex`                                                                     | AcpThread                                   |
| `escape`              | `agent::DismissThreadSearch`                                                              | AcpThreadSearchBar                          |
| `enter`               | `agent::SelectNextThreadMatch`                                                            | AcpThreadSearchBar                          |
| `shift-enter`         | `agent::SelectPreviousThreadMatch`                                                        | AcpThreadSearchBar                          |
| `cmd-f`               | `search::FocusSearch`                                                                     | AcpThreadSearchBar                          |
| `shift-enter`         | `agent::SelectPreviousThreadMatch`                                                        | AcpThreadSearchBar > Editor                 |
| `cmd-f`               | `agent::ToggleSearch`                                                                     | AcpThread > Editor                          |
| `ctrl-pageup`         | `agent::ScrollOutputPageUp`                                                               | AcpThread > Editor                          |
| `ctrl-pagedown`       | `agent::ScrollOutputPageDown`                                                             | AcpThread > Editor                          |
| `ctrl-home`           | `agent::ScrollOutputToTop`                                                                | AcpThread > Editor                          |
| `ctrl-end`            | `agent::ScrollOutputToBottom`                                                             | AcpThread > Editor                          |
| `ctrl-alt-up`         | `agent::ScrollOutputLineUp`                                                               | AcpThread > Editor                          |
| `ctrl-alt-down`       | `agent::ScrollOutputLineDown`                                                             | AcpThread > Editor                          |
| `ctrl-alt-pageup`     | `agent::ScrollOutputToPreviousMessage`                                                    | AcpThread > Editor                          |
| `ctrl-alt-pagedown`   | `agent::ScrollOutputToNextMessage`                                                        | AcpThread > Editor                          |
| `shift-ctrl-r`        | `agent::OpenAgentDiff`                                                                    | AcpThread > Editor                          |
| `shift-ctrl-d`        | `git::Diff`                                                                               | AcpThread > Editor                          |
| `shift-alt-y`         | `agent::KeepAll`                                                                          | AcpThread > Editor                          |
| `shift-alt-z`         | `agent::RejectAll`                                                                        | AcpThread > Editor                          |
| `shift-alt-u`         | `agent::UndoLastReject`                                                                   | AcpThread > Editor                          |
| `cmd-enter`           | `agent::ChatWithFollow`                                                                   | AcpThread > Editor                          |
| `cmd-shift-enter`     | `agent::SendImmediately`                                                                  | AcpThread > Editor                          |
| `cmd-shift-alt-enter` | `agent::SendNextQueuedMessage`                                                            | AcpThread > Editor                          |
| `cmd-shift-backspace` | `agent::RemoveFirstQueuedMessage`                                                         | AcpThread > Editor                          |
| `cmd-ctrl-e`          | `agent::EditFirstQueuedMessage`                                                           | AcpThread > Editor                          |
| `cmd-ctrl-s`          | `agent::ToggleSteerFirstQueuedMessage`                                                    | AcpThread > Editor                          |
| `cmd-alt-backspace`   | `agent::ClearMessageQueue`                                                                | AcpThread > Editor                          |
| `cmd-shift-v`         | `agent::PasteRaw`                                                                         | AcpThread > Editor                          |
| `cmd-i`               | `agent::ToggleProfileSelector`                                                            | AcpThread > Editor                          |
| `shift-tab`           | `agent::CycleModeSelector`                                                                | AcpThread > Editor                          |
| `alt-tab`             | `agent::CycleFavoriteModels`                                                              | AcpThread > Editor                          |
| `ctrl-;`              | `agent::OpenAddContextMenu`                                                               | AcpThread > Editor                          |
| `cmd-alt-k`           | `agent::ToggleThinkingMode`                                                               | AcpThread > Editor                          |
| `cmd-alt-'`           | `agent::ToggleThinkingEffortMenu`                                                         | AcpThread > Editor                          |
| `ctrl-'`              | `agent::CycleThinkingEffort`                                                              | AcpThread > Editor                          |
| `cmd-alt-.`           | `agent::ToggleFastMode`                                                                   | AcpThread > Editor                          |
| `pageup`              | `agent::ScrollOutputPageUp`                                                               | AcpThread > Editor && start_of_input        |
| `ctrl-pageup`         | `agent::ScrollOutputPageUp`                                                               | AcpThread > Editor && start_of_input        |
| `ctrl-home`           | `agent::ScrollOutputToTop`                                                                | AcpThread > Editor && start_of_input        |
| `pagedown`            | `agent::ScrollOutputPageDown`                                                             | AcpThread > Editor && end_of_input          |
| `ctrl-pagedown`       | `agent::ScrollOutputPageDown`                                                             | AcpThread > Editor && end_of_input          |
| `ctrl-end`            | `agent::ScrollOutputToBottom`                                                             | AcpThread > Editor && end_of_input          |
| `alt-enter`           | `editor::OpenExcerpts`                                                                    | AcpThread > Editor && mode == full          |
| `enter`               | `agent::Chat`                                                                             | AcpThread > Editor && !use_modifier_to_send |
| `cmd-enter`           | `agent::Chat`                                                                             | AcpThread > Editor && use_modifier_to_send  |
| `enter`               | `editor::Newline`                                                                         | AcpThread > Editor && use_modifier_to_send  |
| `ctrl--`              | `pane::GoBack`                                                                            | ThreadHistory                               |
| `shift-backspace`     | `agent::RemoveSelectedThread`                                                             | ThreadHistory > Editor                      |
| `backspace`           | `agent::ArchiveSelectedThread`                                                            | ThreadsArchiveView                          |
| `escape`              | `buffer_search::Dismiss`                                                                  | BufferSearchBar                             |
| `tab`                 | `buffer_search::FocusEditor`                                                              | BufferSearchBar                             |
| `enter`               | `search::SelectNextMatch`                                                                 | BufferSearchBar                             |
| `shift-enter`         | `search::SelectPreviousMatch`                                                             | BufferSearchBar                             |
| `cmd-shift-enter`     | `editor::ToggleFoldAll`                                                                   | BufferSearchBar                             |
| `alt-enter`           | `search::SelectAllMatches`                                                                | BufferSearchBar                             |
| `cmd-f`               | `search::FocusSearch`                                                                     | BufferSearchBar                             |
| `cmd-alt-l`           | `search::ToggleSelection`                                                                 | BufferSearchBar                             |
| `cmd-shift-o`         | `outline::Toggle`                                                                         | BufferSearchBar                             |
| `alt-cmd-f`           | `text_finder::Toggle`                                                                     | BufferSearchBar                             |
| `enter`               | `search::ReplaceNext`                                                                     | BufferSearchBar && in_replace > Editor      |
| `cmd-enter`           | `search::ReplaceAll`                                                                      | BufferSearchBar && in_replace > Editor      |
| `ctrl-enter`          | `editor::Newline`                                                                         | BufferSearchBar && !in_replace > Editor     |
| `shift-enter`         | `search::SelectPreviousMatch`                                                             | BufferSearchBar && !in_replace > Editor     |
| `up`                  | `search::PreviousHistoryQuery`                                                            | BufferSearchBar && !in_replace > Editor     |
| `down`                | `search::NextHistoryQuery`                                                                | BufferSearchBar && !in_replace > Editor     |
| `ctrl-enter`          | `editor::Newline`                                                                         | BufferSearchBar \|\| ProjectSearchBar       |
| `escape`              | `project_search::ToggleFocus`                                                             | ProjectSearchBar                            |
| `cmd-shift-j`         | `project_search::ToggleFilters`                                                           | ProjectSearchBar                            |
| `cmd-shift-enter`     | `project_search::ToggleAllSearchResults`                                                  | ProjectSearchBar                            |
| `cmd-shift-f`         | `search::FocusSearch`                                                                     | ProjectSearchBar                            |
| `cmd-shift-h`         | `search::ToggleReplace`                                                                   | ProjectSearchBar                            |
| `alt-cmd-g`           | `search::ToggleRegex`                                                                     | ProjectSearchBar                            |
| `alt-cmd-x`           | `search::ToggleRegex`                                                                     | ProjectSearchBar                            |
| `alt-cmd-f`           | `project_search::OpenTextFinder`                                                          | ProjectSearchBar                            |
| `up`                  | `search::PreviousHistoryQuery`                                                            | ProjectSearchBar > Editor                   |
| `down`                | `search::NextHistoryQuery`                                                                | ProjectSearchBar > Editor                   |
| `enter`               | `search::ReplaceNext`                                                                     | ProjectSearchBar && in_replace > Editor     |
| `cmd-enter`           | `search::ReplaceAll`                                                                      | ProjectSearchBar && in_replace > Editor     |
| `ctrl-enter`          | `editor::Newline`                                                                         | ProjectSearchBar && !in_replace > Editor    |
| `escape`              | `project_search::ToggleFocus`                                                             | ProjectSearchView                           |
| `cmd-shift-j`         | `project_search::ToggleFilters`                                                           | ProjectSearchView                           |
| `cmd-shift-enter`     | `project_search::ToggleAllSearchResults`                                                  | ProjectSearchView                           |
| `cmd-shift-h`         | `search::ToggleReplace`                                                                   | ProjectSearchView                           |
| `alt-cmd-g`           | `search::ToggleRegex`                                                                     | ProjectSearchView                           |
| `alt-cmd-x`           | `search::ToggleRegex`                                                                     | ProjectSearchView                           |
| `alt-cmd-f`           | `project_search::OpenTextFinder`                                                          | ProjectSearchView                           |
| `alt-cmd-left`        | `pane::ActivatePreviousItem`                                                              | Pane                                        |
| `cmd-{`               | `pane::ActivatePreviousItem`                                                              | Pane                                        |
| `alt-cmd-right`       | `pane::ActivateNextItem`                                                                  | Pane                                        |
| `cmd-}`               | `pane::ActivateNextItem`                                                                  | Pane                                        |
| `ctrl-shift-pageup`   | `pane::SwapItemLeft`                                                                      | Pane                                        |
| `ctrl-shift-pagedown` | `pane::SwapItemRight`                                                                     | Pane                                        |
| `cmd-w`               | `["pane::CloseActiveItem",{"close_pinned":false}]`                                        | Pane                                        |
| `alt-cmd-t`           | `["pane::CloseOtherItems",{"close_pinned":false}]`                                        | Pane                                        |
| `ctrl-alt-cmd-w`      | `workspace::CloseInactiveTabsAndPanes`                                                    | Pane                                        |
| `cmd-k e`             | `["pane::CloseItemsToTheLeft",{"close_pinned":false}]`                                    | Pane                                        |
| `cmd-k t`             | `["pane::CloseItemsToTheRight",{"close_pinned":false}]`                                   | Pane                                        |
| `cmd-k u`             | `["pane::CloseCleanItems",{"close_pinned":false}]`                                        | Pane                                        |
| `cmd-k w`             | `["pane::CloseAllItems",{"close_pinned":false}]`                                          | Pane                                        |
| `cmd-k cmd-w`         | `workspace::CloseAllItemsAndPanes`                                                        | Pane                                        |
| `cmd-f`               | `project_search::ToggleFocus`                                                             | Pane                                        |
| `cmd-g`               | `search::SelectNextMatch`                                                                 | Pane                                        |
| `cmd-shift-g`         | `search::SelectPreviousMatch`                                                             | Pane                                        |
| `cmd-shift-h`         | `search::ToggleReplace`                                                                   | Pane                                        |
| `cmd-alt-l`           | `search::ToggleSelection`                                                                 | Pane                                        |
| `alt-enter`           | `search::SelectAllMatches`                                                                | Pane                                        |
| `alt-cmd-c`           | `search::ToggleCaseSensitive`                                                             | Pane                                        |
| `alt-cmd-w`           | `search::ToggleWholeWord`                                                                 | Pane                                        |
| `alt-cmd-x`           | `search::ToggleRegex`                                                                     | Pane                                        |
| `cmd-k shift-enter`   | `pane::TogglePinTab`                                                                      | Pane                                        |

## 2. Bindings from VS Code

| Keystroke                 | Action                                                                         | Context                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `cmd-[`                   | `editor::Outdent`                                                              | Editor                                                                                         |
| `cmd-]`                   | `editor::Indent`                                                               | Editor                                                                                         |
| `cmd-ctrl-p`              | `["editor::AddSelectionAbove",{"skip_soft_wrap":false}]`                       | Editor                                                                                         | — Insert cursor above                                                 |
| `cmd-alt-up`              | `["editor::AddSelectionAbove",{"skip_soft_wrap":true}]`                        | Editor                                                                                         |
| `cmd-ctrl-n`              | `["editor::AddSelectionBelow",{"skip_soft_wrap":false}]`                       | Editor                                                                                         | — Insert cursor below                                                 |
| `cmd-alt-down`            | `["editor::AddSelectionBelow",{"skip_soft_wrap":true}]`                        | Editor                                                                                         |
| `cmd-shift-k`             | `editor::DeleteLine`                                                           | Editor                                                                                         |
| `alt-up`                  | `editor::MoveLineUp`                                                           | Editor                                                                                         |
| `alt-down`                | `editor::MoveLineDown`                                                         | Editor                                                                                         |
| `alt-shift-up`            | `editor::DuplicateLineUp`                                                      | Editor                                                                                         |
| `alt-shift-down`          | `editor::DuplicateLineDown`                                                    | Editor                                                                                         |
| `cmd-ctrl-left`           | `editor::SelectSmallerSyntaxNode`                                              | Editor                                                                                         | — Shrink selection                                                    |
| `cmd-ctrl-right`          | `editor::SelectLargerSyntaxNode`                                               | Editor                                                                                         | — Expand selection                                                    |
| `cmd-ctrl-up`             | `editor::SelectPreviousSyntaxNode`                                             | Editor                                                                                         | — Move selection up                                                   |
| `ctrl-shift-right`        | `editor::SelectLargerSyntaxNode`                                               | Editor                                                                                         | — Expand selection (VSCode version)                                   |
| `ctrl-shift-left`         | `editor::SelectSmallerSyntaxNode`                                              | Editor                                                                                         | — Shrink selection (VSCode version)                                   |
| `cmd-ctrl-down`           | `editor::SelectNextSyntaxNode`                                                 | Editor                                                                                         | — Move selection down                                                 |
| `cmd-d`                   | `["editor::SelectNext",{"replace_newest":false}]`                              | Editor                                                                                         | — editor.action.addSelectionToNextFindMatch / find_under_expand       |
| `cmd-shift-l`             | `editor::SelectAllMatches`                                                     | Editor                                                                                         | — Select all occurrences of current selection                         |
| `cmd-f2`                  | `editor::SelectAllMatches`                                                     | Editor                                                                                         | — Select all occurrences of current word                              |
| `cmd-k cmd-d`             | `["editor::SelectNext",{"replace_newest":true}]`                               | Editor                                                                                         | — editor.action.moveSelectionToNextFindMatch / find_under_expand_skip |
| `ctrl-cmd-d`              | `["editor::SelectPrevious",{"replace_newest":false}]`                          | Editor                                                                                         | — editor.action.addSelectionToPreviousFindMatch                       |
| `cmd-k ctrl-cmd-d`        | `["editor::SelectPrevious",{"replace_newest":true}]`                           | Editor                                                                                         | — editor.action.moveSelectionToPreviousFindMatch                      |
| `cmd-k cmd-i`             | `editor::Hover`                                                                | Editor                                                                                         |
| `cmd-k cmd-b`             | `editor::BlameHover`                                                           | Editor                                                                                         |
| `cmd-/`                   | `["editor::ToggleComments",{"advance_downwards":false}]`                       | Editor                                                                                         |
| `cmd-k cmd-/`             | `editor::ToggleBlockComments`                                                  | Editor                                                                                         |
| `shift-alt-a`             | `editor::ToggleBlockComments`                                                  | Editor                                                                                         |
| `f8`                      | `["editor::GoToDiagnostic",{"severity":{"min":"hint","max":"error"}}]`         | Editor                                                                                         |
| `shift-f8`                | `["editor::GoToPreviousDiagnostic",{"severity":{"min":"hint","max":"error"}}]` | Editor                                                                                         |
| `f2`                      | `editor::Rename`                                                               | Editor                                                                                         |
| `f12`                     | `editor::GoToDefinition`                                                       | Editor                                                                                         |
| `alt-f12`                 | `editor::GoToDefinitionSplit`                                                  | Editor                                                                                         |
| `cmd-f12`                 | `editor::GoToTypeDefinition`                                                   | Editor                                                                                         |
| `shift-f12`               | `editor::GoToImplementation`                                                   | Editor                                                                                         |
| `alt-cmd-f12`             | `editor::GoToTypeDefinitionSplit`                                              | Editor                                                                                         |
| `alt-shift-f12`           | `editor::FindAllReferences`                                                    | Editor                                                                                         |
| `cmd-k cmd-h`             | `call_hierarchy::ShowIncomingCalls`                                            | Editor                                                                                         |
| `cmd-\|`                  | `editor::MoveToEnclosingBracket`                                               | Editor                                                                                         |
| `ctrl-m`                  | `editor::MoveToEnclosingBracket`                                               | Editor                                                                                         | — From Jetbrains                                                      |
| `alt-cmd-[`               | `editor::Fold`                                                                 | Editor                                                                                         |
| `alt-cmd-]`               | `editor::UnfoldLines`                                                          | Editor                                                                                         |
| `cmd-k cmd-l`             | `editor::ToggleFold`                                                           | Editor                                                                                         |
| `cmd-k cmd-[`             | `editor::FoldRecursive`                                                        | Editor                                                                                         |
| `cmd-k cmd-]`             | `editor::UnfoldRecursive`                                                      | Editor                                                                                         |
| `cmd-k cmd-1`             | `editor::FoldAtLevel_1`                                                        | Editor                                                                                         |
| `cmd-k cmd-2`             | `editor::FoldAtLevel_2`                                                        | Editor                                                                                         |
| `cmd-k cmd-3`             | `editor::FoldAtLevel_3`                                                        | Editor                                                                                         |
| `cmd-k cmd-4`             | `editor::FoldAtLevel_4`                                                        | Editor                                                                                         |
| `cmd-k cmd-5`             | `editor::FoldAtLevel_5`                                                        | Editor                                                                                         |
| `cmd-k cmd-6`             | `editor::FoldAtLevel_6`                                                        | Editor                                                                                         |
| `cmd-k cmd-7`             | `editor::FoldAtLevel_7`                                                        | Editor                                                                                         |
| `cmd-k cmd-8`             | `editor::FoldAtLevel_8`                                                        | Editor                                                                                         |
| `cmd-k cmd-9`             | `editor::FoldAtLevel_9`                                                        | Editor                                                                                         |
| `cmd-k cmd-0`             | `editor::FoldAll`                                                              | Editor                                                                                         |
| `cmd-k cmd-j`             | `editor::UnfoldAll`                                                            | Editor                                                                                         |
| `ctrl-space`              | `editor::ShowCompletions`                                                      | Editor                                                                                         |
| `ctrl-shift-space`        | `editor::ShowWordCompletions`                                                  | Editor                                                                                         |
| `cmd-.`                   | `editor::ToggleCodeActions`                                                    | Editor                                                                                         |
| `cmd-k r`                 | `editor::RevealInFileManager`                                                  | Editor                                                                                         |
| `cmd-k p`                 | `editor::CopyPath`                                                             | Editor                                                                                         |
| `cmd-\`                   | `pane::SplitRight`                                                             | Editor                                                                                         |
| `cmd-k v`                 | `markdown::OpenPreviewToTheSide`                                               | Editor && extension == md                                                                      |
| `cmd-shift-v`             | `markdown::OpenPreview`                                                        | Editor && extension == md                                                                      |
| `cmd-k v`                 | `svg::OpenPreviewToTheSide`                                                    | Editor && extension == svg                                                                     |
| `cmd-shift-v`             | `svg::OpenPreview`                                                             | Editor && extension == svg                                                                     |
| `cmd-k v`                 | `tabular_data::OpenPreviewToTheSide`                                           | Editor && (extension == csv \|\| extension == tsv \|\| extension == ssv \|\| extension == psv) |
| `cmd-shift-v`             | `tabular_data::OpenPreview`                                                    | Editor && (extension == csv \|\| extension == tsv \|\| extension == ssv \|\| extension == psv) |
| `cmd-shift-o`             | `outline::Toggle`                                                              | Editor && mode == full                                                                         |
| `ctrl-g`                  | `go_to_line::Toggle`                                                           | Editor && mode == full                                                                         |
| `cmd-shift-backspace`     | `editor::GoToPreviousChange`                                                   | Editor && mode == full                                                                         |
| `cmd-shift-alt-backspace` | `editor::GoToNextChange`                                                       | Editor && mode == full                                                                         |
| `ctrl-1`                  | `["pane::ActivateItem",0]`                                                     | Pane                                                                                           |
| `ctrl-2`                  | `["pane::ActivateItem",1]`                                                     | Pane                                                                                           |
| `ctrl-3`                  | `["pane::ActivateItem",2]`                                                     | Pane                                                                                           |
| `ctrl-4`                  | `["pane::ActivateItem",3]`                                                     | Pane                                                                                           |
| `ctrl-5`                  | `["pane::ActivateItem",4]`                                                     | Pane                                                                                           |
| `ctrl-6`                  | `["pane::ActivateItem",5]`                                                     | Pane                                                                                           |
| `ctrl-7`                  | `["pane::ActivateItem",6]`                                                     | Pane                                                                                           |
| `ctrl-8`                  | `["pane::ActivateItem",7]`                                                     | Pane                                                                                           |
| `ctrl-9`                  | `["pane::ActivateItem",8]`                                                     | Pane                                                                                           |
| `ctrl-0`                  | `pane::ActivateLastItem`                                                       | Pane                                                                                           |
| `ctrl--`                  | `pane::GoBack`                                                                 | Pane                                                                                           |
| `ctrl-_`                  | `pane::GoForward`                                                              | Pane                                                                                           |
| `cmd-shift-f`             | `pane::DeploySearch`                                                           | Pane                                                                                           |
| `f6`                      | `workspace::FocusNextPart`                                                     | Workspace                                                                                      |
| `shift-f6`                | `workspace::FocusPreviousPart`                                                 | Workspace                                                                                      |
| `cmd-f6`                  | `workspace::FocusNextPart`                                                     | Workspace                                                                                      |
| `fn-f`                    | `zed::ToggleFullScreen`                                                        | Workspace                                                                                      |
| `ctrl-cmd-f`              | `zed::ToggleFullScreen`                                                        | Workspace                                                                                      |
| `alt-cmd-o`               | `projects::OpenRecent`                                                         | Workspace                                                                                      |
| `ctrl-r`                  | `projects::OpenRecent`                                                         | Workspace                                                                                      |
| `ctrl-cmd-o`              | `["projects::OpenRemote",{"from_existing_connection":false}]`                  | Workspace                                                                                      |
| `ctrl-cmd-shift-o`        | `["projects::OpenRemote",{"from_existing_connection":true}]`                   | Workspace                                                                                      |
| `cmd-ctrl-b`              | `branches::OpenRecent`                                                         | Workspace                                                                                      |
| `cmd-ctrl-w`              | `git::Worktree`                                                                | Workspace                                                                                      |
| `ctrl-~`                  | `workspace::NewTerminal`                                                       | Workspace                                                                                      |
| `cmd-s`                   | `workspace::Save`                                                              | Workspace                                                                                      |
| `cmd-k s`                 | `workspace::SaveWithoutFormat`                                                 | Workspace                                                                                      |
| `alt-shift-enter`         | `toast::RunAction`                                                             | Workspace                                                                                      |
| `cmd-shift-s`             | `workspace::SaveAs`                                                            | Workspace                                                                                      |
| `cmd-shift-n`             | `workspace::NewWindow`                                                         | Workspace                                                                                      |
| `ctrl-``                  | `terminal_panel::Toggle`                                                       | Workspace                                                                                      |
| `cmd-1`                   | `["workspace::ActivatePane",0]`                                                | Workspace                                                                                      |
| `cmd-2`                   | `["workspace::ActivatePane",1]`                                                | Workspace                                                                                      |
| `cmd-3`                   | `["workspace::ActivatePane",2]`                                                | Workspace                                                                                      |
| `cmd-4`                   | `["workspace::ActivatePane",3]`                                                | Workspace                                                                                      |
| `cmd-5`                   | `["workspace::ActivatePane",4]`                                                | Workspace                                                                                      |
| `cmd-6`                   | `["workspace::ActivatePane",5]`                                                | Workspace                                                                                      |
| `cmd-7`                   | `["workspace::ActivatePane",6]`                                                | Workspace                                                                                      |
| `cmd-8`                   | `["workspace::ActivatePane",7]`                                                | Workspace                                                                                      |
| `cmd-9`                   | `["workspace::ActivatePane",8]`                                                | Workspace                                                                                      |
| `cmd-b`                   | `workspace::ToggleLeftDock`                                                    | Workspace                                                                                      |
| `cmd-alt-b`               | `workspace::ToggleRightDock`                                                   | Workspace                                                                                      |
| `cmd-r`                   | `workspace::ToggleRightDock`                                                   | Workspace                                                                                      |
| `cmd-j`                   | `workspace::ToggleBottomDock`                                                  | Workspace                                                                                      |
| `cmd-alt-j`               | `multi_workspace::ToggleWorkspaceSidebar`                                      | Workspace                                                                                      |
| `cmd-alt-;`               | `multi_workspace::FocusWorkspaceSidebar`                                       | Workspace                                                                                      |
| `alt-cmd-y`               | `workspace::ToggleAllDocks`                                                    | Workspace                                                                                      |
| `ctrl-alt-0`              | `workspace::ResetActiveDockSize`                                               | Workspace                                                                                      |
| `ctrl-alt--`              | `["workspace::DecreaseActiveDockSize",{"px":0}]`                               | Workspace                                                                                      |
| `ctrl-alt-=`              | `["workspace::IncreaseActiveDockSize",{"px":0}]`                               | Workspace                                                                                      |
| `ctrl-alt-)`              | `workspace::ResetOpenDocksSize`                                                | Workspace                                                                                      |
| `ctrl-alt-_`              | `["workspace::DecreaseOpenDocksSize",{"px":0}]`                                | Workspace                                                                                      |
| `ctrl-alt-+`              | `["workspace::IncreaseOpenDocksSize",{"px":0}]`                                | Workspace                                                                                      |
| `cmd-shift-f`             | `pane::DeploySearch`                                                           | Workspace                                                                                      |
| `cmd-shift-h`             | `["pane::DeploySearch",{"replace_enabled":true}]`                              | Workspace                                                                                      |
| `cmd-shift-t`             | `pane::ReopenClosedItem`                                                       | Workspace                                                                                      |
| `cmd-k cmd-p`             | `workspace::ReopenLastPicker`                                                  | Workspace                                                                                      |
| `cmd-k cmd-s`             | `zed::OpenKeymap`                                                              | Workspace                                                                                      |
| `cmd-k cmd-t`             | `theme_selector::Toggle`                                                       | Workspace                                                                                      |
| `cmd-k cmd-shift-t`       | `theme::ToggleMode`                                                            | Workspace                                                                                      |
| `ctrl-alt-cmd-p`          | `settings_profile_selector::Toggle`                                            | Workspace                                                                                      |
| `cmd-t`                   | `project_symbols::Toggle`                                                      | Workspace                                                                                      |
| `cmd-p`                   | `file_finder::Toggle`                                                          | Workspace                                                                                      |
| `ctrl-shift-tab`          | `["tab_switcher::Toggle",{"select_last":true}]`                                | Workspace                                                                                      |
| `ctrl-tab`                | `tab_switcher::Toggle`                                                         | Workspace                                                                                      |
| `cmd-shift-p`             | `command_palette::Toggle`                                                      | Workspace                                                                                      |
| `cmd-shift-m`             | `diagnostics::Deploy`                                                          | Workspace                                                                                      |
| `cmd-shift-e`             | `project_panel::ToggleFocus`                                                   | Workspace                                                                                      |
| `cmd-shift-b`             | `outline_panel::ToggleFocus`                                                   | Workspace                                                                                      |
| `ctrl-shift-g`            | `git_panel::ToggleFocus`                                                       | Workspace                                                                                      |
| `cmd-shift-d`             | `debug_panel::ToggleFocus`                                                     | Workspace                                                                                      |
| `cmd-?`                   | `agent::ToggleFocus`                                                           | Workspace                                                                                      |
| `cmd-alt-s`               | `workspace::SaveAll`                                                           | Workspace                                                                                      |
| `cmd-k n`                 | `encoding_selector::Toggle`                                                    | Workspace                                                                                      |
| `cmd-k m`                 | `language_selector::Toggle`                                                    | Workspace                                                                                      |
| `cmd-k cmd-m`             | `toolchain::AddToolchain`                                                      | Workspace                                                                                      |
| `escape`                  | `workspace::Unfollow`                                                          | Workspace                                                                                      |
| `cmd-k cmd-left`          | `workspace::ActivatePaneLeft`                                                  | Workspace                                                                                      |
| `cmd-k cmd-right`         | `workspace::ActivatePaneRight`                                                 | Workspace                                                                                      |
| `cmd-k cmd-up`            | `workspace::ActivatePaneUp`                                                    | Workspace                                                                                      |
| `cmd-k cmd-down`          | `workspace::ActivatePaneDown`                                                  | Workspace                                                                                      |
| `cmd-k shift-left`        | `workspace::SwapPaneLeft`                                                      | Workspace                                                                                      |
| `cmd-k shift-right`       | `workspace::SwapPaneRight`                                                     | Workspace                                                                                      |
| `cmd-k shift-up`          | `workspace::SwapPaneUp`                                                        | Workspace                                                                                      |
| `cmd-k shift-down`        | `workspace::SwapPaneDown`                                                      | Workspace                                                                                      |
| `cmd-shift-x`             | `zed::Extensions`                                                              | Workspace                                                                                      |
| `f5`                      | `debugger::Rerun`                                                              | Workspace                                                                                      |
| `cmd-w`                   | `workspace::CloseActiveDock`                                                   | Workspace                                                                                      |
| `cmd-n`                   | `workspace::NewFile`                                                           | Workspace && !Terminal                                                                         |
| `cmd-shift-r`             | `task::Spawn`                                                                  | Workspace && !Terminal                                                                         |
| `cmd-alt-r`               | `["task::Rerun",{"reevaluate_context":false}]`                                 | Workspace && !Terminal                                                                         |
| `ctrl-alt-shift-r`        | `["task::Spawn",{"reveal_target":"center"}]`                                   | Workspace && !Terminal                                                                         |
| `cmd-n`                   | `agents_sidebar::NewThreadInGroup`                                             | ThreadsSidebar                                                                                 |
| `left`                    | `menu::SelectParent`                                                           | ThreadsSidebar                                                                                 |
| `right`                   | `menu::SelectChild`                                                            | ThreadsSidebar                                                                                 |
| `enter`                   | `menu::Confirm`                                                                | ThreadsSidebar                                                                                 |
| `cmd-f`                   | `agents_sidebar::FocusSidebarFilter`                                           | ThreadsSidebar                                                                                 |
| `cmd-g`                   | `agents_sidebar::ToggleThreadHistory`                                          | ThreadsSidebar                                                                                 |
| `shift-backspace`         | `agent::ArchiveSelectedThread`                                                 | ThreadsSidebar                                                                                 |
| `cmd-shift-backspace`     | `agent::RemoveSelectedThread`                                                  | ThreadsSidebar                                                                                 |
| `ctrl-tab`                | `agents_sidebar::ToggleThreadSwitcher`                                         | ThreadsSidebar                                                                                 |
| `ctrl-shift-tab`          | `["agents_sidebar::ToggleThreadSwitcher",{"select_last":true}]`                | ThreadsSidebar                                                                                 |
| `space`                   | `menu::Confirm`                                                                | ThreadsSidebar && not_searching                                                                |
| `shift-r`                 | `agent::RenameSelectedThread`                                                  | ThreadsSidebar && not_searching                                                                |
| `ctrl-tab`                | `agents_sidebar::ToggleThreadSwitcher`                                         | ThreadSwitcher                                                                                 |
| `ctrl-shift-tab`          | `["agents_sidebar::ToggleThreadSwitcher",{"select_last":true}]`                | ThreadSwitcher                                                                                 |
| `f5`                      | `None`                                                                         | Workspace && debugger_running                                                                  |
| `f5`                      | `debugger::Continue`                                                           | Workspace && debugger_stopped                                                                  |
| `f7`                      | `debugger::StepOver`                                                           | Workspace && debugger_stopped                                                                  |
| `f10`                     | `debugger::StepOver`                                                           | Workspace && debugger_stopped                                                                  |
| `f11`                     | `debugger::StepInto`                                                           | Workspace && debugger_stopped                                                                  |
| `ctrl-f11`                | `debugger::StepInto`                                                           | Workspace && debugger_stopped                                                                  |
| `shift-f11`               | `debugger::StepOut`                                                            | Workspace && debugger_stopped                                                                  |

## 3. Bindings from Sublime Text

| Keystroke              | Action                                 | Context |
| ---------------------- | -------------------------------------- | ------- |
| `cmd-u`                | `editor::UndoSelection`                | Editor  |
| `cmd-shift-u`          | `editor::RedoSelection`                | Editor  |
| `ctrl-j`               | `editor::JoinLines`                    | Editor  |
| `ctrl-alt-backspace`   | `editor::DeleteToPreviousSubwordStart` | Editor  |
| `ctrl-alt-h`           | `editor::DeleteToPreviousSubwordStart` | Editor  |
| `ctrl-alt-delete`      | `editor::DeleteToNextSubwordEnd`       | Editor  |
| `ctrl-alt-d`           | `editor::DeleteToNextSubwordEnd`       | Editor  |
| `ctrl-alt-left`        | `editor::MoveToPreviousSubwordStart`   | Editor  |
| `ctrl-alt-b`           | `editor::MoveToPreviousSubwordStart`   | Editor  |
| `ctrl-alt-right`       | `editor::MoveToNextSubwordEnd`         | Editor  |
| `ctrl-alt-f`           | `editor::MoveToNextSubwordEnd`         | Editor  |
| `ctrl-alt-shift-left`  | `editor::SelectToPreviousSubwordStart` | Editor  |
| `ctrl-alt-shift-b`     | `editor::SelectToPreviousSubwordStart` | Editor  |
| `ctrl-alt-shift-right` | `editor::SelectToNextSubwordEnd`       | Editor  |
| `ctrl-alt-shift-f`     | `editor::SelectToNextSubwordEnd`       | Editor  |

## 4. Bindings from Atom

| Keystroke     | Action             | Context |
| ------------- | ------------------ | ------- |
| `cmd-k up`    | `pane::SplitUp`    | Pane    |
| `cmd-k down`  | `pane::SplitDown`  | Pane    |
| `cmd-k left`  | `pane::SplitLeft`  | Pane    |
| `cmd-k right` | `pane::SplitRight` | Pane    |

## 5. Bindings that should be unified with bindings for more general actions

| Keystroke        | Action                                 | Context                                                                            |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `enter`          | `editor::ConfirmRename`                | Editor && renaming                                                                 |
| `enter`          | `menu::Confirm`                        | Editor && inline_input                                                             |
| `enter`          | `editor::ConfirmCompletion`            | Editor && showing_completions                                                      |
| `shift-enter`    | `editor::ConfirmCompletionReplace`     | Editor && showing_completions                                                      |
| `tab`            | `editor::ComposeCompletion`            | Editor && showing_completions                                                      |
| `tab`            | `editor::NextSnippetTabstop`           | Editor && in_snippet && has_next_tabstop && !showing_completions                   |
| `shift-tab`      | `editor::PreviousSnippetTabstop`       | Editor && in_snippet && has_previous_tabstop && !showing_completions               |
| `alt-tab`        | `editor::AcceptEditPrediction`         | Editor && edit_prediction                                                          |
| `ctrl-cmd-right` | `editor::AcceptNextWordEditPrediction` | Editor && edit_prediction                                                          |
| `ctrl-cmd-down`  | `editor::AcceptNextLineEditPrediction` | Editor && edit_prediction                                                          |
| `tab`            | `editor::AcceptEditPrediction`         | Editor && edit_prediction && edit_prediction_mode == eager && !showing_completions |
| `enter`          | `editor::ConfirmCodeAction`            | Editor && showing_code_actions                                                     |
| `up`             | `editor::ContextMenuPrevious`          | Editor && (showing_code_actions \|\| showing_completions)                          |
| `ctrl-p`         | `editor::ContextMenuPrevious`          | Editor && (showing_code_actions \|\| showing_completions)                          |
| `down`           | `editor::ContextMenuNext`              | Editor && (showing_code_actions \|\| showing_completions)                          |
| `ctrl-n`         | `editor::ContextMenuNext`              | Editor && (showing_code_actions \|\| showing_completions)                          |
| `pageup`         | `editor::ContextMenuFirst`             | Editor && (showing_code_actions \|\| showing_completions)                          |
| `pagedown`       | `editor::ContextMenuLast`              | Editor && (showing_code_actions \|\| showing_completions)                          |
| `up`             | `editor::SignatureHelpPrevious`        | Editor && showing_signature_help && !showing_completions                           |
| `down`           | `editor::SignatureHelpNext`            | Editor && showing_signature_help && !showing_completions                           |

## 6. Custom bindings

| Keystroke                 | Action                                            | Context                                                                                    |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ctrl-alt-cmd-f`          | `workspace::FollowNextCollaborator`               |                                                                                            |
| `cmd-shift-c`             | `collab_panel::ToggleFocus`                       |                                                                                            |
| `cmd-alt-i`               | `dev::ToggleInspector`                            |                                                                                            |
| `ctrl-alt-shift-p`        | `dev::ToggleFpsOverlay`                           |                                                                                            |
| `ctrl-alt-shift-o`        | `dev::ResetFrameOverlayStats`                     |                                                                                            |
| `alt-enter`               | `editor::OpenExcerpts`                            | !AcpThread > Editor && mode == full                                                        |
| `shift-enter`             | `editor::ExpandExcerpts`                          | !AcpThread > Editor && mode == full                                                        |
| `cmd-alt-enter`           | `editor::OpenExcerptsSplit`                       | !AcpThread > Editor && mode == full                                                        |
| `cmd-shift-e`             | `pane::RevealInProjectPanel`                      | !AcpThread > Editor && mode == full                                                        |
| `cmd-f8`                  | `editor::GoToHunk`                                | !AcpThread > Editor && mode == full                                                        |
| `cmd-shift-f8`            | `editor::GoToPreviousHunk`                        | !AcpThread > Editor && mode == full                                                        |
| `ctrl-enter`              | `assistant::InlineAssist`                         | !AcpThread > Editor && mode == full                                                        |
| `ctrl-:`                  | `editor::ToggleInlayHints`                        | !AcpThread > Editor && mode == full                                                        |
| `cmd-alt-/`               | `agent::ToggleModelSelector`                      | InlineAssistant > Editor                                                                   |
| `alt-tab`                 | `agent::CycleFavoriteModels`                      | InlineAssistant > Editor                                                                   |
| `ctrl-[`                  | `agent::CyclePreviousInlineAssist`                | InlineAssistant > Editor                                                                   |
| `ctrl-]`                  | `agent::CycleNextInlineAssist`                    | InlineAssistant > Editor                                                                   |
| `cmd-shift-enter`         | `inline_assistant::ThumbsUpResult`                | InlineAssistant > Editor                                                                   |
| `cmd-shift-backspace`     | `inline_assistant::ThumbsDownResult`              | InlineAssistant > Editor                                                                   |
| `left`                    | `menu::SelectPrevious`                            | Prompt                                                                                     |
| `right`                   | `menu::SelectNext`                                | Prompt                                                                                     |
| `h`                       | `menu::SelectPrevious`                            | Prompt                                                                                     |
| `l`                       | `menu::SelectNext`                                | Prompt                                                                                     |
| `cmd-enter`               | `project_search::SearchInNew`                     | ProjectSearchBar && !in_replace                                                            |
| `escape`                  | `menu::Cancel`                                    | OutlinePanel && not_editing                                                                |
| `left`                    | `outline_panel::CollapseSelectedEntry`            | OutlinePanel && not_editing                                                                |
| `right`                   | `outline_panel::ExpandSelectedEntry`              | OutlinePanel && not_editing                                                                |
| `cmd-alt-c`               | `workspace::CopyPath`                             | OutlinePanel && not_editing                                                                |
| `alt-cmd-shift-c`         | `workspace::CopyRelativePath`                     | OutlinePanel && not_editing                                                                |
| `alt-cmd-r`               | `outline_panel::RevealInFileManager`              | OutlinePanel && not_editing                                                                |
| `space`                   | `outline_panel::OpenSelectedEntry`                | OutlinePanel && not_editing                                                                |
| `shift-down`              | `menu::SelectNext`                                | OutlinePanel && not_editing                                                                |
| `shift-up`                | `menu::SelectPrevious`                            | OutlinePanel && not_editing                                                                |
| `alt-enter`               | `editor::OpenExcerpts`                            | OutlinePanel && not_editing                                                                |
| `cmd-alt-enter`           | `editor::OpenExcerptsSplit`                       | OutlinePanel && not_editing                                                                |
| `left`                    | `project_panel::CollapseSelectedEntry`            | ProjectPanel                                                                               |
| `cmd-left`                | `project_panel::CollapseAllEntries`               | ProjectPanel                                                                               |
| `right`                   | `project_panel::ExpandSelectedEntry`              | ProjectPanel                                                                               |
| `cmd-right`               | `project_panel::ExpandAllEntries`                 | ProjectPanel                                                                               |
| `cmd-n`                   | `project_panel::NewFile`                          | ProjectPanel                                                                               |
| `cmd-d`                   | `project_panel::Duplicate`                        | ProjectPanel                                                                               |
| `alt-cmd-n`               | `project_panel::NewDirectory`                     | ProjectPanel                                                                               |
| `cmd-x`                   | `project_panel::Cut`                              | ProjectPanel                                                                               |
| `cmd-c`                   | `project_panel::Copy`                             | ProjectPanel                                                                               |
| `cmd-v`                   | `project_panel::Paste`                            | ProjectPanel                                                                               |
| `cmd-alt-c`               | `workspace::CopyPath`                             | ProjectPanel                                                                               |
| `alt-cmd-shift-c`         | `workspace::CopyRelativePath`                     | ProjectPanel                                                                               |
| `cmd-z`                   | `project_panel::Undo`                             | ProjectPanel                                                                               |
| `cmd-shift-z`             | `project_panel::Redo`                             | ProjectPanel                                                                               |
| `enter`                   | `project_panel::Rename`                           | ProjectPanel                                                                               |
| `f2`                      | `project_panel::Rename`                           | ProjectPanel                                                                               |
| `backspace`               | `["project_panel::Trash",{"skip_prompt":false}]`  | ProjectPanel                                                                               |
| `delete`                  | `["project_panel::Trash",{"skip_prompt":false}]`  | ProjectPanel                                                                               |
| `cmd-backspace`           | `["project_panel::Trash",{"skip_prompt":true}]`   | ProjectPanel                                                                               |
| `cmd-delete`              | `["project_panel::Delete",{"skip_prompt":false}]` | ProjectPanel                                                                               |
| `alt-cmd-r`               | `project_panel::RevealInFileManager`              | ProjectPanel                                                                               |
| `ctrl-shift-enter`        | `workspace::OpenWithSystem`                       | ProjectPanel                                                                               |
| `alt-d`                   | `project_panel::CompareMarkedFiles`               | ProjectPanel                                                                               |
| `cmd-alt-backspace`       | `["project_panel::Delete",{"skip_prompt":false}]` | ProjectPanel                                                                               |
| `cmd-alt-shift-f`         | `project_panel::NewSearchInDirectory`             | ProjectPanel                                                                               |
| `shift-down`              | `menu::SelectNext`                                | ProjectPanel                                                                               |
| `shift-up`                | `menu::SelectPrevious`                            | ProjectPanel                                                                               |
| `escape`                  | `menu::Cancel`                                    | ProjectPanel                                                                               |
| `space`                   | `project_panel::Open`                             | ProjectPanel && not_editing                                                                |
| `left`                    | `variable_list::CollapseSelectedEntry`            | VariableList                                                                               |
| `right`                   | `variable_list::ExpandSelectedEntry`              | VariableList                                                                               |
| `enter`                   | `variable_list::EditVariable`                     | VariableList                                                                               |
| `cmd-c`                   | `variable_list::CopyVariableValue`                | VariableList                                                                               |
| `cmd-alt-c`               | `variable_list::CopyVariableName`                 | VariableList                                                                               |
| `delete`                  | `variable_list::RemoveWatch`                      | VariableList                                                                               |
| `backspace`               | `variable_list::RemoveWatch`                      | VariableList                                                                               |
| `alt-enter`               | `variable_list::AddWatch`                         | VariableList                                                                               |
| `cmd-1`                   | `git_panel::ActivateChangesTab`                   | GitPanel                                                                                   |
| `cmd-2`                   | `git_panel::ActivateHistoryTab`                   | GitPanel                                                                                   |
| `up`                      | `menu::SelectPrevious`                            | GitPanel && (ChangesList \|\| HistoryList) && !GitBranchSelector && !GitRepositorySelector |
| `down`                    | `menu::SelectNext`                                | GitPanel && (ChangesList \|\| HistoryList) && !GitBranchSelector && !GitRepositorySelector |
| `shift-up`                | `menu::SelectPrevious`                            | GitPanel && (ChangesList \|\| HistoryList) && !GitBranchSelector && !GitRepositorySelector |
| `shift-down`              | `menu::SelectNext`                                | GitPanel && (ChangesList \|\| HistoryList) && !GitBranchSelector && !GitRepositorySelector |
| `enter`                   | `menu::Confirm`                                   | GitPanel && (ChangesList \|\| HistoryList) && !GitBranchSelector && !GitRepositorySelector |
| `escape`                  | `menu::Cancel`                                    | GitPanel && (ChangesList \|\| HistoryList) && !GitBranchSelector && !GitRepositorySelector |
| `up`                      | `git_panel::PreviousEntry`                        | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `down`                    | `git_panel::NextEntry`                            | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-up`                  | `git_panel::FirstEntry`                           | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-down`                | `git_panel::LastEntry`                            | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `left`                    | `git_panel::CollapseSelectedEntry`                | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `right`                   | `git_panel::ExpandSelectedEntry`                  | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-alt-y`               | `git::ToggleStaged`                               | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `space`                   | `git::ToggleStaged`                               | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `shift-space`             | `git::StageRange`                                 | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-y`                   | `git::StageFile`                                  | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-shift-y`             | `git::UnstageFile`                                | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-alt-c`               | `workspace::CopyPath`                             | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `alt-cmd-shift-c`         | `workspace::CopyRelativePath`                     | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `alt-down`                | `git_panel::FocusEditor`                          | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `tab`                     | `git_panel::FocusEditor`                          | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `shift-tab`               | `git_panel::FocusEditor`                          | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `backspace`               | `["git::RestoreFile",{"skip_prompt":false}]`      | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `delete`                  | `["git::RestoreFile",{"skip_prompt":false}]`      | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-backspace`           | `["git::RestoreFile",{"skip_prompt":true}]`       | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `cmd-delete`              | `["git::RestoreFile",{"skip_prompt":true}]`       | GitPanel && ChangesList && !GitBranchSelector && !GitRepositorySelector                    |
| `escape`                  | `git::Cancel`                                     | GitPanel && CommitEditor                                                                   |
| `cmd-enter`               | `git::Commit`                                     | GitDiff > Editor                                                                           |
| `cmd-shift-enter`         | `git::Amend`                                      | GitDiff > Editor                                                                           |
| `cmd-ctrl-y`              | `git::StageAll`                                   | GitDiff > Editor                                                                           |
| `cmd-ctrl-shift-y`        | `git::UnstageAll`                                 | GitDiff > Editor                                                                           |
| `cmd-alt-z`               | `git::RestoreAndNext`                             | GitDiff > Editor                                                                           |
| `enter`                   | `editor::Newline`                                 | CommitEditor > Editor                                                                      |
| `cmd-enter`               | `git::Commit`                                     | CommitEditor > Editor                                                                      |
| `cmd-shift-enter`         | `git::Amend`                                      | CommitEditor > Editor                                                                      |
| `tab`                     | `git_panel::FocusChanges`                         | CommitEditor > Editor                                                                      |
| `shift-tab`               | `git_panel::FocusChanges`                         | CommitEditor > Editor                                                                      |
| `alt-up`                  | `git_panel::FocusChanges`                         | CommitEditor > Editor                                                                      |
| `shift-escape`            | `git::ExpandCommitEditor`                         | CommitEditor > Editor                                                                      |
| `alt-shift-escape`        | `git::ToggleFillCommitEditor`                     | CommitEditor > Editor                                                                      |
| `alt-tab`                 | `git::GenerateCommitMessage`                      | CommitEditor > Editor                                                                      |
| `ctrl-g ctrl-g`           | `git::Fetch`                                      | GitPanel                                                                                   |
| `ctrl-g up`               | `git::Push`                                       | GitPanel                                                                                   |
| `ctrl-g down`             | `git::Pull`                                       | GitPanel                                                                                   |
| `ctrl-g shift-down`       | `git::PullRebase`                                 | GitPanel                                                                                   |
| `ctrl-g shift-up`         | `git::ForcePush`                                  | GitPanel                                                                                   |
| `ctrl-g d`                | `git::Diff`                                       | GitPanel                                                                                   |
| `ctrl-g backspace`        | `git::RestoreTrackedFiles`                        | GitPanel                                                                                   |
| `ctrl-g shift-backspace`  | `git::TrashUntrackedFiles`                        | GitPanel                                                                                   |
| `cmd-ctrl-y`              | `git::StageAll`                                   | GitPanel                                                                                   |
| `cmd-ctrl-shift-y`        | `git::UnstageAll`                                 | GitPanel                                                                                   |
| `cmd-enter`               | `git::Commit`                                     | GitPanel                                                                                   |
| `cmd-shift-enter`         | `git::Amend`                                      | GitPanel                                                                                   |
| `enter`                   | `editor::Newline`                                 | GitCommit > Editor && mode == auto_height                                                  |
| `escape`                  | `menu::Cancel`                                    | GitCommit > Editor && mode == auto_height                                                  |
| `cmd-enter`               | `git::Commit`                                     | GitCommit > Editor && mode == auto_height                                                  |
| `cmd-shift-enter`         | `git::Amend`                                      | GitCommit > Editor && mode == auto_height                                                  |
| `alt-tab`                 | `git::GenerateCommitMessage`                      | GitCommit > Editor && mode == auto_height                                                  |
| `f6`                      | `debugger::Pause`                                 | Workspace && debugger_session                                                              |
| `shift-f5`                | `debugger::Stop`                                  | Workspace && debugger_session                                                              |
| `shift-cmd-f5`            | `debugger::RerunSession`                          | Workspace && debugger_session                                                              |
| `cmd-t`                   | `debugger::ToggleThreadPicker`                    | DebugPanel                                                                                 |
| `cmd-i`                   | `debugger::ToggleSessionPicker`                   | DebugPanel                                                                                 |
| `shift-alt-escape`        | `debugger::ToggleExpandItem`                      | DebugPanel                                                                                 |
| `space`                   | `debugger::ToggleEnableBreakpoint`                | BreakpointList                                                                             |
| `backspace`               | `debugger::UnsetBreakpoint`                       | BreakpointList                                                                             |
| `left`                    | `debugger::PreviousBreakpointProperty`            | BreakpointList                                                                             |
| `right`                   | `debugger::NextBreakpointProperty`                | BreakpointList                                                                             |
| `ctrl-backspace`          | `collab_panel::Remove`                            | CollabPanel && not_editing                                                                 |
| `space`                   | `menu::Confirm`                                   | CollabPanel && not_editing                                                                 |
| `alt-up`                  | `collab_panel::MoveChannelUp`                     | CollabPanel                                                                                |
| `alt-down`                | `collab_panel::MoveChannelDown`                   | CollabPanel                                                                                |
| `alt-enter`               | `collab_panel::OpenSelectedChannelNotes`          | CollabPanel                                                                                |
| `shift-enter`             | `collab_panel::ToggleSelectedChannelFavorite`     | CollabPanel                                                                                |
| `space`                   | `collab_panel::InsertSpace`                       | (CollabPanel && editing) > Editor                                                          |
| `tab`                     | `channel_modal::ToggleMode`                       | ChannelModal                                                                               |
| `cmd-k cmd-h`             | `call_hierarchy::ToggleDirection`                 | CallHierarchyPicker > Picker > Editor                                                      |
| `cmd-k right`             | `menu::SelectChild`                               | CallHierarchyPicker > Picker > Editor                                                      |
| `cmd-k left`              | `menu::SelectParent`                              | CallHierarchyPicker > Picker > Editor                                                      |
| `escape`                  | `menu::Cancel`                                    | Picker > Editor                                                                            |
| `up`                      | `menu::SelectPrevious`                            | Picker > Editor                                                                            |
| `down`                    | `menu::SelectNext`                                | Picker > Editor                                                                            |
| `tab`                     | `picker::ConfirmCompletion`                       | Picker > Editor                                                                            |
| `alt-enter`               | `["picker::ConfirmInput",{"secondary":false}]`    | Picker > Editor                                                                            |
| `cmd-alt-enter`           | `["picker::ConfirmInput",{"secondary":true}]`     | Picker > Editor                                                                            |
| `tab`                     | `channel_modal::ToggleMode`                       | ChannelModal > Picker > Editor                                                             |
| `cmd-shift-a`             | `toolchain::AddToolchain`                         | ToolchainSelector                                                                          |
| `cmd-shift-i`             | `search::ToggleIncludeIgnored`                    | FileFinder \|\| (FileFinder > Picker > Editor)                                             |
| `cmd-k`                   | `recent_projects::ToggleActionsMenu`              | RecentProjects \|\| (RecentProjects > Picker > Editor)                                     |
| `cmd-shift-a`             | `workspace::AddFolderToProject`                   | RecentProjects \|\| (RecentProjects > Picker > Editor)                                     |
| `shift-backspace`         | `recent_projects::RemoveSelected`                 | RecentProjects \|\| (RecentProjects > Picker > Editor)                                     |
| `cmd-shift-enter`         | `recent_projects::AddToWorkspace`                 | RecentProjects \|\| (RecentProjects > Picker > Editor)                                     |
| `ctrl-shift-tab`          | `menu::SelectPrevious`                            | TabSwitcher                                                                                |
| `ctrl-up`                 | `menu::SelectPrevious`                            | TabSwitcher                                                                                |
| `ctrl-down`               | `menu::SelectNext`                                | TabSwitcher                                                                                |
| `ctrl-backspace`          | `tab_switcher::CloseSelectedItem`                 | TabSwitcher                                                                                |
| `ctrl-shift-backspace`    | `stash_picker::DropStashItem`                     | StashList \|\| (StashList > Picker > Editor)                                               |
| `ctrl-shift-v`            | `stash_picker::ShowStashItem`                     | StashList \|\| (StashList > Picker > Editor)                                               |
| `ctrl-cmd-space`          | `terminal::ShowCharacterPalette`                  | Terminal                                                                                   |
| `cmd-c`                   | `terminal::Copy`                                  | Terminal                                                                                   |
| `cmd-v`                   | `terminal::Paste`                                 | Terminal                                                                                   |
| `ctrl-cmd-v`              | `terminal::PasteText`                             | Terminal                                                                                   |
| `cmd-f`                   | `buffer_search::Deploy`                           | Terminal                                                                                   |
| `cmd-a`                   | `editor::SelectAll`                               | Terminal                                                                                   |
| `cmd-k`                   | `terminal::Clear`                                 | Terminal                                                                                   |
| `cmd-n`                   | `workspace::NewTerminal`                          | Terminal                                                                                   |
| `ctrl-enter`              | `assistant::InlineAssist`                         | Terminal                                                                                   |
| `ctrl-_`                  | `None`                                            | Terminal                                                                                   | — emacs undo                 |
| `cmd-backspace`           | `["terminal::SendKeystroke","ctrl-u"]`            | Terminal                                                                                   |
| `alt-delete`              | `["terminal::SendText","\u001bd"]`                | Terminal                                                                                   | — alt-d: delete word forward |
| `cmd-delete`              | `["terminal::SendKeystroke","ctrl-k"]`            | Terminal                                                                                   |
| `cmd-right`               | `["terminal::SendKeystroke","ctrl-e"]`            | Terminal                                                                                   |
| `cmd-left`                | `["terminal::SendKeystroke","ctrl-a"]`            | Terminal                                                                                   |
| `alt-left`                | `["terminal::SendText","\u001bb"]`                | Terminal                                                                                   |
| `alt-right`               | `["terminal::SendText","\u001bf"]`                | Terminal                                                                                   |
| `alt-b`                   | `["terminal::SendText","\u001bb"]`                | Terminal                                                                                   |
| `alt-f`                   | `["terminal::SendText","\u001bf"]`                | Terminal                                                                                   |
| `ctrl-delete`             | `["terminal::SendText","\u001b[3;5~"]`            | Terminal                                                                                   |
| `up`                      | `["terminal::SendKeystroke","up"]`                | Terminal                                                                                   |
| `pageup`                  | `["terminal::SendKeystroke","pageup"]`            | Terminal                                                                                   |
| `down`                    | `["terminal::SendKeystroke","down"]`              | Terminal                                                                                   |
| `pagedown`                | `["terminal::SendKeystroke","pagedown"]`          | Terminal                                                                                   |
| `escape`                  | `["terminal::SendKeystroke","escape"]`            | Terminal                                                                                   |
| `enter`                   | `["terminal::SendKeystroke","enter"]`             | Terminal                                                                                   |
| `ctrl-c`                  | `["terminal::SendKeystroke","ctrl-c"]`            | Terminal                                                                                   |
| `ctrl-r`                  | `["terminal::SendKeystroke","ctrl-r"]`            | Terminal                                                                                   |
| `ctrl-backspace`          | `["terminal::SendKeystroke","ctrl-w"]`            | Terminal                                                                                   |
| `shift-pageup`            | `terminal::ScrollPageUp`                          | Terminal                                                                                   |
| `cmd-up`                  | `terminal::ScrollPageUp`                          | Terminal                                                                                   |
| `shift-pagedown`          | `terminal::ScrollPageDown`                        | Terminal                                                                                   |
| `cmd-down`                | `terminal::ScrollPageDown`                        | Terminal                                                                                   |
| `shift-up`                | `terminal::ScrollLineUp`                          | Terminal                                                                                   |
| `shift-down`              | `terminal::ScrollLineDown`                        | Terminal                                                                                   |
| `shift-home`              | `terminal::ScrollToTop`                           | Terminal                                                                                   |
| `cmd-home`                | `terminal::ScrollToTop`                           | Terminal                                                                                   |
| `shift-end`               | `terminal::ScrollToBottom`                        | Terminal                                                                                   |
| `cmd-end`                 | `terminal::ScrollToBottom`                        | Terminal                                                                                   |
| `ctrl-shift-space`        | `terminal::ToggleViMode`                          | Terminal                                                                                   |
| `ctrl-alt-up`             | `pane::SplitUp`                                   | Terminal                                                                                   |
| `ctrl-alt-down`           | `pane::SplitDown`                                 | Terminal                                                                                   |
| `ctrl-alt-left`           | `pane::SplitLeft`                                 | Terminal                                                                                   |
| `ctrl-alt-right`          | `pane::SplitRight`                                | Terminal                                                                                   |
| `cmd-d`                   | `pane::SplitRight`                                | Terminal                                                                                   |
| `cmd-alt-r`               | `terminal::RerunTask`                             | Terminal                                                                                   |
| `cmd->`                   | `agent::AddSelectionToThread`                     | Terminal                                                                                   |
| `cmd-f`                   | `agent::ToggleSearch`                             | AgentPanel > Terminal                                                                      |
| `cmd-n`                   | `agent::NewThread`                                | AgentPanel > Terminal                                                                      |
| `cmd-shift-enter`         | `zeta::ThumbsUpActivePrediction`                  | RatePredictionsModal                                                                       |
| `cmd-shift-backspace`     | `zeta::ThumbsDownActivePrediction`                | RatePredictionsModal                                                                       |
| `shift-down`              | `zeta::NextEdit`                                  | RatePredictionsModal                                                                       |
| `shift-up`                | `zeta::PreviousEdit`                              | RatePredictionsModal                                                                       |
| `right`                   | `zeta::PreviewPrediction`                         | RatePredictionsModal                                                                       |
| `escape`                  | `zeta::FocusPredictions`                          | RatePredictionsModal > Editor                                                              |
| `cmd-shift-enter`         | `zeta::ThumbsUpActivePrediction`                  | RatePredictionsModal > Editor                                                              |
| `cmd-shift-backspace`     | `zeta::ThumbsDownActivePrediction`                | RatePredictionsModal > Editor                                                              |
| `escape`                  | `menu::Cancel`                                    | ZedPredictModal                                                                            |
| `escape`                  | `menu::Cancel`                                    | ConfigureContextServerModal > Editor                                                       |
| `enter`                   | `editor::Newline`                                 | ConfigureContextServerModal > Editor                                                       |
| `cmd-enter`               | `menu::Confirm`                                   | ConfigureContextServerModal > Editor                                                       |
| `escape`                  | `menu::Cancel`                                    | OnboardingAiConfigurationModal                                                             |
| `ctrl-r`                  | `diagnostics::ToggleDiagnosticsRefresh`           | Diagnostics                                                                                |
| `enter`                   | `menu::Confirm`                                   | DebugConsole > Editor                                                                      |
| `alt-enter`               | `console::WatchExpression`                        | DebugConsole > Editor                                                                      |
| `ctrl-tab`                | `pane::ActivateNextItem`                          | RunModal                                                                                   |
| `ctrl-shift-tab`          | `pane::ActivatePreviousItem`                      | RunModal                                                                                   |
| `pageup`                  | `markdown::ScrollPageUp`                          | MarkdownPreview                                                                            |
| `pagedown`                | `markdown::ScrollPageDown`                        | MarkdownPreview                                                                            |
| `up`                      | `markdown::ScrollUp`                              | MarkdownPreview                                                                            |
| `down`                    | `markdown::ScrollDown`                            | MarkdownPreview                                                                            |
| `alt-up`                  | `markdown::ScrollUpByItem`                        | MarkdownPreview                                                                            |
| `alt-down`                | `markdown::ScrollDownByItem`                      | MarkdownPreview                                                                            |
| `cmd-up`                  | `markdown::ScrollToTop`                           | MarkdownPreview                                                                            |
| `cmd-down`                | `markdown::ScrollToBottom`                        | MarkdownPreview                                                                            |
| `cmd-shift-v`             | `markdown::CloseAndReturnToEditor`                | MarkdownPreview                                                                            |
| `cmd-f`                   | `buffer_search::Deploy`                           | MarkdownPreview                                                                            |
| `cmd-f`                   | `search::FocusSearch`                             | KeymapEditor                                                                               |
| `cmd-alt-f`               | `keymap_editor::ToggleKeystrokeSearch`            | KeymapEditor                                                                               |
| `cmd-alt-c`               | `keymap_editor::ToggleConflictFilter`             | KeymapEditor                                                                               |
| `enter`                   | `keymap_editor::EditBinding`                      | KeymapEditor                                                                               |
| `alt-enter`               | `keymap_editor::CreateBinding`                    | KeymapEditor                                                                               |
| `cmd-k`                   | `keymap_editor::OpenCreateKeybindingModal`        | KeymapEditor                                                                               |
| `cmd-c`                   | `keymap_editor::CopyAction`                       | KeymapEditor                                                                               |
| `cmd-shift-c`             | `keymap_editor::CopyContext`                      | KeymapEditor                                                                               |
| `cmd-t`                   | `keymap_editor::ShowMatchingKeybinds`             | KeymapEditor                                                                               |
| `cmd-e`                   | `zed::OpenKeymapFile`                             | KeymapEditor                                                                               |
| `cmd-alt-f`               | `keymap_editor::ToggleKeystrokeSearch`            | KeymapEditor > BufferSearchBar                                                             |
| `enter`                   | `keystroke_input::StartRecording`                 | KeystrokeInput                                                                             |
| `escape escape escape`    | `keystroke_input::StopRecording`                  | KeystrokeInput                                                                             |
| `delete`                  | `keystroke_input::ClearKeystrokes`                | KeystrokeInput                                                                             |
| `cmd-enter`               | `menu::Confirm`                                   | KeybindEditorModal                                                                         |
| `escape`                  | `menu::Cancel`                                    | KeybindEditorModal                                                                         |
| `up`                      | `menu::SelectPrevious`                            | KeybindEditorModal > Editor                                                                |
| `down`                    | `menu::SelectNext`                                | KeybindEditorModal > Editor                                                                |
| `cmd-=`                   | `["zed::IncreaseUiFontSize",{"persist":false}]`   | Onboarding                                                                                 |
| `cmd-+`                   | `["zed::IncreaseUiFontSize",{"persist":false}]`   | Onboarding                                                                                 |
| `cmd--`                   | `["zed::DecreaseUiFontSize",{"persist":false}]`   | Onboarding                                                                                 |
| `cmd-0`                   | `["zed::ResetUiFontSize",{"persist":false}]`      | Onboarding                                                                                 |
| `cmd-enter`               | `onboarding::Finish`                              | Onboarding                                                                                 |
| `alt-tab`                 | `onboarding::SignIn`                              | Onboarding                                                                                 |
| `alt-shift-a`             | `onboarding::OpenAccount`                         | Onboarding                                                                                 |
| `cmd-n`                   | `workspace::NewFile`                              | Welcome                                                                                    |
| `cmd-=`                   | `["zed::IncreaseUiFontSize",{"persist":false}]`   | Welcome                                                                                    |
| `cmd-+`                   | `["zed::IncreaseUiFontSize",{"persist":false}]`   | Welcome                                                                                    |
| `cmd--`                   | `["zed::DecreaseUiFontSize",{"persist":false}]`   | Welcome                                                                                    |
| `cmd-0`                   | `["zed::ResetUiFontSize",{"persist":false}]`      | Welcome                                                                                    |
| `cmd-1`                   | `["welcome::OpenRecentProject",0]`                | Welcome                                                                                    |
| `cmd-2`                   | `["welcome::OpenRecentProject",1]`                | Welcome                                                                                    |
| `cmd-3`                   | `["welcome::OpenRecentProject",2]`                | Welcome                                                                                    |
| `cmd-4`                   | `["welcome::OpenRecentProject",3]`                | Welcome                                                                                    |
| `cmd-5`                   | `["welcome::OpenRecentProject",4]`                | Welcome                                                                                    |
| `ctrl-shift-enter`        | `workspace::OpenWithSystem`                       | InvalidBuffer                                                                              |
| `cmd-,`                   | `zed::OpenSettings`                               | !SettingsWindow                                                                            |
| `cmd-w`                   | `workspace::CloseWindow`                          | SettingsWindow                                                                             |
| `escape`                  | `workspace::CloseWindow`                          | SettingsWindow                                                                             |
| `cmd-m`                   | `settings_editor::Minimize`                       | SettingsWindow                                                                             |
| `cmd-f`                   | `search::FocusSearch`                             | SettingsWindow                                                                             |
| `cmd-,`                   | `settings_editor::OpenCurrentFile`                | SettingsWindow                                                                             |
| `left`                    | `settings_editor::ToggleFocusNav`                 | SettingsWindow                                                                             |
| `cmd-shift-e`             | `settings_editor::ToggleFocusNav`                 | SettingsWindow                                                                             |
| `ctrl-1`                  | `["settings_editor::FocusFile",0]`                | SettingsWindow                                                                             |
| `ctrl-2`                  | `["settings_editor::FocusFile",1]`                | SettingsWindow                                                                             |
| `ctrl-3`                  | `["settings_editor::FocusFile",2]`                | SettingsWindow                                                                             |
| `ctrl-4`                  | `["settings_editor::FocusFile",3]`                | SettingsWindow                                                                             |
| `ctrl-5`                  | `["settings_editor::FocusFile",4]`                | SettingsWindow                                                                             |
| `ctrl-6`                  | `["settings_editor::FocusFile",5]`                | SettingsWindow                                                                             |
| `ctrl-7`                  | `["settings_editor::FocusFile",6]`                | SettingsWindow                                                                             |
| `ctrl-8`                  | `["settings_editor::FocusFile",7]`                | SettingsWindow                                                                             |
| `ctrl-9`                  | `["settings_editor::FocusFile",8]`                | SettingsWindow                                                                             |
| `ctrl-0`                  | `["settings_editor::FocusFile",9]`                | SettingsWindow                                                                             |
| `cmd-{`                   | `settings_editor::FocusPreviousFile`              | SettingsWindow                                                                             |
| `cmd-}`                   | `settings_editor::FocusNextFile`                  | SettingsWindow                                                                             |
| `ctrl-space`              | `git::ApplyCurrentStash`                          | StashDiff > Editor                                                                         |
| `ctrl-shift-space`        | `git::PopCurrentStash`                            | StashDiff > Editor                                                                         |
| `ctrl-shift-backspace`    | `git::DropCurrentStash`                           | StashDiff > Editor                                                                         |
| `up`                      | `settings_editor::FocusPreviousNavEntry`          | SettingsWindow > NavigationMenu                                                            |
| `shift-tab`               | `settings_editor::FocusPreviousNavEntry`          | SettingsWindow > NavigationMenu                                                            |
| `down`                    | `settings_editor::FocusNextNavEntry`              | SettingsWindow > NavigationMenu                                                            |
| `tab`                     | `settings_editor::FocusNextNavEntry`              | SettingsWindow > NavigationMenu                                                            |
| `right`                   | `settings_editor::ExpandNavEntry`                 | SettingsWindow > NavigationMenu                                                            |
| `left`                    | `settings_editor::CollapseNavEntry`               | SettingsWindow > NavigationMenu                                                            |
| `pageup`                  | `settings_editor::FocusPreviousRootNavEntry`      | SettingsWindow > NavigationMenu                                                            |
| `pagedown`                | `settings_editor::FocusNextRootNavEntry`          | SettingsWindow > NavigationMenu                                                            |
| `home`                    | `settings_editor::FocusFirstNavEntry`             | SettingsWindow > NavigationMenu                                                            |
| `end`                     | `settings_editor::FocusLastNavEntry`              | SettingsWindow > NavigationMenu                                                            |
| `alt-left`                | `dev::EditPredictionContextGoBack`                | EditPredictionContext > Editor                                                             |
| `alt-right`               | `dev::EditPredictionContextGoForward`             | EditPredictionContext > Editor                                                             |
| `cmd-shift-backspace`     | `branch_picker::DeleteBranch`                     | GitBranchSelector \|\| (GitBranchSelector > Picker > Editor)                               |
| `cmd-alt-shift-backspace` | `branch_picker::ForceDeleteBranch`                | GitBranchSelector \|\| (GitBranchSelector > Picker > Editor)                               |
| `cmd-shift-i`             | `branch_picker::CycleBranchFilter`                | GitBranchSelector \|\| (GitBranchSelector > Picker > Editor)                               |
| `cmd-k`                   | `branch_picker::ToggleFilterMenu`                 | GitBranchSelector \|\| (GitBranchSelector > Picker > Editor)                               |
| `cmd-=`                   | `image_viewer::ZoomIn`                            | ImageViewer                                                                                |
| `cmd-+`                   | `image_viewer::ZoomIn`                            | ImageViewer                                                                                |
| `cmd--`                   | `image_viewer::ZoomOut`                           | ImageViewer                                                                                |
| `cmd-0`                   | `image_viewer::ResetZoom`                         | ImageViewer                                                                                |
| `cmd-1`                   | `image_viewer::ZoomToActualSize`                  | ImageViewer                                                                                |
| `cmd-k r`                 | `editor::RevealInFileManager`                     | ImageViewer                                                                                |
| `cmd-shift-0`             | `image_viewer::FitToView`                         | ImageViewer                                                                                |
| `cmd-1`                   | `new_process_modal::ActivateTaskTab`              | RunModal                                                                                   |
| `cmd-2`                   | `new_process_modal::ActivateDebugTab`             | RunModal                                                                                   |
| `cmd-3`                   | `new_process_modal::ActivateAttachTab`            | RunModal                                                                                   |
| `cmd-4`                   | `new_process_modal::ActivateLaunchTab`            | RunModal                                                                                   |
| `cmd-1`                   | `git_picker::ActivateBranchesTab`                 | GitPicker                                                                                  |
| `cmd-2`                   | `git_picker::ActivateStashTab`                    | GitPicker                                                                                  |
| `cmd-shift-backspace`     | `worktree_picker::DeleteWorktree`                 | WorktreePicker \|\| (WorktreePicker > Picker > Editor)                                     |
| `cmd-alt-shift-backspace` | `worktree_picker::ForceDeleteWorktree`            | WorktreePicker \|\| (WorktreePicker > Picker > Editor)                                     |
| `cmd-shift-c`             | `zed::OpenWorktreeSetupTasks`                     | WorktreePicker \|\| (WorktreePicker > Picker > Editor)                                     |
| `shift-enter`             | `notebook::RunAndAdvance`                         | NotebookEditor                                                                             |
| `cmd-enter`               | `notebook::Run`                                   | NotebookEditor                                                                             |
| `cmd-shift-enter`         | `notebook::RunAll`                                | NotebookEditor                                                                             |
| `alt-up`                  | `notebook::MoveCellUp`                            | NotebookEditor                                                                             |
| `alt-down`                | `notebook::MoveCellDown`                          | NotebookEditor                                                                             |
| `cmd-m`                   | `notebook::AddCodeBlock`                          | NotebookEditor                                                                             |
| `cmd-shift-m`             | `notebook::AddMarkdownBlock`                      | NotebookEditor                                                                             |
| `cmd-shift-r`             | `notebook::RestartKernel`                         | NotebookEditor                                                                             |
| `cmd-c`                   | `notebook::InterruptKernel`                       | NotebookEditor                                                                             |
| `enter`                   | `notebook::EnterEditMode`                         | NotebookEditor && notebook_mode == command                                                 |
| `d d`                     | `notebook::DeleteCell`                            | NotebookEditor && notebook_mode == command                                                 |
| `backspace`               | `notebook::DeleteCell`                            | NotebookEditor && notebook_mode == command                                                 |
| `down`                    | `menu::SelectNext`                                | NotebookEditor && notebook_mode == command                                                 |
| `up`                      | `menu::SelectPrevious`                            | NotebookEditor && notebook_mode == command                                                 |
| `enter`                   | `editor::Newline`                                 | NotebookEditor > Editor                                                                    |
| `shift-enter`             | `notebook::RunAndAdvance`                         | NotebookEditor > Editor                                                                    |
| `cmd-enter`               | `notebook::Run`                                   | NotebookEditor > Editor                                                                    |
| `cmd-shift-enter`         | `notebook::RunAll`                                | NotebookEditor > Editor                                                                    |
| `alt-up`                  | `notebook::MoveCellUp`                            | NotebookEditor > Editor                                                                    |
| `alt-down`                | `notebook::MoveCellDown`                          | NotebookEditor > Editor                                                                    |
| `cmd-m`                   | `notebook::AddCodeBlock`                          | NotebookEditor > Editor                                                                    |
| `cmd-shift-m`             | `notebook::AddMarkdownBlock`                      | NotebookEditor > Editor                                                                    |
| `cmd-shift-r`             | `notebook::RestartKernel`                         | NotebookEditor > Editor                                                                    |
| `escape`                  | `notebook::EnterCommandMode`                      | NotebookEditor > Editor                                                                    |
| `tab`                     | `git_graph::FocusNextTabStop`                     | GitGraph                                                                                   |
| `shift-tab`               | `git_graph::FocusPreviousTabStop`                 | GitGraph                                                                                   |
| `tab`                     | `git_graph::FocusNextTabStop`                     | GitGraphSearchBar > Editor                                                                 |
| `shift-tab`               | `git_graph::FocusPreviousTabStop`                 | GitGraphSearchBar > Editor                                                                 |
| `cmd-w`                   | `workspace::CloseWindow`                          | SkillCreator                                                                               |
| `cmd-enter`               | `skill_creator::SaveSkill`                        | SkillCreator                                                                               |
| `tab`                     | `skill_creator::FocusNextField`                   | SkillCreator                                                                               |
| `shift-tab`               | `skill_creator::FocusPreviousField`               | SkillCreator                                                                               |
| `cmd-w`                   | `workspace::CloseWindow`                          | SkillCreator > Editor                                                                      |
| `cmd-enter`               | `skill_creator::SaveSkill`                        | SkillCreator > Editor                                                                      |
| `tab`                     | `skill_creator::FocusNextField`                   | SkillCreator > Editor                                                                      |
| `shift-tab`               | `skill_creator::FocusPreviousField`               | SkillCreator > Editor                                                                      |
