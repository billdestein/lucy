//----------------------------------------------------------------------------------------------------
// architecture
//----------------------------------------------------------------------------------------------------
export const architecture = `

Lucy is a tool for generating, mutating and combining images.

The code for Lucy will be organized within a mono-repo called @billdestein/joy.  

The mono-repo will have these sub-repos: 
    - applets
    - backend
    - common
    - frontend

The frontend code will use Vite, Typescript, idb-keyval, and React.

The backend code will use Typescript, Node, Express and AWS Cognito.

The common code will use Typescript.

Redis is used for the session id store.

## The architecture

The backend server runs on MacOS (in development mode) or one or more EC2 Linux instances (in production).

The EC2 instances are behind an ALB.  

The ALB is configured for sticky sessions.

ALl of the EC2 instances mount the same directory on the same EFS network file server.  We'll call that directory 'mount'.

Under the 'mount' directory is a single 'users' directory.

Under the 'users' directory is a directory for each user.  The name of that directory is a slug of the user's email address.  We call that the user's 'root' directory.

Under the user's root directory is the user's 'workbooks' directory.

The user's workbooks directory has a directory for each workbook -- the name of the directory matches the name of the workbook. 

Each workbook directory has a single workbook.json file, and some number of image files.

The frontend uses idb-keyval to cache images and prevent sending across the network multiple times.

The keys for idb-keyval look like '/workbook.workbookName/pic.filename/pic.mimeType/pic.createdAt'

Initially, Lucy supports jpeg and png image files.
`
