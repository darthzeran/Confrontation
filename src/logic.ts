import {
    CLASSIC_EVIL_CHARS,
    CLASSIC_GOOD_CHARS,
    DRAFT_PAIRS,
    EVIL_CHARS,
    EVIL_NAMES,
    GOOD_CHARS,
    GOOD_NAMES,
    VARIANT_EVIL_CHARS,
    VARIANT_GOOD_CHARS,
} from './consts.ts'
import {Character, CharacterMap, Location, GState, SpecialCard} from './types.ts';
import {INVALID_MOVE} from 'boardgame.io/core'
// const INVALID_MOVE = undefined

export function getChars({mode, isGood}: { mode: string, isGood: boolean }): CharacterMap {
    if (mode === 'CLASSIC') {
        return isGood ? CLASSIC_GOOD_CHARS : CLASSIC_EVIL_CHARS
    } else if (mode === 'VARIANT') {
        return isGood ? VARIANT_GOOD_CHARS : VARIANT_EVIL_CHARS
    } else {
        return isGood ? GOOD_CHARS : EVIL_CHARS
    }
}

export function getMode(matchId: string) {
    return matchId?.[0] === 'a' ? 'CLASSIC' : matchId?.[0] === 'b' ? 'VARIANT' : 'DRAFT'
}

export function isSpecifiedPlayerGood(id: string) {
    return id === '1'
}

export function isValidTeamTile(isGood: boolean, tile: Location) {
    if (isGood) {
        return tile.id > 9
    } else {
        return tile.id < 6
    }
}

export function getTile(G: GState, tileId: string): Location {
    return {...G.regions[tileId]}
}

export function getChar(G: GState, charId: string): Character {
    return {...G.characters[charId]}
}

export function findCharTile(G: GState, charId: string): Location {
    const tiles = [...Object.values(G.regions)]
    const charTile = tiles.find((region: Location) => region.currentOccupants.includes(charId))
    return charTile ? {...charTile} : null
}

export function getSpecialCharPossibleMoves(charId: string, selectedTile: Location, G: GState, opposingTeam: CharacterMap): string[] {
    if (charId === GOOD_NAMES.TREEBEARD) {
        const fangornOccupants = G.regions['FANGORN'].currentOccupants || []
        const validTarget = fangornOccupants.length === 1 && opposingTeam[fangornOccupants[0]]
        return selectedTile?.title !== 'FANGORN' && validTarget ? ['FANGORN'] : []
    } else if (charId === EVIL_NAMES.VARIANTFLYINGNAZGUL) {
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
    } else if (charId === EVIL_NAMES.CLASSICFLYINGNAZGUL) {
        const locations: Location[] = Object.values(G.regions)
        return locations
            .filter((tile: Location) => {
                return tile.currentOccupants.length === 1 && opposingTeam[tile.currentOccupants[0]]
            })
            .map((tile: Location) => tile.title)
    } else if (charId === EVIL_NAMES.URUKHAI) {
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
    } else if (charId === GOOD_NAMES.CLASSICARAGORN) {
        const additionalMoves = [...selectedTile.directions.DOWN, ...selectedTile.directions.SIDEWAYS]
        return additionalMoves.filter(tileId => {
            const currentTile = getTile(G, tileId)
            // square is valid if attacking
            return Boolean(opposingTeam[currentTile.currentOccupants?.[0]])
        })
    } else if (charId === EVIL_NAMES.CLASSICWITCHKING) {
        const additionalMoves = [...selectedTile.directions.SIDEWAYS]
        return additionalMoves.filter(tileId => {
            const currentTile = getTile(G, tileId)
            // square is valid if attacking
            return Boolean(opposingTeam[currentTile.currentOccupants?.[0]])
        })
    } else if (charId === EVIL_NAMES.BLACKRIDER) {
        const validMoves = {}
        const upMoves = [...selectedTile.directions.DOWN]
        while (upMoves[0]) {
            const currentTile = G.regions[upMoves.shift()]
            // if it has an enemy in it, dont look for more
            if (opposingTeam[currentTile.currentOccupants?.[0]]) {
                validMoves[currentTile.title] = currentTile.title
            }
            // if no enemies, AND not full of teammates, then look for more
            else if (currentTile.currentOccupants.length < currentTile.maxChars) {
                ;[...currentTile.directions.DOWN].forEach((tileName) => {
                    upMoves.push(tileName)
                })
            }
            // if full of teammates, ignore
        }
        return Object.keys(validMoves)
    }

    return []
}

export function generateMoves({G, playerID, selectedChar, selectedTile}: {
    G: GState,
    playerID: string,
    selectedChar: Character | {
        id: string
    },
    selectedTile: Location
}) {
    if (selectedChar.id === EVIL_NAMES.WATCHER && G.characters[EVIL_NAMES.WATCHER]?.permaReveal) {
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

export function generateRetreatMoves({G, isGood, selectedChar, selectedTile}: {
    G: GState,
    isGood: boolean,
    selectedChar: Character | {
        id?: string
    },
    selectedTile: Location
}) {
    const sameTeam = isGood ? GOOD_CHARS : EVIL_CHARS

    let moveOptions = []
    if (selectedChar?.id === GOOD_NAMES.CLASSICFRODO) {
        // can retreat sideways
        moveOptions = [...selectedTile.directions.SIDEWAYS]
    } else if (selectedChar?.id === GOOD_NAMES.PIPPIN) {
        // can retreat backwards
        moveOptions = [...selectedTile.directions.DOWN]
    } else if (selectedChar.id === GOOD_NAMES.FARAMIR) {
        // can retreat sideways
        moveOptions = [...selectedTile.directions.SIDEWAYS]
    } else if (selectedChar.id === 'GWAIHIR') {
        // can retreat backwards or sideways
        moveOptions = [...selectedTile.directions.DOWN, ...selectedTile.directions.SIDEWAYS]
    } else if (selectedChar.id === EVIL_NAMES.WORMTONGUE) {
        // can custom retreat backwards
        let grimaMoveOptions = [...selectedTile.directions.UP]
        return grimaMoveOptions.filter(tileId => getTile(G, tileId).currentOccupants.length === 0)
    } else if (selectedChar.id === EVIL_NAMES.GOLLUM) {
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
    return moveOptions.filter(tileId => {
        const targetTile = getTile(G, tileId)
        return targetTile.currentOccupants.length < targetTile.maxChars &&
            targetTile.currentOccupants.every((name) => sameTeam[name])
    })
}

export function shuffle(array: any[]): any[] {
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

export function isTakeRingGameOver(G: GState): '0' | null {
    const players = [G.attackingChar, G.defendingChar]
    const wargActive = players.includes(EVIL_NAMES.WARG)
    const vFrodoActive = players.includes(GOOD_NAMES.VARIANTFRODO)
    if (G.characters[GOOD_NAMES.CLASSICFRODO]?.defeated) {
        return '0'
    } else if (G.characters[GOOD_NAMES.VARIANTFRODO]?.defeated && ((wargActive && vFrodoActive) || (
        G.characters[GOOD_NAMES.CLASSICSAM]?.defeated
        || G.characters[GOOD_NAMES.VARIANTSAM]?.defeated
    ))) {
        return '0'
    }

    return null
}

export function isCaptureBaseGameOver(G: GState): string | null {
    const mordor = G.regions['MORDOR']
    const shire = G.regions['SHIRE']

    if (
        mordor.currentOccupants?.includes?.(GOOD_NAMES.VARIANTFRODO)
        || mordor.currentOccupants?.includes?.(GOOD_NAMES.CLASSICFRODO)
    ) {
        return '1'
    }

    if (G.characters[GOOD_NAMES.VARIANTFRODO]?.defeated && (
        mordor.currentOccupants?.includes?.(GOOD_NAMES.CLASSICSAM)
        || mordor.currentOccupants?.includes?.(GOOD_NAMES.VARIANTSAM))
    ) {
        return '1'
    }

    if (shire.currentOccupants?.includes?.(EVIL_NAMES.VARIANTWITCHKING)) {
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

export function checkBosomHobbits(tile: Location, charToFind: string): boolean {
    return Boolean(tile.currentOccupants?.includes?.(charToFind))
}

export function updateHistory(G: GState, msg: string) {
    G.history.push(msg)
    G.messages.push(msg)
}

export function findSwapCandidates(G: GState, selectedTile: Location): string[] {
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

export function calculateGoodPreBattle({G, attacker, defender, selectedTile}: {
    G: GState,
    attacker: Character,
    defender: Character,
    selectedTile: Location
}): string[] {
    const attackerIsGood = Boolean(GOOD_CHARS[attacker.id])

    const goodUnit = attackerIsGood ? attacker : defender
    const evilUnit = attackerIsGood ? defender : attacker

    const abilities = []
    // process Fellowship text first
    if (evilUnit.id === EVIL_NAMES.WARG) {
        updateHistory(G, `The Warg has nullified ${goodUnit.name}'s ability`)
        // good cannot use text ability
        // proceed to card phase
        return []
    } else if (goodUnit.id === GOOD_NAMES.FARAMIR && attackerIsGood) {
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
    } else if (goodUnit.id === GOOD_NAMES.SMEAGOL && !attackerIsGood) {
        const swapOptions = findSwapCandidates(G, selectedTile)
        if (swapOptions.length > 0) {
            abilities.push('SWAP')
        }
    } else if (goodUnit.id === GOOD_NAMES.VARIANTARAGORN) {
        abilities.push('CARD-FREE')
    } else if (goodUnit.id === GOOD_NAMES.CLASSICFRODO && !attackerIsGood) {
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

        // if Sam present - add sam option
        if (checkBosomHobbits(selectedTile, GOOD_NAMES.CLASSICSAM)) {
            abilities.push('SWAP')
        }
    } else if (goodUnit.id === GOOD_NAMES.CLASSICSAM) {
        if (checkBosomHobbits(selectedTile, GOOD_NAMES.CLASSICFRODO)
            || checkBosomHobbits(selectedTile, GOOD_NAMES.VARIANTFRODO)) {
            abilities.push('POWER-UP')
        }
    } else if (goodUnit.id === GOOD_NAMES.PIPPIN && attackerIsGood) {
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
    } else if (goodUnit.id === GOOD_NAMES.MERRY && (
        evilUnit.id === EVIL_NAMES.CLASSICWITCHKING
        || evilUnit.id === EVIL_NAMES.VARIANTWITCHKING)
    ) {
        // MERRY instant win
        updateHistory(G, 'Merry stabs the Witch King with a Morgul Blade!')
        return ['WIN']
    } else if (goodUnit.id === GOOD_NAMES.LEGOLAS && (
        evilUnit.id === EVIL_NAMES.CLASSICFLYINGNAZGUL
        || evilUnit.id === EVIL_NAMES.VARIANTFLYINGNAZGUL)
    ) {
        updateHistory(G, 'Legolas shoots the Nazgul as it passes by!')
        // LEGOLAS instant win
        return ['WIN']
    } else if (goodUnit.id === GOOD_NAMES.GIMLI && (
        evilUnit.id === EVIL_NAMES.CLASSICORCS
        || evilUnit.id === EVIL_NAMES.VARIANTORCS)
    ) {
        updateHistory(G, 'Gimli overtakes and defeats the Orcs!')
        // GIMLI instant win
        return ['WIN']
    } else if (goodUnit.id === GOOD_NAMES.BOROMIR) {
        // both die
        return ['SACRIFICE']
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

export function calculateEvilPreBattle({G, attacker, defender, selectedTile}: {
    G: GState,
    attacker: Character,
    defender: Character,
    selectedTile: Location,
}): string[] {
    const attackerIsGood = Boolean(GOOD_CHARS[attacker.id])
    const evilUnit = attackerIsGood ? defender : attacker
    const goodUnit = attackerIsGood ? attacker : defender
    // process Evil text after
    if (evilUnit.id === EVIL_NAMES.GOLLUM) {
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
    } else if (evilUnit.id === EVIL_NAMES.VARIANTSARUMAN && (
        goodUnit.id === GOOD_NAMES.CLASSICGANDALF
        || goodUnit.id === GOOD_NAMES.VARIANTGANDALF)
    ) {
        updateHistory(G, 'Saruman overwhelms Gandalf!')
        return ['WIN']
    } else if (evilUnit.id === EVIL_NAMES.CLASSICSARUMAN) {
        // can choose no cards
        // proceed to power phase
        return ['CARD-FREE']
    }    // AND ability not used yet
    else if (evilUnit.id === EVIL_NAMES.CLASSICORCS && !attackerIsGood && !G.characters[EVIL_NAMES.CLASSICORCS].tired) {
        updateHistory(G, 'The Orcs Orc rush and overwhelm ' + goodUnit.name)
        // instant win
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

export function isGandalfNearby(G: GState): boolean {
    if (G.characters[GOOD_NAMES.VARIANTGANDALF]?.defeated) {
        return false
    }

    const gandalfTile = findCharTile(G, GOOD_NAMES.VARIANTGANDALF)
    if (!gandalfTile) {
        return false
    }
    const gTileDir = gandalfTile.directions
    const adjTiles = [gandalfTile.title, ...gTileDir.UP, ...gTileDir.DOWN, ...gTileDir.SIDEWAYS, ...(MOUNTAIN_SIDEWAYS[gandalfTile.title] || [])]
    return adjTiles.some(tile => tile === G.attackedTile)
}


export function defeatCharacter({G, defeatedUnitId}: {
    G: GState,
    defeatedUnitId: string
}) {
    G.characters[defeatedUnitId].defeated = true
    removeCharacter({G, unitIdToRemove: defeatedUnitId, tileId: G.attackedTile})
}

export function removeCharacter({G, unitIdToRemove, tileId}: {
    G: GState,
    unitIdToRemove: string,
    tileId: string
}) {
    G.regions[tileId].currentOccupants = shuffle([
        ...G.regions[tileId].currentOccupants.filter((name) => name !== unitIdToRemove),
    ])
}

export function addCharacter({G, unitIdToAdd, tileId}: {
    G: GState,
    unitIdToAdd: string,
    tileId: string
}) {
    G.regions[tileId].currentOccupants = shuffle([
        ...G.regions[tileId].currentOccupants,
        unitIdToAdd,
    ])
}

export function hideCharacters(G: GState) {
    Object.keys(G.characters).forEach((name) => {
        if (!G.characters[name].permaReveal && !G.palantirNames?.includes(name)) {
            G.characters[name].reveal = false
        }
    })
}

export function processCustomStrengths(G: GState) {
    if (G.attackingChar === EVIL_NAMES.VARIANTORCS) {
        G.characters[EVIL_NAMES.VARIANTORCS].value = 6
    }
    if (G.regions['GONDOR'].currentOccupants.includes(GOOD_NAMES.THEODEN)
        || G.regions['ROHAN'].currentOccupants.includes(GOOD_NAMES.THEODEN)
    ) {
        G.characters[GOOD_NAMES.THEODEN].value = 4
    }
    if (G.regions['FANGORN'].currentOccupants.includes(GOOD_NAMES.TREEBEARD)) {
        G.characters[GOOD_NAMES.TREEBEARD].value = 6
    }
    if (G.defendingChar === GOOD_NAMES.VARIANTSAM) {
        const attacker = getChar(G, G.attackingChar)
        G.characters[GOOD_NAMES.VARIANTSAM].value = attacker.value
    }
}

export function processPreGoodActionStage({G, events, playerID, ctx}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}) {
    // process new strengths
    processCustomStrengths(G)

    const goodOptions = calculateGoodPreBattle({
        G,
        attacker: getChar(G, G.attackingChar),
        defender: getChar(G, G.defendingChar),
        selectedTile: getTile(G, G.attackedTile),
    })

    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnit = getChar(G, attackerIsGood ? G.attackingChar : G.defendingChar)
    const evilUnit = getChar(G, attackerIsGood ? G.defendingChar : G.attackingChar)


    if (goodOptions.length > 0) {
        // handle instant wins
        if (goodOptions[0] === 'WIN') {
            // remove defeated char
            defeatCharacter({G, defeatedUnitId: evilUnit.id})
            startBattleLogic({G, playerID, events, ctx})
        } else if (goodOptions[0] === 'SACRIFICE') {
            updateHistory(G, `Both ${goodUnit.name} and ${evilUnit.name} die fighting!`)
            // remove both chars
            defeatCharacter({G, defeatedUnitId: goodUnit.id})
            defeatCharacter({G, defeatedUnitId: evilUnit.id})
            endBattleLogic({G, events, ctx})
        } else {
            // show good options
            G.goodActions = [...goodOptions, 'FIGHT']
            events.setActivePlayers({
                all: 'goodAction',
            })
        }
    } else {
        // proceed to bad options
        processPreBadActionStage({G, playerID, events, ctx})
    }
}

export function processPreBadActionStage({G, playerID, events, ctx}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}) {
    G.goodActions = null

    const badOptions = calculateEvilPreBattle({
        G,
        attacker: getChar(G, G.attackingChar),
        defender: getChar(G, G.defendingChar),
        selectedTile: getTile(G, G.attackedTile),
    })

    if (badOptions.length === 0) {
        G.badActions = null
        if (G.aragornSkip) {
            G.aragornSkip = null
            // proceed to power
            processPowerFight({G, playerID, events, ctx});
        } else {
            // proceed to cards
            events.setActivePlayers({
                all: 'pickCards',
            })
        }
    } else {
        if (badOptions[0] === 'WIN') {
            const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
            const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar

            // remove defeated char
            defeatCharacter({G, defeatedUnitId: goodUnitId})

            if (G.attackingChar === EVIL_NAMES.CLASSICORCS) {
                G.characters[EVIL_NAMES.CLASSICORCS].tired = true
            }

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

export function checkCanWormTongueEscape(G: GState) {
    if (!G.attackedTile || !G.attackingChar || !G.defendingChar) {
        return false
    }

    // make sure Grima has a chance to escape
    const players = [G.attackingChar, G.defendingChar]
    if (
        players.includes(EVIL_NAMES.WORMTONGUE)
        && G.characters[EVIL_NAMES.WORMTONGUE].defeated
        && !G.characters[EVIL_NAMES.WORMTONGUE].permaDefeated
    ) {
        const retreatMoves = generateRetreatMoves({
            G,
            isGood: false,
            selectedChar: {id: EVIL_NAMES.WORMTONGUE},
            selectedTile: getTile(G, G.attackedTile)
        })
        if (retreatMoves.length > 0) {
            return true
        }
        G.characters[EVIL_NAMES.WORMTONGUE].permaDefeated = true
        return false
    }

    return false
}

export function wormTongueCheck({G, events, location}: {
    G: GState,
    events: any,
    location: string
}) {
    G.validMoves = generateRetreatMoves({
        G,
        isGood: false,
        selectedChar: {id: EVIL_NAMES.WORMTONGUE},
        selectedTile: getTile(G, G.attackedTile)
    })
    G.grimaCallback = location
    events.setActivePlayers({
        all: 'grimaRetreat',
    })
}

export function startBattleLogic({G, playerID, events, ctx}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}) {
    // hide all characters because we can
    hideCharacters(G)
    checkReshuffle(G)

    // make sure Grima has a chance to escape
    if (checkCanWormTongueEscape(G)) {
        wormTongueCheck({G, events, location: 'start'})
    } else {
        // ensure cards are reset
        G.goodCard = null
        G.evilCard = null
        G.goodPlayMagic = false
        G.evilPlayMagic = false
        G.goodCardLocked = false
        G.evilCardLocked = false
        G.aragornSkip = null

        // check for win
        const winner = isTakeRingGameOver(G)
        if (winner) {
            updateHistory(G, 'The ring was lost - Sauron wins!')
            events.endGame({winner})
        } else {
            const battleTile = getTile(G, G.attackedTile)
            if (battleTile.currentOccupants.length === 1 ||
                (G.attackedTile !== findCharTile(G, G.attackingChar)?.title)
            ) {
                updateHistory(G, 'This battle is over')
                // we battled everyone
                endBattleLogic({G, events, ctx})
            } else if (battleTile.currentOccupants.length > 2) {
                // wait for player to choose opponent
                G.battle = {[ctx.currentPlayer]: 'choose'}
                events.setActivePlayers({value: null})
            } else if (battleTile.currentOccupants.length === 0) {
                // both retreated
                updateHistory(G, 'Both challengers have FLED')
                endBattleLogic({G, events, ctx})
            } else {
                battleTile.currentOccupants.forEach((name) => {
                    G.characters[name].reveal = true
                    if (name === EVIL_NAMES.WATCHER) {
                        G.characters[name].permaReveal = true
                    }
                    if (name !== G.attackingChar) {
                        G.defendingChar = name
                    }
                })

                const attacker = getChar(G, G.attackingChar)
                const defender = getChar(G, G.defendingChar)

                updateHistory(G,
                    `The battle between ${attacker.name} and ${defender.name} in ${battleTile.description} commences`,
                )

                // do instantaneous abilities
                processPreGoodActionStage({G, events, playerID, ctx})
            }
        }
    }
}

export function endBattleLogic({G, events, ctx}: {
    G: GState,
    events: any,
    ctx: any,
}) {
    // hide all characters because we can
    hideCharacters(G)
    // reset character values
    resetAllCharValues(G)

    // check for win
    const winner = isTakeRingGameOver(G)
    if (winner) {
        updateHistory(G, 'The ring was lost - Sauron wins!')
        events.endGame({winner})
    } else {
        // make sure Grima has a chance to escape
        if (checkCanWormTongueEscape(G)) {
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
            G.aragornSkip = null

            // track who the next player should be
            G.lastPlayerId = ctx.currentPlayer === '1' ? '0' : '1'

            // return to wherever we were
            events.setActivePlayers({value: null})
            events.setPhase('move')
        }
    }
}


export function resetAllCharValues(G: GState) {
    // Gandalf can edit anyone, so account for that
    Object.values(GOOD_CHARS).forEach((char: Character) => {
        if (G.characters[char.id]) {
            G.characters[char.id].value = char.value
        }
    })
    Object.values(EVIL_CHARS).forEach((char: Character) => {
        if (G.characters[char.id]) {
            G.characters[char.id].value = char.value
        }
    })
}

export function goodRetreatLogic({G, playerID, events, ctx, retreatMove}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string,
    retreatMove: string
}) {
    // actions are null, we chose to retreat
    G.goodActions = null

    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar

    // leave current tile
    removeCharacter({G, unitIdToRemove: goodUnitId, tileId: G.attackedTile})

    // go to new tile
    addCharacter({G, tileId: retreatMove, unitIdToAdd: goodUnitId})

    // check to see if we battle again
    startBattleLogic({G, playerID, events, ctx})
}

export function evilRetreatLogic({G, playerID, events, ctx, retreatMove}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string,
    retreatMove: string
}) {
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const evilUnitId = attackerIsGood ? G.defendingChar : G.attackingChar

    // leave current tile
    removeCharacter({G, unitIdToRemove: evilUnitId, tileId: G.attackedTile})
    // go to new tile
    addCharacter({G, tileId: retreatMove, unitIdToAdd: evilUnitId})

    // check if we are battling cards
    if (G.goodCard?.title === 'Retreat (Backwards)') {
        // do good retreat
        const goodRetreated = processGoodRetreat({G, events, ctx, playerID})
        if (!goodRetreated) {
            updateHistory(G, 'Good has NO escape!')
            endBattleLogic({G, events, ctx})
        }
    } else {
        startBattleLogic({G, playerID, events, ctx})
    }
}

export function processGoodRetreat({G, events, ctx, playerID}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}): boolean {
    const goodRetreatMoves = generateRetreatMoves({
        G,
        isGood: true,
        selectedChar: {id: null},
        selectedTile: getTile(G, G.attackedTile),
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

export function processEvilCardRetreat({G, events, ctx, playerID}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}) {
    const evilRetreatMoves = generateRetreatMoves({
        G,
        isGood: false,
        selectedChar: {id: null},
        selectedTile: getTile(G, G.attackedTile),
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

export function processPostCardActions({G, playerID, events, ctx, skipEvil = false}: {
    G: GState,
    playerID: string,
    events: any,
    ctx: any,
    skipEvil?: boolean
}) {
    const players = [G.defendingChar, G.attackingChar]
    const goodCardsLeft = G.players['1']?.cards?.filter?.((card) => !card.discarded) || []

    if (players.includes(EVIL_NAMES.VARIANTSARUMAN) && goodCardsLeft.length > 1 && !skipEvil) {
        G.oldGoodCard = null
        events.setActivePlayers({
            all: 'sarumanCards',
        })
    } else if (players.includes(EVIL_NAMES.MOUTH) && !skipEvil && G.evilCard?.value !== 4) {
        events.setActivePlayers({
            all: 'mouthCards',
        })
    } else if (!players.includes(GOOD_NAMES.VARIANTGANDALF) && isGandalfNearby(G)) {
        events.setActivePlayers({
            all: 'gandalfChoice',
        })
    } else {
        beginCardBattle({G, events, ctx, playerID})
    }
}

export function beginCardBattle({G, events, ctx, playerID}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}) {
    const goodCard = G.goodCard
    const evilCard = G.evilCard
    const goodInert = goodCard.title === 'Magic' && !G.goodPlayMagic
    const evilInert = evilCard.title === 'Magic' && !G.evilPlayMagic

    updateHistory(G,
        `Cards: Good's ${goodInert ? 'inert ' : ''}${
            goodCard.title || `+${goodCard.value}`
        } versus Evil's ${evilInert ? 'inert ' : ''}${
            evilCard.title || `+${evilCard.value}`
        }`,
    )

    // PROCEED TO EVAL
    processPlayedCards({G, events, ctx, playerID})
}

export function discardCard({G, isGood, knownIndex}: {
    G: GState,
    isGood: boolean,
    knownIndex?: number
}) {
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

export function processGoodTextCards({G, events, ctx, playerID, evilUsePower}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string,
    evilUsePower: boolean
}) {
    const players = [G.attackingChar, G.defendingChar]
    const elrondActive = players.includes(GOOD_NAMES.ELROND)
    const frodoActive = players.includes(GOOD_NAMES.VARIANTFRODO)
    const evilTextNegated = (elrondActive && G.evilCard.title !== 'Retreat (Sideways)' && G.evilCard.type === 'text') || frodoActive

    if (evilTextNegated) {
        updateHistory(G, `${elrondActive ? 'Elrond' : frodoActive ? 'Frodo' : 'Good'} ignores the Evil card`)
    }
    if (G.goodCard.title === 'Noble Sacrifice') {
        playNobleSacrifice({G, events, ctx})
        // SPLIT
    } else if (G.goodCard.title === 'Elven Cloak' || G.goodCard.title === 'Magic') {
        let evilPower = 0
        if (G.goodCard.title === 'Elven Cloak') {
            G.history.push('The Elven Cloak negates Evil Power!')
        } else {
            // we played inert magic, check for bad power
            if (G.evilCard.type === 'strength' && evilUsePower) {
                // add good power
                evilPower = G.goodCard.value
            }
        }
        // DO battle
        processPowerFight({
            G,
            playerID,
            events,
            ctx,
            evilPowerBoost: evilPower,
        })
    } else if (G.goodCard.title === 'Retreat (Backwards)') {
        const goodRetreated = processGoodRetreat({G, events, ctx, playerID})
        if (!goodRetreated) {
            updateHistory(G, 'Good has NO escape!')
            let evilPower = 0
            if (G.evilCard.type === 'strength' && evilUsePower) {
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
        G.badState = 'good text cards else error'
    }
}

export function processPlayedCards({G, events, ctx, playerID}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string
}) {
    // discard cards
    discardCard({G, isGood: true})
    discardCard({G, isGood: false})

    const players = [G.attackingChar, G.defendingChar]
    const elrondActive = players.includes(GOOD_NAMES.ELROND)
    const frodoActive = players.includes(GOOD_NAMES.VARIANTFRODO)
    const trollInPlay = players.includes(EVIL_NAMES.CAVETROLL)
    const evilTextNegated = (elrondActive && G.evilCard.title !== 'Retreat (Sideways)' && G.evilCard.type === 'text') || frodoActive

    if (G.evilCard.type === 'text' && !evilTextNegated && !trollInPlay) {
        if (G.evilCard.title === 'Retreat (Sideways)') {
            const evilRetreated = processEvilCardRetreat({G, events, ctx, playerID})
            if (!evilRetreated) {
                updateHistory(G, 'Evil has NO escape!')
                if (G.goodCard.type === 'text') {
                    processGoodTextCards({G, events, ctx, playerID, evilUsePower: false})
                } else {
                    let goodPower = 0
                    if (G.goodCard.type === 'strength') {
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
        } else if (G.evilCard.title === 'The Eye Of Sauron') {
            updateHistory(G, 'Saurons Eye negates any Good Text')
            let goodPower = 0
            if (G.goodCard.type === 'strength') {
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
        } else {
            // evil played inert magic
            if (G.goodCard.type === 'text') {
                processGoodTextCards({G, events, ctx, playerID, evilUsePower: !trollInPlay})
            } else {
                let goodPower = 0
                if (G.goodCard.type === 'strength') {
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
    } else if (G.goodCard.type === 'text') {
        processGoodTextCards({G, events, ctx, playerID, evilUsePower: !trollInPlay})
    } else {
        if (evilTextNegated) {
            updateHistory(G, `${elrondActive ? 'Elrond' : frodoActive ? 'Frodo' : 'Good'} ignores the Evil card`)
        }
        let goodPower = 0
        let evilPower = 0

        if (G.goodCard.type === 'strength') {
            goodPower = G.goodCard.value
        }
        if (G.evilCard.type === 'strength' && !trollInPlay) {
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

export function playNobleSacrifice({G, events, ctx}: {
    G: GState,
    events: any,
    ctx: any,
}) {
    const attacker = getChar(G, G.attackingChar)
    const defender = getChar(G, G.defendingChar)
    updateHistory(G,
        `Both ${attacker.name} and ${defender.name} fight to the bitter end`,
    )

    // kill both
    defeatCharacter({G, defeatedUnitId: G.attackingChar})
    defeatCharacter({G, defeatedUnitId: G.defendingChar})

    // end battle
    endBattleLogic({G, events, ctx})
}

export function processShelobAbility({G, events, ctx}: { G: GState, events: any, ctx: any, }) {
    const inGondor = G.attackedTile === 'GONDOR'
    const gondorFull =
        G.regions['GONDOR'].currentOccupants.length === G.regions['GONDOR'].maxChars
    const inGondorChar = G.regions['GONDOR'].currentOccupants?.[0]
    const gondorGood = inGondorChar && Boolean(GOOD_CHARS[inGondorChar])

    if (!inGondor && (gondorFull || gondorGood)) {
        updateHistory(G, 'Shelob cannot go into Gondor and withers away.')
        defeatCharacter({G, defeatedUnitId: EVIL_NAMES.SHELOB})
    } else {
        updateHistory(G, 'Shelob goes to enjoy her victory in Gondor')
        // leave current tile
        removeCharacter({G, unitIdToRemove: EVIL_NAMES.SHELOB, tileId: G.attackedTile})
        // go to new tile
        addCharacter({G, unitIdToAdd: EVIL_NAMES.SHELOB, tileId: 'GONDOR'})
    }

    endBattleLogic({G, events, ctx})
}

export function processPowerFight({G, playerID, events, ctx, goodPowerBoost = 0, evilPowerBoost = 0}: {
    G: GState,
    events: any,
    ctx: any,
    playerID: string,
    goodPowerBoost?: number,
    evilPowerBoost?: number
}) {
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnit = getChar(G, attackerIsGood ? G.attackingChar : G.defendingChar)
    const evilUnit = getChar(G, attackerIsGood ? G.defendingChar : G.attackingChar)

    const goodTotal = goodUnit.value + goodPowerBoost
    const evilTotal = evilUnit.value + evilPowerBoost

    if (goodTotal > evilTotal) {
        updateHistory(G, `${goodUnit.name} (${goodTotal}) has vanquished ${evilUnit.name} (${evilTotal})`)
        defeatCharacter({G, defeatedUnitId: evilUnit.id})

        if (attackerIsGood) {
            startBattleLogic({G, playerID, events, ctx})
        } else {
            endBattleLogic({G, events, ctx})
        }
    } else if (goodTotal < evilTotal) {
        defeatCharacter({G, defeatedUnitId: goodUnit.id})
        updateHistory(G, `${evilUnit.name} (${evilTotal}) has annihilated ${goodUnit.name} (${goodTotal})`)

        // process SHELOB special ability
        if (evilUnit.id === EVIL_NAMES.SHELOB) {
            processShelobAbility({G, events, ctx})
        } else {
            if (attackerIsGood) {
                endBattleLogic({G, events, ctx})
            } else {
                startBattleLogic({G, playerID, events, ctx})
            }
        }
    } else {
        playNobleSacrifice({G, events, ctx})
    }
}

export function preCheckShadowFax(G: GState) {
    const validMoves = []
    const aliveGoodPlayers = Object.keys(GOOD_CHARS).filter(goodName => G.characters[goodName] && !G.characters[goodName].defeated)

    return aliveGoodPlayers.some(goodName => {
        // check for a forward move with no enemies in it
        const charTile = findCharTile(G, goodName)
        const upMoves = [
            ...charTile.directions['UP'],
            ...((charTile.directions.SPECIAL) || []),
        ]
        for (let i = 0; i < upMoves.length; i++) {
            const currentTile = G.regions[upMoves[i]]
            // square is valid if not full of same team OR has other team in it
            if (
                currentTile.currentOccupants.length < currentTile.maxChars &&
                !EVIL_CHARS[currentTile.currentOccupants?.[0]]
            ) {
                validMoves.push(upMoves[i])
            }
        }

        return validMoves.length > 1
    })
}

export function processPalantir(G: GState) {
    G.palantirRegions = []
    Object.values(G.regions).forEach((region: Location) => {
        if (region.title === 'MORDOR' || region.title === 'SHIRE') {
            return
        }

        if (GOOD_CHARS[region.currentOccupants?.[0]]) {
            G.palantirRegions.push(region.title)
        }
    })
}


export function canEvilCharsMove(G: GState) {
    const evilChars = []
    Object.values(G.characters).forEach((c: Character) => {
        if (EVIL_NAMES[c.id] && !c.defeated) {
            evilChars.push(c.id)
        }
    })

    return evilChars.filter(evilName => {
        const char = getChar(G, evilName)
        const tile = findCharTile(G, evilName)
        const moves = generateMoves({G, playerID: '0', selectedChar: char, selectedTile: tile})
        return moves.length > 0
    })
}

export function canPlayMordorDark(G: GState) {
    return canEvilCharsMove(G).length > 1
}

export function canPlayKingRevealed(G: GState) {
    return canEvilCharsMove(G).length > 0
}

export function processGoodSpecialCard({G, events, card}: {
    G: GState,
    events: any,
    card: SpecialCard,
}) {
    if (card.id === 1) {
        // check to make sure someone has a free move
        const canPlayShadowFax = preCheckShadowFax(G)
        if (canPlayShadowFax) {
            G.goodLightMode = true
            G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 1)
            G.goodSpecial = 'DONE'
        } else {
            updateHistory(G, 'Good has no valid shadowfax moves to play')
            return INVALID_MOVE
        }
    } else if (card.id === 2) {
        const fangorn = G.regions['FANGORN']
        const gandalfName = G.characters[GOOD_NAMES.CLASSICGANDALF] ? GOOD_NAMES.CLASSICGANDALF : GOOD_NAMES.VARIANTGANDALF
        if (
            G.characters[gandalfName].defeated
            && fangorn.currentOccupants.length < fangorn.maxChars
            && !EVIL_CHARS[fangorn.currentOccupants?.[0]]
        ) {
            G.characters[gandalfName].defeated = false
            G.characters[gandalfName].permaReveal = false
            G.characters[gandalfName].white = true

            // go to new tile
            addCharacter({G, unitIdToAdd: gandalfName, tileId: 'FANGORN'})

            G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 2)
            G.goodSpecial = null
            updateHistory(G, 'Yes, that was what they used to call me - Gandalf the Grey. I am Gandalf the White.')
            events.endTurn()
        }
    } else if (card.id === 3) {
        const aragornName = G.characters[GOOD_NAMES.CLASSICARAGORN] ? GOOD_NAMES.CLASSICARAGORN : GOOD_NAMES.VARIANTARAGORN
        if (canPlayKingRevealed(G) && !G.characters[aragornName].defeated) {
            G.characters[aragornName].reveal = true
            G.goodSpecial = 'KING'
        } else {
            updateHistory(G, 'The Dark of Mordor cannot be played')
        }
    } else if (card.id === 4) {
        // doesnt get here, determined in pre good actions
        return INVALID_MOVE
    }
}

export function processEvilSpecialCard({G, card}: {
    G: GState,
    card: SpecialCard,
}) {
    if (card.id === 5) {
        G.evilSpecial = 'PALANTIR'
        processPalantir(G)
    } else if (card.id === 6) {
        const mordor = G.regions['MORDOR']
        const mordorPpl = mordor.currentOccupants
        if (mordorPpl.length === mordor.maxChars || Boolean(GOOD_CHARS[mordorPpl?.[0]])) {
            return INVALID_MOVE
        }
        G.evilSpecial = 'MORDORRECALL'
    } else if (card.id === 7) {
        // dark of mordor
        const validMoves = canPlayMordorDark(G)
        if (validMoves) {
            G.mordorDarkMode = true
            G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 7)
            G.evilSpecial = 'DONE'
        } else {
            updateHistory(G, 'The Dark of Mordor cannot be played')
        }

    } else if (card.id === 8) {
        const goodCharAlive = Object.values(G.characters).some((c: Character) => {
            return GOOD_CHARS[c.id] && !c.defeated
        })
        if (!goodCharAlive) {
            return INVALID_MOVE
        }
        G.evilSpecial = 'CREBAIN'
    }
}

export function didBalrogAmbush({G, tileId, events, playerID}: {
    G: GState, events: any,
    tileId: string,
    playerID: string,
}) {
    const isGood = isSpecifiedPlayerGood(playerID)
    const selectedChar = getChar(G, G.attackingChar)
    const balrogInMoria = G.regions['CARADHRAS'].currentOccupants?.includes(EVIL_NAMES.BALROG)
    const ambushSet = G.players['0'].ambush
    const goodPlayerInMoria = G.startingTile === 'EREGION' && tileId === 'FANGORN'

    if (isGood && goodPlayerInMoria && balrogInMoria && ambushSet) {
        // kill character
        G.characters[selectedChar.id].defeated = true
        // in case shadowfax was on
        G.goodLightMode = null;
        G.goodSpecial = null;

        // check for evil win
        const winner = isTakeRingGameOver(G)
        if (winner) {
            updateHistory(G, 'Evil wins - the Ringbearer was ambushed in Moria')
            events.endGame({winner})
        } else {
            updateHistory(G, `The Balrog ambushed ${selectedChar.name} in the Mines of Moria declaring, "YOU shall not pass."`)

            // EOT
            G.attackingChar = null
            G.attackedTile = null
            G.startingTile = null
            events.endTurn()
        }
        return true
    }
    return false
}

export function moveCharLogic({G, tileId, events, playerID, endTurn = true}: {
    G: GState,
    events: any,
    tileId: string,
    playerID: string,
    endTurn?: boolean
}) {
    G.kingRevealed = null
    const isGood = isSpecifiedPlayerGood(playerID)
    const opposingChars = isGood ? EVIL_CHARS : GOOD_CHARS
    const previousTile = G.regions[G.startingTile]
    const newTile = getTile(G, tileId)
    if (!newTile || !G.attackingChar) {
        return INVALID_MOVE
    }

    G.validMoves = []
    removeCharacter({G, unitIdToRemove: G.attackingChar, tileId: G.startingTile})

    // do balrog ambush check
    const didAmbush = didBalrogAmbush({G, tileId, events, playerID})

    if (!didAmbush) {
        addCharacter({G, unitIdToAdd: G.attackingChar, tileId: tileId})

        let mover = isSpecifiedPlayerGood(playerID) ? 'Good' : 'Evil'
        updateHistory(G,
            `${mover} moved from ${previousTile.description} to ${
                newTile.description
            }`,
        )

        // check for win
        const winner = isCaptureBaseGameOver(G)
        if (winner) {
            updateHistory(G,
                winner === '0'
                    ? 'Evil won by Scouring the Shire!'
                    : 'Good won by destroying the ring!',
            )
            events.endGame({winner})
        } else {
            // prepare for fight
            G.attackedTile = tileId
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
}

export function getDraftChar(isGood: boolean, charId: string): Character {
    const matchChar = DRAFT_PAIRS[charId]
    return isGood ? GOOD_CHARS[matchChar] : EVIL_CHARS[matchChar]
}

export function getRandomChars(G: GState, charMap: CharacterMap) {
    let players = []
    const noUseChars = {}
    const shuffled = shuffle([...Object.keys(charMap)])
    shuffled.forEach(charId => {
        if (!noUseChars[charId]) {
            players.push(charId)
            G.characters[charId] = charMap[charId]
            const anti = DRAFT_PAIRS[charId]
            noUseChars[anti] = anti
        }
    })

    return players
}

export function declareChars(G: GState) {
    const goodChars = []
    const evilChars = []

    const mode = getMode(G.matchID) === 'DRAFT'

    Object.values(G.characters).forEach((char: Character) => {
        if (GOOD_NAMES[char.id]) {
            goodChars.push(`${char.name}-${mode ? (char.classic ? 'Classic' : 'Variant') : ''}`)
        } else {
            evilChars.push(`${char.name}-${mode ? (char.classic ? 'Classic' : 'Variant') : ''}`)
        }
    })

    G.messages.push('Good chooses:' + goodChars.join(',\n'))
    G.messages.push('Evil chooses:' + evilChars.join(',\n'))

    G.history.push(...goodChars, 'GOOD CHOOSES:', ...evilChars, 'EVIL CHOOSES:',)
}

export function checkReshuffle(G: GState) {
    if (G.players['0'].cards.every((card) => card.discarded)) {
        G.players['0'].cards.forEach((_, index) => {
            G.players['0'].cards[index].discarded = false
            G.players['1'].cards[index].discarded = false
        })
        updateHistory(G, 'Cards Reshuffled')
    }
}
