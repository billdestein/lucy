//----------------------------------------------------------------------------------------------------
// backend
//----------------------------------------------------------------------------------------------------
export const backend = `

The package name is @billdestein/lucy-backend

The backend uses:

- Express
- Google Gemini SDK
- jose (for JWT verification)
- Node
- Typescript

The backend has a startup script (start.sh) that builds dependencies, builds the frontend,
exports environment variables, and starts the Express server. Here is what it does, in order:

1. Capture SCRIPT_DIR as an absolute path before any cd commands:
       SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
   Always use $SCRIPT_DIR for subsequent path references. Never re-derive the script
   directory after a cd — $(dirname "$0") will resolve relative to the changed directory.

2. Build the common package (ts-node cannot resolve it otherwise):
       cd "$SCRIPT_DIR/../common" && npm run build

3. Build the frames package:
       cd "$SCRIPT_DIR/../frames" && npm run build

4. Select config files based on OS:
   - macOS:  ~/lucy-config/FrontendLocalConfig.json and ~/lucy-config/BackendLocalConfig.json
   - Linux:  /mount/lucy-config/FrontendProdConfig.json and /mount/lucy-config/BackendProdConfig.json

5. Export Vite environment variables from the frontend config, then build the frontend.
   Vite bakes these values into the JS bundle at build time, so they must be set before
   the build runs:
       export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
       export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")
       cd "$SCRIPT_DIR/../frontend" && npm run build

6. cd back to SCRIPT_DIR, then export backend environment variables from the backend config:
       export COGNITO_REGION=...
       export COGNITO_USER_POOL_ID=...
       export GOOGLE_API_KEY=...
       export MOUNT_DIR=...
       export ORIGIN=...
       export REDIS_HOST=...
       export REDIS_PORT=...

7. Start the server:
       npx ts-node "$SCRIPT_DIR/src/server.ts"

The startup checks where it is running.
If running on MacOS, it reads the file ~/lucy-config/BackendLocalConfig.json.
If running on Linux,  it reads the file /mount/lucy-config/BackendProdConfig.json.

Both files contains a single json object with these properties:

- COGNITO_CLIENT_ID
- COGNITO_REGION
- COGNITO_USER_POOL_ID
- GOOGLE_API_KEY
- MOUNT_DIR
- ORIGIN
- REDIS_HOST
- REDIS_PORT

Each is assigned to en environment variable with the same name.

The backend server listens on port 8080.

The backend code has an in-memory map of email to User object.

The user object has these properties:
    - email: string
    - slug: string

The slug is computed by slugFromEmail, and the inverse is emailFromSlug:

    export function slugFromEmail(email: string): string {
        return email.toLowerCase().replace('@', '-at-').replace(/[^a-z0-9.-]/g, '-')
    }

    export function emailFromSlug(slug: string): string {
        return slug.replace('-at-', '@')
    }

Example: billdestein@gmail.com → billdestein-at-gmail.com

Slugs are persisted to MOUNT_DIR/users.json (a JSON object mapping email to slug).
On first login the slug is computed with slugFromEmail and written to users.json.
On subsequent logins the slug is read from users.json, so it never drifts even
if the slugFromEmail algorithm changes.

All of the this happens in the login endpoint:
- The login endpoint receives an authorization header that contains the Cognito ID token.
- The backend calls Cognito to validate the ID token and to get the user's email.  
- The backend then creates a User object if it does not already exist.
- The backend computes a random session ID
- A <session ID, email> pair is set in Redis with a one-hour TTL
- The session ID is put into an http-only cookie.

All subsequent endpoint calls receive the Session ID in an http-only cookie.  The session ID is used to lookup the email in Redis.  And the email is used to "find or create" the user object.

Endpoint: /v1/auth/login (POST)
  - Input:
    - authorization header containing the Cognito ID token (not the access token)
  - Processing:
    - Verify the ID token using Cognito's JWKS endpoint via the jose library.
      The JWKS URL is: https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json
    - Extract the user's email from the verified token's claims (the 'email' claim).
    - Do not use the AWS SDK GetUserCommand — it requires the aws.cognito.signin.user.admin
      scope which is not present on the access token when using 'openid email' scope.
    - Compute a random session id
    - Store the session in an HTTP-only cookie
    - Create a User object with the email and slug.
    - Create the newly logged-in user's directory if it does not exist: MOUNT_DIR/users/{slug}
  - Output
    - None

Endpoint: /v1/health/check (GET)
  - Input:
    - None
  - Processing:
    - None
  - Output
    - None

Endpoint: /v1/workbooks/create-workbook (POST)
- Input:
  - workbookName: string
- Processing:
  - Create a new directory for the workbook in the user's 'workbooks' directory.
  - Create a WorkbookType object with name and createdAt, a single empty focused prompt,
    and a single empty sentinel PicType with filename 'empty' and mimeType ''.
  - Set focusedPicFilename to 'empty'.
  - Stringify the WorkbookType object and save it in a file named workbook.json
- Output:
  - None

Endpoint: /v1/workbooks/clone-workbook (POST)
  - Input:
    - workbook: WorkbookType (the source workbook)
    - newWorkbookName: string
  - Processing:
    - Create a new directory for the clone.
    - Copy all pic files (skipping the empty sentinel) from the source workbook directory
      to the new directory.
    - Create a cloned WorkbookType: same pics, prompts, and focusedPicFilename as the
      source, but with the new workbookName and a fresh createdAt.
    - Save workbook.json in the new directory.
  - Output:
    - None

Endpoint: /v1/workbooks/delete-pic (POST)
  - Input:
    - workbook
    - picName
  - Processing:
    - Delete the pic from the workbook.json
    - Delete the image file
  - Output
    - None

Endpoint: /v1/workbooks/delete-workbook (POST)
  - Input:
    - workbookName
  - Processing
    - Delete the workbook
    - Delete associated pic files
  - Output:
    - workbooks: WorkbookType[]

Endpoint: /v1/workbooks/generate-pic (POST)
  - Input:
    - imageFilename: string
    - workbook: WorkbookType
  - Processing:
    - Find the focused PromptType in workbook.prompts; strip comment and command lines; use remaining text as promptText.
    - Check workbook.focusedPicFilename:
      - If 'empty' (or missing): call ai.models.generateImages with model imagen-4.0-generate-001
        and promptText. This is text-to-image generation.
      - Otherwise: read the source pic file from disk, base64-encode it, and call
        ai.models.generateContent with model gemini-2.5-flash-image,
        passing contents as a flat array of parts (NOT wrapped in a role object):
        [{ inlineData: { data: sourceBytes, mimeType } }, { text: promptText }].
        No config block (no responseModalities needed).
        Extract the result from response.candidates[0].content.parts — find the part with inlineData.
        This is image mutation and works with a standard Google API key.
    - Wrap the API call in try/catch; on error, log and return status 500 with the error message.
    - Get encodedImage from the response (generatedImages[0].image.imageBytes).
    - Write the raw bytes to imageFilename in the workbook directory.
    - Create a PicType for the new pic (mimeType: 'image/png').
    - Append the new PicType to workbook.pics.
    - Set workbook.focusedPicFilename to imageFilename.
    - Save and return the updated workbook.
  - Output
    - workbook

Endpoint: /v1/workbooks/upload-pic (POST)
  - Input:
    - workbookName: string
    - imageFilename: string
    - imageData: string (base64-encoded image bytes)
    - mimeType: string
  - Processing:
    - Decode imageData and write the raw bytes to imageFilename in the workbook directory.
    - Read the current workbook.json.
    - Create a PicType for the new pic.
    - Append it to workbook.pics.
    - Set workbook.focusedPicFilename to imageFilename.
    - Save and return the updated workbook.
  - Output:
    - workbook

Endpoint: /v1/workbooks/upload-pic-from-url (POST)
  - Input:
    - workbookName: string
    - imageUrl: string
    - imageFilename: string
  - Processing:
    - Fetch the image from imageUrl using Node's native fetch (backend-side, no CORS issues).
    - On fetch error, return status 502 with the error message.
    - Derive mimeType from the Content-Type response header.
    - Write the raw bytes to imageFilename in the workbook directory.
    - Read the current workbook, create a PicType, append it to pics,
      set focusedPicFilename to imageFilename, save and return the updated workbook.
  - Output:
    - workbook

Endpoint: /v1/workbooks/get-pic (GET)
  - Input:
    - workbookName: string (passed as a query param)
    - picFilename: string (passed as a query param)
  - Processing
    - Find and read the encodedImage in file:  MOUNT_DIR/users/{slug}/workbooks/{workbookName}/{picFilename}
  - Output:
    - encodedImage

Endpoint: /v1/workbooks/get-workbook (GET)
  - Input:
    - workbookName: string (passed as a query param)
  - Processing
    - None
  - Output:
    - workbookType

Endpoint: /v1/workbooks/list-workbooks (GET)
- Input:
  - None
- Processing
  - Construct an array of workbooks by simply reading the workbook.json files.
- Output:
  - workbooks: WorkbookType[]
        
Some miscellaneous stuff:

The Express JSON body size limit is set to 20mb to accommodate base64-encoded image uploads.

The backend uses the standard redis client library -- not ioredis

The Redis client must have tls: true in the socket config for production. ElastiCache Serverless
requires TLS. However, local Redis does not support TLS. Set tls conditionally:

    const isLocal = config.redisHost === 'localhost' || config.redisHost === '127.0.0.1'
    tls: !isLocal

The path for workbooks is: MOUNT_DIR/users/{slug}/workbooks/{workbookName}/

MOUNT_DIR may begin with ~. Tilde is not expanded when bash assigns environment variables from
jq output, so the backend must expand it explicitly: replace a leading ~ with os.homedir()
before constructing any file path.

At initialization, the backend server creates MOUNT_DIR/users if it does not exist.

The backend also serves the frontend static files in production. After the API routes, the
server adds express.static pointing at path.join(__dirname, '../../frontend/dist'). After
that, a catch-all GET * route serves index.html from the same dist directory, so that
client-side routing works when users load a URL directly.

The start.sh builds the frontend before starting the server. Because Vite bakes environment
variables into the JS bundle at build time, the start.sh must read the frontend config and
export VITE_COGNITO_AUTHORITY and VITE_COGNITO_CLIENT_ID before running the frontend build.
The frontend config paths are the same as in frontend/start.sh: ~/lucy-config/FrontendLocalConfig.json
on MacOS and /mount/lucy-config/FrontendProdConfig.json on Linux.

After setting the VITE vars, it runs:

    cd "$SCRIPT_DIR/../frontend"
    npm run build

Then cds back to SCRIPT_DIR before starting the server.

`
