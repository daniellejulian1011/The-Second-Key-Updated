# THE SECOND KEY

**He already has a way in.**

A static interactive horror game using the supplied scene and character images set at the Price residence in Grayswick, Pennsylvania, on October 26, 1990. You play Evelyn Price. Nathaniel Cross uses a copied house key, moves through the actual house, follows noise, pursues you and searches hiding places.

## Play

Open **PLAY_THE_SECOND_KEY.html** in a current browser with JavaScript and WebGL enabled. This single file contains the entire game, styles and original artwork. It needs no install, account, API key or download of external assets. Browser file previews that disable scripts cannot run the game; open it in a browser instead.

For the editable multi-file version, use GitHub Pages or another static web host. Opening its `index.html` from `file://` may block ES module imports; use the standalone file for direct local play.

## GitHub Pages

1. Extract the ZIP. Upload its **contents**, so `index.html`, `style.css`, `.nojekyll`, `assets/` and `js/` sit at the top of your repository, not inside an extra enclosing folder.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your source branch, normally `main`, and **/(root)**, then save.
5. Open the published site from Pages. Asset paths are relative, so project URLs with a repository subdirectory work.

The empty `.nojekyll` file disables Jekyll processing for this static package. There is no build step, server, CDN or package installation needed to play.

Official guidance: [Create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [Configure the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Controls

- **WASD / touch joystick:** walk. **Shift / RUN:** sprint. **Ctrl / CROUCH:** quiet movement.
- **Drag the scene:** look around through a full 360°. Arrow keys also look around. Double-click the scene for optional mouse capture; Escape releases it through the pause menu.
- **E / INTERACT:** use the object you face. The ornate choice cards perform the same actions.
- **1 / F:** equip and toggle the flashlight. **2:** equip the camera. **C / USE:** take a photograph.
- **3 / P:** photographs. **I:** evidence. **J:** journal. **M:** floor plan. **Esc / Tab:** pause.
- **Space while hidden / HOLD BREATH:** hold your breath. If Nathaniel saw you enter the hiding place, your breath cannot hide that fact.

The camera is upstairs on Evelyn’s desk. Scene choice cards can walk Evelyn to the relevant object before using it; manual steering cancels that route. Film and flashlight battery are finite. A nearby unobstructed flash can briefly stagger Nathaniel, but the sound reveals your position. Every photograph captures all six directions and becomes a 2048 × 1024 spherical panorama. The album supports full 360° review, equipping, downloading and deletion. No player hands appear.

## Settings and saving

Easy, Normal and Nightmare have different pursuit speeds, vision ranges, entrance delays, breath reserves, police response times, film counts and battery life. Choose a mode for new nights or retries, or apply it to the active run from Settings.

Settings include volume controls, device voice narration, camera shake, look sensitivity, reduced motion, rendering quality and pause while reading. The game pauses when the tab loses focus.

Night saves, checkpoints, chapter unlocks and endings use browser storage. Photographs use IndexedDB, with a session-only fallback if storage is unavailable. At most 40 photographs are retained. Browser storage belongs to the browser and site address; it is not cloud synchronization. A failed storage write does not prevent play.

## Features

The actual uploaded title image has clickable menu options, porch, mailbox and bedroom window. Its house connects to an explorable front-yard scene. The house includes living room, foyer, kitchen, dining room, garage, Evelyn’s room, parents’ room, bathroom, upstairs landing, laundry basement and storage. Stairs and the storm cellar connect the levels.

Nathaniel starts at the back entrance, crosses real door tiles, follows reachable paths, opens copied-key locks and can break barricades after a delay. He does not spawn in arbitrary interior rooms. The game includes line of sight, positional footsteps, radio distractions, hiding searches, stamina, breathing, power failure, battery use and photographic evidence.

Capture produces a screaming stinger, violent configurable camera shake, a faint red edge effect, a close illustrated lunge and an interactive game over screen. You can retry a safe checkpoint, restart, change difficulty, review photographs or scrub a map of the last pursuit.

All eight endings are implemented. See **WALKTHROUGH.md** for route clues and spoilers. Chapter replays unlock from checkpoints reached during your own play.

## Art and sound

The supplied PNG and JPEG files are now included directly. The title, living room, kitchen, upstairs hall, basement, jumpscare and game over page use those images. The visible roaming Nathaniel uses pixels from his uploaded character sheet, separated from its paper background at runtime. The inventory icons and ornate dialogue/choice frames also use pixels from the references. The replacement vector character and exterior drawings have been removed.

Movement updates physical positions, collision, pursuit and scene perspective. The surrounding view is a photo-room reconstruction using crops from the supplied scenery. The original images each show one view; they do not contain genuine unseen rear walls or a photographed spherical environment. Side/rear views and unpictured rooms therefore use reconstructed reference scenery. The photo-based presentation is paired with the existing physical room graph, rather than being a scanned model of the photographed rooms.
Rain, footsteps, impacts, the telephone, camera, synthesized scream, heartbeat and siren use local Web Audio synthesis. Dialogue narration uses speech voices installed on the player’s device. This is not a professionally recorded voice cast; voice availability differs by browser and device. All dialogue is readable and kept in the journal.

## Validation

Run `npm test` with Node 18 or newer. No test dependencies are required.

**37 automated checks pass**, covering gameplay, paths, collision, pursuit, hiding, all eight ending rules, saves, client actions, photo review/equipping, six-face panorama capture, renderer API contracts and asset references, reference-specific choices and physical movement from those choices. See **VALIDATION.md** for the exact verification scope. Real-browser and real-GPU playtesting was unavailable in the build environment and has not been claimed.
