import {useState} from 'react'
import Home from './Homes'
import {ToastContainer, Zoom} from 'react-toastify';

import {Client} from 'boardgame.io/react'
import {SocketIO} from 'boardgame.io/multiplayer'

import {ConfrontationDraft} from "./Draft.tsx";
import {ConfrontationBoard} from './Board.tsx'

const isProd = true

const ConfrontationDraftClient = Client({
    game: ConfrontationDraft,
    board: ConfrontationBoard,
    multiplayer: SocketIO({
        server: isProd ? 'https://confrontationserver.onrender.com' : 'localhost:1234',
    }),
    loading: () => <div>What are the odds this DRAFT lags out and fails?...</div>
})

const generateMatchId = () => {
    return Math.random().toString(36).substring(2, 4).toLowerCase()
}

const App = () => {
    const [matchId, setMatchId] = useState('')
    const [playerId, setPlayerId] = useState('')

    return (
        <div>
            <ToastContainer
                position="bottom-right"
                autoClose={3500}
                limit={2}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover
                theme="colored"
                transition={Zoom}
            />
            {!matchId ? (
                <div>
                    <Home
                        onCreate={async (isEvil, mode) => {
                            const newMatchId = (mode === 'CLASSIC' ? 'a' : mode === 'VARIANT' ? 'b' : 'c') + generateMatchId()
                            await navigator.clipboard.writeText(`${newMatchId}${isEvil ? '0' : '1'}`);
                            setMatchId(newMatchId)
                            setPlayerId(isEvil ? '1' : '0')
                        }}
                        onJoin={(roomCode) => {
                            const code = roomCode.substring(0, roomCode.length - 1)
                            const player = roomCode.substring(roomCode.length - 1)

                            if (!code) {
                                alert('Please enter a Match ID')
                                return
                            }
                            setMatchId(code)
                            setPlayerId(player)
                        }}
                    />
                </div>
            ) : (
                <ConfrontationDraftClient matchID={matchId} playerID={playerId} debug={!isProd}/>
            )}
        </div>
    )
}


export default App
