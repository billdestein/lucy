import { joyExecute as execute } from './learn/language.joy.ts'
import { joyLearn as learn } from './learn/language.joy.ts'

import { architecture } from './learn/architecture.joy.ts'
import { backend } from './learn/backend.joy.ts'
import { buttonIcons } from './learn/buttonIcons.joy.ts'
import { cache } from './learn/cache.joy.ts'
import { common } from './learn/common.joy.ts'
import { composerButtonComponent } from './learn/composerButtonComponent.joy.ts'
import { composerButtonRowComponent } from './learn/composerButtonRowComponent.joy.ts'
import { composerComponent } from './learn/composerComponent.joy.ts'
import { composerEditorComponent } from './learn/composerEditorComponent.joy.ts'
import { frameHeaderButtonComponent } from './learn/frameHeaderButtonComponent.joy.ts'
import { frontend } from './learn/frontend.joy.ts'
import { mainMenuComponent } from './learn/mainMenu.joy.ts'
import { picComponent } from './learn/picComponent.joy.ts'
import { picListComponent } from './learn/picListComponent.joy.ts'
import { promptApplet } from './learn/promptApplet.joy.ts'
import { promptProtocol } from './learn/promptProtocol.joy.ts'
import { uploadPicApplet } from './learn/uploadPicApplet.joy.ts'
import { uploadWorkbookApplet } from './learn/uploadWorkbookApplet.joy.ts'
import { viewerComponent } from './learn/viewerComponent.joy.ts'
import { windows } from './learn/windows.joy.ts'
import { workbookApplet } from './learn/workbookApplet.joy.ts'
import { workbookProtocol } from './learn/workbookProtocol.joy.ts'
import { workbookListApplet } from './learn/workbookListApplet.joy.ts'
import { zoomApplet } from './learn/zoomApplet.joy.ts'

execute(`
    We're just going to generate code.
    Do not start the backend server.
    Do not start the frontend server.
    If there is no lucy directory, create it.
`)

execute(`
    Let's try to stick with this workflox:
    - I express a concern or make a request
    - You modify the output code (not the prompts) allowing me to preview 
      your change to the product behavior or appearance.
    - If I like the preview, I will ask you to show me the changes to the
      prompts needed to reproduce the new output code in subsequent generations.
      This is a preview of the prompts.
    - If I like the prompts, I will tell you to apply your changes to the prompts
`)


learn(architecture)

learn(backend)

learn(buttonIcons)

learn(cache)

learn(common)

learn(composerButtonComponent)

learn(composerButtonRowComponent)

learn(composerComponent)

learn(composerEditorComponent)

learn(frameHeaderButtonComponent)

learn(frontend)

learn(mainMenuComponent)

learn(picComponent)

learn(picListComponent)

learn(promptApplet)

learn(promptProtocol)

learn(uploadPicApplet)

learn(uploadWorkbookApplet)

learn(viewerComponent)

learn(windows)

learn(workbookApplet)

learn(workbookProtocol)

learn(workbookListApplet)

learn(zoomApplet)

execute(`
    before proceeding, let me know if everything makes sense and if you have enough details to build:

    - the backend repo, 
    - the common repo, 
    - the frontend repo
`)
