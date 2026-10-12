# Verification record

The delivered source and standalone build were checked on October 12, 2026 UTC.

## Completed

- JavaScript syntax checks for all seven production modules and the compiled standalone script.
- Twenty-nine simulation tests: three-floor connectivity, every interaction/hiding approach, all patrol targets, closed-door visibility and collision, wall/furniture collision with movement substeps, 360° look and pitch bounds, physical back-door entry, timed barricade breaking, pursuit/capture, blocked sight, hidden searches, breath exhaustion, noise investigation, camera/film limits, flash evidence/stun, flashlight depletion, unique evidence, all eight ending resolvers, cellar unlocking/transit, complete save restoration, invalid-save rejection, checkpoint protection, difficulty mechanics a prolonged autonomous simulation, camera-pickup navigation across floors, manual cancellation, the title-house entry route and reference-matched scene choices.
- Eight client contract tests: startup and finite render submissions, all-floor render calls, telephone/dispatch choices, visible access to both dark endings, difficulty application and Continue, six-face capture plus album review/equipping, interactive capture recovery/pursuit trace, and asset-reference integrity.
- A separate 600-second simulation confirmed the hunter physically visits all three floors without entering solid wall cells or jumping between positions on the same floor.
- The supplied raster artwork, character crop, background-paper removal, scene crops and UI-frame crops were rendered for visual inspection. The shipped reference files are byte-for-byte copies of the supplied files.
- The standalone build contains all code, styles and the supplied raster art without external runtime resources. The ZIP’s file contents and entry point were checked.

## Verification limit

Client tests use a minimal DOM and WebGL API mock. They check action wiring, finite buffers, uniform types, draw submissions and panorama assembly; they do not execute a GPU shader or render CSS in a browser. Real-browser, real-GPU, mobile touch and device speech playback could not be playtested here. Performance and voice quality remain device dependent.

WebGL startup errors display a readable help panel. Audio and photo-storage failures have fallbacks. No assertion that every browser or device is error-free is made.

## Recommended first browser check

Open the standalone file or Pages URL in Chrome, Edge, Firefox or Safari. Start a night, walk and turn around, collect the upstairs camera, take and inspect a panorama, trigger a capture, retry, and select another difficulty. On a phone, try both orientations and the joystick. Settings can lower render quality, narration, volume or motion without changing the story.

## Photo reconstruction limit

The supplied pictures are single-view screenshots. 360-degree look and captures use a reconstructed photo room with scene crops for other directions. They do not reveal authentic unseen surfaces from the original pictures. The physical floor graph and obstacles guide movement and the hunter, but are not a photogrammetric scan of the pictured rooms.
