import {BattleCard, Character, GState, SpecialCard} from './types.ts';
import * as Logic from './logic.ts';
import {
    DRAFT_PAIRS,
    EVIL_CHARS,
    EVIL_NAMES,
    EVIL_SPECIAL_CARDS,
    GOOD_CHARS,
    GOOD_NAMES,
    GOOD_SPECIAL_CARDS
} from './consts.ts';
import {INVALID_MOVE} from 'boardgame.io/core'
// const INVALID_MOVE = undefined

export const PLACE = {
    // placement
    setMatchId: (G: GState, matchId: string) => {
        if (!G.matchID) {
            G.matchID = matchId
            const mode = Logic.getMode(matchId)

            G.players['0'].charactersToPlace = [...Object.values(Logic.getChars({
                mode,
                isGood: false
            }))]
            G.players['1'].charactersToPlace = [...Object.values(Logic.getChars({
                mode,
                isGood: true
            }))]
        }
    },
    chooseCharacter: (
        G: GState,
        playerID: string,
        charID: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood && Boolean(GOOD_CHARS[charID])) {
            G.goodCharacterToPlace = charID
        } else if (!isGood && Boolean(EVIL_CHARS[charID])) {
            G.evilCharacterToPlace = charID
        }
    },
    autoPlace: (
        G: GState,
        playerID: string,
    ) => {
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        G.players[playerID].charactersToPlace = []
        if (isGood) {
            const players = Logic.getRandomChars(G, Logic.getChars({
                mode: Logic.getMode(G.matchID),
                isGood: true
            }))
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
            
            // G.regions['RHUDAUR'].currentOccupants = [GOOD_NAMES.VARIANTSAM]
            // G.regions['EREGION'].currentOccupants = [GOOD_NAMES.SMEAGOL]
            // G.regions['ENEDWAITH'].currentOccupants = [GOOD_NAMES.LEGOLAS]
            // G.regions['ARTHEDAIN'].currentOccupants = [GOOD_NAMES.VARIANTGANDALF]
            // G.regions['CARDOLAN'].currentOccupants = [GOOD_NAMES.VARIANTARAGORN]
            // G.regions['SHIRE'].currentOccupants = [
            //     GOOD_NAMES.VARIANTFRODO,
            //     GOOD_NAMES.GIMLI,
            //     GOOD_NAMES.TREEBEARD,
            //     GOOD_NAMES.MERRY,
            // ]
            // G.goodCharacterToPlace = null
            //
            // const goodTiles = ['RHUDAUR', 'EREGION',
            //     'ENEDWAITH', 'ARTHEDAIN', 'CARDOLAN', 'SHIRE']
            // goodTiles.forEach(regName => {
            //     G.regions[regName].currentOccupants.forEach(charId => {
            //         G.characters[charId] = GOOD_CHARS[charId]
            //     })
            // })
        } else {
            const players = Logic.getRandomChars(G, Logic.getChars({
                mode: Logic.getMode(G.matchID),
                isGood: false
            }))
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
    reset: (
        G: GState,
        playerID: string
    ) => {
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood) {
            G.regions['RHUDAUR'].currentOccupants = []
            G.regions['EREGION'].currentOccupants = []
            G.regions['ENEDWAITH'].currentOccupants = []
            G.regions['ARTHEDAIN'].currentOccupants = []
            G.regions['CARDOLAN'].currentOccupants = []
            G.regions['SHIRE'].currentOccupants = []
            G.players[playerID].charactersToPlace = [...Object.values(Logic.getChars({
                mode: Logic.getMode(G.matchID),
                isGood: true
            }))]
            G.goodCharacterToPlace = null

            G.players[playerID].charactersToPlace.forEach((char: Character) => delete G.characters[char.id])
        } else {
            G.regions['MORDOR'].currentOccupants = []
            G.regions['DAGORLAD'].currentOccupants = []
            G.regions['GONDOR'].currentOccupants = []
            G.regions['MIRKWOOD'].currentOccupants = []
            G.regions['FANGORN'].currentOccupants = []
            G.regions['ROHAN'].currentOccupants = []
            G.players[playerID].charactersToPlace = [...Object.values(Logic.getChars({
                mode: Logic.getMode(G.matchID),
                isGood: false
            }))]
            G.evilCharacterToPlace = null

            G.players[playerID].charactersToPlace.forEach((char: Character) => delete G.characters[char.id])
        }
    },
    resetChar: (
        G: GState,
        playerID: string,
        charId: string,
        tileId: string
    ) => {
        const isGood = Logic.isSpecifiedPlayerGood(playerID);
        if ((isGood && G.goodReady) || (!isGood && G.evilReady)) {
            return INVALID_MOVE
        }

        const char = Logic.getChar(G, charId)
        Logic.removeCharacter({G, unitIdToRemove: charId, tileId})

        const reAddPieces = [char]
        const draftMatchChar = Logic.getDraftChar(isGood, charId)
        if (Logic.getMode(G.matchID) === 'DRAFT') {
            reAddPieces.push(draftMatchChar)
        }

        G.players[playerID].charactersToPlace = [
            ...G.players[playerID].charactersToPlace,
            ...reAddPieces,
        ]
        delete G.characters[charId]
    },
    placeCharacter: (
        G: GState,
        playerID: string,
        tileId: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
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
            !Logic.isValidTeamTile(isGood, selectedTile) ||
            (homeBase.title !== tileId && selectedTile.currentOccupants.length > 0) ||
            (homeBase.title === tileId && selectedTile.currentOccupants.length === selectedTile.maxChars)
        ) {
            return INVALID_MOVE
        }

        if (!G.stopPlacementWarning && !canPlaceElsewhere && homeBase.title !== tileId) {
            G.stopPlacementWarning = true
            Logic.updateHistory(G, 'You must fill your base out first THEN put 1 in each tile on your side of the mountains')

            return
        }

        Logic.addCharacter({G, unitIdToAdd: charToPlace, tileId})
        const remainingChars = G.players[playerID].charactersToPlace

        const secondCheck = (cId) => {
            if (Logic.getMode(G.matchID) !== 'DRAFT') {
                return true
            }
            return cId !== DRAFT_PAIRS[charToPlace]
        }
        G.players[playerID].charactersToPlace = remainingChars.filter(
            (c: Character) => c.id !== charToPlace && secondCheck(c.id),
        )

        if (isGood) {
            G.goodCharacterToPlace = null
            G.characters[charToPlace] = GOOD_CHARS[charToPlace]
        } else {
            G.evilCharacterToPlace = null
            G.characters[charToPlace] = EVIL_CHARS[charToPlace]
        }
    },
    ready: (
        G: GState,
        events: any,
        playerID: string,
        aiPickCards: boolean = false,
    ) => {
        G.messages = []

        if (Object.keys(G.characters).length === 0) {
            return INVALID_MOVE
        }

        if (Logic.isSpecifiedPlayerGood(playerID)) {
            G.goodReady = true
        } else {
            G.evilReady = true
        }

        if (G.evilReady && G.goodReady) {
            if (Logic.getMode(G.matchID) === 'DRAFT') {
                Logic.declareChars(G)
            }

            if(!aiPickCards){
                events.setActivePlayers({
                    all: 'specialCards',
                })
            }
        }
    },

// specialCards
    chooseCardOption: (
        G: GState,
        events: any,
        type: 'default' | number
    ) => {
        G.messages = []
        const cardsPer = type === 'default' ? 2 : Number(type)
        G.players['0'].specialCards = []
        G.players['1'].specialCards = []

        if (cardsPer === 0) {
            Logic.updateHistory(G, 'No Special cards to be used')
            G.chooseSpecials = false
            events.endPhase()
        } else if (cardsPer === 4) {
            Logic.updateHistory(G, 'All Special cards to be used')
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
    chooseCard:
        (
            G: GState,
            events: any,
            playerID: string,
            card: SpecialCard
        ) => {
            G.messages = []
            const iAmGood = Logic.isSpecifiedPlayerGood(playerID)
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
}

export const MOVE = {
    onBegin: (
        G: GState,
        events: any,
        ctx: any,
    ) => {
        G.palantirNames = []
        Logic.hideCharacters(G)

        G.goodSpecial = null
        G.evilSpecial = null

        const isGood = Logic.isSpecifiedPlayerGood(ctx.currentPlayer)
        const charList = isGood ? GOOD_CHARS : EVIL_CHARS
        const aliveList = []
        Object.keys(charList).forEach((name) => {
            if (G.characters[name] && !G.characters[name].defeated) {
                aliveList.push(name)
            }
        })
        const canMove = aliveList.some((name) => {
            const selectedTile = Logic.findCharTile(G, name)

            // try to fix beginTurn being called on empty state?
            if (!selectedTile) {
                return true
            }

            const moves = Logic.generateMoves({
                G,
                playerID: ctx.currentPlayer,
                selectedChar: {id: name},
                selectedTile: {...selectedTile},
            })

            const goodSpecials = G.players['1'].specialCards
            const fangorn = G.regions['FANGORN']
            const gandalfName = G.characters[GOOD_NAMES.CLASSICGANDALF] ? GOOD_NAMES.CLASSICGANDALF : GOOD_NAMES.VARIANTGANDALF
            const canPlayGandalfWhite = G.characters[gandalfName].defeated
                && fangorn.currentOccupants.length < fangorn.maxChars
                && !EVIL_CHARS[fangorn.currentOccupants?.[0]]
            && goodSpecials.some(c => c.id === 2)

            const canPlayKingReveal = Logic.canPlayKingRevealed(G)
                && goodSpecials.some(c => c.id === 3)

            const evilSpecials = G.players[0].specialCards
            const mordor = G.regions['MORDOR']
            const mordorPpl = mordor.currentOccupants
            const canPlayRecallMordor = mordorPpl.length !== mordor.maxChars && Boolean(!GOOD_CHARS[mordorPpl?.[0]]) && evilSpecials.some(c => c.id === 6)

            const canPlayCrebain = Object.values(G.characters).some((c: Character) => {
                return GOOD_CHARS[c.id] && !c.defeated
            }) && evilSpecials.some(c => c.id === 8)

            return moves.length > 0 || Boolean(isGood ?
                (canPlayGandalfWhite || canPlayKingReveal)
                : canPlayRecallMordor || canPlayCrebain)
        })

        if (!canMove) {
            G.messages = []
            Logic.updateHistory(G, `${!isGood ? 'The Fellowship' : 'Sauron'} wins! - loser out of moves`)
            events.endGame({winner: isGood ? '0' : '1'})
            return
        } else {
            const winner = Logic.isCaptureBaseGameOver(G)
            if (winner) {
                Logic.updateHistory(G,
                    winner === '0'
                        ? 'Evil won by Scouring the Shire!'
                        : 'Good won by destroying the ring!',
                )
                events.endGame({winner})
                return
            }
        }

        // RESET ORCS ABILITY since battle is over
        if (G.characters[EVIL_NAMES.CLASSICORCS]) {
            G.characters[EVIL_NAMES.CLASSICORCS].tired = false
        }

        // hide king revealed if aragorn is dead
        if (G.characters[GOOD_NAMES.CLASSICARAGORN]?.defeated
            || G.characters[GOOD_NAMES.VARIANTARAGORN]?.defeated) {
            G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 3)
        }

        // hide dark of mordor if only 1 evil char remaining
        let evilUnitCount = 0
        Object.values(G.characters).forEach((c: Character) => {
            if (EVIL_NAMES[c.id] && !c.defeated) {
                evilUnitCount++
            }
        })

        if (evilUnitCount < 2) {
            G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 7)
        }
    },
    chooseCharacterToMove: (
        G: GState,
        playerID: string,
        charId: string,
        tileId: string
    ) => {
        G.messages = []
        if (
            G.mordorDarkMode === charId
            || (G.goodLightMode && G.goodLightMode !== true && G.goodLightMode !== charId)
        ) {
            return INVALID_MOVE
        } else if (G.attackingChar === charId) {
            G.startingTile = null
            G.attackingChar = null
            G.validMoves = []
        } else if (G.kingRevealed && G.kingRevealed !== charId) {
            return INVALID_MOVE
        } else {
            const selectedTile = Logic.getTile(G, tileId)
            const selectedChar = Logic.getChar(G, charId)
            if (!selectedTile || !selectedChar) {
                return INVALID_MOVE
            }
            G.startingTile = tileId
            G.attackingChar = charId
            G.validMoves = Logic.generateMoves({G, playerID, selectedChar, selectedTile})
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
    chooseRegionToMove: (
        G: GState,
        events: any,
        playerID: string, tileId: string
    ) => {
        G.messages = []
        if (G.startingTile === tileId) {
            G.startingTile = null
            G.attackingChar = null
            G.validMoves = []
        } else if (!G.validMoves?.includes?.(tileId)) {
            return INVALID_MOVE
        } else if (G.mordorDarkMode === G.attackingChar) {
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

            G.mordorDarkMode = G.attackingChar
            Logic.moveCharLogic({G, tileId, events, playerID, endTurn: false})
        } else if (G.goodLightMode && G.goodLightMode !== true && G.goodLightMode !== G.attackingChar) {
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

            G.goodLightMode = G.attackingChar
            Logic.moveCharLogic({G, tileId, events, playerID, endTurn: false})
        } else {
            G.mordorDarkMode = null
            G.goodLightMode = null
            Logic.moveCharLogic({G, tileId, events, playerID})
        }
    },
    chooseSpecialCard: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        card: SpecialCard
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood) {
            Logic.processGoodSpecialCard({G, events, card})
        } else {
            if (G.kingRevealed) {
                return INVALID_MOVE
            }
            Logic.processEvilSpecialCard({G, card})
        }
    },
    setAmbush: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        setAmbush: boolean
    ) => {
        G.messages = []
        if (playerID !== '0') {
            return INVALID_MOVE
        }

        G.players['0'].ambush = setAmbush
    },
    // good specials
    kingRevealedChar: (
        G: GState,
        events: any,
        playerID: string,
        charId: string,
        tileId: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (!isGood || Boolean(GOOD_CHARS[charId]) || G.goodSpecial !== 'KING') {
            return INVALID_MOVE
        }
        const canMove = Logic.generateMoves({
            G,
            playerID: isGood ? '0' : '1',
            selectedChar: {id: charId},
            selectedTile: Logic.getTile(G, tileId),
        })
        if (canMove.length === 0) {
            return INVALID_MOVE
        }
        const aragornTile = Logic.findCharTile(G, GOOD_NAMES.CLASSICARAGORN) || Logic.findCharTile(G, GOOD_NAMES.VARIANTARAGORN)
        Logic.updateHistory(G, `The King Aragorn from ${aragornTile.description} forces ??? to maneuver`)

        G.kingRevealed = charId

        G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 3)
        G.goodSpecial = null
        events.endTurn()
    },
    // evil specials
    palantirRegion: (
        G: GState,
        playerID: string,
        tileId: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood || tileId === 'SHIRE' || G.evilSpecial !== 'PALANTIR') {
            return INVALID_MOVE
        }
        Logic.updateHistory(G, `Evil gazes at ${tileId} through the Palantir`)

        G.palantirNames = G.regions[tileId].currentOccupants
        G.palantirNames.forEach(name => G.characters[name].reveal = true)

        G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 5)
        G.evilSpecial = 'DONE'
        G.palantirRegions = []
    },
    mordorRecall: (
        G: GState,
        events: any,
        playerID: string,
        charId: string,
        tileId: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood || Boolean(GOOD_CHARS[charId]) || G.evilSpecial !== 'MORDORRECALL') {
            return INVALID_MOVE
        }
        Logic.updateHistory(G, `Evil recalls someone to Mordor`)

        // leave current tile
        Logic.removeCharacter({G, unitIdToRemove: charId, tileId})
        // go to new tile
        Logic.addCharacter({G, unitIdToAdd: charId, tileId: 'MORDOR'})

        G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 6)
        G.evilSpecial = null
        events.endTurn()
    },
    crebain: (
        G: GState,
        events: any,
        playerID: string,
        charId: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood || Boolean(EVIL_CHARS[charId]) || G.evilSpecial !== 'CREBAIN') {
            return INVALID_MOVE
        }
        Logic.updateHistory(G, `Crebain now spy upon ${GOOD_CHARS[charId].name}`)

        G.characters[charId].permaReveal = true

        G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 8)
        G.evilSpecial = null
        events.endTurn()
    },
}

export const BATTLE = {
    // goodAction
    chooseGoodAction: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        action: string
    ) => {
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (!isGood) {
            return INVALID_MOVE
        }

        if (action === 'FIGHT') {
            G.goodActions = null
            // proceed to bad options
            G.messages = []
            Logic.updateHistory(G, 'The Fellowship will Fight!')
            Logic.processPreBadActionStage({G, playerID, events, ctx})
        } else if (action === 'SWAP') {
            if (G.defendingChar === GOOD_NAMES.SMEAGOL) {
                G.goodActions = null
                G.messages = []
                G.swapOptions = Logic.findSwapCandidates(G, Logic.getTile(G, G.attackedTile))

                events.setActivePlayers({
                    all: 'goodRetreat',
                })
            } else {
                // assume sam frodo swap
                G.defendingChar = G.characters[GOOD_NAMES.CLASSICSAM] ? GOOD_NAMES.CLASSICSAM : GOOD_NAMES.VARIANTSAM
                G.characters[G.defendingChar].reveal = true

                G.messages = []

                // reprocess good options
                Logic.processPreGoodActionStage({G, playerID, events, ctx})
            }
        } else if (action === 'RETREAT') {
            G.goodActions = null

            // if good retreats, then ORC attack wasted
            if (G.characters[EVIL_NAMES.CLASSICORCS]) {
                G.characters[EVIL_NAMES.CLASSICORCS].tired = true
            }

            const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
            const goodUnit = Logic.getChar(G, attackerIsGood ? G.attackingChar : G.defendingChar)

            // calculate retreat logic
            const retreatMoves = Logic.generateRetreatMoves({
                G,
                isGood: true,
                selectedChar: goodUnit,
                selectedTile: Logic.getTile(G, G.attackedTile),
            })

            if (retreatMoves.length === 1) {
                G.messages = []
                Logic.updateHistory(G, `${goodUnit.name} evades into ${retreatMoves[0]}`)
                // do auto retreat
                Logic.goodRetreatLogic({
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
            const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
            const goodUnit = Logic.getChar(G, attackerIsGood ? G.attackingChar : G.defendingChar)

            if (G.characters[EVIL_NAMES.CLASSICORCS]) {
                G.characters[EVIL_NAMES.CLASSICORCS].tired = true
            }

            G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 4)

            // calculate retreat logic
            const retreatMoves = Logic.generateRetreatMoves({
                G,
                isGood: true,
                selectedChar: {id: 'GWAIHIR'},
                selectedTile: Logic.getTile(G, G.attackedTile),
            })

            if (retreatMoves.length === 1) {
                G.messages = []
                Logic.updateHistory(G, `Gwaihir the Windlord flew ${goodUnit.name} into ${retreatMoves[0]}`)
                // do auto retreat
                Logic.goodRetreatLogic({
                    G,
                    playerID,
                    events,
                    ctx,
                    retreatMove: retreatMoves[0],
                })
            } else if (retreatMoves.length > 1) {
                // move to choose retreat square stage
                Logic.updateHistory(G, `Gwaihir has come to rescue ${goodUnit.name}`)
                G.validMoves = retreatMoves
                events.setActivePlayers({
                    all: 'goodRetreat',
                })
            } else {
                G.badState = 'gwaihir moves error'
            }
        } else if (action === 'CARD-FREE') {
            Logic.updateHistory(G,
                'Aragorn declares no cards. "Here is the Sword that was broken and is forged again!"',
            )

            G.goodActions = null
            G.aragornSkip = true
            const orcRush = G.attackingChar === EVIL_NAMES.CLASSICORCS && !G.characters[EVIL_NAMES.CLASSICORCS].tired

            if (Logic.isGandalfNearby(G) && !orcRush) {
                events.setActivePlayers({
                    all: 'gandalfChoice',
                })
            } else {
                // proceed to bad options
                Logic.processPreBadActionStage({G, playerID, events, ctx})
            }
        } else if (action === 'POWER-UP') {
            // sam powers up near Frodo
            G.characters[GOOD_NAMES.CLASSICSAM].value = 5
            const frodoName = G.characters[GOOD_NAMES.CLASSICFRODO] ? GOOD_NAMES.CLASSICFRODO : GOOD_NAMES.VARIANTFRODO
            G.characters[frodoName].reveal = true

            Logic.updateHistory(G, `Sam's love for Frodo gives him Power 5!`)
            Logic.processPreBadActionStage({G, playerID, events, ctx})
        } else {
            G.badState = 'unexpected good action'
        }
    },
    // goodRetreat
    chooseSmeagolSwap: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        charId: string,
        tileId: string
    ) => {
        if (!G.swapOptions?.includes?.(charId)) {
            return INVALID_MOVE
        }

        G.messages = []
        Logic.updateHistory(G, `Smeagol forces ${Logic.getChar(G, charId).name} to fight their battle`)

        G.swapOptions = null

        // swap locations
        Logic.removeCharacter({G, unitIdToRemove: charId, tileId: tileId})
        Logic.removeCharacter({G, unitIdToRemove: GOOD_NAMES.SMEAGOL, tileId: G.attackedTile})
        Logic.addCharacter({G, unitIdToAdd: charId, tileId: G.attackedTile})
        Logic.addCharacter({G, unitIdToAdd: GOOD_NAMES.SMEAGOL, tileId: tileId})

        G.characters[GOOD_NAMES.SMEAGOL].reveal = G.characters[GOOD_NAMES.SMEAGOL].permaReveal || false
        G.characters[charId].reveal = true
        G.defendingChar = charId

        // restart battle
        Logic.processPreGoodActionStage({G, events, playerID, ctx})
    },
    chooseGoodRetreatRegion: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        tileId: string
    ) => {
        if (!G.validMoves?.includes?.(tileId)) {
            return INVALID_MOVE
        }

        G.messages = []
        Logic.updateHistory(G, `Retreat made into ${G.regions[tileId].description}`)

        G.validMoves = []
        Logic.goodRetreatLogic({
            G,
            playerID,
            events,
            ctx,
            retreatMove: tileId,
        })
    },
    // badAction
    chooseEvilAction: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        action: string
    ) => {
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        if (isGood) {
            return INVALID_MOVE
        }

        G.messages = []

        if (action === 'FIGHT') {
            Logic.updateHistory(G, 'Sauron will Fight')
            G.badActions = null
            // proceed to cards
            if (G.aragornSkip) {
                G.aragornSkip = null
                // proceed to power
                Logic.processPowerFight({G, playerID, events, ctx})
            } else {
                events.setActivePlayers({
                    all: 'pickCards',
                })
            }
        } else if (action === 'RETREAT') {
            G.badActions = null
            const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
            const evilUnit = Logic.getChar(G, attackerIsGood ? G.defendingChar : G.attackingChar)

            // calculate retreat logic
            const retreatMoves = Logic.generateRetreatMoves({
                G,
                isGood: false,
                selectedChar: evilUnit,
                selectedTile: Logic.getTile(G, G.attackedTile),
            })

            if (retreatMoves.length === 1) {
                G.messages = []
                Logic.updateHistory(G, `Gollum sneaks away into ${retreatMoves[0]}`)
                // do auto retreat
                Logic.evilRetreatLogic({
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
        } else if (action === 'CARD-FREE') {
            Logic.updateHistory(G,
                'Saruman says no cards. "I gave you the chance of aiding me willingly, but you have elected the way of pain."',
            )

            G.badActions = null
            G.sarumanSkip = true
            // proceed to power
            if (Logic.isGandalfNearby(G)) {
                events.setActivePlayers({
                    all: 'gandalfChoice',
                })
            } else {
                // proceed to bad options
                Logic.processPowerFight({G, playerID, events, ctx})
            }
        } else {
            G.badState = 'bad action error'
        }
    },
    // badRetreat
    chooseBadRetreatRegion: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        tileId: string
    ) => {
        if (!G.validMoves?.includes?.(tileId)) {
            return INVALID_MOVE
        }

        G.messages = []
        Logic.updateHistory(G, 'Evil retreats to ' + G.regions[tileId].description)
        G.validMoves = []
        Logic.evilRetreatLogic({
            G,
            playerID,
            events,
            ctx,
            retreatMove: tileId,
        })
    },
    // pickCards
    chooseCard: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        card: BattleCard
    ) => {
        G.messages = []

        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        const players = [G.defendingChar, G.attackingChar]

        const gandalfInPlay =
            players.includes(GOOD_NAMES.CLASSICGANDALF) && !players.includes(EVIL_NAMES.WARG)

        const goodHasDiscards = G.players['1']?.cards?.some?.((card) => card.discarded)
        const evilHasDiscards = G.players['0']?.cards?.some?.((card) => card.discarded)

        if (gandalfInPlay) {
            if (isGood && !G.evilCardLocked) {
                return INVALID_MOVE
            } else if (isGood && G.evilCardLocked) {
                if (card.title === 'Magic' && goodHasDiscards) {
                    G.goodPlayMagic = true
                    G.goodCard = null
                } else if (card.title === 'Magic' && !goodHasDiscards) {
                    G.goodPlayMagic = false
                    G.goodCard = card
                } else {
                    if (G.goodPlayMagic) {
                        G.goodPlayMagic = false
                    }
                    G.goodCard = card
                }
            } else if (!isGood) {
                if (card.title === 'Magic' && evilHasDiscards) {
                    G.evilPlayMagic = true
                    G.evilCard = null
                } else if (card.title === 'Magic' && !evilHasDiscards) {
                    G.evilPlayMagic = false
                    G.evilCard = card
                } else {
                    if (card?.discarded && G.evilCard && !G.evilCard.discarded) {
                        return INVALID_MOVE
                    }
                    if (G.evilPlayMagic) {
                        G.evilPlayMagic = false
                    }
                    G.evilCard = card
                }
            }
        } else {
            if (isGood && !G.goodCardLocked) {
                G.goodPlayMagic = card.title === 'Magic' && goodHasDiscards
                G.goodCard = card
            } else if (!isGood && !G.evilCardLocked) {
                G.evilPlayMagic = card.title === 'Magic' && evilHasDiscards
                G.evilCard = card
            }
        }

    },
    lockInCard: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        const players = [G.defendingChar, G.attackingChar]
        const gandalfInPlay =
            players.includes(GOOD_NAMES.CLASSICGANDALF) && !players.includes(EVIL_NAMES.WARG)

        if (isGood && G.goodCard) {
            G.goodCardLocked = true
        } else if (!isGood && G.evilCard) {
            G.evilCardLocked = true
        }

        if (G.goodCardLocked && G.evilCardLocked) {
            if (!gandalfInPlay && (G.goodPlayMagic || G.evilPlayMagic)) {
                // unlock magic cards for next round of choosing
                G.goodCardLocked = !G.goodPlayMagic
                G.evilCardLocked = !G.evilPlayMagic

                // fulfill Magic card(s)
                events.setActivePlayers({
                    all: 'pickMagicCards',
                })
            } else {
                if (gandalfInPlay) {
                    // check to discard magic
                    if (G.goodCard.discarded) {
                        Logic.discardCard({G, isGood: true, knownIndex: 5})
                        Logic.updateHistory(G,
                            `Good uses magic to play ${G.goodCard.title || `+${G.goodCard.value}`}`,
                        )
                    }
                    if (G.evilCard.discarded) {
                        Logic.discardCard({G, isGood: false, knownIndex: 6})
                        Logic.updateHistory(G,
                            `Evil uses magic to play ${G.evilCard.title || `+${G.evilCard.value}`}`,
                        )
                    }
                }

                Logic.processPostCardActions({G, events, ctx, playerID})
            }
        }
    },
    cancelMagic: (
        G: GState,
        playerID: string
    ) => {
        G.messages = []

        const currentFighters = [G.attackingChar, G.defendingChar]
        const gandalfInPlay =
            currentFighters.includes(GOOD_NAMES.CLASSICGANDALF) && !currentFighters.includes(EVIL_NAMES.WARG)

        if (!Logic.isSpecifiedPlayerGood(playerID)) {
            G.evilPlayMagic = false
            G.evilCard = null
        } else if (Logic.isSpecifiedPlayerGood(playerID) && gandalfInPlay) {
            G.goodPlayMagic = false
            G.goodCard = null
        }
    },
    // pickMagicCards
    chooseMagicCard: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        card: BattleCard
    ) => {
        G.messages = []

        if (Logic.isSpecifiedPlayerGood(playerID)) {
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
    lockInMagicCard: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
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
                Logic.discardCard({G, isGood: true, knownIndex: 5})
                Logic.updateHistory(G,
                    `Good uses magic to play ${goodCard.title || `+${goodCard.value}`}`,
                )
            }
            if (G.evilPlayMagic) {
                Logic.discardCard({G, isGood: false, knownIndex: 6})
                Logic.updateHistory(G,
                    `Evil uses magic to play ${evilCard.title || `+${evilCard.value}`}`,
                )
            }

            Logic.processPostCardActions({G, events, ctx, playerID, skipEvil: false})
        }
    },
    // sarumanCards
    goodReselect: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        goodReselect: boolean
    ) => {
        G.messages = []
        if (goodReselect) {
            Logic.updateHistory(G, `Saruman rejects Goods ${G.goodCard.title || `+${G.goodCard.value}`}`)
            G.oldGoodCard = G.goodCard
            G.goodCard = null
            G.goodPlayMagic = false
            G.goodCardLocked = false
        } else {
            // dont recheck for SARUMAN or MOUTH, do GANDALF or GO
            Logic.processPostCardActions({G, events, ctx, playerID, skipEvil: true})
        }

    },
    chooseSarumanCard: (
        G: GState,
        playerID: string,
        card: BattleCard
    ) => {
        G.messages = []

        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        const goodHasDiscards = G.players['1']?.cards?.some?.((card) => card.discarded)

        if (isGood && !G.goodCardLocked) {
            G.goodPlayMagic = card.title === 'Magic' && goodHasDiscards
            G.goodCard = card
        } else if (!isGood) {
            return INVALID_MOVE
        }

    },
    lockInSarumanCard: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)

        if (G.goodPlayMagic && G.goodCard?.title === 'Magic') {
            // you cant JUST play magic, you have to choose another card
            return INVALID_MOVE
        }

        if (isGood && G.goodCard) {
            G.goodCardLocked = true
        } else if (!isGood) {
            return INVALID_MOVE
        }

        if (G.goodCardLocked && G.evilCardLocked) {
            // return previous good card
            const discardedMagic = G.oldGoodCard?.discarded
            if (discardedMagic) {
                // restore magic card
                G.players['1'].cards[5].discarded = false
            } else if (G.goodCard?.discarded) {
                // good used magic, discard the magic
                G.players['1'].cards[5].discarded = true
            }

            G.oldGoodCard = null

            // dont recheck for SARUMAN or MOUTH, do GANDALF or GO
            Logic.processPostCardActions({G, events, ctx, playerID, skipEvil: true})
        }
    },
    // mouthCards
    doMouthChoice: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        useMouthAbility: boolean
    ) => {
        G.messages = []

        if (Logic.isSpecifiedPlayerGood(playerID)) {
            return INVALID_MOVE
        }
        if (useMouthAbility) {
            const plus4 = G.players['0'].cards?.find?.(card => card.id === 3)

            // if already discarded, discard current card
            if (plus4.discarded) {
                Logic.discardCard({G, isGood: false})
            }

            G.evilCard = plus4
        }

        // dont recheck for SARUMAN or MOUTH, do GANDALF or GO
        Logic.processPostCardActions({G, events, ctx, playerID, skipEvil: true})

    },
    // gandalfChoice
    doGandalfOption: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        useGandalfAbility: boolean
    ) => {
        G.messages = []
        const isGood = Logic.isSpecifiedPlayerGood(playerID)

        if (!isGood) {
            return INVALID_MOVE
        }
        if (useGandalfAbility) {
            G.characters[GOOD_NAMES.VARIANTGANDALF].reveal = true
            const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
            if (attackerIsGood) {
                G.characters[G.attackingChar].value += 1
            } else {
                G.characters[G.defendingChar].value += 1
            }

            const gandalfTile = Logic.findCharTile(G, GOOD_NAMES.VARIANTGANDALF)
            Logic.updateHistory(G, `Gandalf adds +1 to Good from ${gandalfTile.description}`)
        }

        if (G.aragornSkip || G.sarumanSkip) {
            G.aragornSkip = null
            G.sarumanSkip = null
            // proceed to power
            Logic.processPowerFight({G, playerID, events, ctx})
        } else {
            Logic.beginCardBattle({G, events, ctx, playerID})
        }

    },
    // grimaRetreat
    chooseGrimaRetreatRegion: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        tileId: string
    ) => {
        if (!G.validMoves?.includes?.(tileId)) {
            return INVALID_MOVE
        }

        G.messages = []
        Logic.updateHistory(G, 'Wormtongue scuttles back to ' + G.regions[tileId].description)
        G.validMoves = []

        const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
        const evilUnit = Logic.getChar(G, attackerIsGood ? G.defendingChar : G.attackingChar)

        // go to new tile
        Logic.addCharacter({G, unitIdToAdd: evilUnit.id, tileId})

        if (G.characters[EVIL_NAMES.WORMTONGUE]) {
            G.characters[EVIL_NAMES.WORMTONGUE].defeated = false
        }

        if (G.grimaCallback === 'start') {
            Logic.startBattleLogic({G, playerID, events, ctx})
        } else {
            Logic.endBattleLogic({G, events, ctx})
        }
    },

    // other battle moves
    chooseCharacterToAttack: (
        G: GState,
        events: any,
        ctx: any,
        playerID: string,
        charId: string
    ) => {
        const isGood = Logic.isSpecifiedPlayerGood(playerID)
        const charList = isGood ? EVIL_CHARS : GOOD_CHARS
        if (!charList[charId]) {
            return INVALID_MOVE
        }

        const battleTile = Logic.getTile(G, G.attackedTile)
        const attacker = Logic.getChar(G, G.attackingChar)
        G.defendingChar = charId
        const defender = Logic.getChar(G, charId)

        battleTile.currentOccupants.forEach((name) => {
            if (name === attacker.id || name === charId) {
                G.characters[name].reveal = true
                if (name === EVIL_NAMES.WATCHER) {
                    G.characters[name].permaReveal = true
                }
            }
        })
        G.battle = null

        G.messages = []
        Logic.updateHistory(G, `${attacker.name} attacks ${defender.name} in ${battleTile.description}`)

        // do instantaneous abilities
        Logic.processPreGoodActionStage({G, events, playerID, ctx})
    },
}
