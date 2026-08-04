import React, { useEffect, useState } from 'react'
import './Loading.css'

const DEFAULT_MESSAGES = [
  'Reading the strategy scrolls of Minas Arnor',
  'Awakening the Game Server',
  'Drums, drums in the deep',
  'Pondering shadows in the dark',
  'Consulting maps drawn in eldar days',
  'Awakening the Game Server',
  'Kindling the beacons',
  'Packing provisions for the game',
  'Casting counters to Morgul spells',
  'Awakening the Game Server',
  'Listening for whispers of Confrontation',
  'Seeking forgotten paths through the wild',
]

export default function JourneyLoadingScreen({
  messages = DEFAULT_MESSAGES,
  messageInterval = 2800,
  progress,
}) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (messages.length <= 1) {
      return undefined
    }

    let transitionTimeout

    const interval = window.setInterval(() => {
      setIsChanging(true)

      transitionTimeout = window.setTimeout(() => {
        setMessageIndex((currentIndex) => {
          return (currentIndex + 1) % messages.length
        })

        setIsChanging(false)
      }, 300)
    }, messageInterval)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(transitionTimeout)
    }
  }, [messages, messageInterval])

  const currentMessage = messages[messageIndex] || 'Preparing for the journey'

  const normalizedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(progress, 100)) : null

  return (
    <main className="journey-loading-screen" aria-label="Game loading" aria-busy="true">
      <div className="journey-loading-moon" aria-hidden="true" />
      <div className="journey-loading-mountains" aria-hidden="true" />
      <div className="journey-loading-ground" aria-hidden="true" />

      <section className="journey-loading-area" aria-hidden="true">
        <div className="scene" aria-hidden="true">
          <svg viewBox="0 0 900 200" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="40"
              y1="172"
              x2="860"
              y2="172"
              stroke="rgba(216,196,143,.12)"
              strokeWidth="1"
            />
            <g className="fellowship" fill="#000">
              {/* Gandalf — pointed hat + staff */}
              <g className="walker">
                <line x1="97" y1="172" x2="97" y2="96" stroke="#000" strokeWidth="3" />
                <circle cx="97" cy="93" r="3" />
                <polygon points="103,86 127,86 115,56" />
                <rect x="107" y="84" width="16" height="4" />
                <circle cx="115" cy="92" r="8" />
                <polygon points="105,100 125,100 131,172 99,172" />
              </g>

              {/* hobbits */}
              <g className="walker">
                <circle cx="185" cy="132" r="8" />
                <polygon points="177,140 193,140 198,172 172,172" />
              </g>
              <g className="walker">
                <circle cx="250" cy="130" r="8" />
                <polygon points="242,138 258,138 263,172 237,172" />
              </g>
              <g className="walker">
                <circle cx="315" cy="133" r="7" />
                <polygon points="308,140 322,140 327,172 303,172" />
              </g>
              <g className="walker">
                <circle cx="378" cy="131" r="8" />
                <polygon points="370,139 386,139 391,172 365,172" />
              </g>

              {/* Aragorn — man with sword  (shifted -22) */}
              <g className="walker">
                <circle cx="448" cy="98" r="9" />
                <polygon points="439,107 457,107 464,172 432,172" />
                <line x1="444" y1="115" x2="480" y2="75" stroke="#000" strokeWidth="2" />
              </g>

              {/* Boromir — man with shield  (shifted -22) */}
              <g className="walker">
                <circle cx="523" cy="100" r="9" />
                <polygon points="514,109 532,109 539,172 507,172" />
                <circle cx="511" cy="138" r="9" />
              </g>

              {/* Legolas — slim elf with bow  (shifted -42) */}
              <g className="walker">
                <circle cx="578" cy="96" r="7" />
                <polygon points="572,103 584,103 588,172 568,172" />
                <path d="M588 108 q14 30 0 60" fill="none" stroke="#000" strokeWidth="2" />
                <line x1="588" y1="108" x2="588" y2="168" stroke="#000" strokeWidth="1" />
              </g>

              {/* Gimli — short, stout, bearded, axe  (shifted -42) */}
              <g className="walker">
                <circle cx="650" cy="126" r="9" />
                <polygon points="641,132 659,132 650,150" />
                <polygon points="636,134 664,134 670,172 630,172" />
                <line x1="631" y1="172" x2="631" y2="120" stroke="#000" strokeWidth="3" />
                <path d="M631 122 q-14 2 -16 12 q2 10 16 12 q-6 -12 0 -24 Z" />
              </g>
            </g>
          </svg>
        </div>
      </section>

      <footer className="journey-loading-copy">
        <p
          className={`journey-loading-status ${
            isChanging ? 'journey-loading-status-changing' : ''
          }`}
          aria-live="polite"
        >
          {currentMessage}
          <span className="journey-loading-dots">...</span>
        </p>

        <div
          className={
            normalizedProgress === null
              ? 'journey-loading-progress journey-loading-progress-indeterminate'
              : 'journey-loading-progress'
          }
          role={normalizedProgress === null ? undefined : 'progressbar'}
          aria-valuemin={normalizedProgress === null ? undefined : 0}
          aria-valuemax={normalizedProgress === null ? undefined : 100}
          aria-valuenow={normalizedProgress === null ? undefined : normalizedProgress}
        >
          <div
            className="journey-loading-progress-bar"
            style={normalizedProgress === null ? undefined : { width: `${normalizedProgress}%` }}
          />
        </div>
      </footer>
    </main>
  )
}
