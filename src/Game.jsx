import { INVALID_MOVE } from 'boardgame.io/core'
// const INVALID_MOVE = undefined
import {
    EVIL_CARDS,
    EVIL_CHARS,
    EVIL_SPECIAL_CARDS,
    GOOD_CARDS,
    GOOD_CHARS,
    GOOD_SPECIAL_CARDS,
    LOCATIONS
} from './vconsts.js'

function isSpecifiedPlayerGood(id) {
    return id === '1'
}

function isValidTeamTile(isGood, tile) {
    if (isGood) {
        return tile.id > 9
    } else {
        return tile.id < 6
    }
}

function getSpecialCharPossibleMoves(charId, selectedTile, G, opposingTeam) {
    if (charId === 'TREEBEARD') {
        const fangornOccupants = G.regions['FANGORN'].currentOccupants || []
        const validTarget = fangornOccupants.length === 1 && opposingTeam[fangornOccupants[0]]
        return selectedTile?.title !== 'FANGORN' && validTarget ? ['FANGORN'] : []
    } else if (charId === 'FLYINGNAZGUL') {
        const adjacentMoves = [...selectedTile.directions.DOWN]
        const hopMoves = []
        adjacentMoves.forEach(adjTile => {
            const possibleHopTiles = G.regions[adjTile].directions.DOWN
            possibleHopTiles.forEach(t => {
                const currentTile = G.regions[t]
                // square is valid if attacking
                if (opposingTeam[currentTile.currentOccupants?.[0]]) {
                    hopMoves.push(t)
                }
            })
        })

        return hopMoves
    } else if (charId === 'URUKHAI') {
        const validMoves = {}
        const upMoves = [...selectedTile.directions.DOWN]
        while (upMoves[0]) {
            const currentTile = G.regions[upMoves.shift()]
            // if it is empty OR not-full of team, mark and keep looking
            if (currentTile.currentOccupants.length === 0) {
                validMoves[currentTile.title] = currentTile.title
                const down = [...currentTile.directions.DOWN]
                down.forEach((tileName) => {
                    upMoves.push(tileName)
                })
            } else if (
                currentTile.currentOccupants.length < currentTile.maxChars
                && !opposingTeam[currentTile.currentOccupants[0]]
            ) {
                // we can pass through, but cannot stop
                const down = [...currentTile.directions.DOWN]
                down.forEach((tileName) => {
                    upMoves.push(tileName)
                })

            }
        }

        return Object.keys(validMoves)
    }

    return []
}

function generateMoves({G, playerID, selectedChar, selectedTile}) {
    if (selectedChar.id === 'WATCHER' && G.characters['WATCHER'].permaReveal) {
        return []
    }

    const validMoves = []
    const isGood = isSpecifiedPlayerGood(playerID)
    const opposingTeam = isGood ? EVIL_CHARS : GOOD_CHARS

    // calc normal/board specific moves first
    const upMoves = [
        ...selectedTile.directions[isGood ? 'UP' : 'DOWN'],
        ...((isGood ? selectedTile.directions.SPECIAL : []) || []),
    ]
    for (let i = 0; i < upMoves.length; i++) {
        const currentTile = G.regions[upMoves[i]]
        // square is valid if not full of same team OR has other team in it
        if (
            currentTile.currentOccupants.length < currentTile.maxChars ||
            opposingTeam[currentTile.currentOccupants?.[0]]
        ) {
            validMoves.push(upMoves[i])
        }
    }

    // calculate special character attack moves
    const additionalMoves = getSpecialCharPossibleMoves(
        selectedChar.id,
        selectedTile,
        G,
        opposingTeam,
    )

    return [...validMoves, ...additionalMoves]
}

function generateRetreatMoves({G, isGood, selectedChar, selectedTile}) {
    const validRetreatMoves = []
    const sameTeam = isGood ? GOOD_CHARS : EVIL_CHARS

    let moveOptions = []
    if (selectedChar.id === 'FARAMIR') {
        // can retreat sideways
        moveOptions = [...selectedTile.directions.SIDEWAYS]
    } else if (selectedChar.id === 'GWAIHIR') {
        // can retreat backwards or sideways
        moveOptions = [...selectedTile.directions.DOWN, ...selectedTile.directions.SIDEWAYS]
    } else if (selectedChar.id === 'WORMTONGUE') {
        // can retreat backwards
        moveOptions = [...selectedTile.directions.UP]
    } else if (selectedChar.id === 'GOLLUM') {
        // can retreat forward
        moveOptions = [...selectedTile.directions.DOWN]
    } else if (!isGood) {
        // evil card can retreat sideways
        moveOptions = [...selectedTile.directions.SIDEWAYS]
    } else if (isGood) {
        // good card can retreat backwards
        moveOptions = [...selectedTile.directions.DOWN]
    }

    // validate retreat regions
    for (let i = 0; i < moveOptions.length; i++) {
        const targetTile = G.regions[moveOptions[i]]
        // square is valid if not full of same team OR has other team in it
        if (
            targetTile.currentOccupants.length < targetTile.maxChars &&
            targetTile.currentOccupants.every((name) => sameTeam[name])
        ) {
            validRetreatMoves.push(moveOptions[i])
        }
    }

    return validRetreatMoves
}

function shuffle(array) {
    let arr = [...array]
    let currentIndex = arr.length

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--

        // And swap it with the current element.
        ;[arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]]
    }

    return arr
}

function isGameOver(G) {
    const mordor = G.regions['MORDOR']
    const shire = G.regions['SHIRE']

    if (mordor.currentOccupants?.includes?.('FRODO')) {
        return '1'
    }

    if (G.characters['FRODO'].defeated && mordor.currentOccupants?.includes?.('SAM')) {
        return '1'
    }

    if (shire.currentOccupants?.includes?.('WITCHKING')) {
        return '0'
    }
    if (
        shire.currentOccupants.length === 3 &&
        shire.currentOccupants.every((name) => EVIL_CHARS[name])
    ) {
        return '0'
    }

    return null
}

function updateHistory(G, msg) {
    G.history.push(msg)
    G.messages.push(msg)
}

function findSwapCandidates(G, selectedTile) {
    const swappers = {}

    // if no other ally in region
    if (selectedTile.currentOccupants.length === 2) {
        // find people to swap with
        const adjacentRegions = [...selectedTile.directions.UP, ...selectedTile.directions.DOWN, ...selectedTile.directions.SIDEWAYS]

        adjacentRegions.forEach(reg => {
            const adjTilePpl = G.regions[reg]?.currentOccupants || []
            adjTilePpl.forEach(person => {
                if (GOOD_CHARS[person]) {
                    swappers[person] = person
                }
            })
        })
    }

    return Object.keys(swappers)
}

function calculateGoodPreBattle({G, attacker, defender, selectedTile}) {
    const attackerIsGood = Boolean(GOOD_CHARS[attacker.id])

    const goodUnit = attackerIsGood ? attacker : defender

    const abilities = []
    // process Fellowship text first
    if (goodUnit.id === 'FARAMIR' && attackerIsGood) {
        // check locations - add retreat option
        const retreatMoves = generateRetreatMoves({
            G,
            isGood: true,
            selectedChar: goodUnit,
            selectedTile,
        })
        if (retreatMoves.length > 0) {
            abilities.push('RETREAT')
        }
    } else if (goodUnit.id === 'SMEAGOL' && !attackerIsGood) {
        const swapOptions = findSwapCandidates(G, selectedTile)
        if (swapOptions.length > 0) {
            abilities.push('SWAP')
        }
    } else if (goodUnit.id === 'ARAGORN') {
        abilities.push('CARD-FREE')
    }
    if (G.players['1'].specialCards?.find?.(card => card.id === 4)) {
        // check locations - add retreat option
        const retreatMoves = generateRetreatMoves({
            G,
            isGood: true,
            selectedChar: {id: 'GWAIHIR'},
            selectedTile,
        })
        if (retreatMoves.length > 0) {
            abilities.push('WINDLORD')
        }
    }

    // if anything resolves -> resolve it
    return abilities
}

function calculateEvilPreBattle({G, attacker, defender, selectedTile}) {
    const attackerIsGood = Boolean(GOOD_CHARS[attacker.id])
    const evilUnit = attackerIsGood ? defender : attacker
    const goodUnit = attackerIsGood ? attacker : defender
    // process Fellowship text first
    if (evilUnit.id === 'GOLLUM' && goodUnit.id !== 'FRODO') {
        const abilities = []
        // check locations - add retreat option
        const retreatMoves = generateRetreatMoves({
            G,
            isGood: false,
            selectedChar: evilUnit,
            selectedTile,
        })
        if (retreatMoves.length > 0) {
            abilities.push('RETREAT')
        }

        return abilities
    } else if (goodUnit.id === 'GANDALF' && evilUnit.id === 'SARUMAN') {
        updateHistory(G, 'Saruman overwhelms Gandalf!')
        return ['WIN']
    }

    return []
}

const MOUNTAIN_SIDEWAYS = {
    'HIGHPASS': ['MISTYMOUNTAINS'],
    'MISTYMOUNTAINS': ['HIGHPASS', 'CARADHRAS'],
    'CARADHRAS': ['MISTYMOUNTAINS', 'GAPROHAN'],
    'GAPROHAN': ['CARADHRAS'],
}

function isGandalfNearby({G}) {
    if (G.characters['GANDALF'].defeated) {
        return false
    }

    const gandalfTile = [...Object.values(G.regions)].find(region => region.currentOccupants.includes('GANDALF'))
    const gTileDir = gandalfTile.directions
    const adjTiles = [gandalfTile.title, ...gTileDir.UP, ...gTileDir.DOWN, ...gTileDir.SIDEWAYS, ...(MOUNTAIN_SIDEWAYS[gandalfTile.title] || [])]
    return adjTiles.some(tile => tile === G.attackedTile.title)
}

function removeCharacter({G, defeatedUnitId}) {
    G.characters[defeatedUnitId].defeated = true
    const newOccupantsList = shuffle([
        ...G.attackedTile.currentOccupants.filter((name) => name !== defeatedUnitId),
    ])
    G.attackedTile.currentOccupants = newOccupantsList
    G.regions[G.attackedTile.title].currentOccupants = newOccupantsList
}

function processCustomStrengths(G) {
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])

    if (G.attackingChar.id === 'ORCS') {
        G.characters['ORCS'].value = 6
        G.attackingChar.value = 6
    }
    if (G.regions['GONDOR'].currentOccupants.includes('THEODEN') || G.regions['ROHAN'].currentOccupants.includes('THEODEN')) {
        G.characters['THEODEN'].value = 4
        if (attackerIsGood) {
            G.attackingChar.value = 4
        } else {
            G.defendingChar.value = 4
        }
    }
    if (G.regions['FANGORN'].currentOccupants.includes('TREEBEARD')) {
        G.characters['TREEBEARD'].value = 6
        if (attackerIsGood) {
            G.attackingChar.value = 6
        } else {
            G.defendingChar.value = 6
        }
    }
    if (G.defendingChar.id === 'SAM') {
        G.characters['SAM'].value = G.attackingChar.value
        G.defendingChar.value = G.attackingChar.value
    }
}

function processPreGoodActionStage({G, events, playerID, ctx}) {
    // process new strengths
    processCustomStrengths(G)

    const goodOptions = calculateGoodPreBattle({
        G,
        attacker: G.attackingChar,
        defender: G.defendingChar,
        selectedTile: G.attackedTile,
    })

    if (goodOptions.length > 0) {
        // show good options
        G.goodActions = [...goodOptions, 'FIGHT']
        events.setActivePlayers({
            all: 'goodAction',
        })

    } else {
        // proceed to bad options
        processPreBadActionStage({G, playerID, events, ctx})
    }
}

function processPreBadActionStage({G, playerID, events, ctx}) {
    G.goodActions = null

    const badOptions = calculateEvilPreBattle({
        G,
        attacker: G.attackingChar,
        defender: G.defendingChar,
        selectedTile: G.attackedTile,
    })

    if (badOptions.length === 0) {
        G.badActions = null
        // proceed to cards
        events.setActivePlayers({
            all: 'pickCards',
        })
    } else {
        if (badOptions[0] === 'WIN') {
            const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
            const goodUnit = attackerIsGood ? G.attackingChar : G.defendingChar

            // remove defeated char
            removeCharacter({G, defeatedUnitId: goodUnit.id})
            startBattleLogic({G, playerID, events, ctx})
        } else {
            // show evil options
            G.badActions = [...badOptions, 'FIGHT']
            events.setActivePlayers({
                all: 'badAction',
            })
        }
    }
}

function checkCanWormTongueEscape({G}) {
    if (!G.attackedTile || !G.attackingChar?.id || !G.defendingChar?.id) {
        return false
    }

    // make sure Grima has a chance to escape
    const players = [G.attackingChar.id, G.defendingChar.id]
    if (
        players.includes('WORMTONGUE')
        && G.characters['WORMTONGUE'].defeated
        && !G.characters['WORMTONGUE'].permaDefeated
    ) {
        const retreatMoves = generateRetreatMoves({
            G,
            isGood: false,
            selectedChar: {id: 'WORMTONGUE'},
            selectedTile: G.attackedTile
        })
        if (retreatMoves.length > 0) {
            return true
        }
        G.characters['WORMTONGUE'].permaDefeated = true
        return false
    }

    return false
}

function wormTongueCheck({G, events, location}) {
    G.validMoves = generateRetreatMoves({
        G,
        isGood: false,
        selectedChar: {id: 'WORMTONGUE'},
        selectedTile: G.attackedTile
    })
    G.grimaCallback = location
    events.setActivePlayers({
        all: 'grimaRetreat',
    })
}

function startBattleLogic({G, playerID, events, ctx}) {
    // hide all characters because we can
    Object.keys(G.characters).forEach((name) => {
        if (!G.characters[name].permaReveal) {
            G.characters[name].reveal = false
        }
    })

    // make sure Grima has a chance to escape
    if (checkCanWormTongueEscape({G})) {
        wormTongueCheck({G, events, location: 'start'})
    } else {

        // ensure cards are reset
        G.goodCard = null
        G.evilCard = null
        G.goodPlayMagic = false
        G.evilPlayMagic = false
        G.goodCardLocked = false
        G.evilCardLocked = false

        // check for win
        if (G.characters['FRODO'].defeated && G.characters['SAM'].defeated) {
            updateHistory(G, 'The ring was lost - Sauron wins!')
            events.endGame({winner: '0'})
        } else {
            const battleTile = G.attackedTile
            if (battleTile.currentOccupants.length > 2) {
                // wait for player to choose opponent
                G.battle = {[ctx.currentPlayer]: 'choose'}
                events.setActivePlayers({value: null})
            } else if (battleTile.currentOccupants.length === 1) {
                updateHistory(G, 'This battle is over')
                // we battled everyone
                endBattleLogic({G, events, ctx})
            } else if (battleTile.currentOccupants.length === 0) {
                // both retreated
                updateHistory(G, 'Both challengers have FLED')
                endBattleLogic({G, events, ctx})
            } else {
                battleTile.currentOccupants.forEach((name) => {
                    G.characters[name].reveal = true
                    if (name === 'WATCHER') {
                        G.characters[name].permaReveal = true
                    }
                    if (name !== G.attackingChar.id) {
                        G.defendingChar = G.characters[name]
                    }
                })

                updateHistory(G,
                    `The battle between ${G.attackingChar.name} and ${G.defendingChar.name} in ${battleTile.description} commences`,
                )

                // do instantaneous abilities
                processPreGoodActionStage({G, events, playerID, ctx})
            }
        }
    }
}

function endBattleLogic({G, events, ctx}) {
    // hide all characters because we can
    Object.keys(G.characters).forEach((name) => {
        if (!G.characters[name].permaReveal) {
            G.characters[name].reveal = false
        }
    })

    // reset character values
    resetAllCharValues(G)

    // check for win
    if (G.characters['FRODO'].defeated && G.characters['SAM'].defeated) {
        events.endGame({winner: '0'})
    } else {
        // make sure Grima has a chance to escape
        if (checkCanWormTongueEscape({G})) {
            wormTongueCheck({G, events, location: 'end'})
        } else {
            G.attackingChar = null
            G.startingTile = null
            G.attackedTile = null
            G.defendingChar = null
            G.palantirNames = []

            // ensure cards are reset
            G.goodCard = null
            G.evilCard = null
            G.goodPlayMagic = false
            G.evilPlayMagic = false
            G.goodCardLocked = false
            G.evilCardLocked = false

            // track who the next player should be
            G.lastPlayerId = ctx.currentPlayer === '1' ? '0' : '1'

            // return to wherever we were
            events.setActivePlayers({value: null})
            events.setPhase('move')
        }
    }
}

function resetAllCharValues(G) {
    // Gandalf can edit anyone, so account for that
    Object.values(GOOD_CHARS).forEach(char => {
        G.characters[char.id].value = char.value
    })
    Object.values(EVIL_CHARS).forEach(char => {
        G.characters[char.id].value = char.value
    })
}

function goodRetreatLogic({G, playerID, events, ctx, retreatMove}) {
    // actions are null, we chose to retreat
    G.goodActions = null

    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
    const goodUnit = attackerIsGood ? G.attackingChar : G.defendingChar

    // leave current tile
    const newOccupantsList = shuffle([
        ...G.attackedTile.currentOccupants.filter((name) => name !== goodUnit.id),
    ])
    G.attackedTile.currentOccupants = newOccupantsList
    G.regions[G.attackedTile.title].currentOccupants = newOccupantsList

    // go to new tile
    G.regions[retreatMove].currentOccupants = shuffle([
        ...G.regions[retreatMove].currentOccupants,
        goodUnit.id,
    ])

    if (attackerIsGood) {
        endBattleLogic({G, events, ctx})
    } else {
        G.defendingChar = null
        // check to see if we battle again
        startBattleLogic({G, playerID, events, ctx})
    }
}

function evilRetreatLogic({G, playerID, events, ctx, retreatMove}) {
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
    const evilUnit = attackerIsGood ? G.defendingChar : G.attackingChar

    // leave current tile
    const newOccupantsList = shuffle([
        ...G.attackedTile.currentOccupants.filter((name) => name !== evilUnit.id),
    ])
    G.attackedTile.currentOccupants = newOccupantsList
    G.regions[G.attackedTile.title].currentOccupants = newOccupantsList

    // go to new tile
    G.regions[retreatMove].currentOccupants = shuffle([
        ...G.regions[retreatMove].currentOccupants,
        evilUnit.id,
    ])

    if (attackerIsGood) {
        G.defendingChar = null
        // check to see if we battle again
        startBattleLogic({G, playerID, events, ctx})
    } else {
        endBattleLogic({G, events, ctx})
    }
}

function processGoodRetreat({G, events, ctx, playerID}) {
    const goodRetreatMoves = generateRetreatMoves({
        G,
        isGood: true,
        selectedChar: {},
        selectedTile: G.attackedTile,
    })
    if (goodRetreatMoves.length === 1) {
        updateHistory(G, 'Good retreats to ' + goodRetreatMoves[0])

        // do auto retreat
        goodRetreatLogic({
            G,
            playerID,
            events,
            ctx,
            retreatMove: goodRetreatMoves[0],
        })
        return true
    } else if (goodRetreatMoves.length > 1) {
        // move to choose retreat square stage
        G.validMoves = goodRetreatMoves
        events.setActivePlayers({
            all: 'goodRetreat',
        })
        return true
    }

    return false
}

function processEvilRetreat({G, events, ctx, playerID}) {
    const evilRetreatMoves = generateRetreatMoves({
        G,
        isGood: false,
        selectedChar: {},
        selectedTile: G.attackedTile,
    })

    if (evilRetreatMoves.length === 1) {
        updateHistory(G, 'Evil retreats to ' + evilRetreatMoves[0])

        // do auto retreat
        evilRetreatLogic({
            G,
            playerID,
            events,
            ctx,
            retreatMove: evilRetreatMoves[0],
        })
        return true
    } else if (evilRetreatMoves.length > 1) {
        // move to choose retreat square stage
        G.validMoves = evilRetreatMoves
        events.setActivePlayers({
            all: 'badRetreat',
        })
        return true
    }
    return false
}

function processPostCardActions({G, playerID, events, ctx, skipEvil = false}) {
    const players = [G.defendingChar.id, G.attackingChar.id]
    const goodCardsLeft = G.players['1']?.cards?.filter?.((card) => !card.discarded)

    if (players.includes('SARUMAN') && goodCardsLeft.length > 1 && !skipEvil) {
        events.setActivePlayers({
            all: 'sarumanCards',
        })
    } else if (players.includes('MOUTH') && !skipEvil) {
        events.setActivePlayers({
            all: 'mouthCards',
        })
    } else if (!players.includes('GANDALF') && isGandalfNearby({G})) {
        events.setActivePlayers({
            all: 'gandalfChoice',
        })
    } else {
        beginCardBattle({G, events, ctx, playerID})
    }
}

function beginCardBattle({G, events, ctx, playerID}) {
    const goodCard = G.goodCard
    const evilCard = G.evilCard
    const goodInert = goodCard.title === 'Magic' && !G.goodPlayMagic
    const evilInert = evilCard.title === 'Magic' && !G.evilPlayMagic

    updateHistory(G,
        `Good's ${goodInert ? 'inert ' : ''}${
            goodCard.title || `+${goodCard.value}`
        } versus Evil's ${evilInert ? 'inert ' : ''}${
            evilCard.title || `+${evilCard.value}`
        }`,
    )

    // PROCEED TO EVAL
    processPlayedCards({G, events, ctx, playerID})
}

function discardCard({G, isGood, knownIndex}) {
    if (knownIndex) {
        G.players[isGood ? '1' : '0'].cards[knownIndex].discarded = true
    } else {
        const targetCard = isGood ? G.goodCard : G.evilCard
        let discardIndex = G.players[isGood ? '1' : '0']?.cards?.findIndex?.(
            (card) => card.id === targetCard.id,
        )
        G.players[isGood ? '1' : '0'].cards[discardIndex].discarded = true
    }
}

function processPlayedCards({G, events, ctx, playerID}) {
    // discard cards
    discardCard({G, isGood: true})
    discardCard({G, isGood: false})
    const players = [G.attackingChar.id, G.defendingChar.id]
    const elrondActive = players.includes('ELROND')
    const evilTextNegated = elrondActive && G.evilCard.title !== 'Retreat (Sideways)' && G.evilCard.type === 'text'

    if (G.evilCard.type === 'text' && !evilTextNegated) {
        if (G.evilCard.title === 'Retreat (Sideways)') {
            const evilRetreated = processEvilRetreat({G, events, ctx, playerID})
            if (!evilRetreated) {
                updateHistory(G, 'Evil has NO escape!')
                if (G.goodCard.title === 'Retreat (Backwards)') {
                    const goodRetreated = processGoodRetreat({G, events, ctx, playerID})
                    if (!goodRetreated) {
                        updateHistory(G, 'Good has NO escape!')
                        // DO battle
                        processPowerFight({
                            G,
                            playerID,
                            events,
                            ctx,
                        })
                    }
                } else if (G.goodCard.title === 'Noble Sacrifice') {
                    playNobleSacrifice({G, events, ctx})
                } else {
                    let goodPower = 0
                    if (G.goodCard.type === 'strength') {
                        // add good power
                        goodPower = G.goodCard.value
                    }
                    // DO battle
                    processPowerFight({
                        G,
                        playerID,
                        events,
                        ctx,
                        goodPowerBoost: goodPower,
                    })
                }
            }
        } else {
            // is EYEofSAURON or Magic - ignorable
            let goodPower = 0
            if (G.goodCard.type === 'strength') {
                goodPower = G.goodCard.value
            }

            if (G.evilCard.title === 'The Eye Of Sauron') {
                updateHistory(G, 'Saurons Eye negates any Good Text')
            }

            // DO battle
            processPowerFight({
                G,
                playerID,
                events,
                ctx,
                goodPowerBoost: goodPower,
            })
        }
    } else if (G.goodCard.type === 'text') {
        if (evilTextNegated) {
            updateHistory(G, 'Elrond ignores the Evil card')
        }
        if (G.goodCard.title === 'Noble Sacrifice') {
            playNobleSacrifice({G, events, ctx})
        } else if (G.goodCard.title === 'Elven Cloak' || G.goodCard.title === 'Magic') {
            if (G.goodCard.title === 'Elven Cloak') {
                updateHistory(G, 'This Elven Cloak negates Evil Power!')
            }
            // DO battle
            processPowerFight({
                G,
                playerID,
                events,
                ctx,
            })
        } else if (G.goodCard.title === 'Retreat (Backwards)') {
            const goodRetreated = processGoodRetreat({G, events, ctx, playerID})
            if (!goodRetreated) {
                updateHistory(G, 'Good has NO escape!')
                let evilPower = 0
                if (G.evilCard.type === 'strength') {
                    evilPower = G.evilCard.value
                }

                // DO battle
                processPowerFight({
                    G,
                    playerID,
                    events,
                    ctx,
                    evilPowerBoost: evilPower,
                })
            }
        } else {
            console.log('ERROR WITH GOOD TEXT STATE')
        }
    } else {
        if (evilTextNegated) {
            updateHistory(G, 'Elrond ignores the Evil card')
        }
        let goodPower = 0
        let evilPower = 0

        if (G.goodCard.type === 'strength') {
            goodPower = G.goodCard.value
        }
        if (G.evilCard.type === 'strength') {
            evilPower = G.evilCard.value
        }

        // DO battle
        processPowerFight({
            G,
            playerID,
            events,
            ctx,
            goodPowerBoost: goodPower,
            evilPowerBoost: evilPower,
        })
    }
}

function playNobleSacrifice({G, events, ctx}) {
    updateHistory(G,
        `Both ${G.attackingChar.name} and ${G.defendingChar.name} fight to the bitter end`,
    )

    // kill both
    removeCharacter({G, defeatedUnitId: G.attackingChar.id})
    removeCharacter({G, defeatedUnitId: G.defendingChar.id})

    // end battle
    endBattleLogic({G, events, ctx})
}

function processPowerFight({G, playerID, events, ctx, goodPowerBoost = 0, evilPowerBoost = 0}) {
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
    const goodUnit = attackerIsGood ? G.attackingChar : G.defendingChar
    const evilUnit = attackerIsGood ? G.defendingChar : G.attackingChar

    const goodTotal = goodUnit.value + goodPowerBoost
    const evilTotal = evilUnit.value + evilPowerBoost

    if (goodTotal > evilTotal) {
        updateHistory(G, `${goodUnit.name} has vanquished ${evilUnit.name}`)
        removeCharacter({G, defeatedUnitId: evilUnit.id})

        if (attackerIsGood) {
            startBattleLogic({G, playerID, events, ctx})
        } else {
            endBattleLogic({G, events, ctx})
        }
    } else if (goodTotal < evilTotal) {
        removeCharacter({G, defeatedUnitId: goodUnit.id})
        updateHistory(G, `${evilUnit.name} has annihilated ${goodUnit.name}`)

        if (attackerIsGood) {
            endBattleLogic({G, events, ctx})
        } else {
            startBattleLogic({G, playerID, events, ctx})
        }

    } else {
        playNobleSacrifice({G, events, ctx})
    }
}

function processGoodSpecialCard({G, playerID, events, ctx, card}) {
    if (card.id === 1) {
        G.goodLightMode = true
        G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 1)
        G.goodSpecial = 'DONE'
    } else if (card.id === 2) {
        const fangorn = G.regions['FANGORN']
        if (
            G.characters['GANDALF'].defeated
            && fangorn.currentOccupants.length < fangorn.maxChars
            && !EVIL_CHARS[fangorn.currentOccupants?.[0]]
        ) {
            G.characters['GANDALF'].defeated = false
            G.characters['GANDALF'].permaReveal = false
            G.characters['GANDALF'].white = true

            // go to new tile
            G.regions['FANGORN'].currentOccupants = shuffle([
                ...G.regions['FANGORN'].currentOccupants,
                'GANDALF',
            ])

            G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 2)
            G.goodSpecial = null
            events.endTurn()
        }
    } else if (card.id === 3) {
        if (!G.characters['ARAGORN'].defeated) {
            G.characters['ARAGORN'].reveal = true
            G.goodSpecial = 'KING'
        }
    } else if (card.id === 4) {
        // doesnt get here, determined in pre good actions
        return INVALID_MOVE
    }
}

function processEvilSpecialCard({G, playerID, events, ctx, card}) {
    if (card.id === 5) {
        G.evilSpecial = 'PALANTIR'
    } else if (card.id === 6) {
        const mordor = G.regions['MORDOR']
        const mordorPpl = mordor.currentOccupants
        if (mordorPpl.length === mordor.maxChars || Boolean(GOOD_CHARS[mordorPpl?.[0]])) {
            return INVALID_MOVE
        }
        G.evilSpecial = 'MORDORRECALL'
    } else if (card.id === 7) {
        G.mordorDarkMode = true
        G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 7)
        G.evilSpecial = 'DONE'
    } else if (card.id === 8) {
        G.evilSpecial = 'CREBAIN'
    }
}

function moveCharLogic({G, tileId, events, playerID, endTurn = true}) {
    G.kingRevealed = null
    const isGood = isSpecifiedPlayerGood(playerID)
    const opposingChars = isGood ? EVIL_CHARS : GOOD_CHARS
    const previousTile = G.regions[G.startingTile]
    const newTile = G.regions[tileId]
    const selectedChar = G.attackingChar
    if (!newTile || !selectedChar) {
        return INVALID_MOVE
    }

    previousTile.currentOccupants = shuffle([
        ...previousTile.currentOccupants.filter((name) => name !== selectedChar.id),
    ])
    G.validMoves = []

    newTile.currentOccupants = shuffle([...newTile.currentOccupants, selectedChar.id])

    let mover = playerID === '0' ? 'Evil' : 'Good'
    if (selectedChar.id === 'URUKHAI' && !previousTile.directions.DOWN.includes(tileId)) {
        // was uruk special, reveal them
        mover = selectedChar.name
    }

    updateHistory(G,
        `${mover} moved from ${previousTile.description} to ${
            newTile.description
        }`,
    )

    // check for win
    const winner = isGameOver(G)
    if (winner) {
        updateHistory(G,
            winner === '0'
                ? 'Evil won by Scouring the Shire!'
                : 'Good won by destroying the ring!',
        )
        events.endGame({winner})
    } else {
        // prepare for fight
        G.attackedTile = newTile
        G.startingTile = null
        G.validMoves = []

        // check for fight
        if (newTile.currentOccupants.some((name) => opposingChars[name])) {
            events.setPhase('battle')
        } else {
            // EOT
            G.attackingChar = null
            G.attackedTile = null
            if (endTurn) {
                events.endTurn()
            }
        }
    }
}

export const ConfrontationVariant = {
    name: 'ConfrontationVariant',
    setup: () => {
        return {
            history: [],
            messages: [],
            palantir: [],
            players: {
                0: {
                    side: 'evil',
                    cards: [...EVIL_CARDS],
                    // .map(c=>c.title !== 'Magic' ? {...c, discarded : true} : c)
                    charactersToPlace: [...Object.values(EVIL_CHARS)],
                },
                1: {
                    side: 'good',
                    cards: [...GOOD_CARDS],
                    charactersToPlace: [...Object.values(GOOD_CHARS)],
                },
            },

            regions: LOCATIONS,
            characters: {
                ...GOOD_CHARS,
                ...EVIL_CHARS,
            },
        }
    },
    phases: {
        place: {
            start: true,
            turn: {
                stages: {
                    placement: {
                        moves: {
                            chooseCharacter: ({G, playerID}, charID) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood) {
                                    G.goodCharacterToPlace = charID
                                } else {
                                    G.evilCharacterToPlace = charID
                                }
                            },
                            autoPlace: ({G, playerID}) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                G.players[playerID].charactersToPlace = []
                                if (isGood) {
                                    let players = [...Object.keys(GOOD_CHARS)]
                                    players = shuffle(players)
                                    G.regions['RHUDAUR'].currentOccupants = [players[6]]
                                    G.regions['EREGION'].currentOccupants = [players[2]]
                                    G.regions['ENEDWAITH'].currentOccupants = [players[7]]
                                    G.regions['ARTHEDAIN'].currentOccupants = [players[4]]
                                    G.regions['CARDOLAN'].currentOccupants = [players[5]]
                                    G.regions['SHIRE'].currentOccupants = [
                                        players[0],
                                        players[1],
                                        players[8],
                                        players[3],
                                    ]
                                    G.goodCharacterToPlace = null
                                } else {
                                    let players = [...Object.keys(EVIL_CHARS)]
                                    players = shuffle(players)
                                    G.regions['MORDOR'].currentOccupants = [
                                        players[3],
                                        players[4],
                                        players[7],
                                        players[8],
                                    ]
                                    G.regions['DAGORLAD'].currentOccupants = [players[0]]
                                    G.regions['GONDOR'].currentOccupants = [players[1]]
                                    G.regions['MIRKWOOD'].currentOccupants = [players[2]]
                                    G.regions['FANGORN'].currentOccupants = [players[5]]
                                    G.regions['ROHAN'].currentOccupants = [players[6]]
                                    G.evilCharacterToPlace = null
                                }

                            },
                            reset: ({G, playerID}) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood) {
                                    G.regions['RHUDAUR'].currentOccupants = []
                                    G.regions['EREGION'].currentOccupants = []
                                    G.regions['ENEDWAITH'].currentOccupants = []
                                    G.regions['ARTHEDAIN'].currentOccupants = []
                                    G.regions['CARDOLAN'].currentOccupants = []
                                    G.regions['SHIRE'].currentOccupants = []
                                    G.players[playerID].charactersToPlace = [...Object.values(GOOD_CHARS)]
                                    G.goodCharacterToPlace = null
                                } else {
                                    G.regions['MORDOR'].currentOccupants = []
                                    G.regions['DAGORLAD'].currentOccupants = []
                                    G.regions['GONDOR'].currentOccupants = []
                                    G.regions['MIRKWOOD'].currentOccupants = []
                                    G.regions['FANGORN'].currentOccupants = []
                                    G.regions['ROHAN'].currentOccupants = []
                                    G.players[playerID].charactersToPlace = [...Object.values(EVIL_CHARS)]
                                    G.evilCharacterToPlace = null
                                }
                            },
                            resetChar: ({G, playerID}, charId, tileId) => {
                                const char = G.characters[charId]

                                G.regions[tileId].currentOccupants = G.regions[tileId].currentOccupants.filter(
                                    (char_id) => char_id !== charId,
                                )
                                G.players[playerID].charactersToPlace = [
                                    ...G.players[playerID].charactersToPlace,
                                    char,
                                ]
                            },
                            placeCharacter: ({G, playerID, events, ctx}, tileId) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
                                const charToPlace = isGood ? G.goodCharacterToPlace : G.evilCharacterToPlace

                                // removing good only can place first check
                                //  || ctx.currentPlayer !== playerID
                                if (!charToPlace) {
                                    return INVALID_MOVE
                                }
                                const homeBase = G.regions[isGood ? 'SHIRE' : 'MORDOR']
                                const selectedTile = G.regions[tileId]
                                const canPlaceElsewhere = homeBase.currentOccupants.length === homeBase.maxChars

                                if (
                                    !isValidTeamTile(isGood, selectedTile) ||
                                    (homeBase.title !== tileId && selectedTile.currentOccupants.length > 0)
                                ) {
                                    return INVALID_MOVE
                                }

                                if (!G.stopPlacementWarning && !canPlaceElsewhere && homeBase.title !== tileId) {
                                    G.stopPlacementWarning = true
                                    G.messages.push('You must fill your base out first THEN put 1 in each tile on your side of the mountains')

                                    return INVALID_MOVE
                                }
                                G.stopPlacementWarning = false

                                G.regions[tileId].currentOccupants = shuffle([
                                    ...G.regions[tileId].currentOccupants,
                                    charToPlace,
                                ])
                                const remainingChars = G.players[playerID].charactersToPlace
                                G.players[playerID].charactersToPlace = remainingChars.filter(
                                    (c) => c.id !== charToPlace,
                                )
                                if (isGood) {
                                    G.goodCharacterToPlace = null
                                } else {
                                    G.evilCharacterToPlace = null
                                }
                            },
                            ready: ({G, playerID, events}) => {
                                G.messages = []
                                if (playerID === '0') {
                                    G.evilReady = true
                                } else {
                                    G.goodReady = true
                                }
                                if (G.evilReady && G.goodReady) {
                                    events.setActivePlayers({
                                        all: 'specialCards',
                                    })
                                }
                            },
                        },
                    },
                    specialCards: {
                        moves: {
                            chooseCardOption: ({G, events}, type) => {
                                G.messages = []
                                const cardsPer = type === 'default' ? 2 : Number(type)
                                G.players['0'].specialCards = []
                                G.players['1'].specialCards = []

                                if (cardsPer === 0) {
                                    updateHistory(G, 'No Special cards to be used')
                                    G.chooseSpecials = false
                                    events.endPhase()
                                } else if (cardsPer === 4) {
                                    updateHistory(G, 'All Special cards to be used')
                                    G.players['0'].specialCards = [...EVIL_SPECIAL_CARDS]
                                    G.players['1'].specialCards = [...GOOD_SPECIAL_CARDS]
                                    G.chooseSpecials = false
                                    events.endPhase()
                                } else {
                                    G.specialCardDefault = type === 'default'
                                    G.specialCardsPer = cardsPer
                                    G.chooseSpecials = true
                                }
                            },
                            chooseCard: ({G, playerID, events}, card) => {
                                G.messages = []
                                const iAmGood = isSpecifiedPlayerGood(playerID)
                                const cardsPer = G.specialCardsPer

                                if (G.specialCardDefault) {
                                    if (G.players[playerID].specialCards.length >= cardsPer) {
                                        return INVALID_MOVE
                                    }
                                    G.players[playerID].specialCards.push(card)
                                } else {
                                    if (G.players[iAmGood ? '0' : '1'].specialCards.length >= cardsPer) {
                                        return INVALID_MOVE
                                    }
                                    G.players[iAmGood ? '0' : '1'].specialCards.push(card)
                                }

                                if (G.players['0'].specialCards.length === cardsPer && G.players['1'].specialCards.length === cardsPer) {
                                    events.endPhase()
                                }
                            },
                        },
                    },
                },
                activePlayers: {all: 'placement'},
            },
            next: 'move',
        },
        move: {
            turn: {
                activePlayers: null,
                order: {
                    // Player 0 starts gameplay, unless we are overwriting
                    // broken turn logic from the battle phase
                    first: ({G}) => (G.lastPlayerId ? Number(G.lastPlayerId) : 0),
                    next: ({ctx}) => {
                        // Alternate between Player 0 and Player 1
                        return ctx.currentPlayer === '0' ? 1 : 0
                    },
                },
                onBegin: ({G, events, ctx}) => {
                    G.palantirNames = []
                    Object.keys(G.characters).forEach((name) => {
                        if (!G.characters[name].permaReveal) {
                            G.characters[name].reveal = false
                        }
                    })

                    G.goodSpecial = null
                    G.evilSpecial = null

                    const isGood = isSpecifiedPlayerGood(ctx.currentPlayer)
                    const charList = isGood ? GOOD_CHARS : EVIL_CHARS
                    const aliveList = []
                    Object.keys(charList).forEach((name) => {
                        if (G.characters[name] && !G.characters[name].defeated) {
                            aliveList.push(name)
                        }
                    })
                    const canMove = aliveList.some((name) => {
                        const selectedTile = [...Object.values(G.regions)].find((region) =>
                            region.currentOccupants?.includes?.(name),
                        )

                        // try to fix beginTurn being called on empty state?
                        if (!selectedTile) {
                            return true
                        }

                        const moves = generateMoves({
                            G,
                            playerID: ctx.currentPlayer,
                            selectedChar: {id: name},
                            selectedTile: {...selectedTile},
                        })

                        const goodCardTurnSalvage = G.players['1'].specialCards?.find?.(card => card.id === 2 || card.id === 3)
                        const evilCardTurnSalvage = G.players['0'].specialCards?.find?.(card => card.id === 6 || card.id === 8)

                        return moves.length > 0 || Boolean(isGood ? goodCardTurnSalvage : evilCardTurnSalvage)
                    })

                    if (!canMove) {
                        G.messages = []
                        updateHistory(G, `${!isGood ? 'The Fellowship' : 'Sauron'} wins! - loser out of moves`)
                        events.endGame({winner: isGood ? '0' : '1'})
                    } else {
                        const winner = isGameOver(G)
                        if (winner) {
                            updateHistory(G,
                                winner === '0'
                                    ? 'Evil won by Scouring the Shire!'
                                    : 'Good won by destroying the ring!',
                            )
                            events.endGame({winner})
                        }
                    }
                },
            },
            moves: {
                chooseCharacterToMove: ({G, playerID, events, ctx}, charId, tileId) => {
                    G.messages = []
                    if (
                        G.mordorDarkMode === charId
                        || (G.goodLightMode && G.goodLightMode !== true && G.goodLightMode !== charId)
                    ) {
                        return INVALID_MOVE
                    } else if (G.attackingChar && G.attackingChar.id === charId) {
                        G.startingTile = null
                        G.attackingChar = null
                        G.validMoves = []
                    } else if (G.kingRevealed && G.kingRevealed !== charId) {
                        return INVALID_MOVE
                    } else {
                        const selectedTile = G.regions[tileId]
                        const selectedChar = G.characters[charId]
                        if (!selectedTile || !selectedChar) {
                            return INVALID_MOVE
                        }
                        G.startingTile = tileId
                        G.attackingChar = selectedChar
                        G.validMoves = generateMoves({G, playerID, selectedChar, selectedTile})
                        if (G.mordorDarkMode === true) {
                            G.validMoves = G.validMoves.filter(tileName => {
                                const region = G.regions[tileName]
                                return !GOOD_CHARS[region.currentOccupants?.[0]] && region.directions.UP.includes(tileId)
                            })
                        } else if (G.goodLightMode === true) {
                            G.validMoves = G.validMoves.filter(tileName => {
                                const region = G.regions[tileName]
                                return !EVIL_CHARS[region.currentOccupants?.[0]]
                            })
                        }
                        if (G.validMoves.length === 0) {
                            G.startingTile = null
                            G.attackingChar = null
                        }
                    }
                },
                chooseRegionToMove: ({G, playerID, events, ctx}, tileId) => {
                    G.messages = []
                    if (G.startingTile === tileId) {
                        G.startingTile = null
                        G.attackingChar = null
                        G.validMoves = []
                    } else if (!G.validMoves?.includes?.(tileId)) {
                        return INVALID_MOVE
                    } else if (G.mordorDarkMode === G.attackingChar.id) {
                        // name was set, char already moved
                        return INVALID_MOVE
                    } else if (G.mordorDarkMode === true) {
                        // can move ONLY to friendly squares
                        const newValidMoves = G.validMoves.filter(tileId => {
                            const region = G.regions[tileId]
                            return !GOOD_CHARS[region.currentOccupants?.[0]]
                        })
                        if (!newValidMoves?.includes?.(tileId)) {
                            return INVALID_MOVE
                        }

                        G.mordorDarkMode = G.attackingChar.id
                        moveCharLogic({G, tileId, events, playerID, endTurn: false})
                    } else if (G.goodLightMode && G.goodLightMode !== true && G.goodLightMode !== G.attackingChar.id) {
                        // name was set, have to move same char
                        return INVALID_MOVE
                    } else if (G.goodLightMode === true) {
                        // can move ONLY to friendly squares
                        const newValidMoves = G.validMoves.filter(tileId => {
                            const region = G.regions[tileId]
                            return !EVIL_CHARS[region.currentOccupants?.[0]]
                        })
                        if (!newValidMoves?.includes?.(tileId)) {
                            return INVALID_MOVE
                        }

                        G.goodLightMode = G.attackingChar.id
                        moveCharLogic({G, tileId, events, playerID, endTurn: false})
                    } else {
                        G.mordorDarkMode = null
                        G.goodLightMode = null
                        moveCharLogic({G, tileId, events, playerID})
                    }
                },
                chooseSpecialCard: ({G, playerID, events, ctx}, card) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (isGood) {
                        processGoodSpecialCard({G, playerID, events, ctx, card})
                    } else {
                        if (G.kingRevealed) {
                            return INVALID_MOVE
                        }
                        processEvilSpecialCard({G, playerID, events, ctx, card})
                    }
                },
                // good specials
                kingRevealedChar: ({G, playerID, events, ctx}, charId, tileId) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (!isGood || Boolean(GOOD_CHARS[charId]) || G.goodSpecial !== 'KING') {
                        return INVALID_MOVE
                    }
                    const canMove = generateMoves({
                        G,
                        playerID: isGood ? '0' : '1',
                        selectedChar: {id: charId},
                        selectedTile: {...G.regions[tileId]},
                    })
                    if (canMove.length === 0) {
                        return INVALID_MOVE
                    }
                    const aragornTile = Object.values(G.regions).find(reg => reg.currentOccupants.includes('ARAGORN'))
                    updateHistory(G, `The King Aragorn from ${aragornTile.description} forces ??? to maneuver`)

                    G.kingRevealed = charId

                    G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 3)
                    G.goodSpecial = null
                    events.endTurn()
                },
                // evil specials
                palantirRegion: ({G, playerID, events, ctx}, tileId) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (isGood || tileId === 'SHIRE' || G.evilSpecial !== 'PALANTIR') {
                        return INVALID_MOVE
                    }
                    updateHistory(G, `Evil gazes at ${tileId} through the Palantir`)

                    G.palantirNames = G.regions[tileId].currentOccupants
                    G.palantirNames.forEach(name => G.characters[name].reveal = true)

                    G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 5)
                    G.evilSpecial = 'DONE'
                },
                mordorRecall: ({G, playerID, events, ctx}, charId, tileId) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (isGood || Boolean(GOOD_CHARS[charId]) || G.evilSpecial !== 'MORDORRECALL') {
                        return INVALID_MOVE
                    }
                    updateHistory(G, `Evil recalls ${EVIL_CHARS[charId].name} to Mordor`)

                    // leave current tile
                    G.regions[tileId].currentOccupants = shuffle([
                        ...G.regions[tileId].currentOccupants.filter((name) => name !== charId),
                    ])

                    // go to new tile
                    G.regions['MORDOR'].currentOccupants = shuffle([
                        ...G.regions['MORDOR'].currentOccupants,
                        charId,
                    ])

                    G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 6)
                    G.evilSpecial = null
                    events.endTurn()
                },
                crebain: ({G, playerID, events, ctx}, charId) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (isGood || Boolean(EVIL_CHARS[charId]) || G.evilSpecial !== 'CREBAIN') {
                        return INVALID_MOVE
                    }
                    updateHistory(G, `Crebain now spy upon ${GOOD_CHARS[charId].name}`)

                    G.characters[charId].permaReveal = true

                    G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 8)
                    G.evilSpecial = null
                    events.endTurn()
                },
            },
        },
        battle: {
            turn: {
                order: {
                    first: ({ctx}) => Number(ctx.currentPlayer),
                    next: ({ctx}) => {
                        // Alternate between Player 0 and Player 1
                        return ctx.currentPlayer === '0' ? 1 : 0
                    },
                },
                onBegin: (props) => {
                    props.G.messages = []
                    if (props.G.players['0'].cards.every((card) => card.discarded)) {
                        props.G.players['0'].cards.forEach((_, index) => {
                            props.G.players['0'].cards[index].discarded = false
                            props.G.players['1'].cards[index].discarded = false
                        })
                        updateHistory(props.G, 'Cards Reshuffled')
                    }

                    // start phase steps
                    startBattleLogic(props)
                },
                stages: {
                    goodAction: {
                        moves: {
                            chooseGoodAction: ({G, playerID, events, ctx}, action) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (!isGood) {
                                    return INVALID_MOVE
                                }

                                if (action === 'FIGHT') {
                                    G.goodActions = null
                                    // proceed to bad options
                                    G.messages = []
                                    updateHistory(G, 'The Fellowship will Fight!')
                                    processPreBadActionStage({G, playerID, events, ctx})
                                } else if (action === 'SWAP') {
                                    G.goodActions = null
                                    G.messages = []
                                    G.swapOptions = findSwapCandidates(G, G.attackedTile)

                                    events.setActivePlayers({
                                        all: 'goodRetreat',
                                    })
                                } else if (action === 'RETREAT') {
                                    G.goodActions = null
                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
                                    const goodUnit = attackerIsGood ? G.attackingChar : G.defendingChar

                                    // calculate retreat logic
                                    const retreatMoves = generateRetreatMoves({
                                        G,
                                        isGood: true,
                                        selectedChar: goodUnit,
                                        selectedTile: G.attackedTile,
                                    })

                                    if (retreatMoves.length === 1) {
                                        G.messages = []
                                        updateHistory(G, `Faramir sidesteps a retreat into ${retreatMoves[0]}`)
                                        // do auto retreat
                                        goodRetreatLogic({
                                            G,
                                            playerID,
                                            events,
                                            ctx,
                                            retreatMove: retreatMoves[0],
                                        })
                                    } else if (retreatMoves.length > 1) {
                                        // move to choose retreat square stage
                                        G.validMoves = retreatMoves
                                        events.setActivePlayers({
                                            all: 'goodRetreat',
                                        })
                                    } else {
                                        G.badState = 'good retreat moves error'
                                    }
                                } else if (action === 'WINDLORD') {
                                    G.goodActions = null
                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
                                    const goodUnit = attackerIsGood ? G.attackingChar : G.defendingChar

                                    G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 4)

                                    // calculate retreat logic
                                    const retreatMoves = generateRetreatMoves({
                                        G,
                                        isGood: true,
                                        selectedChar: {id: 'GWAIHIR'},
                                        selectedTile: G.attackedTile,
                                    })

                                    if (retreatMoves.length === 1) {
                                        G.messages = []
                                        updateHistory(G, `Gwaihir the Windlord flew ${goodUnit.name} into ${retreatMoves[0]}`)
                                        // do auto retreat
                                        goodRetreatLogic({
                                            G,
                                            playerID,
                                            events,
                                            ctx,
                                            retreatMove: retreatMoves[0],
                                        })
                                    } else if (retreatMoves.length > 1) {
                                        // move to choose retreat square stage
                                        G.validMoves = retreatMoves
                                        events.setActivePlayers({
                                            all: 'goodRetreat',
                                        })
                                    } else {
                                        G.badState = 'gwaihir moves error'
                                    }
                                } else if (action === 'CARD-FREE') {
                                    updateHistory(G,
                                        'Aragorn declares no cards. "Here is the Sword that was Broken and is forged again!"',
                                    )

                                    G.goodActions = null
                                    if (isGandalfNearby({G})) {
                                        G.aragornSkip = true
                                        events.setActivePlayers({
                                            all: 'gandalfChoice',
                                        })
                                    } else {
                                        // proceed to power
                                        processPowerFight({G, playerID, events, ctx})
                                    }
                                } else {
                                    G.badState = 'unexpected good action'
                                }
                            },
                        },
                    },
                    goodRetreat: {
                        moves: {
                            chooseSmeagolSwap: ({G, playerID, events, ctx}, charId, tileId) => {
                                if (!G.swapOptions?.includes?.(charId)) {
                                    return INVALID_MOVE
                                }

                                G.messages = []
                                updateHistory(G, `Smeagol forces ${G.characters[charId].name} to fight their battle`)

                                G.swapOptions = null
                                const attackedTileSpots = G.attackedTile.currentOccupants
                                const swapTileSpots = G.regions[tileId].currentOccupants

                                // swap locations
                                attackedTileSpots.push(charId)
                                G.attackedTile.currentOccupants = attackedTileSpots.filter(name => name !== 'SMEAGOL')
                                G.regions[G.attackedTile.title].currentOccupants = attackedTileSpots.filter(name => name !== 'SMEAGOL')

                                swapTileSpots.push('SMEAGOL')
                                G.regions[tileId].currentOccupants = swapTileSpots.filter(name => name !== charId)

                                G.characters['SMEAGOL'].reveal = G.characters['SMEAGOL'].permaReveal || false
                                G.defendingChar = G.characters[charId]

                                // restart battle
                                processPreGoodActionStage({G, events, playerID, ctx})
                            },
                            chooseRetreatRegion: ({G, playerID, events, ctx}, tileId) => {
                                if (!G.validMoves?.includes?.(tileId)) {
                                    return INVALID_MOVE
                                }

                                G.messages = []
                                updateHistory(G, `Retreat made into ${G.regions[tileId].description}`)

                                G.validMoves = []
                                goodRetreatLogic({
                                    G,
                                    playerID,
                                    events,
                                    ctx,
                                    retreatMove: tileId,
                                })
                            },
                        },
                    },
                    badAction: {
                        moves: {
                            chooseEvilAction: ({G, playerID, events, ctx}, action) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood) {
                                    return INVALID_MOVE
                                }

                                G.messages = []

                                if (action === 'FIGHT') {
                                    updateHistory(G, 'Sauron will Fight')
                                    G.badActions = null
                                    // proceed to cards
                                    events.setActivePlayers({
                                        all: 'pickCards',
                                    })
                                } else if (action === 'RETREAT') {
                                    G.badActions = null
                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
                                    const evilUnit = attackerIsGood ? G.defendingChar : G.attackingChar

                                    // calculate retreat logic
                                    const retreatMoves = generateRetreatMoves({
                                        G,
                                        isGood: false,
                                        selectedChar: evilUnit,
                                        selectedTile: G.attackedTile,
                                    })

                                    if (retreatMoves.length === 1) {
                                        G.messages = []
                                        updateHistory(G, `Gollum sneaks away into ${retreatMoves[0]}`)
                                        // do auto retreat
                                        evilRetreatLogic({
                                            G,
                                            playerID,
                                            events,
                                            ctx,
                                            retreatMove: retreatMoves[0],
                                        })
                                    } else if (retreatMoves.length > 1) {
                                        // move to choose retreat square stage
                                        G.validMoves = retreatMoves
                                        events.setActivePlayers({
                                            all: 'badRetreat',
                                        })
                                    } else {
                                        G.badState = 'bad retreat moves error'
                                    }
                                } else {
                                    G.badState = 'bad action error'
                                }
                            },
                        },
                    },
                    badRetreat: {
                        moves: {
                            chooseRetreatRegion: ({G, playerID, events, ctx}, tileId) => {
                                if (!G.validMoves?.includes?.(tileId)) {
                                    return INVALID_MOVE
                                }

                                G.messages = []
                                updateHistory(G, 'Evil retreats to ' + G.regions[tileId].description)
                                G.validMoves = []
                                evilRetreatLogic({
                                    G,
                                    playerID,
                                    events,
                                    ctx,
                                    retreatMove: tileId,
                                })
                            },
                        },
                    },
                    pickCards: {
                        moves: {
                            chooseCard: ({G, playerID, events, ctx}, card) => {
                                G.messages = []

                                const isGood = isSpecifiedPlayerGood(playerID)
                                const players = [G.defendingChar.id, G.attackingChar.id]
                                const goodHasDiscards = G.players['1']?.cards?.some?.((card) => card.discarded)
                                const evilHasDiscards = G.players['0']?.cards?.some?.((card) => card.discarded)

                                if (isGood && !G.goodCardLocked) {
                                    G.goodPlayMagic = card.title === 'Magic' && goodHasDiscards
                                    G.goodCard = card
                                } else if (!isGood && !G.evilCardLocked) {
                                    G.evilPlayMagic = card.title === 'Magic' && evilHasDiscards && !players.includes('ELROND')
                                    G.evilCard = card
                                }

                            },
                            lockInCard: ({G, playerID, events, ctx}) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood && G.goodCard) {
                                    G.goodCardLocked = true
                                } else if (!isGood && G.evilCard) {
                                    G.evilCardLocked = true
                                }

                                if (G.goodCardLocked && G.evilCardLocked) {
                                    if (G.goodPlayMagic || G.evilPlayMagic) {
                                        // unlock magic cards for next round of choosing
                                        G.goodCardLocked = !G.goodPlayMagic
                                        G.evilCardLocked = !G.evilPlayMagic

                                        // fulfill Magic card(s)
                                        events.setActivePlayers({
                                            all: 'pickMagicCards',
                                        })
                                    } else {
                                        processPostCardActions({G, events, ctx, playerID})
                                    }
                                }
                            },
                        },
                    },
                    pickMagicCards: {
                        moves: {
                            chooseMagicCard: ({G, playerID, events, ctx}, card) => {
                                G.messages = []

                                if (isSpecifiedPlayerGood(playerID)) {
                                    // EVIL has to choose card first
                                    if (!G.goodCardLocked && G.evilCardLocked && card.discarded) {
                                        G.goodCard = card
                                    }
                                } else {
                                    if (!G.evilCardLocked && card.discarded) {
                                        G.evilCard = card
                                    }
                                }
                            },
                            lockInCard: ({G, playerID, events, ctx}) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood) {
                                    if (G.goodCard?.title !== 'Magic') {
                                        G.goodCardLocked = true
                                    }
                                } else {
                                    if (G.evilCard?.title !== 'Magic') {
                                        G.evilCardLocked = true
                                    }
                                }

                                if (G.goodCardLocked && G.evilCardLocked) {
                                    const goodCard = G.goodCard
                                    const evilCard = G.evilCard
                                    // discard magic card if used
                                    if (G.goodPlayMagic) {
                                        discardCard({G, isGood: true, knownIndex: 5})
                                        updateHistory(G,
                                            `Good uses magic to play ${goodCard.title || `+${goodCard.value}`}`,
                                        )
                                    }
                                    if (G.evilPlayMagic) {
                                        discardCard({G, isGood: false, knownIndex: 6})
                                        updateHistory(G,
                                            `Evil uses magic to play ${evilCard.title || `+${evilCard.value}`}`,
                                        )
                                    }

                                    updateHistory(G,
                                        `Good's ${goodCard.title || `+${goodCard.value}`} versus Evil's ${
                                            evilCard.title || `+${evilCard.value}`
                                        }`,
                                    )

                                    // PROCEED TO EVAL
                                    processPlayedCards({G, events, ctx, playerID})
                                }
                            },
                        },
                    },
                    sarumanCards: {
                        moves: {
                            goodReselect: ({G, playerID, events, ctx}, goodReselect) => {
                                G.messages = []
                                if (goodReselect) {
                                    updateHistory(G, `Saruman rejects Goods ${G.goodCard.title || `+${G.goodCard.value}`}`)
                                    G.oldGoodCard = G.goodCard
                                    G.goodCard = null
                                    G.goodPlayMagic = false
                                    G.goodCardLocked = false
                                } else {
                                    // dont recheck for SARUMAN or MOUTH, do GANDALF or GO
                                    processPostCardActions({G, events, ctx, playerID, skipEvil: true})
                                }

                            },
                            chooseCard: ({G, playerID, events, ctx}, card) => {
                                G.messages = []

                                const isGood = isSpecifiedPlayerGood(playerID)
                                const goodHasDiscards = G.players['1']?.cards?.some?.((card) => card.discarded)

                                if (isGood && !G.goodCardLocked) {
                                    G.goodPlayMagic = card.title === 'Magic' && goodHasDiscards
                                    G.goodCard = card
                                } else if (!isGood) {
                                    return INVALID_MOVE
                                }

                            },
                            lockInCard: ({G, playerID, events, ctx}) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood && G.goodCard) {
                                    G.goodCardLocked = true
                                } else if (!isGood) {
                                    return INVALID_MOVE
                                }

                                if (G.goodCardLocked && G.evilCardLocked) {
                                    // dont recheck for SARUMAN or MOUTH, do GANDALF or GO
                                    processPostCardActions({G, events, ctx, playerID, skipEvil: true})

                                }
                            },
                        },
                    },
                    mouthCards: {
                        moves: {
                            useMouthChoice: ({G, playerID, events, ctx}, useMouthAbility) => {
                                G.messages = []

                                if (isSpecifiedPlayerGood(playerID)) {
                                    return INVALID_MOVE
                                }
                                if (useMouthAbility) {
                                    const plus4 = G.players['0'].cards?.find?.(card => card.id === 3)

                                    // if already discarded, discard current card
                                    if (plus4.discarded) {
                                        discardCard({G, isGood: false})
                                    }

                                    G.evilCard = plus4
                                }

                                // dont recheck for SARUMAN or MOUTH, do GANDALF or GO
                                processPostCardActions({G, events, ctx, playerID, skipEvil: true})

                            },
                        },
                    },
                    gandalfChoice: {
                        moves: {
                            useGandalfOption: ({G, playerID, events, ctx}, useGandalfAbility) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)

                                if (!isGood) {
                                    return INVALID_MOVE
                                }
                                if (useGandalfAbility) {
                                    G.characters['GANDALF'].reveal = true
                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
                                    if (attackerIsGood) {
                                        G.attackingChar.value += 1
                                        G.characters[G.attackingChar.id].value += 1
                                    } else {
                                        G.defendingChar.value += 1
                                        G.characters[G.defendingChar.id].value += 1
                                    }

                                    const gandalfTile = Object.values(G.regions).find(reg => reg.currentOccupants.includes('GANDALF'))
                                    updateHistory(G, `Gandalf adds +1 to Good from ${gandalfTile.description}`)
                                }

                                if (G.aragornSkip) {
                                    G.aragornSkip = null
                                    // proceed to power
                                    processPowerFight({G, playerID, events, ctx})
                                } else {
                                    beginCardBattle({G, events, ctx, playerID})
                                }

                            },
                        },
                    },
                    grimaRetreat: {
                        moves: {
                            chooseRetreatRegion: ({G, playerID, events, ctx}, tileId) => {
                                if (!G.validMoves?.includes?.(tileId)) {
                                    return INVALID_MOVE
                                }

                                G.messages = []
                                updateHistory(G, 'Wormtongue scuttles back to ' + G.regions[tileId].description)
                                G.validMoves = []

                                const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar.id])
                                const evilUnit = attackerIsGood ? G.defendingChar : G.attackingChar

                                // go to new tile
                                G.regions[tileId].currentOccupants = shuffle([
                                    ...G.regions[tileId].currentOccupants,
                                    evilUnit.id,
                                ])

                                G.characters['WORMTONGUE'].defeated = false

                                if (G.grimaCallback === 'start') {
                                    startBattleLogic({G, playerID, events, ctx})
                                } else {
                                    endBattleLogic({G, events, ctx})
                                }
                            },
                        },
                    },
                },
            },
            moves: {
                chooseCharacterToAttack: ({G, playerID, events, ctx}, charId) => {
                    const battleTile = G.attackedTile
                    const attacker = G.attackingChar
                    G.defendingChar = G.characters[charId]

                    battleTile.currentOccupants.forEach((name) => {
                        if (name === attacker.id || name === charId) {
                            G.characters[name].reveal = true
                            if (name === 'WATCHER') {
                                G.characters[name].permaReveal = true
                            }
                        }
                    })
                    G.battle = null

                    G.messages = []
                    updateHistory(G, `${attacker.name} attacks ${G.defendingChar.name} in ${battleTile.description}`)

                    // do instantaneous abilities
                    processPreGoodActionStage({G, events, playerID, ctx})
                },
            },
        },
        onEnd: ({G}) => {
            G.messages = []
        },
    },
}
