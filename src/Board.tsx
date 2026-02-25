import './Board.css'
import {useEffect, useState} from 'react'
import {
    BAD_INDEXES,
    EVIL_CHARS,
    GOOD_CHARS,
    EVIL_CARDS,
    EVIL_SPECIAL_CARDS,
    GOOD_CARDS,
    GOOD_INDEXES,
    GOOD_SPECIAL_CARDS, GOOD_NAMES, CLASSIC_GOOD_CHARS, CLASSIC_EVIL_CHARS, VARIANT_GOOD_CHARS, VARIANT_EVIL_CHARS,
} from './consts.ts'
import {PIECE_IMAGES} from './imgs'
import {toast} from 'react-toastify'
import {Character, CharacterMap, GState, Location} from './types';

function getIsGood(id: string) {
    return id === '1'
}

function charTypeTag(char: Character, mode: string, parens: boolean) {
    if (mode === 'DRAFT') {
        const ID = char.classic ? 'C' : 'V'
        if (parens) {
            return `(${ID})`
        }
        return ID
    }
    return ''
}

function getChars({mode, good}: { mode: string, good: boolean }): CharacterMap {
    if (mode === 'CLASSIC') {
        return good ? CLASSIC_GOOD_CHARS : CLASSIC_EVIL_CHARS
    } else if (mode === 'VARIANT') {
        return good ? VARIANT_GOOD_CHARS : VARIANT_EVIL_CHARS
    } else {
        return good ? GOOD_CHARS : EVIL_CHARS
    }
}

function getMode(matchId: string) {
    return matchId?.[0] === 'a' ? 'CLASSIC' : matchId?.[0] === 'b' ? 'VARIANT' : 'DRAFT'
}


export function ConfrontationBoard({ctx, G, moves, playerID, matchID}: {
    G: GState,
    playerID: string,
    matchID: string,
    ctx: any,
    moves: any
}) {
    console.log(G)
    useEffect(() => {
        if (G.messages?.length > 0) {
            toast.success(<div dangerouslySetInnerHTML={{__html: G.messages.join('<br />')}}/>)
        }
    }, [G.messages])

    useEffect(() => {
        moves.setMatchId(matchID)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchID])

    return (
        <div className="app">
            <header className="header">
        <span>
          GAMEID-{' '}
            <strong>
            {matchID}
                {playerID === '0' ? '1' : '0'}
          </strong>
        </span>
            </header>

            <div className="main-container">
                <LeftPanel
                    phase={ctx.phase}
                    myTurn={ctx?.currentPlayer === playerID}
                    playerID={playerID}
                    G={G}
                    moves={moves}
                    ctx={ctx}
                />

                <main className="main-content">
                    {getBoard({
                        phase: ctx.phase,
                        tiles: Object.values(G.regions),
                        isGood: getIsGood(playerID),
                        myTurn: ctx?.currentPlayer === playerID,
                        moves,
                        G,
                        ctx,
                    })}
                    <Deaths isGood={getIsGood(playerID)} G={G}/>
                </main>

                <RightPanel history={G.history.toReversed()} G={G}/>
            </div>
        </div>
    )
}

function RightPanel({history, G}: { history: string[], G: GState }) {
    const [panel, setPanel] = useState(null)
    const [detail, setDetail] = useState(null)
    const [card, setCard] = useState(null)

    return (
        <aside className={`right-panel`}>
            <h2 onClick={() => {
                if (detail || card) {
                    setCard(null)
                    setDetail(null)
                } else {
                    setPanel(null)
                }
            }}
                className={'right-panel-title'}
            >
                {!panel && 'Help Desk'}
                {panel && (<BackArrow/>)}
                {panel === 'RULES' && 'Rules'}
                {panel === 'FELLOWSHIP' &&
                    `${detail ? `${detail.name} (${detail.value})` : 'Good Characters'}`}
                {panel === 'GOOD' && 'Good Cards'}
                {panel === 'GOODSPECIAL' && 'Good Special Cards'}
                {panel === 'SAURON' && `${detail ? `${detail.name} (${detail.value})` : 'Evil Characters'}`}
                {panel === 'EVIL' && 'Evil Cards'}
                {panel === 'EVILSPECIAL' && 'Evil Special Cards'}
                {panel === 'HISTORY' && 'History'}
            </h2>
            <div className={`right-content  ${panel ? 'tall' : ''}`}>
                {!panel && (
                    <>
                        <div className="info-box" onClick={() => setPanel('RULES')}>
                            Rules
                        </div>
                        <div className="info-box" onClick={() => setPanel('FELLOWSHIP')}>
                            Good Characters
                        </div>
                        <div className="info-box" onClick={() => setPanel('GOOD')}>
                            Good Cards
                        </div>
                        <div className="info-box" onClick={() => setPanel('GOODSPECIAL')}>
                            Good Special Cards
                        </div>
                        <div className="info-box" onClick={() => setPanel('SAURON')}>
                            Evil Characters
                        </div>
                        <div className="info-box" onClick={() => setPanel('EVIL')}>
                            Evil Cards
                        </div>
                        <div className="info-box" onClick={() => setPanel('EVILSPECIAL')}>
                            Evil Special Cards
                        </div>
                        <div className="info-box" onClick={() => setPanel('HISTORY')}>
                            Game History
                        </div>
                    </>
                )}

                {panel === 'RULES' && (
                    <div onClick={() => setPanel(null)}>
                        <a
                            href={
                                'https://images-cdn.fantasyflightgames.com/filer_public/e0/a4/e0a441fd-ea5a-4f0e-8571-1f89fee6f853/kn22_rulebook_web.pdf'
                            }
                            target={'_blank'}
                            rel="noopener noreferrer"
                        >
                            RULES
                        </a>
                        <p style={{marginTop: '1rem'}}>- If you cannot move you LOSE</p>
                        <p>- GOOD wins if Frodo (Sam if Variant Frodo dies) enters Mordor</p>
                        <p>- EVIL wins if 3 characters enter The Shire OR Frodo dies</p>
                        <p>- OR if the Variant Witch King enters The Shire</p>
                    </div>
                )}
                {panel === 'FELLOWSHIP' && (
                    <ShowChars
                        detail={detail}
                        setDetail={setDetail}
                        chars={Object.values(GOOD_CHARS).filter((char: Character) => G.characters[char.id])}
                        mode={getMode(G.matchID)}
                    />
                )}
                {panel === 'GOOD' && (
                    <ShowCards
                        card={card}
                        setCard={setCard}
                        cards={GOOD_CARDS}
                    />
                )}
                {panel === 'GOODSPECIAL' && (
                    <ShowCards
                        card={card}
                        setCard={setCard}
                        cards={GOOD_SPECIAL_CARDS}
                        special={true}
                    />
                )}
                {panel === 'SAURON' && (
                    <ShowChars
                        detail={detail}
                        setDetail={setDetail}
                        chars={Object.values(EVIL_CHARS).filter((char: Character) => G.characters[char.id])}
                        mode={getMode(G.matchID)}
                    />
                )}
                {panel === 'EVIL' && (
                    <ShowCards
                        card={card}
                        setCard={setCard}
                        cards={EVIL_CARDS}
                    />

                )}
                {panel === 'EVILSPECIAL' && (
                    <ShowCards
                        card={card}
                        setCard={setCard}
                        cards={EVIL_SPECIAL_CARDS}
                        special={true}
                    />

                )}
                {panel === 'HISTORY' && (
                    <div className={'history-holder'}>
                        <div className={'history'}>{history.map((item: string) => {
                            return <div>- {item}</div>
                        })}
                            <div><i>Start of Game History</i></div>
                        </div>

                    </div>
                )}
            </div>
        </aside>
    )
}

function ShowChars({detail, setDetail, chars, mode}) {
    return (
        <>
            {detail ? (
                <div
                    className={'detailsPanel detailList'}
                    onClick={(e) => {
                        e.stopPropagation()
                        setDetail(null)
                    }}
                >
                    <div className={'rightImgWrapper'}>
                        <img className={'charImg'} src={PIECE_IMAGES[detail.id]} alt={detail.id}/>
                    </div>
                    <p className={'charDescrip'}>
                        {detail.description}
                        <span>(Click to close)</span>
                    </p>
                </div>
            ) : (
                <div className={'characterList'}>
                    {chars.map((char: Character) => {
                        return (
                            <div className={`character right`} key={'detailer-' + char.id}
                                 onClick={e => e.stopPropagation()}
                            >
                                <div className={'imgWrapper'}>
                                    <img className={'charImg'} src={PIECE_IMAGES[char.id]} alt={char.id}/>
                                </div>
                                <div className={'charDetails'}>
                                  <span>
                                    {char.name}{charTypeTag(char, mode, true)} ({char.value})
                                  </span>
                                    <button
                                        className={'detailButton'}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDetail(char)
                                        }}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}

function ShowCards({card, setCard, cards, special = false}) {
    return (
        <div className={'cardsDiv'}>
            {card ? special ? (
                <div
                    className={'cardFullDetails'}
                    onClick={(e) => {
                        e.stopPropagation()
                        setCard(null)
                    }}
                >
                    <div>{card.title}</div>
                    <hr/>
                    <br/>
                    <p>
                        {card.full}
                    </p>
                </div>
            ) : (
                <div
                    className={'cardFullDetails'}
                    onClick={(e) => {
                        e.stopPropagation()
                        setCard(null)
                    }}
                >
                    <div>{card.type === 'strength' ? `Power +${card.value}` : card.title}</div>
                    <hr/>
                    <br/>
                    <p>
                        {card.type === 'strength'
                            ? `Add ${card.value} to the power of your character`
                            : card.full}
                    </p>
                </div>
            ) : (
                cards.map((card) => {
                    if (card.type === 'strength') {
                        return (
                            <div key={'detail strength-' + card.value} className={'cardDetail'}
                                 onClick={(e) => {
                                     e.stopPropagation()
                                 }}
                            >
                                <div>Power +{card.value}:</div>
                                <div>{card.type} card</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setCard(card)
                                    }}
                                >
                                    Details
                                </button>
                            </div>
                        )
                    } else if (special) {
                        // TODO special CSS
                        return (
                            <div key={`detail text-${card.title}`} className={'cardDetail'}
                                 style={{textAlign: 'center', height: 'fit-content'}}>
                                <div>{card.title}:</div>
                                <div>{card.description}</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setCard(card)
                                    }}
                                >
                                    Details
                                </button>
                            </div>
                        )
                    }
                    return (
                        <div key={`detail text-${card.title}`} className={'cardDetail'}>
                            <div>{card.title}:</div>
                            <div>{card.type} card</div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCard(card)
                                }}
                            >
                                Details
                            </button>
                        </div>
                    )
                })
            )}
        </div>
    )
}

function Deaths({G, isGood}: {
    G: GState,
    isGood: boolean,

}) {
    const mode = getMode(G.matchID)
    const myChars = Object.keys(getChars({mode, good: isGood}))
    const enemyChars = Object.keys(getChars({mode, good: !isGood}))

    const deadAllies = myChars.filter((name) => G.characters[name]?.defeated)
    const deadEnemies = enemyChars.filter((name) => G.characters[name]?.defeated)
    return (
        <>
            <div className={'deathDiv'}>
                {deadEnemies.map((name) => {
                    return (
                        <img
                            key={'dead' + name}
                            className={`deathImg`}
                            src={PIECE_IMAGES[name]}
                            alt={'dead-' + name}
                            title={name}
                        />
                    )
                })}
            </div>
            <div className={'myDeathDiv'}>
                {deadAllies.map((name) => {
                    return (
                        <img
                            key={'dead' + name}
                            className={`deathImg`}
                            src={PIECE_IMAGES[name]}
                            alt={'dead-' + name}
                            title={name}
                        />
                    )
                })}
            </div>
        </>
    )
}

function SpecialMoves({tileId}) {
    if (tileId === 3 || tileId === 4) {
        return (
            <>
                <div className={'anduin'}></div>
                {tileId === 4 && <div className={'moriaexit'}></div>}
            </>
        )
    }
    if (tileId === 7) {
        return <div className={'leftmoria'}></div>
    }
    if (tileId === 8) {
        return <div className={'rightmoria'}></div>
    }

    return null
}

function getTile({phase, G, moves, myTurn, isGood, tile, ctx}: {
    phase: string,
    G: GState,
    moves: any,
    myTurn: boolean,
    isGood: boolean,
    tile: Location,
    ctx: any,
}) {
    const mode = getMode(G.matchID)
    const currentOccupants = G.regions?.[tile.title]?.currentOccupants || []
    const charSlots = new Array(Math.max(tile.maxChars - currentOccupants.length, 0)).fill(null)
    const isGoodRetreatMove = ctx.activePlayers?.[ctx.currentPlayer] === 'goodRetreat'
    const isGrimaRetreat = ctx.activePlayers?.[ctx.currentPlayer] === 'grimaRetreat'
    const isBadRetreatMove = ctx.activePlayers?.[ctx.currentPlayer] === 'badRetreat' || isGrimaRetreat
    const isPossibleMove =
        ((myTurn && !isGoodRetreatMove && !isBadRetreatMove) ||
            (isGood && isGoodRetreatMove) ||
            (!isGood && isBadRetreatMove)) &&
        G.validMoves?.includes?.(tile.title)
    const isPalantirRegion = !isGood && (G.palantirRegions || []).includes(tile.title)

    const fighters = [G.attackingChar, G.defendingChar]
    const myTeam = getChars({mode, good: isGood})

    return (
        <div
            className={`tile ${(isPossibleMove || isPalantirRegion) ? 'possibleMove' : ''}`}
            key={tile.title}
            onClick={() => {
                if (G.evilSpecial === 'PALANTIR') {
                    moves.palantirRegion(tile.title)
                } else if (phase === 'place') {
                    moves.placeCharacter(tile.title)
                } else if (phase === 'move') {
                    moves.chooseRegionToMove(tile.title)
                    if (!window?.location?.href?.includes('localhost')) {
                        fetch('https://confrontationserver.onrender.com/health').catch(e => console.error(e))
                    }
                } else if (
                    phase === 'battle' &&
                    ((isGood && isGoodRetreatMove) || (!isGood && isBadRetreatMove))
                ) {
                    moves.chooseRetreatRegion(tile.title)
                }
            }}
        >
            <div className={'tileHeader'}>{tile?.description}</div>
            <div className={`charSlots ${tile.maxChars > 3 ? 'wrap' : ''}`}>
                {currentOccupants.map((name, index) => {
                    const gameOver = Boolean(ctx.gameover)

                    const goodChars = getChars({mode, good: true})
                    const badChars = getChars({mode, good: false})

                    const occupant = G.characters[name]
                    const occupantGood = Boolean(goodChars[name])
                    const canSeeChar =
                        ((occupantGood && isGood) || (!occupantGood && !isGood) || occupant?.reveal) || gameOver
                    const isCrebain = G.evilSpecial === 'CREBAIN' && !isGood && occupantGood


                    const highlight =
                        canSeeChar ?
                            (fighters.includes(occupant.id) || (gameOver && !myTeam[name]))
                                ? occupantGood
                                    ? 'green'
                                    : 'red'
                                : occupant?.permaReveal ? occupantGood ? 'darkgreen' : 'darkred' : ''
                            : occupant?.permaReveal ? occupantGood ? 'darkgreen' : 'darkred' : ''
                    const yellowHighlight = (occupantGood && isGood && G.swapOptions?.includes?.(name)) || isCrebain

                    return (
                        <div
                            className={`imgWrapper  ${tile.maxChars > 3 ? 'small' : ''}`}
                            key={`${tile?.title}-${index}`}
                            title={canSeeChar ? occupant.name : ''}
                            onClick={(e) => {
                                if (G.evilSpecial === 'MORDORRECALL') {
                                    e.stopPropagation()
                                    moves.mordorRecall(occupant.id, tile.title)
                                } else if (G.evilSpecial === 'CREBAIN') {
                                    e.stopPropagation()
                                    moves.crebain(occupant.id)
                                } else if (
                                    G.goodSpecial === 'KING' && badChars[occupant.id]
                                ) {
                                    e.stopPropagation()
                                    moves.kingRevealedChar(occupant.id, tile.title)
                                } else if (phase === 'place') {
                                    e.stopPropagation()
                                    moves.resetChar(occupant.id, tile.title)
                                }
                                if (phase === 'move' && myTurn && canSeeChar && Boolean(myTeam[occupant.id])) {
                                    e.stopPropagation()
                                    moves.chooseCharacterToMove(occupant.id, tile.title)
                                }
                                if (phase === 'battle' && isGood && isGoodRetreatMove && yellowHighlight) {
                                    e.stopPropagation()
                                    moves.chooseSmeagolSwap(occupant.id, tile.title)
                                }
                                if (
                                    phase === 'battle' &&
                                    myTurn &&
                                    G.battle?.[isGood ? '1' : '0'] === 'choose' &&
                                    tile.title === G.attackedTile
                                ) {
                                    e.stopPropagation()
                                    moves.chooseCharacterToAttack(occupant.id)
                                }
                            }}
                        >
                            <img
                                className={`charImg ${yellowHighlight ? 'yellow' : highlight}`}
                                src={PIECE_IMAGES[(canSeeChar || occupant?.permaReveal) ? (occupant.white ? 'GANDALFWHITE' : occupant.id) : occupantGood ? 'FLAG' : 'EYE']}
                                alt={(canSeeChar || occupant?.permaReveal) ? occupant.name : 'Mysterious-' + index}
                            />
                            {highlight && G.defendingChar && fighters.includes(occupant.id) && (
                                <div className={'powerDiv ' + highlight}>{occupant.value}</div>
                            )}
                            {(canSeeChar || occupant?.permaReveal) && (
                                <div className={'typeDiv '}>{charTypeTag(occupant, mode, false)}</div>
                            )}
                        </div>
                    )
                })}
                {charSlots.map((_, index) => {
                    return (
                        <div
                            className={`emptySlot ${tile.maxChars > 3 ? 'small' : ''}`}
                            key={`${tile?.title}-${index}`}
                        ></div>
                    )
                })}
            </div>
            {isGood && myTurn && <SpecialMoves tileId={tile.id}/>}
        </div>
    )
}

function getBoard({G, moves, tiles, phase, myTurn, ctx, isGood}: {
    G: GState,
    moves: any,
    tiles: Location[],
    phase: string,
    myTurn: boolean,
    ctx: any,
    isGood: boolean,
}) {
    const indexes = isGood ? GOOD_INDEXES : BAD_INDEXES
    const regions = []
    for (let i = 0; i < 16; i++) {
        regions.push(getTile({G, ctx, isGood, myTurn, phase, moves, tile: tiles[indexes[i]]}))
    }
    return regions
}

function LeftPlacePiecesPanel({moves, G, iAmGood, playerID}: {
    moves: any,
    G: GState,
    iAmGood: boolean,
    playerID: string,
}) {
    const [detail, setDetail] = useState(null)

    const chars = G.players[playerID].charactersToPlace || []
    const charToPlace = iAmGood ? G.goodCharacterToPlace : G.evilCharacterToPlace
    const isReady = iAmGood ? G.goodReady : G.evilReady
    const mode = getMode(G.matchID)

    return <>
        {detail ? (
            <div className={'detailsPanel'}
                 onClick={() => {
                     if (detail) {
                         setDetail(null)
                     }
                 }}
            >
                <h2 style={{display: 'flex'}}>
                    <BackArrow/>
                    {detail.name} ({detail.value}) Details
                </h2>
                <p className={'charDescrip'}>
                    {detail.description}
                    <span>(Click to close)</span>
                </p>
            </div>
        ) : chars.length > 0 ? (<>
            <h2
                onClick={() => {
                    moves.autoPlace()
                }}>
                Click to place pieces
            </h2>
            <div className={'characterList'}>
                {chars.length < 9 && (
                    <button className={'resetChars'} onClick={() => moves.reset()}>
                        Reset Pieces
                    </button>
                )}
                {chars.map((char: Character) => {
                    return (
                        <div
                            className={`character ${
                                charToPlace === char.id ? (iAmGood ? 'green' : 'red') : ''
                            }`}
                            key={'choose' + char.id}
                            onClick={() => {
                                moves.chooseCharacter(char.id)
                            }}
                        >
                            <div className={'imgWrapper'}>
                                <img className={'charImg'} src={PIECE_IMAGES[char.id]} alt={char.id}/>
                            </div>
                            <div className={'charDetails'}>
                    <span>
                      {char.name}{charTypeTag(char, mode, true)} ({char.value})
                    </span>
                                <button
                                    className={'detailButton'}
                                    onClick={() => {
                                        setDetail(char)
                                    }}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>) : isReady ? 'Awaiting Opponent' : chars.length === 0 ? (
            <div className={'characterList'}>
                <button className={'resetChars'} onClick={() => moves.reset()}>
                    Reset Pieces
                </button>
                <button className={'resetChars'} onClick={() => moves.ready()}>
                    READY
                </button>
            </div>
        ) : ''}
    </>
}

function SpecialCardsSetupPanel({moves, G, iAmGood}: {
    moves: any,
    G: GState,
    iAmGood: boolean
}) {
    const isDefault = G.specialCardDefault
    const numCards = G.specialCardsPer

    const myCards = iAmGood ? GOOD_SPECIAL_CARDS : EVIL_SPECIAL_CARDS
    const theirCards = iAmGood ? EVIL_SPECIAL_CARDS : GOOD_SPECIAL_CARDS
    const cardsToChoose = isDefault ? myCards : theirCards

    const mySelectedCards = G.players[iAmGood ? '1' : '0'].specialCards || []
    const theirSelectedCards = G.players[iAmGood ? '0' : '1'].specialCards || []
    const choosingList = isDefault ? mySelectedCards : theirSelectedCards

    return (
        <>
            <h2>
                {G.chooseSpecials ? 'Choose Special Cards' : iAmGood ? 'Choose Special Card Settings' : 'Awaiting Good'}
            </h2>
            <div className={'characterList'}>
                {!G.chooseSpecials && iAmGood && (
                    <div className={'specialTab'}>
                        <button className={'cardBtn'} onClick={() => moves.chooseCardOption('default')}>
                            Each side choose 2
                        </button>
                        <div>
                            <div>Choose (x) cards for your opponent</div>
                            <div className={'cardCountBtns'}>
                                <button className={'cardBtn'} onClick={() => moves.chooseCardOption(0)}>
                                    0
                                </button>
                                <button className={'cardBtn'} onClick={() => moves.chooseCardOption(1)}>
                                    1
                                </button>
                                <button className={'cardBtn'} onClick={() => moves.chooseCardOption(2)}>
                                    2
                                </button>
                                <button className={'cardBtn'} onClick={() => moves.chooseCardOption(3)}>
                                    3
                                </button>
                                <button className={'cardBtn'} onClick={() => moves.chooseCardOption(4)}>
                                    4
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {G.chooseSpecials && (choosingList.length !== numCards ? (
                    <>
                        <div>Choose {numCards - choosingList.length} card(s) {!isDefault && 'for your opponent'}</div>
                        <div className={'chooseSpecial'}>{cardsToChoose.map(card => {
                            const isSelected = choosingList.some(chosenCard => chosenCard.title === card.title)
                            return <button
                                key={card.title}
                                disabled={isSelected}
                                className={'specialSelectBtn'}
                                onClick={() => moves.chooseCard(card)}
                            >
                                <div>{card.title}-</div>
                                <div>{card.description}</div>
                            </button>
                        })}
                        </div>
                    </>
                ) : (
                    <>
                        <div>Your Chosen Cards</div>
                        <div className={'chooseSpecial'}>{mySelectedCards.map(card => {
                            return <button
                                key={card.title}
                                className={'specialSelectBtn'}
                            >
                                <div>{card.title}-</div>
                                <div>{card.description}</div>
                            </button>
                        })}
                        </div>
                    </>
                ))}
            </div>
        </>
    )
}

function LeftBattlePanel({iAmGood, playerID, G, moves, ctx, myTurn}: {
    moves: any,
    G: GState,
    iAmGood: boolean,
    playerID: string,
    ctx: any,
    myTurn: boolean,
}) {
    const showGoodPreBattleAction =
        iAmGood && ctx.activePlayers?.[playerID] === 'goodAction' && G.goodActions?.length > 0

    const isBadPreBattleAction = ctx.activePlayers?.[playerID] === 'badAction' && G.badActions?.length > 0
    const showBadPreBattleAction =
        !iAmGood && isBadPreBattleAction

    const showRetreatAction = iAmGood && ctx.activePlayers?.[playerID] === 'goodRetreat'
    const isGoodRetreatMove = !iAmGood && ctx.activePlayers?.[playerID] === 'goodRetreat'
    const isBadRetreatMove = iAmGood && ctx.activePlayers?.[playerID] === 'badRetreat'
    const isSarumanChoice = ctx.activePlayers?.[playerID] === 'sarumanCards'
    const isMouthChoice = ctx.activePlayers?.[playerID] === 'mouthCards'
    const isGandalfChoice = ctx.activePlayers?.[playerID] === 'gandalfChoice'
    const isGrimaRetreat = ctx.activePlayers?.[playerID] === 'grimaRetreat'

    const isMagicChoice = ctx.activePlayers?.[playerID] === 'pickMagicCards'
    const pickCards = ctx.activePlayers?.[playerID] === 'pickCards' || isMagicChoice

    const goodCardDetails = G.goodCard
        ? G.goodCard.type === 'text'
            ? G.goodCard.title
            : `Power +${G.goodCard.value}`
        : '-'

    const evilCardDetails = G.evilCard
        ? G.evilCard.type === 'text'
            ? G.evilCard.title
            : `Power +${G.evilCard.value}`
        : '-'

    return <>
        <h2>
            {myTurn && G.battle?.[playerID] === 'choose'
                ? 'Choose a Target'
                : showGoodPreBattleAction || showBadPreBattleAction
                    ? 'Choose an Action'
                    : showRetreatAction
                        ? `Choose a ${G.swapOptions ? 'Character to Swap With' : 'Retreat'}`
                        : (isGoodRetreatMove || isBadRetreatMove)
                            ? 'Opponent is Retreating'
                            : pickCards
                                ? (iAmGood ? G.goodCardLocked : G.evilCardLocked)
                                    ? `You played "${
                                        iAmGood
                                            ? G.goodCard.title || `+${G.goodCard.value}`
                                            : G.evilCard.title || `+${G.evilCard.value}`
                                    }"`
                                    : 'Pick a Card'
                                : isSarumanChoice
                                    ? 'Saruman Ability'
                                    : isMouthChoice
                                        ? 'Mouth of Sauron Ability'
                                        : isGandalfChoice
                                            ? iAmGood
                                                ? 'Gandalf Ability'
                                                : 'Waiting on Opponent'
                                            : isGrimaRetreat
                                                ? 'Grima Ability'
                                                : isBadPreBattleAction
                                                    ? 'Opponent choosing ability'
                                                    : 'Battle'
            }
        </h2>
        <div className={'cardsDiv shrink'}>
            {showGoodPreBattleAction && (
                <div className={'goodActions'}>
                    {G.goodActions.map((action) => {
                        return (
                            <button
                                key={action}
                                className={'goodActionBtn'}
                                onClick={() => moves.chooseGoodAction(action)}
                            >
                                {action}
                            </button>
                        )
                    })}
                </div>
            )}
            {showBadPreBattleAction && (
                <div className={'goodActions'}>
                    < ShowOtherPlayerToggle theirCards={G.players['1'].cards.filter((card) => card.discarded)}/>
                    {G.badActions.map((action) => {
                        return (
                            <button
                                key={action}
                                className={'goodActionBtn'}
                                onClick={() => moves.chooseEvilAction(action)}
                            >
                                {action}
                            </button>
                        )
                    })}
                </div>
            )}
            {isSarumanChoice && iAmGood && <div>Opponent has played {iAmGood ? evilCardDetails : goodCardDetails}</div>}
            {isSarumanChoice && !iAmGood && !G.oldGoodCard && (
                <div className={'goodActions'}>
                    <div>Opponent has played {iAmGood ? evilCardDetails : goodCardDetails}</div>
                    <button
                        className={'goodActionBtn'}
                        onClick={() => moves.goodReselect(true)}
                    >
                        Make Good Choose New Card
                    </button>
                    <button
                        className={'goodActionBtn'}
                        onClick={() => moves.goodReselect(false)}
                    >
                        Fight On
                    </button>
                </div>
            )}
            {isMouthChoice && !iAmGood && (
                <div className={'goodActions'}>
                    <div>Opponent has played {iAmGood ? evilCardDetails : goodCardDetails}</div>
                    <button
                        className={'goodActionBtn'}
                        onClick={() => moves.useMouthChoice(true)}
                    >
                        Replace your card with +4
                    </button>
                    <button
                        className={'goodActionBtn'}
                        onClick={() => moves.useMouthChoice(false)}
                    >
                        Fight On
                    </button>
                </div>
            )}
            {isGandalfChoice && iAmGood && (
                <div className={'goodActions'}>
                    <div>Opponent has played {iAmGood ? evilCardDetails : goodCardDetails}</div>
                    <button
                        className={'goodActionBtn'}
                        onClick={() => moves.useGandalfOption(true)}
                    >
                        Add + 1 to Good Strength
                    </button>
                    <button
                        className={'goodActionBtn'}
                        onClick={() => moves.useGandalfOption(false)}
                    >
                        Fight On
                    </button>
                </div>
            )}

            {pickCards && (
                <CardsDisplay
                    G={G}
                    ctx={ctx}
                    moves={moves}
                    playerID={playerID}
                    iAmGood={iAmGood}
                    isMagicChoice={isMagicChoice}
                />
            )}
            {isSarumanChoice && iAmGood && G.oldGoodCard && (
                <ReselectCardsDisplay
                    G={G}
                    moves={moves}
                    playerID={playerID}
                    iAmGood={iAmGood}
                />
            )}
        </div>
    </>
}

function LeftMovePhase({G, iAmGood, myTurn, moves}: {
    G: GState,
    iAmGood: boolean,
    myTurn: boolean,
    moves: any,
}) {
    const mySelectedCards = G.players[iAmGood ? '1' : '0'].specialCards || []
    const cardChosen = iAmGood ? G.goodSpecial : G.evilSpecial
    const mode = getMode(G.matchID)

    return <>
        <h2>
            {!myTurn ? (
                'Waiting on Opponent'
            ) : cardChosen && cardChosen !== 'DONE'
                ? 'Playing Special'
                : G.mordorDarkMode === true
                    ? 'Performing Extra Move'
                    : (!iAmGood && G.kingRevealed && G.kingRevealed !== true)
                        ? `You MUST move ${getChars({mode, good: false})[G.kingRevealed].name}`
                        : (
                            <span>{!G?.attackingChar ? 'Select Piece' : 'Select Region'}</span>
                        )}
        </h2>
        {myTurn && mySelectedCards.length > 0 && !cardChosen && !G.attackingChar && !G.mordorDarkMode && !(!iAmGood && G.kingRevealed) && (
            <div>
                <div> or select a Special Card</div>
                <div className={'chooseSpecial'}>{mySelectedCards.map(card => {
                    return <button
                        key={card.title}
                        className={'specialSelectBtn'}
                        onClick={() => moves.chooseSpecialCard(card)}
                        disabled={card.id === 4 || (card.id === 2 && (!G.characters[GOOD_NAMES.CLASSICGANDALF]?.defeated || !G.characters[GOOD_NAMES.VARIANTGANDALF]?.defeated))}
                    >
                        <div>{card.title}-</div>
                        <div>{card.description}</div>
                    </button>
                })}
                </div>
            </div>
        )}
        {!iAmGood && myTurn && G.characters[EVIL_CHARS.BALROG] && !G.characters[EVIL_CHARS.BALROG]?.defeated && (
            <div>
                <div>
                    <span>Check the box to ambush (or allow) Fellowship units in Moria.</span>
                    <div>(Only works when Balrog is in Caradhras)</div>
                </div>
                <br/>
                <input
                    type="checkbox"
                    checked={Boolean(G.players['0']?.ambush)}
                    onChange={(e) => moves.setAmbush(e.target.checked)}
                />
                {Boolean(G.players['0']?.ambush) ? ' Ambush Set' : ' No Ambush Set'}
                {Boolean(G.players['0']?.ambush) &&
                    !G.regions['CARADHRAS'].currentOccupants?.includes(EVIL_CHARS.BALROG) &&
                    ' (When Balrog in Caradhras)'}
            </div>
        )}
    </>
}

function LeftPanel({phase, playerID, G, moves, ctx, myTurn}: {
    moves: any,
    G: GState,
    phase: string,
    playerID: string,
    ctx: any,
    myTurn: boolean,
}) {
    const iAmGood = getIsGood(playerID)
    const placeStage = ctx.activePlayers?.[0]

    return (
        <aside className="left-panel">
            {phase === 'place' ? placeStage === 'placement' ? (
                <LeftPlacePiecesPanel
                    moves={moves}
                    G={G}
                    iAmGood={iAmGood}
                    playerID={playerID}
                />
            ) : (
                <SpecialCardsSetupPanel
                    moves={moves}
                    G={G}
                    iAmGood={iAmGood}
                />
            ) : phase === 'move' ? (
                <LeftMovePhase
                    iAmGood={iAmGood}
                    G={G}
                    moves={moves}
                    myTurn={myTurn}
                />
            ) : phase === 'battle' ? (
                <LeftBattlePanel
                    iAmGood={iAmGood}
                    playerID={playerID}
                    G={G}
                    moves={moves}
                    ctx={ctx}
                    myTurn={myTurn}
                />
            ) : !phase ? (
                <>
                    {ctx.gameover?.winner === '0' ? 'Sauron' : 'The Fellowship'} wins!
                    <div className={'resetter'}>
                        <button
                            className={'btns'}
                            onClick={() => {
                                window.location.reload()
                            }}
                        >
                            Play Again!
                        </button>
                    </div>
                </>
            ) : (
                ''
            )}
        </aside>
    )
}

function CardsDisplay({G, ctx, moves, playerID, iAmGood, isMagicChoice}: {
    moves: any,
    G: GState,
    iAmGood: boolean,
    playerID: string,
    ctx: any,
    isMagicChoice: boolean,
}) {
    const [deck, setDeck] = useState('MINE')

    const otherPlayer = playerID === '1' ? '0' : '1'
    const myCards = G.players[playerID].cards
    const theirCards = G.players[otherPlayer].cards
    const myCard = iAmGood ? G.goodCard : G.evilCard
    const theirCard = iAmGood ? G.evilCard : G.goodCard

    const pickCard = ctx.activePlayers?.[playerID] === 'pickCards'

    const donePickingMagicCard = iAmGood ? G.goodCardLocked : G.evilCardLocked
    const pickReplaceCard =
        ctx.activePlayers?.[playerID] === 'pickMagicCards' && !donePickingMagicCard

    const currentFighters = [G.attackingChar, G.defendingChar]
    const gandalfInPlay = currentFighters.includes(GOOD_NAMES.CLASSICGANDALF) && !currentFighters.includes(EVIL_NAMES.WARG)

    const shouldReplaceMagic =
        ((iAmGood ? G.goodPlayMagic : G.evilPlayMagic) &&
            theirCard &&
            theirCard.title !== 'Magic' &&
            donePickingMagicCard) ||
        (!iAmGood && gandalfInPlay && G.evilPlayMagic) ||
        (iAmGood && gandalfInPlay && G.evilCard && G.goodPlayMagic)

    const evilCardDetails = G.evilCard
        ? G.evilCard.type === 'text'
            ? G.evilCard.title
            : `Power +${G.evilCard.value}`
        : '-'

    const cardsLocked = (iAmGood && G.goodCardLocked) || (!iAmGood && G.evilCardLocked)
    const opponentCardLocked = iAmGood ? G.evilCardLocked : G.goodCardLocked

    const waitingOnEvilToReplaceMagic =
        iAmGood && ctx.activePlayers?.[playerID] === 'pickMagicCards' && !G.evilCardLocked


    return (
        <>
            {deck === 'MINE' && (
                <>
                    <div className={'cardsDivHeader'}>
                        Viewing Remaining Cards
                        <button
                            onClick={() => {
                                setDeck('THEIRS')
                            }}
                            style={{height: '4vh'}}
                        >
                            See Opponent Discard Pile
                        </button>
                        {iAmGood && gandalfInPlay && <div>Opponent has played {evilCardDetails}</div>}
                        {!iAmGood && gandalfInPlay && !G.evilCard && <div>Gandalf awaits your pick</div>}

                        {shouldReplaceMagic && (
                            <div>
                                {waitingOnEvilToReplaceMagic
                                    ? 'Evil choosing card first'
                                    : opponentCardLocked
                                        ? 'Please Replace Your Magic Card'
                                        : ''}
                            </div>
                        )}
                        {isMagicChoice && <div>Opponent played {theirCard.title || `+${theirCard.value}`}</div>}
                        {((iAmGood && !G.goodCardLocked && !gandalfInPlay) || (!iAmGood && !G.evilCardLocked)) && (
                            <button className={'lockIn'} onClick={() => moves.lockInCard()}>
                                Lock in card choice
                            </button>
                        )}
                        {((!iAmGood && G.evilPlayMagic) || (iAmGood && G.goodPlayMagic)) && gandalfInPlay && (
                            <button className={'lockIn'} onClick={() => moves.cancelMagic()}>
                                Cancel Magic Usage
                            </button>
                        )}
                    </div>
                    {!cardsLocked &&
                        myCards.map((card) => {
                            const onCardClick = () => {
                                if (
                                    !card.discarded &&
                                    pickCard &&
                                    !shouldReplaceMagic &&
                                    (!iAmGood || !gandalfInPlay || (gandalfInPlay && evilCardDetails !== '-'))
                                ) {
                                    moves.chooseCard(card)
                                } else if (card.discarded && pickReplaceCard) {
                                    moves.chooseMagicCard(card)
                                } else if (card.discarded && shouldReplaceMagic) {
                                    moves.chooseCard(card)
                                }
                            }
                            const cardClass = `cardDetail ${card.discarded ? 'discard' : ''} ${
                                pickReplaceCard || shouldReplaceMagic ? 'magic' : ''
                            } ${card.id === myCard?.id ? (iAmGood ? 'green' : 'red') : ''}`

                            if (card.type === 'strength') {
                                return (
                                    <button
                                        key={'detail strength-' + card.value}
                                        className={cardClass}
                                        onClick={onCardClick}
                                    >
                                        <div>Power +{card.value}:</div>
                                    </button>
                                )
                            }

                            return (
                                <button
                                    key={`detail text-${card.title}`}
                                    className={cardClass}
                                    onClick={onCardClick}
                                >
                                    <div>{card.title}</div>
                                </button>
                            )
                        })}
                </>
            )}
            {deck !== 'MINE' && (
                <ShowOtherPlayerDiscard setDeck={setDeck} theirCards={theirCards}/>
            )}
        </>
    )
}

function ReselectCardsDisplay({G, moves, playerID, iAmGood}) {
    const [deck, setDeck] = useState('MINE')

    const otherPlayer = playerID === '1' ? '0' : '1'
    const myCards = G.players[playerID].cards
    const myCard = G.goodCard
    const shouldChooseDiscard = G.goodPlayMagic

    return (
        <>
            {deck === 'MINE' && (
                <>
                    <div className={'cardsDivHeader'}>
                        Viewing Remaining Cards
                        <button
                            onClick={() => {
                                setDeck('THEIRS')
                            }}
                            style={{height: '4vh'}}
                        >
                            See Opponent Discard Pile
                        </button>
                        {(!G.goodCardLocked) && (
                            <button className={'lockIn'} onClick={() => moves.lockInCard()}>
                                Lock in card choice
                            </button>
                        )}
                    </div>
                    {myCards.map((card) => {
                        const onCardClick = () => {
                            if (
                                !card.discarded
                            ) {
                                moves.chooseCard(card)
                            } else if (card.discarded && shouldChooseDiscard) {
                                moves.chooseCard(card)
                            }
                        }
                        const cardClass = `cardDetail ${card.discarded ? 'discard' : ''} ${
                            shouldChooseDiscard ? 'magic' : ''
                        } ${card.id === myCard?.id ? (iAmGood ? 'green' : 'red') : ''}`

                        if (card.type === 'strength') {
                            return (
                                <button
                                    key={'detail strength-' + card.value}
                                    className={cardClass}
                                    onClick={onCardClick}
                                    disabled={card.id === G.oldGoodCard.id}
                                >
                                    <div>Power +{card.value}:</div>
                                </button>
                            )
                        }

                        return (
                            <button
                                key={`detail text-${card.title}`}
                                className={cardClass}
                                onClick={onCardClick}
                                disabled={card.id === G.oldGoodCard.id}
                            >
                                <div>{card.title}</div>
                            </button>
                        )
                    })}
                </>
            )}
            {deck !== 'MINE' && (
                <ShowOtherPlayerDiscard setDeck={setDeck} theirCards={G.players[otherPlayer].cards}/>
            )}
        </>
    )
}

function ShowOtherPlayerDiscard({setDeck, theirCards}) {
    return <>
        <div>
            Opponent Discard Pile
            <button
                onClick={() => {
                    setDeck('MINE')
                }}
                className={'lockIn'}
            >
                See Remaining Cards
            </button>
        </div>
        {theirCards
            .filter((card) => card.discarded)
            .map((card) => {
                if (card.type === 'strength') {
                    return (
                        <div
                            key={'detail strength-' + card.value}
                            className={`cardDetail ${card.discarded ? 'discard' : ''}`}
                        >
                            <div>Power +{card.value}:</div>
                        </div>
                    )
                }

                return (
                    <div
                        key={`detail text-${card.title}`}
                        className={`cardDetail ${card.discarded ? 'discard' : ''}`}
                    >
                        <div>{card.title}</div>
                    </div>
                )
            })}
    </>

}

function ShowOtherPlayerToggle({theirCards}) {
    const [show, setShow] = useState(false)

    return <>
        <div>
            Opponent Discard Pile
            <button
                onClick={() => {
                    setShow(prev => !prev)
                }}
                className={'lockIn'}
            >
                See Discarded Cards
            </button>
        </div>
        {show && theirCards
            .filter((card) => card.discarded)
            .map((card) => {
                if (card.type === 'strength') {
                    return (
                        <div
                            key={'detail strength-' + card.value}
                            className={`cardDetail ${card.discarded ? 'discard' : ''}`}
                        >
                            <div>Power +{card.value}:</div>
                        </div>
                    )
                }

                return (
                    <div
                        key={`detail text-${card.title}`}
                        className={`cardDetail ${card.discarded ? 'discard' : ''}`}
                    >
                        <div>{card.title}</div>
                    </div>
                )
            })}
    </>

}

function BackArrow() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.79 6.29 6.09 12l5.7 5.71 1.42-1.42L9.91 13H18v-2H9.91l3.3-3.29z"></path>
    </svg>
}
