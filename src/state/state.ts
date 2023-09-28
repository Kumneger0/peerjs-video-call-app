import { atom } from 'jotai'

import { Peer } from 'peerjs'

const peerAtom = atom<Peer | null>(null)



export { peerAtom }