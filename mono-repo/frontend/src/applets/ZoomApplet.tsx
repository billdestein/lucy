import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'

export function ZoomApplet(props: AppletProps) {
    const { encodedImage, mimeType } = props.message as { encodedImage: string; mimeType: string }
    const dataUrl = `data:${mimeType};base64,${encodedImage}`

    return (
        <Frame
            height={props.height}
            isModal={props.isModal}
            width={props.width}
            x={props.x}
            y={props.y}
            zIndex={props.zIndex}
            title="Zoom"
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
                    width: '100%',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                <img
                    src={dataUrl}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
            </div>
        </Frame>
    )
}
