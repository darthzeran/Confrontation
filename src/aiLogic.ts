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

export function aiSetup(G: GState) {
    const aiGood = G.aiId === '1'
    const isHardMode = Math.floor(Math.random() * 10) === 0
    const mode = Logic.getMode(G.matchID)
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
            G.players['1'].specialCards = [{
                id: 2,
                title: 'Gandalf the White',
                description: 'Revive Defeated Gandalf',
                full: 'This card can be played after the Sauron player has finished his turn. The Fellowship player must skip his entire turn to use this card. When played, the Fellowship player may bring a defeated Gandalf back into play, by placing the Gandalf character in Fangorn. The Fellowship player may not play this card if Fangorn is occupied by any Sauron character, or if two other Fellowship characters are in Fangorn. This card may not be used unless Gandalf has already been defeated',
            }, {
                id: 4,
                title: 'Gwaihir the Windlord',
                description: 'Allow your character to insantly retreat',
                full: 'This card can be played at the beginning of a battle, before character texts are resolved. The Fellowship character gains the ability “Immediately retreat sideways or backwards” (replacing the character’s normal text) for the duration of that battle only. The Fellowship player may not play Gwaihir the Windlord in a battle against the Warg. ',
            }
            ]
        } else {
            G.players['0'].specialCards = [{
                id: 6,
                title: 'Recall to Mordor',
                description: 'Return an Evil character to Mordor',
                full: 'This card can be played after the Fellowship player has finished his turn. The Sauron player must skip his entire turn to use this card. When played, the Sauron player may take one of the Sauron characters anywhere on the board and place it back in Mordor. The Sauron player may not do this if Mordor is occupied by any Fellowship characters, or four Sauron characters.',
            }, {
                id: 8,
                title: 'Crebain of Dunland',
                description: 'Permanently reveal a good character',
                full: 'This card can be played after the Fellowship player has finished his turn. The Sauron player must skip his entire turn to use this card. When played, the Sauron player may choose and reveal a Fellowship character. That character must remain revealed for the remainder of the game. If Gandalf is chosen, then later defeated, but returned to play with the “Gandalf the White” Special Card, the new Gandalf is no longer affected by the “Crebain of Dunland”.',
            }
            ]
        }

        events.setActivePlayers({
            all: 'specialCards',
        })
    }
}


export function evilAIMove({G, events, ctx}) {
    if (G.kingRevealed) {
        return executeBestMoveForChar({ G, events, charId: G.kingRevealed, isGood: false })
    }

    const candidates = buildMoveCandidates(G, false)
    if (candidates.length === 0) return

    const best = candidates[0]
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
    const allCandidates = buildMoveCandidates(G, true)
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

    const available = cards.filter(c => {
        if (c.discarded) return false
        if (c.title === 'Magic') return hasDiscards
        if(repick && G.oldGoodCard?.id === c.id) return false
        return true
    })

    if (available.length === 0) return null

    return available.sort((a, b) => {
        const aVal = a.type === 'strength' ? (a.value ?? 0) : 0
        const bVal = b.type === 'strength' ? (b.value ?? 0) : 0
        return bVal - aVal
    })[0]
}

/**
 * For the secondary Magic pick: the highest-value already-discarded card
 * (the one most worth "replaying" with magic).
 */
function pickBestDiscardedCard(G: GState, isGood: boolean): BattleCard | null {
    const cards = G.players[isGood ? '1' : '0'].cards
    const available = cards.filter(c => c.discarded && c.title !== 'Magic')
    if (available.length === 0) return null
    return available.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]
}

type MoveCandidate = {
    charId: string
    fromTileId: string
    toTileId: string
    isAttack: boolean
    priority: number
}

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
function buildMoveCandidates(G: GState, isGood: boolean): MoveCandidate[] {
    const myChars = isGood ? GOOD_CHARS : EVIL_CHARS
    const oppChars = isGood ? EVIL_CHARS : GOOD_CHARS
    const playerId = isGood ? '1' : '0'

    const allTileIds = Object.values(G.regions).map((r: Location) => r.id)
    const maxTileId = Math.max(...allTileIds)

    const candidates: MoveCandidate[] = []

    Object.keys(myChars).forEach(charId => {
        const char = G.characters[charId]
        if (!char || char.defeated || (!isGood && char.permaReveal)) return

        const fromTile = Logic.findCharTile(G, charId)
        if (!fromTile) return

        const moves = Logic.generateMoves({
            G,
            playerID: playerId,
            selectedChar: Logic.getChar(G, charId),
            selectedTile: fromTile,
        })

        moves.forEach(toTileId => {
            const toTile = G.regions[toTileId]
            const isAttack = toTile.currentOccupants.some(n => oppChars[n])

            // Directional score: evil prefers high IDs, good prefers low IDs
            const dirScore = isGood ? (maxTileId - toTile.id) : toTile.id

            // Secondary: within attacks, prefer weaker targets (easier win)
            let weaknessBonus = 0
            if (isAttack) {
                const oppId = toTile.currentOccupants.find(n => oppChars[n])
                const oppChar = oppId ? G.characters[oppId] : null
                weaknessBonus = oppChar ? (10 - (oppChar.value ?? 5)) : 0
            }

            candidates.push({
                charId,
                fromTileId: fromTile.title,
                toTileId,
                isAttack,
                priority: (isAttack ? 1000 : 0) + dirScore + weaknessBonus,
            })
        })
    })

    // Descending priority; deterministic tiebreak on charId
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

    // Free retreat from Gwaihir — always take it
    if (goodActions.includes('WINDLORD')) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'WINDLORD')
    }

    // Free character retreat — always take it
    if (goodActions.includes('RETREAT')) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'RETREAT')
    }

    // Sam power-up near Frodo — free strength boost, always take it
    if (goodActions.includes('POWER-UP')) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'POWER-UP')
    }

    // Aragorn card-free — forces a raw strength fight; good for Aragorn
    if (goodActions.includes('CARD-FREE')) {
        return BATTLE.chooseGoodAction(G, events, ctx, G.aiId, 'CARD-FREE')
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
        if (goodUnit && evilUnit && goodUnit.value >= evilUnit.value) {
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
    const card = pickBestDiscardedCard(G, false)
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
        return BATTLE.mouthChoice(G, events, ctx, G.aiId, false)
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
    const mouthWins = evilWithMouth > goodTotal

    BATTLE.mouthChoice(G, events, ctx, G.aiId, !alreadyWinning && mouthWins)
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

    return opponents
        .map(charId => Logic.getChar(G, charId))
        .sort((a, b) => (a.value ?? 0) - (b.value ?? 0))[0].id
}
