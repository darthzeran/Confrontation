import React, {useState} from 'react'
import './Home.css'

export default function Home({onCreate, onJoin}) {
    const [showModal, setShowModal] = useState(true)
    const [selectedOption, setSelectedOption] = useState(null)
    // const [mode, setMode] = useState('DRAFT')
    const mode = 'DRAFT'

    const getText = (txt) => mode === 'CLASSIC' ? txt : mode === 'VARIANT' ?  <i>{txt}</i> : <strong>{txt}</strong>

    const handleChoice = (choice) => {
        setSelectedOption(choice)
        // Simulate game start after choice
        setTimeout(() => {
            onCreate(choice === 'good', mode)
            setShowModal(false)
        }, 1000)
    }

    return (
        <div className="game-home">
            <header className="game-banner">
                <div className="banner-content">
                    <h1 className="banner-title">{getText('LOTR: The DRAFT')}</h1>
                    <div className="banner-subtitle">
                        <span className="good-text">{getText('The Fellowship')}</span>
                        <span className="vs">{getText('VS')}</span>
                        <span className="evil-text">{getText('Sauron')}</span>
                    </div>
                </div>
            </header>
            <main className="game-main">
                {showModal && (<div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{getText('Choose Your Side')}</h2>
                            <form
                                className={'joinMatchDiv'}
                                onSubmit={(e) => {
                                    e.preventDefault() // Prevent page refresh
                                    const room = document.getElementById('joinMatchId').value
                                    if (room && room.length === 4) {
                                        onJoin(room.toLowerCase())
                                    }
                                }}
                            >
                                <input id="joinMatchId" placeholder={'Enter Match ID'} autoFocus={true}/>
                                <button id="joinMatchBtn">
                                    {getText('Join Lobby')}
                                </button>
                            </form>
                        </div>

                        <div className="choice-container">
                            <button
                                className={`choice-btn good-btn ${selectedOption === 'good' ? 'selected' : ''}`}
                                onClick={() => handleChoice('good')}
                            >
                                <div className="choice-icon"></div>
                                <div className="choice-content">
                                    <h3>{getText('The Fellowship')}</h3>
                                    <p>{getText('Begin with light and hope')}</p>
                                </div>
                            </button>

                            <div className="or-divider">
                                <span>{getText('OR')}</span>
                            </div>

                            <button
                                className={`choice-btn evil-btn ${selectedOption === 'evil' ? 'selected' : ''}`}
                                onClick={() => handleChoice('evil')}
                            >
                                <div className="choice-icon">️</div>
                                <div className="choice-content">
                                    <h3>{getText('Sauron')}</h3>
                                    <p>{getText('Embrace darkness and power')}</p>
                                </div>
                            </button>
                        </div>

                        {selectedOption ? (<div className="choice-feedback">
                            <p className="choice-message">
                                {getText(<>
                                    You{' '}
                                    <strong>
                                        {selectedOption === 'good' ? 'fight with The Fellowship' : 'serve Sauron'}
                                    </strong>
                                    ...
                                </>)}

                            </p>
                            <div className="loading-dots">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        </div>) : (
                            <div style={{color: 'white', textAlign: 'center', cursor: 'pointer'}}>
                                {/*<div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>*/}
                                {/*    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>*/}
                                {/*        <input*/}
                                {/*            type="checkbox"*/}
                                {/*            checked={mode === 'CLASSIC'}*/}
                                {/*            onChange={(e) => setMode('CLASSIC')}*/}
                                {/*        />*/}
                                {/*        <span>Classic</span>*/}
                                {/*    </label>*/}
                                {/*    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>*/}
                                {/*        <input*/}
                                {/*            type="checkbox"*/}
                                {/*            checked={mode === 'VARIANT'}*/}
                                {/*            onChange={(e) => setMode('VARIANT')}*/}
                                {/*        />*/}
                                {/*        <span>Variant</span>*/}
                                {/*    </label>*/}
                                {/*    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>*/}
                                {/*        <input*/}
                                {/*            type="checkbox"*/}
                                {/*            checked={mode === 'DRAFT'}*/}
                                {/*            onChange={(e) => setMode('DRAFT')}*/}
                                {/*        />*/}
                                {/*        <span>Draft</span>*/}
                                {/*    </label>*/}
                                {/*</div>*/}
                        </div>
                        )}
                    </div>
                </div>)}

                {/* Background Elements */}
                <div className="background-elements">
                    <div className="light-side"></div>
                    <div className="dark-side"></div>
                </div>
            </main>
        </div>
    )
}

