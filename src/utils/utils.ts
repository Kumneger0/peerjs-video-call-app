import { DataConnection } from "peerjs"

type config = {
    id: string
    onDisconnct: (uid: string) => void
}

const handleUserStateEvent = (conn: DataConnection, { id, onDisconnct }: config) => {
    conn.on('iceStateChanged', (state) => {
        if (state == 'disconnected') {
            onDisconnct(id)
        }
    })
    conn.on('close', () => {
        onDisconnct(id)
    })
    conn.on('error', (err) => {
        console.error(err)
    })
}




const callToRemote = (conn: DataConnection, { id }: Partial<config>) => {
    if (window.localStream) {
        console.log('hello', id)
    }
}






export { handleUserStateEvent, callToRemote }