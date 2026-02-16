import React, { useState } from 'react'
import './Home.css'

function Home({ onCreate, onJoin }) {
    const [showModal, setShowModal] = useState(true)
    const [selectedOption, setSelectedOption] = useState(null)

    const handleChoice = (choice) => {
        setSelectedOption(choice)
        // Simulate game start after choice
        setTimeout(() => {
            onCreate(choice === 'good')
            setShowModal(false)
        }, 500)
    }

    return (
        <div className="game-home">
            <header className="game-banner">
                <div className="banner-content">
                    <h1 className="banner-title"><i>LOTR: The Variation</i></h1>
                    <div className="banner-subtitle">
                        <span className="good-text"><i>The Fellowship</i></span>
                        <span className="vs">VS</span>
                        <span className="evil-text"><i>Sauron</i></span>
                    </div>
                </div>
            </header>

            <main className="game-main">
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2 className="modal-title"><i>Choose Your Side</i></h2>
                                <form
                                    className={'joinMatchDiv'}
                                    onSubmit={(e) => {
                                        e.preventDefault() // Prevent page refresh
                                        onJoin(document.getElementById('joinMatchId').value)
                                    }}
                                >
                                    <input id="joinMatchId" placeholder="Enter Match ID" />
                                    <button
                                        id="joinMatchBtn"
                                        onClick={() => onJoin(document.getElementById('joinMatchId').value.toLowerCase())}
                                    >
                                    <i>Join Lobby</i>
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
                                        <h3><i>The Fellowship</i></h3>
                                        <p><i>Begin with light and hope</i></p>
                                    </div>
                                </button>

                                <div className="or-divider">
                                    <span><i>OR</i></span>
                                </div>

                                <button
                                    className={`choice-btn evil-btn ${selectedOption === 'evil' ? 'selected' : ''}`}
                                    onClick={() => handleChoice('evil')}
                                >
                                    <div className="choice-icon">️</div>
                                    <div className="choice-content">
                                        <h3><i>Sauron</i></h3>
                                        <p><i>Embrace darkness and power</i></p>
                                    </div>
                                </button>
                            </div>

                            {selectedOption && (
                                <div className="choice-feedback">
                                    <p className="choice-message">
                                        You{' '}
                                        <strong>
                                            {selectedOption === 'good' ? 'fight with The Fellowship' : 'serve Sauron'}
                                        </strong>
                                        ...
                                    </p>
                                    <div className="loading-dots">
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                        <div className="dot"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Background Elements */}
                <div className="background-elements">
                    <div className="light-side"></div>
                    <div className="dark-side"></div>
                </div>
            </main>
        </div>
    )
}

export default Home
