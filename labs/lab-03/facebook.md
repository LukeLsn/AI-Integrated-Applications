Fix Fizz non-script modulepreload tracking#36564
https://github.com/facebook/react/pull/36564

================ SENIOR ENGINEER REVIEW REPORT ================
## tl;dr
This Pull Request fixes a resource lookup error in React's server-side module preloading and adds a test for multiple non-script modules with the same 'as' type.

## Stakeholders
*No stakeholders identified in the provided data (code author information not included in diff, and thread is empty).*

## Changes
### packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js
Modified the `preloadModule` function to correct a resource lookup property. Changed `resumableState.unknownResources[as]` to `resumableState.moduleUnknownResources[as]` to access the correct storage location for module resources. This ensures proper deduplication checks when preloading modules, preventing duplicate `<link>` tags for identical resources by checking the right state container where module preload data is stored.

### packages/react-dom/src/__tests__/ReactDOMFloat-test.js
Added a new test case validating behavior when preloading multiple non-script resources sharing the same `as` type (e.g., two serviceworker modules). The test renders a component calling `ReactDOM.preloadModule` twice with distinct `href` values but identical `as` attributes, then verifies the output contains two separate `<link rel="modulepreload">` tags (one per `href`) alongside the component content. This confirms the fix doesn't break legitimate multi-resource preloading scenarios while maintaining correct output structure.

## Risks
* [Medium] **Incorrect state property assumption**: The fix relies on `resumableState.moduleUnknownResources` being properly initialized and populated elsewhere. If this property name is misspelled or uninitialized in other code paths (not visible in this diff), it could cause runtime errors during module preloading. Severity is medium because the test passes, indicating correctness in this context, but cross-file consistency isn't verified here.
* [Low] **Incomplete deduplication test coverage**: The new test only validates distinct `href` values for the same `as` type. It doesn't test the deduplication case (same `href` preloaded twice), which is the primary purpose of the fixed lookup. A regression in deduplication logic might go undetected by this specific test. Severity is low as deduplication is likely covered elsewhere, but this test file lacks explicit validation.
* [Low] **Overlooked similar typos**: The fix addresses one instance of `unknownResources` vs `moduleUnknownResources`. Other occurrences of this pattern in the same file or related modules (e.g., `unknownScripts`, `unknownStyles`) might contain identical errors, risking similar bugs in other resource types. Severity is low due to the localized nature of the change, but a broader audit would be prudent.

## Learning
1. Why was it necessary to change `resumableState.unknownResources[as]` to `resumableState.moduleUnknownResources[as]` in the `preloadModule` function, and what would happen if we left it as `unknownResources` when trying to preload the same module Hypertext Reference twice?
2. In the added test, why do we expect two separate `<link>` tags for the two serviceworker modules (with different Hypertext References) even though they share the same `as` type? How does the deduplication key work in the `preloadModule` function?
3. The test uses `act(() => { renderToPipeableStream(<App />).pipe(writable); })` to render the component. Why is the `act` function necessary here, and what could go wrong if we omitted it when testing asynchronous rendering?
===============================================================