\//----------------------------------------------------------------------------------------------------
// promptProtocol
//----------------------------------------------------------------------------------------------------
export const promptProtocol = `

A prompt that the frontend sends to the backend is largely free-form text with a few
exceptions.

The prompt may include comments and includes at least one command.

A comment is a line starting with '//'.  

A command is a line starting with '--'.  They available commands are:

    -- save as <PicType.filename>
    -- using <PicType.filename>

The backend's generate-pic endpoint expects these three inputs:

    - referencedPics: PicType[]
    - outputFilename
    - workbook: WorkbookType

The user specifies the referencedPics using the -- using command.

The frontend searches through the focused PromptType.text fields, 
finds the using commands, finds the filenames, and uses the filenames 
to find the corresponding PicType objects.  These PicType objects 
are sent to the backend as ReferencedPics.

The user specifies the outputFilename using the -- save as command

The user can insert the '-- save as' command when editing a PromptType.  If not, the frontend
prompts the user for an output filename using a PromptApplet.

Once the --save as and --using commands have found and handled, all comments and all
commands are removed from the PromptType.text before sending to the backend.

Multi-modal prompts are those that reference one or more PicTypes.

A multi-modal prompt references a PicType by putting the PicType.filename in curly braces 
in the prompt text.

For example:

    Show me {dog} playing with {soccer ball}


`
