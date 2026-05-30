import { joyExecute as execute } from './learn/language.joy.ts'
import { joyLearn as learn } from './learn/language.joy.ts'

import { applets } from './learn/applets.joy.ts'
import { architecture } from './learn/architecture.joy.ts'
import { backend } from './learn/backend.joy.ts'
import { buttonIcons } from './learn/buttonIcons.joy.ts'
import { cache } from './learn/cache.joy.ts'
import { common } from './learn/common.joy.ts'
import { composerButtonComponent } from './learn/composerButtonComponent.joy.ts'
import { composerButtonRowComponent } from './learn/composerButtonRowComponent.joy.ts'
import { composerComponent } from './learn/composerComponent.joy.ts'
import { composerEditorComponent } from './learn/composerEditorComponent.joy.ts'
import { demoApplet } from './learn/demoApplet.joy.ts'
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
import { workbookApplet } from './learn/workbookApplet.joy.ts'
import { workbookProtocol } from './learn/workbookProtocol.joy.ts'
import { workbookListApplet } from './learn/workbookListApplet.joy.ts'
import { zoomApplet } from './learn/zoomApplet.joy.ts'


learn(applets)

learn(architecture)

learn(backend)

learn(buttonIcons)

learn(cache)

learn(common)

learn(composerButtonComponent)

learn(composerButtonRowComponent)

learn(composerComponent)

learn(composerEditorComponent)

learn(demoApplet)

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

learn(workbookApplet)

learn(workbookProtocol)

learn(workbookListApplet)

learn(zoomApplet)

execute(`

The goal of this project is to create a set of prompts that can be run as a group to produce a chatbot
named Lucy.  We want Lucy to be 100% generated code.

It's the prompts that we ultimately care about.  When we make a bug fix, it's important
that we make a corresponding fix to the prompts to ensure that the bug does not resurface in
a future generation.

Every time we make a change to the prompts, we rebuild the corresponding source code.  Then we
commit both the affected prompts and the affected source files to the same Git repo.  This
way I can tell you, "Claude, this feature was working yesterday, check the Git history to find the 
change to the prompts that broke the feature."

We're just going to generate code.

Do not run npm install

Do not start the backend server.

Do not start the frontend server.

If there is no mono-repo directory, create it.

After reading all of the prompts from the learn directory, and before building anything, tell me:
    - Do the prompts make sense?
    - Are there inconsiistencies?
    - Are there ambiguities?
    - Do you have sufficient detail to build the common, backend, applets and frontend repos?

Ask permission before proceeding with build steps.

When I tell you to build something, that includes running tslint to find and fix
compile-time errors.

Build the common repo

Build the backend repo

Build the applets repo

Build the frontend repo

`)

