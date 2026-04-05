import {
    CLASSIC_EVIL_CHARS,
    CLASSIC_GOOD_CHARS,
    DRAFT_PAIRS,
    EVIL_CARDS,
    EVIL_CHARS,
    EVIL_NAMES,
    EVIL_SPECIAL_CARDS,
    GOOD_CARDS,
    GOOD_CHARS,
    GOOD_NAMES,
    GOOD_SPECIAL_CARDS,
    LOCATIONS,
    VARIANT_EVIL_CHARS,
    VARIANT_GOOD_CHARS,
} from './consts.ts'
import {Character, CharacterMap, Location, GState, SpecialCard, BattleCard} from './types';
import {INVALID_MOVE} from 'boardgame.io/core'

// const INVALID_MOVE = undefined

function getChars({mode, isGood}: { mode: string, isGood: boolean }): CharacterMap {
    if (mode === 'CLASSIC') {
        return isGood ? CLASSIC_GOOD_CHARS : CLASSIC_EVIL_CHARS
    } else if (mode === 'VARIANT') {
        return isGood ? VARIANT_GOOD_CHARS : VARIANT_EVIL_CHARS
    } else {
        return isGood ? GOOD_CHARS : EVIL_CHARS
    }
}

function getMode(matchId: string) {
    return matchId?.[0] === 'a' ? 'CLASSIC' : matchId?.[0] === 'b' ? 'VARIANT' : 'DRAFT'
}

function isSpecifiedPlayerGood(id: string) {
    return id === '1'
}

function isValidTeamTile(isGood: boolean, tile: Location) {
    if (isGood) {
        return tile.id > 9
    } else {
        return tile.id < 6
    }
}

function getTile(G: GState, tileId: string): Location {
    return {...G.regions[tileId]}
}

function getChar(G: GState, charId: string): Character {
    return {...G.characters[charId]}
}

function findCharTile(G: GState, charId: string): Location {
    const tiles = [...Object.values(G.regions)]
    const charTile = tiles.find((region: Location) => region.currentOccupants.includes(charId))
    return charTile ? {...charTile} : null
}

function getSpecialCharPossibleMoves(charId: string, selectedTile: Location, G: GState, opposingTeam: CharacterMap): string[] {
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

function generateMoves({G, playerID, selectedChar, selectedTile}: {
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

function generateRetreatMoves({G, isGood, selectedChar, selectedTile}: {
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

function shuffle(array: string[]): string[] {
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

function isTakeRingGameOver(G: GState): '0' | null {
    const players = [G.attackingChar, G.defendingChar]
    const wargActive = players.includes(EVIL_NAMES.WARG)
    if (G.characters[GOOD_NAMES.CLASSICFRODO]?.defeated) {
        return '0'
    } else if (G.characters[GOOD_NAMES.VARIANTFRODO]?.defeated && (wargActive || (
        G.characters[GOOD_NAMES.CLASSICSAM]?.defeated
        || G.characters[GOOD_NAMES.VARIANTSAM]?.defeated
    ))) {
        return '0'
    }

    return null
}

function isCaptureBaseGameOver(G: GState): string | null {
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

function checkBosomHobbits(tile: Location, charToFind: string): boolean {
    return Boolean(tile.currentOccupants?.includes?.(charToFind))
}

function updateHistory(G: GState, msg: string) {
    G.history.push(msg)
    G.messages.push(msg)
}

function findSwapCandidates(G: GState, selectedTile: Location): string[] {
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

function calculateGoodPreBattle({G, attacker, defender, selectedTile}: {
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

function calculateEvilPreBattle({G, attacker, defender, selectedTile}: {
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

function isGandalfNearby(G: GState): boolean {
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


function defeatCharacter({G, defeatedUnitId}: {
    G: GState,
    defeatedUnitId: string
}) {
    G.characters[defeatedUnitId].defeated = true
    removeCharacter({G, unitIdToRemove: defeatedUnitId, tileId: G.attackedTile})
}

function removeCharacter({G, unitIdToRemove, tileId}: {
    G: GState,
    unitIdToRemove: string,
    tileId: string
}) {
    G.regions[tileId].currentOccupants = shuffle([
        ...G.regions[tileId].currentOccupants.filter((name) => name !== unitIdToRemove),
    ])
}

function addCharacter({G, unitIdToAdd, tileId}: {
    G: GState,
    unitIdToAdd: string,
    tileId: string
}) {
    G.regions[tileId].currentOccupants = shuffle([
        ...G.regions[tileId].currentOccupants,
        unitIdToAdd,
    ])
}

function hideCharacters(G: GState) {
    Object.keys(G.characters).forEach((name) => {
        if (!G.characters[name].permaReveal && !G.palantirNames?.includes(name)) {
            G.characters[name].reveal = false
        }
    })
}

function processCustomStrengths(G: GState) {
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

function processPreGoodActionStage({G, events, playerID, ctx}: {
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

function processPreBadActionStage({G, playerID, events, ctx}: {
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

function checkCanWormTongueEscape(G: GState) {
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

function wormTongueCheck({G, events, location}: {
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

function startBattleLogic({G, playerID, events, ctx}: {
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

function endBattleLogic({G, events, ctx}: {
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


function resetAllCharValues(G: GState) {
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

function goodRetreatLogic({G, playerID, events, ctx, retreatMove}: {
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

function evilRetreatLogic({G, playerID, events, ctx, retreatMove}: {
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

function processGoodRetreat({G, events, ctx, playerID}: {
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

function processEvilCardRetreat({G, events, ctx, playerID}: {
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

function processPostCardActions({G, playerID, events, ctx, skipEvil = false}: {
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

function beginCardBattle({G, events, ctx, playerID}: {
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

function discardCard({G, isGood, knownIndex}: {
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

function processGoodTextCards({G, events, ctx, playerID, evilUsePower}: {
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

function processPlayedCards({G, events, ctx, playerID}: {
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

function playNobleSacrifice({G, events, ctx}: {
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

function processShelobAbility({G, events, ctx}: { G: GState, events: any, ctx: any, }) {
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

function processPowerFight({G, playerID, events, ctx, goodPowerBoost = 0, evilPowerBoost = 0}: {
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

function preCheckShadowFax(G: GState) {
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

function processPalantir(G: GState) {
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

function canEvilCharsMove(G: GState) {
    const evilChars = []
    Object.values(G.characters).forEach((c: Character) => {
        if (EVIL_NAMES[c.id] && !c.defeated) {
            evilChars.push(c.id)
        }
    })

    const charsWhoCanMove = evilChars.filter(evilName => {
        const char = getChar(G, evilName)
        const tile = findCharTile(G, evilName)
        const moves = generateMoves({G, playerID: '0', selectedChar: char, selectedTile: tile})
        return moves.length > 0
    })

    return charsWhoCanMove
}

function canPlayMordorDark(G: GState) {
    return canEvilCharsMove(G).length > 1
}

function canPlayKingRevealed(G: GState) {
    return canEvilCharsMove(G).length > 0
}

function processGoodSpecialCard({G, events, card}: {
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

function processEvilSpecialCard({G, card}: {
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

function didBalrogAmbush({G, tileId, events, playerID}: {
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

function moveCharLogic({G, tileId, events, playerID, endTurn = true}: {
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

function getDraftChar(isGood: boolean, charId: string): Character {
    const matchChar = DRAFT_PAIRS[charId]
    return isGood ? GOOD_CHARS[matchChar] : EVIL_CHARS[matchChar]
}

function getRandomChars(G: GState, charMap: CharacterMap) {
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

function declareChars(G: GState) {
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

function checkReshuffle(G: GState) {
    if (G.players['0'].cards.every((card) => card.discarded)) {
        G.players['0'].cards.forEach((_, index) => {
            G.players['0'].cards[index].discarded = false
            G.players['1'].cards[index].discarded = false
        })
        updateHistory(G, 'Cards Reshuffled')
    }
}

export const Confrontation = {
    name: 'Confrontation',
    setup: () => {
        return {
            history: [],
            messages: [],
            players: {
                0: {
                    side: 'evil',
                    cards: [...EVIL_CARDS],
                    // .map(c=>c.title !== 'Magic' ? {...c, discarded : true} : c)
                    charactersToPlace: [],
                    ambush: true,
                },
                1: {
                    side: 'good',
                    cards: [...GOOD_CARDS],
                    charactersToPlace: [],
                },
            },

            regions: LOCATIONS,
            characters: {},
            goodReady: false,
            evilReady: false,
        }
    },
    phases: {
        place: {
            start: true,
            turn: {
                stages: {
                    placement: {
                        moves: {
                            setMatchId: ({G}: { G: GState }, matchId: string) => {
                                if (!G.matchID) {
                                    G.matchID = matchId
                                    const mode = getMode(matchId)

                                    G.players['0'].charactersToPlace = [...Object.values(getChars({
                                        mode,
                                        isGood: false
                                    }))]
                                    G.players['1'].charactersToPlace = [...Object.values(getChars({
                                        mode,
                                        isGood: true
                                    }))]
                                }
                            },
                            chooseCharacter: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }, charID: string) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood && Boolean(GOOD_CHARS[charID])) {
                                    G.goodCharacterToPlace = charID
                                } else if (!isGood && Boolean(EVIL_CHARS[charID])) {
                                    G.evilCharacterToPlace = charID
                                }
                            },
                            autoPlace: ({G, playerID}: {
                                G: GState,
                                playerID: string,
                            }) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                G.players[playerID].charactersToPlace = []
                                if (isGood) {
                                    const players = getRandomChars(G, getChars({
                                        mode: getMode(G.matchID),
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
                                } else {
                                    const players = getRandomChars(G, getChars({
                                        mode: getMode(G.matchID),
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
                            reset: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood) {
                                    G.regions['RHUDAUR'].currentOccupants = []
                                    G.regions['EREGION'].currentOccupants = []
                                    G.regions['ENEDWAITH'].currentOccupants = []
                                    G.regions['ARTHEDAIN'].currentOccupants = []
                                    G.regions['CARDOLAN'].currentOccupants = []
                                    G.regions['SHIRE'].currentOccupants = []
                                    G.players[playerID].charactersToPlace = [...Object.values(getChars({
                                        mode: getMode(G.matchID),
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
                                    G.players[playerID].charactersToPlace = [...Object.values(getChars({
                                        mode: getMode(G.matchID),
                                        isGood: false
                                    }))]
                                    G.evilCharacterToPlace = null

                                    G.players[playerID].charactersToPlace.forEach((char: Character) => delete G.characters[char.id])
                                }
                            },
                            resetChar: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }, charId: string, tileId: string) => {
                                const isGood = isSpecifiedPlayerGood(playerID);
                                if ((isGood && G.goodReady) || (!isGood && G.evilReady)) {
                                    return INVALID_MOVE
                                }

                                const char = getChar(G, charId)
                                removeCharacter({G, unitIdToRemove: charId, tileId})

                                const reAddPieces = [char]
                                const draftMatchChar = getDraftChar(isGood, charId)
                                if (getMode(G.matchID) === 'DRAFT') {
                                    reAddPieces.push(draftMatchChar)
                                }

                                G.players[playerID].charactersToPlace = [
                                    ...G.players[playerID].charactersToPlace,
                                    ...reAddPieces,
                                ]
                                delete G.characters[charId]
                            },
                            placeCharacter: ({G, playerID}: {
                                G: GState
                                playerID: string,
                            }, tileId: string) => {
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
                                    (homeBase.title !== tileId && selectedTile.currentOccupants.length > 0) ||
                                    (homeBase.title === tileId && selectedTile.currentOccupants.length === selectedTile.maxChars)
                                ) {
                                    return INVALID_MOVE
                                }

                                if (!G.stopPlacementWarning && !canPlaceElsewhere && homeBase.title !== tileId) {
                                    G.stopPlacementWarning = true
                                    updateHistory(G, 'You must fill your base out first THEN put 1 in each tile on your side of the mountains')

                                    return INVALID_MOVE
                                }

                                addCharacter({G, unitIdToAdd: charToPlace, tileId})
                                const remainingChars = G.players[playerID].charactersToPlace

                                const secondCheck = (cId) => {
                                    if (getMode(G.matchID) !== 'DRAFT') {
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
                            ready: ({G, playerID, events}: {
                                G: GState,
                                events: any,
                                playerID: string,
                            }) => {
                                G.messages = []

                                if (Object.keys(G.characters).length === 0) {
                                    return INVALID_MOVE
                                }

                                if (isSpecifiedPlayerGood(playerID)) {
                                    G.goodReady = true
                                } else {
                                    G.evilReady = true
                                }

                                if (G.evilReady && G.goodReady) {
                                    if (getMode(G.matchID) === 'DRAFT') {
                                        declareChars(G)
                                    }
                                    events.setActivePlayers({
                                        all: 'specialCards',
                                    })
                                }
                            },
                        },
                    },
                    specialCards: {
                        moves: {
                            chooseCardOption: ({G, events}: {
                                G: GState,
                                events: any,
                            }, type: 'default' | number) => {
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
                            chooseCard: ({G, playerID, events}: {
                                G: GState,
                                events: any,
                                playerID: string,
                            }, card: SpecialCard) => {
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
                    first: ({G}: { G: GState }) => (G.lastPlayerId ? Number(G.lastPlayerId) : 0),
                    next: ({ctx}) => {
                        // Alternate between Player 0 and Player 1
                        return ctx.currentPlayer === '0' ? 1 : 0
                    },
                },
                onBegin: ({G, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                }) => {
                    G.palantirNames = []
                    hideCharacters(G)

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
                        const selectedTile = findCharTile(G, name)

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

                        const fangorn = G.regions['FANGORN']
                        const gandalfName = G.characters[GOOD_NAMES.CLASSICGANDALF] ? GOOD_NAMES.CLASSICGANDALF : GOOD_NAMES.VARIANTGANDALF
                        const canPlayGandalfWhite = G.characters[gandalfName].defeated
                            && fangorn.currentOccupants.length < fangorn.maxChars
                            && !EVIL_CHARS[fangorn.currentOccupants?.[0]]

                        const canPlayKingReveal = canPlayKingRevealed(G)

                        const mordor = G.regions['MORDOR']
                        const mordorPpl = mordor.currentOccupants
                        const canPlayRecallMordor = mordorPpl.length !== mordor.maxChars && Boolean(!GOOD_CHARS[mordorPpl?.[0]])

                        const canPlayCrebain = Object.values(G.characters).some((c: Character) => {
                            return GOOD_CHARS[c.id] && !c.defeated
                        })

                        return moves.length > 0 || Boolean(isGood ?
                            (canPlayGandalfWhite || canPlayKingReveal)
                            : canPlayRecallMordor || canPlayCrebain)
                    })

                    if (!canMove) {
                        G.messages = []
                        updateHistory(G, `${!isGood ? 'The Fellowship' : 'Sauron'} wins! - loser out of moves`)
                        events.endGame({winner: isGood ? '0' : '1'})
                    } else {
                        const winner = isCaptureBaseGameOver(G)
                        if (winner) {
                            updateHistory(G,
                                winner === '0'
                                    ? 'Evil won by Scouring the Shire!'
                                    : 'Good won by destroying the ring!',
                            )
                            events.endGame({winner})
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
            },
            moves: {
                chooseCharacterToMove: ({G, playerID}: {
                    G: GState,
                    playerID: string
                }, charId: string, tileId: string) => {
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
                        const selectedTile = getTile(G, tileId)
                        const selectedChar = getChar(G, charId)
                        if (!selectedTile || !selectedChar) {
                            return INVALID_MOVE
                        }
                        G.startingTile = tileId
                        G.attackingChar = charId
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
                chooseRegionToMove: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string
                }, tileId: string) => {
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
                        moveCharLogic({G, tileId, events, playerID, endTurn: false})
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
                        moveCharLogic({G, tileId, events, playerID, endTurn: false})
                    } else {
                        G.mordorDarkMode = null
                        G.goodLightMode = null
                        moveCharLogic({G, tileId, events, playerID})
                    }
                },
                chooseSpecialCard: ({G, playerID, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }, card: SpecialCard) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (isGood) {
                        processGoodSpecialCard({G, events, card})
                    } else {
                        if (G.kingRevealed) {
                            return INVALID_MOVE
                        }
                        processEvilSpecialCard({G, card})
                    }
                },
                setAmbush: ({G, playerID, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }, setAmbush: boolean) => {
                    G.messages = []
                    if (playerID !== '0') {
                        return INVALID_MOVE
                    }

                    G.players['0'].ambush = setAmbush
                },
                // good specials
                kingRevealedChar: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string
                }, charId: string, tileId: string) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (!isGood || Boolean(GOOD_CHARS[charId]) || G.goodSpecial !== 'KING') {
                        return INVALID_MOVE
                    }
                    const canMove = generateMoves({
                        G,
                        playerID: isGood ? '0' : '1',
                        selectedChar: {id: charId},
                        selectedTile: getTile(G, tileId),
                    })
                    if (canMove.length === 0) {
                        return INVALID_MOVE
                    }
                    const aragornTile = findCharTile(G, GOOD_NAMES.CLASSICARAGORN) || findCharTile(G, GOOD_NAMES.VARIANTARAGORN)
                    updateHistory(G, `The King Aragorn from ${aragornTile.description} forces ??? to maneuver`)

                    G.kingRevealed = charId

                    G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 3)
                    G.goodSpecial = null
                    events.endTurn()
                },
                // evil specials
                palantirRegion: ({G, playerID}: {
                    G: GState,
                    playerID: string
                }, tileId: string) => {
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
                    G.palantirRegions = []
                },
                mordorRecall: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string,
                }, charId: string, tileId: string) => {
                    G.messages = []
                    const isGood = isSpecifiedPlayerGood(playerID)
                    if (isGood || Boolean(GOOD_CHARS[charId]) || G.evilSpecial !== 'MORDORRECALL') {
                        return INVALID_MOVE
                    }
                    updateHistory(G, `Evil recalls someone to Mordor`)

                    // leave current tile
                    removeCharacter({G, unitIdToRemove: charId, tileId})
                    // go to new tile
                    addCharacter({G, unitIdToAdd: charId, tileId: 'MORDOR'})

                    G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 6)
                    G.evilSpecial = null
                    events.endTurn()
                },
                crebain: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string
                }, charId: string) => {
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
                onBegin: (props: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }) => {
                    props.G.messages = []
                    checkReshuffle(props.G)

                    // start phase steps
                    startBattleLogic(props)
                },
                stages: {
                    goodAction: {
                        moves: {
                            chooseGoodAction: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, action: string) => {
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
                                    if (G.defendingChar === GOOD_NAMES.SMEAGOL) {
                                        G.goodActions = null
                                        G.messages = []
                                        G.swapOptions = findSwapCandidates(G, getTile(G, G.attackedTile))

                                        events.setActivePlayers({
                                            all: 'goodRetreat',
                                        })
                                    } else {
                                        // assume sam frodo swap
                                        G.defendingChar = G.characters[GOOD_NAMES.CLASSICSAM] ? GOOD_NAMES.CLASSICSAM : GOOD_NAMES.VARIANTSAM
                                        G.characters[G.defendingChar].reveal = true

                                        G.messages = []

                                        // reprocess good options
                                        processPreGoodActionStage({G, playerID, events, ctx})
                                    }
                                } else if (action === 'RETREAT') {
                                    G.goodActions = null

                                    // if good retreats, then ORC attack wasted
                                    if (G.characters[EVIL_NAMES.CLASSICORCS]) {
                                        G.characters[EVIL_NAMES.CLASSICORCS].tired = true
                                    }

                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
                                    const goodUnit = getChar(G, attackerIsGood ? G.attackingChar : G.defendingChar)

                                    // calculate retreat logic
                                    const retreatMoves = generateRetreatMoves({
                                        G,
                                        isGood: true,
                                        selectedChar: goodUnit,
                                        selectedTile: getTile(G, G.attackedTile),
                                    })

                                    if (retreatMoves.length === 1) {
                                        G.messages = []
                                        updateHistory(G, `${goodUnit.name} evades into ${retreatMoves[0]}`)
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
                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
                                    const goodUnit = getChar(G, attackerIsGood ? G.attackingChar : G.defendingChar)

                                    if (G.characters[EVIL_NAMES.CLASSICORCS]) {
                                        G.characters[EVIL_NAMES.CLASSICORCS].tired = true
                                    }

                                    G.players['1'].specialCards = G.players['1'].specialCards.filter(card => card.id !== 4)

                                    // calculate retreat logic
                                    const retreatMoves = generateRetreatMoves({
                                        G,
                                        isGood: true,
                                        selectedChar: {id: 'GWAIHIR'},
                                        selectedTile: getTile(G, G.attackedTile),
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
                                        updateHistory(G, `Gwaihir has come to rescue ${goodUnit.name}`)
                                        G.validMoves = retreatMoves
                                        events.setActivePlayers({
                                            all: 'goodRetreat',
                                        })
                                    } else {
                                        G.badState = 'gwaihir moves error'
                                    }
                                } else if (action === 'CARD-FREE') {
                                    updateHistory(G,
                                        'Aragorn declares no cards. "Here is the Sword that was broken and is forged again!"',
                                    )

                                    G.goodActions = null
                                    G.aragornSkip = true
                                    if (isGandalfNearby(G)) {
                                        events.setActivePlayers({
                                            all: 'gandalfChoice',
                                        })
                                    } else {
                                        // proceed to bad options
                                        processPreBadActionStage({G, playerID, events, ctx})
                                    }
                                } else if (action === 'POWER-UP') {
                                    // sam powers up near Frodo
                                    G.characters[GOOD_NAMES.CLASSICSAM].value = 5
                                    const frodoName = G.characters[GOOD_NAMES.CLASSICFRODO] ? GOOD_NAMES.CLASSICFRODO : GOOD_NAMES.VARIANTFRODO
                                    G.characters[frodoName].reveal = true

                                    updateHistory(G, `Sam's love for Frodo gives him Power 5!`)
                                    processPreBadActionStage({G, playerID, events, ctx})
                                } else {
                                    G.badState = 'unexpected good action'
                                }
                            },
                        },
                    },
                    goodRetreat: {
                        moves: {
                            chooseSmeagolSwap: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, charId: string, tileId: string) => {
                                if (!G.swapOptions?.includes?.(charId)) {
                                    return INVALID_MOVE
                                }

                                G.messages = []
                                updateHistory(G, `Smeagol forces ${getChar(G, charId).name} to fight their battle`)

                                G.swapOptions = null

                                // swap locations
                                removeCharacter({G, unitIdToRemove: charId, tileId: tileId})
                                removeCharacter({G, unitIdToRemove: GOOD_NAMES.SMEAGOL, tileId: G.attackedTile})
                                addCharacter({G, unitIdToAdd: charId, tileId: G.attackedTile})
                                addCharacter({G, unitIdToAdd: GOOD_NAMES.SMEAGOL, tileId: tileId})

                                G.characters[GOOD_NAMES.SMEAGOL].reveal = G.characters[GOOD_NAMES.SMEAGOL].permaReveal || false
                                G.characters[charId].reveal = true
                                G.defendingChar = charId

                                // restart battle
                                processPreGoodActionStage({G, events, playerID, ctx})
                            },
                            chooseRetreatRegion: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, tileId: string) => {
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
                            chooseEvilAction: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, action: string) => {
                                const isGood = isSpecifiedPlayerGood(playerID)
                                if (isGood) {
                                    return INVALID_MOVE
                                }

                                G.messages = []

                                if (action === 'FIGHT') {
                                    updateHistory(G, 'Sauron will Fight')
                                    G.badActions = null
                                    // proceed to cards
                                    if (G.aragornSkip) {
                                        G.aragornSkip = null
                                        // proceed to power
                                        processPowerFight({G, playerID, events, ctx})
                                    } else {
                                        events.setActivePlayers({
                                            all: 'pickCards',
                                        })
                                    }
                                } else if (action === 'RETREAT') {
                                    G.badActions = null
                                    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
                                    const evilUnit = getChar(G, attackerIsGood ? G.defendingChar : G.attackingChar)

                                    // calculate retreat logic
                                    const retreatMoves = generateRetreatMoves({
                                        G,
                                        isGood: false,
                                        selectedChar: evilUnit,
                                        selectedTile: getTile(G, G.attackedTile),
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
                                } else if (action === 'CARD-FREE') {
                                    updateHistory(G,
                                        'Saruman says no cards. "I gave you the chance of aiding me willingly, but you have elected the way of pain."',
                                    )

                                    G.badActions = null
                                    // proceed to power
                                    processPowerFight({G, playerID, events, ctx})
                                } else {
                                    G.badState = 'bad action error'
                                }
                            },
                        },
                    },
                    badRetreat: {
                        moves: {
                            chooseRetreatRegion: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, tileId: string) => {
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
                            chooseCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, card: BattleCard) => {
                                G.messages = []

                                const isGood = isSpecifiedPlayerGood(playerID)
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
                            lockInCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)
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
                                                discardCard({G, isGood: true, knownIndex: 5})
                                                updateHistory(G,
                                                    `Good uses magic to play ${G.goodCard.title || `+${G.goodCard.value}`}`,
                                                )
                                            }
                                            if (G.evilCard.discarded) {
                                                discardCard({G, isGood: false, knownIndex: 6})
                                                updateHistory(G,
                                                    `Evil uses magic to play ${G.evilCard.title || `+${G.evilCard.value}`}`,
                                                )
                                            }
                                        }

                                        processPostCardActions({G, events, ctx, playerID})
                                    }
                                }
                            },
                            cancelMagic: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }) => {
                                G.messages = []

                                const currentFighters = [G.attackingChar, G.defendingChar]
                                const gandalfInPlay =
                                    currentFighters.includes(GOOD_NAMES.CLASSICGANDALF) && !currentFighters.includes(EVIL_NAMES.WARG)

                                if (!isSpecifiedPlayerGood(playerID)) {
                                    G.evilPlayMagic = false
                                    G.evilCard = null
                                } else if (isSpecifiedPlayerGood(playerID) && gandalfInPlay) {
                                    G.goodPlayMagic = false
                                    G.goodCard = null
                                }
                            },
                        },
                    },
                    pickMagicCards: {
                        moves: {
                            chooseMagicCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, card: BattleCard) => {
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
                            lockInCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }) => {
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


                                    processPostCardActions({G, events, ctx, playerID, skipEvil: false})
                                }
                            },
                        },
                    },
                    sarumanCards: {
                        moves: {
                            goodReselect: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, goodReselect: boolean) => {
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
                            chooseCard: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }, card: BattleCard) => {
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
                            lockInCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)

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
                                    processPostCardActions({G, events, ctx, playerID, skipEvil: true})
                                }
                            },
                        },
                    },
                    mouthCards: {
                        moves: {
                            useMouthChoice: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, useMouthAbility: boolean) => {
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
                            useGandalfOption: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, useGandalfAbility: boolean) => {
                                G.messages = []
                                const isGood = isSpecifiedPlayerGood(playerID)

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

                                    const gandalfTile = findCharTile(G, GOOD_NAMES.VARIANTGANDALF)
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
                            chooseRetreatRegion: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, tileId: string) => {
                                if (!G.validMoves?.includes?.(tileId)) {
                                    return INVALID_MOVE
                                }

                                G.messages = []
                                updateHistory(G, 'Wormtongue scuttles back to ' + G.regions[tileId].description)
                                G.validMoves = []

                                const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
                                const evilUnit = getChar(G, attackerIsGood ? G.defendingChar : G.attackingChar)

                                // go to new tile
                                addCharacter({G, unitIdToAdd: evilUnit.id, tileId})

                                if (G.characters[EVIL_NAMES.WORMTONGUE]) {
                                    G.characters[EVIL_NAMES.WORMTONGUE].defeated = false
                                }

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
                chooseCharacterToAttack: ({G, playerID, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }, charId: string) => {
                    const battleTile = getTile(G, G.attackedTile)
                    const attacker = getChar(G, G.attackingChar)
                    G.defendingChar = charId
                    const defender = getChar(G, charId)

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
                    updateHistory(G, `${attacker.name} attacks ${defender.name} in ${battleTile.description}`)

                    // do instantaneous abilities
                    processPreGoodActionStage({G, events, playerID, ctx})
                },
            },
        },
        onEnd: ({G}: { G: GState }) => {
            G.messages = []
        },
    },
}
