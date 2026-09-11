Browser: find in page#289801
https://github.com/microsoft/vscode/pull/289801

## tl;dr
This Pull Request implements a Find in Page feature for the integrated browser view, including a user interface widget, keyboard shortcuts, and backend service methods to search text within web page content.

## Stakeholders
- **jruales**: Provided feedback on UI details (resize bar width, padding, corner rounding) and reported functional issues (find dialog persistence on navigation, popup window find functionality, input lag during text deletion).
- **kycutler**: Addressed jruales' concerns by attributing input lag to Chromium behavior, referencing a separate fix for popup window shortcuts, and opposing automatic find dialog dismissal on navigation due to hot-reload workflows.

## Changes
### src/vs/platform/browserView/common/browserView.ts
- Added `IBrowserViewFindInPageOptions` interface to define find operation parameters (`recompute`, `forward`, `matchCase`).
- Added `IBrowserViewFindInPageResult` interface to structure find results (`activeMatchOrdinal`, `matches`, `selectionArea`, `finalUpdate`).
- Extended `IBrowserViewService` with `onDynamicDidFindInPage` event to notify of find results.
- Added `findInPage(id, text, options)` and `stopFindInPage(id, keepSelection)` methods to the service contract, enabling search initiation and termination.

### src/vs/platform/browserView/electron-main/browserView.ts
- Imported the new find interfaces for type safety.
- Added `_onDidFindInPage` emitter and `onDidFindInPage` event to propagate Electron's `found-in-page` events.
- Implemented Electron `webContents` listener for `found-in-page` to translate Chromium results into the service event.
- Implemented `findInPage` method that forwards text and options to Electron's `findInPage`, mapping `recompute` to Electron's `findNext` flag (with clarifying comment about its purpose).
- Implemented `stopFindInPage` method that calls Electron's `stopFindInPage` with appropriate action (`keepSelection` or `clearSelection`).

### src/vs/platform/browserView/electron-main/browserViewMainService.ts
- Added import for `IBrowserViewFindInPageOptions` to support service method signatures.
- Implemented `onDynamicDidFindInPage(id)` to delegate to the specific browser view's find event.
- Implemented `findInPage(id, text, options)` and `stopFindInPage(id, keepSelection)` to delegate calls to the underlying browser view instance.

### src/vs/workbench/contrib/browserView/common/browserView.ts
- Imported find interfaces for model extension.
- Added `onDidFindInPage` event to `IBrowserViewModel` for view-specific find result observation.
- Added `findInPage` and `stopFindInPage` methods to the model interface.
- In `BrowserViewModel`:
  - Added getter for `onDidFindInPage` that proxies to the service's dynamic event.
  - Implemented `findInPage` and `stopFindInPage` methods that delegate to the service with the model's ID.

### src/vs/workbench/contrib/browserView/electron-browser/browserEditor.ts
- Imported `Lazy` for deferred widget initialization and re-exported find widget context keys.
- Added `_findWidgetContainer` (DOM element) and `_findWidget` (lazy-initialized `BrowserFindWidget`) fields.
- In constructor: created find widget container and initialized lazy widget factory that sets the model on creation.
- In `setInput`: updated the lazy widget's model when the editor input changes.
- Added `showFind()` (reveals widget and layouts), `hideFind()` (hides widget), `findNext()` (delegates to widget's find with forward=false), and `findPrevious()` (delegates with forward=true).
- Overrode `layout()` to forward dimensions to the find widget for proper sizing.
- Overrode `setVisible()` to clear the find widget's model and hide it when the editor is hidden, preventing stale state.

### src/vs/workbench/contrib/browserView/electron-browser/browserFindWidget.ts (new file)
- Extended `SimpleFindWidget` to create a browser-specific find UI.
- Defined context keys `CONTEXT_BROWSER_FIND_WIDGET_VISIBLE` and `CONTEXT_BROWSER_FIND_WIDGET_FOCUSED` for UI state tracking.
- In `setModel(model)`: cleared disposables, stored model, reset state, and subscribed to:
  - `model.onDidFindInPage` to update internal result tracking (`_lastFindResult`, `_hasFoundMatch`) and refresh UI.
  - `model.onWillDispose` to reset model when the browser view is destroyed.
- Overrode `reveal(initialInput)`: called super, showed widget container, focused input, and triggered search if input existed.
- Overrode `hide()`: called super, hid widget container, stopped find in the browser view, and cleared state.
- Implemented `find(previous)`: delegated to model's `findInPage` with `forward: !previous` and current match/toggle states.
- Implemented `findFirst()`: delegated with `forward: true` and `recompute: true` to start a new search.
- Implemented `clear()`: stopped find in the browser view and cleared state.
- Overrode `_onInputChanged()`: triggered `findFirst()` on input or `clear()` on empty input when a model exists.
- Overrode `_getResultCount()`: returned cached `_lastFindResult` from the most recent find event.
- Overrode focus trackers to update `CONTEXT_BROWSER_FIND_WIDGET_FOCUSED` on widget focus/blur.

### src/vs/workbench/contrib/browserView/electron-browser/browserViewActions.ts
- Imported find widget context keys from `browserEditor`.
- Added `ShowBrowserFindAction` (Ctrl+Cmd+F) that calls `browserEditor.showFind()` when active.
- Added `HideBrowserFindAction` (Escape when widget visible) that calls `browserEditor.hideFind()`.
- Added `BrowserFindNextAction` (Enter/F3 when widget focused/visible) that calls `browserEditor.findNext()`.
- Added `BrowserFindPreviousAction` (Shift+Enter/Shift+F3 or platform variants) that calls `browserEditor.findPrevious()`.
- Registered all four actions with the action system.

### src/vs/workbench/contrib/browserView/electron-browser/media/browser.css
- Reduced toolbar vertical padding from 8px to 6px and changed border color to `--vscode-widget-border` for consistency.
- Added `.browser-find-widget-wrapper` styles:
  - Fixed sizing (`flex-shrink: 0`), positioning (`relative`, `z-index: 10`), and overflow handling.
  - Added bottom border when visible (`.find-visible`).
  - Overrode `SimpleFindWidget` positioning to flow naturally in the layout (`position: relative`, removed offsets/padding).
  - Styled the sash (`width: 2px !important`, no radius) and hover indicator.
  - Hidden whole-word and regex toggle icons (not needed for browser find).

## Risks
- **[Medium] Popup Window Find Shortcut Failure**: The find shortcut (Ctrl+Cmd+F) does not work when focus is on web content in popped-out browser windows, as reported by jruales. While kycutler references a separate fix (#289960), this PR does not address the underlying issue of context key propagation to auxiliary windows, leaving the feature partially broken in multi-window scenarios.
- **[Low] Input Lag During Text Deletion**: jruales observed lag when deleting text containing a leading space (e.g., " feeling lucky"), which kycutler attributes to Chromium's internal search throttling. Though not directly controllable, this creates a perceptible delay in UI feedback that may confuse users expecting instant highlight updates.
- **[Low] Potential Memory Leak from Model Disposal**: The `BrowserFindWidget` disposes of its model subscriptions on `setModel(undefined)` and editor hide, but if the widget is destroyed without these paths (e.g., abrupt pane closure), disposables from `model.onDidFindInPage` and `model.onWillDispose` may not be cleaned up, risking retained references.

## Learning
1. Why does the `findInPage` method in the Electron-main browser view map the `recompute` option to Electron's `findNext` flag, and what behavioral difference would occur if this mapping were inverted (i.e., using `!options?.recompute`)?
2. How does the `BrowserFindWidget` ensure that find results from the browser view are accurately reflected in the UI, particularly regarding the conversion between Electron's 1-based `activeMatchOrdinal` and the widget's 0-based result indexing?
3. What specific CSS rules in `browser.css` override the default positioning behavior of `SimpleFindWidget` to integrate the find widget into the browser editor's layout flow, and why might these overrides be necessary when embedding the widget between the toolbar and browser container?