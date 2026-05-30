import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'

// Stub — full implementation deferred to a later session.
export function UploadWorkbookApplet(props: AppletProps) {
    return (
        <Frame
            height={props.height}
            isModal={props.isModal}
            width={props.width}
            x={props.x}
            y={props.y}
            zIndex={props.zIndex}
            title="Upload Workbook"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    tooltipLabel="Close"
                    handler={() => removeApplet(props.appletId)}
                />
            }
        >
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dddddd',
                    fontFamily: 'sans-serif',
                }}
            >
                UploadWorkbookApplet
            </div>
        </Frame>
    )
}
