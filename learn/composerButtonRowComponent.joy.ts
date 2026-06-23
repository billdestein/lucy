//----------------------------------------------------------------------------------------------------
// composerButtonRowComponent
//----------------------------------------------------------------------------------------------------
export const composerButtonRowComponent = `

The ComposerButtonRowComponent takes a single prop: editorText (string).  It reads
workbook, setWorkbook, setIsLoading, and setSelectedPicFilename from WorkbookContext
via useWorkbook().  It uses stripForBackend before sending a workbook to the backend,
and hydrateFromBackend after receiving one.

The ComposerButtonRowComponent has two child components:  The paginator and the play button.

The paginator is a rectangular region centered in the ComposerButtonRowComponent.  
Left to right it has a 'previous button', {index}, 'of', {count}, 'next button'.

The previous button is:

{
    icon: ButtonIcons.previous
    toolTipLabel: 'Previous Prompt'
    Handler: previousButtonHandler (see details below)
}

The next button is:

{
    icon: ButtonIcons.next
    toolTipLabel: 'Next Prompt'
    Handler: nextButtonHandler (see details below)
}

{index} is one plus the index of the currently visible (focused) prompt within the workbook's
prompts.  If no prompt is focused, {index} defaults to 1.

{count} is the number of prompts in the workbook's prompts array.

The prevviousButtonHandler finds the focused prompt, marks it unfocused, finds the
previous prompt (if there is one), marks it focused, and rerenders.

The next ButtonHandler finds the focused prompt, marks it unfocused, finds the
next prompt (if there is one), marks it focused, and rerenders.

The 'play' button is:

{
    icon: ButtonIcons.play
    toolTipLabel: 'Run Prompt'
    Handler: runPromptHandler (see details below)
}

See promptProtocol.joy.ts for details on how to prepare a prompt for 
sending from the frontend to the backend.

Before calling generate-pic, build a clean prompts array:
- Filter out any empty prompts (text.trim() === '') from workbook.prompts.
- Set all remaining prompts unfocused.
- Append a new PromptType { createdAt: Date.now(), focused: true, text: editorText } at the end.
This preserves non-empty history unchanged and avoids corrupting history when the user
navigates back to an earlier prompt, edits it, and runs it.

When the generate-pic response is received:
- Hydrate the returned workbook via hydrateFromBackend.
- Filter out any empty prompts from hydrated.prompts, set all remaining unfocused.
- Append a new empty focused prompt { createdAt: Date.now(), focused: true, text: '' } at the end.
- Call setWorkbook with the final workbook.
- Call setSelectedPicFilename(finalWorkbook.focusedPicFilename ?? 'empty').

The final prompts order after a run is: [...non-empty history, copy-of-what-ran, empty-focused].
Empty prompts never accumulate in history — only the rightmost (current input) prompt is ever empty.

`
