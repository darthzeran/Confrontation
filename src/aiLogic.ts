import {
    EVIL_CHARS,
    EVIL_NAMES,
    EVIL_SPECIAL_CARDS,
    GOOD_CHARS,
    GOOD_NAMES,
    GOOD_SPECIAL_CARDS
} from './consts.ts';
import * as Logic from './logic.ts'
import {MOVE, BATTLE} from './moveLogic.ts'
import {BattleCard, GState, Location} from './types.ts';
import {findCharTile, getChar, isGandalfNearby, isSpecifiedPlayerGood} from './logic.ts';


// Tile the Balrog must reach and hold
const BALROG_TARGET = 'CARADHRAS'

// Evil chars that should be picked LAST when exiting Mordor
// (lower = pick last; Wormtongue=0 means absolute last, Warg=1 means second-to-last)
const EVIL_MORDOR_PRIORITY: Record<string, number> = {
    [EVIL_NAMES.WORMTONGUE]: 0,
    [EVIL_NAMES.WARG]:       1,
}

// Good ring-bearer priority for evil to hunt (higher = hunt sooner)
// Classic Frodo is the #1 target; if absent, Variant Frodo and Sam equally
const RINGBEARER_HUNT_PRIORITY: Record<string, number> = {
    [GOOD_NAMES.CLASSICFRODO]:  100,
    [GOOD_NAMES.VARIANTFRODO]:  80,
    [GOOD_NAMES.CLASSICSAM]:    70,
    [GOOD_NAMES.VARIANTSAM]:    70,
}

// Good ring-bearers that should be protected / moved last
const GOOD_RINGBEARERS = new Set([
    GOOD_NAMES.CLASSICFRODO,
    GOOD_NAMES.VARIANTFRODO,
    GOOD_NAMES.CLASSICSAM,
    GOOD_NAMES.VARIANTSAM,
])

// Tile just before Mordor — good AI stops here for escorts, then rushes
const PRE_MORDOR_TILES = new Set(['DAGORLAD', 'GONDOR', 'MIRKWOOD', 'FANGORN', 'ROHAN'])

function ringbearerHuntScore(G: GState, charId: string): number {
    if (!RINGBEARER_HUNT_PRIORITY[charId]) return 0
    // If Classic Frodo is in the game, only hunt him — ignore variant frodo/sam score
    if (Boolean(G.characters[GOOD_NAMES.CLASSICFRODO]) && charId !== GOOD_NAMES.CLASSICFRODO) return 0
    return RINGBEARER_HUNT_PRIORITY[charId]
}

const CARD_NOBLE_SACRIFICE = 'Noble Sacrifice'   // good text: both units die
const CARD_ELVEN_CLOAK     = 'Elven Cloak'        // good text: negates evil power card
const CARD_MAGIC           = 'Magic'              // both sides: replay a discarded card
const CARD_EYE_OF_SAURON   = 'The Eye Of Sauron'  // evil text: negates good text card

function unitStrength(G: GState, charId: string): number {
    return G.characters[charId]?.value ?? 0
}

function countAliveEvilChars(G: GState): number {
    return Object.keys(EVIL_CHARS).filter(id => G.characters[id] && !G.characters[id].defeated).length
}

function isAlive(G: GState, charId: string): boolean {
    return Boolean(G.characters[charId] && !G.characters[charId].defeated)
}


/**
 * Returns the net strength advantage the AI has BEFORE any card is played,
 * from the perspective of `isGood`.
 *
 *   positive → AI is already ahead
 *   negative → AI is behind
 *   zero     → tied
 */
function rawStrengthDiff(G: GState, isGood: boolean): number {
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar
    const evilUnitId = attackerIsGood ? G.defendingChar : G.attackingChar
    const goodStr = unitStrength(G, goodUnitId)
    const evilStr = unitStrength(G, evilUnitId)
    return isGood ? (goodStr - evilStr) : (evilStr - goodStr)
}

/**
 * If the Balrog is alive, handle his special movement:
 * - If not yet at CARADHRAS, move him there (along the shortest valid path).
 * - If already at CARADHRAS, don't move (return true to consume the turn only
 *   if he literally has no other option — otherwise return false so normal
 *   logic can fire for a different char).
 *
 * Returns true if a Balrog move was executed (or if Balrog is at CARADHRAS
 * and should stay put, consuming the "skip" implicitly via normal logic
 * choosing a different char). Returns false if Balrog is not in the game.
 */
function tryBalrogMove(G: GState, events: any): boolean {
    const balrogId = isAlive(G, EVIL_NAMES.BALROG) ? EVIL_NAMES.BALROG : null
    if (!balrogId) return false

    const balrogTile = Logic.findCharTile(G, balrogId)
    if (!balrogTile) return false

    // Already at CARADHRAS — do NOT move the Balrog; let other chars act
    if (balrogTile.title === BALROG_TARGET) return false

    // Not at CARADHRAS yet — find the move that gets him closest
    const moves = Logic.generateMoves({
        G,
        playerID: G.aiId,
        selectedChar: Logic.getChar(G, balrogId),
        selectedTile: balrogTile,
    })

    if (moves.length === 0) return false

    const target = G.regions[BALROG_TARGET]
    if (!target) return false

    // Prefer any move that directly reaches CARADHRAS; else pick the move
    // with the tile ID closest to CARADHRAS's ID (proxy for board distance).
    const direct = moves.find(m => m === BALROG_TARGET)
    if (direct) {
        MOVE.chooseCharacterToMove(G, G.aiId, balrogId, balrogTile.title)
        MOVE.chooseRegionToMove(G, events, G.aiId, BALROG_TARGET)
        return true
    }

    // Move sideways/forward toward the target tile ID
    const best = moves
        .map(tileId => ({ tileId, dist: Math.abs(G.regions[tileId].id - target.id) }))
        .sort((a, b) => a.dist - b.dist)[0]

    MOVE.chooseCharacterToMove(G, G.aiId, balrogId, balrogTile.title)
    MOVE.chooseRegionToMove(G, events, G.aiId, best.tileId)
    return true
}

/**
 * If DAGORLAD or GONDOR is empty (no evil char present), try to move a char
 * there from Mordor to maintain the sentinel.
 *
 * Selection priority from Mordor:
 *   - Never Wormtongue, never Warg unless absolutely no other candidate.
 *   - Pick whoever has the highest EVIL_MORDOR_PRIORITY value first
 *     (i.e. anyone NOT in the low-priority list).
 *
 * Returns true if a sentinel move was executed.
 */
function trySentinelFill(G: GState, events: any): boolean {
    for (const sentinelTile of ['DAGORLAD', 'GONDOR']) {
        const tile = G.regions[sentinelTile]
        const hasSentinel = tile.currentOccupants.some(n => EVIL_CHARS[n] && !GOOD_CHARS[n])
        if (hasSentinel) continue

        // Find a Mordor occupant that can move to this tile
        const mordorOccupants = G.regions['MORDOR'].currentOccupants
            .filter(charId => {
                const moves = Logic.generateMoves({
                    G,
                    playerID: G.aiId,
                    selectedChar: Logic.getChar(G, charId),
                    selectedTile: G.regions['MORDOR'],
                })
                return moves.includes(sentinelTile)
            })

        if (mordorOccupants.length === 0) continue

        // Sort: prefer chars with NO entry in EVIL_MORDOR_PRIORITY (they are
        // "normal" units); fall back to warg before wormtongue
        const sorted = mordorOccupants.sort((a, b) => {
            const ap = EVIL_MORDOR_PRIORITY[a] ?? 99
            const bp = EVIL_MORDOR_PRIORITY[b] ?? 99
            return bp - ap  // higher priority number = pick first
        })

        // const charId = sorted[sorted.length - 1]  // pick the last (highest priority)
        // Actually we want HIGHEST priority number first (99 > 1 > 0)
        const charToMove = sorted[0]

        MOVE.chooseCharacterToMove(G, G.aiId, charToMove, 'MORDOR')
        MOVE.chooseRegionToMove(G, events, G.aiId, sentinelTile)
        return true
    }

    return false
}


type EvilCandidate = {
    charId: string
    fromTileId: string
    toTileId: string
    priority: number
}

/**
 * Score every possible evil move and return them sorted best-first.
 *
 * Priority layers (descending importance):
 *
 *  10000  Ring-bearer hunt: attacking the ring-bearer directly.
 *   5000  Attacking any good char, biased by how close the TARGET is to Mordor
 *         (lowest target tile ID = most dangerous = attack first) and biased
 *         by how far forward the ATTACKER already is (highest attacker tile ID
 *         = furthest from Mordor = attack straight ahead).
 *   500   Pure advance (no attack): attacker furthest forward moves further.
 *  -9999  Sentinel holders stay put — excluded from non-sentinel moves.
 *
 * Additional rules baked in:
 *  - Wormtongue and Warg are never selected for a standard advance/attack
 *    unless they are already outside Mordor. They are the "last picked" from
 *    Mordor by the sentinel logic above, so here we simply deprioritise them.
 *  - Characters that have no valid attacks remaining are scored as advances only.
 */
function buildEvilMoveCandidates(G: GState): EvilCandidate[] {
    const candidates: EvilCandidate[] = []

    Object.keys(EVIL_CHARS).forEach(charId => {
        if (!isAlive(G, charId)) return
        if (charId === EVIL_NAMES.BALROG && countAliveEvilChars(G) > 2) return  // handled separately

        const fromTile = Logic.findCharTile(G, charId)
        if (!fromTile) return

        const moves = Logic.generateMoves({
            G,
            playerID: G.aiId,
            selectedChar: Logic.getChar(G, charId),
            selectedTile: fromTile,
        })

        if (moves.length === 0) return

        // Low-priority status: Wormtongue/Warg sitting in Mordor move last
        const inMordor = fromTile.title === 'MORDOR'
        const isLowPriority = inMordor && (EVIL_MORDOR_PRIORITY[charId] !== undefined)

        moves.forEach(toTileId => {
            const toTile = G.regions[toTileId]
            const occupant = toTile.currentOccupants.find(n => GOOD_CHARS[n])
            const isAttack = Boolean(occupant)

            let priority = 0

            if (isAttack && occupant) {
                const huntScore = ringbearerHuntScore(G, occupant)
                if (huntScore > 0) {
                    // Ring-bearer attack — highest priority
                    priority = 10000 + huntScore
                } else {
                    // Normal attack:
                    // - Prefer targets closest to Mordor (lowest toTile.id)
                    // - Prefer attackers furthest forward (highest fromTile.id)
                    const targetCloseness = 50 - toTile.id   // lower tile ID = closer = better
                    const attackerForwardness = fromTile.id   // higher = further forward
                    priority = 5000 + targetCloseness + attackerForwardness
                }
            } else {
                // Advance (no attack):
                // Move the char furthest forward (highest fromTile.id) further ahead
                priority = 500 + fromTile.id + toTile.id
            }

            // Deprioritise low-priority Mordor chars
            if (isLowPriority) priority -= 2000

            candidates.push({ charId, fromTileId: fromTile.title, toTileId, priority })
        })
    })

    return candidates.sort((a, b) => b.priority - a.priority || a.charId.localeCompare(b.charId))
}

function frodoShouldRun(G: GState): boolean {
    if (countAliveEvilChars(G) <= 3) return true

    const nonRingbearerAlive = Object.keys(GOOD_CHARS).some(id =>
        !GOOD_RINGBEARERS.has(id) && isAlive(G, id)
    )
    if (!nonRingbearerAlive) return true

    // Frodo already in evil territory
    const frodoId = isAlive(G, GOOD_NAMES.CLASSICFRODO)
        ? GOOD_NAMES.CLASSICFRODO
        : isAlive(G, GOOD_NAMES.VARIANTFRODO)
            ? GOOD_NAMES.VARIANTFRODO
            : null
    if (frodoId) {
        const tile = Logic.findCharTile(G, frodoId)
        if (tile && PRE_MORDOR_TILES.has(tile.title)) return true
    }

    return false
}

export function aiSetup(G: GState) {
    const aiGood = G.aiId === '1'
    const isHardMode = Math.floor(Math.random() * 2) === 0
    const mode = Logic.getMode(G.matchID)
    G.characters = {}
    if (aiGood) {
        if (mode === 'DRAFT') {
            const op = Logic.shuffle([GOOD_NAMES.BOROMIR, GOOD_NAMES.TREEBEARD])
            const top = Logic.shuffle([isHardMode ? op[1] : GOOD_NAMES.PIPPIN, GOOD_NAMES.VARIANTARAGORN, op[0]])
            G.regions['RHUDAUR'].currentOccupants = [top[0]]
            G.regions['EREGION'].currentOccupants = [top[1]]
            G.regions['ENEDWAITH'].currentOccupants = [top[2]]

            const elf = Logic.shuffle([GOOD_NAMES.LEGOLAS, GOOD_NAMES.ELROND])
            const middle = Logic.shuffle([GOOD_NAMES.MERRY, GOOD_NAMES.VARIANTGANDALF, elf[0]])

            G.regions['ARTHEDAIN'].currentOccupants = [middle[0]]
            G.regions['CARDOLAN'].currentOccupants = [middle[1]]
            G.regions['SHIRE'].currentOccupants = [
                GOOD_NAMES.VARIANTFRODO,
                GOOD_NAMES.VARIANTSAM,
                GOOD_NAMES.GIMLI,
                middle[2],
            ]
        } else if (mode === 'VARIANT') {
            const top = Logic.shuffle([GOOD_NAMES.SMEAGOL, GOOD_NAMES.VARIANTARAGORN, GOOD_NAMES.TREEBEARD])
            G.regions['RHUDAUR'].currentOccupants = [top[0]]
            G.regions['EREGION'].currentOccupants = [top[1]]
            G.regions['ENEDWAITH'].currentOccupants = [top[2]]

            const middle = Logic.shuffle([GOOD_NAMES.FARAMIR, GOOD_NAMES.VARIANTGANDALF, GOOD_NAMES.ELROND])

            G.regions['ARTHEDAIN'].currentOccupants = [middle[0]]
            G.regions['CARDOLAN'].currentOccupants = [middle[1]]
            G.regions['SHIRE'].currentOccupants = [
                GOOD_NAMES.VARIANTFRODO,
                GOOD_NAMES.VARIANTSAM,
                GOOD_NAMES.THEODEN,
                middle[2],
            ]
        } else {
            // classic
            const top = Logic.shuffle([GOOD_NAMES.PIPPIN, GOOD_NAMES.CLASSICARAGORN, GOOD_NAMES.BOROMIR])
            G.regions['RHUDAUR'].currentOccupants = [top[0]]
            G.regions['EREGION'].currentOccupants = [top[1]]
            G.regions['ENEDWAITH'].currentOccupants = [top[2]]

            const middle = Logic.shuffle([GOOD_NAMES.MERRY, GOOD_NAMES.CLASSICGANDALF, GOOD_NAMES.LEGOLAS])

            G.regions['ARTHEDAIN'].currentOccupants = [middle[0]]
            G.regions['CARDOLAN'].currentOccupants = [middle[1]]
            G.regions['SHIRE'].currentOccupants = [
                GOOD_NAMES.CLASSICFRODO,
                GOOD_NAMES.CLASSICSAM,
                GOOD_NAMES.GIMLI,
                middle[2],
            ]
        }

        G.players['1'].charactersToPlace = []
        G.goodCharacterToPlace = null
        const goodTiles = ['RHUDAUR', 'EREGION', 'ENEDWAITH', 'ARTHEDAIN', 'CARDOLAN', 'SHIRE']
        goodTiles.forEach(regName => {
            G.regions[regName].currentOccupants.forEach(charId => {
                G.characters[charId] = GOOD_CHARS[charId]
            })
        })
        G.goodReady = true
        // cards
    } else {
        if (mode === 'DRAFT') {
            const power = Logic.shuffle([EVIL_NAMES.CLASSICSARUMAN, EVIL_NAMES.CLASSICWITCHKING, EVIL_NAMES.CLASSICORCS, EVIL_NAMES.SHELOB, EVIL_NAMES.MOUTH])
            G.regions['MORDOR'].currentOccupants = [
                power[0],
                EVIL_NAMES.WARG,
                power[1],
                power[2],
            ]
            G.regions['DAGORLAD'].currentOccupants = [power[3]]
            G.regions['GONDOR'].currentOccupants = [isHardMode ? EVIL_NAMES.CAVETROLL : EVIL_NAMES.VARIANTFLYINGNAZGUL]
            G.regions['MIRKWOOD'].currentOccupants = [power[4]]
            G.regions['FANGORN'].currentOccupants = [EVIL_NAMES.WATCHER]
            G.regions['ROHAN'].currentOccupants = [EVIL_NAMES.BALROG]
        } else if (mode === 'VARIANT') {
            const power = Logic.shuffle([EVIL_NAMES.VARIANTSARUMAN, EVIL_NAMES.VARIANTWITCHKING, EVIL_NAMES.VARIANTORCS, EVIL_NAMES.WORMTONGUE, EVIL_NAMES.MOUTH])
            G.regions['MORDOR'].currentOccupants = [
                power[0],
                EVIL_NAMES.GOLLUM,
                power[1],
                power[2],
            ]
            G.regions['DAGORLAD'].currentOccupants = [power[3]]
            G.regions['GONDOR'].currentOccupants = [EVIL_NAMES.VARIANTFLYINGNAZGUL]
            G.regions['MIRKWOOD'].currentOccupants = [power[4]]
            G.regions['FANGORN'].currentOccupants = [EVIL_NAMES.WATCHER]
            G.regions['ROHAN'].currentOccupants = [EVIL_NAMES.URUKHAI]
        } else {
            // classic
            const power = Logic.shuffle([EVIL_NAMES.CLASSICSARUMAN, EVIL_NAMES.CLASSICWITCHKING, EVIL_NAMES.CLASSICORCS, EVIL_NAMES.SHELOB, EVIL_NAMES.BLACKRIDER])
            G.regions['MORDOR'].currentOccupants = [
                power[0],
                EVIL_NAMES.WARG,
                power[1],
                power[2],
            ]
            G.regions['DAGORLAD'].currentOccupants = [power[3]]
            G.regions['GONDOR'].currentOccupants = [EVIL_NAMES.CLASSICFLYINGNAZGUL]
            G.regions['MIRKWOOD'].currentOccupants = [power[4]]
            G.regions['FANGORN'].currentOccupants = [EVIL_NAMES.CAVETROLL]
            G.regions['ROHAN'].currentOccupants = [EVIL_NAMES.BALROG]
        }

        G.players['0'].charactersToPlace = []
        G.evilCharacterToPlace = null
        G.evilReady = true
        const evilTiles = ['MORDOR', 'DAGORLAD', 'GONDOR', 'MIRKWOOD', 'FANGORN', 'ROHAN']
        evilTiles.forEach(regName => {
            G.regions[regName].currentOccupants.forEach(charId => {
                G.characters[charId] = EVIL_CHARS[charId]
            })
        })
    }
}

export function aiCardsSetup(G: GState, events: any, type: 'default' | number) {
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
        // chose my specials
        if (Logic.isSpecifiedPlayerGood(G.aiId)) {
            G.players['1'].specialCards = [
                GOOD_SPECIAL_CARDS[1], GOOD_SPECIAL_CARDS[3]
            ]
        } else {
            G.players['0'].specialCards = [
                EVIL_SPECIAL_CARDS[1], EVIL_SPECIAL_CARDS[3]
            ]
        }

        events.setActivePlayers({
            all: 'specialCards',
        })
    }
}

export function chooseAiCardOption(G: GState) {
    const cardsPer = G.specialCardsPer

    let cardsOrder = []
    const isGood = Logic.isSpecifiedPlayerGood(G.aiId)
    if (G.specialCardDefault) {
        if (isGood) {
            cardsOrder = [GOOD_SPECIAL_CARDS[1], GOOD_SPECIAL_CARDS[3]]
        } else {
            cardsOrder = [EVIL_SPECIAL_CARDS[0], EVIL_SPECIAL_CARDS[3]]
        }
    } else {
        if (isGood) {
            cardsOrder = [EVIL_SPECIAL_CARDS[2], EVIL_SPECIAL_CARDS[0], EVIL_SPECIAL_CARDS[3], EVIL_SPECIAL_CARDS[1]]
        } else {
            cardsOrder = [GOOD_SPECIAL_CARDS[2], GOOD_SPECIAL_CARDS[1], GOOD_SPECIAL_CARDS[3], GOOD_SPECIAL_CARDS[0]]
        }
    }
    for (let i = 0; i < cardsPer; i++) {
        G.players[G.specialCardDefault ? G.aiId : isGood ? '0' : '1'].specialCards.push(cardsOrder[i])
    }
}

export function evilAIMove({G, events, ctx}) {
    if (G.kingRevealed) {
        executeBestMoveForChar({ G, events, charId: G.kingRevealed, isGood: false })
        return
    }

    // if crebain, use it
    const crebainCard = G.players['0'].specialCards.find(card => card.id === 8)
    if(crebainCard){
        const charId = G.regions['SHIRE'].currentOccupants[Logic.shuffle([0, 1, 2, 3])[0]]
        G.evilSpecial = 'CREBAIN'
        MOVE.crebain(G, events, G.aiId, charId)
        return
    }

    // if must use recall to mordor, use it
    const aliveChars = Object.keys(EVIL_CHARS).filter(charId => isAlive(G, charId))
    const recallMordorCard = G.players['0'].specialCards.find(card => card.id === 6)
    if(recallMordorCard && aliveChars.length === 1){
        const lastTile = findCharTile(G, aliveChars[0])
        if(lastTile.title === 'SHIRE'){
            G.evilSpecial = 'MORDORRECALL'
            MOVE.mordorRecall(G, events, G.aiId, aliveChars[0], lastTile.title)
            return
        }
    }

    // ── 2. Balrog: move toward CARADHRAS and hold ───────────────────────────
    const balrogMove = tryBalrogMove(G, events)
    if (balrogMove) return

    // ── 3. Sentinel: fill DAGORLAD / GONDOR if empty ────────────────────────
    const sentinelMove = trySentinelFill(G, events)
    if (sentinelMove) return

    // ── 4 & 5. Build all candidates, scored by strategy ─────────────────────
    const candidates = buildEvilMoveCandidates(G)
    if (candidates.length === 0) return

    const best = candidates[0]
    if(!best){
        console.error('no evil move')
    }
    MOVE.chooseCharacterToMove(G, G.aiId, best.charId, best.fromTileId)
    MOVE.chooseRegionToMove(G, events, G.aiId, best.toTileId)

}


/**
 * Good AI move turn.
 *
 * Priority:
 *   1. Score all possible moves and execute the best one.
 *      Attacks beat advances; within attacks the weakest enemy is targeted;
 *      within advances the char furthest forward (closest to Mordor, lowest
 *      tile ID) moves further.
 *
 * Frodo/Sam are treated as last resort — they won't move unless they are the
 * only option, because exposing the ring-bearer is almost always fatal.
 */
export function goodAIMove({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const allCandidates = buildGoodMoveCandidates(G)
    if (allCandidates.length === 0) return

    const ringbearers = new Set([
        GOOD_NAMES.CLASSICFRODO,
        GOOD_NAMES.VARIANTFRODO,
        GOOD_NAMES.CLASSICSAM,
        GOOD_NAMES.VARIANTSAM,
    ])

    const safeCandidates = allCandidates.filter(c => !ringbearers.has(c.charId))
    const best = safeCandidates.length > 0 ? safeCandidates[0] : allCandidates[0]

    MOVE.chooseCharacterToMove(G, G.aiId, best.charId, best.fromTileId)
    MOVE.chooseRegionToMove(G, events, G.aiId, best.toTileId)
}

export function aiPickCard({ G, events, ctx }: { G: GState; events: any; ctx: any }){
    const isGood = Logic.isSpecifiedPlayerGood(G.aiId)
    if(isGood){
        aiBattleGoodPickCard({ G, events, ctx })
    }else {
        aiBattleEvilPickCard({G, events, ctx})
    }
}

function gandalfCheat(G: GState): BattleCard | null{
    const players = [G.defendingChar, G.attackingChar]
    const enemy = G.defendingChar === GOOD_NAMES.CLASSICGANDALF ? G.defendingChar : G.attackingChar
    const evilCard = G.evilCard
    let canUseMagic = false
    const goodCardDeck = G.players['1'].cards
    const discard = []
    const cards = []
    goodCardDeck.forEach(card =>{
        if(card.discarded){
            discard.push(card)
        }
        else{
            if(card.title === CARD_MAGIC){
                canUseMagic = true
            }
            cards.push(card)
        }
    })
    if(players.includes(EVIL_NAMES.CAVETROLL)){
        let five = cards.find(c => c?.value === 5)
        if(five){
            return five
        }
        if(canUseMagic){
            return cards.find(c => c?.title === CARD_MAGIC)
        }
        let noble = cards.find(c => c?.title === CARD_NOBLE_SACRIFICE)
        if(noble){
            return noble
        }
        if(canUseMagic){
            return cards.find(c => c?.title === CARD_MAGIC)
        }

        return null
    }

    if(evilCard?.title === CARD_EYE_OF_SAURON){
        const diff = enemy.value - 5
        if(diff > -1){
            return cards.find(c => c?.value === diff + 1) || cards.find(c => c?.value === diff + 2) || cards.find(c => c?.value === diff + 3) || cards.find(c => c?.title === CARD_MAGIC)
        }
        return cards.find(c => c?.value === 1) || cards.find(c => c?.value === 2) || cards.find(c => c?.value === 3)
    }
    if(evilCard?.title === 'Retreat (Sideways)'){
        return cards.find(c => c?.value === 1) || cards.find(c => c?.value === 2) || cards.find(c => c?.value === 3) || cards.find(c => c?.title === CARD_MAGIC)
    }
}

/**
 * Pick the best available battle card.
 *
 * Priority: highest-value strength card first.
 * Text cards are used only as a last resort (they score 0).
 * Magic is only selected when there are discarded cards to spend it on —
 * otherwise it's inert and wastes the slot.
 */
function pickBestCard(G: GState, repick: boolean = false): BattleCard | null {
    const isGood = Logic.isSpecifiedPlayerGood(G.aiId)
    const cards = G.players[isGood ? '1' : '0'].cards
    const hasDiscards = cards.some(c => c.discarded)
    const diff = rawStrengthDiff(G, isGood)

    const players = [G.defendingChar, G.attackingChar]
    const gandalfInPlay = isSpecifiedPlayerGood(G.aiId) && players.includes(GOOD_NAMES.CLASSICGANDALF) && !players.includes(EVIL_NAMES.WARG)
    if(gandalfInPlay){
        const card = gandalfCheat(G)
        if(card){
            return card
        }
        if(G.evilCard?.value){
            diff += G.evilCard.value
        }
    }


    const available = cards.filter(c => {
        if (c.discarded) return false
        if (c.title === 'Magic') return hasDiscards
        if(repick && G.oldGoodCard?.id === c.id) return false
        return true
    })

    if (available.length === 0) return null

    // return available.sort((a, b) => {
    //     const aVal = a.type === 'strength' ? (a.value ?? 0) : 0
    //     const bVal = b.type === 'strength' ? (b.value ?? 0) : 0
    //     return bVal - aVal
    // })[0]

    // Helper: find a card by title in the available pool
    const findTitle = (title: string) => available.find(c => c.title === title) ?? null

    // Helper: find the card whose strength value brings AI to exactly +2 (or best ≥ +2)
    // i.e. the smallest card such that diff + card.value >= 2
    const findEfficientCard = (): BattleCard | null => {
        const strengthCards = available
            .filter(c => c.type === 'strength')
            .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))  // ascending

        // Ideal: smallest card that gets us to +2 lead
        const efficient = strengthCards.find(c => diff + (c.value ?? 0) >= 4)
        if (efficient) return efficient

        // No card reaches +2 — use the largest one available (maximum effort)
        return strengthCards[strengthCards.length - 1] ?? null
    }

    // Helper: largest strength card in available pool (the default fallback)
    const largestStrengthCard = (): BattleCard | null => {
        const s = available
            .filter(c => c.type === 'strength')
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
        return s[0] ?? null
    }

    // ── GOOD card logic ───────────────────────────────────────────────────────
    if (isGood) {
        // 1. Tied AND Gandalf nearby → Elven Cloak is the smart play.
        //    Elven Cloak negates evil's power card, turning the tie into a win
        //    on raw strength alone (good's text resolves after evil's power is zeroed).
        if (diff === 0 && Logic.isGandalfNearby(G)) {
            const cloak = findTitle(CARD_ELVEN_CLOAK)
            if (cloak) return cloak

            // Elven Cloak already discarded — use Magic to replay it
            const cloakInDiscard = cards.find(c => c.title === CARD_ELVEN_CLOAK && c.discarded)
            if (cloakInDiscard) {
                const magic = findTitle(CARD_MAGIC)
                if (magic) return magic
            }
        }

        // 2. Behind by more than 3 → Noble Sacrifice (mutual destruction is better
        //    than a plain loss, especially for the sacrificial-fighter strategy).
        if (diff < -3) {
            const sacrifice = findTitle(CARD_NOBLE_SACRIFICE)
            if (sacrifice) return sacrifice
        }

        // 3. Efficient card — smallest one that puts us +2 ahead, else largest.
        return findEfficientCard() ?? findTitle(CARD_NOBLE_SACRIFICE) ?? available[0]
    }

    // ── EVIL card logic ───────────────────────────────────────────────────────

    // 1. Eye of Sauron — spend it when the evil unit is powerful enough to win
    //    on raw strength alone, so a power card would be wasted.
    //
    //    The threshold slides with the evil unit's base value:
    //      value 5 → use Eye whenever evil is already ahead (diff >= 1)
    //      value 4 → use Eye when ahead by >= 1
    //      value 3 → use Eye when ahead by >= 2
    //      value 2 → use Eye when ahead by >= 3
    //      value 1 → never (Gollum-class — needs every card available)
    //
    //    Stronger units need a smaller cushion because their raw value already
    //    carries the fight. At each threshold, evil wins by 1+ after Eye
    //    nullifies good's text card, so the power card is genuinely unnecessary.
    {
        const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
        const evilUnitId = attackerIsGood ? G.defendingChar : G.attackingChar
        const evilUnitValue = unitStrength(G, evilUnitId)

        // minDiffToUseEye: minimum raw lead at which Eye beats a power card for this unit tier
        const minDiffToUseEye =
            evilUnitValue >= 5 ? 1 :   // Balrog, boosted Variant Orcs, Treebeard-tier
                evilUnitValue >= 4 ? 1 :   // WitchKing, Saruman, CaveTroll
                    evilUnitValue >= 3 ? 2 :   // Warg, Nazgul, Shelob, Mouth, Orcs, etc.
                        evilUnitValue >= 2 ? 3 :   // low-value units still need a big cushion
                            99    // value 1 (Gollum) — never use Eye

        const eye = findTitle(CARD_EYE_OF_SAURON)
        if (eye && diff >= minDiffToUseEye) return eye
    }

    // 2. Efficient card — smallest one that puts evil +2 ahead, else largest.
    return findEfficientCard() ?? largestStrengthCard() ?? available[0]
}

/**
 * For the secondary Magic pick: the highest-value already-discarded card
 * (the one most worth "replaying" with magic).
 */
function pickBestDiscardedCard(G: GState): BattleCard | null {
    const isGood = Logic.isSpecifiedPlayerGood(G.aiId)
    const cards = G.players[isGood ? '1' : '0'].cards
    const available = cards.filter(c => c.discarded && c.title !== CARD_MAGIC)
    if (available.length === 0) return null

    if (isGood) {
        // Prefer Elven Cloak replay when tied and Gandalf is nearby
        const diff = rawStrengthDiff(G, true)
        if (diff === 0 && Logic.isGandalfNearby(G)) {
            const cloak = available.find(c => c.title === CARD_ELVEN_CLOAK)
            if (cloak) return cloak
        }
    }

    return available.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]
}

// type MoveCandidate = {
//     charId: string
//     fromTileId: string
//     toTileId: string
//     isAttack: boolean
//     priority: number
// }

/**
 * Score every possible move for a team and return them sorted best-first.
 *
 * Scoring rules:
 *   - Attacks always beat advances: +1000 bonus.
 *   - Evil advances: prefer high destination tile ID (closer to Shire).
 *   - Good advances: prefer low destination tile ID (closer to Mordor).
 *     Implemented by inverting: score = maxTileId - tile.id.
 *   - Within attacks, weakest target gets an additional tiebreaker bonus
 *     (lower opponent value → higher bonus, max assumed ≤ 10).
 */
// function buildMoveCandidates(G: GState, isGood: boolean): MoveCandidate[] {
//     const myChars = isGood ? GOOD_CHARS : EVIL_CHARS
//     const oppChars = isGood ? EVIL_CHARS : GOOD_CHARS
//     const playerId = isGood ? '1' : '0'
//
//     const allTileIds = Object.values(G.regions).map((r: Location) => r.id)
//     const maxTileId = Math.max(...allTileIds)
//
//     const candidates: MoveCandidate[] = []
//
//     Object.keys(myChars).forEach(charId => {
//         const char = G.characters[charId]
//         if (!char || char.defeated || (!isGood && char.permaReveal)) return
//
//         const fromTile = Logic.findCharTile(G, charId)
//         if (!fromTile) return
//
//         const moves = Logic.generateMoves({
//             G,
//             playerID: playerId,
//             selectedChar: Logic.getChar(G, charId),
//             selectedTile: fromTile,
//         })
//
//         moves.forEach(toTileId => {
//             const toTile = G.regions[toTileId]
//             const isAttack = toTile.currentOccupants.some(n => oppChars[n])
//
//             // Directional score: evil prefers high IDs, good prefers low IDs
//             const dirScore = isGood ? (maxTileId - toTile.id) : toTile.id
//
//             // Secondary: within attacks, prefer weaker targets (easier win)
//             let weaknessBonus = 0
//             if (isAttack) {
//                 const oppId = toTile.currentOccupants.find(n => oppChars[n])
//                 const oppChar = oppId ? G.characters[oppId] : null
//                 weaknessBonus = oppChar ? (10 - (oppChar.value ?? 5)) : 0
//             }
//
//             candidates.push({
//                 charId,
//                 fromTileId: fromTile.title,
//                 toTileId,
//                 isAttack,
//                 priority: (isAttack ? 1000 : 0) + dirScore + weaknessBonus,
//             })
//         })
//     })
//
//     // Descending priority; deterministic tiebreak on charId
//     return candidates.sort((a, b) => b.priority - a.priority || a.charId.localeCompare(b.charId))
// }



function buildGoodMoveCandidates(G: GState) {
    const candidates = []
    const endGame = frodoShouldRun(G)

    Object.keys(GOOD_CHARS).forEach(charId => {
        if (!isAlive(G, charId)) return

        const fromTile = Logic.findCharTile(G, charId)
        if (!fromTile) return

        const isFrodo = charId === GOOD_NAMES.CLASSICFRODO || charId === GOOD_NAMES.VARIANTFRODO
        const isSam = charId === GOOD_NAMES.CLASSICSAM || charId === GOOD_NAMES.VARIANTSAM

        const moves = Logic.generateMoves({
            G,
            playerID: G.aiId,
            selectedChar: Logic.getChar(G, charId),
            selectedTile: fromTile,
        })

        if (moves.length === 0) return

        moves.forEach(toTileId => {
            const toTile = G.regions[toTileId]
            const occupant = toTile.currentOccupants.find(n => EVIL_CHARS[n])
            const isAttack = Boolean(occupant)
            const isMordor = toTileId === 'MORDOR'

            let priority = 0

            if (isFrodo) {
                if (!endGame) {
                    // Pre-endgame: Frodo stays put — give all his moves a very
                    // low priority so other chars always act first
                    priority = -5000
                } else {
                    // End-game run: Frodo beelines for Mordor
                    if (isMordor) {
                        priority = 20000  // highest possible — Frodo into Mordor = win
                    } else {
                        // Score by proximity to Mordor (lowest tile ID = better)
                        priority = 10000 + (50 - toTile.id)
                    }
                }
            } else if (isSam) {
                if (!endGame) {
                    // Sam protects Frodo — he should stay near Frodo's tile
                    const frodoId = isAlive(G, GOOD_NAMES.CLASSICFRODO)
                        ? GOOD_NAMES.CLASSICFRODO
                        : GOOD_NAMES.VARIANTFRODO
                    const frodoTile = Logic.findCharTile(G, frodoId)

                    if (frodoTile && toTileId === frodoTile.title) {
                        priority = 3000  // move to Frodo's tile
                    } else if (isAttack) {
                        priority = 1000  // Sam can still fight
                    } else {
                        priority = 100
                    }
                } else {
                    // End-game: Sam follows Frodo toward Mordor
                    if (isMordor) {
                        priority = 15000
                    } else {
                        priority = 8000 + (50 - toTile.id)
                    }
                }
            } else {
                // Standard fighter:
                // - Attacks straight ahead, prioritising whoever is furthest forward
                // - Stop before Mordor (don't enter Mordor unless attacking)
                // - Never retreat — keep advancing to maximise kills
                if (isMordor && !isAttack) {
                    // Don't walk into Mordor empty — it is the enemy base
                    priority = -1000
                } else if (isAttack) {
                    // Attack: forward attacker attacks straight ahead
                    // Good moves DOWN (toward Mordor, lower tile IDs), so "forward" = low fromTile.id
                    // We want the MOST forward char to attack: lowest fromTile.id = highest priority
                    priority = 5000 + (50 - fromTile.id) + (50 - toTile.id)
                } else {
                    // Advance: move the most forward char further ahead
                    priority = 500 + (50 - fromTile.id) + (50 - toTile.id)
                }
            }

            candidates.push({ charId, fromTileId: fromTile.title, toTileId, priority })
        })
    })

    return candidates.sort((a, b) => b.priority - a.priority || a.charId.localeCompare(b.charId))
}

/**
 * Given a specific charId, find its best move and execute it.
 * Used for King Revealed (forces a specific evil char to move) and any
 * future forced-move scenarios.
 */
function executeBestMoveForChar({
        G,
        events,
        charId,
        isGood,
    }: {
    G: GState
    events: any
    charId: string
    isGood: boolean
}) {
    const tile = Logic.findCharTile(G, charId)
    if (!tile) return

    const playerId = isGood ? '1' : '0'
    const oppChars = isGood ? EVIL_CHARS : GOOD_CHARS
    const allTileIds = Object.values(G.regions).map((r: Location) => r.id)
    const maxTileId = Math.max(...allTileIds)

    const moves = Logic.generateMoves({
        G,
        playerID: playerId,
        selectedChar: Logic.getChar(G, charId),
        selectedTile: tile,
    })
    if (moves.length === 0) return

    const best = moves
        .map(toTileId => {
            const toTile = G.regions[toTileId]
            const isAttack = toTile.currentOccupants.some(n => oppChars[n])
            const dirScore = isGood ? (maxTileId - toTile.id) : toTile.id
            return {toTileId, priority: (isAttack ? 1000 : 0) + dirScore}
        })
        .sort((a, b) => b.priority - a.priority)[0]

    MOVE.chooseCharacterToMove(G, playerId, charId, tile.title)
    MOVE.chooseRegionToMove(G, events, playerId, best.toTileId)
}

/**
 * Good AI responds to the goodAction stage.
 *
 * Decision priority:
 *   WINDLORD > RETREAT > POWER-UP > CARD-FREE > SWAP (if outmatched) > FIGHT
 *
 * Retreats are always taken — a free escape is better than risking a loss.
 * SWAP is taken only when the good unit is weaker than the attacker; otherwise
 * it's better to fight directly.
 */
export function aiBattleGoodAction({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const goodActions: string[] = G.goodActions || []
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar
    const isFrodoOrSam = GOOD_RINGBEARERS.has(goodUnitId)

    // Free retreat from Gwaihir — always take it
    if (goodActions.includes('WINDLORD') && (G.attackingChar === EVIL_NAMES.CLASSICORCS || isFrodoOrSam)) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'WINDLORD')
    }

    // Free character retreat — always take it
    if (goodActions.includes('RETREAT') && G.attackingChar !== GOOD_NAMES.PIPPIN) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'RETREAT')
    }

    // Sam power-up near Frodo — free strength boost, always take it
    if (goodActions.includes('POWER-UP')) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'POWER-UP')
    }

    // Aragorn card-free — forces a raw strength fight; good for Aragorn
    if (goodActions.includes('CARD-FREE')) {
        const aragornAttack = G.attackingChar === GOOD_NAMES.VARIANTARAGORN
        const enemy = getChar(G, aragornAttack? G.defendingChar : G.attackingChar)
        const useGandalf = isGandalfNearby(G)
        if(enemy.value <= (useGandalf ? 5 : 4)){
            return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'CARD-FREE')
        }
    }

    // Swap (Frodo→Sam or Smeagol) — only if the current good unit is outmatched
    if (goodActions.includes('SWAP')) {
        const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
        const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar
        const evilUnitId = attackerIsGood ? G.defendingChar : G.attackingChar
        const goodUnit = Logic.getChar(G, goodUnitId)
        const evilUnit = Logic.getChar(G, evilUnitId)
        if (goodUnit && evilUnit && evilUnit.value > goodUnit.value) {
            return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'SWAP')
        }
    }

    return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'FIGHT')
}

/**
 * Good AI picks a retreat region.
 * Prefers the tile deepest into good territory (highest tile ID = furthest from danger).
 */
export function aiBattleGoodRetreat({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    let moves = G.validMoves || []
    if (moves.length === 0) {
        return
    }

    const best = moves
        .map(tileId => G.regions[tileId])
        .sort((a, b) => b.id - a.id)[0]

    // chooseRetreatRegion is the goodRetreat stage move name
    BATTLE.chooseGoodRetreatRegion(G, events, ctx, G.aiId, best.title)
}

export function processSmeagolSwap({G, events, ctx}: { G: GState; events: any; ctx: any }){
    // check grima swap
    let chars = G.swapOptions || []
    if(chars.length === 0 || G.defendingChar !== GOOD_NAMES.SMEAGOL){
        return
    }
    let stats = chars.map(charName => ({
        tile: Logic.findCharTile(G, charName).title,
        power: Logic.getChar(G, charName).value,
        name: Logic.getChar(G, charName).id,
    }))
    stats = stats.sort((a, b) => b.power - a.power)

    BATTLE.chooseSmeagolSwap(G, events, ctx, G.aiId, stats[0].name, stats[0].tile)
}

/**
 * Good AI always uses Gandalf's nearby +1 bonus — a free boost is never bad.
 */
export function aiBattleGandalfChoice({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    BATTLE.doGandalfOption(G, events, ctx, G.aiId, true)
}

/**
 * Good AI picks the highest-value battle card.
 */
function aiBattleGoodPickCard({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const card = pickBestCard(G)
    if (!card) return

    BATTLE.chooseCard(G, events, ctx, G.aiId, card)
    BATTLE.lockInCard(G, events, ctx, G.aiId)
}

/**
 * Good AI is forced to re-pick a card by Saruman.
 * Same strategy: highest available value.
 */
export function aiBattleGoodPickSarumanCard({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const card = pickBestCard(G, true)
    if (!card) return

    BATTLE.chooseSarumanCard(G, G.aiId, card)
    BATTLE.lockInSarumanCard(G, events, ctx, G.aiId)
}

/**
 * Good AI must choose which enemy to fight on a multi-occupant tile.
 * Targets the weakest enemy (lowest strength = easiest win).
 */
export function aiBattleGoodChooseTarget({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const battleTile = Logic.getTile(G, G.attackedTile)
    const opponents = battleTile.currentOccupants.filter(n => EVIL_CHARS[n])
    if (opponents.length === 0) {
        console.error('no one to attack')
        return
    }

    return opponents
        .map(charId => Logic.getChar(G, charId))
        .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0].id
}


// ─────────────────────────────────────────────
// BATTLE PHASE — EVIL AI
// ─────────────────────────────────────────────

/**
 * Evil AI responds to the badAction stage.
 *
 * Decision priority:
 *   CARD-FREE (Saruman) > RETREAT (only if outmatched, Gollum) > FIGHT
 */
export function aiBattleBadAction({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const badActions: string[] = G.badActions || []
    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar
    const evilUnitId = attackerIsGood ? G.defendingChar : G.attackingChar
    const goodUnit = Logic.getChar(G, goodUnitId)
    const evilUnit = Logic.getChar(G, evilUnitId)

    // Classic Saruman: skip cards entirely — always beneficial
    if (badActions.includes('CARD-FREE') && goodUnit.value <= 4) {
        return BATTLE.chooseEvilAction(G, events, ctx, G.aiId, 'CARD-FREE')
    }

    // Gollum retreat — only if the good unit is at least as strong
    if (badActions.includes('RETREAT')) {
        if (goodUnit && evilUnit && ((goodUnit.value - evilUnit.value) > 1) ) {
            return BATTLE.chooseEvilAction(G, events, ctx, G.aiId, 'RETREAT')
        }
    }

    return BATTLE.chooseEvilAction(G, events, ctx, G.aiId, 'FIGHT')
}

/**
 * Evil AI picks a retreat region.
 * Retreats toward Mordor (lowest tile ID) to preserve board position.
 */
export function aiBattleBadRetreat({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const moves = G.validMoves || []
    if (moves.length === 0) return

    const best = moves
        .map(tileId => G.regions[tileId])
        .sort((a, b) => a.id - b.id)[0]

    BATTLE.chooseBadRetreatRegion(G, events, ctx, G.aiId, best.title)
}

/**
 * Evil AI picks the highest-value battle card.
 */
function aiBattleEvilPickCard({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const card = pickBestCard(G)
    if (!card) return

    BATTLE.chooseCard(G, events, ctx, G.aiId, card)
    BATTLE.lockInCard(G, events, ctx, G.aiId)
}

/**
 * Evil AI picks the best discarded card to replay via Magic.
 */
export function aiBattlePickMagicCard({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const card = pickBestDiscardedCard(G)
    if (!card) return

    BATTLE.chooseMagicCard(G, events, ctx, G.aiId, card)
    BATTLE.lockInMagicCard(G, events, ctx, G.aiId)
}

/**
 * Evil AI (Saruman) decides whether to force good to reselect their card.
 * Rejects if the good card is a high-value strength card (≥ 3) or a
 * non-Magic text card — anything that meaningfully threatens the outcome.
 */
export function aiBattleEvilSarumanChoice({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const goodCard = G.goodCard
    if (!goodCard) {
        return BATTLE.goodReselect(G, events, ctx, G.aiId, false)
    }

    const isHighValue = goodCard.type === 'strength' && (goodCard.value ?? 0) >= 3
    const isDangerousText = goodCard.type === 'text' && goodCard.title !== 'Magic'

    BATTLE.goodReselect(G, events, ctx, G.aiId, isHighValue || isDangerousText)
}

/**
 * Evil AI resolves the Mouth of Sauron stage.
 * Switches to the Mouth's +4 only when the current card isn't already winning
 * AND the +4 would flip the result to a win.
 */
export function aiBattleEvilMouthChoice({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const plus4 = G.players['0'].cards?.find?.(c => c.id === 3)
    if (!plus4) {
        return BATTLE.doMouthChoice(G, events, ctx, G.aiId, false)
    }

    const attackerIsGood = Boolean(GOOD_CHARS[G.attackingChar])
    const goodUnitId = attackerIsGood ? G.attackingChar : G.defendingChar
    const evilUnitId = attackerIsGood ? G.defendingChar : G.attackingChar
    const goodUnit = Logic.getChar(G, goodUnitId)
    const evilUnit = Logic.getChar(G, evilUnitId)

    const goodCardValue = G.goodCard?.type === 'strength' ? (G.goodCard.value ?? 0) : 0
    const goodTotal = (goodUnit?.value ?? 0) + goodCardValue

    const currentEvilCardValue = G.evilCard?.type === 'strength' ? (G.evilCard.value ?? 0) : 0
    const evilCurrentTotal = (evilUnit?.value ?? 0) + currentEvilCardValue
    const evilWithMouth = (evilUnit?.value ?? 0) + (plus4.value ?? 0)

    const alreadyWinning = evilCurrentTotal > goodTotal
    const mouthWins = evilWithMouth >= goodTotal

    BATTLE.doMouthChoice(G, events, ctx, G.aiId, !alreadyWinning && mouthWins)
}

/**
 * Evil AI (Wormtongue) picks a Grima retreat region.
 * Retreats toward Mordor (lowest tile ID).
 */
export function aiBattleEvilGrimaRetreat({ G, events, ctx }: { G: GState; events: any; ctx: any }) {
    const moves = G.validMoves || []
    if (moves.length === 0) return

    const best = moves
        .map(tileId => G.regions[tileId])
        .sort((a, b) => a.id - b.id)[0]

    BATTLE.chooseGrimaRetreatRegion(G, events, ctx, G.aiId, best.title)
}

/**
 * Evil AI must choose which enemy to fight on a multi-occupant tile.
 * Targets the weakest good character (lowest strength = easiest win).
 */
export function aiBattleEvilChooseTarget({ G }: { G: GState }): string {
    const battleTile = Logic.getTile(G, G.attackedTile)
    const opponents = battleTile.currentOccupants.filter(n => GOOD_CHARS[n])
    if (opponents.length === 0) {
        console.error('no one to fight')
        return
    }

    // Prefer ring-bearer targets first
    const ringbearerTarget = opponents
        .filter(id => ringbearerHuntScore(G, id) > 0)
        .sort((a, b) => ringbearerHuntScore(G, b) - ringbearerHuntScore(G, a))[0]

    return ringbearerTarget ?? opponents
        .map(charId => Logic.getChar(G, charId))
        .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0].id

}
