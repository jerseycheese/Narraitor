Title: Fix wizard layout shifts and prepare UI for tutorials

## Description
While working on the guided onboarding system (#399), I noticed the wizard layout was jumping around a bit when tooltips appeared, and we needed a standard way to hook into UI elements for the tours.

This PR stabilizes the wizard width, improves the template selector behavior, and most importantly, adds the `dataTutorial` prop to our shared form components. This allows us to target specific elements for the tutorial steps without relying on fragile CSS selectors.

## Related Issue
Part of #399 (Pre-requisite for tutorial integration)

## Implementation Notes
- Added `dataTutorial` prop to `WizardTextField`, `WizardTextArea`, etc.
- Fixed layout shift issues in the `WizardFormGroup`.
- Cleaned up `TemplateSelector` to be more stable.
