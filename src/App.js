import {useState} from 'react'
import Home from './Homes'
import {ToastContainer, Zoom} from 'react-toastify';

import {Client} from 'boardgame.io/react'
import {SocketIO} from 'boardgame.io/multiplayer'

import {ConfrontationVariant} from './Game.tsx'
import {ConfrontationBoard} from './Board.tsx'

const isProd = true

const ConfrontationClient = Client({
    game: ConfrontationVariant,
    board: ConfrontationBoard,
    multiplayer: SocketIO({
        server: isProd ? 'https://confrontationserver.onrender.com' : 'localhost:1234',
    }),
    loading: () => <div>What are the odds this VARIANT lags out and fails?...</div>
})

const generateMatchId = () => {
    return Math.random().toString(36).substring(2, 5).toLowerCase()
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
                        onCreate={(isPlayer2) => {
                            const newMatchId = generateMatchId()
                            alert(`Share this Match ID with Player 2: ${newMatchId}${isPlayer2 ? '0' : '1'}`)
                            setMatchId(newMatchId)
                            setPlayerId(isPlayer2 ? '1' : '0')
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
                <ConfrontationClient matchID={matchId} playerID={playerId} debug={!isProd}/>
            )}
        </div>
    )
}


export default App
